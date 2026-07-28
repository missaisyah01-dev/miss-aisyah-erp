"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";

export type Brand = { id: string; name: string; slug: string; logo_url: string | null; primary_color: string; favicon_url: string | null; whatsapp: string | null; address: string | null; information: string | null };
type BrandContextValue = { brands: Brand[]; brand: Brand | null; loadingBrand: boolean; selectBrand: (brand: Brand) => void; refreshBrands: () => Promise<void> };
const BrandContext = createContext<BrandContextValue | undefined>(undefined);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth(); const [brands, setBrands] = useState<Brand[]>([]); const [brand, setBrand] = useState<Brand | null>(null); const [loadingBrand, setLoadingBrand] = useState(true);
  async function refreshBrands() { if (!user) { setBrands([]); setBrand(null); setLoadingBrand(false); return; } setLoadingBrand(true); const { data } = await supabase.from("brands").select("id,name,slug,logo_url,primary_color,favicon_url,whatsapp,address,information").order("name"); const next = (data ?? []) as Brand[]; setBrands(next); const stored = typeof window === "undefined" ? null : window.localStorage.getItem("active-brand-id"); setBrand(next.find((item) => item.id === stored) ?? next[0] ?? null); setLoadingBrand(false); }
  useEffect(() => { void refreshBrands(); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!brand || typeof document === "undefined") return; document.documentElement.style.setProperty("--brand-primary", brand.primary_color || "#db2777"); document.title = brand.name; if (brand.favicon_url) { let icon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null; if (!icon) { icon = document.createElement("link"); icon.rel = "icon"; document.head.appendChild(icon); } icon.href = brand.favicon_url; } }, [brand]);
  function selectBrand(next: Brand) { setBrand(next); window.localStorage.setItem("active-brand-id", next.id); }
  return <BrandContext.Provider value={{ brands, brand, loadingBrand, selectBrand, refreshBrands }}>{children}</BrandContext.Provider>;
}
export function useBrand() { const context = useContext(BrandContext); if (!context) throw new Error("useBrand harus digunakan di dalam BrandProvider"); return context; }
