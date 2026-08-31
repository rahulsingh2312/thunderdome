"use client";

import { useCallback, useEffect, useState } from "react";
import type { ArenaView } from "@/lib/engine";
import { cadence } from "@/lib/config";

/** Polls the arena, holding the last real view on failure. */
export function useArena(initial: ArenaView) {
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
