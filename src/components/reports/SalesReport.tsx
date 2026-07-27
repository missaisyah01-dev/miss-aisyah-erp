"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

type Transaction = { id: number; total: number; paid_amount: number; payment_status: "LUNAS" | "BELUM_LUNAS"; customer_name: string | null; payment_method: "CASH" | "QRIS" | "DEBIT" | "PIUTANG"; created_at: string };
type Receivable = Pick<Transaction, "id" | "total" | "paid_amount" | "customer_name" | "created_at"> & { invoice_number: string };
type ReturnItem = { id: number; quantity: number; refund_amount: number; refund_method: string; reason: string | null; created_at: string; transaction_items: { product_name: string; variant_name: string | null; transactions: { invoice_number: string } | null } | null };
type TopProduct = { product_id: number; product_name: string; total_quantity: number; total_revenue: number };
type Period = "HARI_INI" | "MINGGU_INI" | "BULAN_INI" | "SEMUA";

const formatRupiah = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
const shortDate = (date: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(date));
const startOfPeriod = (period: Period) => { if (period === "SEMUA") return null; const date = new Date(); date.setHours(0, 0, 0, 0); if (period === "MINGGU_INI") date.setDate(date.getDate() - 6); if (period === "BULAN_INI") date.setDate(1); return date.toISOString(); };

export default function SalesReport() {
  const [period, setPeriod] = useState<Period>("MINGGU_INI");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReport() {
    setLoading(true);
    const start = startOfPeriod(period);
    let transactionQuery = supabase.from("transactions").select("id,total,paid_amount,payment_status,customer_name,payment_method,created_at").order("created_at", { ascending: true }).limit(1000);
    let returnsQuery = supabase.from("transaction_returns").select("id,quantity,refund_amount,refund_method,reason,created_at,transaction_items(product_name,variant_name,transactions(invoice_number))").order("created_at", { ascending: false }).limit(50);
    if (start) { transactionQuery = transactionQuery.gte("created_at", start); returnsQuery = returnsQuery.gte("created_at", start); }
    const [transactionsResult, productsResult, receivablesResult, returnsResult] = await Promise.all([
      transactionQuery,
      supabase.rpc("get_top_selling_products", { p_start: start, p_limit: 5 }),
      supabase.from("transactions").select("id,invoice_number,total,paid_amount,customer_name,created_at").eq("payment_status", "BELUM_LUNAS").order("created_at", { ascending: false }).limit(50),
      returnsQuery,
    ]);
    if (transactionsResult.error) alert(`Gagal memuat laporan: ${transactionsResult.error.message}`); else setTransactions((transactionsResult.data ?? []) as Transaction[]);
    if (productsResult.error) alert(`Gagal memuat produk terlaris: ${productsResult.error.message}`); else setTopProducts((productsResult.data ?? []) as TopProduct[]);
    if (receivablesResult.error) alert(`Gagal memuat piutang: ${receivablesResult.error.message}`); else setReceivables((receivablesResult.data ?? []) as Receivable[]);
    if (returnsResult.error) alert(`Gagal memuat retur: ${returnsResult.error.message}`); else setReturns((returnsResult.data ?? []) as unknown as ReturnItem[]);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void loadReport(); }, [period]);

  const summary = useMemo(() => {
    const omzet = transactions.reduce((sum, item) => sum + Number(item.total), 0);
    const paymentTotals = transactions.reduce<Record<string, number>>((all, item) => ({ ...all, [item.payment_method]: (all[item.payment_method] ?? 0) + Number(item.total) }), {});
    const dailyTotals = transactions.reduce<Record<string, number>>((all, item) => { const key = new Date(item.created_at).toLocaleDateString("en-CA"); all[key] = (all[key] ?? 0) + Number(item.total); return all; }, {});
    const lunas = transactions.filter((item) => item.payment_status === "LUNAS").reduce((sum, item) => sum + Number(item.total), 0);
    const belumLunas = transactions.filter((item) => item.payment_status === "BELUM_LUNAS").reduce((sum, item) => sum + Math.max(0, Number(item.total) - Number(item.paid_amount)), 0);
    return { omzet, paymentTotals, dailyTotals, lunas, belumLunas, average: transactions.length ? omzet / transactions.length : 0 };
  }, [transactions]);

  const chartItems = Object.entries(summary.dailyTotals).map(([date, total]) => ({ date, label: shortDate(date), total })).slice(-14);
  const payments = ["CASH", "QRIS", "DEBIT"].map((method) => ({ method, total: summary.paymentTotals[method] ?? 0 }));
  const paymentChart = payments.filter((item) => item.total > 0).map((item) => ({ ...item, name: item.method === "CASH" ? "Tunai" : item.method }));
  const receivableTotal = receivables.reduce((sum, item) => sum + Math.max(0, Number(item.total) - Number(item.paid_amount)), 0);
  const returnQuantity = returns.reduce((sum, item) => sum + Number(item.quantity), 0);
  const returnTotal = returns.reduce((sum, item) => sum + Number(item.refund_amount), 0);

  function exportExcel() {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ Periode: period.replaceAll("_", " "), Omzet: summary.omzet, "Jumlah total lunas": summary.lunas, "Jumlah belum lunas": summary.belumLunas, "Jumlah transaksi": transactions.length, "Rata-rata transaksi": summary.average }]), "Ringkasan");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(transactions.map((item) => ({ Tanggal: new Date(item.created_at).toLocaleString("id-ID"), Total: Number(item.total), Dibayar: Number(item.paid_amount), Status: item.payment_status, Metode: item.payment_method, Pelanggan: item.customer_name ?? "" }))), "Transaksi");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(receivables.map((item) => ({ Invoice: item.invoice_number, Pelanggan: item.customer_name ?? "", Tanggal: new Date(item.created_at).toLocaleDateString("id-ID"), Sisa: Math.max(0, Number(item.total) - Number(item.paid_amount)) }))), "Piutang");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(returns.map((item) => ({ Invoice: item.transaction_items?.transactions?.invoice_number ?? "", Produk: item.transaction_items?.product_name ?? "", Varian: item.transaction_items?.variant_name ?? "", Jumlah: Number(item.quantity), Refund: Number(item.refund_amount), Metode: item.refund_method, Alasan: item.reason ?? "", Tanggal: new Date(item.created_at).toLocaleString("id-ID") }))), "Retur");
    XLSX.writeFile(workbook, `laporan-penjualan-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return <section className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-bold text-gray-900">Laporan Penjualan</h1><p className="mt-1 text-gray-500">Ringkasan penjualan, retur, dan piutang MISS AISYAH.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={exportExcel} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100">Ekspor Excel</button><select value={period} onChange={(event) => setPeriod(event.target.value as Period)} className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm"><option value="HARI_INI">Hari ini</option><option value="MINGGU_INI">7 hari terakhir</option><option value="BULAN_INI">Bulan ini</option><option value="SEMUA">Semua waktu</option></select></div></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><SummaryCard label="Omzet" value={formatRupiah(summary.omzet)} accent="text-pink-600" /><SummaryCard label="Jumlah total lunas" value={formatRupiah(summary.lunas)} accent="text-emerald-700" /><SummaryCard label="Jumlah belum lunas" value={formatRupiah(summary.belumLunas)} accent="text-amber-700" /><SummaryCard label="Jumlah transaksi" value={String(transactions.length)} /><SummaryCard label="Rata-rata transaksi" value={formatRupiah(summary.average)} /></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"><section className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-gray-900">Tren Omzet Harian</h2><p className="mt-1 text-sm text-gray-500">Arahkan kursor ke titik grafik untuk melihat detail.</p>{loading ? <p className="py-28 text-center text-gray-500">Memuat laporan...</p> : chartItems.length === 0 ? <p className="py-28 text-center text-gray-500">Belum ada data penjualan pada periode ini.</p> : <div className="mt-6 min-h-72 flex-1"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartItems} margin={{ top: 8, right: 8, left: 8 }}><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} /><YAxis tickLine={false} axisLine={false} width={54} tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fontSize: 12, fill: "#6b7280" }} /><Tooltip formatter={(value) => formatRupiah(Number(value))} labelFormatter={(value) => `Tanggal ${value}`} contentStyle={{ borderRadius: 12, borderColor: "#fbcfe8" }} /><Line type="monotone" dataKey="total" name="Omzet" stroke="#db2777" strokeWidth={3} dot={{ r: 4, fill: "#db2777" }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div>}</section>
      <div className="space-y-6"><section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-gray-900">Metode Pembayaran</h2>{paymentChart.length === 0 ? <p className="py-12 text-center text-sm text-gray-500">Belum ada pembayaran.</p> : <div className="mt-3 h-52"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={paymentChart} dataKey="total" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={3}>{paymentChart.map((item, index) => <Cell key={item.method} fill={["#db2777", "#7c3aed", "#0f766e"][index]} />)}</Pie><Tooltip formatter={(value) => formatRupiah(Number(value))} contentStyle={{ borderRadius: 12, borderColor: "#fbcfe8" }} /><Legend /></PieChart></ResponsiveContainer></div>}<div className="mt-2 space-y-2">{payments.map((payment) => <div key={payment.method} className="flex justify-between text-sm"><span className="text-gray-600">{payment.method === "CASH" ? "Tunai" : payment.method}</span><span className="font-semibold text-gray-900">{formatRupiah(payment.total)}</span></div>)}</div></section><section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-gray-900">Produk Terlaris</h2>{loading ? <p className="py-8 text-center text-sm text-gray-500">Memuat...</p> : topProducts.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">Belum ada produk terjual.</p> : <div className="mt-4 h-52"><ResponsiveContainer width="100%" height="100%"><BarChart data={topProducts.slice().reverse()} layout="vertical" margin={{ right: 12 }}><XAxis type="number" hide /><YAxis type="category" dataKey="product_name" width={105} tick={{ fontSize: 11, fill: "#4b5563" }} tickLine={false} axisLine={false} /><Tooltip formatter={(value) => [`${value} pcs`, "Terjual"]} /><Bar dataKey="total_quantity" name="Terjual" fill="#db2777" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div>}</section></div></div>
    <div className="grid gap-6 xl:grid-cols-2"><ReportTable title="Laporan Piutang Aktif" subtitle={`${receivables.length} transaksi belum lunas · ${formatRupiah(receivableTotal)}`} empty="Tidak ada piutang aktif." headers={["Invoice / pelanggan", "Tanggal", "Sisa"]} rows={receivables.map((item) => [`${item.invoice_number}${item.customer_name ? ` · ${item.customer_name}` : ""}`, new Date(item.created_at).toLocaleDateString("id-ID"), formatRupiah(Math.max(0, Number(item.total) - Number(item.paid_amount)))])} /><ReportTable title="Laporan Retur" subtitle={`${returnQuantity} barang diretur · ${formatRupiah(returnTotal)}`} empty="Belum ada retur pada periode ini." headers={["Invoice / produk", "Jumlah", "Refund", "Metode"]} rows={returns.map((item) => [`${item.transaction_items?.transactions?.invoice_number ?? "-"} · ${item.transaction_items?.product_name ?? "Produk"}${item.transaction_items?.variant_name ? ` · ${item.transaction_items.variant_name}` : ""}`, `${item.quantity} pcs`, formatRupiah(Number(item.refund_amount)), item.refund_method])} /></div>
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="border-b border-gray-100 p-5"><h2 className="text-lg font-bold text-gray-900">Transaksi Terbaru</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Waktu</th><th className="px-5 py-3">Metode</th><th className="px-5 py-3 text-right">Total</th></tr></thead><tbody>{transactions.slice().reverse().slice(0, 10).map((transaction) => <tr key={transaction.id} className="border-t border-gray-100"><td className="px-5 py-3 text-gray-700">{new Date(transaction.created_at).toLocaleString("id-ID")}</td><td className="px-5 py-3"><span className="rounded-full bg-pink-100 px-2.5 py-1 text-xs font-medium text-pink-700">{transaction.payment_method}</span></td><td className="px-5 py-3 text-right font-semibold text-gray-900">{formatRupiah(Number(transaction.total))}</td></tr>)}{!loading && transactions.length === 0 && <tr><td colSpan={3} className="px-5 py-10 text-center text-gray-500">Belum ada transaksi.</td></tr>}</tbody></table></div></section>
  </section>;
}

function SummaryCard({ label, value, accent = "text-gray-900" }: { label: string; value: string; accent?: string }) { return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">{label}</p><p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p></div>; }
function ReportTable({ title, subtitle, headers, rows, empty }: { title: string; subtitle: string; headers: string[]; rows: string[][]; empty: string }) { return <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="border-b border-gray-100 p-5"><h2 className="text-lg font-bold text-gray-900">{title}</h2><p className="mt-1 text-sm text-gray-500">{subtitle}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[440px] text-sm"><thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr>{headers.map((header) => <th key={header} className="px-5 py-3">{header}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={`${title}-${index}`} className="border-t border-gray-100">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-5 py-3 text-gray-700">{cell}</td>)}</tr>) : <tr><td colSpan={headers.length} className="px-5 py-10 text-center text-gray-500">{empty}</td></tr>}</tbody></table></div></section>; }
