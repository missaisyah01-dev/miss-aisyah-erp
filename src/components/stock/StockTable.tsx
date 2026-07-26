"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Movement = {
  id: number;
  product_id: number;
  tipe: "MASUK" | "KELUAR" | "RETUR";
  jumlah: number;
  keterangan: string | null;
  created_at: string;
  products: { nama: string } | null;
  product_variants: { sku: string; color: string; size: string } | null;
};

export default function StockTable() {
  const [data, setData] = useState<Movement[]>([]);
  const [type, setType] = useState("SEMUA");
  const [period, setPeriod] = useState("SEMUA");

  useEffect(() => {
    async function load() {
      let query = supabase
        .from("stock_movements")
        .select("id,product_id,tipe,jumlah,keterangan,created_at,products(nama),product_variants(sku,color,size)")
        .order("created_at", { ascending: false });
      if (type !== "SEMUA") query = query.eq("tipe", type);
      if (period !== "SEMUA") {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        if (period === "MINGGU_INI") date.setDate(date.getDate() - 7);
        if (period === "BULAN_INI") date.setDate(date.getDate() - 30);
        query = query.gte("created_at", date.toISOString());
      }
      const { data: movements, error } = await query;
      if (error) alert(error.message);
      else setData((movements ?? []) as Movement[]);
    }
    void load();
  }, [type, period]);

  return <section className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:justify-end">
      <select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-xl border border-gray-300 px-3 py-2 text-sm"><option value="SEMUA">Semua waktu</option><option value="HARI_INI">Hari ini</option><option value="MINGGU_INI">Minggu ini</option><option value="BULAN_INI">Bulan ini</option></select>
      <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-xl border border-gray-300 px-3 py-2 text-sm"><option value="SEMUA">Semua tipe</option><option value="MASUK">Stok masuk</option><option value="KELUAR">Stok keluar</option><option value="RETUR">Retur</option></select>
    </div>
    <table className="w-full min-w-[700px] text-sm"><thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Produk / Varian</th><th className="px-5 py-3">Tipe</th><th className="px-5 py-3 text-right">Jumlah</th><th className="px-5 py-3">Keterangan</th><th className="px-5 py-3">Tanggal</th></tr></thead><tbody>
      {data.length ? data.map((movement) => <tr key={movement.id} className="border-t border-gray-100 hover:bg-pink-50"><td className="px-5 py-3 font-semibold text-gray-900"><p>{movement.products?.nama ?? `Produk #${movement.product_id}`}</p>{movement.product_variants && <p className="mt-0.5 text-xs font-normal text-pink-700">{movement.product_variants.color} / {movement.product_variants.size} · {movement.product_variants.sku}</p>}</td><td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${movement.tipe === "MASUK" ? "bg-emerald-100 text-emerald-700" : movement.tipe === "KELUAR" ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"}`}>{movement.tipe}</span></td><td className="px-5 py-3 text-right font-semibold">{movement.jumlah}</td><td className="px-5 py-3 text-gray-600">{movement.keterangan || "-"}</td><td className="px-5 py-3 text-gray-600">{new Date(movement.created_at).toLocaleString("id-ID")}</td></tr>) : <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-500">Belum ada riwayat stok.</td></tr>}
    </tbody></table>
  </section>;
}
