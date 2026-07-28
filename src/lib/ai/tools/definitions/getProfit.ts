import type { Tool } from "../types";

export const getProfit: Tool = {
  name: "getProfit",
  description: "Memeriksa ketersediaan data profit. Profit hanya dihitung bila sumber biaya atau pembelian tersedia.",
  requiredRole: ["OWNER", "MANAGER"],
  async execute(_params, ctx) {
    const { data, error } = await ctx.supabase.from("transactions").select("total").eq("brand_id", ctx.brandId);
    if (error) return { success: false, error: "Data penjualan tidak tersedia untuk menghitung profit." };
    return { success: true, data: { revenue: (data ?? []).reduce((total, item) => total + Number(item.total), 0), profitAvailable: false, reason: "ERP saat ini belum memiliki tabel pembelian atau harga modal produk, sehingga profit tidak dapat dihitung secara akurat." } };
  },
};
