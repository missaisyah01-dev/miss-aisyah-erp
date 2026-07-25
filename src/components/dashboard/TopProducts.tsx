type Product = {
  nama: string;
  stok: number;
};

type Props = {
  products: Product[];
};

export default function TopProducts({ products }: Props) {
  return (
    <div className="rounded-xl bg-white p-6 text-gray-900 shadow">
      <h2 className="mb-4 text-xl font-bold text-gray-900">
        🔥 Top Produk (Stok Terbanyak)
      </h2>

      {products.length === 0 ? (
        <p className="text-gray-500">
          Belum ada produk.
        </p>
      ) : (
        <div className="space-y-3">
          {products.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
            >
              <div>
                <p className="font-semibold text-gray-900">
                  {item.nama}
                </p>

                <p className="text-sm text-gray-500">
                  Stok tersedia
                </p>
              </div>

              <span className="rounded-full bg-pink-100 px-3 py-1 font-bold text-pink-600">
                {item.stok}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
