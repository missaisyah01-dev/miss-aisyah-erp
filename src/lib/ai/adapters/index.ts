import type { AIAdapter } from "./AIAdapter";
import { OllamaAdapter } from "./OllamaAdapter";

export function getAIAdapter(): AIAdapter {
  // Additional adapters can be selected here without changing ERP or chat logic.
  return new OllamaAdapter();
}

export type { AIAdapter, AIChatMessage, AIChatOptions } from "./AIAdapter";
