"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import * as XLSX from "xlsx-js-style";
import { supabase } from "@/lib/supabase";
import { useBrand } from "@/components/brand/BrandProvider";

type Transaction = { id: number; total: number; paid_amount: number; payment_status: "LUNAS" | "BELUM_LUNAS" | "RETUR"; customer_name: string | null; payment_method: "CASH" | "QRIS" | "TRANSFER" | "PIUTANG"; created_at: string };
type Receivable = Pick<Transaction, "id" | "total" | "paid_amount" | "customer_name" | "created_at"> & { invoice_number: string };
type ReturnItem = { id: number; transaction_item_id: number; quantity: number; refund_amount: number; refund_method: string; reason: string | null; created_at: string; transaction_items: { transaction_id: number; product_name: string; variant_name: string | null; transactions: { id: number; invoice_number: string } | null } | null };
type ExportItem = { id: number; transaction_id: number; product_name: string; quantity: number; unit_price: number; subtotal: number; products: { kode: string } | { kode: string }[] | null; transactions: { customer_name: string | null; created_at: string; payment_status: Transaction["payment_status"] } | { customer_name: string | null; created_at: string; payment_status: Transaction["payment_status"] }[] | null };
type TopProduct = { product_id: number; product_name: string; total_quantity: number; total_revenue: number };
type Period = "HARI_INI" | "MINGGU_INI" | "BULAN_INI" | "SEMUA";

const formatRupiah = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
const shortDate = (date: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(date));
const startOfPeriod = (period: Period) => { if (period === "SEMUA") return null; const date = new Date(); date.setHours(0, 0, 0, 0); if (period === "MINGGU_INI") date.setDate(date.getDate() - 6); if (period === "BULAN_INI") date.setDate(1); return date.toISOString(); };

export default function SalesReport() {
  const { brand } = useBrand();
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
    let returnsQuery = supabase.from("transaction_returns").select("id,transaction_item_id,quantity,refund_amount,refund_method,reason,created_at,transaction_items(transaction_id,product_name,variant_name,transactions(id,invoice_number))").order("created_at", { ascending: false }).limit(50);
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
    const refundsByTransaction = returns.reduce<Record<number, number>>((all, item) => {
      const transactionId = item.transaction_items?.transaction_id;
      if (transactionId) all[transactionId] = (all[transactionId] ?? 0) + Number(item.refund_amount);
      return all;
    }, {});
    const grossOmzet = transactions.reduce((sum, item) => sum + Number(item.total), 0);
    const returnTotal = returns.reduce((sum, item) => sum + Number(item.refund_amount), 0);
    const omzet = grossOmzet - returnTotal;
    const paymentTotals = transactions.reduce<Record<string, number>>((all, item) => ({ ...all, [item.payment_method]: (all[item.payment_method] ?? 0) + Number(item.total) }), {});
    const dailyTotals = transactions.reduce<Record<string, number>>((all, item) => { const key = new Date(item.created_at).toLocaleDateString("en-CA"); all[key] = (all[key] ?? 0) + Number(item.total); return all; }, {});
    returns.forEach((item) => { const key = new Date(item.created_at).toLocaleDateString("en-CA"); dailyTotals[key] = (dailyTotals[key] ?? 0) - Number(item.refund_amount); });
    const lunas = transactions.filter((item) => item.payment_status === "LUNAS").reduce((sum, item) => sum + Math.max(0, Number(item.total) - (refundsByTransaction[item.id] ?? 0)), 0);
    const belumLunas = transactions.filter((item) => item.payment_status === "BELUM_LUNAS").reduce((sum, item) => sum + Math.max(0, Number(item.total) - (refundsByTransaction[item.id] ?? 0) - Number(item.paid_amount)), 0);
    return { grossOmzet, returnTotal, omzet, refundsByTransaction, paymentTotals, dailyTotals, lunas, belumLunas, average: transactions.length ? omzet / transactions.length : 0 };
  }, [returns, transactions]);

  const chartItems = Object.entries(summary.dailyTotals).map(([date, total]) => ({ date, label: shortDate(date), total })).slice(-14);
  const payments = ["CASH", "QRIS", "TRANSFER"].map((method) => ({ method, total: summary.paymentTotals[method] ?? 0 }));
  const paymentChart = payments.filter((item) => item.total > 0).map((item) => ({ ...item, name: item.method === "CASH" ? "Tunai" : item.method }));
  const receivableTotal = receivables.reduce((sum, item) => sum + Math.max(0, Number(item.total) - (summary.refundsByTransaction[item.id] ?? 0) - Number(item.paid_amount)), 0);
  const returnQuantity = returns.reduce((sum, item) => sum + Number(item.quantity), 0);
  const returnTotal = summary.returnTotal;

  async function exportExcel() {
    const transactionIds = transactions.map((transaction) => transaction.id);
    const { data, error } = transactionIds.length ? await supabase.from("transaction_items").select("id,transaction_id,product_name,quantity,unit_price,subtotal,products(kode),transactions!inner(customer_name,created_at,payment_status)").in("transaction_id", transactionIds).order("transaction_id") : { data: [], error: null };
    if (error) return alert(`Gagal menyiapkan ekspor Excel: ${error.message}`);
    const first = <T,>(value: T | T[] | null) => Array.isArray(value) ? value[0] ?? null : value;
    const returnedByItem = returns.reduce<Record<number, number>>((all, item) => ({ ...all, [item.transaction_item_id]: (all[item.transaction_item_id] ?? 0) + Number(item.quantity) }), {});
    const rows = ((data ?? []) as unknown as ExportItem[]).map((item) => {
      const transaction = first(item.transactions);
      const product = first(item.products);
      const returned = returnedByItem[item.id] ?? 0;
      const sold = Math.max(0, Number(item.quantity) - returned);
      return { date: transaction ? new Date(transaction.created_at) : null, customer: transaction?.customer_name ?? "-", product: item.product_name, code: product?.kode ?? "-", price: Number(item.unit_price), quantity: Number(item.quantity), returned, sold, total: Number(item.unit_price) * sold, status: transaction?.payment_status === "LUNAS" ? "L" : transaction?.payment_status === "RETUR" ? "R" : "BL" };
    });
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([]);
    const set = (address: string, value: string | number | Date | null, style: Record<string, unknown> = {}) => { sheet[address] = { t: value instanceof Date ? "d" : typeof value === "number" ? "n" : "s", v: value ?? "", s: style } as XLSX.CellObject; };
    const gray = "B7B7B7", yellow = "FFF200", green = "70AD47", red = "C00000", border = { style: "thin", color: { rgb: "9E9E9E" } };
    const periodLabel = period === "HARI_INI" ? new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" }).toUpperCase() : period.replaceAll("_", " ");
    sheet["!merges"] = ["D1:L1", "D2:L2", "A4:O4", "A5:B5", "C5:D5", "E5:F5", "H5:I5", "M5:N5", "Q4:R4", "Q5:R5"].map((range) => XLSX.utils.decode_range(range));
    set("D1", "LAPORAN PENJUALAN HARIAN", { font: { bold: true, sz: 16 }, alignment: { horizontal: "center" } });
    set("D2", "MISS AISYAH", { font: { bold: true, sz: 16 }, alignment: { horizontal: "center" } });
    set("A1", periodLabel, { font: { bold: true, sz: 14 } });
    set("A4", "DATA PENJUALAN HARIAN MISS AISYAH", { fill: { fgColor: { rgb: gray } }, font: { bold: true }, alignment: { horizontal: "center" }, border: { top: border, bottom: border, left: border, right: border } });
    [["L2", "SOLD", red], ["M2", "BRUTO", green], ["Q2", "LUNAS", green], ["R2", "BELUM LUNAS", red]].forEach(([address, value, color]) => set(address, value, { fill: { fgColor: { rgb: color as string } }, font: { bold: true, color: { rgb: "FFFFFF" } }, alignment: { horizontal: "center" }, border: { top: border, bottom: border, left: border, right: border } }));
    set("L3", rows.reduce((sum, row) => sum + row.sold, 0), { alignment: { horizontal: "center" }, border: { top: border, bottom: border, left: border, right: border } });
    set("M3", rows.reduce((sum, row) => sum + row.price * row.quantity, 0), { numFmt: '"Rp" #,##0', border: { top: border, bottom: border, left: border, right: border } });
    set("Q3", summary.lunas, { numFmt: '"Rp" #,##0', border: { top: border, bottom: border, left: border, right: border } });
    set("R3", summary.belumLunas, { numFmt: '"Rp" #,##0', border: { top: border, bottom: border, left: border, right: border } });
    set("Q4", "JUMLAH YANG HARUS ADA", { fill: { fgColor: { rgb: yellow } }, font: { bold: true }, alignment: { horizontal: "center" }, border: { top: border, bottom: border, left: border, right: border } });
    set("Q5", summary.omzet, { numFmt: '"Rp" #,##0', font: { bold: true }, border: { top: border, bottom: border, left: border, right: border } });
    const headers = [["A5", "Tanggal", gray], ["C5", "Nama Pembeli", gray], ["E5", "Nama Produk", gray], ["G5", "Kode", gray], ["H5", "Harga Jual", yellow], ["J5", "Quantity", gray], ["K5", "Return", gray], ["L5", "Terjual", gray], ["M5", "Total", gray], ["O5", "Keterangan", gray]];
    headers.forEach(([address, value, color]) => set(address, value, { fill: { fgColor: { rgb: color } }, font: { bold: true }, alignment: { horizontal: "center", vertical: "center" }, border: { top: border, bottom: border, left: border, right: border } }));
    rows.forEach((row, index) => {
      const rowNumber = index + 6;
      [["A", row.date, "dd/mm/yyyy"], ["C", row.customer], ["E", row.product], ["G", row.code], ["H", "Rp"], ["I", row.price, "#,##0"], ["J", row.quantity], ["K", row.returned], ["L", row.sold], ["M", "Rp"], ["N", row.total, "#,##0"], ["O", row.status]].forEach(([column, value, numFmt]) => set(`${column}${rowNumber}`, value as string | number | Date | null, { numFmt: numFmt as string | undefined, alignment: { horizontal: ["H", "I", "J", "K", "L", "M", "N", "O"].includes(column as string) ? "center" : "left" }, border: { top: border, bottom: border, left: border, right: border } }));
      ["A:B", "C:D", "E:F"].forEach((columns) => sheet["!merges"]?.push(XLSX.utils.decode_range(`${columns.split(":")[0]}${rowNumber}:${columns.split(":")[1]}${rowNumber}`)));
    });
    // SheetJS tidak memperluas area data secara otomatis ketika sel ditulis manual.
    // Tanpa referensi ini Excel hanya membuka A1 dan seluruh tabel tampak kosong.
    sheet["!ref"] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 17, r: Math.max(5, rows.length + 5) } });
    sheet["!cols"] = [12, 3, 18, 3, 22, 3, 12, 4, 12, 10, 10, 10, 4, 14, 14, 3, 16, 18].map((wch) => ({ wch }));
    sheet["!rows"] = [{ hpt: 22 }, { hpt: 24 }, { hpt: 20 }, { hpt: 20 }, { hpt: 22 }];
    sheet["!autofilter"] = { ref: `A5:O${Math.max(6, rows.length + 5)}` };
    XLSX.utils.book_append_sheet(workbook, sheet, "Laporan Harian");
    const brandSlug = (brand?.slug || brand?.name || "brand").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    XLSX.writeFile(workbook, `laporan-penjualan-${brandSlug}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return <section className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-bold text-gray-900">Laporan Penjualan</h1><p className="mt-1 text-gray-500">Ringkasan penjualan, retur, dan piutang MISS AISYAH.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={exportExcel} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100">Ekspor Excel</button><select value={period} onChange={(event) => setPeriod(event.target.value as Period)} className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm"><option value="HARI_INI">Hari ini</option><option value="MINGGU_INI">7 hari terakhir</option><option value="BULAN_INI">Bulan ini</option><option value="SEMUA">Semua waktu</option></select></div></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><SummaryCard label="Omzet bersih" value={formatRupiah(summary.omzet)} accent="text-pink-600" /><SummaryCard label="Jumlah total lunas" value={formatRupiah(summary.lunas)} accent="text-emerald-700" /><SummaryCard label="Jumlah belum lunas" value={formatRupiah(summary.belumLunas)} accent="text-amber-700" /><SummaryCard label="Jumlah transaksi" value={String(transactions.length)} /><SummaryCard label="Rata-rata transaksi" value={formatRupiah(summary.average)} /></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"><section className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-gray-900">Tren Omzet Harian</h2><p className="mt-1 text-sm text-gray-500">Arahkan kursor ke titik grafik untuk melihat detail.</p>{loading ? <p className="py-28 text-center text-gray-500">Memuat laporan...</p> : chartItems.length === 0 ? <p className="py-28 text-center text-gray-500">Belum ada data penjualan pada periode ini.</p> : <div className="mt-6 min-h-72 flex-1"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartItems} margin={{ top: 8, right: 8, left: 8 }}><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} /><YAxis tickLine={false} axisLine={false} width={54} tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fontSize: 12, fill: "#6b7280" }} /><Tooltip formatter={(value) => formatRupiah(Number(value))} labelFormatter={(value) => `Tanggal ${value}`} contentStyle={{ borderRadius: 12, borderColor: "#fbcfe8" }} /><Line type="monotone" dataKey="total" name="Omzet" stroke="#db2777" strokeWidth={3} dot={{ r: 4, fill: "#db2777" }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div>}</section>
      <div className="space-y-6"><section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-gray-900">Metode Pembayaran</h2>{paymentChart.length === 0 ? <p className="py-12 text-center text-sm text-gray-500">Belum ada pembayaran.</p> : <div className="mt-3 h-52"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={paymentChart} dataKey="total" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={3}>{paymentChart.map((item, index) => <Cell key={item.method} fill={["#db2777", "#7c3aed", "#0f766e"][index]} />)}</Pie><Tooltip formatter={(value) => formatRupiah(Number(value))} contentStyle={{ borderRadius: 12, borderColor: "#fbcfe8" }} /><Legend /></PieChart></ResponsiveContainer></div>}<div className="mt-2 space-y-2">{payments.map((payment) => <div key={payment.method} className="flex justify-between text-sm"><span className="text-gray-600">{payment.method === "CASH" ? "Tunai" : payment.method}</span><span className="font-semibold text-gray-900">{formatRupiah(payment.total)}</span></div>)}</div></section><section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-gray-900">Produk Terlaris</h2>{loading ? <p className="py-8 text-center text-sm text-gray-500">Memuat...</p> : topProducts.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">Belum ada produk terjual.</p> : <div className="mt-4 h-52"><ResponsiveContainer width="100%" height="100%"><BarChart data={topProducts.slice().reverse()} layout="vertical" margin={{ right: 12 }}><XAxis type="number" hide /><YAxis type="category" dataKey="product_name" width={105} tick={{ fontSize: 11, fill: "#4b5563" }} tickLine={false} axisLine={false} /><Tooltip formatter={(value) => [`${value} pcs`, "Terjual"]} /><Bar dataKey="total_quantity" name="Terjual" fill="#db2777" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div>}</section></div></div>
    <div className="grid gap-6 xl:grid-cols-2"><ReportTable title="Laporan Piutang Aktif" subtitle={`${receivables.length} transaksi belum lunas · ${formatRupiah(receivableTotal)}`} empty="Tidak ada piutang aktif." headers={["Invoice / pelanggan", "Tanggal", "Sisa"]} rows={receivables.map((item) => [`${item.invoice_number}${item.customer_name ? ` · ${item.customer_name}` : ""}`, new Date(item.created_at).toLocaleDateString("id-ID"), formatRupiah(Math.max(0, Number(item.total) - Number(item.paid_amount)))])} /><ReportTable title="Laporan Retur" subtitle={`${returnQuantity} barang diretur · ${formatRupiah(returnTotal)}`} empty="Belum ada retur pada periode ini." headers={["Invoice / produk", "Jumlah", "Refund", "Metode"]} rows={returns.map((item) => [`${item.transaction_items?.transactions?.invoice_number ?? "-"} · ${item.transaction_items?.product_name ?? "Produk"}${item.transaction_items?.variant_name ? ` · ${item.transaction_items.variant_name}` : ""}`, `${item.quantity} pcs`, formatRupiah(Number(item.refund_amount)), item.refund_method])} /></div>
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="border-b border-gray-100 p-5"><h2 className="text-lg font-bold text-gray-900">Transaksi Terbaru</h2></div><div className="max-h-[32rem] overflow-auto"><table className="w-full min-w-[620px] text-sm"><thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Waktu</th><th className="px-5 py-3">Metode</th><th className="px-5 py-3 text-right">Total</th></tr></thead><tbody>{transactions.slice().reverse().slice(0, 10).map((transaction) => <tr key={transaction.id} className="border-t border-gray-100"><td className="px-5 py-3 text-gray-700">{new Date(transaction.created_at).toLocaleString("id-ID")}</td><td className="px-5 py-3"><span className="rounded-full bg-pink-100 px-2.5 py-1 text-xs font-medium text-pink-700">{transaction.payment_method}</span></td><td className="px-5 py-3 text-right font-semibold text-gray-900">{formatRupiah(Number(transaction.total))}</td></tr>)}{!loading && transactions.length === 0 && <tr><td colSpan={3} className="px-5 py-10 text-center text-gray-500">Belum ada transaksi.</td></tr>}</tbody></table></div></section>
  </section>;
}

function SummaryCard({ label, value, accent = "text-gray-900" }: { label: string; value: string; accent?: string }) { return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">{label}</p><p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p></div>; }
function ReportTable({ title, subtitle, headers, rows, empty }: { title: string; subtitle: string; headers: string[]; rows: string[][]; empty: string }) { return <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="border-b border-gray-100 p-5"><h2 className="text-lg font-bold text-gray-900">{title}</h2><p className="mt-1 text-sm text-gray-500">{subtitle}</p></div><div className="max-h-[32rem] overflow-auto"><table className="w-full min-w-[440px] text-sm"><thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr>{headers.map((header) => <th key={header} className="px-5 py-3">{header}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={`${title}-${index}`} className="border-t border-gray-100">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-5 py-3 text-gray-700">{cell}</td>)}</tr>) : <tr><td colSpan={headers.length} className="px-5 py-10 text-center text-gray-500">{empty}</td></tr>}</tbody></table></div></section>; }
