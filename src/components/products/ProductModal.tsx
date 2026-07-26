"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import VariantModal from "@/components/products/VariantModal";

type Product = {
  id?: number;
  kode: string;
  nama: string;
  kategori: string;
  harga: number;
  stok: number;
};

type ProductModalProps = {
  onClose: () => void;
  refreshProducts: () => void;
  product?: Product | null;
};

export default function ProductModal({
  onClose,
  refreshProducts,
  product,
}: ProductModalProps) {

  const [kode, setKode] = useState(product?.kode ?? "");
  const [nama, setNama] = useState(product?.nama ?? "");
  const [kategori, setKategori] = useState(product?.kategori ?? "");
  const [harga, setHarga] = useState(product ? String(product.harga) : "");
  const [stok, setStok] = useState(product ? String(product.stok) : "");
  const [showVariants, setShowVariants] = useState(false);


  async function simpanProduk() {

    let error;


    if (product?.id) {

      console.log("ID produk:", product.id);

      const result = await supabase
        .from("products")
        .update({
          kode,
          nama,
          kategori,
          harga: Number(harga),
          stok: Number(stok),
        })
        .eq("id", product.id)
        .select()

      console.log("HASIL UPDATE:", result.data);
      console.log("ERROR UPDATE:", result.error);

      error = result.error;

    } else {

      const result = await supabase
        .from("products")
        .insert({
          kode,
          nama,
          kategori,
          harga: Number(harga),
          stok: Number(stok),
        });

      error = result.error;

    }


    if (error) {
      alert("Gagal menyimpan produk");
      console.log(error);
      return;
    }


    alert(
      product?.id
        ? "Produk berhasil diperbarui"
        : "Produk berhasil ditambahkan"
    );


    refreshProducts();
    onClose();

  }


  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">

      <div className="w-full max-w-lg rounded-xl bg-white p-6 text-gray-900">

        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          {product?.id ? "Edit Produk" : "Tambah Produk"}
        </h2>


        <input
          placeholder="Kode Produk"
          className="mb-3 w-full rounded border p-3"
          value={kode}
          onChange={(e) => setKode(e.target.value)}
        />

        <input
          placeholder="Nama Produk"
          className="mb-3 w-full rounded border p-3"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
        />

        <input
          placeholder="Kategori"
          className="mb-3 w-full rounded border p-3"
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
        />

        <input
          placeholder="Harga"
          type="number"
          className="mb-3 w-full rounded border p-3"
          value={harga}
          onChange={(e) => setHarga(e.target.value)}
        />

        <input
          placeholder="Stok"
          type="number"
          className="mb-5 w-full rounded border p-3"
          value={stok}
          onChange={(e) => setStok(e.target.value)}
        />


        <div className="flex flex-wrap justify-between gap-3">

          {product?.id && (
            <button
              onClick={() => setShowVariants(true)}
              className="rounded border border-violet-200 bg-violet-50 px-5 py-2 font-semibold text-violet-700 hover:bg-violet-100"
            >
              Kelola Variasi
            </button>
          )}

          <div className="ml-auto flex gap-3">

          <button
            onClick={onClose}
            className="rounded border px-5 py-2"
          >
            Batal
          </button>


          <button
            onClick={simpanProduk}
            className="rounded bg-pink-600 px-5 py-2 text-white"
          >
            Simpan
          </button>

          </div>

        </div>

      </div>

      {showVariants && product?.id && (
        <VariantModal
          product={product as Product & { id: number }}
          onClose={() => {
            setShowVariants(false);
            refreshProducts();
          }}
        />
      )}

    </div>
  );
}
