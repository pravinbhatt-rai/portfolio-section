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
    const points: { x: number; y: number; age: number }[] = [];
    let width = 0, height = 0, raf = 0;
    const resize = () => { const dpr = Math.min(devicePixelRatio || 1, 2); width = innerWidth; height = innerHeight; canvas.width = width * dpr; canvas.height = height * dpr; canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const move = (event: PointerEvent) => { document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`); document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`); points.push({ x: event.clientX, y: event.clientY, age: 0 }); if (points.length > 22) points.shift(); };
    const draw = () => { ctx.clearRect(0, 0, width, height); for (let i = 1; i < points.length; i++) { const a = points[i - 1], b = points[i]; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = `rgba(236, 158, 111, ${Math.max(0, .42 - b.age * .035)})`; ctx.lineWidth = Math.max(1, 4 - b.age * .22); ctx.shadowBlur = 12; ctx.shadowColor = "rgba(236,158,111,.42)"; ctx.stroke(); } points.forEach(point => point.age++); while (points.length && points[0].age > 13) points.shift(); raf = requestAnimationFrame(draw); };
    resize(); raf = requestAnimationFrame(draw); window.addEventListener("resize", resize); window.addEventListener("pointermove", move, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", move); canvas.remove(); };
  }, []);
  return <div className="cursor-halo" aria-hidden="true"/>;
}
