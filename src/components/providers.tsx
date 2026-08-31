"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@solana/kit";
import { solanaRpc } from "@solana/kit-plugin-rpc";
import { walletSigner } from "@solana/kit-plugin-wallet";
import { ClientProvider } from "@solana/react";
import { chain } from "@/lib/config";
import { translate, type Key, type Locale } from "@/lib/i18n";

// One Kit client for the whole app: Wallet Standard discovery fills the
// payer/identity roles once a wallet connects.
export const solClient = createClient()
  .use(walletSigner({ chain: "solana:mainnet" }))
  .use(solanaRpc({ rpcUrl: chain.rpcPublic }));

export type AppClient = Awaited<typeof solClient>;

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
    <ClientProvider client={solClient}>
      <Context.Provider value={value}>{children}</Context.Provider>
    </ClientProvider>
  );
}

export function useUI(): Ctx {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useUI must be used inside Providers");
  return ctx;
}
