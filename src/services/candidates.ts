import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/services/audit";
import type { Candidate } from "@/types/database";
import type { SearchFilters } from "@/services/ai/schemas";
import type { SupabaseClient } from "@supabase/supabase-js";

// Durée de conservation par défaut des données candidat (APDP :
// finalité déterminée, durée limitée) — 24 mois après le dépôt.
const RETENTION_MONTHS = 24;

export const IntakeSchema = z.object({
  agency_id: z.string().uuid(),
  full_name: z.string().min(2, "Nom trop court"),
  phone: z.string().min(6, "Numéro de téléphone invalide"),
  email: z.string().email("Email invalide").or(z.literal("")).optional(),
  location: z.string().optional(),
  consent: z.literal("true", {
    error: "Le consentement est obligatoire.",
  }),
  consent_text: z.string().min(10),
});

const ALLOWED_CV_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_CV_BYTES = 10 * 1024 * 1024; // 10 Mo — basse bande passante

export interface IntakeInput {
  agency_id: string;
  full_name: string;
  phone: string;
  email?: string;
  location?: string;
  consent_text: string;
  file: { bytes: ArrayBuffer; type: string; name: string };
}

export interface IntakeResult {
  candidateId: string;
  duplicateWarning: boolean;
}

// M1 — Crée un candidat depuis le formulaire public d'intake :
// consentement enregistré AVANT stockage, CV en Storage, ligne candidates.
export async function createCandidateFromIntake(
  input: IntakeInput
): Promise<IntakeResult> {
  if (!ALLOWED_CV_TYPES.has(input.file.type)) {
    throw new Error(
      "Format de CV non accepté. Envoyez un PDF ou une photo (JPG, PNG, WebP)."
    );
  }
  if (input.file.bytes.byteLength > MAX_CV_BYTES) {
    throw new Error("Fichier trop volumineux (10 Mo maximum).");
  }

  const admin = createAdminClient();

  // Vérifie que l'agence existe (le formulaire est public)
  const { data: agency } = await admin
    .from("agencies")
    .select("id")
    .eq("id", input.agency_id)
    .single();
  if (!agency) throw new Error("Agence inconnue.");

  // Déduplication : même téléphone ou email déjà dans le vivier de l'agence
  let duplicateQuery = admin
    .from("candidates")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", input.agency_id)
    .eq("phone", input.phone);
  const { count: phoneCount } = await duplicateQuery;
  const duplicateWarning = (phoneCount ?? 0) > 0;

  const now = new Date();
  const retention = new Date(now);
  retention.setMonth(retention.getMonth() + RETENTION_MONTHS);

  // 1. Ligne candidate (consentement enregistré en premier)
  const { data: candidate, error: insertError } = await admin
    .from("candidates")
    .insert({
      agency_id: input.agency_id,
      full_name: input.full_name,
      phone: input.phone,
      email: input.email || null,
      location: input.location || null,
      source: "web",
      status: "nouveau",
      consent_at: now.toISOString(),
      consent_text: input.consent_text,
      retention_until: retention.toISOString().slice(0, 10),
    })
    .select("id")
    .single();
  if (insertError || !candidate) {
    throw new Error("Enregistrement impossible. Réessayez dans un instant.");
  }

  // 2. CV en Storage : {agency_id}/{candidate_id}.{ext}
  const ext =
    input.file.type === "application/pdf"
      ? "pdf"
      : input.file.type.split("/")[1];
  const path = `${input.agency_id}/${candidate.id}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from("cvs")
    .upload(path, input.file.bytes, {
      contentType: input.file.type,
      upsert: true,
    });
  if (uploadError) {
    // Nettoie la ligne pour ne pas garder un candidat sans CV
    await admin.from("candidates").delete().eq("id", candidate.id);
    throw new Error("Le téléversement du CV a échoué. Réessayez.");
  }

  await admin
    .from("candidates")
    .update({ cv_file_url: path })
    .eq("id", candidate.id);

  await logAudit(
    candidate.id,
    "candidat (formulaire web)",
    `dépôt de candidature avec consentement (rétention jusqu'au ${retention.toISOString().slice(0, 10)})`
  );

  return { candidateId: candidate.id, duplicateWarning };
}

// M3 — Recherche dans la CVthèque avec filtres structurés.
// `supabase` est le client du recruteur connecté : la RLS limite à son agence.
export async function searchCandidates(
  supabase: SupabaseClient,
  filters: Partial<SearchFilters>
): Promise<Candidate[]> {
  let query = supabase
    .from("candidates")
    .select("*")
    .neq("status", "archive")
    .neq("status", "a_purger")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters.skills && filters.skills.length > 0) {
    query = query.overlaps("skills", filters.skills);
  }
  if (filters.languages && filters.languages.length > 0) {
    query = query.overlaps("languages", filters.languages);
  }
  if (filters.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Recherche impossible : ${error.message}`);
  let results = (data ?? []) as Candidate[];

  // Repêchage par mots-clés sur nom/compétences si des keywords sont fournis
  if (filters.keywords && filters.keywords.length > 0) {
    const kw = filters.keywords.map((k) => k.toLowerCase());
    const matchesKw = (c: Candidate) =>
      kw.some(
        (k) =>
          c.full_name.toLowerCase().includes(k) ||
          c.skills.some((s) => s.toLowerCase().includes(k)) ||
          (c.location ?? "").toLowerCase().includes(k)
      );
    // Si les filtres structurés n'ont rien donné, retenter sur mots-clés seuls
    if (results.length === 0) {
      const { data: all } = await supabase
        .from("candidates")
        .select("*")
        .neq("status", "archive")
        .neq("status", "a_purger")
        .limit(500);
      results = ((all ?? []) as Candidate[]).filter(matchesKw);
    }
  }

  return dedupeCandidates(results);
}

// Déduplication d'affichage : même téléphone ou même email = même personne,
// on garde la fiche la plus récente.
function dedupeCandidates(candidates: Candidate[]): Candidate[] {
  const seen = new Set<string>();
  const out: Candidate[] = [];
  for (const c of candidates) {
    const keys = [c.phone, c.email].filter(Boolean) as string[];
    if (keys.some((k) => seen.has(k))) continue;
    keys.forEach((k) => seen.add(k));
    out.push(c);
  }
  return out;
}
