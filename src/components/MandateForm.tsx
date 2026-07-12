"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MandateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [competences, setCompetences] = useState("");
  const [langues, setLangues] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [expMin, setExpMin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/mandates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          client_name: clientName,
          description,
          requirements: {
            competences: competences
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            langues: langues
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            localisation: localisation || null,
            experience_min_annees: expMin ? parseInt(expMin, 10) : null,
            autres: null,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Création impossible.");
        return;
      }
      router.push(`/mandats/${json.mandateId}`);
      router.refresh();
    } catch {
      setError("Connexion impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="mt-3 grid gap-3 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-medium">Intitulé du poste *</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Comptable senior"
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Client *</label>
        <input
          required
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="ONG Santé Mali"
          className={inputCls}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium">
          Description du poste (langage libre)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Décrivez le poste, les missions, le contexte…"
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">
          Compétences requises (virgules)
        </label>
        <input
          value={competences}
          onChange={(e) => setCompetences(e.target.value)}
          placeholder="comptabilité OHADA, Sage, reporting bailleurs"
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Langues (virgules)</label>
        <input
          value={langues}
          onChange={(e) => setLangues(e.target.value)}
          placeholder="français, anglais"
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Localisation</label>
        <input
          value={localisation}
          onChange={(e) => setLocalisation(e.target.value)}
          placeholder="Bamako"
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">
          Expérience minimale (années)
        </label>
        <input
          type="number"
          min={0}
          value={expMin}
          onChange={(e) => setExpMin(e.target.value)}
          className={inputCls}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 sm:col-span-2">{error}</p>
      )}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {busy ? "Création…" : "Créer le mandat"}
        </button>
      </div>
    </form>
  );
}
