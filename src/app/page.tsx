"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import DashboardCards from "@/components/dashboard/DashboardCards";
import StockChart from "@/components/dashboard/StockChart";
import TopProducts from "@/components/dashboard/TopProducts";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { supabase } from "@/lib/supabase";

export default function Home() {

  const [totalProduk, setTotalProduk] = useState(0);
  const [totalStok, setTotalStok] = useState(0);
  const [stokMasuk, setStokMasuk] = useState(0);
  const [stokKeluar, setStokKeluar] = useState(0);
  const [stokMenipis, setStokMenipis] = useState(0);
  const [stokHabis, setStokHabis] = useState(0);
  const [topProducts, setTopProducts] = useState<
  { nama: string; stok: number }[]
>([]);
  const [activities, setActivities] = useState<any[]>([]);

  const [chartData, setChartData] = useState([
    { name: "Sen", masuk: 0, keluar: 0 },
    { name: "Sel", masuk: 0, keluar: 0 },
    { name: "Rab", masuk: 0, keluar: 0 },
    { name: "Kam", masuk: 0, keluar: 0 },
    { name: "Jum", masuk: 0, keluar: 0 },
    { name: "Sab", masuk: 0, keluar: 0 },
    { name: "Min", masuk: 0, keluar: 0 },
  ]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {

    // Total Produk
    const { count: produk } = await supabase
      .from("products")
      .select("*", {
        count: "exact",
        head: true,
      });

    setTotalProduk(produk || 0);

    // Ambil semua produk
    const { data: products } = await supabase
      .from("products")
      .select("stok,harga");

    if (products) {

      const total = products.reduce(
        (sum: number, item: any) => sum + Number(item.stok),
        0
      );

      const menipis = products.filter(
        (item: any) => Number(item.stok) <= 5
      ).length;

      const habis = products.filter(
        (item: any) => Number(item.stok) === 0
      ).length;

      setTotalStok(total);
      setStokMenipis(menipis);
      setStokHabis(habis);

      const { data: top } = await supabase
  .from("products")
  .select("nama,stok")
  .order("stok", { ascending: false })
  .limit(5);

setTopProducts(top || []);

const { data: activity } = await supabase
  .from("stock_movements")
  .select(`
    tipe,
    jumlah,
    created_at,
    products (
      nama
    )
  `)
  .order("created_at", {
    ascending: false,
  })
  .limit(5);

if (activity) {

  const formatted = activity.map((item: any) => ({
    product: item.products?.nama || "-",
    tipe: item.tipe,
    jumlah: item.jumlah,
    created_at: item.created_at,
  }));

  setActivities(formatted);

}

  }

    // Ambil riwayat stok
    const { data: movements } = await supabase
      .from("stock_movements")
      .select("tipe,jumlah,created_at");

    if (movements) {

      const masuk = movements
        .filter((item: any) => item.tipe === "MASUK")
        .reduce(
          (sum: number, item: any) => sum + Number(item.jumlah),
          0
        );

      const keluar = movements
        .filter((item: any) => item.tipe === "KELUAR")
        .reduce(
          (sum: number, item: any) => sum + Number(item.jumlah),
          0
        );

      setStokMasuk(masuk);
      setStokKeluar(keluar);

      const hari = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const chart = [
  { name: "Sen", masuk: 0, keluar: 0 },
  { name: "Sel", masuk: 0, keluar: 0 },
  { name: "Rab", masuk: 0, keluar: 0 },
  { name: "Kam", masuk: 0, keluar: 0 },
  { name: "Jum", masuk: 0, keluar: 0 },
  { name: "Sab", masuk: 0, keluar: 0 },
  { name: "Min", masuk: 0, keluar: 0 },
];

movements.forEach((item: any) => {

  const namaHari = hari[new Date(item.created_at).getDay()];

  const index = chart.findIndex(
    (x) => x.name === namaHari
  );

  if (index === -1) return;

  if (item.tipe === "MASUK") {
    chart[index].masuk += Number(item.jumlah);
  }

  if (item.tipe === "KELUAR") {
    chart[index].keluar += Number(item.jumlah);
  }

});

setChartData(chart);

    }

  };

  return (

    <div className="flex min-h-screen bg-gray-100">

      <Sidebar />

      <div className="min-w-0 flex-1">

        <Header />

        <main className="p-5 pb-24 md:p-8">

          <DashboardCards
            totalProduk={totalProduk}
            totalStok={totalStok}
            stokMasuk={stokMasuk}
            stokKeluar={stokKeluar}
            stokMenipis={stokMenipis}
            stokHabis={stokHabis}
          />

          <StockChart data={chartData} />

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">

  <TopProducts
    products={topProducts}
  />

  <RecentActivity
    activities={activities}
  />

</div>
          <div className="mt-8 rounded-xl bg-white p-6 shadow">

            <h2 className="text-xl font-bold">
              Selamat Datang 👋
            </h2>

            <p className="mt-2 text-gray-600">
              Selamat datang di MISS AISYAH.
              Pilih menu di sidebar untuk mengelola produk,
              stok, transaksi, dan laporan.
            </p>

          </div>

        </main>

      </div>

    </div>

  );

}
