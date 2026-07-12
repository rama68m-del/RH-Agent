import "server-only";
import { anthropic, AI_MODEL } from "./client";
import { ParsedProfileSchema, type ParsedProfile } from "./schemas";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `Tu es un assistant de cabinet de recrutement en Afrique de l'Ouest francophone.
Tu extrais les informations d'un CV (souvent scanné, photographié ou mal formaté) en un profil structuré.

Règles :
- Réponds en français.
- N'invente JAMAIS d'information absente du document. Si un champ est illisible ou absent, mets null (ou liste vide).
- Normalise les compétences en termes courts et réutilisables (ex. "comptabilité OHADA", "Excel", "gestion de projet").
- Les dates au format AAAA ou AAAA-MM si disponibles.
- Dans "alertes", signale au recruteur toute incohérence (dates qui se chevauchent, contact manquant, document partiellement illisible, etc.).`;

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

type ImageMediaType = (typeof SUPPORTED_IMAGE_TYPES)[number];

function buildFileBlock(
  base64Data: string,
  mimeType: string
): Anthropic.ContentBlockParam {
  if (mimeType === "application/pdf") {
    return {
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: base64Data,
      },
    };
  }
  if (SUPPORTED_IMAGE_TYPES.includes(mimeType as ImageMediaType)) {
    return {
      type: "image",
      source: {
        type: "base64",
        media_type: mimeType as ImageMediaType,
        data: base64Data,
      },
    };
  }
  throw new Error(`Type de fichier non supporté pour le parsing : ${mimeType}`);
}

// Convertit un CV (PDF ou photo) en profil structuré, validé par Zod.
export async function parseCv(
  base64Data: string,
  mimeType: string
): Promise<ParsedProfile> {
  const response = await anthropic.messages.parse({
    model: AI_MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          buildFileBlock(base64Data, mimeType),
          {
            type: "text",
            text: "Extrais le profil structuré de ce CV.",
          },
        ],
      },
    ],
    output_config: {
      format: zodOutputFormat(ParsedProfileSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Le parsing du CV a échoué : sortie non conforme.");
  }
  return ParsedProfileSchema.parse(response.parsed_output);
}
