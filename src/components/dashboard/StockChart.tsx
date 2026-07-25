"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type Props = {
  data: {
    name: string;
    masuk: number;
    keluar: number;
  }[];
};

export default function StockChart({ data }: Props) {

  return (

    <div className="mt-8 rounded-xl bg-white p-6 text-gray-900 shadow">

      <h2 className="mb-6 text-xl font-bold text-gray-900">
        Grafik Pergerakan Stok
      </h2>

      <ResponsiveContainer
        width="100%"
        height={350}
      >

        <LineChart data={data}>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="name" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="masuk"
            stroke="#ec4899"
            strokeWidth={3}
          />

          <Line
            type="monotone"
            dataKey="keluar"
            stroke="#2563eb"
            strokeWidth={3}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );

}
