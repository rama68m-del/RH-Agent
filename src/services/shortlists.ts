import "server-only";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/services/audit";
import {
  ShortlistDocument,
  type ShortlistEntry,
} from "@/services/pdf/ShortlistDocument";
import type { Agency, Candidate, Mandate, Match } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface GenerateShortlistInput {
  supabase: SupabaseClient; // client du recruteur (RLS appliquée)
  agency: Agency;
  mandateId: string;
  language: "fr" | "en";
  actorEmail: string;
}

export interface GenerateShortlistResult {
  shortlistId: string;
  signedUrl: string;
}

// M5 — Génère le shortlist PDF brandé à partir des matches VALIDÉS par
// le recruteur (jamais des propositions IA brutes).
export async function generateShortlist({
  supabase,
  agency,
  mandateId,
  language,
  actorEmail,
}: GenerateShortlistInput): Promise<GenerateShortlistResult> {
  const { data: mandate } = await supabase
    .from("mandates")
    .select("*")
    .eq("id", mandateId)
    .single();
  if (!mandate) throw new Error("Mandat introuvable.");

  // Validation humaine obligatoire : seuls les matches validés partent au client
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("mandate_id", mandateId)
    .eq("recruiter_validated", true)
    .order("score", { ascending: false });
  if (!matches || matches.length === 0) {
    throw new Error(
      "Aucun candidat validé pour ce mandat. Validez d'abord des candidats avant de générer la shortlist."
    );
  }

  const candidateIds = matches.map((m) => m.candidate_id);
  const { data: candidates } = await supabase
    .from("candidates")
    .select("*")
    .in("id", candidateIds);
  const byId = new Map((candidates ?? []).map((c) => [c.id, c as Candidate]));

  const entries: ShortlistEntry[] = (matches as Match[])
    .filter((m) => byId.has(m.candidate_id))
    .map((m) => ({ match: m, candidate: byId.get(m.candidate_id)! }));

  const pdfBuffer = await renderToBuffer(
    React.createElement(ShortlistDocument, {
      agency,
      mandate: mandate as Mandate,
      entries,
      language,
    })
  );

  // Enregistre la shortlist puis dépose le PDF en Storage
  const { data: shortlist, error: insertError } = await supabase
    .from("shortlists")
    .insert({
      mandate_id: mandateId,
      candidate_ids: candidateIds,
      language,
    })
    .select("id")
    .single();
  if (insertError || !shortlist) {
    throw new Error("Enregistrement de la shortlist impossible.");
  }

  const admin = createAdminClient();
  const path = `${agency.id}/${shortlist.id}.pdf`;
  const { error: uploadError } = await admin.storage
    .from("shortlists")
    .upload(path, pdfBuffer, { contentType: "application/pdf", upsert: true });
  if (uploadError) {
    throw new Error("Le dépôt du PDF a échoué. Réessayez.");
  }

  await supabase
    .from("shortlists")
    .update({ pdf_url: path })
    .eq("id", shortlist.id);

  // URL signée courte durée pour le téléchargement immédiat
  const { data: signed } = await admin.storage
    .from("shortlists")
    .createSignedUrl(path, 60 * 60);
  if (!signed) throw new Error("Génération du lien de téléchargement impossible.");

  for (const id of candidateIds) {
    await logAudit(
      id,
      actorEmail,
      `export shortlist PDF (${language.toUpperCase()}) pour le mandat "${(mandate as Mandate).title}"`
    );
  }

  return { shortlistId: shortlist.id, signedUrl: signed.signedUrl };
}
