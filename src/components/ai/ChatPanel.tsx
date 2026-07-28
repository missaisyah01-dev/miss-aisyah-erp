"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { MessageBubble } from "./MessageBubble";
import { QuickCommands } from "./QuickCommands";
import { SuggestionButtons } from "./SuggestionButtons";
import { TypingIndicator } from "./TypingIndicator";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

export function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string>();
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, streaming]);

  async function sendMessage(content = input) {
    const trimmed = content.trim();
    if (!trimmed || streaming) return;
    setInput("");
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: trimmed }]);
    setStreaming(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesi Anda telah berakhir.");
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ message: trimmed, conversationId }),
      });
      if (!response.ok || !response.body) throw new Error((await response.json() as { error?: string }).error ?? "Gagal menghubungi KasirIntelek.");
      setConversationId(response.headers.get("X-Conversation-Id") ?? conversationId);
      const assistantId = crypto.randomUUID();
      setMessages((current) => [...current, { id: assistantId, role: "assistant", content: "" }]);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((current) => current.map((item) => item.id === assistantId ? { ...item, content: item.content + chunk } : item));
      }
    } catch (error) {
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: error instanceof Error ? error.message : "Terjadi kesalahan." }]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <aside className={`fixed bottom-24 right-4 z-50 flex h-[min(640px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-md origin-bottom-right flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-300 dark:border-slate-700 dark:bg-slate-900 ${open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"}`} aria-hidden={!open}>
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700"><div><h2 className="font-semibold text-slate-900 dark:text-white">KasirIntelek</h2><p className="text-xs text-slate-500">Asisten operasional bisnis</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Tutup KasirIntelek">✕</button></header>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">Halo, saya KasirIntelek. Saya siap membantu kebutuhan operasional Anda.</p>}
        {messages.map((message) => <MessageBubble key={message.id} role={message.role} content={message.content} />)}
        {streaming && (messages.at(-1)?.role !== "assistant" || !messages.at(-1)?.content) && <TypingIndicator />}
        {messages.at(-1)?.role === "assistant" && !streaming && <SuggestionButtons onSelect={(suggestion) => void sendMessage(suggestion)} />}
      </div>
      <QuickCommands onSelect={(command) => void sendMessage(command)} />
      <form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-700"><input value={input} onChange={(event) => setInput(event.target.value)} disabled={streaming} placeholder="Tulis pesan..." className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /><button disabled={streaming || !input.trim()} className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">Kirim</button></form>
    </aside>
  );
}
