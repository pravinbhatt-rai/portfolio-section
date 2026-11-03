"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Project = { n: string; title: string; type: string; slug: string; color: string; mark: string; note: string; thumbnail?: string };
const projects: Project[] = [
  { n: "01", title: "Agentic Loan Advisor", type: "GENERATIVE AI · MULTI-AGENT", slug: "agentic-loan-advisor", color: "morrow", mark: "◎", note: "Research, analysis, and recommendations with persistent memory." },
  { n: "02", title: "DocAI Medical RAG Agent", type: "APPLIED AI · HEALTHCARE", slug: "docai-medical-rag-agent", color: "fieldnotes", mark: "+", note: "Turning long medical documents into grounded answers." },
  { n: "03", title: "QuantPilot AutoTrade Core", type: "REAL-TIME · FINTECH", slug: "quantpilot-autotrade-core", color: "openhouse", mark: "↗", note: "Market streams, strategy execution, and risk controls." },
  { n: "04", title: "SixFinance AI Financial RAG", type: "GENERATIVE AI · FINTECH", slug: "sixfinance-ai-rag-platform", color: "fieldnotes", mark: "✳", note: "Financial document search connected to product APIs." },
];

export function ProjectCarousel() {
  const [entries, setEntries] = useState<Project[]>(projects);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/content?type=project").then(response => response.json()).then(({ items }) => {
      if (cancelled || !Array.isArray(items) || !items.length) return;
      const bySlug = new Map(items.map((item: { slug: string; title: string; summary: string; thumbnail_url?: string }) => [item.slug, item]));
      const known = new Set(projects.map(item => item.slug));
      const current = projects.map(item => {
        const remote = bySlug.get(item.slug) as { title: string; summary: string; thumbnail_url?: string } | undefined;
        return remote ? { ...item, title: remote.title, note: remote.summary || item.note, thumbnail: remote.thumbnail_url || undefined } : item;
      });
      const additional = items.filter((item: { slug: string }) => !known.has(item.slug)).map((item: { slug: string; title: string; summary: string; thumbnail_url?: string }, index: number) => ({ n: String(projects.length + index + 1).padStart(2, "0"), title: item.title, type: "PROJECT · CASE STUDY", slug: item.slug, color: index % 2 ? "fieldnotes" : "morrow", mark: "✳", note: item.summary, thumbnail: item.thumbnail_url || undefined }));
      setEntries([...current, ...additional]);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return <section className="work-section section-pad project-gallery-section" id="work">
    <div className="project-gallery-inner">
      <div className="project-gallery-heading">
        <div><span className="project-gallery-kicker">03 / SELECTED WORK · {String(entries.length).padStart(2, "0")} CASE STUDIES</span><h2>Projects<span>.</span></h2></div>
        <Link href="/projects" className="project-gallery-all">Browse all projects <span>↗</span></Link>
      </div>
      <div className="project-gallery-grid">
        {entries.map(project => <Link data-slug={project.slug} className={`project-gallery-item ${project.color}`} key={project.slug} href={`/projects/${project.slug}`}>
          <div className="project-gallery-visual">
            {project.thumbnail ? <img src={project.thumbnail} alt={`${project.title} preview`} loading="lazy" draggable={false}/> : <div className="project-gallery-art" aria-hidden="true"><span>{project.mark}</span><i/><b/></div>}
            <span className="project-gallery-open">OPEN CASE ↗</span>
            <span className="project-gallery-index">{project.n}</span>
          </div>
          <div className="project-gallery-copy"><div><span>{project.type}</span><h3>{project.title}</h3><p>{project.note}</p></div><span className="project-gallery-arrow">↗</span></div>
        </Link>)}
      </div>
    </div>
  </section>;
}
