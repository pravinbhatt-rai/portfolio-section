import { NextResponse } from "next/server";
import { isAdmin } from "../../../lib/admin-session";
import { cmsConfigured, cmsRequest } from "../../../lib/supabase-rest";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Sign in to review comments." }, { status: 401 });
  if (!cmsConfigured) return NextResponse.json({ comments: [] }, { status: 503 });
  const comments = await cmsRequest<Record<string, unknown>[]>("portfolio_comments?select=id,project_slug,author_name,message,status,created_at&order=created_at.desc&limit=200");
  return NextResponse.json({ comments: comments || [] });
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Sign in to review comments." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.id || !["approved", "rejected"].includes(body.status)) return NextResponse.json({ error: "Choose approved or rejected." }, { status: 400 });
  await cmsRequest(`portfolio_comments?id=eq.${encodeURIComponent(body.id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: body.status }) });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Sign in to review comments." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Comment id is required." }, { status: 400 });
  await cmsRequest(`portfolio_comments?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  return NextResponse.json({ ok: true });
}
