import { NextResponse } from "next/server";
import { canEditPortfolio, canViewPortfolio, getPortfolioRole } from "../../../lib/admin-session";
import { cmsConfigured, cmsRequest } from "../../../lib/supabase-rest";

export async function GET() {
  if (!(await canViewPortfolio())) return NextResponse.json({ error: "Sign in to view the portfolio dashboard." }, { status: 403 });
  if (!cmsConfigured) return NextResponse.json({ error: "Add Supabase credentials to enable the content dashboard." }, { status: 503 });
  const role = await getPortfolioRole();
  const [items, analytics, skills, links, comments] = await Promise.all([
    cmsRequest<Record<string, unknown>[]>("portfolio_content?select=*&order=updated_at.desc"),
    cmsRequest<{ views: number; visitors: number; paths: [string, number][] }>("rpc/portfolio_dashboard_stats", { method: "POST", body: "{}" }),
    cmsRequest<{ id: string; name: string; category: string }[]>("skills?select=id,name,category&order=sort_order.asc"),
    cmsRequest<{ project_id: string; skill_id: string }[]>("project_skills?select=project_id,skill_id"),
    role === "owner" || role === "admin" ? cmsRequest<Record<string, unknown>[]>("portfolio_comments?select=id,project_slug,author_name,message,status,created_at&status=eq.pending&order=created_at.desc&limit=200") : Promise.resolve([]),
  ]);
  const decoratedItems = (items || []).map((item) => ({ ...item, skill_ids: (links || []).filter((link) => link.project_id === item.id).map((link) => link.skill_id) }));
  return NextResponse.json({ items: decoratedItems, analytics: analytics || { views: 0, visitors: 0, paths: [] }, skills: skills || [], comments: comments || [], role });
}

async function syncProjectSkills(projectId: string, skillIds: unknown) {
  await cmsRequest(`project_skills?project_id=eq.${encodeURIComponent(projectId)}`, { method: "DELETE" });
  const ids = Array.isArray(skillIds) ? skillIds.filter((id): id is string => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)) : [];
  if (ids.length) await cmsRequest("project_skills", { method: "POST", body: JSON.stringify(ids.map((skillId) => ({ project_id: projectId, skill_id: skillId }))) });
}

function slugify(value: unknown) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

export async function POST(request: Request) {
  if (!(await canEditPortfolio())) return NextResponse.json({ error: "You need an editor role to manage portfolio content." }, { status: 403 });
  if (!cmsConfigured) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const body = await request.json().catch(() => null);
  if (!body || !["project", "blog", "achievement"].includes(body.type) || !body.title || !body.slug) return NextResponse.json({ error: "Choose a type and provide a title and URL slug." }, { status: 400 });
  const slug = slugify(body.slug);
  if (!slug || String(body.body || "").length > 30000) return NextResponse.json({ error: "Use a valid URL slug and keep story details under 30,000 characters." }, { status: 400 });
  const row = { type: body.type, title: String(body.title).slice(0, 180), slug, summary: String(body.summary || "").slice(0, 500), body: String(body.body || ""), thumbnail_url: String(body.thumbnail_url || "").slice(0, 1000), published: Boolean(body.published), updated_at: new Date().toISOString() };
  const saved = await cmsRequest<{ id: string }[]>("portfolio_content", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) });
  if (body.type === "project" && saved?.[0]?.id) await syncProjectSkills(saved[0].id, body.skill_ids);
  return NextResponse.json({ saved });
}

export async function PATCH(request: Request) {
  if (!(await canEditPortfolio())) return NextResponse.json({ error: "You need an editor role to manage portfolio content." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body?.id || !body?.title || !body?.slug || !["project", "blog", "achievement"].includes(body.type)) return NextResponse.json({ error: "An item id, valid type, title, and slug are required." }, { status: 400 });
  const saved = await cmsRequest(`portfolio_content?id=eq.${encodeURIComponent(body.id)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ type: body.type, title: String(body.title).slice(0, 180), slug: slugify(body.slug), summary: String(body.summary || "").slice(0, 500), body: String(body.body || "").slice(0, 30000), thumbnail_url: String(body.thumbnail_url || "").slice(0, 1000), published: Boolean(body.published), updated_at: new Date().toISOString() }) });
  await syncProjectSkills(String(body.id), body.type === "project" ? body.skill_ids : []);
  return NextResponse.json({ saved });
}

export async function DELETE(request: Request) {
  if (!(await canEditPortfolio())) return NextResponse.json({ error: "You need an editor role to manage portfolio content." }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Item id is required." }, { status: 400 });
  await cmsRequest(`portfolio_content?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  return NextResponse.json({ ok: true });
}
