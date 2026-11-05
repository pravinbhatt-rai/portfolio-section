"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Particle = { x: number; y: number; seed: number; shade: number };

function NameParticles({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;
    let frame = 0;
    let startAt = 0;
    let particles: Particle[] = [];
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);

    const sampleWord = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const offscreen = document.createElement("canvas");
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const sample = offscreen.getContext("2d", { willReadFrequently: true });
      if (!sample) return;
      sample.scale(pixelRatio, pixelRatio);
      const fontSize = Math.min(width * 0.203, height * 0.42, 300);
      const heroFont = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim() || "Arial";
      sample.font = `600 ${fontSize}px ${heroFont}, Arial, sans-serif`;
      sample.textAlign = "center";
      sample.textBaseline = "middle";
      sample.fillStyle = "white";
      sample.fillText("PRAVIN", width / 2, height / 2, width * 0.92);
      const image = sample.getImageData(0, 0, canvas.width, canvas.height);
      const step = Math.max(7, Math.round(9 * pixelRatio));
      const next: Particle[] = [];
      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          if ((Math.floor(x / step) + Math.floor(y / step)) % 2 !== 0) continue;
          if (image.data[(y * canvas.width + x) * 4 + 3] > 100) {
            const seed = Math.sin(x * 0.017 + y * 0.031) * 0.5 + 0.5;
            next.push({ x: x / pixelRatio, y: y / pixelRatio, seed, shade: 0.2 + seed * 0.55 });
          }
        }
      }
      particles = next;
    };

    const draw = (now: number) => {
      if (!startAt) startAt = now;
      const elapsed = now - startAt;
      const progress = Math.max(0, Math.min(1, (elapsed - 250) / 900));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.save();
      context.scale(pixelRatio, pixelRatio);
      const spread = progress * progress;
      for (const particle of particles) {
        const angle = particle.seed * Math.PI * 8;
        const drift = 18 + particle.seed * 110;
        const swirl = Math.sin(progress * 7 + particle.seed * 20) * 18 * spread;
        const x = particle.x + Math.cos(angle + progress * 2) * drift * spread - Math.sin(angle) * swirl;
        const y = particle.y + Math.sin(angle + progress * 2) * drift * spread + Math.cos(angle) * swirl - progress * 28;
        const radius = 0.7 + particle.seed * 1.4;
        context.fillStyle = `rgba(241,239,234,${particle.shade * (1 - progress * 0.56)})`;
        context.shadowBlur = 0;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
      if (progress < 1) frame = requestAnimationFrame(draw);
    };

    sampleWord();
    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", sampleWord);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", sampleWord);
    };
  }, [active]);

  return <canvas ref={canvasRef} className="pravin-intro-particles" aria-hidden="true" />;
}

export function CinematicIntro() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"still" | "zoom" | "expand" | "dissolve">("still");

  useEffect(() => {
    if (pathname !== "/" || sessionStorage.getItem("pravin-intro-seen")) {
      setVisible(false);
      return;
    }

    sessionStorage.setItem("pravin-intro-seen", "1");
    document.body.classList.add("pravin-intro-active");
    let active = true;
    let zoomTimer = 0;
    let expandTimer = 0;
    let dissolveTimer = 0;
    let finishTimer = 0;
    setVisible(true);
    setPhase("still");

    const begin = async () => {
      await document.fonts?.ready;
      const heroImage = document.querySelector<HTMLImageElement>("#intro img");
      if (heroImage && !heroImage.complete) {
        await Promise.race([
          new Promise<void>((resolve) => { heroImage.addEventListener("load", () => resolve(), { once: true }); heroImage.addEventListener("error", () => resolve(), { once: true }); }),
          new Promise<void>((resolve) => window.setTimeout(resolve, 800)),
        ]);
      }
      if (!active) return;
      const stillDuration = prefersReducedMotion ? 160 : 1850;
      const zoomDuration = prefersReducedMotion ? 120 : 1050;
      const expandDuration = prefersReducedMotion ? 0 : 950;
      const dissolveDuration = prefersReducedMotion ? 120 : 1300;
      zoomTimer = window.setTimeout(() => setPhase("zoom"), stillDuration);
      expandTimer = window.setTimeout(() => setPhase("expand"), stillDuration + zoomDuration);
      dissolveTimer = window.setTimeout(() => setPhase("dissolve"), stillDuration + zoomDuration + expandDuration);
      finishTimer = window.setTimeout(() => {
        document.body.classList.remove("pravin-intro-active");
        setVisible(false);
      }, stillDuration + zoomDuration + expandDuration + dissolveDuration + 300);
    };
    void begin();

    return () => {
      active = false;
      document.body.classList.remove("pravin-intro-active");
      window.clearTimeout(zoomTimer);
      window.clearTimeout(expandTimer);
      window.clearTimeout(dissolveTimer);
      window.clearTimeout(finishTimer);
    };
  }, [pathname, prefersReducedMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pravin-intro"
          data-phase={phase}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: prefersReducedMotion ? 0.12 : 0.45, ease: "easeOut" } }}
          aria-label="Introducing Pravin Bhattarai"
          role="status"
        >
          <motion.span
            className="pravin-intro-word"
            initial={{ scale: 0.72, opacity: 0.9 }}
            animate={phase === "still" ? { scale: 0.72, opacity: 0.9 } : phase === "zoom" ? { scale: 1, opacity: 1 } : phase === "expand" ? { scale: 2.6, opacity: 0.18 } : { scale: 3.25, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.15 : phase === "expand" ? 1.05 : 0.9, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden="true"
          >PRAVIN</motion.span>
          <NameParticles active={phase === "dissolve" && !prefersReducedMotion} />
          <span className="sr-only">Pravin Bhattarai portfolio</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
