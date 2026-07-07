import { createAdminClient } from "@/lib/supabase/admin";
import { IntakeForm } from "@/components/IntakeForm";

export const dynamic = "force-dynamic";

// M1 — Page publique de dépôt de candidature.
// L'agence est passée en query (?agence=<uuid>) ; à défaut, la première
// agence du système (mode pilote mono-cabinet).
export default async function PostulerPage({
  searchParams,
}: {
  searchParams: Promise<{ agence?: string }>;
}) {
  const { agence } = await searchParams;
  const admin = createAdminClient();

  let agencyQuery = admin.from("agencies").select("id, name, branding");
  if (agence) {
    agencyQuery = agencyQuery.eq("id", agence);
  }
  const { data: agencies } = await agencyQuery.limit(1);
  const agency = agencies?.[0];

  if (!agency) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p className="text-stone-600">
          Ce lien de candidature n&apos;est pas valide. Contactez le cabinet de
          recrutement.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-semibold text-teal-800">{agency.name}</h1>
      <p className="mt-1 text-stone-600">
        Déposez votre candidature en quelques minutes. Aucun paiement ne vous
        sera jamais demandé pour postuler.
      </p>
      <div className="mt-6">
        <IntakeForm agencyId={agency.id} agencyName={agency.name} />
      </div>
    </main>
  );
}
