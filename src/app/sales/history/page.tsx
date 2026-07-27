import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import SalesHistory from "@/components/sales/SalesHistory";

export default function SalesHistoryPage() {
  return <div className="flex min-h-screen bg-gray-100"><Sidebar /><div className="min-w-0 flex-1"><Header /><main className="p-5 pb-24 md:p-8"><div className="mb-6"><h1 className="text-3xl font-bold text-gray-900">Riwayat Penjualan & Piutang</h1><p className="mt-1 text-gray-500">Lihat transaksi, cetak struk, dan selesaikan pembayaran piutang.</p></div><SalesHistory /></main></div></div>;
}
