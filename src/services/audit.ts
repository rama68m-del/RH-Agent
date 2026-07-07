import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Journal d'audit APDP : trace tout accès/traitement de données candidat.
// Écrit via service role pour garantir l'enregistrement même sur les
// parcours non authentifiés (intake candidat).
export async function logAudit(
  candidateId: string | null,
  actor: string,
  action: string
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_log").insert({
    candidate_id: candidateId,
    actor,
    action,
  });
  if (error) {
    // L'audit ne doit pas casser le parcours métier, mais on trace l'échec.
    console.error("[audit] échec d'écriture:", error.message);
  }
}
