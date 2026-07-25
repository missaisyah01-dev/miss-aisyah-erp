"use client";

import { useAuth } from "@/components/auth/AuthProvider";

export default function Header() {
  const { profile } = useAuth();
  const initial = (profile?.full_name || "M").trim().charAt(0).toUpperCase();
  return <header className="flex items-center justify-between bg-white p-4 shadow-sm"><div><p className="text-sm text-gray-500">Selamat datang di</p><h1 className="text-xl font-bold text-gray-800">MISS AISYAH</h1></div><div className="flex items-center gap-3"><div className="text-right"><p className="font-semibold text-gray-900">{profile?.full_name || "Pengguna"}</p><p className="text-sm text-gray-500">{profile?.role || ""}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-600 font-bold text-white">{initial}</div></div></header>;
}
