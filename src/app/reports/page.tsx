import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import SalesReport from "@/components/reports/SalesReport";

export default function ReportsPage() {
  return <div className="flex min-h-screen bg-gray-100"><Sidebar /><div className="min-w-0 flex-1"><Header /><main className="p-5 md:p-8"><SalesReport /></main></div></div>;
}
