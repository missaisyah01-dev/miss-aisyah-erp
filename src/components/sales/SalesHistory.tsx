"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Transaction = {
  id: number;
  invoice_number: string;
  total: number;
  paid_amount: number;
  change_amount: number;
  payment_method: "CASH" | "QRIS" | "DEBIT";
  notes: string | null;
  created_at: string;
};

type TransactionItem = {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

type Period = "HARI_INI" | "MINGGU_INI" | "BULAN_INI" | "SEMUA";

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

function startOfPeriod(period: Period) {
  if (period === "SEMUA") return null;
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  if (period === "MINGGU_INI") date.setDate(date.getDate() - 6);
  if (period === "BULAN_INI") date.setDate(1);
  return date.toISOString();
}

export default function SalesHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [period, setPeriod] = useState<Period>("HARI_INI");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  async function fetchTransactions() {
    setLoading(true);
    let query = supabase
      .from("transactions")
      .select("id, invoice_number, total, paid_amount, change_amount, payment_method, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    const periodStart = startOfPeriod(period);
    if (periodStart) query = query.gte("created_at", periodStart);
    if (search.trim()) query = query.ilike("invoice_number", `%${search.trim()}%`);

    const { data, error } = await query;
    if (error) alert(`Gagal memuat riwayat penjualan: ${error.message}`);
    else setTransactions((data ?? []) as Transaction[]);
    setLoading(false);
  }

  // Filter memuat ulang data ketika halaman dibuka atau pilihannya berubah.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void fetchTransactions(); }, [period, search]);

  async function openDetail(transaction: Transaction) {
    setSelectedTransaction(transaction);
    setItems([]);
    setDetailLoading(true);
    const { data, error } = await supabase
      .from("transaction_items")
      .select("id, product_name, quantity, unit_price, subtotal")
      .eq("transaction_id", transaction.id)
      .order("id");
    if (error) alert(`Gagal memuat detail transaksi: ${error.message}`);
    else setItems((data ?? []) as TransactionItem[]);
    setDetailLoading(false);
  }

  const totalOmzet = useMemo(() => transactions.reduce((sum, transaction) => sum + Number(transaction.total), 0), [transactions]);
  const totalTransactions = transactions.length;

  return (
    <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Riwayat Penjualan</h2>
          <p className="mt-1 text-sm text-gray-500">Menampilkan maksimal 100 transaksi terbaru pada periode yang dipilih.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-right">
          <div><p className="text-xs text-gray-500">Transaksi</p><p className="font-bold text-gray-900">{totalTransactions}</p></div>
          <div><p className="text-xs text-gray-500">Omzet</p><p className="font-bold text-pink-600">{formatRupiah(totalOmzet)}</p></div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nomor invoice..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 md:max-w-sm" />
        <select value={period} onChange={(event) => setPeriod(event.target.value as Period)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900">
          <option value="HARI_INI">Hari ini</option>
          <option value="MINGGU_INI">7 hari terakhir</option>
          <option value="BULAN_INI">Bulan ini</option>
          <option value="SEMUA">Semua waktu</option>
        </select>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Waktu</th><th className="px-4 py-3">Pembayaran</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-center">Aksi</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Memuat transaksi…</td></tr> : transactions.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Belum ada transaksi pada periode ini.</td></tr> : transactions.map((transaction) => <tr key={transaction.id} className="border-t border-gray-100 hover:bg-pink-50"><td className="px-4 py-3 font-semibold text-gray-900">{transaction.invoice_number}</td><td className="px-4 py-3 text-gray-600">{new Date(transaction.created_at).toLocaleString("id-ID")}</td><td className="px-4 py-3"><span className="rounded-full bg-pink-100 px-2.5 py-1 text-xs font-medium text-pink-700">{transaction.payment_method}</span></td><td className="px-4 py-3 text-right font-semibold text-gray-900">{formatRupiah(Number(transaction.total))}</td><td className="px-4 py-3 text-center"><button onClick={() => void openDetail(transaction)} className="rounded-lg bg-pink-100 px-3 py-1.5 text-xs font-semibold text-pink-700 hover:bg-pink-200">Detail</button></td></tr>)}
          </tbody>
        </table>
      </div>

      {selectedTransaction && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-bold text-gray-900">Detail Transaksi</h3><p className="mt-1 text-sm text-gray-500">{selectedTransaction.invoice_number} · {new Date(selectedTransaction.created_at).toLocaleString("id-ID")}</p></div><button onClick={() => setSelectedTransaction(null)} className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">Tutup</button></div><div className="mt-5 space-y-3">{detailLoading ? <p className="py-8 text-center text-gray-500">Memuat item…</p> : items.map((item) => <div key={item.id} className="flex justify-between gap-4 border-b border-gray-100 pb-3"><div><p className="font-medium text-gray-900">{item.product_name}</p><p className="text-sm text-gray-500">{item.quantity} × {formatRupiah(Number(item.unit_price))}</p></div><p className="font-semibold text-gray-900">{formatRupiah(Number(item.subtotal))}</p></div>)}</div><div className="mt-5 border-t border-gray-200 pt-4"><div className="flex justify-between font-bold text-gray-900"><span>Total</span><span>{formatRupiah(Number(selectedTransaction.total))}</span></div><div className="mt-2 flex justify-between text-sm text-gray-600"><span>Dibayar</span><span>{formatRupiah(Number(selectedTransaction.paid_amount))}</span></div><div className="mt-1 flex justify-between text-sm text-gray-600"><span>Kembalian</span><span>{formatRupiah(Number(selectedTransaction.change_amount))}</span></div>{selectedTransaction.notes && <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">Catatan: {selectedTransaction.notes}</p>}</div></div></div>}
    </section>
  );
}
