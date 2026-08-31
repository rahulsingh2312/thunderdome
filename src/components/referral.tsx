"use client";

import { useCallback, useEffect, useState } from "react";
import { useUI } from "./providers";
import { Check, Lamp } from "./icons";
import { site, points } from "@/lib/config";
import { integer } from "@/lib/format";

type Me = { code: string; points: number; refs: number; lastClaim: number | null; referredBy: string | null };
type BoardRow = { code: string; points: number; refs: number; paper?: boolean };

// Season start: 2026-08-28. Drift stays in the hundreds, not the millions.
const DRIFT_EPOCH = 1787875200000;

/** The paper crowd: deterministic filler rows whose scores creep upward. */
function paperRows(n = 50): BoardRow[] {
  const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let seed = 9871;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const minutes = Math.floor((Date.now() - DRIFT_EPOCH) / 60000);
  return Array.from({ length: n }, () => {
    let code = "";
    for (let i = 0; i < 6; i++) code += abc[Math.floor(rnd() * abc.length)];
    const rate = 0.05 + rnd() * 0.85; // points per minute of drift
    const base = Math.floor(150 + rnd() * rnd() * 4200);
    return {
      code,
      points: base + Math.floor(Math.max(0, minutes) * rate),
      refs: Math.floor(rnd() * rnd() * 15) + Math.floor((Math.max(0, minutes) * rate) / 900),
      paper: true,
    };
  });
}

export function Referral() {
  const { t } = useUI();
  const [me, setMe] = useState<Me | null>(null);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const loadBoard = useCallback(async () => {
    try {
      const res = await fetch("/api/social", { cache: "no-store" });
      if (res.ok) {
        const real = ((await res.json()) as { board: BoardRow[] }).board ?? [];
        const taken = new Set(real.map((r) => r.code));
        setBoard(
          [...real, ...paperRows().filter((r) => !taken.has(r.code))]
            .sort((a, b) => b.points - a.points)
            .slice(0, 50),
        );
      }
    } catch {}
  }, []);

  useEffect(() => {
    const tick = setInterval(() => loadBoard(), 45_000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let id: string | null = null;
    let ref: string | null = null;
    try {
      id = localStorage.getItem("arena.me");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("arena.me", id);
      }
      ref = new URLSearchParams(window.location.search).get("ref");
    } catch {
      return; // Blocked storage: the section stays hidden rather than broken.
    }
    setMyId(id);
    (async () => {
      try {
        const res = await fetch("/api/social", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "hello", me: id, ref }),
        });
        if (res.ok) setMe(((await res.json()) as { user: Me }).user);
      } catch {}
      loadBoard();
    })();
  }, [loadBoard]);

  const link = me ? `${site.url}/?ref=${me.code}` : `${site.url}/`;
  const cooldownMs = points.claimCooldownHours * 3600 * 1000;
  const nextClaimIn = me?.lastClaim ? me.lastClaim + cooldownMs - Date.now() : 0;
  const canClaim = me != null && nextClaimIn <= 0;
  // Re-render each half-minute so the countdown actually counts down.
  const [, setCooldownTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCooldownTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  const cooldownText = (() => {
    const h = Math.floor(nextClaimIn / 3600000);
    const m = Math.max(1, Math.ceil((nextClaimIn % 3600000) / 60000));
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  })();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const doClaim = async () => {
    setClaiming(true);
    try {
      const res = await fetch("/api/social", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "claim", me: myId }),
      });
      if (res.ok) {
        const j = (await res.json()) as { user: Me };
        setMe(j.user);
        loadBoard();
      }
    } catch {}
    setClaiming(false);
  };

  return (
    <section id="ref" className="scroll-mt-24 pb-16 sm:pb-24">
      <h2 className="display mb-5 text-[clamp(1.8rem,4.5vw,2.8rem)]">{t("ref.h")}</h2>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="card p-6 sm:p-8">
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="label text-[11px] text-ink-3">{t("ref.points")}</dt>
              <dd className="data mt-1.5 text-[34px] leading-none tabular-nums" style={{ color: "var(--pop)" }}>
                {me ? integer(me.points) : "…"}
              </dd>
            </div>
            <div>
              <dt className="label text-[11px] text-ink-3">{t("ref.refs")}</dt>
              <dd className="data mt-1.5 text-[34px] leading-none tabular-nums">{me ? integer(me.refs) : "…"}</dd>
            </div>
          </dl>

          <button
            onClick={doClaim}
            disabled={!canClaim || claiming}
            className="label lift mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 text-[12px] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
            style={{ background: "var(--pop)", color: "var(--pop-ink)", borderRadius: "var(--r)" }}
          >
            {canClaim
              ? `${t("ref.claim")} (+${points.claim})`
              : me == null
                ? "…"
                : `${t("ref.cooling")} ${cooldownText}`}
          </button>

          <p className="measure mt-4 text-[13px] leading-relaxed text-ink-3">{t("ref.how")}</p>
          {me?.referredBy && (
            <p className="data mt-1 text-[12px] text-ink-3">
              {t("ref.invited")}: {me?.referredBy}
            </p>
          )}

          <div className="mt-5 flex w-full items-stretch gap-2">
            <input
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Your referral link"
              className="data w-full min-w-0 border bg-[var(--ground-2)] px-3 py-3 text-[12px] text-ink-2"
              style={{ borderColor: "var(--rule)", borderRadius: "var(--r)" }}
            />
            <button
              onClick={copy}
              className="label lift inline-flex min-h-[48px] shrink-0 items-center gap-2 px-5 text-[12px]"
              style={{ background: "var(--pop)", color: "var(--pop-ink)", borderRadius: "var(--r)" }}
            >
              {copied && <Check size={14} />}
              {copied ? t("ref.copied") : t("ref.copy")}
            </button>
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <h3 className="label text-[11px] text-ink-3">{t("ref.board")}</h3>
          {board.length === 0 ? (
            <p className="mt-3 text-[13px] text-ink-3">{t("ref.empty")}</p>
          ) : (
            <ol className="mt-3">
              {board.slice(0, showAll ? board.length : 10).map((row, i) => (
                <li
                  key={row.code}
                  className="flex items-center gap-3 border-b py-2.5 last:border-0"
                  style={{ borderColor: "var(--rule-soft)" }}
                >
                  <span className="data w-6 text-[12px] tabular-nums text-ink-3">{i + 1}</span>
                  <span className="data flex-1 text-[13px]">
                    {row.code}
                    {row.paper && <span className="ml-1.5 text-[8px] text-ink-3">paper</span>}
                    {me && row.code === me.code && (
                      <span className="label ml-2 text-[9px]" style={{ color: "var(--pop)" }}>
                        <Lamp size={7} className="mr-1 inline" />
                        YOU
                      </span>
                    )}
                  </span>
                  <span className="data text-[12px] tabular-nums text-ink-3">{row.refs} ref</span>
                  <span className="data w-20 text-right text-[13px] tabular-nums" style={{ color: "var(--pop)" }}>
                    {integer(row.points)}
                  </span>
                </li>
              ))}
            </ol>
          )}
          {board.length > 10 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="label mt-3 min-h-[44px] w-full border text-[11px] text-ink-2 hover:text-ink"
              style={{ borderColor: "var(--rule)", borderRadius: "var(--r)" }}
            >
              {`SHOW MORE (${board.length - 10})`}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
