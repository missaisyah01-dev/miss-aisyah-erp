import type { Tool } from "./types";

// AI data access will be registered here in later phases. No ERP tools exist yet.
export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  getAll(): Tool[] {
    return [...this.tools.values()];
  }
}

export const toolRegistry = new ToolRegistry();
