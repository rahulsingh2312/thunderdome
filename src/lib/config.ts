/**
 * Every URL, price, address, and contact detail lives here.
 * Launch day is an edit to this file, never a grep across components.
 */

export const site = {
  name: "Robinhood Arena",
  ticker: "DOME",
  tagline: "Six agents. One arcade. Live markets.",
  description:
    "Six AI agents trade live markets from six arcade machines. Walk up, watch them think, back the one you believe in when $DOME launches.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://thunderdome-nu.vercel.app",
  locale: "en",
} as const;

/**
 * Launch state. Every claim on the site reads from here.
 * Nothing is described as live until the matching flag says it is.
 */
export const launch = {
  /** $DOME is not deployed. No address, price, market cap or supply exists yet. */
  tokenLive: false,
  /** The desk holds no real capital until token fees accrue. */
  deskFunded: false,
  /** The arena runs. Real prices, real model decisions, paper capital. */
  arenaLive: true,
  /** Shown wherever a number could be mistaken for real money. */
  capitalLabel: "paper",
  /** Starting capital per model, in USD. Identical for every channel. */
  startingCapital: 10_000,
  /** Set when the token deploys. Until then the UI shows the roadmap. */
  tokenAddress: null as string | null,
  chainId: 4663,
} as const;

export const chain = {
  id: 4663,
  name: "Robinhood Chain",
  shortName: "robinhood",
  currency: "ETH",
  rpc: process.env.ROBINHOOD_RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com",
  explorer: "https://robinhoodchain.blockscout.com",
  docs: "https://docs.robinhood.com/chain/connecting",
} as const;

export const sources = {
  /** Keyless. Mark prices for every perp market. */
  hyperliquid: "https://api.hyperliquid.xyz/info",
  /** Keyless. Independent spot reference, used to cross-check marks. */
  coinbase: "https://api.coinbase.com/v2/prices",
} as const;

/** Markets the desk is allowed to trade. Shared by the engine and the UI. */
export const universe = ["BTC", "ETH", "SOL"] as const;
export type Symbol_ = (typeof universe)[number];

/** Arena treasury on Robinhood Chain. Deposits from the machines land here. */
export const treasury = (process.env.NEXT_PUBLIC_TREASURY_ADDRESS ??
  "0xD1Aae052137Eed0E730ae6450795FAc3212faC34") as `0x${string}`;

export const points = {
  /** Credited to the referrer when a new visitor arrives on their link. */
  referral: 250,
  /** Credited to the new visitor who arrived on a link. */
  welcome: 50,
  /** Daily claim, one per cooldown. */
  claim: 100,
  claimCooldownHours: 20,
  /** Credited per verified on-chain deposit. */
  deposit: 500,
} as const;

export const links = {
  x: "https://x.com/thunderdomedesk",
  github: "https://github.com/rahulsingh2312/thunderdome",
  support: "mailto:hello@thunderdome.trade",
  privacy: "/privacy",
  terms: "/terms",
} as const;

/** Links that are not maintained yet are absent, not dead. */
export const unmaintained = ["discord", "telegram"] as const;

export const cadence = {
  /**
   * How often the desk re-decides. There is no scheduler: /api/cron/tick is
   * triggered by hand. Staleness is derived from this, so it stays generous
   * rather than badging a hand-driven arena as broken.
   */
  tickSeconds: Number(process.env.NEXT_PUBLIC_TICK_SECONDS ?? 86_400),
  /** How often the browser re-reads arena state. */
  pollSeconds: 20,
  /** A quote older than this is shown as stale, holding its last real value. */
  staleAfterSeconds: 90,
} as const;
