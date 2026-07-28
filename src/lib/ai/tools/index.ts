import { toolRegistry } from "./ToolRegistry";
import { getLowStock } from "./definitions/getLowStock";
import { getProduct } from "./definitions/getProduct";
import { getProfit } from "./definitions/getProfit";
import { getSales } from "./definitions/getSales";
import { getStock } from "./definitions/getStock";

[getSales, getProfit, getStock, getLowStock, getProduct].forEach((tool) => toolRegistry.register(tool));

export { runTool, toolRegistry } from "./ToolRegistry";
export type { Role, Tool, ToolContext, ToolResult } from "./types";
