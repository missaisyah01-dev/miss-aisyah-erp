import { canUseTool } from "../roles/permissions";
import type { Tool, ToolContext, ToolResult } from "./types";

export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  register(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  get(name: string) {
    return this.tools.get(name);
  }

  list(): Tool[] {
    return [...this.tools.values()];
  }
}

export const toolRegistry = new ToolRegistry();

function auditParams(params: Record<string, unknown>) {
  const allowed = ["startDate", "endDate", "query", "productId", "threshold", "limit"];
  return Object.fromEntries(Object.entries(params).filter(([key]) => allowed.includes(key)));
}

export async function runTool(name: string, params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const tool = toolRegistry.get(name);
  if (!tool) return { success: false, error: "Tool tidak ditemukan." };

  const detail = { tool_name: name, parameters: auditParams(params) };
  if (!canUseTool(ctx.role, name) || !tool.requiredRole.includes(ctx.role)) {
    await ctx.supabase.from("ai_audit_log").insert({ user_id: ctx.userId, action: "tool_denied", detail });
    return { success: false, error: "Anda tidak memiliki akses untuk menggunakan data ini." };
  }

  await ctx.supabase.from("ai_audit_log").insert({ user_id: ctx.userId, action: "tool_call", detail });
  try {
    return await tool.execute(params, ctx);
  } catch {
    return { success: false, error: "Data tidak tersedia saat ini." };
  }
}
