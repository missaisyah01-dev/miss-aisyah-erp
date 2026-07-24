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
  products={products}
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