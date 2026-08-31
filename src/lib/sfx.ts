/**
 * Synthesized arcade sound kit. Everything is generated in Web Audio, no
 * files, no network. The context unlocks on the first user gesture; every
 * call before that is a silent no-op. Master volume stays polite.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let enabled = true;

export function sfxEnabled() {
  return enabled;
}

export function setSfxEnabled(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem("sfx", on ? "1" : "0");
  } catch {}
  if (master) master.gain.value = on ? 0.16 : 0;
}

export function initSfx() {
  if (ctx) {
    if (ctx.state === "suspended") void ctx.resume();
    return;
  }
  try {
    enabled = localStorage.getItem("sfx") !== "0";
  } catch {}
  try {
    ctx = new AudioContext();
  } catch {
    return;
  }
  master = ctx.createGain();
  master.gain.value = enabled ? 0.16 : 0;
  master.connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

function tone(
  freq: number,
  opts: { type?: OscillatorType; dur?: number; gain?: number; to?: number; delay?: number } = {},
) {
  if (!ctx || !master || !enabled) return;
  const { type = "sine", dur = 0.12, gain = 1, to, delay = 0 } = opts;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(opts: { dur?: number; gain?: number; hp?: number; lp?: number; delay?: number } = {}) {
  if (!ctx || !master || !noiseBuf || !enabled) return;
  const { dur = 0.15, gain = 0.5, hp, lp, delay = 0 } = opts;
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node: AudioNode = src;
  if (hp) {
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = hp;
    node.connect(f);
    node = f;
  }
  if (lp) {
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = lp;
    node.connect(f);
    node = f;
  }
  node.connect(g).connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

/* Rate limiter so loops can call freely without machine-gunning the mix. */
const last: Record<string, number> = {};
function gate(key: string, ms: number): boolean {
  const now = performance.now();
  if (now - (last[key] ?? 0) < ms) return false;
  last[key] = now;
  return true;
}

export const sfx = {
  /** Pointer crosses onto a machine. */
  hover() {
    if (!gate("hover", 90)) return;
    tone(620, { type: "square", dur: 0.05, gain: 0.25, to: 780 });
  },
  /** Machine chosen: whoosh in, then the coin drop. */
  select() {
    noise({ dur: 0.28, gain: 0.3, lp: 900 });
    tone(300, { type: "sawtooth", dur: 0.3, gain: 0.25, to: 110 });
    tone(988, { dur: 0.09, gain: 0.5, delay: 0.16 });
    tone(1319, { dur: 0.14, gain: 0.5, delay: 0.24 });
  },
  /** Panel dismissed. */
  close() {
    tone(240, { type: "sawtooth", dur: 0.14, gain: 0.3, to: 90 });
  },
  /** A cabinet wakes: breaker thump plus tube ping. */
  powerOn(i = 0) {
    tone(72, { dur: 0.35, gain: 0.9, to: 38 });
    tone(1180 + i * 60, { dur: 0.25, gain: 0.14, delay: 0.06 });
  },
  /** Sparks off the broken wiring. */
  crackle() {
    if (!gate("crackle", 700)) return;
    noise({ dur: 0.1, gain: 0.28, hp: 2600 });
    noise({ dur: 0.05, gain: 0.22, hp: 3600, delay: 0.07 });
  },
  /** Corner held: the room complains. */
  quake() {
    if (!gate("quake", 380)) return;
    noise({ dur: 0.3, gain: 0.5, lp: 240 });
    tone(55, { dur: 0.3, gain: 0.5, to: 42 });
  },
  /** The red conduit takes the room. */
  buzz() {
    if (!gate("buzz", 2500)) return;
    tone(120, { type: "sawtooth", dur: 0.5, gain: 0.16 });
    tone(240, { type: "square", dur: 0.5, gain: 0.07 });
  },
  /** Money confirmed on chain / points claimed: coins cascade. */
  coins() {
    [988, 1319, 1568, 2093].forEach((f, k) => tone(f, { dur: 0.12, gain: 0.5, delay: k * 0.07 }));
  },
};
