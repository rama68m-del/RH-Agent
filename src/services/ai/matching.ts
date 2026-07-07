import "server-only";
import { anthropic, AI_MODEL } from "./client";
import { MatchingResultSchema, type MatchingResult } from "./schemas";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { Candidate, Mandate } from "@/types/database";

const SYSTEM_PROMPT = `Tu es un consultant senior d'un cabinet de recrutement en Afrique de l'Ouest francophone.
Tu classes des candidats du vivier pour un poste donné.

Règles impératives :
- Le matching se fait PAR COMPÉTENCES démontrées, pas par diplôme ni par prestige d'établissement.
- Ne prends JAMAIS en compte : l'âge, le genre, l'ethnie, la religion, la situation familiale ou tout critère discriminatoire.
- Chaque score (0-100) doit être accompagné d'une justification LISIBLE en français que le recruteur pourra présenter au client : pourquoi ce candidat, sur quelles compétences, avec quelles réserves.
- Sois honnête : si aucun candidat ne convient bien, dis-le dans les justifications avec des scores bas.
- Classe uniquement les candidats fournis, en réutilisant exactement leur candidate_id.`;

function candidateSummary(c: Candidate): string {
  const exp = c.experience
    .map(
      (e) =>
        `  - ${e.poste} chez ${e.entreprise} (${e.debut ?? "?"} → ${e.fin ?? "en cours"})`
    )
    .join("\n");
  const edu = c.education
    .map((e) => `  - ${e.diplome}, ${e.etablissement} (${e.annee ?? "?"})`)
    .join("\n");
  return [
    `candidate_id: ${c.id}`,
    `Nom: ${c.full_name}`,
    `Localisation: ${c.location ?? "non renseignée"}`,
    `Langues: ${c.languages.join(", ") || "non renseignées"}`,
    `Compétences: ${c.skills.join(", ") || "non renseignées"}`,
    `Expériences:\n${exp || "  (aucune)"}`,
    `Formation:\n${edu || "  (aucune)"}`,
  ].join("\n");
}

// Classe les candidats pour un mandat, avec justification lisible par candidat.
export async function matchCandidates(
  mandate: Mandate,
  candidates: Candidate[]
): Promise<MatchingResult> {
  const req = mandate.requirements;
  const mandateText = [
    `Poste : ${mandate.title}`,
    `Client : ${mandate.client_name}`,
    `Description : ${mandate.description || "(non renseignée)"}`,
    `Compétences requises : ${req.competences?.join(", ") ?? "non précisées"}`,
    `Expérience minimale : ${req.experience_min_annees != null ? `${req.experience_min_annees} ans` : "non précisée"}`,
    `Langues : ${req.langues?.join(", ") ?? "non précisées"}`,
    `Localisation : ${req.localisation ?? "non précisée"}`,
    `Autres exigences : ${req.autres ?? "aucune"}`,
  ].join("\n");

  const response = await anthropic.messages.parse({
    model: AI_MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `## Le poste à pourvoir\n${mandateText}\n\n## Les candidats du vivier\n\n${candidates
          .map(candidateSummary)
          .join("\n\n---\n\n")}\n\nClasse ces candidats pour ce poste.`,
      },
    ],
    output_config: {
      format: zodOutputFormat(MatchingResultSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Le matching a échoué : sortie non conforme.");
  }
  const parsed = MatchingResultSchema.parse(response.parsed_output);

  // Garde-fou : ne conserver que des candidate_id réellement fournis
  const validIds = new Set(candidates.map((c) => c.id));
  parsed.resultats = parsed.resultats.filter((r) => validIds.has(r.candidate_id));
  // Borne les scores dans [0, 100]
  parsed.resultats.forEach((r) => {
    r.score = Math.max(0, Math.min(100, Math.round(r.score)));
  });
  return parsed;
}
