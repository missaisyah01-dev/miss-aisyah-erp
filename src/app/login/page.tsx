"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) setError(signInError.message);
  }

  return <main className="grid min-h-screen place-items-center bg-linear-to-br from-pink-100 via-white to-amber-50 p-5"><form onSubmit={handleLogin} className="w-full max-w-md rounded-3xl border border-pink-100 bg-white p-8 shadow-xl"><p className="text-sm font-semibold tracking-[0.2em] text-pink-600">MISS AISYAH</p><h1 className="mt-3 text-3xl font-bold text-gray-900">Masuk ke aplikasi</h1><p className="mt-2 text-sm text-gray-500">Gunakan akun yang telah dibuat oleh owner.</p>{error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<label className="mt-6 block text-sm font-medium text-gray-700">Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-pink-500" /></label><label className="mt-4 block text-sm font-medium text-gray-700">Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-pink-500" /></label><button disabled={loading} className="mt-6 w-full rounded-xl bg-pink-600 px-4 py-3 font-semibold text-white hover:bg-pink-700 disabled:bg-pink-300">{loading ? "Memproses…" : "Masuk"}</button></form></main>;
}
