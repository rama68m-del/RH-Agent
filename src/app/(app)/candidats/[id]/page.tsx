import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { CandidateReview } from "@/components/CandidateReview";
import type { Candidate } from "@/types/database";

export const dynamic = "force-dynamic";

// M2 — Fiche candidat : consultation du CV + écran de revue/édition
// du profil structuré proposé par l'IA.
export default async function CandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSessionContext();
  const { id } = await params;

  const supabase = await createClient();
  const { data } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const candidate = data as Candidate;

  await logAudit(id, session?.email ?? "recruteur", "consultation de la fiche candidat");

  // URL signée du CV pour consultation (1 h)
  let cvUrl: string | null = null;
  if (candidate.cv_file_url) {
    const admin = createAdminClient();
    const { data: signed } = await admin.storage
      .from("cvs")
      .createSignedUrl(candidate.cv_file_url, 60 * 60);
    cvUrl = signed?.signedUrl ?? null;
  }

  return <CandidateReview candidate={candidate} cvUrl={cvUrl} />;
}
