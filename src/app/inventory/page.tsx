"use client";

import { useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import StockTable from "@/components/stock/StockTable";
import StockModal from "@/components/stock/StockModal";
import StockImport from "@/components/stock/StockImport";
import StockOpnamePanel from "@/components/stock/StockOpnamePanel";

export default function InventoryPage() {

  const [openModal, setOpenModal] = useState(false);
  const [openOpname, setOpenOpname] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex min-h-screen bg-gray-100">

      <Sidebar />

      <div className="min-w-0 flex-1">

        <Header />

        <main className="p-5 pb-24 md:p-8">

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h1 className="text-3xl font-bold text-gray-900">
                Stok Gudang
              </h1>

              <p className="text-gray-500">
                Kelola stok masuk dan stok keluar
              </p>

            </div>

            <div className="flex flex-wrap gap-2"><StockImport onSuccess={() => setRefreshKey((key) => key + 1)} /><button onClick={() => setOpenOpname(true)} className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 font-semibold text-violet-700 hover:bg-violet-100">Stok Opname</button><button
              onClick={() => setOpenModal(true)}
              className="rounded-lg bg-pink-600 px-4 py-2 font-semibold text-white hover:bg-pink-700"
            >
              + Pergerakan Stok
            </button></div>

          </div>

          <StockTable refreshKey={refreshKey} />

        </main>

      </div>

      {openModal && (
        <StockModal
          onClose={() => setOpenModal(false)}
        />
      )}
      {openOpname && <StockOpnamePanel onClose={() => setOpenOpname(false)} onSuccess={() => setRefreshKey((key) => key + 1)} />}

    </div>
  );
}
