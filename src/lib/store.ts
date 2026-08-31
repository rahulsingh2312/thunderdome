import type { ModelId } from "./models";
import type { Symbol_ } from "./config";

export type Position = {
  symbol: Symbol_;
  side: "long" | "short";
  /** Units of the base asset. */
  qty: number;
  entry: number;
  at: number;
};

export type Fill = {
  id: string;
  ts: number;
  model: ModelId;
  symbol: Symbol_;
  side: "long" | "short";
  kind: "open" | "close";
  qty: number;
  price: number;
  /** Realised PnL in USD, present on a close. */
  pnl?: number;
  /** The model's own stated reason, verbatim and trimmed. */
  reason: string;
};

export type EquityPoint = { t: number; e: number };

export type ModelState = {
  id: ModelId;
  cash: number;
  positions: Position[];
  equity: EquityPoint[];
  fills: Fill[];
  /** Set when a model's last decision call failed, so the UI can say which. */
  lastError: string | null;
  lastDecisionAt: number | null;
};

export type ArenaState = {
  version: 1;
  startedAt: number;
  lastTick: number | null;
  /** True once at least one real model decision has been recorded. */
  armed: boolean;
  models: Record<string, ModelState>;
};

const BLOB_KEY = "arena/state.json";

/** Dev and unconfigured deploys keep state in memory for the process lifetime. */
let memory: ArenaState | null = null;

export function emptyState(ids: ModelId[], startingCapital: number): ArenaState {
  const now = Date.now();
  const models: Record<string, ModelState> = {};
  for (const id of ids) {
    models[id] = {
      id,
      cash: startingCapital,
      positions: [],
      equity: [{ t: now, e: startingCapital }],
      fills: [],
      lastError: null,
      lastDecisionAt: null,
    };
  }
  return { version: 1, startedAt: now, lastTick: null, armed: false, models };
}

function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function loadState(): Promise<ArenaState | null> {
  if (!blobConfigured()) return memory;
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
    if (!blobs.length) return null;
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ArenaState;
  } catch {
    // A storage outage must not take the page down; fall back to whatever this
    // process already holds and let the caller mark the data stale.
    return memory;
  }
}

export async function saveState(state: ArenaState): Promise<void> {
  memory = state;
  if (!blobConfigured()) return;
  try {
    const { put } = await import("@vercel/blob");
    await put(BLOB_KEY, JSON.stringify(state), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
  } catch {
    // Keep the in-memory copy; the next tick retries the write.
  }
}

/** Equity curves are capped so the state document stays small and fast to read. */
export function trimHistory(m: ModelState, maxPoints = 720, maxFills = 60): ModelState {
  return {
    ...m,
    equity: m.equity.length > maxPoints ? m.equity.slice(-maxPoints) : m.equity,
    fills: m.fills.length > maxFills ? m.fills.slice(-maxFills) : m.fills,
  };
}
