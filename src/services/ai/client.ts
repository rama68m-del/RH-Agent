import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Client Anthropic partagé — tous les appels Claude passent par ici.
// Alias `claude` accepté : nom utilisé dans les variables d'environnement Vercel.
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.claude,
});

export const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
