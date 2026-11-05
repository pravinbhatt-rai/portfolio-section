import { NextResponse } from "next/server";
import { canEditPortfolio, canViewPortfolio } from "../../../lib/admin-session";
import { cmsConfigured, cmsRequest } from "../../../lib/supabase-rest";

const categories = new Set(["Education", "Experience", "Project", "Achievement"]);
const cleanText = (value: unknown, limit: number) => String(value ?? "").trim().slice(0, limit);
const cleanList = (value: unknown) => Array.isArray(value)
  ? value.map((item) => cleanText(item, 220)).filter(Boolean).slice(0, 30)
  : typeof value === "string" ? value.split(/\r?\n|,/).map((item) => cleanText(item, 220)).filter(Boolean).slice(0, 30) : [];

function normalize(body: Record<string, unknown>) {
  const title = cleanText(body.title, 180);
  const category = cleanText(body.category, 40);
  const organization = cleanText(body.organization, 180);
  const role = cleanText(body.role, 180);
  const startDate = cleanText(body.start_date ?? body.startDate, 10);
  const endDate = cleanText(body.end_date ?? body.endDate, 10);
  const description = cleanText(body.description, 2400);
  const position = body.position === "right" ? "right" : body.position === "center" ? "center" : "left";
  const sortOrder = Number.isInteger(Number(body.sort_order ?? body.sortOrder)) ? Number(body.sort_order ?? body.sortOrder) : 0;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!title || !organization || !role || !description || !categories.has(category)) return { error: "Add a title, category, organization, role, and description." };
  if (!datePattern.test(startDate) || (endDate && !datePattern.test(endDate))) return { error: "Use valid start and end dates." };
  if (endDate && endDate < startDate) return { error: "The end date must not be earlier than the start date." };
  if (sortOrder < 0 || sortOrder > 10000) return { error: "Sort order must be between 0 and 10,000." };
  return {
    value: {
      title, category, organization, role, start_date: startDate, end_date: endDate || null,
      description, achievements: cleanList(body.achievements), technologies: cleanList(body.technologies),
      location: cleanText(body.location, 120), logo_url: cleanText(body.logo_url ?? body.logo, 1000),
      position, sort_order: sortOrder, is_published: Boolean(body.is_published ?? body.isPublished),
      updated_at: new Date().toISOString(),
    },
  };
}

export async function GET() {
  if (!(await canViewPortfolio())) return NextResponse.json({ error: "Sign in to view timeline entries." }, { status: 403 });
  if (!cmsConfigured) return NextResponse.json({ items: [] }, { status: 503 });
  try {
    const items = await cmsRequest<unknown[]>("career_milestones?select=*&order=sort_order.asc,start_date.asc");
    return NextResponse.json({ items: items || [] });
  } catch {
    return NextResponse.json({ error: "Could not load timeline entries. Apply the career timeline schema in Supabase first." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await canEditPortfolio())) return NextResponse.json({ error: "An editor role is required to manage milestones." }, { status: 403 });
  if (!cmsConfigured) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Provide timeline milestone data." }, { status: 400 });
  const result = normalize(body);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  try {
    const saved = await cmsRequest("career_milestones", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(result.value) });
    return NextResponse.json({ saved }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save the milestone. Check the Supabase migration and required fields." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await canEditPortfolio())) return NextResponse.json({ error: "An editor role is required to manage milestones." }, { status: 403 });
  if (!cmsConfigured) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id)) return NextResponse.json({ error: "A valid milestone id is required." }, { status: 400 });
  if (Object.keys(body).length === 2 && Number.isInteger(Number(body.sort_order))) {
    try {
      const saved = await cmsRequest(`career_milestones?id=eq.${encodeURIComponent(body.id)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ sort_order: Math.max(0, Math.min(10000, Number(body.sort_order))), updated_at: new Date().toISOString() }) });
      return NextResponse.json({ saved });
    } catch { return NextResponse.json({ error: "Could not reorder the milestone." }, { status: 500 }); }
  }
  const result = normalize(body);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  try {
    const saved = await cmsRequest(`career_milestones?id=eq.${encodeURIComponent(body.id)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(result.value) });
    return NextResponse.json({ saved });
  } catch { return NextResponse.json({ error: "Could not update the milestone." }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  if (!(await canEditPortfolio())) return NextResponse.json({ error: "An editor role is required to manage milestones." }, { status: 403 });
  if (!cmsConfigured) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "A valid milestone id is required." }, { status: 400 });
  try {
    await cmsRequest(`career_milestones?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Could not delete the milestone." }, { status: 500 }); }
}
