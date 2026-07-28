"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ChatPanel } from "./ChatPanel";

export function FloatingAIButton() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  if (loading || !user) return null;

  return <><ChatPanel open={open} onClose={() => setOpen(false)} /><button type="button" onClick={() => setOpen((value) => !value)} className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900" aria-label={open ? "Tutup KasirIntelek" : "Buka KasirIntelek"}>{open ? "✕" : "✦"}</button></>;
}
