type Product = {
  id: number;
  kode: string;
  nama: string;
  kategori: string;
  harga: number;
  stok: number;
};

type ProductTableProps = {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
  onVariants: (product: Product) => void;
};

export default function ProductTable({
  products,
  onEdit,
  onDelete,
  onVariants,
}: ProductTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
      <table className="w-full">
        <thead className="bg-pink-600 text-white">
          <tr>
            <th className="p-4 text-left">Kode</th>
            <th className="p-4 text-left">Nama Produk</th>
            <th className="p-4 text-left">Kategori</th>
            <th className="p-4 text-left">Stok</th>
            <th className="p-4 text-left">Harga</th>
            <th className="p-4 text-center">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-8 text-center text-gray-500">
                Belum ada produk.
              </td>
            </tr>
          ) : (
            products.map((produk) => (
              <tr key={produk.id} className="border-b hover:bg-pink-50">
                <td className="p-4 text-gray-700">{produk.kode}</td>

                <td className="p-4 font-semibold text-gray-900">
                  {produk.nama}
                </td>

                <td className="p-4">
                  <span className="rounded-full bg-pink-100 px-3 py-1 text-sm text-pink-700">
                    {produk.kategori}
                  </span>
                </td>

                <td className="p-4 text-gray-700">{produk.stok}</td>

                <td className="p-4 font-semibold text-gray-900">
                  Rp {produk.harga.toLocaleString("id-ID")}
                </td>

                <td className="p-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onVariants(produk)}
                      className="rounded-lg bg-violet-100 px-3 py-1 text-sm text-violet-700 hover:bg-violet-200"
                    >
                      Varian
                    </button>

                    <button
                      onClick={() => onEdit(produk)}
                      className="rounded-lg bg-pink-100 px-3 py-1 text-sm text-pink-700 hover:bg-pink-200"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      onClick={() => onDelete(produk.id)}
                      className="rounded-lg bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
