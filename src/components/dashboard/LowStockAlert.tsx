import Link from "next/link";

type Product = { id: number; kode: string; nama: string; stok: number };

export default function LowStockAlert({ products, threshold }: { products: Product[]; threshold: number }) {
  return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-lg font-bold text-amber-950">Perlu restock</h2><p className="mt-1 text-sm text-amber-800">Produk dengan stok {threshold} pcs atau kurang.</p></div><Link href="/inventory" className="rounded-xl bg-amber-500 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-amber-600">Kelola stok</Link></div>
    {products.length === 0 ? <p className="py-8 text-center text-sm text-amber-800">Stok semua produk masih aman.</p> : <div className="mt-4 divide-y divide-amber-200">{products.map((product) => <div key={product.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate font-semibold text-gray-900">{product.nama}</p><p className="text-xs text-amber-800">{product.kode}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${Number(product.stok) === 0 ? "bg-red-100 text-red-700" : "bg-amber-200 text-amber-900"}`}>{Number(product.stok) === 0 ? "Habis" : `${product.stok} pcs`}</span></div>)}</div>}
  </section>;
}
