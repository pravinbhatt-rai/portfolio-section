"use client";

import { useEffect, useRef } from "react";

export function SamuraiPortrait() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let scene: import("./lib/samurai-battle").SamuraiPortraitScene | null = null;
    let revert = () => {};

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("./lib/samurai-battle")]).then(([gsapModule, triggerModule, sceneModule]) => {
      if (disposed || !mountRef.current) return;
      try {
        scene = new sceneModule.SamuraiPortraitScene(mountRef.current);
      } catch {
        if (mountRef.current) mountRef.current.dataset.unavailable = "true";
        return;
      }

      const gsap = gsapModule.gsap;
      const ScrollTrigger = triggerModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) {
        scene?.setProgress(0);
        return;
      }
      const progress = { value: 0 };
      const context = gsap.context(() => {
        gsap.to(progress, {
          value: 1,
          ease: "none",
          onUpdate: () => scene?.setProgress(progress.value),
          scrollTrigger: {
            trigger: "#intro",
            start: "top top",
            end: "bottom top",
            scrub: .65,
          },
        });
      });
      revert = () => context.revert();
      ScrollTrigger.refresh();
    });

    return () => {
      disposed = true;
      revert();
      scene?.dispose();
    };
  }, []);

  return <>
    <div className="samurai-portrait-canvas" ref={mountRef} aria-hidden="true" />
    <span className="portrait-caption">SCROLL TO MEET THE ENGINEER <i /></span>
  </>;
}
