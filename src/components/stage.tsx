"use client";

import nextDynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUI } from "./providers";
import { useArena } from "./use-arena";
import { Lamp, Warning, External, Check } from "./icons";
import type { ArenaView } from "@/lib/engine";
import { chain, site, treasury } from "@/lib/config";
import { money, percent, price, truncateMiddle } from "@/lib/format";
import { address, lamports } from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import { useClient } from "@solana/react";
import { useConnectedWallet, useDisconnect } from "@solana/kit-plugin-wallet/react";
import { WalletModal } from "./wallet-modal";
import { type AppClient } from "./providers";

/** Lamports → "0.0500" SOL. */
function formatSol(l: bigint, digits = 4): string {
  const s = l.toString().padStart(10, "0");
  const whole = s.slice(0, -9) || "0";
  const frac = s.slice(-9).slice(0, digits);
  return `${whole}.${frac}`;
}

/** "0.05" SOL → lamports, or null when unparsable. */
function parseSol(v: string): bigint | null {
  if (!/^\d*\.?\d*$/.test(v) || v === "" || v === ".") return null;
  const [whole = "0", frac = ""] = v.split(".");
  try {
    return BigInt(whole) * 1_000_000_000n + BigInt((frac + "000000000").slice(0, 9));
  } catch {
    return null;
  }
}

const ArcadeScene = nextDynamic(() => import("./arcade"), { ssr: false });

type Backing = Record<string, { totalLamports: string; count: number }>;
type DepositPhase =
  | { step: "idle" }
  | { step: "sending" }
  | { step: "mining"; tx: string }
  | { step: "done"; tx: string }
  | { step: "error"; message: string };

const PRESETS = ["0.05", "0.1", "0.25"] as const;

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
  const [amount, setAmount] = useState<string>(PRESETS[1]);
  const [phase, setPhase] = useState<DepositPhase>({ step: "idle" });
  const meRef = useRef<string | null>(null);

  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const { dispatch: disconnect } = useDisconnect(client);
  const account = connected?.account.address ?? null;
  const [balance, setBalance] = useState<bigint | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);

  // Live SOL balance from the public RPC, refreshed while connected.
  useEffect(() => {
    if (!account) {
      setBalance(null);
      return;
    }
    let alive = true;
    const read = async () => {
      try {
        const res = await fetch(chain.rpcPublic, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [account] }),
        });
        const j = (await res.json()) as { result?: { value?: number } };
        if (alive && typeof j.result?.value === "number") setBalance(BigInt(j.result.value));
      } catch {}
    };
    read();
    const id = setInterval(read, 15_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [account]);

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

  const byCh = useMemo(() => [...data.rows].sort((a, b) => a.ch - b.ch), [data.rows]);
  const screens = useMemo(
    () =>
      byCh.map((r) => {
        const l = backing[r.id]?.totalLamports;
        return {
          label: r.label,
          ch: r.ch,
          ret: r.ret,
          equityText: money(r.equity),
          logo: r.logo,
          spark: sparkOf(r.equityCurve),
          backedText: l && l !== "0" ? `◎${formatSol(BigInt(l))}` : null,
        };
      }),
    [byCh, backing],
  );
  const agent = selected != null ? byCh[selected] : null;
  const agentBackedLamports = agent ? BigInt(backing[agent.id]?.totalLamports ?? "0") : 0n;

  const doDeposit = async () => {
    if (!agent || !account) return;
    const amt = parseSol(amount);
    if (!amt || amt <= 0n) return;
    setPhase({ step: "sending" });
    try {
      const ix = getTransferSolInstruction({
        source: client.payer,
        destination: address(treasury),
        amount: lamports(amt),
      });
      const result = await client.sendTransaction([ix]);
      const sig = result.context.signature;
      setPhase({ step: "mining", tx: sig });
      // Give confirmation a moment, then let the server prove it on-chain,
      // retrying while the RPC catches up to the signature.
      let credited = false;
      for (let i = 0; i < 12 && !credited; i++) {
        await new Promise((r) => setTimeout(r, 2500));
        const res = await fetch("/api/back", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tx: sig, machine: agent.id, me: meRef.current }),
        });
        if (res.ok) credited = true;
        else if (res.status !== 409) continue;
        else {
          const j = (await res.json().catch(() => null)) as { error?: string } | null;
          if (j?.error === "already credited") credited = true;
          else if (j?.error !== "transaction not found yet") throw new Error(j?.error ?? t("wallet.failed"));
        }
      }
      if (!credited) throw new Error(t("wallet.failed"));
      await refreshBacking();
      setPhase({ step: "done", tx: sig });
    } catch (err) {
      setPhase({
        step: "error",
        message: err instanceof Error ? err.message.split("\n")[0].slice(0, 90) : t("wallet.failed"),
      });
    }
  };

  const busy = phase.step === "sending" || phase.step === "mining";

  return (
    <section id="arena" className="relative h-[92svh] min-h-[560px]">
      <WalletModal open={walletOpen} onClose={() => setWalletOpen(false)} />
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
        <h1 className="m-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/lockup-dark.png"
            alt={site.name}
            width={300}
            height={300}
            className="h-auto w-[min(38vw,230px)]"
            style={{ filter: "drop-shadow(0 0 26px rgba(239, 255, 94, 0.45))" }}
          />
          <span className="sr-only">{site.name}</span>
        </h1>
        <p className="label text-[12px]" style={{ color: "#c9d67a" }}>{t("stage.sub")}</p>
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
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] border"
                  style={{ borderColor: `color-mix(in srgb, var(--ch-${agent.ch}) 55%, transparent)`, background: "var(--ground-2)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={agent.logo} alt={`${agent.maker} logo`} width={20} height={20} className="h-5 w-5 object-contain" />
                </span>
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
                ◎{formatSol(agentBackedLamports)}
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

          {/* ── Add funds: real SOL, verified on-chain ─────────────────────── */}
          <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--rule)" }}>
            <h3 className="label text-[11px]" style={{ color: "var(--pop)" }}>
              {t("wallet.add")}
            </h3>

            {!account ? (
              <button
                onClick={() => setWalletOpen(true)}
                className="label lift mt-3 inline-flex min-h-[46px] w-full items-center justify-center gap-2 text-[12px]"
                style={{ background: "var(--pop)", color: "var(--pop-ink)", borderRadius: "var(--r)" }}
              >
                {t("wallet.connect")}
              </button>
            ) : (
              <>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    onClick={() => disconnect()}
                    className="data text-[11px] text-ink-3 underline decoration-dotted hover:text-ink-2"
                    title="Disconnect"
                  >
                    {truncateMiddle(account)}
                  </button>
                  <span className="data text-[12px] tabular-nums text-ink-2">
                    {t("wallet.balance")}: {balance != null ? `◎${formatSol(balance)}` : "…"}
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
                      ◎{p}
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
                  disabled={busy || !parseSol(amount)}
                  className="label lift mt-3 inline-flex min-h-[46px] w-full items-center justify-center gap-2 text-[12px] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: "var(--pop)", color: "var(--pop-ink)", borderRadius: "var(--r)" }}
                >
                  {busy ? t("wallet.pending") : `${t("wallet.send")} · ◎${amount}`}
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
