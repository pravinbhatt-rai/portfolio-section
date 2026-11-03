"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { generativeTreeSource } from "./generative-tree-utils/generative-tree-source";

export type GenerativeTreeProps = {
  speed?: number;
  size?: number;
  particleAmount?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  className?: string;
  style?: CSSProperties;
};

export const GENERATIVE_TREE_DEFAULTS = { speed: 1, size: 1, particleAmount: 1, opacity: 1, hue: 0, saturation: 1, brightness: 1 } as const;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function makeScene(size: number, particleAmount: number) {
  const particleCount = Math.max(0, Math.round(50 * clamp(particleAmount, 0, 2)));
  const treePadding = 1 / clamp(size, 0.65, 1.5);
  const focusStyle = `<style>html,body,canvas{width:100%;height:100%;margin:0;overflow:hidden;background:#0a0a0a}canvas{display:block}</style>`;
  const controls = `<script>(function(){var nativeFrame=window.requestAnimationFrame.bind(window);var clock={last:null,time:null};window.__GENERATIVE_TREE_CONTROLS={speed:1,paused:false};window.requestAnimationFrame=function(cb){return nativeFrame(function(now){var state=window.__GENERATIVE_TREE_CONTROLS;if(clock.last===null){clock.last=now;clock.time=now}else{if(!state.paused)clock.time+=(now-clock.last)*state.speed;clock.last=now}cb(clock.time)})};window.addEventListener('message',function(event){if(!event.data||event.data.type!=='generative-tree-controls')return;var controls=event.data.controls||{};if(Number.isFinite(controls.speed))window.__GENERATIVE_TREE_CONTROLS.speed=Math.max(0,Math.min(3,controls.speed));window.__GENERATIVE_TREE_CONTROLS.paused=Boolean(controls.paused)})})();</script>`;
  return generativeTreeSource
    .replace("</head>", `${focusStyle}${controls}</head>`)
    .replace("const PARTICLE_COUNT = 50;", `const PARTICLE_COUNT = ${particleCount};`)
    .replace("const _pad = parseFloat(new URLSearchParams(location.search).get('p')) || 1;", `const _pad = ${treePadding.toFixed(4)};`);
}

export function GenerativeTree({ speed = 1, size = 1, particleAmount = 1, opacity = 1, hue = 0, saturation = 1, brightness = 1, className = "", style }: GenerativeTreeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hostVisible, setHostVisible] = useState(true);
  const [documentVisible, setDocumentVisible] = useState(() => typeof document === "undefined" || !document.hidden);
  const safeSpeed = clamp(speed, 0, 3);
  const paused = !hostVisible || !documentVisible || safeSpeed === 0;
  const source = useMemo(() => makeScene(size, particleAmount), [size, particleAmount]);
  const postControls = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: "generative-tree-controls", controls: { speed: safeSpeed, paused } }, "*");
  }, [safeSpeed, paused]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setHostVisible(entry?.isIntersecting ?? true));
    observer.observe(iframe);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const update = () => setDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => { postControls(); }, [postControls, source]);

  return <div className={`threeui-background generative-tree${className ? ` ${className}` : ""}`} style={{ background: "#0a0a0a", pointerEvents: "none", ...style }}>
    <iframe ref={iframeRef} title="Animated generative tree" srcDoc={source} sandbox="allow-scripts" onLoad={postControls} aria-hidden="true" tabIndex={-1} style={{ position: "absolute", inset: 0, display: "block", width: "100%", height: "100%", border: 0, background: "#0a0a0a", opacity: clamp(opacity, 0.05, 1), filter: `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.8)})`, pointerEvents: "none" }}/>
  </div>;
}
