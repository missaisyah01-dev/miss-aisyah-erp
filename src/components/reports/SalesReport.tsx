"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Transaction = { id: number; total: number; payment_method: "CASH" | "QRIS" | "DEBIT"; created_at: string };
type Period = "HARI_INI" | "MINGGU_INI" | "BULAN_INI" | "SEMUA";

const formatRupiah = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
const shortDate = (date: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(date));

function startOfPeriod(period: Period) {
  if (period === "SEMUA") return null;
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  if (period === "MINGGU_INI") date.setDate(date.getDate() - 6);
  if (period === "BULAN_INI") date.setDate(1);
  return date.toISOString();
}

export default function SalesReport() {
  const [period, setPeriod] = useState<Period>("MINGGU_INI");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReport() {
    setLoading(true);
    let query = supabase.from("transactions").select("id, total, payment_method, created_at").order("created_at", { ascending: true }).limit(1000);
    const start = startOfPeriod(period);
    if (start) query = query.gte("created_at", start);
    const { data, error } = await query;
    if (error) alert(`Gagal memuat laporan: ${error.message}`);
    else setTransactions((data ?? []) as Transaction[]);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void loadReport(); }, [period]);

  const summary = useMemo(() => {
    const omzet = transactions.reduce((sum, transaction) => sum + Number(transaction.total), 0);
    const paymentTotals = transactions.reduce<Record<string, number>>((totals, transaction) => {
      totals[transaction.payment_method] = (totals[transaction.payment_method] ?? 0) + Number(transaction.total);
      return totals;
    }, {});
    const dailyTotals = transactions.reduce<Record<string, number>>((totals, transaction) => {
      const key = new Date(transaction.created_at).toLocaleDateString("en-CA");
      totals[key] = (totals[key] ?? 0) + Number(transaction.total);
      return totals;
    }, {});
    return { omzet, paymentTotals, dailyTotals, average: transactions.length ? omzet / transactions.length : 0 };
  }, [transactions]);

  const chartItems = Object.entries(summary.dailyTotals).map(([date, total]) => ({ date, total })).slice(-14);
  const largestDailyTotal = Math.max(...chartItems.map((item) => item.total), 1);
  const payments = ["CASH", "QRIS", "DEBIT"].map((method) => ({ method, total: summary.paymentTotals[method] ?? 0 }));

  return <section className="space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-bold text-gray-900">Laporan Penjualan</h1><p className="mt-1 text-gray-500">Ringkasan performa penjualan MISS AISYAH.</p></div><select value={period} onChange={(event) => setPeriod(event.target.value as Period)} className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm"><option value="HARI_INI">Hari ini</option><option value="MINGGU_INI">7 hari terakhir</option><option value="BULAN_INI">Bulan ini</option><option value="SEMUA">Semua waktu</option></select></div>
    <div className="grid gap-4 md:grid-cols-3"><SummaryCard label="Omzet" value={formatRupiah(summary.omzet)} accent="text-pink-600" /><SummaryCard label="Jumlah transaksi" value={String(transactions.length)} /><SummaryCard label="Rata-rata transaksi" value={formatRupiah(summary.average)} /></div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"><section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-gray-900">Tren Omzet Harian</h2><p className="mt-1 text-sm text-gray-500">Berdasarkan transaksi pada periode terpilih.</p>{loading ? <p className="py-20 text-center text-gray-500">Memuat laporan…</p> : chartItems.length === 0 ? <p className="py-20 text-center text-gray-500">Belum ada data penjualan pada periode ini.</p> : <div className="mt-7 flex h-60 items-end gap-2 border-b border-gray-200 pb-7">{chartItems.map((item) => <div key={item.date} className="flex h-full min-w-0 flex-1 flex-col justify-end"><p className="mb-2 truncate text-center text-xs font-medium text-gray-600">{formatRupiah(item.total)}</p><div title={`${shortDate(item.date)}: ${formatRupiah(item.total)}`} style={{ height: `${Math.max((item.total / largestDailyTotal) * 100, 5)}%` }} className="rounded-t-md bg-pink-500 transition hover:bg-pink-600" /><p className="mt-2 text-center text-xs text-gray-500">{shortDate(item.date)}</p></div>)}</div>}</section>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-gray-900">Metode Pembayaran</h2><div className="mt-5 space-y-5">{payments.map((payment) => <div key={payment.method}><div className="flex justify-between text-sm"><span className="font-medium text-gray-700">{payment.method === "CASH" ? "Tunai" : payment.method}</span><span className="font-semibold text-gray-900">{formatRupiah(payment.total)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-pink-500" style={{ width: `${summary.omzet ? (payment.total / summary.omzet) * 100 : 0}%` }} /></div></div>)}</div></section></div>
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="border-b border-gray-100 p-5"><h2 className="text-lg font-bold text-gray-900">Transaksi Terbaru</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Waktu</th><th className="px-5 py-3">Metode</th><th className="px-5 py-3 text-right">Total</th></tr></thead><tbody>{transactions.slice().reverse().slice(0, 10).map((transaction) => <tr key={transaction.id} className="border-t border-gray-100"><td className="px-5 py-3 text-gray-700">{new Date(transaction.created_at).toLocaleString("id-ID")}</td><td className="px-5 py-3"><span className="rounded-full bg-pink-100 px-2.5 py-1 text-xs font-medium text-pink-700">{transaction.payment_method}</span></td><td className="px-5 py-3 text-right font-semibold text-gray-900">{formatRupiah(Number(transaction.total))}</td></tr>)}{!loading && transactions.length === 0 && <tr><td colSpan={3} className="px-5 py-10 text-center text-gray-500">Belum ada transaksi.</td></tr>}</tbody></table></div></section>
  </section>;
}

function SummaryCard({ label, value, accent = "text-gray-900" }: { label: string; value: string; accent?: string }) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">{label}</p><p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p></div>;
}
