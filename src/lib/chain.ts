import { chain } from "./config";

export type ChainState = {
  /** Current slot on mainnet-beta. */
  slot: number;
  epoch: number | null;
  at: number;
  ok: boolean;
};

let lastGood: ChainState | null = null;
let backoffUntil = 0;
let failures = 0;

async function rpc<T>(method: string, params: unknown[] = [], ms = 7000): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(chain.rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: ctl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`rpc ${method} responded ${res.status}`);
    const j = (await res.json()) as { result?: T; error?: { message?: string } };
    if (j.error) throw new Error(j.error.message ?? `rpc ${method} failed`);
    return j.result as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Solana heartbeat: holds the last real slot on failure, never reports zero. */
export async function getChainState(): Promise<ChainState> {
  if (Date.now() < backoffUntil && lastGood) return { ...lastGood, ok: false };
  try {
    const [slot, epochInfo] = await Promise.all([
      rpc<number>("getSlot"),
      rpc<{ epoch: number }>("getEpochInfo").catch(() => null),
    ]);
    if (!Number.isFinite(slot)) throw new Error("slot unreadable");
    const state: ChainState = { slot, epoch: epochInfo?.epoch ?? null, at: Date.now(), ok: true };
    lastGood = state;
    failures = 0;
    backoffUntil = 0;
    return state;
  } catch {
    failures += 1;
    backoffUntil = Date.now() + Math.min(60_000, 1_000 * 2 ** Math.min(failures, 6));
    return lastGood ? { ...lastGood, ok: false } : { slot: 0, epoch: null, at: 0, ok: false };
  }
}
