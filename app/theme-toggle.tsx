"use client";

import { useLayoutEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useLayoutEffect(() => {
    const current = document.documentElement.dataset.battleTheme;
    const saved = localStorage.getItem("battle-theme");
    const value = current === "dark" || current === "light" ? current : saved === "dark" ? "dark" : "light";
    if (current !== value) document.documentElement.dataset.battleTheme = value;
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
