"use client";

import { useEffect, useState } from "react";
import { useUI } from "./providers";
import { External, Lamp } from "./icons";
import { chain } from "@/lib/config";
import { integer } from "@/lib/format";
import type { ChainState } from "@/lib/chain";

const ASSETS = [
  { symbol: "ETH", name: "Ether", logo: "/tokens/eth.svg", note: "gas + deposits" },
  { symbol: "USDC", name: "USD Coin", logo: "/tokens/usdc.svg", note: "tracked" },
  { symbol: "USDT", name: "Tether", logo: "/tokens/usdt.svg", note: "tracked" },
] as const;

export function ChainSection() {
  const { t } = useUI();
  const [state, setState] = useState<ChainState | null>(null);

  useEffect(() => {
    let alive = true;
    const read = async () => {
      try {
        const res = await fetch("/api/chain", { cache: "no-store" });
        if (res.ok && alive) setState((await res.json()) as ChainState);
      } catch {}
    };
    read();
    const id = setInterval(read, 12_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <section id="chain" className="scroll-mt-24 pb-14 sm:pb-20">
      <div className="card grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/mark.png" alt="" width={34} height={34} className="h-[34px] w-[34px]" />
            <h2 className="display text-[clamp(1.6rem,4vw,2.4rem)]">{t("chain.h")}</h2>
          </div>
          <p className="measure mt-4 text-[14.5px] leading-relaxed text-ink-2">{t("chain.b1")}</p>
          <p className="measure mt-3 text-[14.5px] leading-relaxed text-ink-2">{t("chain.b2")}</p>
          <a
            href={chain.explorer}
            target="_blank"
            rel="noreferrer noopener"
            className="label lift mt-5 inline-flex min-h-[46px] items-center gap-2 px-5 text-[12px]"
            style={{ background: "var(--pop)", color: "var(--pop-ink)", borderRadius: "var(--r)" }}
          >
            {t("chain.explorer")}
            <External size={14} />
          </a>
        </div>

        <div>
          <dl className="grid grid-cols-3 gap-3">
            <div className="well p-4">
              <dt className="label text-[10px] text-ink-3">{t("chain.block")}</dt>
              <dd className="data mt-1.5 text-[16px] tabular-nums" style={{ color: state?.ok ? "var(--up)" : "var(--ink-2)" }}>
                {state && state.block > 0 ? integer(state.block) : "…"}
              </dd>
            </div>
            <div className="well p-4">
              <dt className="label text-[10px] text-ink-3">{t("chain.gas")}</dt>
              <dd className="data mt-1.5 text-[16px] tabular-nums">
                {state?.gasGwei != null ? `${state.gasGwei.toFixed(3)} gwei` : "…"}
              </dd>
            </div>
            <div className="well p-4">
              <dt className="label text-[10px] text-ink-3">{t("chain.chainid")}</dt>
              <dd className="data mt-1.5 text-[16px] tabular-nums">{chain.id}</dd>
            </div>
          </dl>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-3">
            <Lamp size={7} className="animate-blip" style={{ color: state?.ok ? "var(--up)" : "var(--pop)" }} />
            {t("chain.live")}
          </p>

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
    </section>
  );
}
