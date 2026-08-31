import { NextResponse } from "next/server";
import { getChainState } from "@/lib/chain";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const state = await getChainState();
  return NextResponse.json(state, {
    headers: { "cache-control": "public, s-maxage=5, stale-while-revalidate=30" },
  });
}
