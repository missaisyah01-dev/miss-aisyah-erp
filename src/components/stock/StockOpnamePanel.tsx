"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useBrand } from "@/components/brand/BrandProvider";

type Row = { id: number; sku: string; color: string; size: string; stock: number; products: { nama: string } | { nama: string }[] | null };
const first = <T,>(value: T | T[] | null) => Array.isArray(value) ? value[0] ?? null : value;

export default function StockOpnamePanel({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { brand } = useBrand();
  const [rows, setRows] = useState<Row[]>([]);
  const [physical, setPhysical] = useState<Record<number, string>>({});
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("product_variants").select("id,sku,color,size,stock,products(nama)").eq("brand_id", brand?.id ?? "").order("product_id").order("color").order("size");
    if (error) alert(`Gagal memuat stok: ${error.message}`); else {
      const next = (data ?? []) as unknown as Row[];
      setRows(next);
      setPhysical(Object.fromEntries(next.map((row) => [row.id, String(row.stock)])));
    }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { if (brand) void load(); }, [brand?.id]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("id-ID");
    return rows.filter((row) => !keyword || `${first(row.products)?.nama ?? ""} ${row.sku} ${row.color} ${row.size}`.toLocaleLowerCase("id-ID").includes(keyword));
  }, [rows, search]);
  const changed = rows.flatMap((row) => {
    const value = physical[row.id];
    const physicalStock = Number(value);
    return Number.isInteger(physicalStock) && physicalStock >= 0 && physicalStock !== Number(row.stock) ? [{ variant_id: row.id, physical_stock: physicalStock }] : [];
  });

  async function save() {
    if (!changed.length) return alert("Belum ada selisih stok yang perlu diterapkan.");
    if (!confirm(`Terapkan ${changed.length} penyesuaian stok hasil opname?`)) return;
    setSaving(true);
    const { data, error } = await supabase.rpc("record_stock_opname", { p_brand_id: brand?.id, p_items: changed, p_notes: notes || null });
    setSaving(false);
    if (error) return alert(`Gagal menyimpan stok opname: ${error.message}`);
    alert(`${data ?? changed.length} stok varian berhasil disesuaikan.`);
    onSuccess();
    onClose();
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><section className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white text-gray-900 shadow-xl"><div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-2xl font-bold">Stok Opname</h2><p className="mt-1 text-sm text-gray-500">Isi stok fisik untuk seluruh varian. Hanya selisih yang akan disesuaikan.</p></div><button onClick={onClose} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium">Tutup</button></div><div className="flex flex-col gap-3 border-b p-5 sm:flex-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari produk, SKU, warna, atau ukuran..." className="w-full rounded-xl border border-gray-300 px-3 py-2.5 sm:max-w-md" /><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Catatan opname (opsional)" className="min-h-11 flex-1 rounded-xl border border-gray-300 px-3 py-2.5" /></div><div className="min-h-0 flex-1 overflow-auto"><table className="w-full min-w-[800px] text-sm"><thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Produk / varian</th><th className="px-5 py-3">SKU</th><th className="px-5 py-3 text-right">Stok sistem</th><th className="px-5 py-3 text-right">Stok fisik</th><th className="px-5 py-3 text-right">Selisih</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-500">Memuat stok...</td></tr> : filtered.map((row) => { const physicalStock = Number(physical[row.id]); const difference = Number.isInteger(physicalStock) ? physicalStock - Number(row.stock) : null; return <tr key={row.id} className="border-t border-gray-100"><td className="px-5 py-3"><b>{first(row.products)?.nama ?? "Produk"}</b><small className="block text-pink-700">{row.color} / {row.size}</small></td><td className="px-5 py-3 text-gray-600">{row.sku}</td><td className="px-5 py-3 text-right font-semibold">{row.stock}</td><td className="px-5 py-2 text-right"><input value={physical[row.id] ?? ""} onChange={(event) => setPhysical((current) => ({ ...current, [row.id]: event.target.value.replace(/\D/g, "") }))} inputMode="numeric" className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-right" /></td><td className={`px-5 py-3 text-right font-bold ${difference === null || difference === 0 ? "text-gray-500" : difference > 0 ? "text-emerald-700" : "text-red-700"}`}>{difference === null ? "-" : difference > 0 ? `+${difference}` : difference}</td></tr>; })}{!loading && filtered.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-500">Varian tidak ditemukan.</td></tr>}</tbody></table></div><div className="flex flex-col gap-3 border-t p-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-gray-600"><b>{changed.length}</b> varian memiliki selisih stok.</p><div className="flex gap-3"><button onClick={onClose} className="rounded-xl border border-gray-300 px-4 py-2.5 font-semibold text-gray-700">Batal</button><button disabled={saving || !changed.length} onClick={() => void save()} className="rounded-xl bg-pink-600 px-4 py-2.5 font-semibold text-white disabled:bg-pink-300">{saving ? "Menyimpan..." : "Terapkan stok opname"}</button></div></div></section></div>;
}
