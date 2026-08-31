import { ImageResponse } from "next/og";
import { site } from "@/lib/config";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${site.name}: six model traces on one graticule`;

const CH = ["#6B9BFF", "#A97CFF", "#FF70A8", "#FFA03D", "#35C9E8", "#FFD23D"];

/** Deterministic sample traces. This is the mark, not a claim about performance. */
function trace(seed: number) {
  let v = 0;
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    v += Math.sin(i * 0.55 + seed * 2.1) * 2.4 + Math.cos(i * 0.23 + seed) * 1.6;
    const x = 60 + (i / 40) * 1080;
    const y = 400 - v * 3.2;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${Math.max(250, Math.min(520, y)).toFixed(1)}`);
  }
  return pts.join(" ");
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0E0D0C",
          padding: "56px 60px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg width="36" height="36" viewBox="0 0 32 32">
              <path d="M3 25 A13 13 0 0 1 29 25" fill="none" stroke="#FF5A36" strokeWidth="3" strokeLinecap="round" />
              <path d="M17.5 7 L11 18 h4.5 L14 26 l7-11 h-4.5z" fill="#FF5A36" />
            </svg>
            <div style={{ color: "#F7F3EC", fontSize: 30, letterSpacing: 4, fontWeight: 700 }}>
              THUNDERDOME
            </div>
          </div>
          <div style={{ color: "#F7F3EC", fontSize: 62, lineHeight: 1.05, maxWidth: 900, fontWeight: 700 }}>
            Six models enter. One allocation leaves.
          </div>
        </div>

        <svg width="1080" height="300" viewBox="0 0 1200 630" style={{ position: "absolute", left: 0, top: 165 }}>
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`v${i}`} x1={60 + (i * 1080) / 8} y1={250} x2={60 + (i * 1080) / 8} y2={520} stroke="#2E2A25" strokeWidth="1" />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <line key={`h${i}`} x1={60} y1={250 + (i * 270) / 4} x2={1140} y2={250 + (i * 270) / 4} stroke="#2E2A25" strokeWidth="1" />
          ))}
          {CH.map((c, i) => (
            <path key={c} d={trace(i)} fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.95" />
          ))}
        </svg>

        <div style={{ display: "flex", alignItems: "center", gap: 20, color: "#B8B0A4", fontSize: 22 }}>
          <div>Same capital. Same data. Same rules.</div>
          <div style={{ color: "#FF5A36" }}>Robinhood Chain · 4663</div>
        </div>
      </div>
    ),
    size,
  );
}
