import type { Tool } from "../types";

function searchValue(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/[(),]/g, " ").slice(0, 100) : "";
}

export const getStock: Tool = {
  name: "getStock",
  description: "Membaca stok produk dan variannya. Parameter query opsional untuk mencari produk.",
  requiredRole: ["OWNER", "MANAGER", "GUDANG"],
  async execute(params, ctx) {
    const queryText = searchValue(params.query);
    let query = ctx.supabase.from("products").select("id,kode,nama,stok").eq("brand_id", ctx.brandId).order("nama").limit(30);
    if (queryText) query = query.or(`nama.ilike.%${queryText}%,kode.ilike.%${queryText}%`);
    const { data: products, error } = await query;
    if (error) return { success: false, error: "Data stok tidak tersedia." };
    const productIds = (products ?? []).map((product) => product.id);
    const { data: variants, error: variantsError } = productIds.length ? await ctx.supabase.from("product_variants").select("product_id,sku,color,size,stock").eq("brand_id", ctx.brandId).in("product_id", productIds).order("sku") : { data: [], error: null };
    if (variantsError) return { success: false, error: "Data stok varian tidak tersedia." };
    return { success: true, data: { products: (products ?? []).map((product) => ({ ...product, variants: (variants ?? []).filter((variant) => variant.product_id === product.id) })) } };
  },
};
