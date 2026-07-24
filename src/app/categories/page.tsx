"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import CategoryTable from "@/components/categories/CategoryTable";
import CategoryModal from "@/components/categories/CategoryModal";

export default function CategoriesPage() {

  const [categories, setCategories] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);

  useEffect(() => {
    ambilKategori();
  }, []);

  async function ambilKategori() {

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("nama");

    if (error) {
      console.log(error);
      return;
    }

    setCategories(data || []);
  }

  async function hapusKategori(id: number) {

    const konfirmasi = confirm("Yakin ingin menghapus kategori ini?");

    if (!konfirmasi) return;

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.log(error);
      alert("Gagal menghapus kategori.");
      return;
    }

    alert("Kategori berhasil dihapus.");

    ambilKategori();
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
                Kategori
              </h1>

              <p className="text-gray-500">
                Kelola kategori produk MISS AISYAH
              </p>

            </div>

            <button
              onClick={() => {
                setSelectedCategory(null);
                setOpenModal(true);
              }}
              className="rounded-lg bg-pink-600 px-4 py-2 font-semibold text-white hover:bg-pink-700"
            >
              + Tambah Kategori
            </button>

          </div>

          <CategoryTable
            categories={categories}
            onEdit={(category) => {
              setSelectedCategory(category);
              setOpenModal(true);
            }}
            onDelete={hapusKategori}
          />

        </main>

      </div>

      {openModal && (
        <CategoryModal
          onClose={() => {
            setOpenModal(false);
            setSelectedCategory(null);
          }}
          refreshCategories={ambilKategori}
          category={selectedCategory}
        />
      )}

    </div>
  );
}