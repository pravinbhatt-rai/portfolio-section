"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Project = { id?: string; slug: string; n: string; name: string; desc: string; type: string; c: string; thumbnail_url?: string; stack?: string };

export function ProjectDirectory({ fallback }: { fallback: Project[] }) {
  const [projects, setProjects] = useState(fallback);
  const [activeSlug, setActiveSlug] = useState(fallback[0]?.slug || "");
  useEffect(() => {
    let cancelled = false;
    fetch("/api/content?type=project").then(response => response.json()).then(({ items }) => {
      if (cancelled || !Array.isArray(items) || !items.length) return;
      const remote = items.map((item: { id: string; slug: string; title: string; summary: string; thumbnail_url: string }, index: number) => ({ id: item.id, slug: item.slug, n: String(index + 1).padStart(2, "0"), name: item.title, desc: item.summary, type: "PROJECT · CASE STUDY", c: index % 2 ? "fieldnotes" : "morrow", thumbnail_url: item.thumbnail_url }));
      const remoteBySlug = new Map(remote.map((item: Project) => [item.slug, item]));
      const featured = fallback.map(item => remoteBySlug.get(item.slug) ? { ...item, ...remoteBySlug.get(item.slug) } : item);
      const known = new Set(fallback.map(item => item.slug));
      setProjects([...featured, ...remote.filter((item: Project) => !known.has(item.slug))]);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [fallback]);
  const active = projects.find(project => project.slug === activeSlug) || projects[0];
  return <div className="project-directory-shell">
    <div className="inner-projects" aria-label="Project list">{projects.map(project => <Link className={`inner-project reveal ${project.c} ${active?.slug === project.slug ? "is-active" : ""}`} key={project.slug} href={`/projects/${project.slug}`} onPointerEnter={() => setActiveSlug(project.slug)} onFocus={() => setActiveSlug(project.slug)}><div className="inner-project-art" style={project.thumbnail_url ? { backgroundImage: `linear-gradient(#17131722,#17131755),url("${project.thumbnail_url}")`, backgroundSize: "cover", backgroundPosition: "center" } : {}}><span>{project.n}</span><i/><b/></div><div><small>{project.type}</small><h2>{project.name}</h2><p>{project.desc}</p></div><span className="project-arrow">↗</span></Link>)}</div>
    {active && <aside className="project-preview" aria-live="polite" key={active.slug}>
      <div className={`project-preview-art ${active.c}`} style={active.thumbnail_url ? { backgroundImage: `linear-gradient(180deg,#11131700 38%,#111317cc),url("${active.thumbnail_url}")`, backgroundSize: "cover", backgroundPosition: "center" } : {}}><span>{active.n}</span><i/><b/><small>SELECTED WORK · {active.n}</small></div>
      <div className="project-preview-copy"><span className="eyebrow">{active.type}</span><h2>{active.name}</h2><p>{active.desc}</p><div className="project-preview-stack"><span>FOCUS</span><strong>{active.stack || "Backend systems · Applied AI · Product engineering"}</strong></div><Link className="under-link" href={`/projects/${active.slug}`}>Explore this project <span>↗</span></Link></div>
    </aside>}
  </div>;
}
