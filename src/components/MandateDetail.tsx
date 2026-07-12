"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Candidate, Mandate, Match, MatchStage } from "@/types/database";

interface MandateDetailProps {
  mandate: Mandate;
  matches: Match[];
  candidates: Candidate[];
}

const STAGE_LABELS: Record<MatchStage, string> = {
  propose: "Proposé (IA)",
  valide: "Validé",
  presente: "Présenté au client",
  entretien: "En entretien",
  retenu: "Retenu",
  ecarte: "Écarté",
};

export function MandateDetail({
  mandate,
  matches,
  candidates,
}: MandateDetailProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pdfLang, setPdfLang] = useState<"fr" | "en">("fr");

  const candidateById = new Map(candidates.map((c) => [c.id, c]));
  const validatedCount = matches.filter((m) => m.recruiter_validated).length;

  async function runMatching() {
    setBusy("match");
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/mandates/${mandate.id}/match`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Le matching a échoué.");
        return;
      }
      setInfo(
        "Matching terminé. Relisez chaque justification et validez uniquement les candidats à présenter au client."
      );
      router.refresh();
    } catch {
      setError("Connexion impossible. Réessayez.");
    } finally {
      setBusy(null);
    }
  }

  async function updateMatch(
    matchId: string,
    patch: { recruiter_validated?: boolean; stage?: MatchStage }
  ) {
    setBusy(matchId);
    setError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Mise à jour impossible.");
        return;
      }
      router.refresh();
    } catch {
      setError("Connexion impossible. Réessayez.");
    } finally {
      setBusy(null);
    }
  }

  async function generatePdf() {
    setBusy("pdf");
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/mandates/${mandate.id}/shortlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: pdfLang }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "La génération a échoué.");
        return;
      }
      window.open(json.signedUrl, "_blank");
      setInfo("Shortlist PDF générée et ouverte dans un nouvel onglet.");
      router.refresh();
    } catch {
      setError("Connexion impossible. Réessayez.");
    } finally {
      setBusy(null);
    }
  }

  const req = mandate.requirements;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{mandate.title}</h1>
        <p className="text-sm text-stone-500">
          Client : {mandate.client_name} • Statut : {mandate.status} • créé le{" "}
          {new Date(mandate.created_at).toLocaleDateString("fr-FR")}
        </p>
        {mandate.description && (
          <p className="mt-2 text-sm text-stone-700">{mandate.description}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {(req.competences ?? []).map((c) => (
            <span key={c} className="rounded-full bg-teal-50 px-2 py-0.5 text-teal-800">
              {c}
            </span>
          ))}
          {(req.langues ?? []).map((l) => (
            <span key={l} className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-800">
              {l}
            </span>
          ))}
          {req.localisation && (
            <span className="rounded-full bg-stone-100 px-2 py-0.5">
              {req.localisation}
            </span>
          )}
          {req.experience_min_annees != null && (
            <span className="rounded-full bg-stone-100 px-2 py-0.5">
              ≥ {req.experience_min_annees} ans d&apos;expérience
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-4">
        <button
          onClick={runMatching}
          disabled={busy !== null}
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {busy === "match"
            ? "Matching en cours (peut prendre 1-2 min)…"
            : matches.length > 0
              ? "Relancer le matching IA"
              : "Lancer le matching IA"}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <select
            value={pdfLang}
            onChange={(e) => setPdfLang(e.target.value as "fr" | "en")}
            className="rounded-md border border-stone-300 px-2 py-2 text-sm"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
          <button
            onClick={generatePdf}
            disabled={busy !== null || validatedCount === 0}
            title={
              validatedCount === 0
                ? "Validez d'abord au moins un candidat"
                : undefined
            }
            className="rounded-md border border-teal-700 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50 disabled:opacity-50"
          >
            {busy === "pdf"
              ? "Génération…"
              : `Générer la shortlist PDF (${validatedCount} validé${validatedCount > 1 ? "s" : ""})`}
          </button>
        </div>
      </div>

      {info && <p className="text-sm text-teal-700">{info}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="space-y-3">
        <h2 className="font-medium">
          Candidats proposés{" "}
          <span className="text-sm font-normal text-stone-500">
            — rien n&apos;est présenté au client sans votre validation
            explicite.
          </span>
        </h2>
        {matches.map((m) => {
          const c = candidateById.get(m.candidate_id);
          if (!c) return null;
          return (
            <div
              key={m.id}
              className={`rounded-xl border bg-white p-4 ${
                m.recruiter_validated
                  ? "border-teal-300 ring-1 ring-teal-100"
                  : "border-stone-200"
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/candidats/${c.id}`}
                  className="font-medium text-teal-800 hover:underline"
                >
                  {c.full_name}
                </Link>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">
                  Score : {m.score}/100
                </span>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">
                  {STAGE_LABELS[m.stage]}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <select
                    value={m.stage}
                    onChange={(e) =>
                      updateMatch(m.id, { stage: e.target.value as MatchStage })
                    }
                    disabled={busy !== null}
                    className="rounded-md border border-stone-300 px-2 py-1 text-xs"
                  >
                    {Object.entries(STAGE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() =>
                      updateMatch(m.id, {
                        recruiter_validated: !m.recruiter_validated,
                      })
                    }
                    disabled={busy !== null}
                    className={`rounded-md px-3 py-1 text-sm font-medium disabled:opacity-50 ${
                      m.recruiter_validated
                        ? "border border-stone-300 text-stone-600 hover:bg-stone-100"
                        : "bg-teal-700 text-white hover:bg-teal-800"
                    }`}
                  >
                    {m.recruiter_validated ? "Retirer la validation" : "Valider"}
                  </button>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-stone-700">
                {m.justification}
              </p>
            </div>
          );
        })}
        {matches.length === 0 && (
          <p className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">
            Aucune proposition pour l&apos;instant. Lancez le matching IA pour
            classer le vivier sur ce poste.
          </p>
        )}
      </section>
    </div>
  );
}
