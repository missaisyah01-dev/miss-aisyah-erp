export default function StockTable() {

  return (

    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">

      <table className="w-full">

        <thead className="bg-pink-600 text-white">

          <tr>

            <th className="p-4 text-left">Produk</th>
            <th className="p-4 text-center">Tipe</th>
            <th className="p-4 text-center">Jumlah</th>
            <th className="p-4 text-left">Keterangan</th>
            <th className="p-4 text-left">Tanggal</th>

          </tr>

        </thead>

        <tbody>

          <tr>

            <td
              colSpan={5}
              className="p-8 text-center text-gray-500"
            >
              Belum ada riwayat stok.
            </td>

          </tr>

        </tbody>

      </table>

    </div>

  );

}