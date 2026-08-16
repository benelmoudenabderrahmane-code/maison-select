"use client";

import * as React from "react";

type Theme = "light" | "dark";
interface ThemeContext {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const Ctx = React.createContext<ThemeContext | null>(null);
const STORAGE_KEY = "amazon-store-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("dark");

  React.useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? null;
    const initial: Theme =
      stored ??
      (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    setThemeState(initial);
  }, []);

  const apply = React.useCallback((t: Theme) => {
    const root = document.documentElement;
    root.classList.toggle("dark", t === "dark");
    root.style.colorScheme = t;
    localStorage.setItem(STORAGE_KEY, t);
  }, []);

  React.useEffect(() => {
    apply(theme);
  }, [theme, apply]);

  const setTheme = React.useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = React.useCallback(
    () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  return (
    <Ctx.Provider value={{ theme, toggleTheme, setTheme }}>{children}</Ctx.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/** Inline, render-blocking script that sets the theme class before paint. */
export const themeInitScript = `
(function(){try{var k='amazon-store-theme';var s=localStorage.getItem(k);var d=s?s==='dark':!window.matchMedia('(prefers-color-scheme: light)').matches;var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){document.documentElement.classList.add('dark');}})();
`;
