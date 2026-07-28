import type { ToolPermission } from "../tools/types";

export type AIUserRole = ToolPermission;

export function normalizeAIUserRole(role: string | null | undefined): AIUserRole {
  if (role === "OWNER") return "OWNER";
  if (role === "ADMIN" || role === "MANAGER") return "MANAGER";
  if (role === "GUDANG") return "GUDANG";
  return "KASIR";
}

export const roleToolPermissions: Record<AIUserRole, string[]> = {
  OWNER: [],
  MANAGER: [],
  KASIR: [],
  GUDANG: [],
};
