"use client";

import { useEffect, useRef, useState } from "react";
import { sources } from "@/lib/config";

export type LiveMids = {
  mids: Record<string, number>;
  at: number;
  /** +1 up-flash, -1 down-flash since the previous second. */
  flash: Record<string, 1 | -1 | 0>;
};

/**
 * One-second market heartbeat. Talks to Hyperliquid directly from the browser
 * (public, keyless, CORS-open); falls back to the server ticker when blocked.
 * Pauses while the tab is hidden.
 */
export function useLiveMids(symbols: string[]): LiveMids {
  const [state, setState] = useState<LiveMids>({ mids: {}, at: 0, flash: {} });
  const prev = useRef<Record<string, number>>({});
  const direct = useRef(true);

  useEffect(() => {
    let alive = true;

    const apply = (raw: Record<string, number>, at: number) => {
      const mids: Record<string, number> = {};
      const flash: Record<string, 1 | -1 | 0> = {};
      for (const s of symbols) {
        const v = raw[s];
        if (!Number.isFinite(v)) continue;
        mids[s] = v;
        const p = prev.current[s];
        flash[s] = p == null || v === p ? 0 : v > p ? 1 : -1;
        prev.current[s] = v;
      }
      if (alive && Object.keys(mids).length) setState({ mids, at, flash });
    };

    const tick = async () => {
      if (document.hidden) return;
      if (direct.current) {
        try {
          const res = await fetch(sources.hyperliquid, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ type: "allMids" }),
          });
          if (!res.ok) throw new Error(String(res.status));
          const j = (await res.json()) as Record<string, string>;
          const raw: Record<string, number> = {};
          for (const s of symbols) raw[s] = Number(j[s]);
          apply(raw, Date.now());
          return;
        } catch {
          direct.current = false; // Browser blocked: drop to the server proxy.
        }
      }
      try {
        const res = await fetch("/api/ticker", { cache: "no-store" });
        if (!res.ok) return;
        const j = (await res.json()) as { at: number; rows: { symbol: string; mark: number }[] };
        const raw: Record<string, number> = {};
        for (const r of j.rows) raw[r.symbol] = r.mark;
        apply(raw, j.at || Date.now());
      } catch {}
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(",")]);

  return state;
}
