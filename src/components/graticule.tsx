"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { money, percent, clockUTC } from "@/lib/format";

export type Series = {
  id: string;
  label: string;
  ch: number;
  points: { t: number; e: number }[];
};

const W = 1000;
const H = 420;
const DIV_X = 10;
const DIV_Y = 8;

type Props = {
  series: Series[];
  startingCapital: number;
  /** Window in hours. null means everything recorded so far. */
  windowHours: number | null;
  /** Ids drawn at full strength. Others dim. Empty means all at full strength. */
  focus?: string[];
  /** Runs the sweep once on mount. */
  animate?: boolean;
  /** Shown on the screen when no channel has moved yet. */
  standby?: { title: string; body: string };
  className?: string;
  ariaLabel: string;
};

function niceDomain(min: number, max: number, anchor: number) {
  let lo = Math.min(min, anchor);
  let hi = Math.max(max, anchor);
  if (hi - lo < 1e-9) {
    lo = anchor * 0.995;
    hi = anchor * 1.005;
  }
  const pad = (hi - lo) * 0.12;
  return [lo - pad, hi + pad] as const;
}

export function Graticule({
  series,
  startingCapital,
  windowHours,
  focus = [],
  animate = true,
  className,
  ariaLabel,
  standby,
}: Props) {
  const uid = useId().replace(/[:]/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const windowed = useMemo(() => {
    if (windowHours == null) return series;
    const cutoff = Date.now() - windowHours * 3600 * 1000;
    return series.map((s) => {
      const inWindow = s.points.filter((p) => p.t >= cutoff);
      return { ...s, points: inWindow.length >= 2 ? inWindow : s.points.slice(-2) };
    });
  }, [series, windowHours]);

  const geom = useMemo(() => {
    const all = windowed.flatMap((s) => s.points);
    if (all.length < 2) return null;

    const t0 = Math.min(...all.map((p) => p.t));
    const t1 = Math.max(...all.map((p) => p.t));
    const [e0, e1] = niceDomain(
      Math.min(...all.map((p) => p.e)),
      Math.max(...all.map((p) => p.e)),
      startingCapital,
    );

    const spanT = Math.max(1, t1 - t0);
    const spanE = Math.max(1e-9, e1 - e0);
    const x = (t: number) => ((t - t0) / spanT) * W;
    const y = (e: number) => H - ((e - e0) / spanE) * H;

    return {
      t0,
      t1,
      x,
      y,
      zeroY: y(startingCapital),
      paths: windowed.map((s) => ({
        ...s,
        d: s.points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t).toFixed(2)},${y(p.e).toFixed(2)}`).join(" "),
        last: s.points[s.points.length - 1],
      })),
    };
  }, [windowed, startingCapital]);

  // Measure each path so the sweep uses its real length rather than a guess.
  const [lengths, setLengths] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!geom || !svgRef.current) return;
    const next: Record<string, number> = {};
    for (const p of geom.paths) {
      const el = svgRef.current.querySelector<SVGPathElement>(`[data-trace="${p.id}"]`);
      if (el) next[p.id] = el.getTotalLength();
    }
    setLengths(next);
  }, [geom]);

  /** A flat line at starting capital is real, but it is not yet a signal. */
  const hasSignal = useMemo(() => {
    const all = windowed.flatMap((s) => s.points.map((p) => p.e));
    if (all.length < 2) return false;
    return Math.max(...all) - Math.min(...all) > 1e-6;
  }, [windowed]);

  const readout = useMemo(() => {
    if (!geom || hoverX == null) return null;
    const t = geom.t0 + (hoverX / W) * (geom.t1 - geom.t0);
    const rows = geom.paths
      .map((s) => {
        let best = s.points[0];
        for (const p of s.points) if (Math.abs(p.t - t) < Math.abs(best.t - t)) best = p;
        return { id: s.id, label: s.label, ch: s.ch, e: best.e, t: best.t };
      })
      .sort((a, b) => b.e - a.e);
    return { t, rows };
  }, [geom, hoverX]);

  const showStandby = Boolean(standby) && !hasSignal;

  const onMove = (ev: React.PointerEvent<SVGSVGElement>) => {
    const rect = ev.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    setHoverX(Math.max(0, Math.min(W, ((ev.clientX - rect.left) / rect.width) * W)));
  };

  return (
    <figure className={className}>
      <div className="well relative h-full w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={ariaLabel}
          className="block h-full w-full touch-pan-y"
          onPointerMove={onMove}
          onPointerLeave={() => setHoverX(null)}
        >
          {/* Etched graticule. Drawn into the panel, never floating above it. */}
          <g stroke="var(--rule-soft)" strokeWidth="1" vectorEffect="non-scaling-stroke">
            {Array.from({ length: DIV_X - 1 }, (_, i) => (
              <line key={`v${i}`} x1={((i + 1) * W) / DIV_X} y1={0} x2={((i + 1) * W) / DIV_X} y2={H} />
            ))}
            {Array.from({ length: DIV_Y - 1 }, (_, i) => (
              <line key={`h${i}`} x1={0} y1={((i + 1) * H) / DIV_Y} x2={W} y2={((i + 1) * H) / DIV_Y} />
            ))}
          </g>

          {geom && (
            <>
              {/* The zero line is the starting capital. Above it is profit. */}
              {!showStandby && <line
                x1={0}
                y1={geom.zeroY}
                x2={W}
                y2={geom.zeroY}
                stroke="var(--rule)"
                strokeWidth="1.5"
                strokeDasharray="6 5"
                vectorEffect="non-scaling-stroke"
              />}

              {!showStandby && geom.paths.map((p, i) => {
                const dim = focus.length > 0 && !focus.includes(p.id);
                const len = lengths[p.id];
                return (
                  <path
                    key={p.id}
                    data-trace={p.id}
                    d={p.d}
                    fill="none"
                    stroke={`var(--ch-${p.ch})`}
                    strokeWidth={dim ? 2 : 3.25}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    opacity={dim ? 0.28 : 1}
                    className={`trace ${animate && len ? "trace-sweep" : ""}`}
                    style={
                      animate && len
                        ? ({
                            "--len": len,
                            strokeDasharray: len,
                            animation: `sweep 1.1s cubic-bezier(0.16,1,0.3,1) ${i * 0.09}s both`,
                          } as React.CSSProperties)
                        : undefined
                    }
                  />
                );
              })}

              {/* Leading edge: where the phosphor is brightest. */}
              {!showStandby && geom.paths.map((p) => {
                const dim = focus.length > 0 && !focus.includes(p.id);
                return (
                  <circle
                    key={`head-${p.id}`}
                    cx={geom.x(p.last.t)}
                    cy={geom.y(p.last.e)}
                    r={dim ? 3 : 5.5}
                    fill={`var(--ch-${p.ch})`}
                    opacity={dim ? 0.3 : 1}
                    className="trace"
                  />
                );
              })}

              {hoverX != null && (
                <line
                  x1={hoverX}
                  y1={0}
                  x2={hoverX}
                  y2={H}
                  stroke="var(--pop)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.7"
                />
              )}
            </>
          )}
        </svg>

        {(showStandby || !geom) && (
          <div className="absolute inset-0 grid place-items-center px-6">
            <div className="max-w-[46ch] text-center">
              <p className="display text-[clamp(1.5rem,4vw,2.6rem)]">
                {standby?.title ?? ariaLabel}
              </p>
              {standby?.body && (
                <p className="measure mx-auto mt-3 text-[15px] leading-relaxed text-ink-2">{standby.body}</p>
              )}
              <ul className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2">
                {series.map((s) => (
                  <li key={s.id} className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="h-3.5 w-3.5 rounded-[3px] border-2 border-[var(--rule)]"
                      style={{ background: `var(--ch-${s.ch})` }}
                    />
                    <span className="label text-[11px] text-ink-2">{s.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {readout && !showStandby && (
          <div
            className="card pointer-events-none absolute top-2 z-10 hidden min-w-[188px] p-2 sm:block"
            style={{
              left: `clamp(8px, calc(${(readout.t ? (hoverX! / W) * 100 : 0).toFixed(2)}% + 12px), calc(100% - 200px))`,
            }}
          >
            <div className="label mb-1.5 text-[10px] text-ink-3">
              {clockUTC(readout.t)} UTC
            </div>
            <dl className="space-y-1">
              {readout.rows.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="h-3 w-3 shrink-0 rounded-[2px]"
                    style={{ background: `var(--ch-${r.ch})` }}
                  />
                  <dt className="label flex-1 text-[10px] text-ink-2">{r.label}</dt>
                  <dd className="data text-[11px] tabular-nums">
                    {money(r.e, true)}
                    <span
                      className="ml-1.5"
                      style={{ color: r.e >= startingCapital ? "var(--up)" : "var(--down)" }}
                    >
                      {percent(r.e / startingCapital - 1)}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </figure>
  );
}
