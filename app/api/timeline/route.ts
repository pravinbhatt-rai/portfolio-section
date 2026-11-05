import { NextResponse } from "next/server";
import { connection } from "next/server";
import { cmsConfigured, cmsRequest } from "../../lib/supabase-rest";

export async function GET() {
  await connection();
  if (!cmsConfigured) return NextResponse.json({ items: [], configured: false });
  try {
    const items = await cmsRequest<unknown[]>("career_milestones?select=*&is_published=eq.true&order=sort_order.asc,start_date.asc");
    return NextResponse.json({ items: items || [], configured: true }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch {
    return NextResponse.json({ items: [], configured: true, error: "Career timeline data could not be loaded." }, { status: 503 });
  }
}
