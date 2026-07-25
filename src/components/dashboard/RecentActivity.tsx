type Activity = {
  product: string;
  tipe: string;
  jumlah: number;
  created_at: string;
};

type Props = {
  activities: Activity[];
};

export default function RecentActivity({ activities }: Props) {

  return (

    <div className="rounded-xl bg-white p-6 shadow">

      <h2 className="mb-4 text-xl font-bold">
        🕒 Aktivitas Terbaru
      </h2>

      {activities.length === 0 ? (

        <p className="text-gray-500">
          Belum ada aktivitas.
        </p>

      ) : (

        <div className="space-y-3">

          {activities.map((item, index) => (

            <div
              key={index}
              className="flex items-center justify-between border-b pb-3"
            >

              <div>

                <p className="font-semibold">
                  {item.product}
                </p>

                <p className="text-sm text-gray-500">
                  {item.tipe} • {item.jumlah} pcs
                </p>

              </div>

              <span className="text-xs text-gray-400">
                {new Date(item.created_at).toLocaleDateString("id-ID")}
              </span>

            </div>

          ))}

        </div>

      )}

    </div>

  );

}