import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIChatMessage } from "../adapters";

type StoredMessage = AIChatMessage & { created_at: string };

export async function getRecentMessages(supabase: SupabaseClient, conversationId: string, limit = 20): Promise<AIChatMessage[]> {
  const { data, error } = await supabase
    .from("ai_messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data ?? []) as StoredMessage[]).reverse().map(({ role, content }) => ({ role, content }));
}
