import "server-only";
import { matchCandidates } from "@/services/ai/matching";
import { logAudit } from "@/services/audit";
import type { Candidate, Mandate, Match } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

// M4 — Lance le matching Claude pour un mandat et enregistre les
// propositions. Aucune n'est validée : la validation humaine est un
// clic explicite du recruteur (PATCH /api/matches/[id]).
export async function runMatchingForMandate(
  supabase: SupabaseClient,
  mandateId: string,
  actorEmail: string
): Promise<Match[]> {
  const { data: mandate } = await supabase
    .from("mandates")
    .select("*")
    .eq("id", mandateId)
    .single();
  if (!mandate) throw new Error("Mandat introuvable.");

  const { data: candidates } = await supabase
    .from("candidates")
    .select("*")
    .in("status", ["nouveau", "a_revoir", "valide"])
    .limit(60);
  if (!candidates || candidates.length === 0) {
    throw new Error(
      "Le vivier est vide : ajoutez des candidats avant de lancer le matching."
    );
  }

  const result = await matchCandidates(
    mandate as Mandate,
    candidates as Candidate[]
  );

  // Upsert des propositions (re-lancer le matching rafraîchit scores et
  // justifications, sans toucher aux validations déjà faites).
  const rows = result.resultats.map((r) => ({
    mandate_id: mandateId,
    candidate_id: r.candidate_id,
    score: r.score,
    justification: [
      r.justification,
      r.points_forts.length
        ? `Points forts : ${r.points_forts.join(" ; ")}`
        : null,
      r.points_de_vigilance.length
        ? `Points de vigilance : ${r.points_de_vigilance.join(" ; ")}`
        : null,
    ]
      .filter(Boolean)
      .join("\n\n"),
  }));

  const { error } = await supabase
    .from("matches")
    .upsert(rows, { onConflict: "mandate_id,candidate_id" });
  if (error) throw new Error(`Enregistrement du matching impossible : ${error.message}`);

  for (const r of result.resultats) {
    await logAudit(
      r.candidate_id,
      actorEmail,
      `matching IA pour le mandat "${(mandate as Mandate).title}" (score ${r.score})`
    );
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("mandate_id", mandateId)
    .order("score", { ascending: false });
  return (matches ?? []) as Match[];
}
