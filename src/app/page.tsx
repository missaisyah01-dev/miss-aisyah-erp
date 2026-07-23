import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Header />

        <main className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="text-gray-500">Produk</h3>
              <p className="text-3xl font-bold mt-2">0</p>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="text-gray-500">Stok</h3>
              <p className="text-3xl font-bold mt-2">0</p>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="text-gray-500">Penjualan</h3>
              <p className="text-3xl font-bold mt-2">Rp0</p>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="text-gray-500">Laba</h3>
              <p className="text-3xl font-bold mt-2">Rp0</p>
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">Selamat Datang 👋</h2>
            <p className="mt-2 text-gray-600">
              Selamat datang di MISS AISYAH. Pilih menu di sidebar untuk mulai
              mengelola produk, stok, transaksi, dan laporan.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}