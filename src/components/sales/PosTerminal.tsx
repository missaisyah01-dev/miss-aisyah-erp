"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = { id: number; kode: string; nama: string; kategori: string; harga: number; stok: number };
type CartItem = Product & { quantity: number };
const formatRupiah = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

export default function PosTerminal() {
  const [products, setProducts] = useState<Product[]>([]); const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState(""); const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paidAmount, setPaidAmount] = useState(""); const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.harga * item.quantity, 0), [cart]);
  const paid = Number(paidAmount) || 0; const change = Math.max(0, paid - total);
  const filteredProducts = products.filter((product) => `${product.nama} ${product.kode} ${product.kategori}`.toLowerCase().includes(search.toLowerCase()));

  async function loadProducts() {
    setLoading(true); const { data, error } = await supabase.from("products").select("id, kode, nama, kategori, harga, stok").gt("stok", 0).order("nama");
    if (error) alert(`Gagal memuat produk: ${error.message}`); else setProducts((data ?? []) as Product[]); setLoading(false);
  }
  // Memuat katalog sekali saat terminal POS dibuka.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadProducts(); }, []);
  function addToCart(product: Product) { setCart((current) => { const existing = current.find((item) => item.id === product.id); if (!existing) return [...current, { ...product, quantity: 1 }]; if (existing.quantity >= product.stok) { alert("Jumlah di keranjang sudah mencapai stok tersedia."); return current; } return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item); }); }
  function setQuantity(productId: number, quantity: number) { setCart((current) => current.flatMap((item) => item.id !== productId ? [item] : quantity <= 0 ? [] : [{ ...item, quantity: Math.min(quantity, item.stok) }])); }
  async function checkout() {
    if (cart.length === 0) return alert("Pilih minimal satu produk."); if (paid < total) return alert("Nominal pembayaran masih kurang.");
    setSaving(true); const { data, error } = await supabase.rpc("create_sale", { p_items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })), p_payment_method: paymentMethod, p_paid_amount: paid, p_notes: notes || null }); setSaving(false);
    if (error) return alert(`Transaksi gagal: ${error.message}`); const transaction = Array.isArray(data) ? data[0] : data;
    alert(`Transaksi ${transaction?.invoice_number ?? ""} berhasil disimpan. Kembalian: ${formatRupiah(Number(transaction?.change_amount ?? change))}`); setCart([]); setPaidAmount(""); setNotes(""); loadProducts();
  }
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]"><section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, kode, atau kategori produk..." className="mb-5 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100" />{loading ? <p className="py-12 text-center text-gray-500">Memuat produk…</p> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filteredProducts.map((product) => <button key={product.id} onClick={() => addToCart(product)} className="rounded-xl border border-gray-200 p-4 text-left transition hover:border-pink-400 hover:bg-pink-50"><p className="font-semibold text-gray-900">{product.nama}</p><p className="mt-1 text-sm text-gray-500">{product.kode} · {product.kategori}</p><div className="mt-4 flex items-end justify-between gap-2"><span className="font-bold text-pink-600">{formatRupiah(product.harga)}</span><span className="text-xs text-gray-500">Stok {product.stok}</span></div></button>)}{filteredProducts.length === 0 && <p className="col-span-full py-12 text-center text-gray-500">Produk tersedia tidak ditemukan.</p>}</div>}</section><aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:sticky xl:top-6"><h2 className="text-xl font-bold text-gray-900">Pesanan</h2><div className="my-4 max-h-72 space-y-3 overflow-y-auto">{cart.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">Belum ada produk di pesanan.</p> : cart.map((item) => <div key={item.id} className="border-b border-gray-100 pb-3"><div className="flex justify-between gap-3"><p className="font-medium text-gray-900">{item.nama}</p><p className="font-semibold text-gray-900">{formatRupiah(item.harga * item.quantity)}</p></div><div className="mt-2 flex items-center gap-2"><button onClick={() => setQuantity(item.id, item.quantity - 1)} className="h-7 w-7 rounded bg-gray-100 font-bold">−</button><span className="w-8 text-center text-sm">{item.quantity}</span><button onClick={() => setQuantity(item.id, item.quantity + 1)} className="h-7 w-7 rounded bg-gray-100 font-bold">+</button><span className="ml-auto text-xs text-gray-500">Stok {item.stok}</span></div></div>)}</div><div className="border-t border-gray-200 pt-4"><div className="flex justify-between text-lg font-bold text-gray-900"><span>Total</span><span>{formatRupiah(total)}</span></div></div><select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"><option value="CASH">Tunai</option><option value="QRIS">QRIS</option><option value="DEBIT">Debit</option></select><input value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)} type="number" min="0" placeholder="Nominal pembayaran" className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /><p className="mt-2 text-sm text-gray-600">Kembalian: <strong>{formatRupiah(change)}</strong></p><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Catatan (opsional)" className="mt-3 min-h-20 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /><button disabled={saving || cart.length === 0} onClick={checkout} className="mt-4 w-full rounded-xl bg-pink-600 px-4 py-3 font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-pink-300">{saving ? "Menyimpan transaksi…" : "Bayar & Simpan Transaksi"}</button></aside></div>;
}
