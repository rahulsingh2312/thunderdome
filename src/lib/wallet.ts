"use client";

import { chain, treasury } from "./config";

/** Minimal EIP-1193 surface; no wallet SDK needed for this flow. */
type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, cb: (...a: unknown[]) => void) => void;
  removeListener?: (event: string, cb: (...a: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: Eip1193;
  }
}

const CHAIN_HEX = `0x${chain.id.toString(16)}`;

export function hasWallet(): boolean {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

export async function connect(): Promise<string> {
  const eth = window.ethereum;
  if (!eth) throw new Error("no wallet");
  const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts?.[0]) throw new Error("no account");
  return accounts[0];
}

/** Switches to Robinhood Chain, offering to add it when the wallet lacks it. */
export async function ensureChain(): Promise<void> {
  const eth = window.ethereum;
  if (!eth) throw new Error("no wallet");
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] });
  } catch (err) {
    const code = (err as { code?: number })?.code;
    if (code !== 4902) throw err;
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: CHAIN_HEX,
          chainName: chain.name,
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: [chain.rpc],
          blockExplorerUrls: [chain.explorer],
        },
      ],
    });
  }
}

/** Live balance straight from the public RPC, so it works pre-connect too. */
export async function balanceOf(address: string): Promise<bigint> {
  const res = await fetch(chain.rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [address, "latest"] }),
  });
  const j = (await res.json()) as { result?: string };
  return j.result ? BigInt(j.result) : 0n;
}

export function formatEth(wei: bigint, digits = 4): string {
  const s = wei.toString().padStart(19, "0");
  const whole = s.slice(0, -18) || "0";
  const frac = s.slice(-18).slice(0, digits);
  return `${whole}.${frac}`;
}

export function parseEth(v: string): bigint | null {
  if (!/^\d*\.?\d*$/.test(v) || v === "" || v === ".") return null;
  const [whole = "0", frac = ""] = v.split(".");
  const fracPadded = (frac + "0".repeat(18)).slice(0, 18);
  try {
    return BigInt(whole) * 10n ** 18n + BigInt(fracPadded);
  } catch {
    return null;
  }
}

export async function sendDeposit(from: string, wei: bigint): Promise<`0x${string}`> {
  const eth = window.ethereum;
  if (!eth) throw new Error("no wallet");
  const hash = (await eth.request({
    method: "eth_sendTransaction",
    params: [{ from, to: treasury, value: `0x${wei.toString(16)}` }],
  })) as `0x${string}`;
  return hash;
}

/** Waits for the receipt on the public RPC; the chain is fast, but be patient. */
export async function waitMined(hash: string, tries = 45): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(chain.rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [hash] }),
    });
    const j = (await res.json()) as { result?: { status?: string } | null };
    if (j.result) return j.result.status === "0x1";
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}
