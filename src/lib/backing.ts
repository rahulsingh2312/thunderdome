import { loadJson, saveJson } from "./kv";
import { chain, treasury } from "./config";
import { channels } from "./models";

export type BackingLedger = {
  /** Every credited signature, so a deposit is never counted twice. */
  txs: Record<string, true>;
  /** Lamport totals per agent id, as decimal strings. */
  machines: Record<string, { totalLamports: string; count: number }>;
};

const KEY = "backing/ledger-sol.json";
const EMPTY: BackingLedger = { txs: {}, machines: {} };

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(chain.rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`rpc ${method} responded ${res.status}`);
  const j = (await res.json()) as { result?: T; error?: { message?: string } };
  if (j.error) throw new Error(j.error.message ?? `rpc ${method} failed`);
  return j.result as T;
}

export async function ledger(): Promise<BackingLedger> {
  return loadJson(KEY, EMPTY);
}

type ParsedTx = {
  meta: { err: unknown; preBalances: number[]; postBalances: number[] } | null;
  transaction: { message: { accountKeys: { pubkey: string }[] } };
} | null;

/**
 * Credits a deposit after proving it on-chain: the transaction must exist,
 * have succeeded, and have increased the treasury's lamport balance.
 * Anything unverifiable is rejected, never assumed.
 */
export async function credit(
  signature: string,
  agentId: string,
): Promise<{ ok: true; lamports: string } | { ok: false; reason: string }> {
  if (!channels.some((c) => c.id === agentId)) return { ok: false, reason: "unknown machine" };

  const state = await loadJson(KEY, EMPTY);
  if (state.txs[signature]) return { ok: false, reason: "already credited" };

  let tx: ParsedTx;
  try {
    tx = await rpc<ParsedTx>("getTransaction", [
      signature,
      { maxSupportedTransactionVersion: 0, encoding: "jsonParsed", commitment: "confirmed" },
    ]);
  } catch {
    return { ok: false, reason: "transaction not found yet" };
  }
  if (!tx || !tx.meta) return { ok: false, reason: "transaction not found yet" };
  if (tx.meta.err != null) return { ok: false, reason: "transaction failed" };

  const idx = tx.transaction.message.accountKeys.findIndex((k) => k.pubkey === treasury);
  if (idx === -1) return { ok: false, reason: "not a treasury deposit" };
  const credited = (tx.meta.postBalances[idx] ?? 0) - (tx.meta.preBalances[idx] ?? 0);
  if (credited <= 0) return { ok: false, reason: "zero value" };

  state.txs[signature] = true;
  const m = state.machines[agentId] ?? { totalLamports: "0", count: 0 };
  m.totalLamports = (BigInt(m.totalLamports) + BigInt(credited)).toString();
  m.count += 1;
  state.machines[agentId] = m;
  await saveJson(KEY, state);
  return { ok: true, lamports: credited.toString() };
}
