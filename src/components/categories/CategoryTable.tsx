type Category = {
  id: number;
  nama: string;
};

type CategoryTableProps = {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
};

export default function CategoryTable({
  categories,
  onEdit,
  onDelete,
}: CategoryTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
      <table className="w-full">

        <thead className="bg-pink-600 text-white">
          <tr>
            <th className="p-4 text-left">Nama Kategori</th>
            <th className="p-4 text-center">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {categories.length === 0 ? (
            <tr>
              <td colSpan={2} className="p-8 text-center text-gray-500">
                Belum ada kategori.
              </td>
            </tr>
          ) : (
            categories.map((category) => (
              <tr
                key={category.id}
                className="border-b hover:bg-pink-50"
              >
                <td className="p-4 font-semibold text-gray-900">
                  {category.nama}
                </td>

                <td className="p-4 text-center">
                  <div className="flex justify-center gap-2">

                    <button
                      onClick={() => onEdit(category)}
                      className="rounded-lg bg-pink-100 px-3 py-1 text-sm text-pink-700 hover:bg-pink-200"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      onClick={() => onDelete(category.id)}
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