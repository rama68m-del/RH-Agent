import { z } from "zod";

// ------------------------------------------------------------
// Sortie du parsing de CV (M2) — validée avant toute écriture en base.
// ------------------------------------------------------------
export const ParsedProfileSchema = z.object({
  full_name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  location: z.string().nullable(),
  languages: z.array(z.string()),
  skills: z.array(z.string()),
  experience: z.array(
    z.object({
      poste: z.string(),
      entreprise: z.string(),
      debut: z.string().nullable(),
      fin: z.string().nullable(),
      description: z.string().nullable(),
    })
  ),
  education: z.array(
    z.object({
      diplome: z.string(),
      etablissement: z.string(),
      annee: z.string().nullable(),
    })
  ),
  // Incohérences ou champs manquants signalés au recruteur
  alertes: z.array(z.string()),
});

export type ParsedProfile = z.infer<typeof ParsedProfileSchema>;

// ------------------------------------------------------------
// Sortie du matching (M4) — score PAR COMPÉTENCES + justification lisible.
// ------------------------------------------------------------
export const MatchingResultSchema = z.object({
  resultats: z.array(
    z.object({
      candidate_id: z.string(),
      score: z.number(),
      justification: z.string(),
      points_forts: z.array(z.string()),
      points_de_vigilance: z.array(z.string()),
    })
  ),
});

export type MatchingResult = z.infer<typeof MatchingResultSchema>;

// ------------------------------------------------------------
// Interprétation d'une recherche en langage naturel (M3).
// ------------------------------------------------------------
export const SearchFiltersSchema = z.object({
  skills: z.array(z.string()),
  languages: z.array(z.string()),
  location: z.string().nullable(),
  keywords: z.array(z.string()),
});

export type SearchFilters = z.infer<typeof SearchFiltersSchema>;
