"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Project = { n: string; title: string; type: string; slug: string; color: string; mark: string; note: string; thumbnail?: string };
const projects: Project[] = [
  { n: "01", title: "Agentic Loan Advisor", type: "GENERATIVE AI · MULTI-AGENT", slug: "agentic-loan-advisor", color: "morrow", mark: "◎", note: "Research, analysis, and recommendations with persistent memory." },
  { n: "02", title: "DocAI Medical RAG Agent", type: "APPLIED AI · HEALTHCARE", slug: "docai-medical-rag-agent", color: "fieldnotes", mark: "+", note: "Turning long medical documents into grounded answers." },
  { n: "03", title: "QuantPilot AutoTrade Core", type: "REAL-TIME · FINTECH", slug: "quantpilot-autotrade-core", color: "openhouse", mark: "↗", note: "Market streams, strategy execution, and risk controls." },
  { n: "04", title: "SixFinance AI Financial RAG", type: "GENERATIVE AI · FINTECH", slug: "sixfinance-ai-rag-platform", color: "fieldnotes", mark: "✳", note: "Financial document search connected to product APIs." },
];

export function ProjectCarousel() {
  const [entries, setEntries] = useState<Project[]>(projects);
  const viewport = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
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

  useEffect(() => {
    const rail = viewport.current, section = sectionRef.current, track = trackRef.current;
    if (!rail || !section || !track) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    if (mobile) return;
    if (reduced) {
      section.classList.add("project-static-carousel");
      return () => section.classList.remove("project-static-carousel");
    }
    gsap.registerPlugin(ScrollTrigger);
    section.classList.add("project-story-ready");
    const root = document.documentElement;
    let cards: HTMLElement[] = [];
    let arrangeCarousel = () => {};
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const progress = ScrollTrigger.getById("project-carousel")?.progress ?? 0;
        const revealEnd = 0.2 + 0.12;
        const active = Math.min(cards.length - 1, Math.max(0, Math.floor(((progress - revealEnd) / Math.max(0.01, 1 - revealEnd)) * Math.max(1, cards.length - 1) + 0.35)));
        cards.forEach((card, index) => {
          card.classList.toggle("is-centered", index === active);
          gsap.set(card, { zIndex: index === active ? cards.length + 2 : cards.length - index });
        });
        if (progressRef.current) progressRef.current.textContent = `${String(active + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
      });
    };
    let frame = 0;
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline();
      timeline.to(".project-intro-scene", { rotateX: -76, scaleY: 0.08, yPercent: -18, autoAlpha: 0, transformOrigin: "50% 0%", duration: 0.2, ease: "power2.in" });
      timeline.fromTo(rail, { autoAlpha: 0, y: 48, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.12, ease: "power2.out" });
      timeline.fromTo(".carousel-controls", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "none" }, "<");
      timeline.addLabel("deck-1");
      cards = gsap.utils.toArray<HTMLElement>(".project-card", track);
      const stepAngle = 360 / Math.max(1, cards.length);
      arrangeCarousel = () => {
        const cardWidth = Math.min(680, window.innerWidth * 0.54);
        const polygonRadius = cards.length > 2 ? cardWidth / (2 * Math.tan(Math.PI / cards.length)) : cardWidth * 0.82;
        const radius = Math.min(window.innerWidth * 0.48, Math.max(cardWidth * 0.84, polygonRadius));
        gsap.set(track, { rotationY: 0, transformStyle: "preserve-3d", transformPerspective: 1400 });
        gsap.set(cards, { rotationY: index => index * stepAngle, z: radius, zIndex: index => cards.length - index });
      };
      arrangeCarousel();
      ScrollTrigger.addEventListener("refreshInit", arrangeCarousel);
      for (let index = 1; index < cards.length; index += 1) {
        timeline.to(track, { rotationY: -stepAngle * index, duration: 0.64, ease: "power2.inOut" });
        timeline.addLabel(`deck-${index + 1}`);
      }
      ScrollTrigger.create({
        id: "project-carousel",
        trigger: section,
        animation: timeline,
        start: "top top",
        end: () => `+=${Math.max(window.innerHeight * 6, window.innerHeight * (1.4 + entries.length * 1.45))}`,
        pin: section,
        pinSpacing: true,
        scrub: 1,
        snap: { snapTo: "labelsDirectional", duration: { min: 0.2, max: 0.55 }, delay: 0.12, ease: "power1.inOut" },
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: update,
        onToggle: self => root.classList.toggle("project-scroll-active", self.isActive),
      });
      ScrollTrigger.refresh();
    }, section);
    update();
    return () => { cancelAnimationFrame(frame); ScrollTrigger.removeEventListener("refreshInit", arrangeCarousel); ctx.revert(); section.classList.remove("project-story-ready"); root.classList.remove("project-scroll-active"); };
  }, [entries]);

  const move = (direction: -1 | 1) => {
    const rail = viewport.current;
    const card = rail?.querySelector<HTMLElement>(".project-card");
    const trigger = ScrollTrigger.getById("project-carousel");
    if (trigger) {
      const next = Math.max(0, Math.min(1, trigger.progress + direction * (1 / Math.max(3, entries.length + 1))));
      window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * next, behavior: "smooth" });
      return;
    }
    if (rail && card) rail.scrollBy({ left: direction * (card.offsetWidth + 22), behavior: "smooth" });
  };
  return <section ref={sectionRef} className="work-section section-pad" id="work">
    <div className="project-stage">
      <div className="project-intro-scene">
        <div className="section-index"><span>03 / SELECTED WORK</span><Link href="/projects">ALL PROJECTS ↗</Link></div>
        <div className="project-title-lockup"><span>CASE FILES · {String(entries.length).padStart(2, "0")}</span><h2>Projects</h2><p>Scroll to open the collection</p></div>
      </div>
      <div className="project-carousel-scene">
        <div className="project-viewport" ref={viewport} aria-label="Selected projects carousel" tabIndex={0}><div className="project-track" ref={trackRef}>{entries.map(project => <Link data-slug={project.slug} className={`project-card ${project.color}`} key={project.slug} href={`/projects/${project.slug}`}><div className="project-visual"><div className="project-art"><span>{project.mark}</span><i/><b/><small>{project.note}</small></div>{project.thumbnail && <img className="project-photo" src={project.thumbnail} alt="" loading="lazy" draggable={false}/>}<span className="project-open">VIEW CASE ↗</span></div><div className="project-meta"><span>{project.n} / {project.type}</span><h3>{project.title}</h3><span className="project-arrow">↗</span></div></Link>)}</div></div>
        <div className="carousel-controls"><span>SCROLL TO STACK THROUGH THE WORK</span><div><span className="carousel-progress" ref={progressRef}>01 / {String(entries.length).padStart(2, "0")}</span><button aria-label="Previous project" onClick={() => move(-1)}>←</button><button aria-label="Next project" onClick={() => move(1)}>→</button></div></div>
        <div className="carousel-tail"><span>{String(entries.length).padStart(2, "0")} SELECTED STORIES</span><Link href="/projects" className="under-link">Explore all projects <span>↗</span></Link></div>
      </div>
    </div>
  </section>;
}
