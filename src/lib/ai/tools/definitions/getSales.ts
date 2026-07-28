import type { Tool } from "../types";

function dateParam(value: unknown) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : undefined;
}

export const getSales: Tool = {
  name: "getSales",
  description: "Membaca ringkasan penjualan pada rentang tanggal opsional (startDate dan endDate).",
  requiredRole: ["OWNER", "MANAGER", "KASIR"],
  async execute(params, ctx) {
    const startDate = dateParam(params.startDate);
    const endDate = dateParam(params.endDate);
    const limit = Math.min(Math.max(Number(params.limit) || 100, 1), 500);
    let query = ctx.supabase.from("transactions").select("id,invoice_number,total,paid_amount,payment_method,payment_status,created_at").eq("brand_id", ctx.brandId).order("created_at", { ascending: false }).limit(limit);
    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);
    const { data, error } = await query;
    if (error) return { success: false, error: "Data penjualan tidak tersedia." };
    const transactions = data ?? [];
    return { success: true, data: { period: { startDate: startDate ?? null, endDate: endDate ?? null }, transactionCount: transactions.length, totalSales: transactions.reduce((total, item) => total + Number(item.total), 0), transactions } };
  },
};
