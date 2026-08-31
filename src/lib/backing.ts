import { createPublicClient, defineChain, http } from "viem";
import { loadJson, saveJson } from "./kv";
import { chain as chainCfg, treasury } from "./config";
import { channels } from "./models";

export type BackingLedger = {
  /** Every credited tx hash, so a deposit is never counted twice. */
  txs: Record<string, true>;
  /** Wei totals per agent id, as decimal strings. */
  machines: Record<string, { totalWei: string; count: number }>;
};

const KEY = "backing/ledger.json";
const EMPTY: BackingLedger = { txs: {}, machines: {} };

const robinhoodChain = defineChain({
  id: chainCfg.id,
  name: chainCfg.name,
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [chainCfg.rpc] } },
});

const client = createPublicClient({ chain: robinhoodChain, transport: http(chainCfg.rpc) });

export async function ledger(): Promise<BackingLedger> {
  return loadJson(KEY, EMPTY);
}

/**
 * Credits a deposit after proving it on-chain: the tx must be mined, successful,
 * and pay the treasury. Anything unverifiable is rejected, never assumed.
 */
export async function credit(
  txHash: `0x${string}`,
  agentId: string,
): Promise<{ ok: true; wei: string } | { ok: false; reason: string }> {
  if (!channels.some((c) => c.id === agentId)) return { ok: false, reason: "unknown machine" };

  const state = await loadJson(KEY, EMPTY);
  if (state.txs[txHash]) return { ok: false, reason: "already credited" };

  let tx;
  let receipt;
  try {
    [tx, receipt] = await Promise.all([
      client.getTransaction({ hash: txHash }),
      client.getTransactionReceipt({ hash: txHash }),
    ]);
  } catch {
    return { ok: false, reason: "transaction not found yet" };
  }
  if (receipt.status !== "success") return { ok: false, reason: "transaction failed" };
  if (!tx.to || tx.to.toLowerCase() !== treasury.toLowerCase()) {
    return { ok: false, reason: "not a treasury deposit" };
  }
  if (tx.value <= 0n) return { ok: false, reason: "zero value" };

  state.txs[txHash] = true;
  const m = state.machines[agentId] ?? { totalWei: "0", count: 0 };
  m.totalWei = (BigInt(m.totalWei) + tx.value).toString();
  m.count += 1;
  state.machines[agentId] = m;
  await saveJson(KEY, state);
  return { ok: true, wei: tx.value.toString() };
}
