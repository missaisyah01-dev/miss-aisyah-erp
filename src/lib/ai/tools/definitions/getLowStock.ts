import type { Tool } from "../types";

export const getLowStock: Tool = {
  name: "getLowStock",
  description: "Membaca produk dengan stok total di bawah atau sama dengan ambang minimum. Parameter threshold opsional, default 5.",
  requiredRole: ["OWNER", "MANAGER", "GUDANG"],
  async execute(params, ctx) {
    const rawThreshold = Number(params.threshold);
    const threshold = Number.isFinite(rawThreshold) ? Math.max(0, Math.min(Math.floor(rawThreshold), 100000)) : 5;
    const { data, error } = await ctx.supabase.from("products").select("id,kode,nama,stok").eq("brand_id", ctx.brandId).lte("stok", threshold).order("stok", { ascending: true }).limit(100);
    if (error) return { success: false, error: "Data stok rendah tidak tersedia." };
    return { success: true, data: { threshold, products: data ?? [] } };
  },
};
