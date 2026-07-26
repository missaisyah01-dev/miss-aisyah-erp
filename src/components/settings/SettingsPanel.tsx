"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

type Preferences = { compactMode: boolean; reportPeriod: string; lowStock: string };
const defaultPreferences: Preferences = { compactMode: false, reportPeriod: "MINGGU_INI", lowStock: "5" };

export default function SettingsPanel() {
  const { profile, user } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>(() => {
    if (typeof window === "undefined") return defaultPreferences;
    const stored = localStorage.getItem("miss-aisyah-preferences");
    try { return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences; } catch { return defaultPreferences; }
  });
  const [saved, setSaved] = useState(false);
  function save() { localStorage.setItem("miss-aisyah-preferences", JSON.stringify(preferences)); setSaved(true); window.setTimeout(() => setSaved(false), 2500); }
  return <section className="max-w-3xl space-y-6"><div><h1 className="text-3xl font-bold text-gray-900">Pengaturan</h1><p className="mt-1 text-gray-500">Atur preferensi kerja untuk perangkat ini.</p></div>
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-gray-900">Akun aktif</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Info label="Nama" value={profile?.full_name || "Pengguna"} /><Info label="Email" value={user?.email || "-"} /><Info label="Peran akses" value={profile?.role || "-"} /><Info label="Status" value="Aktif" /></dl><p className="mt-5 rounded-xl bg-pink-50 p-3 text-sm text-pink-800">Perubahan nama dan peran pengguna dikelola oleh Owner melalui Supabase untuk menjaga keamanan akses.</p></section>
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-gray-900">Preferensi tampilan & laporan</h2><div className="mt-5 space-y-5"><label className="flex cursor-pointer items-start justify-between gap-5 rounded-xl border border-gray-200 p-4"><span><span className="block font-semibold text-gray-900">Mode tampilan ringkas</span><span className="mt-1 block text-sm text-gray-500">Kurangi jarak pada tabel dan kartu di perangkat ini.</span></span><input type="checkbox" checked={preferences.compactMode} onChange={(event) => setPreferences((current) => ({ ...current, compactMode: event.target.checked }))} className="mt-1 h-5 w-5 accent-pink-600" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-gray-700">Rentang laporan awal<select value={preferences.reportPeriod} onChange={(event) => setPreferences((current) => ({ ...current, reportPeriod: event.target.value }))} className="mt-2 block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900"><option value="HARI_INI">Hari ini</option><option value="MINGGU_INI">7 hari terakhir</option><option value="BULAN_INI">Bulan ini</option></select></label><label className="text-sm font-medium text-gray-700">Batas stok rendah<input type="number" min="0" value={preferences.lowStock} onChange={(event) => setPreferences((current) => ({ ...current, lowStock: event.target.value }))} className="mt-2 block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900" /></label></div></div><div className="mt-6 flex items-center gap-3"><button onClick={save} className="rounded-xl bg-pink-600 px-4 py-2.5 font-semibold text-white transition hover:bg-pink-700">Simpan preferensi</button>{saved && <span className="text-sm font-medium text-emerald-700">Preferensi tersimpan di perangkat ini.</span>}</div></section>
  </section>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</dt><dd className="mt-1 font-medium text-gray-900">{value}</dd></div>; }
