import { NextResponse } from "next/server";
import { cmsRequest } from "../../lib/supabase-rest";

export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type");
  if (!type || !["project", "blog", "achievement"].includes(type)) return NextResponse.json({ items: [] });
  const items = await cmsRequest<Record<string, unknown>[]>(`portfolio_content?select=*&type=eq.${type}&published=eq.true&order=updated_at.desc`);
  return NextResponse.json({ items: items || [] }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
