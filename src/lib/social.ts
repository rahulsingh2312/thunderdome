import { loadJson, saveJson } from "./kv";
import { points } from "./config";

export type SocialUser = {
  code: string;
  points: number;
  refs: number;
  lastClaim: number | null;
  referredBy: string | null;
};

type SocialState = {
  users: Record<string, SocialUser>;
  codes: Record<string, string>;
};

const KEY = "social/state.json";
const EMPTY: SocialState = { users: {}, codes: {} };

const ID_RE = /^[a-f0-9-]{8,40}$/;
const CODE_RE = /^[A-Z2-9]{4,12}$/;

function makeCode(state: SocialState): string {
  const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  for (let tries = 0; tries < 50; tries++) {
    let out = "";
    for (let i = 0; i < 6; i++) out += abc[Math.floor(Math.random() * abc.length)];
    if (!state.codes[out]) return out;
  }
  return `R${Date.now().toString(36).toUpperCase()}`;
}

export function validId(id: unknown): id is string {
  return typeof id === "string" && ID_RE.test(id);
}

/** Ensures the visitor exists; credits a referrer exactly once, on first sight. */
export async function hello(me: string, ref?: string | null) {
  const state = await loadJson(KEY, EMPTY);
  let user = state.users[me];
  let changed = false;

  if (!user) {
    user = { code: makeCode(state), points: 0, refs: 0, lastClaim: null, referredBy: null };
    state.users[me] = user;
    state.codes[user.code] = me;
    changed = true;

    if (typeof ref === "string" && CODE_RE.test(ref)) {
      const referrerId = state.codes[ref];
      if (referrerId && referrerId !== me) {
        state.users[referrerId].points += points.referral;
        state.users[referrerId].refs += 1;
        user.referredBy = ref;
        user.points += points.welcome;
      }
    }
  }

  if (changed) await saveJson(KEY, state);
  return user;
}

/** Daily claim with a cooldown. Returns the user, or null when still cooling. */
export async function claim(me: string) {
  const state = await loadJson(KEY, EMPTY);
  const user = state.users[me];
  if (!user) return null;
  const cooldownMs = points.claimCooldownHours * 3600 * 1000;
  if (user.lastClaim && Date.now() - user.lastClaim < cooldownMs) {
    return { user, claimed: false as const };
  }
  user.points += points.claim;
  user.lastClaim = Date.now();
  await saveJson(KEY, state);
  return { user, claimed: true as const };
}

/** Verified-deposit bonus. */
export async function creditDeposit(me: string) {
  const state = await loadJson(KEY, EMPTY);
  const user = state.users[me];
  if (!user) return;
  user.points += points.deposit;
  await saveJson(KEY, state);
}

/** Top codes by points. Codes only; no invented names. */
export async function board(limit = 10) {
  const state = await loadJson(KEY, EMPTY);
  return Object.values(state.users)
    .filter((u) => u.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, limit)
    .map((u) => ({ code: u.code, points: u.points, refs: u.refs }));
}
