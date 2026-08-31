"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Graticule, type Series } from "./graticule";
import { useUI } from "./providers";
import { Lamp, Warning, Fletch } from "./icons";
import type { ArenaView } from "@/lib/engine";
import type { ChainState } from "@/lib/chain";
import { cadence, launch, chain as chainCfg } from "@/lib/config";
import { clockUTC, money, percent, price, integer } from "@/lib/format";
import { Ago } from "./relative-time";

type Mode = "bench" | "board" | "versus";
const MODES: Mode[] = ["bench", "board", "versus"];

const TIMEBASES = [
  { hours: 1, label: "1H" },
  { hours: 6, label: "6H" },
  { hours: 24, label: "1D" },
  { hours: 168, label: "1W" },
  { hours: null, label: "ALL" },
] as const;

function useArena(initial: ArenaView) {
  const [data, setData] = useState<ArenaView>(initial);
  const [failed, setFailed] = useState(false);
  const [failures, setFailures] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/arena", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as ArenaView);
      setFailed(false);
      setFailures(0);
    } catch {
      // Hold the last real view. Never blank the board on a failed poll.
      setFailed(true);
      setFailures((n) => n + 1);
    }
  }, []);

  useEffect(() => {
    const delay = Math.min(120_000, cadence.pollSeconds * 1000 * 2 ** Math.min(failures, 4));
    const id = setTimeout(refresh, delay);
    return () => clearTimeout(id);
  }, [refresh, failures, data]);

  return { data, failed, refresh };
}

function Pill({
  tone,
  children,
}: {
  tone: "live" | "amber" | "muted";
  children: React.ReactNode;
}) {
  const color =
    tone === "live" ? "var(--up)" : tone === "amber" ? "var(--pop)" : "var(--ink-2)";
  return (
    <span
      className="label inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[14px]"
      style={{ color, borderColor: "var(--rule)" }}
    >
      {tone === "live" && <Lamp size={8} className="animate-lamp" />}
      {tone === "amber" && <Warning size={11} />}
      {children}
    </span>
  );
}

function Delta({ ratio }: { ratio: number }) {
  // Exactly zero is not a gain. Only a real move earns a colour.
  const color = ratio === 0 ? "var(--ink-2)" : ratio > 0 ? "var(--up)" : "var(--down)";
  return (
    <span className="data tabular-nums" style={{ color }}>
      {percent(ratio)}
    </span>
  );
}

export function Arena({
  initial,
  initialChain,
}: {
  initial: ArenaView;
  initialChain: ChainState;
}) {
  const { t } = useUI();
  const { data, failed, refresh } = useArena(initial);
  const [mode, setMode] = useState<Mode>("bench");
  const [windowHours, setWindowHours] = useState<number | null>(24);
  const [focus, setFocus] = useState<string[]>([]);
  const [chainState, setChainState] = useState(initialChain);
  const [versus, setVersus] = useState<[string, string] | null>(null);

  // Mode is linkable, so a shared URL opens on the same display.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("mode");
    if (p && (MODES as string[]).includes(p)) setMode(p as Mode);
  }, []);

  const changeMode = (m: Mode) => {
    setMode(m);
    const url = new URL(window.location.href);
    url.searchParams.set("mode", m);
    window.history.replaceState({}, "", url);
  };

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/chain", { cache: "no-store" });
        if (res.ok) setChainState((await res.json()) as ChainState);
      } catch {
        // The heartbeat keeps its last real block and marks itself not-ok.
      }
    }, 12_000);
    return () => clearInterval(id);
  }, []);

  const series: Series[] = useMemo(
    () => data.rows.map((r) => ({ id: r.id, label: r.label, ch: r.ch, points: r.equityCurve })),
    [data.rows],
  );

  const pair = useMemo<[string, string] | null>(() => {
    if (versus) return versus;
    if (data.rows.length >= 2) return [data.rows[0].id, data.rows[1].id];
    return null;
  }, [versus, data.rows]);

  const paperNote = !launch.deskFunded;

  const graticuleFocus = mode === "versus" && pair ? [...pair] : focus;

  return (
    <section id="arena" className="scroll-mt-20">
      {/* ── Bezel: mode, state, timebase ─────────────────────────────────── */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label={t("mode.label")}
          className="card inline-flex overflow-hidden p-1"
        >
          {MODES.map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => changeMode(m)}
              className="label min-h-[36px] rounded-[3px] px-3 text-[15px] transition-colors duration-150"
              style={{
                background: mode === m ? "var(--ground-2)" : "transparent",
                color: mode === m ? "var(--ink)" : "var(--ink-2)",
                boxShadow: mode === m ? "none" : undefined,
              }}
            >
              {t(`mode.${m}` as "mode.bench")}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {data.armed ? (
            <Pill tone="live">{t("state.armed")}</Pill>
          ) : (
            <Pill tone="amber">{t("state.unarmed")}</Pill>
          )}
          {paperNote && <Pill tone="muted">{t("state.paper")}</Pill>}
          {(failed || data.quotesStale || data.tickStale) && <Pill tone="amber">{t("state.stale")}</Pill>}
        </div>
      </div>

      {/* ── Screen ───────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden p-2 sm:p-3">
        <Graticule
          series={mode === "versus" && pair ? series.filter((s) => pair.includes(s.id)) : series}
          startingCapital={data.startingCapital}
          windowHours={windowHours}
          focus={graticuleFocus}
          ariaLabel={
            series.some((s) => s.points.length >= 2)
              ? `Equity of ${series.length} models against a starting capital of ${money(data.startingCapital)}`
              : t("state.waiting")
          }
          className="h-[240px] sm:h-[320px] lg:h-[420px]"
          standby={{ title: t("state.standby"), body: t("state.standbyWhy") }}
        />

        {/* Timebase sits under the screen like a real bench control. */}
        <div className="mt-2 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1">
            <span className="label mr-1 hidden text-[14px] text-ink-3 sm:inline">
              {t("panel.timebase")}
            </span>
            {TIMEBASES.map((tb) => (
              <button
                key={tb.label}
                onClick={() => setWindowHours(tb.hours)}
                aria-pressed={windowHours === tb.hours}
                className="data min-h-[36px] min-w-[44px] rounded-[3px] px-2 text-[15px] transition-colors duration-150"
                style={{
                  background: windowHours === tb.hours ? "var(--ground-2)" : "transparent",
                  color: windowHours === tb.hours ? "var(--ink)" : "var(--ink-2)",
                }}
              >
                {tb.label}
              </button>
            ))}
          </div>
          <div className="data shrink-0 text-[14px] text-ink-3">
            {data.lastTick ? (
              <>
                TICK <Ago at={data.lastTick} uppercase />
              </>
            ) : (
              t("state.waiting")
            )}
          </div>
        </div>
      </div>

      {(failed || data.quotesStale) && (
        <p className="data mt-2 text-[15px]" style={{ color: "var(--pop)" }}>
          {t("state.degraded")}{" "}
          <button onClick={refresh} className="underline">
            {t("state.retry")}
          </button>
        </p>
      )}

      {/* ── Modules ──────────────────────────────────────────────────────── */}
      {mode === "bench" && (
        <BenchModules
          data={data}
          chainState={chainState}
          focus={focus}
          setFocus={setFocus}
        />
      )}
      {mode === "board" && <Board data={data} />}
      {mode === "versus" && pair && <Versus data={data} pair={pair} onPick={setVersus} />}
    </section>
  );
}

/* ── BENCH ───────────────────────────────────────────────────────────────── */

function BenchModules({
  data,
  chainState,
  focus,
  setFocus,
}: {
  data: ArenaView;
  chainState: ChainState;
  focus: string[];
  setFocus: (f: string[]) => void;
}) {
  const { t } = useUI();
  const toggle = (id: string) =>
    setFocus(focus.includes(id) ? focus.filter((f) => f !== id) : [...focus, id]);

  const fills = data.rows
    .flatMap((r) => r.fills.map((f) => ({ ...f, label: r.label, ch: r.ch })))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 8);

  return (
    <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* Channel select */}
      <div className="card p-3 sm:p-4">
        <h3 className="label mb-3 text-[15px] text-ink-2">{t("panel.channels")}</h3>
        <ul className="space-y-1">
          {data.rows.map((r) => {
            const active = focus.length === 0 || focus.includes(r.id);
            return (
              <li key={r.id}>
                <button
                  onClick={() => toggle(r.id)}
                  aria-pressed={focus.includes(r.id)}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-[3px] px-2 text-left transition-colors duration-150 hover:bg-[var(--ground-2)]"
                  style={{ opacity: active ? 1 : 0.45 }}
                >
                  <span
                    aria-hidden
                    className="h-4 w-4 shrink-0 rounded-[3px] border-2 border-[var(--rule)]"
                    style={{ background: `var(--ch-${r.ch})` }}
                  />
                  <span className="label min-w-0 flex-1 truncate text-[14px]">{r.label}</span>
                  <span className="data shrink-0 text-[14px] tabular-nums">{money(r.equity)}</span>
                  <span className="shrink-0 text-[14px]">
                    <Delta ratio={r.ret} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid gap-3">
        {/* Trigger: the fee loop's live state */}
        <div className="card p-3 sm:p-4">
          <h3 className="label mb-3 text-[15px] text-ink-2">{t("panel.trigger")}</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <Readout label="DESK" value={data.armed ? t("state.armed") : t("state.unarmed")} tone={data.armed ? "up" : "amber"} />
            <Readout
              label="FEES"
              value={launch.tokenLive ? "" : t("token.disabled")}
              tone="muted"
            />
            <Readout label="CAPITAL" value={money(data.startingCapital)} sub={t("state.paper")} />
            <Readout
              label="BLOCK"
              value={chainState.block ? integer(chainState.block) : ""}
              sub={chainCfg.name}
              tone={chainState.ok ? "default" : "amber"}
            />
            <Readout
              label="GAS"
              value={chainState.gasGwei != null ? `${chainState.gasGwei.toFixed(4)} gwei` : ""}
            />
            <Readout label="CHAIN ID" value={String(chainCfg.id)} />
          </dl>
        </div>

        {/* Markets */}
        <div className="card p-3 sm:p-4">
          <h3 className="label mb-3 text-[15px] text-ink-2">{t("panel.markets")}</h3>
          {data.quotes.length === 0 ? (
            <p className="data text-[15px] text-ink-2">{t("state.degraded")}</p>
          ) : (
            <ul className="grid grid-cols-3 gap-3">
              {data.quotes.map((q) => (
                <li key={q.symbol}>
                  <div className="label text-[14px] text-ink-3">{q.symbol}</div>
                  <div className="data mt-1 text-[15px] tabular-nums">{price(q.mark)}</div>
                  <div className="data mt-0.5 text-[14px] text-ink-3">
                    {data.quotesStale ? t("state.stale") : <Ago at={q.at} />}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Decision log spans the full width: it is the evidence. */}
      <div className="card p-3 sm:p-4 lg:col-span-2">
        <h3 className="label mb-3 text-[15px] text-ink-2">{t("panel.feed")}</h3>
        {fills.length === 0 ? (
          <p className="prose-measure text-[15px] text-ink-2">
            {data.gatewayConfigured ? t("state.nofills") : t("note.gateway")}
          </p>
        ) : (
          <ul className="space-y-2">
            {fills.map((f) => (
              <li key={f.id} className="animate-rise flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="data shrink-0 text-[15px] text-ink-3">{clockUTC(f.ts)}</span>
                <span
                  aria-hidden
                  className="h-3.5 w-3.5 shrink-0 rounded-[3px] border-2 border-[var(--rule)]"
                  style={{ background: `var(--ch-${f.ch})` }}
                />
                <span className="label shrink-0 text-[15px]">{f.label}</span>
                <span
                  className="data shrink-0 text-[15px] uppercase"
                  style={{ color: f.kind === "close" ? "var(--ink-2)" : f.side === "long" ? "var(--up)" : "var(--down)" }}
                >
                  {f.kind} {f.side} {f.symbol}
                </span>
                <span className="data shrink-0 text-[15px] tabular-nums text-ink-2">
                  {price(f.price)}
                </span>
                {f.pnl != null && (
                  <span className="data shrink-0 text-[15px] tabular-nums" style={{ color: f.pnl >= 0 ? "var(--up)" : "var(--down)" }}>
                    {f.pnl >= 0 ? "+" : ""}
                    {money(f.pnl, true)}
                  </span>
                )}
                <span className="min-w-0 flex-1 basis-full text-[14px] text-ink-2 sm:basis-auto">
                  {f.reason}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Readout({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "up" | "amber" | "muted";
}) {
  const color =
    tone === "up" ? "var(--up)" : tone === "amber" ? "var(--pop)" : tone === "muted" ? "var(--ink-2)" : "var(--ink)";
  return (
    <div>
      <dt className="label text-[14px] text-ink-3">{label}</dt>
      <dd className="data mt-1 text-[15px] tabular-nums" style={{ color }}>
        {value}
        {sub && <span className="block text-[14px] text-ink-3">{sub}</span>}
      </dd>
    </div>
  );
}

/* ── BOARD ───────────────────────────────────────────────────────────────── */

function Board({ data }: { data: ArenaView }) {
  const { t } = useUI();
  return (
    <div className="card mt-3 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse">
        <caption className="sr-only">
          Arena standings, ranked by equity against {money(data.startingCapital)} of {launch.capitalLabel} capital
        </caption>
        <thead>
          <tr className="border-b" style={{ borderColor: "var(--rule)" }}>
            {[t("col.rank"), t("col.model"), t("col.equity"), t("col.return"), t("col.positions"), t("col.last")].map(
              (h, i) => (
                <th
                  key={h}
                  scope="col"
                  className={`label px-3 py-3 text-[14px] text-ink-3 ${i > 1 ? "text-right" : "text-left"}`}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r, i) => (
            <tr
              key={r.id}
              className="border-b transition-colors duration-150 last:border-0 hover:bg-[var(--ground-2)]"
              style={{ borderColor: "var(--rule)" }}
            >
              <td className="px-3 py-3">
                <span
                  className="data inline-flex h-8 w-8 items-center justify-center border text-[13px] tabular-nums"
                  style={
                    i === 0
                      ? { color: "var(--pop)", borderColor: "var(--pop)", boxShadow: "0 0 14px -4px var(--pop)", borderRadius: "var(--r)" }
                      : { color: "var(--ink-3)", borderColor: "var(--rule)", borderRadius: "var(--r)" }
                  }
                >
                  {i + 1}
                </span>
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="h-4 w-4 shrink-0 rounded-[3px] border-2 border-[var(--rule)]"
                    style={{ background: `var(--ch-${r.ch})` }}
                  />
                  <div className="min-w-0">
                    <div className="label truncate text-[14px]">{r.label}</div>
                    <div className="truncate text-[15px] text-ink-3">{r.maker}</div>
                  </div>
                </div>
              </td>
              <td className="data px-3 py-3 text-right text-[15px] tabular-nums">{money(r.equity, true)}</td>
              <td className="px-3 py-3 text-right text-[15px]">
                <Delta ratio={r.ret} />
              </td>
              <td className="data px-3 py-3 text-right text-[14px] tabular-nums text-ink-2">
                {r.positions.length === 0 ? "flat" : r.positions.map((p) => `${p.side === "long" ? "L" : "S"} ${p.symbol}`).join(", ")}
              </td>
              <td className="data px-3 py-3 text-right text-[15px] tabular-nums text-ink-3">
                <Ago at={r.lastDecisionAt} fallback="not yet" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── VERSUS ──────────────────────────────────────────────────────────────── */

function Versus({
  data,
  pair,
  onPick,
}: {
  data: ArenaView;
  pair: [string, string];
  onPick: (p: [string, string]) => void;
}) {
  const { t } = useUI();
  const a = data.rows.find((r) => r.id === pair[0]);
  const b = data.rows.find((r) => r.id === pair[1]);
  if (!a || !b) return null;

  const gap = a.ret - b.ret;

  return (
    <div className="mt-3 grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {[a, b].map((r, idx) => (
          <div key={r.id} className="card p-3 sm:p-4">
            <label className="label mb-2 block text-[14px] text-ink-3">
              {idx === 0 ? "CH A" : "CH B"}
            </label>
            <select
              value={r.id}
              onChange={(e) =>
                onPick(idx === 0 ? [e.target.value, pair[1]] : [pair[0], e.target.value])
              }
              className="label min-h-[44px] w-full rounded-[3px] border bg-[var(--ground-2)] px-2 text-[15px]"
              style={{ borderColor: "var(--rule)", color: `var(--ch-${r.ch})` }}
              aria-label={idx === 0 ? "First channel" : "Second channel"}
            >
              {data.rows.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="data text-[18px] tabular-nums">{money(r.equity, true)}</span>
              <span className="text-[15px]">
                <Delta ratio={r.ret} />
              </span>
            </div>
            <p className="data mt-2 text-[15px] text-ink-2">
              {r.positions.length === 0
                ? t("state.nopos")
                : r.positions
                    .map((p) => `${p.side} ${p.symbol} @ ${price(p.entry)}`)
                    .join(" · ")}
            </p>
          </div>
        ))}
      </div>

      <div className="card flex items-center gap-3 p-3 sm:p-4">
        <Fletch size={18} className="shrink-0 text-ink-3" />
        <p className="text-[15px] text-ink-2">
          {a.label} is {percent(Math.abs(gap))} {gap >= 0 ? "ahead of" : "behind"} {b.label} on
          return since the arena opened.
        </p>
      </div>
    </div>
  );
}
