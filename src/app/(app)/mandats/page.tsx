import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MandateForm } from "@/components/MandateForm";
import type { Mandate } from "@/types/database";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<Mandate["status"], string> = {
  ouvert: "Ouvert",
  shortlist_envoyee: "Shortlist envoyée",
  gagne: "Gagné",
  perdu: "Perdu",
  ferme: "Fermé",
};

// M4 — Liste des mandats + création.
export default async function MandatesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mandates")
    .select("*")
    .order("created_at", { ascending: false });
  const mandates = (data ?? []) as Mandate[];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Mandats</h1>

      <section className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="font-medium">Nouveau mandat</h2>
        <MandateForm />
      </section>

      <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        {mandates.map((m) => (
          <li key={m.id}>
            <Link
              href={`/mandats/${m.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{m.title}</p>
                <p className="text-sm text-stone-500">
                  {m.client_name} • créé le{" "}
                  {new Date(m.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">
                {STATUS_LABELS[m.status]}
              </span>
            </Link>
          </li>
        ))}
        {mandates.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-stone-500">
            Aucun mandat. Créez le premier ci-dessus.
          </li>
        )}
      </ul>
    </div>
  );
}
