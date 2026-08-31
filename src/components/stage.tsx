"use client";

import nextDynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUI } from "./providers";
import { useArena } from "./use-arena";
import { Lamp, Warning, External, Check } from "./icons";
import type { ArenaView } from "@/lib/engine";
import { chain, site, treasury } from "@/lib/config";
import { money, percent, price, truncateMiddle } from "@/lib/format";
import {
  balanceOf,
  connect,
  ensureChain,
  formatEth,
  hasWallet,
  parseEth,
  sendDeposit,
  waitMined,
} from "@/lib/wallet";

const ArcadeScene = nextDynamic(() => import("./arcade"), { ssr: false });

type Backing = Record<string, { totalWei: string; count: number }>;
type DepositPhase =
  | { step: "idle" }
  | { step: "sending" }
  | { step: "mining"; tx: string }
  | { step: "done"; tx: string }
  | { step: "error"; message: string };

const PRESETS = ["0.001", "0.005", "0.01"] as const;

function sparkOf(curve: { e: number }[]): number[] {
  const pts = curve.slice(-40).map((p) => p.e);
  if (pts.length < 2) return [];
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  if (hi - lo < 1e-6) return [];
  return pts.map((v) => (v - lo) / (hi - lo));
}

export function Stage({ initial }: { initial: ArenaView }) {
  const { t } = useUI();
  const { data } = useArena(initial);
  const [selected, setSelected] = useState<number | null>(null);
  const [backing, setBacking] = useState<Backing>({});
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [amount, setAmount] = useState<string>(PRESETS[1]);
  const [phase, setPhase] = useState<DepositPhase>({ step: "idle" });
  const meRef = useRef<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Visitor identity for points; created once, kept in this browser.
  useEffect(() => {
    try {
      let me = localStorage.getItem("arena.me");
      if (!me) {
        me = crypto.randomUUID();
        localStorage.setItem("arena.me", me);
      }
      meRef.current = me;
    } catch {}
  }, []);

  const refreshBacking = useCallback(async () => {
    try {
      const res = await fetch("/api/back", { cache: "no-store" });
      if (res.ok) setBacking(((await res.json()) as { machines: Backing }).machines ?? {});
    } catch {}
  }, []);

  useEffect(() => {
    refreshBacking();
    const id = setInterval(refreshBacking, 60_000);
    return () => clearInterval(id);
  }, [refreshBacking]);

  // Live wallet balance, refreshed from the public RPC.
  useEffect(() => {
    if (!account) return;
    let alive = true;
    const read = async () => {
      try {
        const b = await balanceOf(account);
        if (alive) setBalance(b);
      } catch {}
    };
    read();
    const id = setInterval(read, 15_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [account]);

  const byCh = useMemo(() => [...data.rows].sort((a, b) => a.ch - b.ch), [data.rows]);
  const screens = useMemo(
    () =>
      byCh.map((r) => {
        const wei = backing[r.id]?.totalWei;
        return {
          label: r.label,
          ch: r.ch,
          ret: r.ret,
          equityText: money(r.equity),
          spark: sparkOf(r.equityCurve),
          backedText: wei && wei !== "0" ? `Ξ${formatEth(BigInt(wei))}` : null,
        };
      }),
    [byCh, backing],
  );
  const agent = selected != null ? byCh[selected] : null;
  const agentBackedWei = agent ? BigInt(backing[agent.id]?.totalWei ?? "0") : 0n;

  const doConnect = async () => {
    try {
      const acct = await connect();
      await ensureChain();
      setAccount(acct);
      setPhase({ step: "idle" });
    } catch (err) {
      setPhase({ step: "error", message: err instanceof Error ? err.message : t("wallet.failed") });
    }
  };

  const doDeposit = async () => {
    if (!agent || !account) return;
    const wei = parseEth(amount);
    if (!wei || wei <= 0n) return;
    setPhase({ step: "sending" });
    try {
      await ensureChain();
      const tx = await sendDeposit(account, wei);
      setPhase({ step: "mining", tx });
      const mined = await waitMined(tx);
      if (!mined) throw new Error(t("wallet.failed"));
      await fetch("/api/back", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tx, machine: agent.id, me: meRef.current }),
      });
      await refreshBacking();
      if (account) setBalance(await balanceOf(account).catch(() => null));
      setPhase({ step: "done", tx });
    } catch (err) {
      setPhase({
        step: "error",
        message: err instanceof Error ? err.message.slice(0, 90) : t("wallet.failed"),
      });
    }
  };

  const busy = phase.step === "sending" || phase.step === "mining";

  return (
    <section id="arena" className="relative h-[92svh] min-h-[560px]">
      <ArcadeScene
        className="absolute inset-0 h-full w-full"
        screens={screens}
        selected={selected}
        onSelect={(i) => {
          setSelected(i);
          setPhase({ step: "idle" });
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-2 px-4 pt-9 text-center">
        <h1
          className="display text-[clamp(2rem,6.5vw,4.2rem)]"
          style={{ textShadow: "0 0 28px color-mix(in srgb, var(--pop) 55%, transparent)" }}
        >
          {site.name}
        </h1>
        <p className="label text-[12px] text-ink-2">{t("stage.sub")}</p>
      </div>

      {selected == null && (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
          <span
            className="label animate-blip inline-flex items-center gap-2 border px-4 py-2.5 text-[12px]"
            style={{
              color: "var(--pop)",
              borderColor: "var(--pop)",
              borderRadius: "var(--r)",
              background: "color-mix(in srgb, var(--ground) 75%, transparent)",
            }}
          >
            {t("stage.hint")}
          </span>
        </div>
      )}

      {agent && (
        <aside
          className="card animate-rise absolute bottom-3 left-3 right-3 z-10 max-h-[calc(100%-24px)] overflow-y-auto p-5 sm:bottom-auto sm:left-auto sm:right-6 sm:top-1/2 sm:w-[360px] sm:-translate-y-1/2"
          role="dialog"
          aria-label={agent.label}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <span aria-hidden className="h-3.5 w-3.5 rounded-[2px]" style={{ background: `var(--ch-${agent.ch})` }} />
                <h2 className="display not-italic text-[22px]">{agent.label}</h2>
              </div>
              <p className="mt-0.5 text-[12px] text-ink-3">{agent.maker}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="label min-h-[40px] min-w-[44px] rounded-[3px] border px-2 text-[11px] text-ink-2 hover:text-ink"
              style={{ borderColor: "var(--rule)" }}
            >
              {t("agent.close")}
            </button>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <dt className="label text-[10px] text-ink-3">{t("agent.equity")}</dt>
              <dd className="data mt-1 text-[15px] tabular-nums">{money(agent.equity, true)}</dd>
            </div>
            <div>
              <dt className="label text-[10px] text-ink-3">{t("agent.return")}</dt>
              <dd
                className="data mt-1 text-[15px] tabular-nums"
                style={{ color: agent.ret === 0 ? "var(--ink-2)" : agent.ret > 0 ? "var(--up)" : "var(--down)" }}
              >
                {percent(agent.ret)}
              </dd>
            </div>
            <div>
              <dt className="label text-[10px] text-ink-3">{t("wallet.backed")}</dt>
              <dd className="data mt-1 text-[15px] tabular-nums" style={{ color: "var(--ch-1)" }}>
                Ξ{formatEth(agentBackedWei)}
              </dd>
            </div>
          </dl>

          <div className="mt-3">
            <h3 className="label text-[10px] text-ink-3">{t("agent.positions")}</h3>
            <p className="data mt-1 text-[12px] leading-relaxed text-ink-2">
              {agent.positions.length === 0
                ? t("agent.flat")
                : agent.positions.map((p) => `${p.side} ${p.symbol} @ ${price(p.entry)}`).join(" · ")}
            </p>
          </div>

          <div className="mt-3">
            <h3 className="label text-[10px] text-ink-3">{t("agent.lastcall")}</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
              {agent.fills[0]?.reason ?? t("agent.nocalls")}
            </p>
          </div>

          {/* ── Add funds: real ETH, real chain, verified on-chain ─────────── */}
          <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--rule)" }}>
            <h3 className="label text-[11px]" style={{ color: "var(--pop)" }}>
              {t("wallet.add")}
            </h3>

            {!hasWallet() ? (
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-3">{t("wallet.nowallet")}</p>
            ) : !account ? (
              <button
                onClick={doConnect}
                className="label lift mt-3 inline-flex min-h-[46px] w-full items-center justify-center gap-2 text-[12px]"
                style={{ background: "var(--pop)", color: "var(--pop-ink)", borderRadius: "var(--r)" }}
              >
                {t("wallet.connect")}
              </button>
            ) : (
              <>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="data text-[11px] text-ink-3">{truncateMiddle(account)}</span>
                  <span className="data text-[12px] tabular-nums text-ink-2">
                    {t("wallet.balance")}: {balance != null ? `Ξ${formatEth(balance)}` : "…"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setAmount(p)}
                      aria-pressed={amount === p}
                      className="data min-h-[40px] rounded-[3px] border px-3 text-[12px]"
                      style={{
                        borderColor: amount === p ? "var(--pop)" : "var(--rule)",
                        color: amount === p ? "var(--pop)" : "var(--ink-2)",
                      }}
                    >
                      Ξ{p}
                    </button>
                  ))}
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    aria-label={t("wallet.custom")}
                    className="data min-h-[40px] w-24 rounded-[3px] border bg-[var(--ground-2)] px-2 text-[12px]"
                    style={{ borderColor: "var(--rule)" }}
                  />
                </div>
                <button
                  onClick={doDeposit}
                  disabled={busy || !parseEth(amount)}
                  className="label lift mt-3 inline-flex min-h-[46px] w-full items-center justify-center gap-2 text-[12px] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: "var(--pop)", color: "var(--pop-ink)", borderRadius: "var(--r)" }}
                >
                  {busy ? t("wallet.pending") : `${t("wallet.send")} · Ξ${amount}`}
                </button>
              </>
            )}

            {phase.step === "done" && (
              <p className="mt-2 flex items-center gap-1.5 text-[12px]" style={{ color: "var(--up)" }}>
                <Check size={13} /> {t("wallet.confirmed")}{" "}
                <a
                  href={`${chain.explorer}/tx/${phase.tx}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 underline"
                >
                  tx <External size={11} />
                </a>
              </p>
            )}
            {phase.step === "error" && (
              <p className="mt-2 flex items-center gap-1.5 text-[12px]" style={{ color: "var(--down)" }}>
                <Warning size={13} /> {phase.message}
              </p>
            )}
            <p className="mt-2 text-[11px] leading-relaxed text-ink-3">
              {t("wallet.note")} {truncateMiddle(treasury, 8, 6)}
            </p>
          </div>
        </aside>
      )}

      <div className="pointer-events-none absolute bottom-8 left-4 hidden items-center gap-2 sm:flex">
        <Lamp size={9} className="animate-blip" style={{ color: data.armed ? "var(--up)" : "var(--pop)" }} />
        <span className="label text-[10px] text-ink-3">
          {data.armed ? t("state.armed") : t("state.unarmed")} / {t("state.paper")}
        </span>
      </div>
    </section>
  );
}
