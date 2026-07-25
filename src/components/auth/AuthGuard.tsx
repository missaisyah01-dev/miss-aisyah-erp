"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!loading && !user && !isLoginPage) router.replace("/login");
    if (!loading && user && isLoginPage) router.replace("/");
  }, [isLoginPage, loading, router, user]);

  if (isLoginPage) return <>{children}</>;
  if (loading) return <main className="grid min-h-screen place-items-center bg-gray-100 text-gray-600">Memeriksa akses…</main>;
  if (!user) return null;
  if (!profile) return <main className="grid min-h-screen place-items-center bg-gray-100 p-6"><div className="max-w-md rounded-2xl bg-white p-6 text-center shadow"><h1 className="text-xl font-bold text-gray-900">Profil akun belum tersedia</h1><p className="mt-2 text-sm text-gray-600">Hubungi owner untuk memastikan akun Anda memiliki role di MISS AISYAH.</p><button onClick={() => void signOut()} className="mt-5 rounded-lg bg-pink-600 px-4 py-2 font-semibold text-white">Keluar</button></div></main>;
  return <>{children}</>;
}
