"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useBrand } from "@/components/brand/BrandProvider";

type Product = { id: number; nama: string; stok: number };

export default function StockModal({ onClose }: { onClose: () => void }) {
  const { brand } = useBrand();
  const [products, setProducts] = useState<Product[]>([]); const [productId, setProductId] = useState(""); const [type, setType] = useState("MASUK"); const [quantity, setQuantity] = useState(""); const [notes, setNotes] = useState(""); const [saving, setSaving] = useState(false);
  async function loadProducts() { const { data, error } = await supabase.from("products").select("id,nama,stok").eq("brand_id", brand?.id ?? "").order("nama"); if (error) alert(error.message); else setProducts((data ?? []) as Product[]); }
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { if (brand) void loadProducts(); }, [brand?.id]);
  async function save() {
    if (!productId || !quantity || Number(quantity) <= 0) return alert("Produk dan jumlah wajib diisi.");
    setSaving(true);
    const { error } = await supabase.rpc("adjust_product_stock", { p_brand_id: brand?.id, p_product_id: Number(productId), p_type: type, p_quantity: Number(quantity), p_notes: notes || null });
    setSaving(false);
    if (error) return alert(error.message);
    alert("Stok produk berhasil diperbarui."); onClose(); window.location.reload();
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-lg rounded-xl bg-white p-6 text-gray-900 shadow-xl"><h2 className="mb-2 text-2xl font-bold">Pergerakan Stok</h2><p className="mb-6 text-sm text-gray-500">Perubahan stok berlaku untuk seluruh produk.</p><select value={productId} onChange={(event) => setProductId(event.target.value)} className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2"><option value="">Pilih Produk</option>{products.map((product) => <option key={product.id} value={product.id}>{product.nama} (stok {product.stok})</option>)}</select><select value={type} onChange={(event) => setType(event.target.value)} className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2"><option value="MASUK">Stok Masuk</option><option value="KELUAR">Stok Keluar</option><option value="RETUR">Retur</option></select><input type="number" min="1" placeholder="Jumlah" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2" /><textarea placeholder="Keterangan" value={notes} onChange={(event) => setNotes(event.target.value)} className="mb-6 w-full rounded-lg border border-gray-300 px-4 py-2" /><div className="flex justify-end gap-3"><button onClick={onClose} className="rounded-lg bg-gray-200 px-4 py-2">Batal</button><button disabled={saving} onClick={() => void save()} className="rounded-lg bg-pink-600 px-4 py-2 text-white hover:bg-pink-700 disabled:bg-pink-300">{saving ? "Menyimpan..." : "Simpan"}</button></div></div></div>;
}
