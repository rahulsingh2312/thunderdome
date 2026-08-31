"use client";

/**
 * Set dressing shared outside the 3D room: a dying fluorescent tube and a
 * small vending-machine portrait drawn to match the arcade cabinets.
 */

export function TubeGlow({ tint = "white", className = "" }: { tint?: "white" | "red"; className?: string }) {
  const core = tint === "red" ? "#ffb0a4" : "#eafff0";
  const glow = tint === "red" ? "255,106,85" : "216,255,228";
  return (
    <div aria-hidden className={`pointer-events-none flex justify-center ${className}`}>
      <div
        className="tube-dying h-[5px] w-[min(48vw,240px)] rounded-full"
        style={{
          background: core,
          boxShadow: `0 0 18px 4px rgba(${glow},0.55), 0 0 60px 20px rgba(${glow},0.22)`,
        }}
      />
    </div>
  );
}

export function MiniCabinet({ className = "", hue = "var(--pop)" }: { className?: string; hue?: string }) {
  return (
    <svg viewBox="0 0 120 200" className={className} aria-hidden fill="none">
      {/* marquee */}
      <rect x="10" y="6" width="100" height="22" rx="2" fill="#d8caa0" />
      <rect x="16" y="10" width="88" height="14" rx="1" fill="#050a08" />
      <text
        x="60"
        y="21"
        textAnchor="middle"
        fontFamily="'Chakra Petch', sans-serif"
        fontWeight="700"
        fontSize="11"
        fill={hue}
        style={{ filter: `drop-shadow(0 0 4px ${hue})` }}
      >
        ARENA
        <animate attributeName="opacity" values="1;1;0.25;1;1;1;0.5;1" dur="4.6s" repeatCount="indefinite" calcMode="discrete" />
      </text>
      {/* body */}
      <rect x="14" y="28" width="92" height="128" fill="#d5cba6" />
      <rect x="14" y="52" width="92" height="5" fill="#3a3a30" opacity="0.5" />
      <rect x="14" y="128" width="92" height="4" fill="#3a3a30" opacity="0.4" />
      {/* edge neon */}
      <rect x="15" y="30" width="2.5" height="124" fill={hue} opacity="0.85" />
      <rect x="102.5" y="30" width="2.5" height="124" fill={hue} opacity="0.85">
        <animate attributeName="opacity" values="0.85;0.85;0.2;0.85" dur="3.4s" repeatCount="indefinite" calcMode="discrete" />
      </rect>
      {/* ticker strip */}
      <rect x="24" y="34" width="72" height="8" rx="1" fill="#040a06" />
      <rect x="28" y="37" width="10" height="2" fill={hue} opacity="0.9" />
      <rect x="42" y="37" width="16" height="2" fill={hue} opacity="0.6" />
      <rect x="62" y="37" width="8" height="2" fill={hue} opacity="0.9" />
      <rect x="74" y="37" width="14" height="2" fill={hue} opacity="0.5" />
      {/* screen */}
      <rect x="22" y="48" width="76" height="56" rx="2" fill="#0c1512" />
      <rect x="26" y="52" width="68" height="48" rx="1" fill="#2f3d2b" />
      <polyline
        points="30,88 38,80 46,84 54,70 62,76 70,64 78,70 86,60"
        stroke={hue}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${hue})` }}
      >
        <animate attributeName="opacity" values="1;1;1;0.3;1" dur="5.2s" repeatCount="indefinite" calcMode="discrete" />
      </polyline>
      <circle cx="86" cy="60" r="3" fill={hue} />
      {/* deck, joystick, buttons */}
      <rect x="16" y="106" width="88" height="12" rx="2" fill="#c9bc90" />
      <rect x="34" y="96" width="2.5" height="12" fill="#101a17" />
      <circle cx="35" cy="94" r="5" fill="#d6402b" />
      <circle cx="62" cy="112" r="4" fill="#c23a2b" />
      <circle cx="76" cy="112" r="4" fill="#c23a2b" />
      {/* graffiti tag */}
      <text
        x="60"
        y="146"
        textAnchor="middle"
        fontFamily="'Chakra Petch', sans-serif"
        fontStyle="italic"
        fontWeight="700"
        fontSize="10"
        fill="#ff5ca8"
        opacity="0.75"
        transform="rotate(-4 60 146)"
      >
        WAGMI
      </text>
      {/* plinth */}
      <rect x="12" y="156" width="96" height="26" rx="2" fill="#23251f" />
      <rect x="26" y="162" width="68" height="2.5" fill="#060b09" />
      <rect x="26" y="168" width="68" height="2.5" fill="#060b09" />
      <rect x="26" y="174" width="68" height="2.5" fill="#060b09" />
      {/* floor glow */}
      <ellipse cx="60" cy="188" rx="44" ry="6" fill={hue} opacity="0.14" />
    </svg>
  );
}
