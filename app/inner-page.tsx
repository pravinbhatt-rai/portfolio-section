"use client";
import Link from "next/link";
import { ScrollReveals } from "./story-controls";
import { ThemeToggle } from "./theme-toggle";
import { LiquidNavbar, NimbusIcons } from "../components/ui/liquid-glass-navbar";
import { GenerativeTree } from "../components/ui/generative-tree";

export function SiteNav() {
  return <header className="liquid-header inner-liquid-header"><Link className="wordmark" href="/">PB<span>®</span></Link><LiquidNavbar tone="dark" defaultActive={0} sound={false} items={[{label:"Home",href:"/",icon:NimbusIcons.home,fx:"glow"},{label:"Skills",href:"/#skills",icon:NimbusIcons.globe,fx:"spin"},{label:"Work",href:"/projects",icon:NimbusIcons.plane,fx:"plane"},{label:"Journal",href:"/blog",icon:NimbusIcons.drop,fx:"drop"},{label:"Contact",href:"/contact",icon:NimbusIcons.user,fx:"wave"}]}/><ThemeToggle/></header>;
}
export function PageFrame({ number, label, title, children, showModel = true }: { number: string; label: string; title: React.ReactNode; children: React.ReactNode; showModel?: boolean }) {
  function adjustScene(event: React.PointerEvent<HTMLDivElement>) {
    const frame = event.currentTarget.querySelector("iframe");
    const bounds = event.currentTarget.getBoundingClientRect();
    const speed = 0.65 + Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)) * 1.6;
    frame?.contentWindow?.postMessage({ type: "generative-tree-controls", controls: { speed, paused: false } }, "*");
  }
  return <main className="site-shell"><ScrollReveals/><SiteNav/><section className="wrap inner-page"><div className="section-index"><span>{number} / {label}</span><Link href="/">← BACK HOME</Link></div><div className="inner-title reveal"><div><p className="eyebrow">A LITTLE BIT OF LOGIC. A LOT OF FEELING.</p><h1>{title}</h1></div>{showModel && <div className="inner-model-bento" onPointerMove={adjustScene} onPointerLeave={event => event.currentTarget.querySelector("iframe")?.contentWindow?.postMessage({ type: "generative-tree-controls", controls: { speed: 0.7, paused: false } }, "*")}><GenerativeTree speed={0.7} size={0.82} particleAmount={0.42} opacity={0.86} hue={-10} saturation={0.68} brightness={0.72}/><span>ANIMATED SYSTEMS · PRAVIN BHATTARAI</span></div>}</div>{children}<footer className="footer inner-footer"><Link className="wordmark" href="/">PB<span>®</span></Link><span>PRAVIN BHATTARAI · SOFTWARE ENGINEER</span><Link href="/contact">LET’S TALK ↗</Link></footer></section></main>;
}
