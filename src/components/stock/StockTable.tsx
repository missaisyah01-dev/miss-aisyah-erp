"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StockTable() {

  const [data, setData] = useState<any[]>([]);
  const [filterTipe, setFilterTipe] = useState("SEMUA");
  const [filterTanggal, setFilterTanggal] = useState("SEMUA");

  useEffect(() => {
    fetchData();
  }, [filterTipe, filterTanggal]);

  const fetchData = async () => {

    let query = supabase
      .from("stock_movements")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

   if (filterTipe !== "SEMUA") {
  query = query.eq("tipe", filterTipe);
}

// Filter Tanggal
const sekarang = new Date();

if (filterTanggal === "HARI_INI") {

  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);

  query = query.gte("created_at", hariIni.toISOString());

}

if (filterTanggal === "MINGGU_INI") {

  const mingguIni = new Date();
  mingguIni.setDate(sekarang.getDate() - 7);

  query = query.gte("created_at", mingguIni.toISOString());

}

if (filterTanggal === "BULAN_INI") {

  const bulanIni = new Date();
  bulanIni.setDate(sekarang.getDate() - 30);

  query = query.gte("created_at", bulanIni.toISOString());

}

const { data, error } = await query;

    if (error) {
      console.log(error);
      return;
    }

    setData(data || []);
  };

  return (

    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">

      <div className="flex items-center justify-end gap-3 p-4">

  <select
    value={filterTanggal}
    onChange={(e) => setFilterTanggal(e.target.value)}
    className="rounded-lg border border-gray-300 px-4 py-2"
  >
    <option value="SEMUA">📅 Semua Waktu</option>
    <option value="HARI_INI">Hari Ini</option>
    <option value="MINGGU_INI">Minggu Ini</option>
    <option value="BULAN_INI">Bulan Ini</option>
  </select>

  <select
    value={filterTipe}
    onChange={(e) => setFilterTipe(e.target.value)}
    className="rounded-lg border border-gray-300 px-4 py-2"
  >
    <option value="SEMUA">Semua</option>
    <option value="MASUK">📥 Stok Masuk</option>
    <option value="KELUAR">📤 Stok Keluar</option>
    <option value="RETUR">🔄 Retur</option>
  </select>

</div>

      <table className="w-full">

        <thead className="bg-pink-600 text-white">

          <tr>
            <th className="p-4 text-left">Product ID</th>
            <th className="p-4 text-center">Tipe</th>
            <th className="p-4 text-center">Jumlah</th>
            <th className="p-4 text-left">Keterangan</th>
            <th className="p-4 text-left">Tanggal</th>
          </tr>

        </thead>

        <tbody>

          {data.length === 0 ? (

            <tr>
              <td
                colSpan={5}
                className="p-8 text-center text-gray-500"
              >
                Belum ada riwayat stok.
              </td>
            </tr>

          ) : (

            data.map((item) => (

              <tr
                key={item.id}
                className="border-t"
              >

                <td className="p-4">{item.product_id}</td>

                <td className="p-4 text-center">
                  {item.tipe}
                </td>

                <td className="p-4 text-center">
                  {item.jumlah}
                </td>

                <td className="p-4">
                  {item.keterangan || "-"}
                </td>

                <td className="p-4">
                  {new Date(item.created_at).toLocaleString("id-ID")}
                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  );

}