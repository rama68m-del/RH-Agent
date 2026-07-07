import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MandateDetail } from "@/components/MandateDetail";
import type { Candidate, Mandate, Match } from "@/types/database";

export const dynamic = "force-dynamic";

// M4/M5 — Détail d'un mandat : matching IA, validation humaine,
// génération du shortlist PDF.
export default async function MandatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: mandate } = await supabase
    .from("mandates")
    .select("*")
    .eq("id", id)
    .single();
  if (!mandate) notFound();

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("mandate_id", id)
    .order("score", { ascending: false });

  const candidateIds = (matches ?? []).map((m) => m.candidate_id);
  let candidates: Candidate[] = [];
  if (candidateIds.length > 0) {
    const { data } = await supabase
      .from("candidates")
      .select("*")
      .in("id", candidateIds);
    candidates = (data ?? []) as Candidate[];
  }

  return (
    <MandateDetail
      mandate={mandate as Mandate}
      matches={(matches ?? []) as Match[]}
      candidates={candidates}
    />
  );
}
