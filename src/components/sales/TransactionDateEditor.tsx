"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useBrand } from "@/components/brand/BrandProvider";
import { supabase } from "@/lib/supabase";

type Transaction = { id: number; invoice_number: string; customer_name: string | null; created_at: string; total: number };

function toDateTimeInput(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export default function TransactionDateEditor() {
  const { profile } = useAuth();
  const { brand } = useBrand();
  const [open, setOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const canEdit = profile?.role === "OWNER" || profile?.role === "ADMIN";

  async function load() {
    if (!brand) return;
    const { data, error } = await supabase.from("transactions").select("id,invoice_number,customer_name,created_at,total").eq("brand_id", brand.id).order("created_at", { ascending: false }).limit(100);
    if (error) return alert(`Gagal memuat transaksi: ${error.message}`);
    setTransactions((data ?? []) as Transaction[]);
  }

  function openEditor() {
    setOpen(true);
    void load();
  }

  function selectTransaction(transaction: Transaction) {
    setSelected(transaction);
    setDate(toDateTimeInput(transaction.created_at));
  }

  async function save() {
    if (!brand || !selected || !date) return;
    setSaving(true);
    const { error } = await supabase.rpc("update_transaction_date", { p_brand_id: brand.id, p_transaction_id: selected.id, p_created_at: new Date(date).toISOString() });
    setSaving(false);
    if (error) return alert(`Gagal mengubah tanggal transaksi: ${error.message}`);
    setSelected(null);
    await load();
  }

  if (!canEdit) return null;
  return <><button type="button" onClick={openEditor} className="rounded-xl border border-pink-200 bg-pink-50 px-4 py-2.5 text-sm font-semibold text-pink-700 hover:bg-pink-100">Ubah tanggal transaksi</button>{open && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"><section className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"><header className="flex items-start justify-between border-b p-5"><div><h2 className="text-xl font-bold">Ubah tanggal transaksi</h2><p className="mt-1 text-sm text-gray-500">Tanggal saja yang diubah; nominal, item, pembayaran, dan stok tetap sama.</p></div><button type="button" onClick={() => { setOpen(false); setSelected(null); }} className="rounded-lg bg-gray-100 px-3 py-2 text-sm">Tutup</button></header><div className="min-h-0 flex-1 overflow-auto p-5"><div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_240px]"><div className="overflow-hidden rounded-xl border border-gray-200"><table className="w-full text-sm"><thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-3 py-3">Invoice</th><th className="px-3 py-3">Tanggal</th><th className="px-3 py-3 text-right">Aksi</th></tr></thead><tbody>{transactions.map((transaction) => <tr key={transaction.id} className="border-t"><td className="px-3 py-3"><b>{transaction.invoice_number}</b>{transaction.customer_name && <small className="block text-gray-500">{transaction.customer_name}</small>}</td><td className="px-3 py-3 text-gray-600">{new Date(transaction.created_at).toLocaleString("id-ID")}</td><td className="px-3 py-3 text-right"><button type="button" onClick={() => selectTransaction(transaction)} className="font-semibold text-pink-700">Pilih</button></td></tr>)}{!transactions.length && <tr><td colSpan={3} className="px-3 py-8 text-center text-gray-500">Belum ada transaksi.</td></tr>}</tbody></table></div><div className="h-fit rounded-xl bg-pink-50 p-4"><h3 className="font-semibold">{selected ? selected.invoice_number : "Pilih transaksi"}</h3>{selected ? <><label className="mt-4 block text-sm font-medium">Tanggal dan waktu<input type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" /></label><button type="button" disabled={saving || !date} onClick={() => void save()} className="mt-4 w-full rounded-lg bg-pink-600 px-3 py-2.5 text-sm font-semibold text-white disabled:bg-pink-300">{saving ? "Menyimpan..." : "Simpan tanggal"}</button></> : <p className="mt-2 text-sm text-gray-600">Pilih transaksi dari daftar untuk mengubah tanggalnya.</p>}</div></div></div></section></div>}</>;
}
