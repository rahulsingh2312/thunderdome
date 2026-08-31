"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";
import { translate, type Key, type Locale } from "@/lib/i18n";

const queryClient = new QueryClient();

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (k: Key) => string;
};

const Context = createContext<Ctx | null>(null);

const LOCALE_KEY = "quiver.locale";

/** Runs before paint so a stored locale never flashes English first. */
export const themeScript = `(function(){try{var l=localStorage.getItem("${LOCALE_KEY}");if(l==="zh"||l==="en"){document.documentElement.setAttribute("lang",l)}}catch(e){}})();`;

export function Providers({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const l = localStorage.getItem(LOCALE_KEY);
      if (l === "zh" || l === "en") setLocaleState(l);
    } catch {}
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_KEY, l);
    } catch {}
    document.documentElement.setAttribute("lang", l);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ locale, setLocale, t: (k: Key) => translate(locale, k) }),
    [locale, setLocale],
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Context.Provider value={value}>{children}</Context.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function useUI(): Ctx {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useUI must be used inside Providers");
  return ctx;
}
