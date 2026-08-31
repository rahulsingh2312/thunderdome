import { NextResponse } from "next/server";
import { getChainState, type ChainState } from "@/lib/chain";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// One RPC anchor per warm instance per 5 minutes; the client predicts the
// slot forward locally, so freshness beyond this is pointless.
let cached: { state: ChainState; at: number } | null = null;
const TTL = 5 * 60 * 1000;

export async function GET() {
  if (!cached || Date.now() - cached.at > TTL) {
    const state = await getChainState();
    if (state.ok || !cached) cached = { state, at: Date.now() };
  }
  return NextResponse.json(cached.state, {
    headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
