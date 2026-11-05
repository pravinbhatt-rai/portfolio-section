"use client";

import { useEffect } from "react";

export function CursorEffects() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (reduced || touch) return;
    const canvas = document.createElement("canvas");
    canvas.className = "cursor-trail";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) { canvas.remove(); return; }
    const context: CanvasRenderingContext2D = ctx;
    const points: { x: number; y: number; age: number }[] = [];
    let width = 0, height = 0, raf = 0;
    let cursorColor = "236, 213, 177";
    let activeCard: HTMLElement | null = null;
    const cardSelector = ".scroll-project-card,.skill-bento-group,.skill-bento-icon,.achievement-bento-card,.achievement-tree-tile,.journal-card,.project-gallery-item,.project-preview,.career-card,.inner-project,.project-feedback,.published-card,.contact-card,.inner-model-bento";
    const syncCursorTheme = () => { cursorColor = document.documentElement.dataset.battleTheme === "dark" ? "255, 229, 190" : "157, 119, 67"; };
    const resize = () => { const dpr = Math.min(devicePixelRatio || 1, 2); width = innerWidth; height = innerHeight; canvas.width = width * dpr; canvas.height = height * dpr; canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; context.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const move = (event: PointerEvent) => {
      document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>(cardSelector) || null;
      if (target !== activeCard) {
        activeCard?.classList.remove("cursor-glow-target");
        activeCard = target;
        activeCard?.classList.add("cursor-glow-target");
      }
      if (activeCard) {
        const bounds = activeCard.getBoundingClientRect();
        activeCard.style.setProperty("--card-glow-x", `${event.clientX - bounds.left}px`);
        activeCard.style.setProperty("--card-glow-y", `${event.clientY - bounds.top}px`);
      }
      points.push({ x: event.clientX, y: event.clientY, age: 0 });
      if (points.length > 22) points.shift();
    };
    const onBlur = () => { activeCard?.classList.remove("cursor-glow-target"); activeCard = null; };
    const themeObserver = new MutationObserver(syncCursorTheme);
    syncCursorTheme();
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-battle-theme"] });
    resize(); raf = requestAnimationFrame(draw);
    function draw() {
      context.clearRect(0, 0, width, height);
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i];
        context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y);
        context.strokeStyle = `rgba(${cursorColor}, ${Math.max(0, .42 - b.age * .035)})`;
        context.lineWidth = Math.max(1, 4 - b.age * .22); context.shadowBlur = 14;
        context.shadowColor = `rgba(${cursorColor},.5)`; context.stroke();
      }
      points.forEach(point => point.age++);
      while (points.length && points[0].age > 13) points.shift();
      raf = requestAnimationFrame(draw);
    }
    window.addEventListener("resize", resize); window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("blur", onBlur);
    return () => { cancelAnimationFrame(raf); themeObserver.disconnect(); activeCard?.classList.remove("cursor-glow-target"); window.removeEventListener("blur", onBlur); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", move); canvas.remove(); };
  }, []);
  return <div className="cursor-halo" aria-hidden="true"/>;
}
