import { NextResponse } from "next/server";
import { cmsConfigured, cmsRequest, cmsSetupError } from "../../lib/supabase-rest";

type SkillRow = { id: string; name: string; category: string; description: string; sort_order: number; project_skills: { portfolio_content: { id: string; type: string; slug: string; title: string; summary: string; thumbnail_url: string; published: boolean } | null }[] };
export async function GET(request: Request) {
  // Reading the request opts this GET route into request-time rendering.
  void request.url;
  if (!cmsConfigured) return NextResponse.json({ skills: [] });
  try {
    const rows = await cmsRequest<SkillRow[]>("skills?select=id,name,category,description,sort_order,project_skills(portfolio_content(id,type,slug,title,summary,thumbnail_url,published))&order=sort_order.asc");
    const skills = (rows || []).map(({ project_skills, ...skill }) => ({ ...skill, projects: project_skills.map((link) => link.portfolio_content).filter((project) => project?.published && project.type === "project") }));
    return NextResponse.json({ skills }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch (error) {
    const setup = cmsSetupError(error, "load the skills collection");
    return NextResponse.json({ skills: [], error: setup.message }, { status: setup.status });
  }
}
