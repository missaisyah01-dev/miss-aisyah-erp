"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import DashboardCards from "@/components/dashboard/DashboardCards";
import StockChart from "@/components/dashboard/StockChart";
import TopProducts from "@/components/dashboard/TopProducts";
import RecentActivity from "@/components/dashboard/RecentActivity";
import LowStockAlert from "@/components/dashboard/LowStockAlert";
import { supabase } from "@/lib/supabase";

type Product = { id: number; kode: string; nama: string; stok: number; harga?: number };
type Movement = { tipe: "MASUK" | "KELUAR" | "RETUR"; jumlah: number; created_at: string; products: { nama: string } | null };
type TopProduct = { product_name: string; total_quantity: number; total_revenue: number };
type ChartItem = { name: string; masuk: number; keluar: number };
const emptyChart: ChartItem[] = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((name) => ({ name, masuk: 0, keluar: 0 }));

export default function Home() {
  const [totalProduk, setTotalProduk] = useState(0); const [totalStok, setTotalStok] = useState(0); const [stokMasuk, setStokMasuk] = useState(0); const [stokKeluar, setStokKeluar] = useState(0); const [stokMenipis, setStokMenipis] = useState(0); const [stokHabis, setStokHabis] = useState(0);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]); const [activities, setActivities] = useState<{ product: string; tipe: string; jumlah: number; created_at: string }[]>([]); const [chartData, setChartData] = useState<ChartItem[]>(emptyChart); const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [lowStockThreshold] = useState(() => {
    if (typeof window === "undefined") return 5;
    try { return Math.max(0, Number(JSON.parse(window.localStorage.getItem("miss-aisyah-preferences") ?? "{}").lowStock ?? 5)); } catch { return 5; }
  });

  useEffect(() => {
    async function loadDashboard() {
      const [countResult, productsResult, movementsResult, topProductsResult] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("products").select("id,kode,nama,stok").order("stok", { ascending: true }),
        supabase.from("stock_movements").select("tipe,jumlah,created_at,products(nama)").order("created_at", { ascending: false }),
        supabase.rpc("get_top_selling_products", { p_start: null, p_limit: 5 }),
      ]);
      setTotalProduk(countResult.count ?? 0);
      const products = (productsResult.data ?? []) as Product[];
      setTotalStok(products.reduce((sum, product) => sum + Number(product.stok), 0));
      setStokMenipis(products.filter((product) => Number(product.stok) <= lowStockThreshold).length);
      setStokHabis(products.filter((product) => Number(product.stok) === 0).length);
      if (topProductsResult.error) alert(`Gagal memuat produk terlaris: ${topProductsResult.error.message}`); else setTopProducts((topProductsResult.data ?? []) as TopProduct[]);
      setLowStockProducts(products.filter((product) => Number(product.stok) <= lowStockThreshold).slice(0, 8));
      const movements = (movementsResult.data ?? []) as Movement[];
      setActivities(movements.slice(0, 5).map((movement) => ({ product: movement.products?.nama ?? "-", tipe: movement.tipe, jumlah: Number(movement.jumlah), created_at: movement.created_at })));
      setStokMasuk(movements.filter((movement) => movement.tipe === "MASUK").reduce((sum, movement) => sum + Number(movement.jumlah), 0));
      setStokKeluar(movements.filter((movement) => movement.tipe === "KELUAR").reduce((sum, movement) => sum + Number(movement.jumlah), 0));
      const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      const chart = emptyChart.map((item) => ({ ...item }));
      movements.forEach((movement) => { const item = chart.find((entry) => entry.name === days[new Date(movement.created_at).getDay()]); if (!item) return; if (movement.tipe === "MASUK") item.masuk += Number(movement.jumlah); if (movement.tipe === "KELUAR") item.keluar += Number(movement.jumlah); });
      setChartData(chart);
    }
    void loadDashboard();
  }, [lowStockThreshold]);

  return <div className="flex min-h-screen bg-gray-100"><Sidebar /><div className="min-w-0 flex-1"><Header /><main className="p-5 pb-24 md:p-8"><DashboardCards totalProduk={totalProduk} totalStok={totalStok} stokMasuk={stokMasuk} stokKeluar={stokKeluar} stokMenipis={stokMenipis} stokHabis={stokHabis} /><div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"><StockChart data={chartData} /><LowStockAlert products={lowStockProducts} threshold={lowStockThreshold} /></div><div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2"><TopProducts products={topProducts} /><RecentActivity activities={activities} /></div><div className="mt-8 rounded-xl bg-white p-6 shadow"><h2 className="text-xl font-bold">Selamat Datang</h2><p className="mt-2 text-gray-600">Pilih menu di sidebar untuk mengelola produk, stok, transaksi, dan laporan.</p></div></main></div></div>;
}
