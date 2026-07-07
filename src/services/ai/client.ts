import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Client Anthropic partagé — tous les appels Claude passent par ici.
export const anthropic = new Anthropic();

export const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
