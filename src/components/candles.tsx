"use client";

import { useMemo } from "react";
import { price as fmtPrice } from "@/lib/format";

export type Candle = { t: number; o: number; h: number; l: number; c: number };

const W = 1000;
const H = 420;

/**
 * Live candlestick chart on graph paper. The forming candle breathes; the
 * window's real high and low each get a little speech cloud.
 */
export type CandleMark = { t: number; price: number; text: string; ch?: number; above?: boolean; lane?: number; id?: string; model?: string };

export function CandleChart({
  candles,
  forming,
  symbol,
  marks = [],
  onMarkClick,
  className,
}: {
  candles: Candle[];
  forming: Candle | null;
  symbol: string;
  marks?: CandleMark[];
  onMarkClick?: (id: string, model?: string) => void;
  className?: string;
}) {
  const view = useMemo(() => {
    const base = candles.slice(-140);
    const all = forming ? [...base, forming] : base;
    if (all.length < 2) return null;
    const lo = Math.min(...all.map((k) => k.l));
    const hi = Math.max(...all.map((k) => k.h));
    const pad = (hi - lo) * 0.08 || 1;
    const y = (v: number) => H - ((v - (lo - pad)) / (hi - lo + pad * 2)) * H;
    const bw = (W * 0.75) / all.length;
    const hiIdx = all.reduce((m, k, i) => (k.h > all[m].h ? i : m), 0);
    const loIdx = all.reduce((m, k, i) => (k.l < all[m].l ? i : m), 0);
    return { all, y, bw, hi, lo, hiIdx, loIdx, formingIdx: forming ? all.length - 1 : -1 };
  }, [candles, forming]);

  if (!view) {
    return <div className={className} />;
  }
  const { all, y, bw, hi, lo, hiIdx, loIdx, formingIdx } = view;

  const cloud = (key: string, cx: number, value: number, above: boolean, text: string, color = "var(--rule)", lane = 0, pulse = false, onClick?: () => void) => {
    const tw = text.length * 6.4 + 14;
    const bx = Math.max(4, Math.min(W - tw - 4, cx - tw / 2));
    const by = above ? Math.max(4, y(value) - 34 - lane * 27) : Math.min(H - 26, y(value) + 12 + lane * 27);
    return (
      <g
        key={key}
        className={pulse ? "animate-blip" : undefined}
        style={{ ...(pulse ? { animationDuration: "3.5s" } : {}), ...(onClick ? { cursor: "pointer" } : {}) }}
        onClick={onClick}
        pointerEvents="all"
      >
        <path
          d={`M${cx},${above ? y(value) - 4 : y(value) + 4} L${cx - 4},${above ? by + 22 : by} L${cx + 4},${above ? by + 22 : by} Z`}
          fill="var(--panel)"
          stroke={color}
          strokeWidth="1"
        />
        <rect x={bx} y={by} width={tw} height={22} fill="var(--panel)" stroke={color} strokeWidth="1.5" rx="3" />
        <text x={bx + tw / 2} y={by + 15} textAnchor="middle" fontSize="11" fontFamily="var(--font-plex-mono)" fill="var(--ink)" fontWeight="700">
          {text}
        </text>
      </g>
    );
  };

  const idxOf = (ts: number) => {
    let best = 0;
    for (let i = 0; i < all.length; i++) if (Math.abs(all[i].t - ts) < Math.abs(all[best].t - ts)) best = i;
    return best;
  };

  return (
    <figure className={className}>
      <div className="well relative h-full w-full overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${symbol} one-minute candles, live`} className="block h-full w-full">
          {/* graph paper */}
          <g stroke="var(--rule-soft)" strokeWidth="0.5" opacity="0.55" vectorEffect="non-scaling-stroke">
            {Array.from({ length: 49 }, (_, i) => (
              <line key={`v${i}`} x1={((i + 1) * W) / 50} y1={0} x2={((i + 1) * W) / 50} y2={H} />
            ))}
            {Array.from({ length: 39 }, (_, i) => (
              <line key={`h${i}`} x1={0} y1={((i + 1) * H) / 40} x2={W} y2={((i + 1) * H) / 40} />
            ))}
          </g>
          <g stroke="var(--rule-soft)" strokeWidth="1" vectorEffect="non-scaling-stroke">
            {Array.from({ length: 9 }, (_, i) => (
              <line key={`V${i}`} x1={((i + 1) * W) / 10} y1={0} x2={((i + 1) * W) / 10} y2={H} />
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <line key={`H${i}`} x1={0} y1={((i + 1) * H) / 8} x2={W} y2={((i + 1) * H) / 8} />
            ))}
          </g>

          {all.map((k, i) => {
            const up = k.c >= k.o;
            const color = up ? "var(--up)" : "var(--down)";
            const x = i * bw + bw / 2;
            const bodyTop = y(Math.max(k.o, k.c));
            const bodyH = Math.max(1.5, Math.abs(y(k.o) - y(k.c)));
            const isForming = i === formingIdx;
            return (
              <g key={k.t} className={isForming ? "animate-blip" : undefined} style={isForming ? { animationDuration: "1.2s" } : undefined}>
                {isForming && (
                  <circle cx={x} cy={y(k.c)} r={5} fill="none" stroke={color} strokeWidth="1.5" className="sonar" />
                )}
                <line x1={x} y1={y(k.h)} x2={x} y2={y(k.l)} stroke={color} strokeWidth={Math.max(1, bw * 0.12)} />
                <rect x={x - bw * 0.32} y={bodyTop} width={bw * 0.64} height={bodyH} fill={color} stroke={isForming ? "var(--ink)" : "none"} strokeWidth={isForming ? 1 : 0} />
              </g>
            );
          })}

          {/* live last-price rule, tagged in the open margin */}
          {formingIdx >= 0 && (
            <g>
              <line x1={0} x2={W} y1={y(all[formingIdx].c)} y2={y(all[formingIdx].c)} stroke="var(--pop)" strokeWidth="1.2" strokeDasharray="6 5" vectorEffect="non-scaling-stroke" className="march" />
              <rect x={W * 0.77} y={y(all[formingIdx].c) - 12} width={fmtPrice(all[formingIdx].c).length * 6.8 + 12} height={22} fill="var(--ink)" rx="3" />
              <text x={W * 0.77 + (fmtPrice(all[formingIdx].c).length * 6.8 + 12) / 2} y={y(all[formingIdx].c) + 3} textAnchor="middle" fontSize="11.5" fontFamily="var(--font-plex-mono)" fontWeight="700" fill="var(--ground)">
                {fmtPrice(all[formingIdx].c)}
              </text>
            </g>
          )}

          {cloud("hi", hiIdx * bw + bw / 2, hi, true, `24H HIGH ${fmtPrice(hi)}`, "var(--rule)", 0, true)}
          {cloud("lo", loIdx * bw + bw / 2, lo, false, `24H LOW ${fmtPrice(lo)}`, "var(--rule)", 0, true)}

          {/* The trade conversation, pinned to its real prices. */}
          {marks.map((m, i) =>
            cloud(
              `${m.t}-${i}`,
              idxOf(m.t) * bw + bw / 2,
              m.price,
              m.above ?? true,
              m.text,
              m.ch ? `var(--ch-${m.ch})` : "var(--rule)",
              m.lane ?? 0,
              false,
              m.id && onMarkClick ? () => onMarkClick(m.id!, m.model) : undefined,
            ),
          )}
        </svg>
      </div>
    </figure>
  );
}
