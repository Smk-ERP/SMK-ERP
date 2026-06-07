"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolved: "light" | "dark"; // actual mode applied
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "smk.theme";

function resolveSystem(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  // Apply theme to <html>
  function apply(t: Theme) {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const effective = t === "system" ? resolveSystem() : t;
    setResolved(effective);
    if (effective === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }

  // Initial: load from localStorage
  useEffect(() => {
    const stored = (typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null) as Theme | null;
    const initial = stored ?? "system";
    setThemeState(initial);
    apply(initial);
  }, []);

  // Listen for OS theme changes while in system mode
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => apply("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
    apply(t);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, t);
  }

  function toggle() {
    // cycle: light → dark → system → light
    setTheme(resolved === "light" ? "dark" : "light");
  }

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
