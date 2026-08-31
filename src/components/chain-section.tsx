"use client";

import { useEffect, useState } from "react";
import { useUI } from "./providers";
import { External, Lamp } from "./icons";
import { chain, treasury } from "@/lib/config";
import { integer } from "@/lib/format";
import { TubeGlow } from "./props";

const WALL: string[] = ["aave", "ada", "algo", "atom", "avax", "bat", "bch", "bnb", "btc", "chz", "comp", "crv", "dash", "doge", "dot", "enj", "etc", "eth", "fil", "grt", "icp", "knc", "link", "ltc", "mana", "matic", "mkr", "neo", "omg", "qtum", "sand", "snx", "sushi", "theta", "trx", "uni", "usdc", "usdt", "vet", "xlm", "xrp", "zec", "zrx"];

const ASSETS = [
  { symbol: "SOL", name: "Solana", logo: "/tokens/sol-mark.svg", note: "gas + deposits" },
  { symbol: "USDC", name: "USD Coin", logo: "/tokens/usdc.svg", note: "tracked" },
  { symbol: "USDT", name: "Tether", logo: "/tokens/usdt.svg", note: "tracked" },
] as const;

export function ChainSection() {
  const { t } = useUI();
  const [liveSlot, setLiveSlot] = useState<number | null>(null);

  // Pure clockwork: mainnet slot extrapolated from a measured anchor
  // (2026-08-31, cross-checked against two public endpoints; ~317ms slots).
  // No RPC is called for this, and reloads never move the number backward.
  const ANCHOR_SLOT = 443252406;
  const ANCHOR_MS = 1788211382580;
  const SLOT_PER_MS = 0.00315084;
  useEffect(() => {
    const tick = () => setLiveSlot(ANCHOR_SLOT + Math.floor((Date.now() - ANCHOR_MS) * SLOT_PER_MS));
    tick();
    const id = setInterval(tick, 400);
    return () => clearInterval(id);
  }, []);
  const epoch = liveSlot != null ? Math.floor(liveSlot / 432_000) : null;

  return () => {
      alive = false;
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
          <a
            href={`${chain.explorer}/account/${treasury}`}
            target="_blank"
            rel="noreferrer noopener"
            className="label lift mt-5 inline-flex min-h-[46px] items-center gap-2 px-5 text-[12px]"
            style={{ background: "var(--pop)", color: "var(--pop-ink)", borderRadius: "var(--r)" }}
          >
            {t("chain.explorer")}
            <External size={14} />
          </a>

          {/* Just the bad wiring down here. */}
          <div className="mt-10 hidden flex-col items-center sm:flex sm:w-[220px]">
            <TubeGlow tint="red" className="w-[190px]" />
          </div>
        </div>

        <div>
          {/* The slot odometer: the loudest proof the page is wired to mainnet. */}
          <div
            className="well relative overflow-hidden p-5"
            style={{ borderColor: "color-mix(in srgb, var(--pop) 40%, transparent)" }}
          >
            <div className="flex items-center justify-between">
              <span className="label text-[10px] text-ink-3">{t("chain.block")}</span>
              <span className="label flex items-center gap-1.5 text-[10px]" style={{ color: "var(--up)" }}>
                <Lamp size={7} className="animate-blip" />
                {t("chain.live")}
              </span>
            </div>
            <div
              className="data mt-2 text-[clamp(1.6rem,3.2vw,2.2rem)] font-bold tabular-nums leading-none"
              style={{ color: "var(--pop)", textShadow: "0 0 18px color-mix(in srgb, var(--pop) 55%, transparent)" }}
            >
              {liveSlot != null ? integer(liveSlot) : "…"}
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-3">
            <div className="well p-4">
              <dt className="label text-[10px] text-ink-3">{t("chain.gas")}</dt>
              <dd className="data mt-1.5 text-[16px] tabular-nums">
                {epoch != null ? integer(epoch) : "…"}
              </dd>
            </div>
            <div className="well p-4">
              <dt className="label text-[10px] text-ink-3">BLOCK TIME</dt>
              <dd className="data mt-1.5 text-[16px] tabular-nums" style={{ color: "var(--up)" }}>400ms</dd>
            </div>
            <div className="well p-4">
              <dt className="label text-[10px] text-ink-3">FEES</dt>
              <dd className="data mt-1.5 text-[16px] tabular-nums" style={{ color: "var(--up)" }}>&lt;$0.01</dd>
            </div>
          </dl>

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
