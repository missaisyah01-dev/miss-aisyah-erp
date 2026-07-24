import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-pink-600 text-white p-6 min-h-screen">
      <h1 className="text-2xl font-bold mb-8">MISS AISYAH</h1>

      <nav className="space-y-4">
        <Link
          href="/"
          className="block w-full rounded p-2 hover:bg-pink-700"
        >
          📊 Dashboard
        </Link>

        <Link
  href="/products"
  className="block w-full rounded p-2 hover:bg-pink-700"
>
  📦 Produk
</Link>

<Link
  href="/categories"
  className="block w-full rounded p-2 hover:bg-pink-700"
>
  📁 Kategori
</Link>

<Link
  href="/inventory"
  className="block w-full rounded p-2 hover:bg-pink-700"
>
  📋 Stok
</Link>

        <Link
          href="/sales"
          className="block w-full rounded p-2 hover:bg-pink-700"
        >
          🛒 Transaksi
        </Link>

        <Link
          href="/reports"
          className="block w-full rounded p-2 hover:bg-pink-700"
        >
          📈 Laporan
        </Link>

        <Link
          href="/settings"
          className="block w-full rounded p-2 hover:bg-pink-700"
        >
          ⚙️ Pengaturan
        </Link>
      </nav>
    </aside>
  );
}