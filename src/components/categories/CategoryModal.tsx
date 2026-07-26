"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Category = { id: number; nama: string };

type Props = {
  onClose: () => void;
  refreshCategories: () => void;
  category?: Category | null;
};

export default function CategoryModal({
  onClose,
  refreshCategories,
  category,
}: Props) {

  const [nama, setNama] = useState(category?.nama || "");

  async function simpanKategori() {

    if (!nama.trim()) {
      alert("Nama kategori wajib diisi.");
      return;
    }

    let error;

    if (category) {

      ({ error } = await supabase
        .from("categories")
        .update({
          nama,
        })
        .eq("id", category.id));

    } else {

      ({ error } = await supabase
        .from("categories")
        .insert([
          {
            nama,
          },
        ]));

    }

    if (error) {
      console.log(error);
      alert("Gagal menyimpan kategori.");
      return;
    }

    alert("Kategori berhasil disimpan.");

    refreshCategories();
    onClose();

  }

  return (

    <div className="fixed inset-0 flex items-center justify-center bg-black/40">

      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

        <h2 className="mb-6 text-2xl font-bold text-gray-900">

          {category ? "Edit Kategori" : "Tambah Kategori"}

        </h2>

        <input
          type="text"
          placeholder="Nama kategori"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          className="mb-6 w-full rounded-lg border border-gray-300 px-4 py-2 text-black focus:border-pink-500 focus:outline-none"
        />

        <div className="flex justify-end gap-3">

          <button
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-4 py-2"
          >
            Batal
          </button>

          <button
            onClick={simpanKategori}
            className="rounded-lg bg-pink-600 px-4 py-2 text-white hover:bg-pink-700"
          >
            Simpan
          </button>

        </div>

      </div>

    </div>

  );

}
