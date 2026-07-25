type Props = {
  totalProduk: number;
  totalStok: number;
  stokMasuk: number;
  stokKeluar: number;
  stokMenipis: number;
  stokHabis: number;
  nilaiPersediaan: number;
};

export default function DashboardCards({
  totalProduk,
  totalStok,
  stokMasuk,
  stokKeluar,
  stokMenipis,
  stokHabis,
  nilaiPersediaan,
}: Props) {

  return (

    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

      <div className="rounded-xl bg-white p-5 shadow">
        <h3 className="text-gray-500">📦 Total Produk</h3>
        <p className="mt-2 text-3xl font-bold">{totalProduk}</p>
      </div>

      <div className="rounded-xl bg-white p-5 shadow">
        <h3 className="text-gray-500">📦 Total Stok</h3>
        <p className="mt-2 text-3xl font-bold">{totalStok}</p>
      </div>

      <div className="rounded-xl bg-white p-5 shadow">
        <h3 className="text-gray-500">📥 Total Stok Masuk</h3>
        <p className="mt-2 text-3xl font-bold">{stokMasuk}</p>
      </div>

      <div className="rounded-xl bg-white p-5 shadow">
        <h3 className="text-gray-500">📤 Total Stok Keluar</h3>
        <p className="mt-2 text-3xl font-bold">{stokKeluar}</p>
      </div>

      <div className="rounded-xl bg-white p-5 shadow">
        <h3 className="text-gray-500">⚠️ Stok Menipis</h3>
        <p className="mt-2 text-3xl font-bold">{stokMenipis}</p>
      </div>

      <div className="rounded-xl bg-white p-5 shadow">
        <h3 className="text-gray-500">❌ Stok Habis</h3>
        <p className="mt-2 text-3xl font-bold">{stokHabis}</p>
      </div>

      <div className="rounded-xl bg-white p-5 shadow">
        <h3 className="text-gray-500">💰 Nilai Persediaan</h3>
        <p className="mt-2 text-3xl font-bold">
          Rp {nilaiPersediaan.toLocaleString("id-ID")}
        </p>
      </div>

    </div>

  );

}