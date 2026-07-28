import type { AIAdapter } from "./AIAdapter";
import { GeminiAdapter } from "./GeminiAdapter";
import { OllamaAdapter } from "./OllamaAdapter";

export function getAIAdapter(): AIAdapter {
  if (process.env.AI_PROVIDER?.toLowerCase() === "gemini") return new GeminiAdapter();
  return new OllamaAdapter();
}

export type { AIAdapter, AIChatMessage, AIChatOptions } from "./AIAdapter";
