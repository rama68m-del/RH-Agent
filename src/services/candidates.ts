import "server-only";
import { randomUUID } from "crypto";
import { z } from "zod";
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

// M1 — Crée un candidat depuis le formulaire public d'intake.
// `supabase` est le client anonyme côté serveur : les politiques RLS
// n'autorisent que l'insertion (consentement APDP obligatoire), jamais
// la lecture du vivier. Aucune clé service_role nécessaire.
export async function createCandidateFromIntake(
  supabase: SupabaseClient,
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

  // Vérifie que l'agence existe (le formulaire est public)
  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("id", input.agency_id)
    .maybeSingle();
  if (!agency) throw new Error("Agence inconnue.");

  // Déduplication via fonction dédiée (l'anon ne peut pas lire le vivier)
  const { data: phoneExists } = await supabase.rpc("intake_phone_exists", {
    p_agency_id: input.agency_id,
    p_phone: input.phone,
  });
  const duplicateWarning = phoneExists === true;

  const now = new Date();
  const retention = new Date(now);
  retention.setMonth(retention.getMonth() + RETENTION_MONTHS);

  // Chemin du CV connu avant insertion : {agency_id}/{uuid}.{ext}
  const ext =
    input.file.type === "application/pdf"
      ? "pdf"
      : input.file.type.split("/")[1];
  const path = `${input.agency_id}/${randomUUID()}.${ext}`;

  // 1. Ligne candidate — le consentement est enregistré AVANT le stockage du CV
  const { data: candidate, error: insertError } = await supabase
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
      cv_file_url: path,
    })
    .select("id")
    .single();
  if (insertError || !candidate) {
    throw new Error("Enregistrement impossible. Réessayez dans un instant.");
  }

  // 2. Dépôt du CV en Storage privé
  const { error: uploadError } = await supabase.storage
    .from("cvs")
    .upload(path, input.file.bytes, { contentType: input.file.type });
  if (uploadError) {
    throw new Error(
      "Votre dossier est enregistré mais le CV n'a pas pu être téléversé. Renvoyez le formulaire avec votre CV."
    );
  }

  await logAudit(
    supabase,
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

  // Repêchage par mots-clés si les filtres structurés n'ont rien donné
  if (results.length === 0 && filters.keywords && filters.keywords.length > 0) {
    const kw = filters.keywords.map((k) => k.toLowerCase());
    const { data: all } = await supabase
      .from("candidates")
      .select("*")
      .neq("status", "archive")
      .neq("status", "a_purger")
      .limit(500);
    results = ((all ?? []) as Candidate[]).filter((c) =>
      kw.some(
        (k) =>
          c.full_name.toLowerCase().includes(k) ||
          c.skills.some((s) => s.toLowerCase().includes(k)) ||
          (c.location ?? "").toLowerCase().includes(k)
      )
    );
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
