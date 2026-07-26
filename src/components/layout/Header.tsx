"use client";

import { useAuth } from "@/components/auth/AuthProvider";

export default function Header() {
  const { profile } = useAuth();
  const initial = (profile?.full_name || "M").trim().charAt(0).toUpperCase();
  return <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-5 py-3 shadow-sm backdrop-blur md:px-8"><div><p className="text-xs font-medium uppercase tracking-wider text-pink-600">MISS AISYAH</p><p className="mt-0.5 text-sm text-gray-500">Sistem operasional fashion</p></div><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="font-semibold text-gray-900">{profile?.full_name || "Pengguna"}</p><p className="text-xs text-gray-500">{profile?.role || ""}</p></div><div title={profile?.full_name || "Pengguna"} className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-600 font-bold text-white shadow-sm">{initial}</div></div></header>;
}
