import { createClient } from "@supabase/supabase-js";
import { getAIAdapter } from "@/lib/ai/adapters";
import { getRecentMessages } from "@/lib/ai/memory/shortTermMemory";
import { normalizeAIUserRole } from "@/lib/ai/roles/permissions";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";

export const runtime = "nodejs";

function createAuthenticatedClient(authorization: string) {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: authorization } },
  });
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAuthenticatedClient(authorization);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { message?: unknown; conversationId?: unknown };
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
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let responseText = "";
      let status = "completed";
      try {
        for await (const chunk of adapter.streamChat([
          { role: "system", content: buildSystemPrompt(role) },
          ...recentMessages,
        ], { signal: request.signal })) {
          responseText += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch {
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
