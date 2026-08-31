/**
 * One formatter per kind of number, shared everywhere.
 * Never re-round an API value for display beyond these.
 */

const nf = (opts: Intl.NumberFormatOptions) => new Intl.NumberFormat("en-US", opts);

const usd0 = nf({ style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = nf({ style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct2 = nf({ style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: "exceptZero" });
const int0 = nf({ maximumFractionDigits: 0 });

export const money = (v: number, cents = false) => (cents ? usd2 : usd0).format(v);

/** Takes a ratio (0.184), renders "+18.40%". */
export const percent = (ratio: number) => pct2.format(ratio);

export const integer = (v: number) => int0.format(v);

/**
 * Compact, and honest about it: 987_400 is "987.4K", never "1.0M".
 * Truncates toward zero at the unit boundary rather than rounding up across it.
 */
export function compact(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  const units: [number, string][] = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [size, suffix] of units) {
    if (abs >= size) {
      const scaled = Math.floor((abs / size) * 10) / 10;
      return `${sign}${scaled}${suffix}`;
    }
  }
  return `${sign}${int0.format(abs)}`;
}

/** Price precision follows the instrument, not a global default. */
export function price(v: number, symbol?: string): string {
  const digits = v >= 1000 ? 2 : v >= 1 ? 3 : 5;
  return nf({
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v);
}

/** Middle ellipsis, for addresses and hashes on narrow screens. */
export function truncateMiddle(s: string, head = 6, tail = 4): string {
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export function agoShort(ms: number): string {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export const clockUTC = (ms: number) =>
  new Date(ms).toLocaleTimeString("en-GB", { hour12: false, timeZone: "UTC" });
