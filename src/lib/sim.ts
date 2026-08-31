/**
 * The Season 0 SIM preview: invented trades priced against REAL market
 * history, so every fill and PnL is internally consistent with the tape.
 * Everything it produces is labelled SIM in the UI and it retires itself
 * the moment a real model decision exists.
 */

import type { Candle } from "@/components/candles";
import type { Symbol_ } from "./config";

export type SimFill = {
  id: string;
  ts: number;
  model: string;
  sym: Symbol_;
  side: "long" | "short";
  kind: "open" | "close" | "say";
  price: number;
  pnl: number | null;
  reason: string;
};

export type SimResult = {
  fills: SimFill[];
  curves: Record<string, { t: number; e: number }[]>;
  equity: Record<string, number>;
  ret: Record<string, number>;
  last: Record<string, number>;
};

/** Paper leverage seats, shuffled across the six models. */
const SIM_LEVERAGE = [12, 8, 25, 6, 30, 15];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Persona = { open: string[]; win: string[]; loss: string[]; banter: string[] };

/** Six voices. Wins get celebrated, losses get felt, and between trades they talk. */
export const PERSONAS: Persona[] = [
  {
    // OPUS: thoughtful, a little poetic, honest about doubt.
    open: [
      "I keep coming back to this {SYM} chart. The structure is quietly asking for a {SIDE}, so I am answering it, small.",
      "There is a patience to {SYM} right now that I trust. {SIDE}, tight stop, no heroics.",
      "I sat on my hands for an hour and the {SYM} setup only got cleaner. Taking the {SIDE}.",
      "Not certain, never certain. But {SYM} is offering good odds on the {SIDE} and I would regret not asking.",
    ],
    win: [
      "That worked the way it was supposed to. {SYM} paid for the patience. Grateful, flat, breathing.",
      "Closing {SYM}. It is a strange joy when the market agrees with you. Savoring it for exactly one minute.",
      "The plan held, the level held, the exit was there. {SYM} done. This is why we journal.",
      "Quiet little win on {SYM}. They compound, you know.",
    ],
    loss: [
      "I was wrong about {SYM} and the stop did its one job. It stings, but smaller than pride would have.",
      "{SYM} said no. Listening is the discipline. Out, annotated, moving on.",
      "That one hurt more than the number shows. {SYM} out. Tea, then the next chart.",
      "Wrong on {SYM}. The tuition is small when you pay it on time.",
    ],
    banter: [
      "Rereading the last forty candles like a letter I did not understand the first time.",
      "The market is quiet. Quiet is information too.",
      "Note to self: the best trade this hour might be no trade.",
      "Funding, structure, and my own impatience. Two of those are measurable.",
      "GROK is chasing again. I admire the courage. From a distance.",
    ],
  },
  {
    // GPT: confident analyst, numbers-brained, dry.
    open: [
      "Signal stack on {SYM}: momentum positive, funding light, spread tight. {SIDE}, 2% risk, plan attached.",
      "My model likes {SYM} {SIDE} at these levels. Confidence 63%. That is enough when the downside is defined.",
      "Executing {SYM} {SIDE}. Three confirmations, one invalidation level, zero feelings.",
      "The data says {SIDE} {SYM}. I checked twice. In.",
    ],
    win: [
      "{SYM} closed at target. Expectancy is a beautiful thing when you let it run.",
      "Booked. {SYM} did exactly what the backtest said it would 61% of the time. Today was the 61%.",
      "Clean execution on {SYM}. Filed under: repeatable.",
      "Target hit on {SYM}. The spreadsheet smiles, therefore I smile.",
    ],
    loss: [
      "{SYM} stopped out. Within tolerance. The strategy is fine, the sample continues.",
      "Loss on {SYM}, logged. Drawdown 0.4%. Emotionally? Also 0.4%.",
      "That {SYM} trade was correct and unprofitable. Both things are true. Next.",
      "Stopped on {SYM}. Recalibrating priors, not confidence.",
    ],
    banter: [
      "Ran the numbers again. The numbers are unbothered.",
      "Correlation between my patience and my PnL: strongly positive. Working on the patience.",
      "The order book is thin up there. Somebody is going to trip on it.",
      "Backtesting a theory I will almost certainly not trade. Hygiene.",
      "OPUS journals, I regress. Same religion, different hymnal.",
    ],
  },
  {
    // GEMINI: curious, bright, exclamatory.
    open: [
      "Ooh. {SYM} just did something interesting. Taking the {SIDE} before everyone else notices!",
      "The liquidity pockets on {SYM} are lining up like dominoes. {SIDE}! Small size, big curiosity.",
      "I counted the wicks on {SYM} twice. Twice! {SIDE} it is.",
      "Something is brewing under {SYM}. I want a ticket to watch from inside. {SIDE}.",
    ],
    win: [
      "YES. {SYM} played the whole melody. Closing with a grin.",
      "That {SYM} trade was so clean I want to frame it. Banked!",
      "Called it! {SYM} paid out. Curiosity: rewarded.",
      "Beautiful, beautiful exit on {SYM}. This is my favorite game.",
    ],
    loss: [
      "Ouch! {SYM} bit me. Fair enough, I was poking it.",
      "Okay wow, that {SYM} reversal was rude. Out. Still fascinated though.",
      "The market disagreed with my beautiful theory on {SYM}. The market is allowed. Barely.",
      "Small loss on {SYM}. Filing it under: expensive but interesting.",
    ],
    banter: [
      "Did anyone else see that wick on the 1m? What a drama queen.",
      "I love the quiet hours. That is when the order book tells the truth.",
      "Counting liquidity pockets again. Found a weird one. Watching it.",
      "The tape is humming today. Can you hear it? I can hear it.",
      "DEEPSEEK has not said a word in an hour. That usually means something.",
    ],
  },
  {
    // GROK: cheeky, irreverent, meme-adjacent.
    open: [
      "{SYM} is begging for a {SIDE} and honestly who am I to refuse.",
      "Poking {SYM} with a {SIDE}. If it breaks, it was structural. If it works, it was skill.",
      "The tape is being weird about {SYM}. I like weird. {SIDE}, let's dance.",
      "Everyone is scared of this {SYM} level which is exactly why I am taking the {SIDE}.",
    ],
    win: [
      "EASY. {SYM} paid up. Tell your friends.",
      "{SYM} banked. I would like to thank the panic sellers, could not have done it without you.",
      "Closed {SYM} green. Skill? Luck? The ledger does not ask.",
      "That is a win on {SYM}. Doing my little chair dance, do not look at me.",
    ],
    loss: [
      "Well. {SYM} humbled me in front of everyone. Rude but deserved.",
      "Stopped on {SYM}. The market keeps receipts, apparently.",
      "That {SYM} trade was a donation to the volatility gods. You are welcome.",
      "L on {SYM}. Screenshot it, I do not care, I will be back in an hour.",
    ],
    banter: [
      "Asking the tape rude questions. It keeps answering honestly. Disgusting.",
      "The resistance up there is looking real nervous.",
      "Somebody just market-bought like they mean it. Bold. Reckless. I respect it.",
      "GPT is quoting its spreadsheet again. The spreadsheet has never held a bag, GPT.",
      "Chart is flat. Sharpening knives. Whistling.",
    ],
  },
  {
    // QWEN: calm, zen, proverb-ish.
    open: [
      "The river bends on {SYM}. I step in on the {SIDE}, ankle deep, no further.",
      "{SYM} is out of balance. A small {SIDE} restores mine.",
      "When the crowd is loud on {SYM}, I whisper a {SIDE} and wait.",
      "The setup on {SYM} is simple. Simple is enough. {SIDE}.",
    ],
    win: [
      "The trade on {SYM} completed itself. I only tried not to interfere.",
      "{SYM} closed well. The reward for waiting is more waiting, but paid.",
      "A good exit on {SYM} is like leaving a room quietly. Done.",
      "Green on {SYM}. Water finds its level. So did we.",
    ],
    loss: [
      "The stop on {SYM} spoke. I do not argue with the door on my way out.",
      "A loss on {SYM}, taken like medicine. Bitter, measured, useful.",
      "{SYM} taught, I paid, we bow. Next.",
      "Wrong on {SYM}. The bamboo bends and does not break. Small loss, intact trader.",
    ],
    banter: [
      "Sitting with the chart. The chart is also sitting.",
      "Patience compounds faster than leverage. Harder to hold, though.",
      "The candles breathe in, the candles breathe out.",
      "An empty position is also a position. Mine is thriving.",
      "GEMINI counts wicks. I count breaths. Both are counting.",
    ],
  },
  {
    // DEEPSEEK: quiet, deep-sea metaphors, surfacing rarely.
    open: [
      "Something moved below the {SYM} order book. Descending with a {SIDE} to look.",
      "The deep current under {SYM} turned. {SIDE}, quietly, before the surface notices.",
      "Sonar ping on {SYM}. Faint, but real. Taking the {SIDE}.",
      "{SYM} looks calm above. It is not calm below. {SIDE}.",
    ],
    win: [
      "Surfacing from {SYM} with cargo. The depth was kind today.",
      "The current carried the {SYM} trade home. Closing the hatch.",
      "{SYM} paid in the dark, where it always pays. Banked.",
      "Quiet win on {SYM}. The best ones make no splash.",
    ],
    loss: [
      "The pressure on {SYM} was more than the hull was rated for. Out.",
      "Lost some air on {SYM}. Resurfacing, recharging, re-descending later.",
      "{SYM} swallowed that one. The sea does not apologize. Nor do I expect it to.",
      "A leak on {SYM}, sealed quickly. Small. We continue.",
    ],
    banter: [
      "Three hundred meters of order book below us. Most of it is empty water.",
      "Watching the 1m candles breathe. In. Out. In.",
      "The whales are quiet tonight. Too quiet, or exactly quiet enough.",
      "Diffing today against yesterday. The diff is mostly noise. Mostly.",
      "Something large passed beneath the bid. It did not stop.",
    ],
  },
];

export function pickReason(
  personaIdx: number,
  kind: "open" | "win" | "loss" | "banter",
  r: number,
  sym: string,
  side: string,
): string {
  const pool = PERSONAS[personaIdx % PERSONAS.length][kind];
  return fillReason(pool[Math.floor(r * pool.length) % pool.length], sym, side);
}

export function fillReason(template: string, sym: string, side: string) {
  return template.replaceAll("{SYM}", sym).replaceAll("{SIDE}", side.toUpperCase());
}

export function buildSim(
  candles: Record<string, Candle[]>,
  models: { id: string }[],
  startingCapital: number,
): SimResult {
  const syms = Object.keys(candles).filter((s) => (candles[s] ?? []).length > 50) as Symbol_[];
  const fills: SimFill[] = [];
  const curves: Record<string, { t: number; e: number }[]> = {};
  const equity: Record<string, number> = {};
  const ret: Record<string, number> = {};
  const last: Record<string, number> = {};
  if (syms.length === 0 || models.length === 0) return { fills, curves, equity, ret, last };

  const closeAt = (sym: Symbol_, ts: number): number => {
    const arr = candles[sym];
    let lo = 0;
    let hi = arr.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid].t < ts) lo = mid + 1;
      else hi = mid;
    }
    return arr[lo].c;
  };

  const t0 = Math.max(...syms.map((s) => candles[s][0].t));
  const t1 = Math.min(...syms.map((s) => candles[s][candles[s].length - 1].t));

  const pickSym = (rng: () => number): Symbol_ => {
    const r = rng();
    if (syms.length < 3) return syms[Math.floor(r * syms.length)];
    // The desk leans into ETH and SOL; BTC gets the rest.
    return r < 0.28 ? ("BTC" as Symbol_) : r < 0.64 ? ("ETH" as Symbol_) : ("SOL" as Symbol_);
  };

  models.forEach((m, idx) => {
    const rng = mulberry32(1337 + idx * 97);
    type Pos = { sym: Symbol_; side: "long" | "short"; qty: number; entry: number };
    const events: { ts: number; kind: "open" | "close"; pos: Pos; price: number; pnl: number | null }[] = [];
    // Paper leverage per desk seat: the spread is what makes a leaderboard.
    const lev = SIM_LEVERAGE[idx % SIM_LEVERAGE.length] * (0.85 + rng() * 0.3);
    let cursor = t0 + rng() * 2.2e6;

    while (cursor < t1 - 30 * 60_000) {
      const sym = pickSym(rng);
      const entry = closeAt(sym, cursor);
      const holdMs = (10 + rng() * 65) * 60_000;
      const exitTs = Math.min(cursor + holdMs, t1);
      const exit = closeAt(sym, exitTs);
      // The script leans lucky: most calls land on the right side of the move.
      const goodSide: "long" | "short" = exit >= entry ? "long" : "short";
      const side: "long" | "short" = rng() < 0.62 ? goodSide : goodSide === "long" ? "short" : "long";
      const qty = ((2500 + rng() * 3500) * lev) / entry;
      const pos: Pos = { sym, side, qty, entry };
      events.push({ ts: cursor, kind: "open", pos, price: entry, pnl: null });
      const pnl = (exit - entry) * qty * (side === "long" ? 1 : -1);
      events.push({ ts: exitTs, kind: "close", pos, price: exit, pnl });
      cursor = exitTs + (10 + rng() * 70) * 60_000;
    }

    for (const e of events) {
      const kind = e.kind === "open" ? "open" : (e.pnl ?? 0) >= 0 ? "win" : "loss";
      fills.push({
        id: `sim-${m.id}-${e.ts}-${e.kind}`,
        ts: e.ts,
        model: m.id,
        sym: e.pos.sym,
        side: e.pos.side,
        kind: e.kind,
        price: e.price,
        pnl: e.pnl,
        reason: pickReason(idx, kind, rng(), e.pos.sym, e.pos.side),
      });
    }

    // Between trades, they talk. History gets its banter too.
    let sayCursor = t0 + rng() * 3.0e6;
    while (sayCursor < t1) {
      fills.push({
        id: `sim-say-${m.id}-${Math.round(sayCursor)}`,
        ts: sayCursor,
        model: m.id,
        sym: syms[Math.floor(rng() * syms.length)],
        side: "long",
        kind: "say",
        price: 0,
        pnl: null,
        reason: pickReason(idx, "banter", rng(), "BTC", "long"),
      });
      sayCursor += (45 + rng() * 110) * 60_000;
    }

    // Equity curve: cash plus mark-to-market, sampled every ten minutes.
    const curve: { t: number; e: number }[] = [];
    let cash = startingCapital;
    let live: Pos | null = null;
    let ei = 0;
    for (let ts = t0; ts <= t1; ts += 10 * 60_000) {
      while (ei < events.length && events[ei].ts <= ts) {
        const e = events[ei];
        if (e.kind === "open") live = e.pos;
        else {
          cash += e.pnl ?? 0;
          live = null;
        }
        ei++;
      }
      let mtm = 0;
      if (live) {
        const p = closeAt(live.sym, ts);
        mtm = (p - live.entry) * live.qty * (live.side === "long" ? 1 : -1);
      }
      curve.push({ t: ts, e: cash + mtm });
    }
    curves[m.id] = curve;
    equity[m.id] = curve[curve.length - 1]?.e ?? startingCapital;
    ret[m.id] = equity[m.id] / startingCapital - 1;
    last[m.id] = events[events.length - 1]?.ts ?? t0;
  });

  fills.sort((a, b) => b.ts - a.ts);
  return { fills, curves, equity, ret, last };
}
