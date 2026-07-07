"use client";

import { useState } from "react";

interface IntakeFormProps {
  agencyId: string;
  agencyName: string;
}

export function IntakeForm({ agencyId, agencyName }: IntakeFormProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  const consentText = `J'autorise ${agencyName} à collecter et traiter mes données personnelles et mon CV dans le but de me proposer des opportunités d'emploi, conformément à la loi n°2013-015 du Mali (APDP). Mes données pourront être hébergées hors du Mali chez des prestataires techniques. Elles seront conservées 24 mois, et je peux à tout moment demander leur consultation, leur rectification ou leur suppression auprès du cabinet.`;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus("sending");

    const form = new FormData(e.currentTarget);
    form.set("agency_id", agencyId);
    form.set("consent_text", consentText);

    try {
      const res = await fetch("/api/intake", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Une erreur est survenue. Réessayez.");
        setStatus("idle");
        return;
      }
      setDuplicateWarning(Boolean(json.duplicateWarning));
      setStatus("done");
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau et réessayez.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-6">
        <h2 className="font-semibold text-teal-800">
          Candidature bien reçue ✓
        </h2>
        <p className="mt-2 text-sm text-stone-700">
          Merci ! Votre CV a été transmis au cabinet. Vous serez contacté(e) si
          votre profil correspond à un poste.
        </p>
        {duplicateWarning && (
          <p className="mt-2 text-sm text-stone-500">
            Remarque : une candidature existait déjà avec ce numéro. Le cabinet
            utilisera la version la plus récente de votre dossier.
          </p>
        )}
        <p className="mt-2 text-sm font-medium text-teal-800">
          Rappel : postuler est gratuit. Ne payez jamais personne pour un
          emploi.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium">
          Nom complet *
        </label>
        <input
          id="full_name"
          name="full_name"
          required
          minLength={2}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium">
          Téléphone (WhatsApp de préférence) *
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          minLength={6}
          placeholder="+223 70 00 00 00"
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email (optionnel)
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="location" className="block text-sm font-medium">
          Ville de résidence (optionnel)
        </label>
        <input
          id="location"
          name="location"
          placeholder="Bamako"
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="cv" className="block text-sm font-medium">
          Votre CV (PDF ou photo, 10 Mo max) *
        </label>
        <input
          id="cv"
          name="cv"
          type="file"
          required
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="mt-1 w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:text-white"
        />
      </div>

      <div className="rounded-md border border-stone-200 bg-stone-100 p-3">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="consent"
            value="true"
            required
            className="mt-0.5"
          />
          <span>{consentText}</span>
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-md bg-teal-700 px-4 py-3 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
      >
        {status === "sending" ? "Envoi en cours…" : "Envoyer ma candidature"}
      </button>
      <p className="text-center text-xs text-stone-500">
        Postuler est 100 % gratuit. Aucun frais ne vous sera jamais demandé.
      </p>
    </form>
  );
}
