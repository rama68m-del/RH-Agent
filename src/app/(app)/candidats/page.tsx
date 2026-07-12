import { createClient } from "@/lib/supabase/server";
import { CandidateSearch } from "@/components/CandidateSearch";
import type { Candidate } from "@/types/database";

export const dynamic = "force-dynamic";

// M3 — CVthèque : liste du vivier + recherche (filtres et langage naturel).
export default async function CandidatesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("candidates")
    .select("*")
    .neq("status", "a_purger")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">CVthèque</h1>
        <a
          href="/postuler"
          target="_blank"
          className="text-sm text-teal-700 hover:underline"
        >
          Lien public de dépôt de candidature ↗
        </a>
      </div>
      <CandidateSearch initialCandidates={(data ?? []) as Candidate[]} />
    </div>
  );
}
