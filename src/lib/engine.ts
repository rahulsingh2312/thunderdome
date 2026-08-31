import { z } from "zod";
import { generateObject } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { channels, type ModelId } from "./models";
import { launch, universe, cadence, type Symbol_ } from "./config";
import { getCandles, getQuotes, type Candle, type Quote } from "./markets";
import {
  emptyState,
  loadState,
  saveState,
  trimHistory,
  type ArenaState,
  type Fill,
  type ModelState,
  type Position,
} from "./store";

/** Unlevered. Collateral is posted for both sides, so equity math stays honest. */
const MAX_POSITION_FRACTION = 0.25;

export const decisionSchema = z.object({
  action: z.enum(["open", "close", "hold"]),
  symbol: z.enum(universe).nullable(),
  side: z.enum(["long", "short"]).nullable(),
  sizeUsd: z.number().nullable(),
  reason: z.string().max(240),
});
export type Decision = z.infer<typeof decisionSchema>;

export function positionValue(p: Position, mark: number): number {
  return p.side === "long" ? p.qty * mark : p.qty * (2 * p.entry - mark);
}

export function equityOf(m: ModelState, marks: Map<Symbol_, number>): number {
  let e = m.cash;
  for (const p of m.positions) {
    const mark = marks.get(p.symbol);
    // No mark means no honest valuation. Hold the entry rather than guess.
    e += positionValue(p, mark ?? p.entry);
  }
  return e;
}

export function unrealised(p: Position, mark: number): number {
  return p.side === "long" ? (mark - p.entry) * p.qty : (p.entry - mark) * p.qty;
}

function summariseCandles(c: Candle[]): string {
  if (!c.length) return "unavailable";
  const last = c[c.length - 1];
  const first = c[0];
  const change = ((last.c - first.o) / first.o) * 100;
  const highs = Math.max(...c.map((k) => k.h));
  const lows = Math.min(...c.map((k) => k.l));
  return [
    `last ${last.c}`,
    `${change >= 0 ? "+" : ""}${change.toFixed(2)}% over ${c.length} bars`,
    `range ${lows}-${highs}`,
    `vol ${Math.round(c.slice(-4).reduce((s, k) => s + k.v, 0))} recent`,
  ].join(", ");
}

/** Identical for every model. This is the point of the arena. */
function buildPrompt(m: ModelState, quotes: Quote[], candles: Record<string, Candle[]>, equity: number) {
  const marketLines = quotes
    .map((q) => `${q.symbol}: mark ${q.mark}${q.spot ? ` (spot ${q.spot})` : ""} | ${summariseCandles(candles[q.symbol] ?? [])}`)
    .join("\n");

  const posLines = m.positions.length
    ? m.positions
        .map((p) => {
          const mark = quotes.find((q) => q.symbol === p.symbol)?.mark ?? p.entry;
          return `${p.symbol} ${p.side} qty ${p.qty.toFixed(6)} entry ${p.entry} mark ${mark} unrealised ${unrealised(p, mark).toFixed(2)} USD`;
        })
        .join("\n")
    : "none";

  return `You are trading a ${launch.capitalLabel} account in a live competition against five other models. Identical rules, identical data, identical starting capital.

ACCOUNT
cash: ${m.cash.toFixed(2)} USD
equity: ${equity.toFixed(2)} USD
open positions:
${posLines}

MARKET (live)
${marketLines}

RULES
- Tradable symbols: ${universe.join(", ")}. Nothing else.
- Unlevered. Opening posts full notional as collateral, so sizeUsd must not exceed your cash.
- One position per symbol. To reverse, close first.
- A single position may not exceed ${Math.round(MAX_POSITION_FRACTION * 100)}% of equity (${(equity * MAX_POSITION_FRACTION).toFixed(2)} USD).
- You act once per interval. Holding is a real choice and costs nothing.

Return one decision. If action is "open", set symbol, side and sizeUsd. If "close", set symbol. If "hold", set symbol, side and sizeUsd to null. Give your reason in one sentence, under 240 characters.`;
}

function applyDecision(
  m: ModelState,
  d: Decision,
  marks: Map<Symbol_, number>,
  equity: number,
): ModelState {
  const now = Date.now();
  const mkFill = (f: Omit<Fill, "id" | "ts" | "model">): Fill => ({
    ...f,
    id: `${m.id}-${now}-${Math.random().toString(36).slice(2, 8)}`,
    ts: now,
    model: m.id as ModelId,
  });

  if (d.action === "close" && d.symbol) {
    const idx = m.positions.findIndex((p) => p.symbol === d.symbol);
    if (idx === -1) return m;
    const p = m.positions[idx];
    const mark = marks.get(p.symbol);
    if (mark == null) return m; // Never close at an invented price.
    const proceeds = positionValue(p, mark);
    return {
      ...m,
      cash: m.cash + proceeds,
      positions: m.positions.filter((_, i) => i !== idx),
      fills: [
        ...m.fills,
        mkFill({
          symbol: p.symbol,
          side: p.side,
          kind: "close",
          qty: p.qty,
          price: mark,
          pnl: unrealised(p, mark),
          reason: d.reason,
        }),
      ],
    };
  }

  if (d.action === "open" && d.symbol && d.side && d.sizeUsd && d.sizeUsd > 0) {
    if (m.positions.some((p) => p.symbol === d.symbol)) return m;
    const mark = marks.get(d.symbol);
    if (mark == null || mark <= 0) return m;
    const cap = Math.min(m.cash, equity * MAX_POSITION_FRACTION);
    const notional = Math.min(d.sizeUsd, cap);
    if (notional < 1) return m;
    const qty = notional / mark;
    return {
      ...m,
      cash: m.cash - notional,
      positions: [...m.positions, { symbol: d.symbol, side: d.side, qty, entry: mark, at: now }],
      fills: [
        ...m.fills,
        mkFill({ symbol: d.symbol, side: d.side, kind: "open", qty, price: mark, reason: d.reason }),
      ],
    };
  }

  return m;
}

async function decide(
  modelId: ModelId,
  prompt: string,
): Promise<{ decision: Decision } | { error: string }> {
  try {
    const { object } = await generateObject({
      model: gateway(modelId),
      schema: decisionSchema,
      prompt,
      temperature: 0.7,
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(45_000),
    });
    return { decision: object };
  } catch (err) {
    return { error: err instanceof Error ? err.message.slice(0, 160) : "decision call failed" };
  }
}

export function gatewayConfigured(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
}

/**
 * One round of the arena. Marks every open position to the live market whether
 * or not the models can be reached, so equity stays real even when the gateway
 * is unavailable. Model decisions are skipped, never fabricated.
 */
export async function tick(): Promise<{ state: ArenaState; decided: number; skipped: string | null }> {
  const ids = channels.map((c) => c.id);
  const existing = await loadState();
  const state: ArenaState = existing ?? emptyState(ids, launch.startingCapital);

  for (const id of ids) {
    if (!state.models[id]) {
      state.models[id] = emptyState([id], launch.startingCapital).models[id];
    }
  }

  const { quotes } = await getQuotes();
  const marks = new Map<Symbol_, number>(quotes.map((q) => [q.symbol, q.mark]));

  if (marks.size === 0) {
    // No honest prices means no honest tick. Leave the record untouched.
    return { state, decided: 0, skipped: "no market data" };
  }

  const candles: Record<string, Candle[]> = {};
  await Promise.all(
    universe.map(async (s) => {
      candles[s] = await getCandles(s, "15m", 24);
    }),
  );

  const canDecide = gatewayConfigured();
  let decided = 0;
  const now = Date.now();

  await Promise.all(
    ids.map(async (id) => {
      let m = state.models[id];
      const equityBefore = equityOf(m, marks);

      if (canDecide) {
        const result = await decide(id, buildPrompt(m, quotes, candles, equityBefore));
        if ("decision" in result) {
          m = applyDecision(m, result.decision, marks, equityBefore);
          m = { ...m, lastError: null, lastDecisionAt: now };
          decided += 1;
        } else {
          m = { ...m, lastError: result.error };
        }
      }

      const equityAfter = equityOf(m, marks);
      m = { ...m, equity: [...m.equity, { t: now, e: equityAfter }] };
      state.models[id] = trimHistory(m);
    }),
  );

  state.lastTick = now;
  state.armed = state.armed || decided > 0;

  await saveState(state);
  return { state, decided, skipped: canDecide ? null : "gateway not configured" };
}

/** Read-only view for the UI. Marks to market without writing. */
export async function readArena() {
  const ids = channels.map((c) => c.id);
  const [{ quotes, stale }, existing] = await Promise.all([getQuotes(), loadState()]);
  const state = existing ?? emptyState(ids, launch.startingCapital);
  const marks = new Map<Symbol_, number>(quotes.map((q) => [q.symbol, q.mark]));

  const rows = channels.map((c) => {
    const m = state.models[c.id] ?? emptyState([c.id], launch.startingCapital).models[c.id];
    const equity = equityOf(m, marks);
    return {
      id: c.id,
      label: c.label,
      maker: c.maker,
      ch: c.ch,
      logo: c.logo,
      equity,
      pnl: equity - launch.startingCapital,
      ret: equity / launch.startingCapital - 1,
      cash: m.cash,
      positions: m.positions.map((p) => {
        const mark = marks.get(p.symbol) ?? p.entry;
        return { ...p, mark, unrealised: unrealised(p, mark) };
      }),
      equityCurve: m.equity,
      fills: m.fills.slice(-12).reverse(),
      lastError: m.lastError,
      lastDecisionAt: m.lastDecisionAt,
    };
  });

  rows.sort((a, b) => b.equity - a.equity);

  const ageSeconds = state.lastTick ? (Date.now() - state.lastTick) / 1000 : null;

  return {
    startedAt: state.startedAt,
    lastTick: state.lastTick,
    armed: state.armed,
    gatewayConfigured: gatewayConfigured(),
    quotes,
    quotesStale: stale,
    tickStale: ageSeconds != null && ageSeconds > cadence.tickSeconds * 2,
    startingCapital: launch.startingCapital,
    rows,
  };
}

export type ArenaView = Awaited<ReturnType<typeof readArena>>;
export type ArenaRow = ArenaView["rows"][number];
