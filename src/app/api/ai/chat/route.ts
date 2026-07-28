import { createClient } from "@supabase/supabase-js";
import { getAIAdapter } from "@/lib/ai/adapters";
import { getRecentMessages } from "@/lib/ai/memory/shortTermMemory";
import { canUseTool, normalizeAIUserRole } from "@/lib/ai/roles/permissions";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import { runTool, toolRegistry } from "@/lib/ai/tools";

type ToolRequest = { name: string; params: Record<string, unknown> };

export const runtime = "nodejs";

function createAuthenticatedClient(authorization: string) {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: authorization } },
  });
}

function productQuery(message: string) {
  const match = message.match(/(?:produk|stok)\s+(.+?)(?:\s+(?:sekarang|saat ini|yang|di bawah).*)?$/i);
  return match?.[1]?.trim() || message.trim();
}

function resolveDateRange(message: string): { startDate?: string; endDate?: string } {
  const text = message.toLowerCase();
  const now = new Date();
  const TZ_OFFSET_HOURS = 7; // WIB (UTC+7) — sesuaikan jika bisnis berada di zona waktu lain

  const startOfLocalDay = (date: Date) => {
    const local = new Date(date.getTime() + TZ_OFFSET_HOURS * 60 * 60 * 1000);
    local.setUTCHours(0, 0, 0, 0);
    return new Date(local.getTime() - TZ_OFFSET_HOURS * 60 * 60 * 1000);
  };

  const endOfLocalDay = (date: Date) => {
    const start = startOfLocalDay(date);
    return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  };

  if (/hari ini/.test(text)) {
    return { startDate: startOfLocalDay(now).toISOString(), endDate: endOfLocalDay(now).toISOString() };
  }
  if (/kemarin/.test(text)) {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return { startDate: startOfLocalDay(yesterday).toISOString(), endDate: endOfLocalDay(yesterday).toISOString() };
  }
  if (/minggu ini/.test(text)) {
    const dayIndex = (now.getUTCDay() + 6) % 7; // Senin = 0
    const monday = new Date(now.getTime() - dayIndex * 24 * 60 * 60 * 1000);
    return { startDate: startOfLocalDay(monday).toISOString(), endDate: endOfLocalDay(now).toISOString() };
  }
  if (/bulan ini/.test(text)) {
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: startOfLocalDay(firstOfMonth).toISOString(), endDate: endOfLocalDay(now).toISOString() };
  }

  return {};
}

function getToolRequest(message: string): ToolRequest | null {
  const text = message.toLowerCase();
  const dateRange = resolveDateRange(message);
  if (/(profit|laba|untung)/.test(text)) return { name: "getProfit", params: dateRange };
  if (/(stok (menipis|rendah|habis)|low stock|restock)/.test(text)) return { name: "getLowStock", params: {} };
  if (/(stok|persediaan)/.test(text)) return { name: "getStock", params: { query: productQuery(message) } };
  if (/(penjualan|omzet|transaksi|terjual)/.test(text)) return { name: "getSales", params: dateRange };
  if (/(produk|harga|kode)/.test(text)) return { name: "getProduct", params: { query: productQuery(message) } };
  return null;
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAuthenticatedClient(authorization);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { message?: unknown; conversationId?: unknown; brandId?: unknown };
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return Response.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });

  let conversationId = typeof body.conversationId === "string" ? body.conversationId : undefined;
  if (!conversationId) {
    const { data, error } = await supabase.from("ai_conversations").insert({ user_id: user.id, title: message.slice(0, 80) }).select("id").single();
    if (error || !data) return Response.json({ error: "Gagal membuat percakapan." }, { status: 500 });
    conversationId = (data as { id: string }).id;
  }

  const { error: messageError } = await supabase.from("ai_messages").insert({ conversation_id: conversationId, role: "user", content: message });
  if (messageError) return Response.json({ error: "Gagal menyimpan pesan." }, { status: 500 });

  const [{ data: profile }, recentMessages] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    getRecentMessages(supabase, conversationId),
  ]);
  const role = normalizeAIUserRole((profile as { role?: string } | null)?.role);
  const adapter = getAIAdapter();
  const brandId = typeof body.brandId === "string" ? body.brandId : "";
  const requestedTool = getToolRequest(message);
  const toolMessages: { role: "tool"; content: string }[] = [];

  if (requestedTool) {
    const result = await runTool(requestedTool.name, requestedTool.params, { userId: user.id, role, brandId, supabase });
    const toolContent = JSON.stringify({ tool: requestedTool.name, result });
    await supabase.from("ai_messages").insert({ conversation_id: conversationId, role: "tool", content: toolContent, tool_name: requestedTool.name });
    toolMessages.push({ role: "tool", content: toolContent });
  }

  const availableTools = toolRegistry.list().filter((tool) => canUseTool(role, tool.name));
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let responseText = "";
      let status = "completed";
      try {
        for await (const chunk of adapter.streamChat([
          { role: "system", content: buildSystemPrompt(role, availableTools) },
          ...recentMessages,
          ...toolMessages,
        ], { signal: request.signal })) {
          responseText += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (error) {
        console.error("KasirIntelek chat error:", error);
        status = "failed";
        const fallback = "Maaf, KasirIntelek sedang tidak dapat merespons. Silakan coba lagi.";
        responseText = responseText || fallback;
        controller.enqueue(encoder.encode(responseText));
      } finally {
        if (responseText) {
          await supabase.from("ai_messages").insert({ conversation_id: conversationId, role: "assistant", content: responseText });
        }
        await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
        await supabase.from("ai_audit_log").insert({
          user_id: user.id,
          action: "chat_message",
          detail: { conversation_id: conversationId, adapter: adapter.name, role, status },
        });
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Conversation-Id": conversationId } });
}