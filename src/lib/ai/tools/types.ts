import type { SupabaseClient } from "@supabase/supabase-js";

export type Role = "OWNER" | "MANAGER" | "KASIR" | "GUDANG";
export type ToolPermission = Role;

export type ToolResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type Tool = {
  name: string;
  description: string;
  requiredRole: Role[];
  execute: (params: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult>;
};

export type ToolContext = {
  userId: string;
  role: Role;
  brandId: string;
  supabase: SupabaseClient;
};
