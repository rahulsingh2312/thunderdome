import { NextResponse } from "next/server";
import { getCandles } from "@/lib/markets";
import { universe, type Symbol_ } from "@/lib/config";

export const dynamic = "force-dynamic";

/** Seed data for the live market chart: real closes, one series per symbol. */
export async function GET() {
  const out: Record<string, { t: number; o: number; h: number; l: number; c: number }[]> = {};
  await Promise.all(
    universe.map(async (s: Symbol_) => {
      const candles = await getCandles(s, "1m", 24);
      out[s] = candles.map((k) => ({ t: k.t, o: k.o, h: k.h, l: k.l, c: k.c }));
    }),
  );
  return NextResponse.json(out, {
    headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
