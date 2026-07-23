"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ProductModal from "@/components/products/ProductModal";

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




          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">


            <table className="w-full">


              <thead className="bg-pink-600 text-white">

                <tr>

                  <th className="p-4 text-left">
                    Kode
                  </th>

                  <th className="p-4 text-left">
                    Nama Produk
                  </th>

                  <th className="p-4 text-left">
                    Kategori
                  </th>

                  <th className="p-4 text-left">
                    Stok
                  </th>

                  <th className="p-4 text-left">
                    Harga
                  </th>

                  <th className="p-4 text-center">
                    Aksi
                  </th>

                </tr>

              </thead>




              <tbody>


                {products.length === 0 ? (

                  <tr>

                    <td
                      colSpan={6}
                      className="p-8 text-center text-gray-500"
                    >
                      Belum ada produk.
                    </td>

                  </tr>


                ) : (


                  products.map((produk) => (


                    <tr
                      key={produk.id}
                      className="border-b hover:bg-pink-50"
                    >


                      <td className="p-4 text-gray-700">
                        {produk.kode}
                      </td>


                      <td className="p-4 font-semibold text-gray-900">
                        {produk.nama}
                      </td>


                      <td className="p-4">

                        <span className="rounded-full bg-pink-100 px-3 py-1 text-sm text-pink-700">

                          {produk.kategori}

                        </span>

                      </td>



                      <td className="p-4 text-gray-700">
                        {produk.stok}
                      </td>



                      <td className="p-4 font-semibold text-gray-900">

                        Rp {produk.harga.toLocaleString("id-ID")}

                      </td>



                      <td className="p-4 text-center">


                        <button

                          onClick={() => {
                            setSelectedProduct(produk);
                            setOpenModal(true);
                          }}

                          className="rounded-lg bg-pink-100 px-3 py-1 text-sm text-pink-700 hover:bg-pink-200"

                        >

                          Edit

                        </button>


                      </td>


                    </tr>


                  ))

                )}



              </tbody>


            </table>


          </div>


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