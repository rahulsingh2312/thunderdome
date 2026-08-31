"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translate, type Key, type Locale } from "@/lib/i18n";

type Theme = "light" | "dark" | "system";

type Ctx = {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (k: Key) => string;
};

const Context = createContext<Ctx | null>(null);

const THEME_KEY = "quiver.theme";
const LOCALE_KEY = "quiver.locale";

/** Runs before paint so a pinned theme never flashes the other one. */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}var l=localStorage.getItem("${LOCALE_KEY}");if(l==="zh"||l==="en"){document.documentElement.setAttribute("lang",l)}}catch(e){}})();`;

function systemDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [locale, setLocaleState] = useState<Locale>("en");
  const [systemIsDark, setSystemIsDark] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem(THEME_KEY);
      if (t === "light" || t === "dark") setThemeState(t);
      const l = localStorage.getItem(LOCALE_KEY);
      if (l === "zh" || l === "en") setLocaleState(l);
    } catch {
      // Private windows and blocked site data are normal, not an error state.
    }
    setSystemIsDark(systemDark());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      if (t === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, t);
    } catch {}
    const root = document.documentElement;
    if (t === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", t);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_KEY, l);
    } catch {}
    document.documentElement.setAttribute("lang", l);
  }, []);

  const resolved: "light" | "dark" = theme === "system" ? (systemIsDark ? "dark" : "light") : theme;

  const value = useMemo<Ctx>(
    () => ({
      theme,
      resolved,
      setTheme,
      locale,
      setLocale,
      t: (k: Key) => translate(locale, k),
    }),
    [theme, resolved, setTheme, locale, setLocale],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useUI(): Ctx {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useUI must be used inside Providers");
  return ctx;
}
