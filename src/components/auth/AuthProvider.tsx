"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type AppRole = "OWNER" | "ADMIN" | "KASIR";
type Profile = { id: string; full_name: string | null; role: AppRole };
type AuthContextValue = { user: User | null; profile: Profile | null; loading: boolean; signOut: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function updateUser(nextUser: User | null) {
    setUser(nextUser);
    if (!nextUser) { setProfile(null); setLoading(false); return; }
    const { data } = await supabase.from("profiles").select("id, full_name, role").eq("id", nextUser.id).single();
    setProfile((data as Profile | null) ?? null);
    setLoading(false);
  }

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => updateUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { void updateUser(session?.user ?? null); });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() { await supabase.auth.signOut(); }
  return <AuthContext.Provider value={{ user, profile, loading, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus digunakan di dalam AuthProvider");
  return context;
}
