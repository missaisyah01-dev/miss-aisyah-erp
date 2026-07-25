"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = { id: number; kode: string; nama: string; harga: number };
type Variant = { id: number; sku: string; color: string; size: string; price: number; stock: number };

export default function VariantModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [sku, setSku] = useState(`${product.kode}-`);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState(String(product.harga));
  const [stock, setStock] = useState("0");
  const [saving, setSaving] = useState(false);

  async function loadVariants() {
    const { data, error } = await supabase.from("product_variants").select("id, sku, color, size, price, stock").eq("product_id", product.id).order("created_at");
    if (error) alert(`Gagal memuat varian: ${error.message}`); else setVariants((data ?? []) as Variant[]);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void loadVariants(); }, []);

  async function addVariant() {
    if (!sku.trim() || !color.trim() || !size.trim()) return alert("SKU, warna, dan ukuran wajib diisi.");
    setSaving(true);
    const { error } = await supabase.from("product_variants").insert({ product_id: product.id, sku: sku.trim(), color: color.trim(), size: size.trim(), price: Number(price), stock: Number(stock) });
    setSaving(false);
    if (error) return alert(`Gagal menambah varian: ${error.message}`);
    setSku(`${product.kode}-`); setColor(""); setSize(""); setPrice(String(product.harga)); setStock("0");
    void loadVariants();
  }

  async function deleteVariant(variant: Variant) {
    if (!confirm(`Hapus varian ${variant.color} / ${variant.size}?`)) return;
    const { error } = await supabase.from("product_variants").delete().eq("id", variant.id);
    if (error) return alert(`Gagal menghapus varian: ${error.message}`);
    void loadVariants();
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 text-gray-900 shadow-xl"><div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-bold">Varian Produk</h2><p className="mt-1 text-sm text-gray-500">{product.nama}</p></div><button onClick={onClose} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium">Tutup</button></div><div className="mt-6 grid gap-3 rounded-xl bg-pink-50 p-4 md:grid-cols-3"><input value={sku} onChange={(event) => setSku(event.target.value)} placeholder="SKU" className="rounded-lg border border-gray-300 px-3 py-2" /><input value={color} onChange={(event) => setColor(event.target.value)} placeholder="Warna" className="rounded-lg border border-gray-300 px-3 py-2" /><input value={size} onChange={(event) => setSize(event.target.value)} placeholder="Ukuran" className="rounded-lg border border-gray-300 px-3 py-2" /><input value={price} onChange={(event) => setPrice(event.target.value)} type="number" min="0" placeholder="Harga jual" className="rounded-lg border border-gray-300 px-3 py-2" /><input value={stock} onChange={(event) => setStock(event.target.value)} type="number" min="0" placeholder="Stok awal" className="rounded-lg border border-gray-300 px-3 py-2" /><button disabled={saving} onClick={() => void addVariant()} className="rounded-lg bg-pink-600 px-4 py-2 font-semibold text-white disabled:bg-pink-300">{saving ? "Menyimpan…" : "+ Tambah Varian"}</button></div><div className="mt-6 overflow-x-auto rounded-xl border border-gray-200"><table className="w-full min-w-[620px] text-sm"><thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Warna</th><th className="px-4 py-3">Ukuran</th><th className="px-4 py-3 text-right">Harga</th><th className="px-4 py-3 text-right">Stok</th><th className="px-4 py-3" /></tr></thead><tbody>{variants.map((variant) => <tr key={variant.id} className="border-t border-gray-100"><td className="px-4 py-3 font-medium">{variant.sku}</td><td className="px-4 py-3">{variant.color}</td><td className="px-4 py-3">{variant.size}</td><td className="px-4 py-3 text-right">Rp {Number(variant.price).toLocaleString("id-ID")}</td><td className="px-4 py-3 text-right">{variant.stock}</td><td className="px-4 py-3 text-right"><button onClick={() => void deleteVariant(variant)} className="text-sm font-semibold text-red-600 hover:text-red-700">Hapus</button></td></tr>)}{variants.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">Belum ada varian.</td></tr>}</tbody></table></div></div></div>;
}
