"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Transaction = { invoice_number: string; customer_name: string | null; created_at: string };
type Item = { id: number; product_name: string; variant_name: string | null; quantity: number; unit_price: number; transactions: Transaction | Transaction[] | null };
type ReturnRecord = { transaction_item_id: number; quantity: number };
type ReturnStatus = "SEMUA" | "BELUM_RETUR" | "SUDAH_RETUR";
type Period = "HARI_INI" | "MINGGU_INI" | "BULAN_INI" | "SEMUA";
type ReturnItem = Item & { returnedQuantity: number; remainingQuantity: number };

const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
const first = <T,>(value: T | T[] | null) => Array.isArray(value) ? value[0] ?? null : value;
const startOfPeriod = (period: Period) => { if (period === "SEMUA") return null; const date = new Date(); date.setHours(0, 0, 0, 0); if (period === "MINGGU_INI") date.setDate(date.getDate() - 6); if (period === "BULAN_INI") date.setDate(1); return date; };

export default function ReturnsPanel() {
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [selected, setSelected] = useState<ReturnItem | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [method, setMethod] = useState("CASH");
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReturnStatus>("BELUM_RETUR");
  const [period, setPeriod] = useState<Period>("HARI_INI");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [itemsResult, returnsResult] = await Promise.all([
      supabase.from("transaction_items").select("id,product_name,variant_name,quantity,unit_price,transactions!inner(invoice_number,customer_name,created_at)").order("created_at", { ascending: false }).limit(200),
      supabase.from("transaction_returns").select("transaction_item_id,quantity").limit(1000),
    ]);
    if (itemsResult.error) alert(`Gagal memuat item retur: ${itemsResult.error.message}`);
    if (returnsResult.error) alert(`Gagal memuat riwayat retur: ${returnsResult.error.message}`);
    if (!itemsResult.error && !returnsResult.error) {
      const returnedByItem = new Map<number, number>();
      ((returnsResult.data ?? []) as ReturnRecord[]).forEach((record) => returnedByItem.set(record.transaction_item_id, (returnedByItem.get(record.transaction_item_id) ?? 0) + Number(record.quantity)));
      setItems(((itemsResult.data ?? []) as unknown as Item[]).map((item) => {
        const returnedQuantity = returnedByItem.get(item.id) ?? 0;
        return { ...item, returnedQuantity, remainingQuantity: Math.max(0, Number(item.quantity) - returnedQuantity) };
      }));
    }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("id-ID");
    const start = startOfPeriod(period);
    return items.filter((item) => {
      const transaction = first(item.transactions);
      const matchesStatus = status === "SEMUA" || (status === "BELUM_RETUR" ? item.remainingQuantity > 0 : item.returnedQuantity > 0);
      const matchesPeriod = !start || (transaction ? new Date(transaction.created_at) >= start : false);
      const text = [transaction?.invoice_number, transaction?.customer_name, item.product_name, item.variant_name].filter(Boolean).join(" ").toLocaleLowerCase("id-ID");
      return matchesStatus && matchesPeriod && (!keyword || text.includes(keyword));
    });
  }, [items, period, search, status]);

  const pendingCount = items.filter((item) => item.remainingQuantity > 0).length;
  const returnedCount = items.filter((item) => item.returnedQuantity > 0).length;

  async function submit() {
    if (!selected) return;
    const count = Number(quantity);
    if (!Number.isInteger(count) || count < 1 || count > selected.remainingQuantity) return alert("Jumlah retur tidak valid.");
    setSaving(true);
    const { error } = await supabase.rpc("return_transaction_item", { p_transaction_item_id: selected.id, p_quantity: count, p_refund_method: method, p_reason: reason || null });
    setSaving(false);
    if (error) return alert(`Retur gagal: ${error.message}`);
    alert(`Retur ${rupiah(Number(selected.unit_price) * count)} berhasil dicatat dan stok dikembalikan.`);
    setSelected(null);
    setReason("");
    void load();
  }

  return <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><h2 className="text-xl font-bold text-gray-900">Retur barang</h2><p className="mt-1 text-sm text-gray-500">Pantau item yang masih dapat diretur dan riwayat retur yang sudah diproses.</p></div><div className="grid grid-cols-2 gap-3 text-right"><div><p className="text-xs text-gray-500">Belum selesai</p><p className="font-bold text-amber-700">{pendingCount}</p></div><div><p className="text-xs text-gray-500">Pernah diretur</p><p className="font-bold text-violet-700">{returnedCount}</p></div></div></div><div className="mt-5 flex flex-col gap-3 md:flex-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari invoice, pembeli, atau produk..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 md:max-w-md" /><select value={period} onChange={(event) => setPeriod(event.target.value as Period)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"><option value="HARI_INI">Hari ini</option><option value="MINGGU_INI">7 hari terakhir</option><option value="BULAN_INI">Bulan ini</option><option value="SEMUA">Semua waktu</option></select><div className="flex flex-wrap gap-2" aria-label="Filter status retur"><FilterButton active={status === "BELUM_RETUR"} onClick={() => setStatus("BELUM_RETUR")} label="Belum retur" /><FilterButton active={status === "SUDAH_RETUR"} onClick={() => setStatus("SUDAH_RETUR")} label="Sudah diretur" /><FilterButton active={status === "SEMUA"} onClick={() => setStatus("SEMUA")} label="Semua" /></div></div><div className="mt-5 max-h-[32rem] overflow-auto rounded-xl border border-gray-200"><table className="w-full min-w-[840px] text-sm"><thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">Invoice / pembeli</th><th className="px-4 py-3">Produk</th><th className="px-4 py-3">Status retur</th><th className="px-4 py-3 text-right">Harga</th><th className="px-4 py-3 text-center">Aksi</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Memuat item transaksi...</td></tr> : filteredItems.length ? filteredItems.map((item) => { const transaction = first(item.transactions); const fullyReturned = item.remainingQuantity === 0; return <tr key={item.id} className="border-t border-gray-100 hover:bg-pink-50"><td className="px-4 py-3"><b>{transaction?.invoice_number ?? "-"}</b><small className="block text-gray-600">{transaction?.customer_name || "Pembeli tidak dicatat"}</small><small className="block text-gray-500">{transaction ? new Date(transaction.created_at).toLocaleDateString("id-ID") : ""}</small></td><td className="px-4 py-3"><b>{item.product_name}</b>{item.variant_name && <small className="block text-pink-700">{item.variant_name}</small>}<small className="block text-gray-500">Terjual {item.quantity} pcs</small></td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.returnedQuantity === 0 ? "bg-amber-100 text-amber-800" : fullyReturned ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"}`}>{item.returnedQuantity === 0 ? "Belum diretur" : fullyReturned ? "Sudah diretur" : "Retur sebagian"}</span>{item.returnedQuantity > 0 && <small className="mt-1 block text-gray-500">Diretur {item.returnedQuantity} dari {item.quantity} pcs</small>}</td><td className="px-4 py-3 text-right font-semibold">{rupiah(Number(item.unit_price))}</td><td className="px-4 py-3 text-center">{item.remainingQuantity > 0 ? <button onClick={() => { setSelected(item); setQuantity("1"); setMethod("CASH"); setReason(""); }} className="rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-200">Proses retur</button> : <span className="text-xs font-semibold text-violet-700">Selesai</span>}</td></tr>; }) : <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Tidak ada item yang sesuai filter.</td></tr>}</tbody></table></div>{selected && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"><div className="flex justify-between gap-4"><div><h3 className="text-lg font-bold">Catat retur</h3><p className="mt-1 text-sm text-gray-600">{selected.product_name} {selected.variant_name ? `(${selected.variant_name})` : ""}</p></div><button onClick={() => setSelected(null)} className="rounded-lg bg-gray-100 px-3 py-2 text-sm">Tutup</button></div><p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Sisa yang bisa diretur: <b>{selected.remainingQuantity} pcs</b></p><label className="mt-4 block text-sm font-medium text-gray-700">Jumlah (maks. {selected.remainingQuantity})<input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min="1" max={selected.remainingQuantity} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5" /></label><label className="mt-3 block text-sm font-medium text-gray-700">Metode pengembalian dana<select value={method} onChange={(event) => setMethod(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5"><option value="CASH">Tunai</option><option value="QRIS">QRIS</option><option value="TRANSFER">Transfer</option></select></label><label className="mt-3 block text-sm font-medium text-gray-700">Alasan retur<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Contoh: ukuran tidak sesuai" className="mt-1 min-h-20 w-full rounded-xl border border-gray-300 px-3 py-2.5" /></label><p className="mt-3 rounded-xl bg-violet-50 p-3 text-sm text-violet-900">Dana tercatat: <b>{rupiah(Number(selected.unit_price) * (Number(quantity) || 0))}</b></p><button disabled={saving} onClick={() => void submit()} className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white disabled:bg-violet-300">{saving ? "Menyimpan..." : "Konfirmasi retur"}</button></div></div>}</section>;
}

function FilterButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) { return <button onClick={onClick} className={active ? "rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white" : "rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"}>{label}</button>; }
