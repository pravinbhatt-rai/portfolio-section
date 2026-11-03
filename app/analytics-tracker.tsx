"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function AnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => { void fetch(`/api/analytics?path=${encodeURIComponent(pathname)}`, { method: "POST", keepalive: true }).catch(() => {}); }, [pathname]);
  return null;
}
