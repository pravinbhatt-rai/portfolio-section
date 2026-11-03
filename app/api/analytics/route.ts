import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { cmsRequest } from "../../lib/supabase-rest";

export async function POST(request: Request) {
  const path = new URL(request.url).searchParams.get("path") || "/";
  if (!path.startsWith("/") || path.length > 180 || path.startsWith("/admin") || path.startsWith("/api")) return NextResponse.json({ ok: false });
  const response = NextResponse.json({ ok: true });
  let visitor = request.headers.get("cookie")?.split("pb_visitor=")[1]?.split(";")[0];
  if (!visitor || !/^[0-9a-f-]{36}$/i.test(visitor)) { visitor = randomUUID(); response.cookies.set("pb_visitor", visitor, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 }); }
  const today = new Date().toISOString().slice(0, 10);
  await Promise.all([
    cmsRequest("portfolio_page_views", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ visitor_id: visitor, path, visit_date: today }) }),
    cmsRequest("portfolio_daily_visitors?on_conflict=visitor_id,visit_date", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ visitor_id: visitor, visit_date: today }) }),
  ]);
  return response;
}
