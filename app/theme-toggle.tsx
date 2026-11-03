"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem("battle-theme");
    const value = saved === "light" ? "light" : "dark";
    document.documentElement.dataset.battleTheme = value;
    setDark(value === "dark");
  }, []);
  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.battleTheme = next;
    localStorage.setItem("battle-theme", next);
    setDark(!dark);
  }
  return <button className="theme-toggle" onClick={toggle} type="button" aria-label={`Switch to ${dark ? "light" : "dark"} theme`} aria-pressed={dark}><span aria-hidden="true">{dark ? "☼" : "◐"}</span><span>{dark ? "Dark" : "Light"}</span><i aria-hidden="true" /></button>;
}
