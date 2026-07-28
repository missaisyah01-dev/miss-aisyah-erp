export type AIChatMessage = {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
};

export type AIChatOptions = {
  signal?: AbortSignal;
};

export interface AIAdapter {
  readonly name: string;
  streamChat(messages: AIChatMessage[], options?: AIChatOptions): AsyncIterable<string>;
  isAvailable(): Promise<boolean>;
}
