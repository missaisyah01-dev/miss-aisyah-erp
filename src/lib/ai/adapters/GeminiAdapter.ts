import type { AIAdapter, AIChatMessage, AIChatOptions } from "./AIAdapter";

type GeminiPart = { text: string };
type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };
type GeminiResponse = { candidates?: Array<{ content?: { parts?: GeminiPart[] } }> };

export class GeminiAdapter implements AIAdapter {
  readonly name = "gemini";

  constructor(
    private readonly apiKey = process.env.GEMINI_API_KEY ?? "",
    private readonly model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    private readonly baseUrl = "https://generativelanguage.googleapis.com/v1beta",
  ) {}

  async isAvailable() {
    return Boolean(this.apiKey.trim());
  }

  async *streamChat(messages: AIChatMessage[], options?: AIChatOptions): AsyncIterable<string> {
    if (!this.apiKey.trim()) throw new Error("GEMINI_API_KEY belum diatur.");

    const systemText = messages.filter((message) => message.role === "system").map((message) => message.content).join("\n\n");
    const contents = this.toGeminiContents(messages.filter((message) => message.role !== "system"));
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/models/${encodeURIComponent(this.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(this.apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
          contents,
        }),
        signal: options?.signal,
      });
    } catch {
      throw new Error("Tidak dapat terhubung ke Google Gemini. Periksa koneksi jaringan.");
    }

    if (!response.ok || !response.body) {
      const detail = await response.text().catch(() => "");
      if (response.status === 401 || response.status === 403) throw new Error("GEMINI_API_KEY tidak valid atau tidak memiliki akses ke model.");
      if (response.status === 429) throw new Error("Batas permintaan Gemini telah tercapai. Silakan coba lagi nanti.");
      throw new Error(`Gemini tidak dapat merespons (${response.status})${detail ? `: ${detail.slice(0, 160)}` : "."}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const event of events) yield* this.readSseEvent(event);
        if (done) break;
      }
      if (buffer.trim()) yield* this.readSseEvent(buffer);
    } finally {
      reader.releaseLock();
    }
  }

  private toGeminiContents(messages: AIChatMessage[]): GeminiContent[] {
    return messages.reduce<GeminiContent[]>((contents, message) => {
      const role = message.role === "assistant" ? "model" : "user";
      const text = message.role === "tool" ? `Hasil tool ERP (gunakan hanya data ini untuk jawaban Anda):\n${message.content}` : message.content;
      const previous = contents.at(-1);
      if (previous?.role === role) previous.parts.push({ text });
      else contents.push({ role, parts: [{ text }] });
      return contents;
    }, []);
  }

  private *readSseEvent(event: string): Generator<string> {
    for (const line of event.split("\n")) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const chunk = JSON.parse(payload) as GeminiResponse;
        for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
          if (part.text) yield part.text;
        }
      } catch {
        // Ignore malformed keep-alive events; valid content frames continue streaming.
      }
    }
  }
}
