import { chain } from "./config";

export type ChainState = {
  chainId: number;
  block: number;
  /** Base fee in gwei, when the node reports one. */
  gasGwei: number | null;
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

/**
 * Robinhood Chain heartbeat. Holds the last real block on failure and marks
 * itself not-ok rather than reporting a zero.
 */
export async function getChainState(): Promise<ChainState> {
  if (Date.now() < backoffUntil && lastGood) return { ...lastGood, ok: false };

  try {
    const [blockHex, feeHex] = await Promise.all([
      rpc<string>("eth_blockNumber"),
      rpc<string>("eth_gasPrice").catch(() => null),
    ]);
    const block = Number.parseInt(blockHex, 16);
    if (!Number.isFinite(block)) throw new Error("block height unreadable");

    const state: ChainState = {
      chainId: chain.id,
      block,
      gasGwei: feeHex ? Number.parseInt(feeHex, 16) / 1e9 : null,
      at: Date.now(),
      ok: true,
    };
    lastGood = state;
    failures = 0;
    backoffUntil = 0;
    return state;
  } catch {
    failures += 1;
    backoffUntil = Date.now() + Math.min(60_000, 1_000 * 2 ** Math.min(failures, 6));
    return lastGood ? { ...lastGood, ok: false } : { chainId: chain.id, block: 0, gasGwei: null, at: 0, ok: false };
  }
}
