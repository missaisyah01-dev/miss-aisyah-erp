"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ProductModal from "@/components/products/ProductModal";
import ProductTable from "@/components/products/ProductTable";
import { useBrand } from "@/components/brand/BrandProvider";

type Product = { id: number; kode: string; nama: string; kategori: string; harga: number; stok: number };
type Category = { id: number; nama: string };

export default function ProductsPage() {
  const { brand } = useBrand();
  const [openModal, setOpenModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("");

  async function ambilProduk() {
    const { data, error } = await supabase.from("products").select("*").eq("brand_id", brand?.id ?? "").order("created_at", { ascending: false });
    if (error) return alert(`Gagal memuat produk: ${error.message}`);
    setProducts((data ?? []) as Product[]);
  }

  async function ambilKategori() {
    const { data, error } = await supabase.from("categories").select("id,nama").eq("brand_id", brand?.id ?? "").order("nama");
    if (error) return alert(`Gagal memuat kategori: ${error.message}`);
    setCategories((data ?? []) as Category[]);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (brand) { void ambilProduk(); void ambilKategori(); } }, [brand?.id]);

  async function hapusProduk(id: number) {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id).eq("brand_id", brand?.id ?? "");
    if (error) return alert(`Gagal menghapus produk: ${error.message}`);
    alert("Produk berhasil dihapus.");
    void ambilProduk();
  }

  const visibleProducts = useMemo(() => products.filter((product) => {
    const keyword = search.trim().toLocaleLowerCase("id-ID");
    const matchesSearch = !keyword || [product.nama, product.kode, product.kategori].some((value) => value.toLocaleLowerCase("id-ID").includes(keyword));
    return matchesSearch && (!filterKategori || product.kategori === filterKategori);
  }), [products, search, filterKategori]);

  return <div className="flex min-h-screen bg-gray-100"><Sidebar /><div className="min-w-0 flex-1"><Header /><main className="p-5 pb-24 md:p-8"><div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-3xl font-bold text-gray-900">Produk</h1><p className="text-gray-500">Kelola semua produk {brand?.name ?? ""}</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><input type="search" placeholder="Cari produk..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-pink-500 focus:outline-none sm:w-80" /><select value={filterKategori} onChange={(event) => setFilterKategori(event.target.value)} className="rounded-lg border border-gray-300 px-4 py-2"><option value="">Semua kategori</option>{categories.map((category) => <option key={category.id} value={category.nama}>{category.nama}</option>)}</select></div></div><button onClick={() => { setSelectedProduct(null); setOpenModal(true); }} className="shrink-0 rounded-lg bg-pink-600 px-4 py-2 font-semibold text-white hover:bg-pink-700">+ Tambah Produk</button></div><ProductTable products={visibleProducts} onEdit={(product) => { setSelectedProduct(product); setOpenModal(true); }} onDelete={hapusProduk} /></main></div>{openModal && <ProductModal onClose={() => { setOpenModal(false); setSelectedProduct(null); }} refreshProducts={ambilProduk} product={selectedProduct} brandId={brand?.id ?? ""} />}</div>;
}
