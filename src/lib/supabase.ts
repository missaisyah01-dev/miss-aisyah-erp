import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const brandScopedTables = new Set(["products", "categories", "product_variants", "product_custom_prices", "stock_movements", "transactions", "transaction_items", "transaction_payments", "transaction_returns"]);

// A final client-side guard: every REST request for tenant data includes the
// selected brand, including future feature queries that use this shared client.
const brandScopedFetch: typeof fetch = (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof Request ? input.url : input.toString());
  const table = url.pathname.split("/").pop() ?? "";
  if (url.pathname.includes("/rpc/") && init?.body && typeof init.body === "string" && typeof window !== "undefined") {
    const brandId = window.localStorage.getItem("active-brand-id");
    if (brandId) { try { const body = JSON.parse(init.body) as Record<string, unknown>; if (!("p_brand_id" in body)) return fetch(url.toString(), { ...init, body: JSON.stringify({ ...body, p_brand_id: brandId }) }); } catch { /* non-JSON RPC body */ } }
  }
  if (brandScopedTables.has(table) && !url.searchParams.has("brand_id") && typeof window !== "undefined") {
    const brandId = window.localStorage.getItem("active-brand-id");
    if (brandId) url.searchParams.set("brand_id", `eq.${brandId}`);
  }
  return fetch(url.toString(), init);
};

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  { global: { fetch: brandScopedFetch } },
);
