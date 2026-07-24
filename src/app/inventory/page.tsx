"use client";

import { useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import StockTable from "@/components/stock/StockTable";
import StockModal from "@/components/stock/StockModal";

export default function InventoryPage() {

  const [openModal, setOpenModal] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">

      <Sidebar />

      <div className="flex-1">

        <Header />

        <main className="p-8">

          <div className="mb-6 flex items-center justify-between">

            <div>

              <h1 className="text-3xl font-bold text-gray-900">
                Stok Gudang
              </h1>

              <p className="text-gray-500">
                Kelola stok masuk dan stok keluar
              </p>

            </div>

            <button
              onClick={() => setOpenModal(true)}
              className="rounded-lg bg-pink-600 px-4 py-2 font-semibold text-white hover:bg-pink-700"
            >
              + Pergerakan Stok
            </button>

          </div>

          <StockTable />

        </main>

      </div>

      {openModal && (
        <StockModal
          onClose={() => setOpenModal(false)}
        />
      )}

    </div>
  );
}