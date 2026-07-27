"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

type NavigationItem = { href: string; label: string; short: string; roles: Array<"OWNER" | "ADMIN" | "KASIR"> };
const salesChildren = [{ href: "/sales/history", label: "Riwayat & Piutang" }, { href: "/sales/returns", label: "Retur Barang" }];
const navigation: NavigationItem[] = [
  { href: "/", label: "Dashboard", short: "Dasbor", roles: ["OWNER"] },
  { href: "/products", label: "Produk", short: "Produk", roles: ["OWNER", "ADMIN"] },
  { href: "/categories", label: "Kategori", short: "Kategori", roles: ["OWNER", "ADMIN"] },
  { href: "/inventory", label: "Stok", short: "Stok", roles: ["OWNER", "ADMIN"] },
  { href: "/sales", label: "POS / Kasir", short: "Kasir", roles: ["OWNER", "ADMIN", "KASIR"] },
  { href: "/reports", label: "Laporan", short: "Laporan", roles: ["OWNER"] },
  { href: "/settings", label: "Pengaturan", short: "Atur", roles: ["OWNER", "ADMIN"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const role = profile?.role;
  const items = navigation.filter((item) => role && item.roles.includes(role));

  return <>
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto bg-pink-600 p-6 text-white md:flex">
      <div><h1 className="text-2xl font-bold">MISS AISYAH</h1><p className="mt-1 text-sm text-pink-100">Sistem Operasional Fashion</p></div>
      <nav className="mt-8 space-y-1.5" aria-label="Navigasi utama">{items.map((item) => item.href === "/sales" ? <div key={item.href}><Link href={item.href} className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${pathname === item.href ? "bg-white text-pink-700 shadow-sm" : "text-pink-50 hover:bg-pink-700"}`}>{item.label}</Link>{pathname.startsWith("/sales") && <div className="mt-1 space-y-1 border-l border-pink-400 pl-3">{salesChildren.map((child) => <Link key={child.href} href={child.href} className={`block rounded-lg px-3 py-2 text-sm transition ${pathname === child.href ? "bg-pink-700 font-semibold text-white" : "text-pink-100 hover:bg-pink-700 hover:text-white"}`}>{child.label}</Link>)}</div>}</div> : <Link key={item.href} href={item.href} className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${pathname === item.href ? "bg-white text-pink-700 shadow-sm" : "text-pink-50 hover:bg-pink-700"}`}>{item.label}</Link>)}</nav>
      <div className="mt-auto border-t border-pink-400 pt-5"><p className="truncate font-semibold">{profile?.full_name || "Pengguna"}</p><p className="mt-1 text-xs text-pink-100">{role}</p><button onClick={() => void signOut()} className="mt-4 w-full rounded-xl border border-pink-300 px-3 py-2 text-sm font-semibold transition hover:bg-pink-700">Keluar</button></div>
    </aside>
    <nav className="fixed inset-x-0 bottom-0 z-40 flex gap-1 overflow-x-auto border-t border-pink-100 bg-white/95 px-2 py-2 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] backdrop-blur md:hidden" aria-label="Navigasi utama">{items.map((item) => <Link key={item.href} href={item.href} className={`min-w-16 flex-1 rounded-lg px-1 py-2 text-center text-[11px] font-semibold ${pathname === item.href ? "bg-pink-100 text-pink-700" : "text-gray-500"}`}>{item.short}</Link>)}</nav>
  </>;
}
