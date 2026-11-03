"use client";

import { Suspense, lazy } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

export function SplineScene({ scene, className }: { scene: string; className?: string }) {
  return <Suspense fallback={<div className="spline-loader" aria-label="Loading 3D scene"><span/></div>}>
    <Spline scene={scene} className={className}/>
  </Suspense>;
}
