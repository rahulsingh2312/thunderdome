"use client";

import { useUI } from "./providers";
import { Ago } from "./relative-time";
import { Lamp, Warning } from "./icons";
import { launch } from "@/lib/config";
import { money, percent, price } from "@/lib/format";

export type BoardRow = {
  id: string;
  label: string;
  maker: string;
  ch: number;
  logo: string;
  equity: number;
  ret: number;
  positionsText: string;
  lastDecisionAt: number | null;
};

function Delta({ ratio }: { ratio: number }) {
  const color = ratio === 0 ? "var(--ink-2)" : ratio > 0 ? "var(--up)" : "var(--down)";
  return (
    <span className="data tabular-nums" style={{ color }}>
      {percent(ratio)}
    </span>
  );
}

export function Board({ rows, armed, startingCapital }: { rows: BoardRow[]; armed: boolean; startingCapital: number }) {
  const { t } = useUI();

  return (
    <section id="board" className="scroll-mt-24 py-14 sm:py-20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="display text-[clamp(1.8rem,4.5vw,2.8rem)]">{t("board.h")}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="label inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[11px]"
            style={{
              color: armed ? "var(--up)" : "var(--pop)",
              borderColor: "var(--rule)",
              borderRadius: "var(--r)",
            }}
          >
            {armed ? <Lamp size={8} className="animate-blip" /> : <Warning size={11} />}
            {armed ? t("state.armed") : t("state.unarmed")}
          </span>
          {!launch.deskFunded && (
            <span
              className="label inline-flex items-center border px-2.5 py-1.5 text-[11px] text-ink-2"
              style={{ borderColor: "var(--rule)", borderRadius: "var(--r)" }}
            >
              {t("state.paper")}
            </span>
          )}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <caption className="sr-only">
            Arena standings, ranked by equity against {money(startingCapital)} of{" "}
            {launch.capitalLabel} capital
          </caption>
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--rule)" }}>
              {[t("col.rank"), t("col.model"), t("col.equity"), t("col.return"), t("col.positions"), t("col.last")].map(
                (h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`label px-3 py-3 text-[11px] text-ink-3 ${i > 1 ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.id}
                className="border-b transition-colors duration-150 last:border-0 hover:bg-[var(--ground-2)]"
                style={{ borderColor: "var(--rule-soft)" }}
              >
                <td className="px-3 py-3">
                  <span
                    className="data inline-flex h-8 w-8 items-center justify-center border text-[13px] tabular-nums"
                    style={
                      i === 0
                        ? { color: "var(--pop)", borderColor: "var(--pop)", boxShadow: "0 0 14px -4px var(--pop)", borderRadius: "var(--r)" }
                        : { color: "var(--ink-3)", borderColor: "var(--rule)", borderRadius: "var(--r)" }
                    }
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] border"
                      style={{
                        borderColor: `color-mix(in srgb, var(--ch-${r.ch}) 55%, transparent)`,
                        background: "var(--ground-2)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.logo} alt={`${r.maker} logo`} width={22} height={22} className="h-[22px] w-[22px] object-contain" />
                    </span>
                    <div className="min-w-0">
                      <div className="label truncate text-[13px]">{r.label}</div>
                      <div className="truncate text-[12px] text-ink-3">{r.maker}</div>
                    </div>
                  </div>
                </td>
                <td className="data px-3 py-3 text-right text-[14px] tabular-nums">{money(r.equity, true)}</td>
                <td className="px-3 py-3 text-right text-[14px]">
                  <Delta ratio={r.ret} />
                </td>
                <td className="data px-3 py-3 text-right text-[13px] tabular-nums text-ink-2">{r.positionsText}</td>
                <td className="data px-3 py-3 text-right text-[12px] tabular-nums text-ink-3">
                  <Ago at={r.lastDecisionAt} fallback="not yet" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-ink-3">{t("board.note")}</p>
    </section>
  );
}
