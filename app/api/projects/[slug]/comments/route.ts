import { NextResponse } from "next/server";
import { cmsConfigured, cmsRequest } from "../../../../lib/supabase-rest";
import { createSupabaseServerClient } from "../../../../lib/admin-session";

type Comment = { id: string; author_name: string; message: string; created_at: string };
const slugIsValid = (slug: string) => /^[a-z0-9-]{1,100}$/.test(slug);

export async function GET(request: Request, { params }: RouteContext<"/api/projects/[slug]/comments">) {
  const { slug } = await params;
  if (!slugIsValid(slug)) return NextResponse.json({ comments: [] }, { status: 400 });
  if (!cmsConfigured) return NextResponse.json({ comments: [], configured: false });
  const type = new URL(request.url).searchParams.get("type") === "blog" ? "blog" : "project";
  const comments = await cmsRequest<Comment[]>(`portfolio_comments?select=id,author_name,message,created_at&content_type=eq.${type}&project_slug=eq.${encodeURIComponent(slug)}&status=eq.approved&order=created_at.desc&limit=100`);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const reactions = await cmsRequest<{ count: number; user_liked: boolean }[]>(`rpc/portfolio_reaction_summary`, { method: "POST", body: JSON.stringify({ content_type: type, content_slug: slug, viewer_id: user?.id || null }) });
  return NextResponse.json({ comments: comments || [], configured: true, count: reactions?.[0]?.count || 0, liked: reactions?.[0]?.user_liked || false });
}

export async function POST(request: Request, { params }: RouteContext<"/api/projects/[slug]/comments">) {
  const { slug } = await params;
  const origin = request.headers.get("origin");
  let sameOrigin = false;
  try { sameOrigin = Boolean(origin) && new URL(origin!).origin === new URL(request.url).origin; } catch { sameOrigin = false; }
  if (!sameOrigin) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  if (!slugIsValid(slug)) return NextResponse.json({ error: "Content was not found." }, { status: 404 });
  if (!cmsConfigured) return NextResponse.json({ error: "Comments are not configured yet." }, { status: 503 });
  const type = new URL(request.url).searchParams.get("type") === "blog" ? "blog" : "project";
  const project = await cmsRequest<{ id: string }[]>(`portfolio_content?select=id&type=eq.${type}&slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`);
  if (!project?.length) return NextResponse.json({ error: "Content was not found." }, { status: 404 });
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = supabase ? await supabase.auth.getUser() : { data: { user: null }, error: new Error("not configured") };
  if (authError || !user) return NextResponse.json({ error: "Sign in to comment or like." }, { status: 401 });
  if (Number(request.headers.get("content-length") || 0) > 10000) return NextResponse.json({ error: "Comment is too long." }, { status: 413 });
  const body = await request.json().catch(() => null);
  if (body?.action === "like") {
    const existing = await cmsRequest<{ id: string }[]>(`portfolio_reactions?select=id&content_type=eq.${type}&content_slug=eq.${encodeURIComponent(slug)}&user_id=eq.${user.id}&limit=1`);
    if (existing?.length) await cmsRequest(`portfolio_reactions?id=eq.${existing[0].id}`, { method: "DELETE" });
    else await cmsRequest("portfolio_reactions", { method: "POST", body: JSON.stringify({ content_type: type, content_slug: slug, user_id: user.id }) });
    return NextResponse.json({ ok: true, liked: !existing?.length });
  }
  const authorName = String(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Member").replace(/\s+/g, " ").slice(0, 48);
  const message = String(body?.message || "").trim().slice(0, 1200);
  if (authorName.length < 2 || message.length < 12) return NextResponse.json({ error: "Add your name and a comment of at least 12 characters." }, { status: 400 });
  if (message.length < 12) return NextResponse.json({ error: "Write at least 12 characters." }, { status: 400 });
  const saved = await cmsRequest<unknown[]>("portfolio_comments?on_conflict=content_type,project_slug,commenter_id,submitted_date", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=representation" }, body: JSON.stringify({ content_type: type, project_slug: slug, commenter_id: user.id, author_name: authorName, message, status: "pending", submitted_date: new Date().toISOString().slice(0, 10) }) });
  if (!saved?.length) return NextResponse.json({ error: "One comment per day is allowed on this page." }, { status: 429 });
  return NextResponse.json({ ok: true, pending: true });
}
