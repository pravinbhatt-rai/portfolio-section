import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";
import { AnalyticsTracker } from "./analytics-tracker";
import { CursorEffects } from "./cursor-effects";
import { CinematicIntro } from "./cinematic-intro";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pravin Bhattarai — Software Engineer",
  description: "Software engineer building high-performance backend services and AI systems. Based in Bangalore, India.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en" data-battle-theme="light" suppressHydrationWarning className={`${geist.variable} ${playfair.variable} antialiased`}><body><Script id="portfolio-theme-bootstrap" strategy="beforeInteractive">{`try { document.documentElement.dataset.battleTheme = localStorage.getItem("battle-theme") === "dark" ? "dark" : "light"; } catch { document.documentElement.dataset.battleTheme = "light"; }`}</Script><Suspense fallback={null}><CinematicIntro/></Suspense><CursorEffects/><Suspense fallback={null}><AnalyticsTracker/></Suspense>{children}</body></html>;
}
