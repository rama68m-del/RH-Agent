import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import type { Mandate, Match, MatchStage } from "@/types/database";

export const dynamic = "force-dynamic";

const PIPELINE_STAGES: { stage: MatchStage; label: string }[] = [
  { stage: "propose", label: "Proposés (IA)" },
  { stage: "valide", label: "Validés" },
  { stage: "presente", label: "Présentés" },
  { stage: "entretien", label: "En entretien" },
  { stage: "retenu", label: "Retenus" },
];

// M6 — Tableau de bord : mandats ouverts, pipeline par étape, vivier.
export default async function DashboardPage() {
  const session = await getSessionContext();
  const supabase = await createClient();

  const [{ data: mandatesData }, { count: candidateCount }, { data: matchesData }] =
    await Promise.all([
      supabase
        .from("mandates")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("candidates")
        .select("id", { count: "exact", head: true })
        .neq("status", "a_purger"),
      supabase.from("matches").select("*"),
    ]);

  const mandates = (mandatesData ?? []) as Mandate[];
  const matches = (matchesData ?? []) as Match[];
  const openMandates = mandates.filter((m) => m.status === "ouvert");

  const matchesByMandate = new Map<string, Match[]>();
  for (const m of matches) {
    const list = matchesByMandate.get(m.mandate_id) ?? [];
    list.push(m);
    matchesByMandate.set(m.mandate_id, list);
  }

  const stageCounts = PIPELINE_STAGES.map(({ stage, label }) => ({
    stage,
    label,
    count: matches.filter((m) => m.stage === stage).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">
          Bonjour{session?.profile.full_name ? ` ${session.profile.full_name}` : ""} 👋
        </h1>
        <p className="text-sm text-stone-500">
          Vue d&apos;ensemble de vos mandats et de votre vivier.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-2xl font-semibold text-teal-800">
            {openMandates.length}
          </p>
          <p className="text-sm text-stone-500">Mandats ouverts</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-2xl font-semibold text-teal-800">
            {candidateCount ?? 0}
          </p>
          <p className="text-sm text-stone-500">Candidats au vivier</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-2xl font-semibold text-teal-800">
            {matches.filter((m) => m.recruiter_validated).length}
          </p>
          <p className="text-sm text-stone-500">Candidats validés</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-2xl font-semibold text-teal-800">
            {matches.filter((m) => m.stage === "retenu").length}
          </p>
          <p className="text-sm text-stone-500">Placements (retenus)</p>
        </div>
      </section>

      <section>
        <h2 className="font-medium">Pipeline global</h2>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {stageCounts.map(({ stage, label, count }) => (
            <div
              key={stage}
              className="rounded-xl border border-stone-200 bg-white p-3 text-center"
            >
              <p className="text-lg font-semibold">{count}</p>
              <p className="text-xs text-stone-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Mandats ouverts</h2>
          <Link href="/mandats" className="text-sm text-teal-700 hover:underline">
            Tous les mandats →
          </Link>
        </div>
        <ul className="mt-2 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {openMandates.map((m) => {
            const mm = matchesByMandate.get(m.id) ?? [];
            const validated = mm.filter((x) => x.recruiter_validated).length;
            return (
              <li key={m.id}>
                <Link
                  href={`/mandats/${m.id}`}
                  className="flex flex-wrap items-center gap-2 px-4 py-3 hover:bg-stone-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{m.title}</p>
                    <p className="text-sm text-stone-500">{m.client_name}</p>
                  </div>
                  <span className="text-xs text-stone-500">
                    {mm.length} proposé{mm.length > 1 ? "s" : ""} • {validated}{" "}
                    validé{validated > 1 ? "s" : ""}
                  </span>
                  {mm.length === 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      matching à lancer
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
          {openMandates.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-stone-500">
              Aucun mandat ouvert.{" "}
              <Link href="/mandats" className="text-teal-700 hover:underline">
                Créer un mandat
              </Link>
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
