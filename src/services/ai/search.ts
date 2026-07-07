import "server-only";
import { anthropic, AI_MODEL } from "./client";
import { SearchFiltersSchema, type SearchFilters } from "./schemas";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const SYSTEM_PROMPT = `Tu transformes une recherche en langage naturel d'un recruteur en filtres structurés pour une CVthèque en Afrique de l'Ouest francophone.

Règles :
- "skills" : compétences recherchées, en termes courts (inclut aussi les intitulés de poste, ex. "comptable" → compétence "comptabilité").
- "languages" : uniquement des langues parlées (français, anglais, bambara, wolof…).
- "location" : ville ou pays si mentionné, sinon null.
- "keywords" : autres termes utiles (secteur, type de contrat, niveau).
- Ne rien inventer au-delà de la requête.`;

// Interprète une requête libre ("comptable bilingue anglais à Bamako")
// en filtres structurés utilisables en SQL.
export async function interpretSearchQuery(
  query: string
): Promise<SearchFilters> {
  const response = await anthropic.messages.parse({
    model: AI_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Requête du recruteur : "${query}"` }],
    output_config: {
      format: zodOutputFormat(SearchFiltersSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Interprétation de la recherche impossible.");
  }
  return SearchFiltersSchema.parse(response.parsed_output);
}
