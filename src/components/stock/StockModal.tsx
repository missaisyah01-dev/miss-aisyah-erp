"use client";

import { useState } from "react";

type Props = {
  onClose: () => void;
};

export default function StockModal({ onClose }: Props) {

  const [tipe, setTipe] = useState("MASUK");
  const [jumlah, setJumlah] = useState("");
  const [keterangan, setKeterangan] = useState("");

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">

      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">

        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          Pergerakan Stok
        </h2>

        <select
          value={tipe}
          onChange={(e) => setTipe(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-black"
        >
          <option value="MASUK">📥 Stok Masuk</option>
          <option value="KELUAR">📤 Stok Keluar</option>
          <option value="RETUR">🔄 Retur</option>
        </select>

        <input
          type="number"
          placeholder="Jumlah"
          value={jumlah}
          onChange={(e) => setJumlah(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-black"
        />

        <textarea
          placeholder="Keterangan"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          className="mb-6 w-full rounded-lg border border-gray-300 px-4 py-2 text-black"
        />

        <div className="flex justify-end gap-3">

          <button
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-4 py-2"
          >
            Batal
          </button>

          <button
            className="rounded-lg bg-pink-600 px-4 py-2 text-white hover:bg-pink-700"
          >
            Simpan
          </button>

        </div>

      </div>

    </div>
  );
}