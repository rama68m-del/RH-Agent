"use client";

import { useState } from "react";
import Link from "next/link";
import type { Candidate } from "@/types/database";

interface CandidateSearchProps {
  initialCandidates: Candidate[];
}

const STATUS_BADGES: Record<string, string> = {
  nouveau: "bg-blue-100 text-blue-800",
  a_revoir: "bg-amber-100 text-amber-800",
  valide: "bg-teal-100 text-teal-800",
  archive: "bg-stone-200 text-stone-600",
};

export function CandidateSearch({ initialCandidates }: CandidateSearchProps) {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState(initialCandidates);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!query.trim()) {
      setCandidates(initialCandidates);
      setActiveFilters(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/candidates/search?q=${encodeURIComponent(query)}`
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "La recherche a échoué.");
        return;
      }
      setCandidates(json.candidates);
      const f = json.filters;
      const parts = [
        f.skills?.length ? `compétences : ${f.skills.join(", ")}` : null,
        f.languages?.length ? `langues : ${f.languages.join(", ")}` : null,
        f.location ? `lieu : ${f.location}` : null,
      ].filter(Boolean);
      setActiveFilters(parts.length ? parts.join(" • ") : null);
    } catch {
      setError("Connexion impossible. Réessayez.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="mt-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Ex. : "comptable OHADA bilingue anglais à Bamako"'
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={searching}
          className="shrink-0 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {searching ? "Recherche…" : "Rechercher"}
        </button>
      </form>
      {activeFilters && (
        <p className="mt-2 text-xs text-stone-500">
          Filtres interprétés — {activeFilters}
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-4 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        {candidates.map((c) => (
          <li key={c.id}>
            <Link
              href={`/candidats/${c.id}`}
              className="flex flex-wrap items-center gap-2 px-4 py-3 hover:bg-stone-50"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{c.full_name}</p>
                <p className="truncate text-sm text-stone-500">
                  {[c.location, c.languages.join(", ")]
                    .filter(Boolean)
                    .join(" • ") || "Profil à compléter"}
                </p>
                {c.skills.length > 0 && (
                  <p className="mt-1 truncate text-xs text-stone-400">
                    {c.skills.slice(0, 8).join(" · ")}
                  </p>
                )}
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${STATUS_BADGES[c.status] ?? "bg-stone-100"}`}
              >
                {c.status.replace("_", " ")}
              </span>
            </Link>
          </li>
        ))}
        {candidates.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-stone-500">
            Aucun candidat trouvé. Partagez le lien public{" "}
            <span className="font-mono">/postuler</span> pour remplir le
            vivier.
          </li>
        )}
      </ul>
    </div>
  );
}
