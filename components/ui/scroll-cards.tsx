"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

export interface ScrollCardItem {
  title: string;
  description: string;
  tag: string;
  src?: string;
  link: string;
  color: string;
  textColor: string;
  mark: string;
}

function ProjectCard({
  item,
  index,
  total,
  palette,
  style,
}: {
  item: ScrollCardItem;
  index: number;
  total: number;
  palette: "light" | "dark";
  style?: React.CSSProperties;
}) {
  return (
    <article className="scroll-project-step" data-palette={palette} style={{ zIndex: index + 1, ...style }}>
      <Link className="scroll-project-card" href={item.link} style={{ backgroundColor: item.color, color: item.textColor }}>
        <div className="scroll-project-visual">
          {item.src ? (
            <img className="scroll-project-image" src={item.src} alt="" loading="lazy" draggable={false} />
          ) : (
            <div className="scroll-project-art" aria-hidden="true"><span>{item.mark}</span><i /><b /></div>
          )}
          <div className="scroll-project-shade" />
          <div className="scroll-project-label"><span>{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span><span>{item.tag}</span></div>
        </div>
        <div className="scroll-project-copy">
          <span className="scroll-project-overline">PROJECT STORY</span>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          <span className="scroll-project-link">OPEN CASE STUDY <b>↗</b></span>
        </div>
      </Link>
    </article>
  );
}

function StackedProjectCard({
  item,
  index,
  total,
  progress,
}: {
  item: ScrollCardItem;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const segment = 1 / total;
  const start = index * segment;
  const settle = start + segment * 0.2;
  const exit = start + segment * 0.72;
  const end = Math.min(1, start + segment * 1.16);
  const palette = index % 2 === 0 ? "light" : "dark";

  const y = useTransform(
    progress,
    index === total - 1 ? [start, settle, 1] : [start, settle, exit, end],
    index === total - 1 ? ["24vh", "0vh", "0vh"] : [index === 0 ? "24vh" : "72vh", "0vh", "0vh", "0vh"],
  );
  const z = useTransform(progress, [start, settle, exit, end], [0, 0, 0, -170]);
  const scale = useTransform(progress, [start, settle, exit, end], [0.88, 1, 1, 0.88]);
  const opacity = useTransform(progress, [start, settle, exit, end], [index === 0 ? 0.86 : 0, 1, 1, 0.66]);
  const rotateX = useTransform(progress, [start, settle, end], [5, 0, -2]);

  return (
    <motion.div
      className="scroll-project-layer"
      style={{ y, z, scale, opacity, rotateX, zIndex: index + 1 }}
    >
      <ProjectCard item={item} index={index} total={total} palette={palette} />
    </motion.div>
  );
}

export function ScrollCards({ items, heading }: { items: ScrollCardItem[]; heading: ReactNode }) {
  const deckRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: deckRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 34,
    mass: 0.22,
    restDelta: 0.001,
  });
  const total = Math.max(items.length, 1);
  const headingOpacity = useTransform(progress, [0, 0.05, 0.12], [1, 1, 0]);
  const headingY = useTransform(progress, [0, 0.12], [0, -34]);
  const headingScale = useTransform(progress, [0, 0.12], [1, 0.94]);

  if (reducedMotion) {
    return (
      <div className="scroll-project-static">
        <div className="project-stack-heading">{heading}</div>
        {items.map((item, index) => (
          <ProjectCard key={`${item.title}-${index}`} item={item} index={index} total={items.length} palette={index % 2 === 0 ? "light" : "dark"} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="scroll-project-deck"
      ref={deckRef}
      style={{ height: `calc(${total + 1} * 100svh)` }}
    >
      <div className="scroll-project-stage">
        <motion.div
          className="project-stack-heading"
          style={{ opacity: headingOpacity, y: headingY, scale: headingScale }}
        >
          {heading}
        </motion.div>
        {items.map((item, index) => (
          <StackedProjectCard
            key={`${item.title}-${index}`}
            item={item}
            index={index}
            total={total}
            progress={progress}
          />
        ))}
      </div>
    </div>
  );
}
