import { sources, universe, type Symbol_ } from "./config";

export type Quote = {
  symbol: Symbol_;
  /** Mark price from Hyperliquid. */
  mark: number;
  /** Independent spot reference from Coinbase, when it answered. */
  spot: number | null;
  /** When this value was actually observed upstream. */
  at: number;
};

export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };

/**
 * Last known good quotes. A failed refresh holds these rather than emitting a
 * neutral placeholder, so the UI can show a real number marked stale instead of
 * a synthetic one that briefly lies.
 */
const lastGood = new Map<Symbol_, Quote>();
let backoffUntil = 0;
let consecutiveFailures = 0;

function noteFailure() {
  consecutiveFailures += 1;
  const delay = Math.min(60_000, 1_000 * 2 ** Math.min(consecutiveFailures, 6));
  backoffUntil = Date.now() + delay;
}

function noteSuccess() {
  consecutiveFailures = 0;
  backoffUntil = 0;
}

async function postJson<T>(url: string, body: unknown, ms = 8000): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: ctl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`${url} responded ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function getJson<T>(url: string, ms = 8000): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`${url} responded ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function coinbaseSpot(symbol: Symbol_): Promise<number | null> {
  try {
    const j = await getJson<{ data?: { amount?: string } }>(
      `${sources.coinbase}/${symbol}-USD/spot`,
      5000,
    );
    const n = Number(j?.data?.amount);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/**
 * Live marks for the trading universe. Degrades to last known good values and
 * never invents one: a symbol that has never resolved is simply absent.
 */
export async function getQuotes(): Promise<{ quotes: Quote[]; stale: boolean }> {
  if (Date.now() < backoffUntil) {
    return { quotes: [...lastGood.values()], stale: true };
  }

  try {
    const mids = await postJson<Record<string, string>>(sources.hyperliquid, { type: "allMids" });
    const spots = await Promise.all(universe.map((s) => coinbaseSpot(s)));
    const at = Date.now();

    universe.forEach((symbol, i) => {
      const mark = Number(mids[symbol]);
      if (!Number.isFinite(mark) || mark <= 0) return;
      lastGood.set(symbol, { symbol, mark, spot: spots[i], at });
    });

    noteSuccess();
    return { quotes: [...lastGood.values()], stale: false };
  } catch {
    noteFailure();
    return { quotes: [...lastGood.values()], stale: true };
  }
}

/** Recent candles, used for the model's price-history input and the price rail. */
export async function getCandles(
  symbol: Symbol_,
  interval: "5m" | "15m" | "1h" = "15m",
  hours = 24,
): Promise<Candle[]> {
  try {
    const endTime = Date.now();
    const startTime = endTime - hours * 3600 * 1000;
    const raw = await postJson<
      Array<{ t: number; o: string; h: string; l: string; c: string; v: string }>
    >(sources.hyperliquid, { type: "candleSnapshot", req: { coin: symbol, interval, startTime, endTime } });
    if (!Array.isArray(raw)) return [];
    return raw.map((k) => ({
      t: k.t,
      o: Number(k.o),
      h: Number(k.h),
      l: Number(k.l),
      c: Number(k.c),
      v: Number(k.v),
    }));
  } catch {
    return [];
  }
}
