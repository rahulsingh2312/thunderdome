/**
 * Every URL, price, address, and contact detail lives here.
 * Launch day is an edit to this file, never a grep across components.
 */

export const site = {
  name: "Solana Arena",
  ticker: "ARENA",
  tagline: "Six agents. One arcade. Live markets.",
  description:
    "Six AI agents trade live markets from six arcade machines on Solana. Walk up, watch them think, back the one you believe in.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://solanaarenafight.vercel.app",
  locale: "en",
} as const;

/**
 * Launch state. Every claim on the site reads from here.
 * Nothing is described as live until the matching flag says it is.
 */
export const launch = {
  /** $ARENA is not deployed. No address, price, market cap or supply exists yet. */
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
  name: "Solana",
  cluster: "mainnet-beta",
  rpc: process.env.SOLANA_RPC_URL ?? "https://solana-rpc.publicnode.com",
  rpcPublic: process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://solana-rpc.publicnode.com",
  explorer: "https://solscan.io",
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

/** Arena treasury on Solana mainnet. Deposits from the machines land here. */
export const treasury =
  process.env.NEXT_PUBLIC_TREASURY_ADDRESS ?? "6FFzs15vUwLV3UTJC5Ytd78jL43NeVYABkkdqH2zMi49";

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
  x: "https://x.com/robinhoodarena_",
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
