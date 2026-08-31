/**
 * One authored set, drawn on a single 1.5 stroke at 24px. No emoji, no unicode
 * glyphs standing in for a mark. Motifs come from the bench and from archery.
 */
type P = { className?: string; size?: number; style?: React.CSSProperties };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
});

export const Knob = ({ className, size = 20, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <circle cx="12" cy="12" r="7.5" />
    <path d="M12 4.5v3" />
    <path d="M6.7 6.7l2.1 2.1M17.3 6.7l-2.1 2.1" />
  </svg>
);

export const Probe = ({ className, size = 20, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M4 20l6-6" />
    <path d="M9 13l2 2" />
    <path d="M13.5 4.5l6 6-4 4-6-6z" />
  </svg>
);

export const Lamp = ({ className, size = 20, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="8" opacity="0.4" />
  </svg>
);

/** The dome, with a bolt through it. Thunderdome's mark. */
export const Fletch = ({ className, size = 20, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M3 20a9 9 0 0 1 18 0" />
    <path d="M13.2 5.5 8.5 13.5h3.4L10.8 20l4.9-8.2h-3.4z" fill="currentColor" stroke="none" />
  </svg>
);

export const ArrowRight = ({ className, size = 20, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M4 12h15" />
    <path d="M13 6l6 6-6 6" />
  </svg>
);

export const ArrowDown = ({ className, size = 20, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M12 4v15" />
    <path d="M6 13l6 6 6-6" />
  </svg>
);

export const Chevron = ({ className, size = 20, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M8 5l7 7-7 7" />
  </svg>
);

export const External = ({ className, size = 20, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M13 4h7v7" />
    <path d="M20 4l-9 9" />
    <path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
  </svg>
);

export const Sun = ({ className, size = 20, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const Moon = ({ className, size = 20, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />
  </svg>
);

export const Monitor = ({ className, size = 20, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <rect x="3" y="4" width="18" height="12" rx="1.5" />
    <path d="M8 20h8M12 16v4" />
  </svg>
);

export const Globe = ({ className, size = 20, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17" />
    <path d="M12 3.5c2.2 2.4 3.3 5.3 3.3 8.5s-1.1 6.1-3.3 8.5c-2.2-2.4-3.3-5.3-3.3-8.5S9.8 5.9 12 3.5z" />
  </svg>
);

export const Warning = ({ className, size = 20, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M12 4.5l8 14H4l8-14z" />
    <path d="M12 10v4" />
    <path d="M12 16.8v.2" />
  </svg>
);

export const Check = ({ className, size = 20, style }: P) => (
  <svg {...base(size)} className={className} style={style}>
    <path d="M4.5 12.5l5 5 10-11" />
  </svg>
);
