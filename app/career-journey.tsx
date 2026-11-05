"use client";

import { motion, useInView, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type Milestone = {
  id: string;
  title: string;
  category: string;
  organization: string;
  role: string;
  start_date: string;
  end_date: string | null;
  description: string;
  achievements: string[];
  technologies: string[];
  location: string;
  logo_url: string;
  position: "left" | "right" | "center";
  sort_order: number;
};

function formatDate(date: string) {
  if (!date) return "Present";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en", { month: "short", year: "numeric" });
}

function makeRoad(count: number, mobile: boolean) {
  const desktopX = [48, 59, 43, 56, 45, 54];
  const mobileX = [9, 13, 8, 12, 8, 11];
  const offsets = mobile ? mobileX : desktopX;
  const stops = Array.from({ length: count }, (_, index) => ({
    x: offsets[index % offsets.length],
    y: ((index + 0.5) / count) * 1000,
  }));
  const points = [{ x: offsets[0], y: 0 }, ...stops, { x: offsets[(count - 1) % offsets.length], y: 1000 }];
  const [first, ...rest] = points;
  let path = `M ${first.x} ${first.y}`;
  for (let index = 0; index < rest.length; index += 1) {
    const from = index === 0 ? first : rest[index - 1];
    const to = rest[index];
    const mid = (from.y + to.y) / 2;
    path += ` C ${from.x} ${mid}, ${to.x} ${mid}, ${to.x} ${to.y}`;
  }
  return { path, stops };
}

function JourneyStop({ item, index, total, roadX, progress, mobile }: {
  item: Milestone;
  index: number;
  total: number;
  roadX: number;
  progress: ReturnType<typeof useSpring>;
  mobile: boolean;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const inView = useInView(cardRef, { once: true, amount: 0.25 });
  const start = index / total;
  const revealEnd = Math.min(1, start + 0.16);
  const opacity = useTransform(progress, [start, revealEnd], [0, 1]);
  const y = useTransform(progress, [start, revealEnd], [32, 0]);
  const dotOpacity = useTransform(progress, [start, Math.min(1, start + 0.045)], [0.12, 1]);
  const dotScale = useTransform(progress, [start, Math.min(1, start + 0.045)], [0.72, 1]);
  const side = mobile ? "right" : item.position === "center" ? (index % 2 === 0 ? "left" : "right") : item.position;

  return (
    <div className={`career-row career-row-${side}`} style={{ "--road-x": `${roadX}%` } as React.CSSProperties}>
      <motion.span className="career-node" style={{ opacity: reducedMotion ? (inView ? 1 : 0.18) : dotOpacity, scale: reducedMotion ? (inView ? 1 : 0.72) : dotScale }} aria-hidden="true">
        <i />
      </motion.span>
      <motion.article
        ref={cardRef}
        className="career-card"
        style={{ opacity: reducedMotion ? (inView ? 1 : 0) : opacity, y: reducedMotion ? (inView ? 0 : 24) : y }}
        aria-label={`${item.category}: ${item.title}`}
      >
        <div className="career-card-top">
          <span>{item.category.toUpperCase()} · {String(index + 1).padStart(2, "0")}</span>
          <time>{formatDate(item.start_date)} — {item.end_date ? formatDate(item.end_date) : "Present"}</time>
        </div>
        <div className="career-organization">
          {item.logo_url ? <img src={item.logo_url} alt="" loading="lazy" /> : <span className="career-logo-mark">{item.organization.slice(0, 1).toUpperCase()}</span>}
          <div><strong>{item.organization}</strong>{item.location && <small>{item.location}</small>}</div>
        </div>
        <h3>{item.title}</h3>
        <p className="career-role">{item.role}</p>
        <p className="career-description">{item.description}</p>
        {item.achievements.length > 0 && <ul>{item.achievements.map((achievement) => <li key={achievement}>{achievement}</li>)}</ul>}
        {item.technologies.length > 0 && <div className="career-tech">{item.technologies.map((technology) => <span key={technology}>{technology}</span>)}</div>}
      </motion.article>
    </div>
  );
}

export function CareerJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const [items, setItems] = useState<Milestone[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobile, setMobile] = useState(false);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start 80%", "end 72%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 130, damping: 30, mass: 0.28 });
  const road = useMemo(() => makeRoad(Math.max(items.length, 1), mobile), [items.length, mobile]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/timeline", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load the career timeline.");
        if (!cancelled) setItems(Array.isArray(result.items) ? result.items : []);
      })
      .catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load the career timeline."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const pathLength = useTransform(progress, [0, 1], [0, 1]);
  return (
    <section ref={sectionRef} id="journey" className="career-journey-section">
      <div className="career-journey-inner">
        <div className="section-index reveal"><span>04 / THE JOURNEY</span><span>LEARNING · BUILDING · LEADING</span></div>
        <header className="career-heading">
          <div><p className="eyebrow">A PATH, STILL UNFOLDING</p><h2>Built one<br /><em>chapter at a time.</em></h2></div>
          <p>From computer science foundations to shipping products and systems with real users. Follow the path as it appears.</p>
        </header>
        {loading ? <div className="career-state" role="status">Preparing the journey<span>Loading milestones…</span></div> : error ? <div className="career-state" role="alert">The journey could not load<span>{error}</span></div> : items.length === 0 ? <div className="career-state">The journey is being prepared<span>Published career milestones will appear here.</span></div> : (
          <div className="career-timeline" style={{ "--career-count": items.length } as React.CSSProperties}>
            <svg className="career-road" viewBox="0 0 100 1000" preserveAspectRatio="none" aria-hidden="true">
              <motion.path className="career-road-ink" d={road.path} pathLength="1" style={{ pathLength }} />
              <motion.path className="career-road-progress" d={road.path} pathLength="1" style={{ pathLength }} />
            </svg>
            {items.map((item, index) => <JourneyStop key={item.id} item={item} index={index} total={items.length} roadX={road.stops[index].x} progress={progress} mobile={mobile} />)}
          </div>
        )}
      </div>
    </section>
  );
}
