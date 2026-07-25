"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { supabase } from "@/lib/supabase";

export default function Home() {

  const [totalProduk, setTotalProduk] = useState(0);
  const [totalStok, setTotalStok] = useState(0);
  const [stokMasuk, setStokMasuk] = useState(0);
  const [stokKeluar, setStokKeluar] = useState(0);
  const [stokMenipis, setStokMenipis] = useState(0);
  const [stokHabis, setStokHabis] = useState(0);
  const [nilaiPersediaan, setNilaiPersediaan] = useState(0);

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

      const nilai = products.reduce(
        (sum: number, item: any) =>
          sum + (Number(item.stok) * Number(item.harga)),
        0
      );

      setTotalStok(total);
      setStokMenipis(menipis);
      setStokHabis(habis);
      setNilaiPersediaan(nilai);

    }

    // Ambil riwayat stok
    const { data: movements } = await supabase
      .from("stock_movements")
      .select("tipe,jumlah");

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

    }

  };

  return (

    <div className="flex min-h-screen bg-gray-100">

      <Sidebar />

      <div className="flex-1">

        <Header />

        <main className="p-8">

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl bg-white p-5 shadow">
              <h3 className="text-gray-500">📦 Total Produk</h3>
              <p className="mt-2 text-3xl font-bold">{totalProduk}</p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow">
              <h3 className="text-gray-500">📦 Total Stok</h3>
              <p className="mt-2 text-3xl font-bold">{totalStok}</p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow">
              <h3 className="text-gray-500">📥 Total Stok Masuk</h3>
              <p className="mt-2 text-3xl font-bold">{stokMasuk}</p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow">
              <h3 className="text-gray-500">📤 Total Stok Keluar</h3>
              <p className="mt-2 text-3xl font-bold">{stokKeluar}</p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow">
              <h3 className="text-gray-500">⚠️ Stok Menipis</h3>
              <p className="mt-2 text-3xl font-bold">{stokMenipis}</p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow">
              <h3 className="text-gray-500">❌ Stok Habis</h3>
              <p className="mt-2 text-3xl font-bold">{stokHabis}</p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow">
              <h3 className="text-gray-500">💰 Nilai Persediaan</h3>
              <p className="mt-2 text-3xl font-bold">
                Rp {nilaiPersediaan.toLocaleString("id-ID")}
              </p>
            </div>

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