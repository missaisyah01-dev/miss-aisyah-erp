import type { Role } from "../tools/types";

export type AIUserRole = Role;

export function normalizeAIUserRole(role: string | null | undefined): AIUserRole {
  if (role === "OWNER") return "OWNER";
  if (role === "ADMIN" || role === "MANAGER") return "MANAGER";
  if (role === "GUDANG") return "GUDANG";
  return "KASIR";
}

export const roleToolPermissions: Record<AIUserRole, string[]> = {
  OWNER: ["getSales", "getProfit", "getStock", "getLowStock", "getProduct"],
  MANAGER: ["getSales", "getProfit", "getStock", "getLowStock", "getProduct"],
  KASIR: ["getSales", "getProduct"],
  GUDANG: ["getStock", "getLowStock", "getProduct"],
};

export function canUseTool(role: AIUserRole, toolName: string) {
  return roleToolPermissions[role].includes(toolName);
}

export function getAllowedToolNames(role: AIUserRole) {
  return roleToolPermissions[role];
}
