"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/lib/supabase";

type Transaction = { id: number; total: number; payment_method: "CASH" | "QRIS" | "DEBIT"; created_at: string };
type TopProduct = { product_id: number; product_name: string; total_quantity: number; total_revenue: number };
type Period = "HARI_INI" | "MINGGU_INI" | "BULAN_INI" | "SEMUA";
const formatRupiah = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
const shortDate = (date: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(date));
const startOfPeriod = (period: Period) => { if (period === "SEMUA") return null; const date = new Date(); date.setHours(0, 0, 0, 0); if (period === "MINGGU_INI") date.setDate(date.getDate() - 6); if (period === "BULAN_INI") date.setDate(1); return date.toISOString(); };

export default function SalesReport() {
  const [period, setPeriod] = useState<Period>("MINGGU_INI");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  async function loadReport() {
    setLoading(true); const start = startOfPeriod(period);
    let query = supabase.from("transactions").select("id, total, payment_method, created_at").order("created_at", { ascending: true }).limit(1000);
    if (start) query = query.gte("created_at", start);
    const [transactionsResult, productsResult] = await Promise.all([query, supabase.rpc("get_top_selling_products", { p_start: start, p_limit: 5 })]);
    if (transactionsResult.error) alert(`Gagal memuat laporan: ${transactionsResult.error.message}`); else setTransactions((transactionsResult.data ?? []) as Transaction[]);
    if (productsResult.error) alert(`Gagal memuat produk terlaris: ${productsResult.error.message}`); else setTopProducts((productsResult.data ?? []) as TopProduct[]);
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void loadReport(); }, [period]);
  const summary = useMemo(() => {
    const omzet = transactions.reduce((sum, item) => sum + Number(item.total), 0);
    const paymentTotals = transactions.reduce<Record<string, number>>((all, item) => ({ ...all, [item.payment_method]: (all[item.payment_method] ?? 0) + Number(item.total) }), {});
    const dailyTotals = transactions.reduce<Record<string, number>>((all, item) => { const key = new Date(item.created_at).toLocaleDateString("en-CA"); all[key] = (all[key] ?? 0) + Number(item.total); return all; }, {});
    return { omzet, paymentTotals, dailyTotals, average: transactions.length ? omzet / transactions.length : 0 };
  }, [transactions]);
  const chartItems = Object.entries(summary.dailyTotals).map(([date, total]) => ({ date, label: shortDate(date), total })).slice(-14);
  const payments = ["CASH", "QRIS", "DEBIT"].map((method) => ({ method, total: summary.paymentTotals[method] ?? 0 }));
  const paymentChart = payments.filter((item) => item.total > 0).map((item) => ({ ...item, name: item.method === "CASH" ? "Tunai" : item.method }));

  return <section className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-bold text-gray-900">Laporan Penjualan</h1><p className="mt-1 text-gray-500">Ringkasan performa penjualan MISS AISYAH.</p></div><select value={period} onChange={(event) => setPeriod(event.target.value as Period)} className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm"><option value="HARI_INI">Hari ini</option><option value="MINGGU_INI">7 hari terakhir</option><option value="BULAN_INI">Bulan ini</option><option value="SEMUA">Semua waktu</option></select></div>
    <div className="grid gap-4 md:grid-cols-3"><SummaryCard label="Omzet" value={formatRupiah(summary.omzet)} accent="text-pink-600" /><SummaryCard label="Jumlah transaksi" value={String(transactions.length)} /><SummaryCard label="Rata-rata transaksi" value={formatRupiah(summary.average)} /></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"><section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-gray-900">Tren Omzet Harian</h2><p className="mt-1 text-sm text-gray-500">Arahkan kursor ke titik grafik untuk melihat detail.</p>{loading ? <p className="py-28 text-center text-gray-500">Memuat laporan...</p> : chartItems.length === 0 ? <p className="py-28 text-center text-gray-500">Belum ada data penjualan pada periode ini.</p> : <div className="mt-6 h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartItems} margin={{ top: 8, right: 8, left: 8 }}><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} /><YAxis tickLine={false} axisLine={false} width={54} tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fontSize: 12, fill: "#6b7280" }} /><Tooltip formatter={(value) => formatRupiah(Number(value))} labelFormatter={(value) => `Tanggal ${value}`} contentStyle={{ borderRadius: 12, borderColor: "#fbcfe8" }} /><Line type="monotone" dataKey="total" name="Omzet" stroke="#db2777" strokeWidth={3} dot={{ r: 4, fill: "#db2777" }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div>}</section>
      <div className="space-y-6"><section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-gray-900">Metode Pembayaran</h2>{paymentChart.length === 0 ? <p className="py-12 text-center text-sm text-gray-500">Belum ada pembayaran.</p> : <div className="mt-3 h-52"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={paymentChart} dataKey="total" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={3}>{paymentChart.map((item, index) => <Cell key={item.method} fill={["#db2777", "#7c3aed", "#0f766e"][index]} />)}</Pie><Tooltip formatter={(value) => formatRupiah(Number(value))} contentStyle={{ borderRadius: 12, borderColor: "#fbcfe8" }} /><Legend /></PieChart></ResponsiveContainer></div>}<div className="mt-2 space-y-2">{payments.map((payment) => <div key={payment.method} className="flex justify-between text-sm"><span className="text-gray-600">{payment.method === "CASH" ? "Tunai" : payment.method}</span><span className="font-semibold text-gray-900">{formatRupiah(payment.total)}</span></div>)}</div></section><section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-gray-900">Produk Terlaris</h2>{loading ? <p className="py-8 text-center text-sm text-gray-500">Memuat...</p> : topProducts.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">Belum ada produk terjual.</p> : <div className="mt-4 h-52"><ResponsiveContainer width="100%" height="100%"><BarChart data={topProducts.slice().reverse()} layout="vertical" margin={{ right: 12 }}><XAxis type="number" hide /><YAxis type="category" dataKey="product_name" width={105} tick={{ fontSize: 11, fill: "#4b5563" }} tickLine={false} axisLine={false} /><Tooltip formatter={(value) => [`${value} pcs`, "Terjual"]} /><Bar dataKey="total_quantity" name="Terjual" fill="#db2777" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div>}</section></div></div>
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="border-b border-gray-100 p-5"><h2 className="text-lg font-bold text-gray-900">Transaksi Terbaru</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Waktu</th><th className="px-5 py-3">Metode</th><th className="px-5 py-3 text-right">Total</th></tr></thead><tbody>{transactions.slice().reverse().slice(0, 10).map((transaction) => <tr key={transaction.id} className="border-t border-gray-100"><td className="px-5 py-3 text-gray-700">{new Date(transaction.created_at).toLocaleString("id-ID")}</td><td className="px-5 py-3"><span className="rounded-full bg-pink-100 px-2.5 py-1 text-xs font-medium text-pink-700">{transaction.payment_method}</span></td><td className="px-5 py-3 text-right font-semibold text-gray-900">{formatRupiah(Number(transaction.total))}</td></tr>)}{!loading && transactions.length === 0 && <tr><td colSpan={3} className="px-5 py-10 text-center text-gray-500">Belum ada transaksi.</td></tr>}</tbody></table></div></section>
  </section>;
}
function SummaryCard({ label, value, accent = "text-gray-900" }: { label: string; value: string; accent?: string }) { return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">{label}</p><p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p></div>; }
