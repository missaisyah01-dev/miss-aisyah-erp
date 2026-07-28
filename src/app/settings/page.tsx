import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import SettingsPanel from "@/components/settings/SettingsPanel";
import BrandSettings from "@/components/brand/BrandSettings";

export default function SettingsPage() { return <div className="flex min-h-screen bg-gray-100"><Sidebar /><div className="min-w-0 flex-1"><Header /><main className="space-y-6 p-5 pb-24 md:p-8"><SettingsPanel /><BrandSettings /></main></div></div>; }
