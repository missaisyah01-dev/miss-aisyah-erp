import type { Tool } from "../types";

export const getProduct: Tool = {
  name: "getProduct",
  description: "Mencari detail produk berdasarkan nama, kode, atau productId. Jika tidak ada filter, menampilkan daftar produk.",
  requiredRole: ["OWNER", "MANAGER", "KASIR", "GUDANG"],
  async execute(params, ctx) {
    const productId = Number(params.productId);
    const queryText = typeof params.query === "string" ? params.query.trim().replace(/[(),]/g, " ").slice(0, 100) : "";
    let query = ctx.supabase.from("products").select("id,kode,nama,kategori,harga,stok,created_at").eq("brand_id", ctx.brandId).order("nama").limit(20);
    if (Number.isInteger(productId) && productId > 0) query = query.eq("id", productId);
    else if (queryText) query = query.or(`nama.ilike.%${queryText}%,kode.ilike.%${queryText}%`);
    const { data, error } = await query;
    if (error) return { success: false, error: "Detail produk tidak tersedia." };
    return { success: true, data: { products: data ?? [] } };
  },
};