"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

type Notification = { id: string; title: string; description: string; tone: "amber" | "red" | "violet"; href: string };

function BellIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path d="M12 22a2.65 2.65 0 0 0 2.5-1.75h-5A2.65 2.65 0 0 0 12 22Zm7.1-5.25-1.5-1.75V10a5.6 5.6 0 0 0-4.35-5.45V3.5a1.25 1.25 0 0 0-2.5 0v1.05A5.6 5.6 0 0 0 6.4 10V15l-1.5 1.75A1.2 1.2 0 0 0 5.8 18.75h12.4a1.2 1.2 0 0 0 .9-2Z" /></svg>; }

export default function Header() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const initial = (profile?.full_name || "M").trim().charAt(0).toUpperCase();

  async function loadNotifications() {
    setLoading(true);
    let lowStock = 5;
    try { lowStock = Math.max(0, Number(JSON.parse(window.localStorage.getItem("miss-aisyah-preferences") ?? "{}").lowStock ?? 5)); } catch { /* gunakan batas default */ }
    const [productsResult, receivablesResult] = await Promise.all([
      supabase.from("products").select("id,nama,stok").lte("stok", lowStock).order("stok", { ascending: true }).limit(10),
      supabase.from("transactions").select("id,invoice_number,total,paid_amount,customer_name").eq("payment_status", "BELUM_LUNAS").order("created_at", { ascending: false }).limit(10),
    ]);
    const next: Notification[] = [];
    if (!productsResult.error) (productsResult.data ?? []).forEach((product) => {
      const stock = Number(product.stok);
      next.push({ id: `stock-${product.id}`, title: stock === 0 ? "Stok habis" : "Stok menipis", description: `${product.nama}: tersisa ${stock} pcs.`, tone: stock === 0 ? "red" : "amber", href: "/inventory" });
    });
    if (!receivablesResult.error) (receivablesResult.data ?? []).forEach((transaction) => {
      const remaining = Math.max(0, Number(transaction.total) - Number(transaction.paid_amount));
      next.push({ id: `receivable-${transaction.id}`, title: "Piutang belum lunas", description: `${transaction.invoice_number}${transaction.customer_name ? ` - ${transaction.customer_name}` : ""} - sisa Rp ${remaining.toLocaleString("id-ID")}.`, tone: "violet", href: "/sales/history" });
    });
    setNotifications(next);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadNotifications(); }, []);

  return <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-5 py-3 shadow-sm backdrop-blur md:px-8"><div className="relative overflow-hidden"><p className="header-brand-title text-xs font-medium uppercase tracking-wider text-pink-600">MISS AISYAH</p><p className="header-brand-subtitle mt-0.5 text-sm text-gray-500">Sistem operasional fashion</p><span className="header-cart-dash pointer-events-none" aria-hidden="true"><span className="header-cart-dash__speed header-cart-dash__speed--one" /><span className="header-cart-dash__speed header-cart-dash__speed--two" /><span className="header-cart-dash__basket"><span className="header-cart-dash__package" /></span><span className="header-cart-dash__wheel header-cart-dash__wheel--left" /><span className="header-cart-dash__wheel header-cart-dash__wheel--right" /></span></div><div className="flex items-center gap-3"><div className="relative"><button type="button" onClick={() => setOpen((current) => !current)} aria-label="Buka notifikasi" aria-expanded={open} className="relative grid h-10 w-10 place-items-center rounded-full bg-pink-50 text-pink-700 ring-1 ring-pink-100 transition hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-400"><BellIcon />{notifications.length > 0 && <span className="absolute -right-1 -top-1 z-10 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-pink-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">{notifications.length > 9 ? "9+" : notifications.length}</span>}</button>{open && <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"><div className="flex items-center justify-between border-b border-gray-100 px-4 py-3"><div><h2 className="font-bold text-gray-900">Notifikasi</h2><p className="text-xs text-gray-500">Stok dan piutang yang perlu perhatian.</p></div><button type="button" onClick={() => void loadNotifications()} className="rounded-lg px-2 py-1 text-xs font-semibold text-pink-700 hover:bg-pink-50">Segarkan</button></div><div className="max-h-96 overflow-y-auto">{loading ? <p className="px-4 py-8 text-center text-sm text-gray-500">Memuat notifikasi...</p> : notifications.length === 0 ? <p className="px-4 py-8 text-center text-sm text-gray-500">Tidak ada notifikasi baru.</p> : notifications.map((notification) => <Link key={notification.id} href={notification.href} onClick={() => setOpen(false)} className="flex gap-3 border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50"><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.tone === "red" ? "bg-red-500" : notification.tone === "amber" ? "bg-amber-500" : "bg-violet-500"}`} /><span className="min-w-0"><span className="block text-sm font-semibold text-gray-900">{notification.title}</span><span className="mt-0.5 block text-xs leading-5 text-gray-600">{notification.description}</span></span></Link>)}</div></div>}</div><Link href="/profile" aria-label="Buka profil" title="Profil" className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-600 font-bold text-white shadow-sm transition hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-400">{initial}</Link></div></header>;
}
