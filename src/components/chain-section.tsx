"use client";

import { useEffect, useRef, useState } from "react";
import { useUI } from "./providers";
import { External, Lamp } from "./icons";
import { chain, treasury } from "@/lib/config";
import { integer } from "@/lib/format";
import type { ChainState } from "@/lib/chain";

const WALL: string[] = ["aave", "ada", "algo", "atom", "avax", "bat", "bch", "bnb", "btc", "chz", "comp", "crv", "dash", "doge", "dot", "enj", "etc", "eth", "fil", "grt", "icp", "knc", "link", "ltc", "mana", "matic", "mkr", "neo", "omg", "qtum", "sand", "snx", "sushi", "theta", "trx", "uni", "usdc", "usdt", "vet", "xlm", "xrp", "zec", "zrx"];

const ASSETS = [
  { symbol: "SOL", name: "Solana", logo: "/tokens/sol-mark.svg", note: "gas + deposits" },
  { symbol: "USDC", name: "USD Coin", logo: "/tokens/usdc.svg", note: "tracked" },
  { symbol: "USDT", name: "Tether", logo: "/tokens/usdt.svg", note: "tracked" },
] as const;

export function ChainSection() {
  const { t } = useUI();
  const [state, setState] = useState<ChainState | null>(null);
  const [liveSlot, setLiveSlot] = useState<number | null>(null);
  const slotBase = useRef<{ slot: number; at: number } | null>(null);

  useEffect(() => {
    let alive = true;
    const read = async () => {
      try {
        const res = await fetch("/api/chain", { cache: "no-store" });
        if (res.ok && alive) {
          const next = (await res.json()) as ChainState;
          setState(next);
          if (next.slot > 0) slotBase.current = { slot: next.slot, at: Date.now() };
        }
      } catch {}
    };
    read();
    const id = setInterval(read, 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Between polls the slot keeps climbing at mainnet pace (~2.5 slots/s),
  // so the number on the page moves like the chain does.
  useEffect(() => {
    const id = setInterval(() => {
      const b = slotBase.current;
      if (b) setLiveSlot(b.slot + Math.floor(((Date.now() - b.at) / 1000) * 2.5));
    }, 400);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="chain" className="scroll-mt-24 pb-14 sm:pb-20">
      <div className="card grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tokens/sol-mark.svg" alt="" width={34} height={27} className="h-[27px] w-[34px]" />
            <h2 className="display text-[clamp(1.6rem,4vw,2.4rem)]">{t("chain.h")}</h2>
          </div>
          <p className="measure mt-4 text-[14.5px] leading-relaxed text-ink-2">{t("chain.b1")}</p>
          <p className="measure mt-3 text-[14.5px] leading-relaxed text-ink-2">{t("chain.b2")}</p>
          <h3 className="label mt-6 text-[11px] text-ink-3">{t("chain.assets")}</h3>
          <ul className="mt-3 grid grid-cols-3 gap-3">
            {ASSETS.map((a) => (
              <li key={a.symbol} className="well flex items-center gap-2.5 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.logo} alt={`${a.name} logo`} width={26} height={26} className="h-[26px] w-[26px]" />
                <div className="min-w-0">
                  <div className="data text-[13px]">{a.symbol}</div>
                  <div className="truncate text-[10px] text-ink-3">{a.note}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* The wall: the wider market the desk watches, two lanes drifting. */}
      <div className="card mt-3 overflow-hidden py-3">
        {[0, 1].map((row) => (
          <div key={row} className={`flex w-max gap-7 px-6 ${row ? "animate-marquee-rev mt-3" : "animate-marquee"}`}>
            {[...WALL, ...WALL].map((sym, i) => (
              <span key={`${sym}-${i}`} className="flex shrink-0 items-center gap-1.5 opacity-80">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/tokens/wall/${sym}.svg`} alt="" width={18} height={18} className="h-[18px] w-[18px]" />
                <span className="data text-[10px] uppercase text-ink-3">{sym}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
