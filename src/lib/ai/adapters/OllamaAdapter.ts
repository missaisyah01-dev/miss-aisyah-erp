import type { AIAdapter, AIChatMessage, AIChatOptions } from "./AIAdapter";

export class OllamaAdapter implements AIAdapter {
  readonly name = "ollama";

  constructor(
    private readonly baseUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
    private readonly model = process.env.OLLAMA_MODEL ?? "llama3.2",
  ) {}

  async isAvailable() {
    try {
      return (await fetch(`${this.baseUrl}/api/tags`)).ok;
    } catch {
      return false;
    }
  }

  async *streamChat(messages: AIChatMessage[], options?: AIChatOptions): AsyncIterable<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, messages, stream: true }),
      signal: options?.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Ollama tidak dapat merespons (${response.status}).`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const chunk = JSON.parse(line) as { message?: { content?: string } };
          if (chunk.message?.content) yield chunk.message.content;
        }
        if (done) break;
      }
      if (buffer.trim()) {
        const chunk = JSON.parse(buffer) as { message?: { content?: string } };
        if (chunk.message?.content) yield chunk.message.content;
      }
    } finally {
      reader.releaseLock();
    }
  }
}
