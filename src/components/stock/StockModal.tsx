"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useBrand } from "@/components/brand/BrandProvider";

type Product = { id: number; nama: string };
type Variant = { id: number; sku: string; color: string; size: string; stock: number };

export default function StockModal({ onClose }: { onClose: () => void }) {
  const { brand } = useBrand();
  const [products, setProducts] = useState<Product[]>([]); const [variants, setVariants] = useState<Variant[]>([]);
  const [productId, setProductId] = useState(""); const [variantId, setVariantId] = useState(""); const [type, setType] = useState("MASUK"); const [quantity, setQuantity] = useState(""); const [notes, setNotes] = useState(""); const [saving, setSaving] = useState(false);
  async function loadProducts() { const { data, error } = await supabase.from("products").select("id, nama").eq("brand_id", brand?.id ?? "").order("nama"); if (error) alert(error.message); else setProducts((data ?? []) as Product[]); }
  async function loadVariants(id: string) { setVariants([]); setVariantId(""); if (!id) return; const { data, error } = await supabase.from("product_variants").select("id, sku, color, size, stock").eq("brand_id", brand?.id ?? "").eq("product_id", id).order("color"); if (error) alert(error.message); else setVariants((data ?? []) as Variant[]); }
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { if (brand) void loadProducts(); }, [brand?.id]);
  async function save() {
    if (!productId || !variantId || !quantity || Number(quantity) <= 0) return alert("Produk, varian, dan jumlah wajib diisi.");
    if (!variants.some((variant) => variant.id === Number(variantId))) return;
    setSaving(true);
    const { error } = await supabase.rpc("adjust_variant_stock", { p_brand_id: brand?.id, p_variant_id: Number(variantId), p_type: type, p_quantity: Number(quantity), p_notes: notes || null });
    setSaving(false);
    if (error) return alert(error.message);
    alert("Stok varian berhasil diperbarui."); onClose(); window.location.reload();
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-lg rounded-xl bg-white p-6 text-gray-900 shadow-xl"><h2 className="mb-6 text-2xl font-bold">Pergerakan Stok Varian</h2><select value={productId} onChange={(event) => { setProductId(event.target.value); void loadVariants(event.target.value); }} className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2"><option value="">Pilih Produk</option>{products.map((product) => <option key={product.id} value={product.id}>{product.nama}</option>)}</select><select disabled={!productId} value={variantId} onChange={(event) => setVariantId(event.target.value)} className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 disabled:bg-gray-100"><option value="">Pilih Warna / Ukuran</option>{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.color} / {variant.size} — {variant.sku} (stok {variant.stock})</option>)}</select><select value={type} onChange={(event) => setType(event.target.value)} className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2"><option value="MASUK">Stok Masuk</option><option value="KELUAR">Stok Keluar</option><option value="RETUR">Retur</option></select><input type="number" min="1" placeholder="Jumlah" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2" /><textarea placeholder="Keterangan" value={notes} onChange={(event) => setNotes(event.target.value)} className="mb-6 w-full rounded-lg border border-gray-300 px-4 py-2" /><div className="flex justify-end gap-3"><button onClick={onClose} className="rounded-lg bg-gray-200 px-4 py-2">Batal</button><button disabled={saving} onClick={() => void save()} className="rounded-lg bg-pink-600 px-4 py-2 text-white hover:bg-pink-700 disabled:bg-pink-300">{saving ? "Menyimpan…" : "Simpan"}</button></div></div></div>;
}
