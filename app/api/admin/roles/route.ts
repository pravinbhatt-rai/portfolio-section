import { NextResponse } from "next/server";
import { getPortfolioRole } from "../../../lib/admin-session";
import { cmsConfigured, cmsRequest } from "../../../lib/supabase-rest";

export async function GET() {
  const role = await getPortfolioRole();
  if (role !== "owner") return NextResponse.json({ error: "Only the portfolio owner can manage roles." }, { status: 403 });
  if (!cmsConfigured) return NextResponse.json({ roles: [] });
  const roles = await cmsRequest<{ email: string; role: string; updated_at: string }[]>("portfolio_user_roles?select=email,role,updated_at&order=email.asc");
  return NextResponse.json({ roles: roles || [] });
}

export async function POST(request: Request) {
  const role = await getPortfolioRole();
  if (role !== "owner") return NextResponse.json({ error: "Only the portfolio owner can manage roles." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const assignedRole = body?.role;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["admin", "editor", "viewer"].includes(assignedRole)) return NextResponse.json({ error: "Provide a valid email and choose admin, editor, or viewer." }, { status: 400 });
  const owner = (process.env.OWNER_EMAIL || process.env.ADMIN_EMAIL || (process.env.ADMIN_EMAILS || "").split(",")[0] || "").trim().toLowerCase();
  if (email === owner) return NextResponse.json({ error: "The owner role cannot be changed." }, { status: 400 });
  const saved = await cmsRequest("portfolio_user_roles?on_conflict=email", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ email, role: assignedRole, updated_at: new Date().toISOString() }) });
  return NextResponse.json({ ok: true, saved });
}

export async function DELETE(request: Request) {
  if (await getPortfolioRole() !== "owner") return NextResponse.json({ error: "Only the portfolio owner can manage roles." }, { status: 403 });
  const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });
  await cmsRequest(`portfolio_user_roles?email=eq.${encodeURIComponent(email)}`, { method: "DELETE" });
  return NextResponse.json({ ok: true });
}
