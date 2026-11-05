"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ScrollCards, type ScrollCardItem } from "../components/ui/scroll-cards";

type Project = ScrollCardItem & { slug: string; n: string };

const projects: Project[] = [
  { n: "01", title: "Agentic Loan Advisor", tag: "GENERATIVE AI · MULTI-AGENT", slug: "agentic-loan-advisor", mark: "◎", description: "Research, analysis, and recommendations with persistent memory.", link: "/projects/agentic-loan-advisor", color: "var(--project-card-light)", textColor: "var(--project-card-light-ink)" },
  { n: "02", title: "DocAI Medical RAG Agent", tag: "APPLIED AI · HEALTHCARE", slug: "docai-medical-rag-agent", mark: "+", description: "Turning long medical documents into grounded answers.", link: "/projects/docai-medical-rag-agent", color: "var(--project-card-dark)", textColor: "var(--project-card-dark-ink)" },
  { n: "03", title: "QuantPilot AutoTrade Core", tag: "REAL-TIME · FINTECH", slug: "quantpilot-autotrade-core", mark: "↗", description: "Market streams, strategy execution, and risk controls.", link: "/projects/quantpilot-autotrade-core", color: "var(--project-card-light)", textColor: "var(--project-card-light-ink)" },
  { n: "04", title: "SixFinance AI Financial RAG", tag: "GENERATIVE AI · FINTECH", slug: "sixfinance-ai-rag-platform", mark: "✳", description: "Financial document search connected to product APIs.", link: "/projects/sixfinance-ai-rag-platform", color: "var(--project-card-dark)", textColor: "var(--project-card-dark-ink)" },
];

export function ProjectStories() {
  const [entries, setEntries] = useState<Project[]>(projects);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/content?type=project").then(response => response.json()).then(({ items }) => {
      if (cancelled || !Array.isArray(items) || !items.length) return;
      const remoteBySlug = new Map(items.map((item: { slug: string; title: string; summary: string; thumbnail_url?: string }) => [item.slug, item]));
      const known = new Set(projects.map(project => project.slug));
      const merged = projects.map(project => {
        const remote = remoteBySlug.get(project.slug) as { title: string; summary: string; thumbnail_url?: string } | undefined;
        return remote ? { ...project, title: remote.title, description: remote.summary || project.description, src: remote.thumbnail_url || project.src } : project;
      });
      const additional = items.filter((item: { slug: string }) => !known.has(item.slug)).map((item: { slug: string; title: string; summary: string; thumbnail_url?: string }, index: number): Project => ({
        n: String(projects.length + index + 1).padStart(2, "0"), title: item.title, tag: "PROJECT · CASE STUDY", slug: item.slug, mark: "✳", description: item.summary,
        link: `/projects/${item.slug}`, src: item.thumbnail_url, color: (projects.length + index) % 2 ? "var(--project-card-dark)" : "var(--project-card-light)", textColor: (projects.length + index) % 2 ? "var(--project-card-dark-ink)" : "var(--project-card-light-ink)",
      }));
      setEntries([...merged, ...additional]);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return <section className="project-stack-section" id="work">
    <ScrollCards items={entries} heading={<>
      <div><span>03 / SELECTED WORK · {String(entries.length).padStart(2, "0")} CASE STUDIES</span><h2>Projects<span>.</span></h2></div>
      <div><p>Scroll through the work. Each card opens its full case study.</p><Link href="/projects">Browse all projects ↗</Link></div>
    </>} />
  </section>;
}
