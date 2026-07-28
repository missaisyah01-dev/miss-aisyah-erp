import type { SupabaseClient } from "@supabase/supabase-js";

export type MemoryType = "preference" | "summary" | "favorite_command" | "recent_activity";

export async function getLongTermMemory(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("ai_memory")
    .select("id, memory_type, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveLongTermMemory(supabase: SupabaseClient, userId: string, memoryType: MemoryType, content: Record<string, unknown>) {
  const { error } = await supabase.from("ai_memory").insert({ user_id: userId, memory_type: memoryType, content });
  if (error) throw error;
}
