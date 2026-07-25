"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

type NavigationItem = { href: string; label: string; roles: Array<"OWNER" | "ADMIN" | "KASIR"> };
const navigation: NavigationItem[] = [
  { href: "/", label: "Dashboard", roles: ["OWNER"] },
  { href: "/products", label: "Produk", roles: ["OWNER", "ADMIN"] },
  { href: "/categories", label: "Kategori", roles: ["OWNER", "ADMIN"] },
  { href: "/inventory", label: "Stok", roles: ["OWNER", "ADMIN"] },
  { href: "/sales", label: "POS / Kasir", roles: ["OWNER", "ADMIN", "KASIR"] },
  { href: "/reports", label: "Laporan", roles: ["OWNER"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const role = profile?.role;
  return <aside className="flex min-h-screen w-64 shrink-0 flex-col bg-pink-600 p-6 text-white"><h1 className="text-2xl font-bold">MISS AISYAH</h1><p className="mt-1 text-sm text-pink-100">Operasional F&B</p><nav className="mt-8 space-y-2">{navigation.filter((item) => role && item.roles.includes(role)).map((item) => <Link key={item.href} href={item.href} className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${pathname === item.href ? "bg-white text-pink-700" : "hover:bg-pink-700"}`}>{item.label}</Link>)}</nav><div className="mt-auto border-t border-pink-400 pt-5"><p className="truncate font-semibold">{profile?.full_name || "Pengguna"}</p><p className="mt-1 text-xs text-pink-100">{role}</p><button onClick={() => void signOut()} className="mt-4 w-full rounded-lg border border-pink-300 px-3 py-2 text-sm font-semibold hover:bg-pink-700">Keluar</button></div></aside>;
}
