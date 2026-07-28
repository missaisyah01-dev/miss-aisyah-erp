export type ToolPermission = "OWNER" | "MANAGER" | "KASIR" | "GUDANG";

export type ToolResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type Tool = {
  name: string;
  description: string;
  permissions: ToolPermission[];
};
