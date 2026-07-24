"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ProductModal from "@/components/products/ProductModal";
import ProductTable from "@/components/products/ProductTable";

export default function ProductsPage() {

  const [openModal, setOpenModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("");


  useEffect(() => {
    ambilProduk();
  }, []);


  async function ambilProduk() {

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });


    if (error) {
      console.log(error);
      return;
    }


    setProducts(data || []);

  }

  async function hapusProduk(id: number) {

    const konfirmasi = confirm("Yakin ingin menghapus produk ini?");

    if (!konfirmasi) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.log(error);
      alert("Gagal menghapus produk.");
      return;
    }

    alert("Produk berhasil dihapus.");

    ambilProduk();

  }

  return (

    <div className="flex min-h-screen bg-gray-100">

      <Sidebar />


      <div className="flex-1">

        <Header />


        <main className="p-8">


          <div className="mb-6 flex items-center justify-between">


            <div>

              <h1 className="text-3xl font-bold text-gray-900">
                Produk
              </h1>


              <p className="text-gray-500">
                Kelola semua produk MISS AISYAH
              </p>

             <div className="mt-4 flex gap-3">

  <input
    type="text"
    placeholder="🔍 Cari produk..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-80 rounded-lg border border-gray-300 px-4 py-2 focus:border-pink-500 focus:outline-none"
  />

  <select
    value={filterKategori}
    onChange={(e) => setFilterKategori(e.target.value)}
    className="rounded-lg border border-gray-300 px-4 py-2"
  >
    <option value="Semua">Semua</option>
    <option value="Gamis">Gamis</option>
    <option value="Hijab">Hijab</option>
    <option value="Mukena">Mukena</option>
    <option value="Dress">Dress</option>
  </select>

</div>
            </div>



            <button

              onClick={() => {
                setSelectedProduct(null);
                setOpenModal(true);
              }}

              className="rounded-lg bg-pink-600 px-4 py-2 font-semibold text-white hover:bg-pink-700"

            >

              + Tambah Produk

            </button>


          </div>




         <ProductTable
  products={products.filter((produk) => {
    const cocokSearch =
      produk.nama.toLowerCase().includes(search.toLowerCase()) ||
      produk.kode.toLowerCase().includes(search.toLowerCase()) ||
      produk.kategori.toLowerCase().includes(search.toLowerCase());

    const cocokKategori =
      filterKategori.toLowerCase() === "semua" ||
      produk.kategori.toLowerCase() === filterKategori.toLowerCase();

    return cocokSearch && cocokKategori;
  })}
  onEdit={(produk) => {
    setSelectedProduct(produk);
    setOpenModal(true);
  }}
  onDelete={hapusProduk}
/>

        </main>


      </div>





      {openModal && (

        <ProductModal

          onClose={() => {
            setOpenModal(false);
            setSelectedProduct(null);
          }}

          refreshProducts={ambilProduk}

          product={selectedProduct}

        />

      )}



    </div>

  );

}