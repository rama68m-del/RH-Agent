import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Journal d'audit APDP : trace tout accès/traitement de données candidat.
// S'appuie sur le client de l'appelant (anon pour l'intake public,
// session recruteur pour le back-office) — politiques RLS d'insertion dédiées.
// L'audit ne doit jamais casser le parcours métier : les échecs sont
// seulement tracés en console.
export async function logAudit(
  supabase: SupabaseClient,
  candidateId: string | null,
  actor: string,
  action: string
): Promise<void> {
  try {
    const { error } = await supabase.from("audit_log").insert({
      candidate_id: candidateId,
      actor,
      action,
    });
    if (error) {
      console.error("[audit] échec d'écriture:", error.message);
    }
  } catch (err) {
    console.error("[audit] échec d'écriture:", err);
  }
}
