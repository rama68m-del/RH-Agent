"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Candidate,
  EducationItem,
  ExperienceItem,
} from "@/types/database";

interface CandidateReviewProps {
  candidate: Candidate;
  cvUrl: string | null;
}

interface EditableProfile {
  full_name: string;
  phone: string;
  email: string;
  location: string;
  languages: string[];
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
}

const STATUS_LABELS: Record<Candidate["status"], string> = {
  nouveau: "Nouveau",
  a_revoir: "À revoir",
  valide: "Profil validé",
  archive: "Archivé",
  a_purger: "À purger (APDP)",
};

export function CandidateReview({ candidate, cvUrl }: CandidateReviewProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<EditableProfile>({
    full_name: candidate.full_name,
    phone: candidate.phone ?? "",
    email: candidate.email ?? "",
    location: candidate.location ?? "",
    languages: candidate.languages,
    skills: candidate.skills,
    experience: candidate.experience,
    education: candidate.education,
  });
  const [alertes, setAlertes] = useState<string[]>([]);
  const [busy, setBusy] = useState<"parse" | "save" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleParse() {
    setBusy("parse");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/candidates/${candidate.id}/parse`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Le parsing a échoué.");
        return;
      }
      const p = json.profile;
      setProfile({
        full_name: p.full_name || profile.full_name,
        phone: p.phone ?? profile.phone,
        email: p.email ?? profile.email,
        location: p.location ?? profile.location,
        languages: p.languages ?? [],
        skills: p.skills ?? [],
        experience: p.experience ?? [],
        education: p.education ?? [],
      });
      setAlertes(p.alertes ?? []);
      setMessage(
        "Profil extrait par l'IA. Vérifiez et corrigez avant d'enregistrer — rien n'est sauvegardé sans votre validation."
      );
    } catch {
      setError("Connexion impossible. Réessayez.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSave(status?: Candidate["status"]) {
    setBusy("save");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/candidates/${candidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: profile.full_name,
          phone: profile.phone || null,
          email: profile.email || null,
          location: profile.location || null,
          languages: profile.languages,
          skills: profile.skills,
          experience: profile.experience,
          education: profile.education,
          ...(status ? { status } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Enregistrement impossible.");
        return;
      }
      setMessage("Profil enregistré.");
      router.refresh();
    } catch {
      setError("Connexion impossible. Réessayez.");
    } finally {
      setBusy(null);
    }
  }

  function updateExperience(i: number, patch: Partial<ExperienceItem>) {
    setProfile((p) => ({
      ...p,
      experience: p.experience.map((e, j) => (j === i ? { ...e, ...patch } : e)),
    }));
  }

  function updateEducation(i: number, patch: Partial<EducationItem>) {
    setProfile((p) => ({
      ...p,
      education: p.education.map((e, j) => (j === i ? { ...e, ...patch } : e)),
    }));
  }

  const inputCls =
    "mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{candidate.full_name}</h1>
          <p className="text-sm text-stone-500">
            Statut : {STATUS_LABELS[candidate.status]} • Source :{" "}
            {candidate.source} • Consentement enregistré le{" "}
            {new Date(candidate.consent_at).toLocaleDateString("fr-FR")} •
            Conservation jusqu&apos;au{" "}
            {new Date(candidate.retention_until).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <div className="flex gap-2">
          {cvUrl && (
            <a
              href={cvUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-stone-300 px-3 py-2 text-sm hover:bg-stone-100"
            >
              Voir le CV
            </a>
          )}
          <button
            onClick={handleParse}
            disabled={busy !== null || !cvUrl}
            className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {busy === "parse"
              ? "Analyse du CV en cours…"
              : "Extraire le profil avec l'IA"}
          </button>
        </div>
      </div>

      {alertes.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-800">
            Points signalés par l&apos;IA — à vérifier :
          </p>
          <ul className="mt-1 list-inside list-disc text-amber-900">
            {alertes.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}
      {message && <p className="text-sm text-teal-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Nom complet</label>
          <input
            value={profile.full_name}
            onChange={(e) =>
              setProfile((p) => ({ ...p, full_name: e.target.value }))
            }
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Téléphone</label>
          <input
            value={profile.phone}
            onChange={(e) =>
              setProfile((p) => ({ ...p, phone: e.target.value }))
            }
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            value={profile.email}
            onChange={(e) =>
              setProfile((p) => ({ ...p, email: e.target.value }))
            }
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Localisation</label>
          <input
            value={profile.location}
            onChange={(e) =>
              setProfile((p) => ({ ...p, location: e.target.value }))
            }
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Langues (séparées par des virgules)
          </label>
          <input
            value={profile.languages.join(", ")}
            onChange={(e) =>
              setProfile((p) => ({
                ...p,
                languages: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              }))
            }
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Compétences (séparées par des virgules)
          </label>
          <input
            value={profile.skills.join(", ")}
            onChange={(e) =>
              setProfile((p) => ({
                ...p,
                skills: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              }))
            }
            className={inputCls}
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Expériences</h2>
          <button
            onClick={() =>
              setProfile((p) => ({
                ...p,
                experience: [
                  ...p.experience,
                  {
                    poste: "",
                    entreprise: "",
                    debut: null,
                    fin: null,
                    description: null,
                  },
                ],
              }))
            }
            className="text-sm text-teal-700 hover:underline"
          >
            + Ajouter
          </button>
        </div>
        <div className="mt-2 space-y-3">
          {profile.experience.map((exp, i) => (
            <div
              key={i}
              className="grid gap-2 rounded-md border border-stone-200 bg-white p-3 sm:grid-cols-4"
            >
              <input
                placeholder="Poste"
                value={exp.poste}
                onChange={(e) => updateExperience(i, { poste: e.target.value })}
                className={inputCls}
              />
              <input
                placeholder="Entreprise"
                value={exp.entreprise}
                onChange={(e) =>
                  updateExperience(i, { entreprise: e.target.value })
                }
                className={inputCls}
              />
              <input
                placeholder="Début (AAAA-MM)"
                value={exp.debut ?? ""}
                onChange={(e) =>
                  updateExperience(i, { debut: e.target.value || null })
                }
                className={inputCls}
              />
              <input
                placeholder="Fin (vide = en cours)"
                value={exp.fin ?? ""}
                onChange={(e) =>
                  updateExperience(i, { fin: e.target.value || null })
                }
                className={inputCls}
              />
              <textarea
                placeholder="Description"
                value={exp.description ?? ""}
                onChange={(e) =>
                  updateExperience(i, { description: e.target.value || null })
                }
                className={`${inputCls} sm:col-span-4`}
                rows={2}
              />
            </div>
          ))}
          {profile.experience.length === 0 && (
            <p className="text-sm text-stone-500">
              Aucune expérience enregistrée.
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Formation</h2>
          <button
            onClick={() =>
              setProfile((p) => ({
                ...p,
                education: [
                  ...p.education,
                  { diplome: "", etablissement: "", annee: null },
                ],
              }))
            }
            className="text-sm text-teal-700 hover:underline"
          >
            + Ajouter
          </button>
        </div>
        <div className="mt-2 space-y-3">
          {profile.education.map((edu, i) => (
            <div
              key={i}
              className="grid gap-2 rounded-md border border-stone-200 bg-white p-3 sm:grid-cols-3"
            >
              <input
                placeholder="Diplôme"
                value={edu.diplome}
                onChange={(e) => updateEducation(i, { diplome: e.target.value })}
                className={inputCls}
              />
              <input
                placeholder="Établissement"
                value={edu.etablissement}
                onChange={(e) =>
                  updateEducation(i, { etablissement: e.target.value })
                }
                className={inputCls}
              />
              <input
                placeholder="Année"
                value={edu.annee ?? ""}
                onChange={(e) =>
                  updateEducation(i, { annee: e.target.value || null })
                }
                className={inputCls}
              />
            </div>
          ))}
          {profile.education.length === 0 && (
            <p className="text-sm text-stone-500">
              Aucune formation enregistrée.
            </p>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleSave()}
          disabled={busy !== null}
          className="rounded-md border border-teal-700 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50 disabled:opacity-50"
        >
          {busy === "save" ? "Enregistrement…" : "Enregistrer les corrections"}
        </button>
        <button
          onClick={() => handleSave("valide")}
          disabled={busy !== null}
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          Enregistrer et valider le profil
        </button>
        <button
          onClick={() => handleSave("a_purger")}
          disabled={busy !== null}
          className="ml-auto rounded-md border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Marquer à purger (demande APDP)
        </button>
      </div>
    </div>
  );
}
