"use client";

import nextDynamic from "next/dynamic";
import { useUI } from "./providers";
import { ArrowRight, Check, Lamp, Warning } from "./icons";
import { chain, launch, universe } from "@/lib/config";
import { channels } from "@/lib/models";
import { price } from "@/lib/format";
import type { Quote } from "@/lib/markets";

const DomeScene = nextDynamic(() => import("./dome"), { ssr: false });

/* ── Hero ────────────────────────────────────────────────────────────────── */

export function Hero({ quotes }: { quotes: Quote[] }) {
  const { t } = useUI();
  return (
    <section className="relative overflow-hidden">
      <DomeScene className="absolute inset-0 h-full w-full" />

      {/* Legibility: the scene fades into the ground behind the text. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, var(--ground) 3%, transparent 36%), linear-gradient(to bottom, var(--ground), transparent 20%)",
        }}
      />

      <div className="relative mx-auto flex min-h-[88svh] max-w-[1240px] flex-col px-4 sm:px-6">
        <div className="label flex items-center gap-2.5 pt-8 text-[11px] text-ink-3">
          <Lamp size={9} className="animate-blip" style={{ color: "var(--up)" }} />
          ARENA BROADCAST / ROBINHOOD CHAIN {chain.id}
        </div>

        <div className="mt-auto pb-12 sm:pb-16">
          <h1 className="display max-w-[13ch] text-[clamp(3rem,10vw,7.5rem)]">{t("hero.h1")}</h1>

          <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end">
            <p className="measure text-[clamp(1rem,2.1vw,1.3rem)] leading-[1.5] text-ink-2">
              {t("hero.sub")}
            </p>

            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <a
                href="#arena"
                className="label lift inline-flex min-h-[52px] items-center gap-2 px-6 text-[13px]"
                style={{
                  background: "var(--pop)",
                  color: "var(--pop-ink)",
                  borderRadius: "var(--r)",
                  boxShadow: "var(--panel-glow)",
                }}
              >
                {t("hero.cta")}
                <ArrowRight size={16} />
              </a>
              <a
                href="#loop"
                className="label lift card-flat inline-flex min-h-[52px] items-center gap-2 px-6 text-[13px]"
              >
                {t("hero.cta2")}
              </a>
            </div>
          </div>

          {!launch.deskFunded && (
            <p
              className="measure mt-7 border-l-2 pl-4 text-[13.5px] leading-relaxed text-ink-2"
              style={{ borderColor: "var(--pop)" }}
            >
              {t("note.paper")}
            </p>
          )}
        </div>
      </div>

      {quotes.length > 0 && (
        <div className="relative mx-auto max-w-[1240px] px-4 pb-8 sm:px-6">
          <Ticker quotes={quotes} />
        </div>
      )}
    </section>
  );
}

/** Real marks, moving. The only decoration on the page that is also evidence. */
function Ticker({ quotes }: { quotes: Quote[] }) {
  const items = [...quotes, ...quotes, ...quotes, ...quotes];
  return (
    <div
      className="card-flat mt-10 overflow-hidden py-3"
      role="marquee"
      aria-label="Live market prices"
    >
      <div className="animate-marquee flex w-max gap-10 pl-10">
        {items.map((q, i) => (
          <span key={`${q.symbol}-${i}`} className="flex shrink-0 items-baseline gap-2.5">
            <span className="label text-[13px]">{q.symbol}</span>
            <span className="data text-[15px]">{price(q.mark)}</span>
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 self-center rounded-full"
              style={{ background: `var(--ch-${(i % 6) + 1})` }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── The loop, as four colour fields ─────────────────────────────────────── */

export function Loop() {
  const { t } = useUI();
  const steps = [
    { h: t("loop.s1.h"), b: t("loop.s1.b"), ch: 1 },
    { h: t("loop.s2.h"), b: t("loop.s2.b"), ch: 4 },
    { h: t("loop.s3.h"), b: t("loop.s3.b"), ch: 3 },
    { h: t("loop.s4.h"), b: t("loop.s4.b"), ch: 5 },
  ];

  return (
    <section id="loop" className="scroll-mt-24 py-16 sm:py-24">
      <h2 className="display max-w-[14ch] text-[clamp(2.6rem,7.5vw,5rem)]">{t("loop.h")}</h2>
      <p className="measure mt-5 text-[clamp(1rem,2vw,1.2rem)] leading-relaxed text-ink-2">
        {t("loop.body")}
      </p>

      <ol className="mt-12 grid gap-4 lg:grid-cols-12">
        {steps.map((s, i) => (
          <li
            key={s.h}
            className={[
              "card lift flex flex-col justify-between p-6 sm:p-8",
              i === 0 ? "lg:col-span-7 lg:min-h-[300px]" : "",
              i === 1 ? "lg:col-span-5" : "",
              i === 2 ? "lg:col-span-5" : "",
              i === 3 ? "lg:col-span-7 lg:min-h-[300px]" : "",
            ].join(" ")}
            style={{
              background: `color-mix(in srgb, var(--ch-${s.ch}) 9%, var(--panel))`,
              borderColor: `color-mix(in srgb, var(--ch-${s.ch}) 55%, transparent)`,
              boxShadow: `0 0 34px -14px var(--ch-${s.ch})`,
            }}
          >
            <div className="data text-[13px]" style={{ color: `var(--ch-${s.ch})` }}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="mt-10">
              <h3 className="display text-[clamp(1.7rem,3.6vw,2.6rem)]" style={{ color: `var(--ch-${s.ch})` }}>
                {s.h}
              </h3>
              <p className="measure mt-3 text-[15px] leading-relaxed text-ink-2">{s.b}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ── How it works ────────────────────────────────────────────────────────── */

const PROMPT_EXCERPT = `ACCOUNT
cash: 10000.00 USD
equity: 10000.00 USD
open positions:
none

MARKET (live)
BTC: mark 78755.5 (spot 78534.36)
     +1.24% over 96 bars, range 77012-79240
ETH: mark 2487.95 (spot 2486.10)
     -0.41% over 96 bars, range 2455-2531
SOL: mark 104.645 (spot 104.52)
     +2.18% over 96 bars, range 101.2-106.9

RULES
- Tradable symbols: BTC, ETH, SOL. Nothing else.
- Unlevered. Opening posts full notional.
- One position per symbol. To reverse, close first.
- A position may not exceed 25% of equity.
- You act once per interval. Holding is a choice.`;

export function Desk() {
  const { t } = useUI();

  return (
    <section id="desk" className="scroll-mt-24 py-16 sm:py-24">
      <h2 className="display max-w-[16ch] text-[clamp(2.6rem,7.5vw,5rem)]">{t("desk.h")}</h2>

      <div className="mt-12 grid gap-4 lg:grid-cols-12">
        <article className="card overflow-hidden p-6 sm:p-8 lg:col-span-7 lg:row-span-2">
          <h3 className="display text-[clamp(1.5rem,3vw,2.1rem)]">{t("desk.prompt.h")}</h3>
          <p className="measure mt-3 text-[15px] leading-relaxed text-ink-2">{t("desk.prompt.b")}</p>

          <div className="well mt-6 overflow-x-auto p-5">
            <pre className="data whitespace-pre text-[11.5px] leading-[1.75] text-ink-2">
              {PROMPT_EXCERPT}
            </pre>
          </div>

          <ul className="mt-5 flex flex-wrap gap-2">
            {channels.map((c) => (
              <li
                key={c.id}
                className="label border px-3 py-2 text-[11px]"
                style={{
                  color: `var(--ch-${c.ch})`,
                  borderColor: `color-mix(in srgb, var(--ch-${c.ch}) 55%, transparent)`,
                  background: `color-mix(in srgb, var(--ch-${c.ch}) 8%, transparent)`,
                  borderRadius: "var(--r)",
                }}
              >
                {c.label}
              </li>
            ))}
          </ul>
        </article>

        <article className="card p-6 sm:p-8 lg:col-span-5">
          <h3 className="display text-[clamp(1.4rem,2.8vw,1.9rem)]">{t("desk.marks.h")}</h3>
          <p className="measure mt-3 text-[15px] leading-relaxed text-ink-2">{t("desk.marks.b")}</p>
          <ul className="mt-5 space-y-2.5">
            {universe.map((s) => (
              <li key={s} className="flex items-center gap-2.5">
                <Check size={17} style={{ color: "var(--up)" }} />
                <span className="data text-[13px] text-ink-2">
                  {s} from Hyperliquid, checked against Coinbase
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card p-6 sm:p-8 lg:col-span-5">
          <h3 className="display text-[clamp(1.4rem,2.8vw,1.9rem)]">{t("desk.log.h")}</h3>
          <p className="measure mt-3 text-[15px] leading-relaxed text-ink-2">{t("desk.log.b")}</p>
        </article>

        <article
          className="card flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8 lg:col-span-12"
          style={{
            background: "color-mix(in srgb, var(--holo) 8%, var(--panel))",
            borderColor: "color-mix(in srgb, var(--holo) 45%, transparent)",
          }}
        >
          <div>
            <h3 className="display text-[clamp(1.4rem,2.8vw,2rem)]" style={{ color: "var(--holo)" }}>
              {t("desk.chain.h")}
            </h3>
            <p className="measure mt-3 text-[15px] leading-relaxed text-ink-2">{t("desk.chain.b")}</p>
          </div>
          <a
            href={chain.explorer}
            target="_blank"
            rel="noreferrer noopener"
            className="label lift inline-flex min-h-[52px] shrink-0 items-center gap-2 px-6 text-[12px]"
            style={{ background: "var(--pop)", color: "var(--pop-ink)", borderRadius: "var(--r)" }}
          >
            Explorer
            <ArrowRight size={16} />
          </a>
        </article>
      </div>
    </section>
  );
}

/* ── Token ───────────────────────────────────────────────────────────────── */

export function Token() {
  const { t } = useUI();
  const roadmap = [
    { label: t("token.r1"), status: "now" as const },
    { label: t("token.r2"), status: "next" as const },
    { label: t("token.r3"), status: "later" as const },
    { label: t("token.r4"), status: "later" as const },
  ];

  return (
    <section id="token" className="scroll-mt-24 py-16 sm:py-24">
      <div className="card grid gap-12 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:p-14">
        <div>
          <h2 className="display text-[clamp(2.4rem,6.5vw,4.4rem)]">{t("token.h")}</h2>
          <p className="measure mt-5 text-[16px] leading-relaxed text-ink-2">{t("token.b")}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span
              aria-disabled="true"
              className="label inline-flex min-h-[52px] cursor-not-allowed items-center gap-2 border border-dashed px-6 text-[12px] text-ink-3"
              style={{ borderColor: "var(--rule)", borderRadius: "var(--r)" }}
            >
              <Warning size={16} />
              {t("token.disabled")}
            </span>
            <a
              href="#arena"
              className="label lift inline-flex min-h-[52px] items-center gap-2 px-6 text-[13px]"
              style={{
                background: "var(--pop)",
                color: "var(--pop-ink)",
                borderRadius: "var(--r)",
                boxShadow: "var(--panel-glow)",
              }}
            >
              {t("hero.cta")}
              <ArrowRight size={16} />
            </a>
          </div>
        </div>

        <div>
          <h3 className="label mb-5 text-[12px] text-ink-3">{t("token.roadmap")}</h3>
          <ol>
            {roadmap.map((r, i) => (
              <li
                key={r.label}
                className="flex gap-4 border-b py-5 last:border-0"
                style={{ borderColor: "var(--rule-soft)" }}
              >
                <span className="mt-1 shrink-0">
                  {r.status === "now" ? (
                    <Lamp size={15} className="animate-blip" style={{ color: "var(--up)" }} />
                  ) : (
                    <span
                      aria-hidden
                      className="block h-[15px] w-[15px] rounded-full border"
                      style={{ borderColor: "var(--rule-soft)" }}
                    />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-[16px] font-medium leading-snug">{r.label}</p>
                  <p
                    className="label mt-2 text-[11px]"
                    style={{ color: r.status === "now" ? "var(--up)" : "var(--ink-3)" }}
                  >
                    {t(`token.status.${r.status}` as "token.status.now")}
                  </p>
                </div>
                <span className="data ml-auto shrink-0 self-start text-[12px] text-ink-3">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
