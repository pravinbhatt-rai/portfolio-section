import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cmsRequest } from "./supabase-rest";

export type PortfolioRole = "owner" | "admin" | "editor" | "viewer" | "none";

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* Server Components cannot write refreshed cookies; proxy.ts handles refresh. */ }
      },
    },
  });
}

export async function isAdmin() {
  const role = await getPortfolioRole();
  return role === "owner" || role === "admin";
}

export async function getPortfolioRole(): Promise<PortfolioRole> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return "none";
  const { data: { user }, error } = await supabase.auth.getUser();
  const email = !error ? user?.email?.trim().toLowerCase() : "";
  if (!email) return "none";
  const owner = (process.env.OWNER_EMAIL || process.env.ADMIN_EMAIL || (process.env.ADMIN_EMAILS || "").split(",")[0] || "").trim().toLowerCase();
  if (owner && owner === email) return "owner";
  let row: { role: PortfolioRole }[] | null = null;
  try { row = await cmsRequest<{ role: PortfolioRole }[]>(`portfolio_user_roles?select=role&email=eq.${encodeURIComponent(email)}&limit=1`); } catch { row = null; }
  if (row?.[0]?.role) return row[0].role;
  const allowlist = (process.env.ADMIN_EMAILS || "").split(",").map(value => value.trim().toLowerCase());
  return allowlist.includes(email) ? "admin" : "none";
}

export async function canEditPortfolio() { const role = await getPortfolioRole(); return role === "owner" || role === "admin" || role === "editor"; }
export async function canViewPortfolio() { const role = await getPortfolioRole(); return role !== "none"; }
