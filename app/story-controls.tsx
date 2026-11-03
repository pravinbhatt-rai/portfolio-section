"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const chapters = [
  { id: "intro", label: "Intro" },
  { id: "story", label: "The story" },
  { id: "skills", label: "Skills" },
  { id: "work", label: "Selected work" },
  { id: "journey", label: "Experience" },
  { id: "journal", label: "Journal" },
  { id: "achievements", label: "Achievements" },
  { id: "contact", label: "Contact" },
];

export function StoryControls() {
  const [active, setActive] = useState("intro");

  useEffect(() => {
    const updateProgress = () => {
      const page = document.documentElement;
      const range = page.scrollHeight - window.innerHeight;
      page.style.setProperty("--scroll-progress", range > 0 ? `${window.scrollY / range}` : "0");
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-32% 0px -52% 0px", threshold: [0, 0.2, 0.5] });
    chapters.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      observer.disconnect();
    };
  }, []);

  return <>
    <div className="reading-progress" aria-hidden="true" />
    <nav className="story-rail" aria-label="Story chapters">
      {chapters.map(({ id, label }, index) => <a key={id} href={`#${id}`} className={active === id ? "active" : ""} aria-label={`${String(index + 1).padStart(2, "0")} ${label}`} aria-current={active === id ? "location" : undefined}>
        <span>{String(index + 1).padStart(2, "0")}</span><i aria-hidden="true" />
      </a>)}
      <span className="rail-caption">FOLLOW THE THREAD</span>
    </nav>
  </>;
}

export function ScrollReveals() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: 0.12, rootMargin: "0px 0px -4% 0px" });

    document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
    const motion = gsap.utils.toArray<HTMLElement>("[data-scroll-motion]").map((element) => gsap.fromTo(element,
      { autoAlpha: 0, y: 46, scale: 0.97 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.85, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 88%", once: true } },
    ));
    const mutationObserver = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      if (node.matches(".reveal")) revealObserver.observe(node);
      node.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
    })));
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    return () => { revealObserver.disconnect(); mutationObserver.disconnect(); motion.forEach((animation) => animation.scrollTrigger?.kill()); motion.forEach((animation) => animation.kill()); };
  }, []);
  return null;
}
