"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Props = {
  onClose: () => void;
};

export default function StockModal({ onClose }: Props) {

  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [productId, setProductId] = useState("");

  const [tipe, setTipe] = useState("MASUK");
  const [jumlah, setJumlah] = useState("");
  const [keterangan, setKeterangan] = useState("");


  useEffect(() => {

    const fetchProducts = async () => {

      const { data, error } = await supabase
        .from("products")
        .select("id, nama");

      if (error) {
        console.log(error);
        return;
      }

      setProducts(data || []);

    };

    fetchProducts();

  }, []);



 const handleSave = async () => {

  if (!productId || !jumlah) {
    alert("Produk dan jumlah wajib diisi");
    return;
  }


  // ambil stok sekarang
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("stok")
    .eq("id", productId)
    .single();


  if (productError) {
    alert(productError.message);
    return;
  }


  let stokBaru = product.stok;


  if (tipe === "MASUK" || tipe === "RETUR") {
    stokBaru = stokBaru + Number(jumlah);
  }


  if (tipe === "KELUAR") {
    stokBaru = stokBaru - Number(jumlah);
  }


  if (stokBaru < 0) {
    alert("Stok tidak mencukupi");
    return;
  }



  // simpan riwayat
  const { error: movementError } = await supabase
    .from("stock_movements")
    .insert({
      product_id: Number(productId),
      tipe: tipe,
      jumlah: Number(jumlah),
      keterangan: keterangan,
    });


  if (movementError) {
    alert(movementError.message);
    return;
  }



  // update stok produk
  const { error: updateError } = await supabase
    .from("products")
    .update({
      stok: stokBaru
    })
    .eq("id", productId);



  if (updateError) {
    alert(updateError.message);
    return;
  }


  alert("Stok berhasil diperbarui");

  onClose();

  window.location.reload();

};


  return (

    <div className="fixed inset-0 flex items-center justify-center bg-black/40">

      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">


        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          Pergerakan Stok
        </h2>



        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-black"
        >

          <option value="">
            Pilih Produk
          </option>


          {products.map((product) => (

            <option
              key={product.id}
              value={product.id}
            >
              {product.nama}
            </option>

          ))}

        </select>




        <select
          value={tipe}
          onChange={(e) => setTipe(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-black"
        >

          <option value="MASUK">
            📥 Stok Masuk
          </option>

          <option value="KELUAR">
            📤 Stok Keluar
          </option>

          <option value="RETUR">
            🔄 Retur
          </option>

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
            onClick={handleSave}
            className="rounded-lg bg-pink-600 px-4 py-2 text-white hover:bg-pink-700"
          >
            Simpan
          </button>


        </div>


      </div>

    </div>

  );

}