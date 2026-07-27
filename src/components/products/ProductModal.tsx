"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import VariantModal from "@/components/products/VariantModal";

type Product = { id?: number; kode: string; nama: string; kategori: string; harga: number; stok: number };
type Category = { id: number; nama: string };
type ProductModalProps = { onClose: () => void; refreshProducts: () => void; product?: Product | null };

export default function ProductModal({ onClose, refreshProducts, product }: ProductModalProps) {
  const [kode, setKode] = useState(product?.kode ?? "");
  const [nama, setNama] = useState(product?.nama ?? "");
  const [kategori, setKategori] = useState(product?.kategori ?? "");
  const [harga, setHarga] = useState(product ? String(product.harga) : "");
  const [stok, setStok] = useState(product ? String(product.stok) : "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [showVariants, setShowVariants] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadCategories() {
    const { data, error } = await supabase.from("categories").select("id,nama").order("nama");
    if (error) return alert(`Gagal memuat kategori: ${error.message}`);
    setCategories((data ?? []) as Category[]);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadCategories(); }, []);

  async function simpanProduk() {
    if (!kode.trim() || !nama.trim() || !kategori) return alert("SKU, nama, dan kategori wajib diisi.");
    if (Number(harga) < 0 || Number(stok) < 0) return alert("Harga dan stok tidak boleh negatif.");
    setSaving(true);
    const payload = { kode: kode.trim(), nama: nama.trim(), kategori, harga: Number(harga) };
    const { error } = product?.id
      ? await supabase.from("products").update(payload).eq("id", product.id)
      : await supabase.from("products").insert({ ...payload, stok: Number(stok) });
    if (!error && product?.id) {
      const { error: stockError } = await supabase.rpc("set_product_total_stock", {
        p_product_id: product.id,
        p_stock: Number(stok),
      });
      setSaving(false);
      if (stockError) return alert(`Gagal mengubah stok: ${stockError.message}`);
      alert("Produk berhasil diperbarui");
      refreshProducts();
      onClose();
      return;
    }
    setSaving(false);
    if (error) return alert(`Gagal menyimpan produk: ${error.message}`);
    alert(product?.id ? "Produk berhasil diperbarui" : "Produk berhasil ditambahkan");
    refreshProducts();
    onClose();
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-lg rounded-2xl border border-pink-100 bg-white p-5 text-gray-900 shadow-xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-bold">{product?.id ? "Edit Produk" : "Tambah Produk"}</h2><p className="mt-1 text-sm text-gray-500">Lengkapi data utama produk terlebih dahulu.</p></div><button onClick={onClose} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200">Tutup</button></div><div className="mt-6 space-y-4"><Field label="SKU produk" value={kode} onChange={setKode} placeholder="Contoh: GM-001" /><Field label="Nama produk" value={nama} onChange={setNama} placeholder="Contoh: Gamis Aisyah" /><label className="block text-sm font-semibold text-gray-700">Kategori<select value={kategori} onChange={(event) => setKategori(event.target.value)} className="mt-1.5 w-full rounded-xl border border-pink-200 bg-pink-50/40 px-3 py-2.5 text-gray-900 outline-none transition focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-100"><option value="">Pilih kategori</option>{categories.map((category) => <option key={category.id} value={category.nama}>{category.nama}</option>)}</select>{categories.length === 0 && <span className="mt-1.5 block text-xs font-normal text-amber-700">Belum ada kategori. <Link href="/categories" className="font-semibold underline">Tambah kategori dahulu</Link>.</span>}</label><div className="grid gap-4 sm:grid-cols-2"><Field label="Harga" value={harga} onChange={setHarga} placeholder="0" type="number" /><Field label="Stok awal / total" value={stok} onChange={setStok} placeholder="0" type="number" /></div></div><div className="mt-6 flex flex-wrap items-center gap-3 border-t border-pink-100 pt-5">{product?.id && <button onClick={() => setShowVariants(true)} className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-100">Kelola Variasi</button>}<div className="ml-auto flex gap-3"><button onClick={onClose} className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Batal</button><button disabled={saving || categories.length === 0} onClick={() => void simpanProduk()} className="rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:bg-pink-300">{saving ? "Menyimpan..." : "Simpan Produk"}</button></div></div></div>{showVariants && product?.id && <VariantModal product={product as Product & { id: number }} onClose={() => { setShowVariants(false); refreshProducts(); }} />}</div>;
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) { return <label className="block text-sm font-semibold text-gray-700">{label}<input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} min={type === "number" ? "0" : undefined} className="mt-1.5 w-full rounded-xl border border-pink-200 bg-pink-50/40 px-3 py-2.5 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-100" /></label>; }
