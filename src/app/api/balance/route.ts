import { NextResponse } from "next/server";
import { chain } from "@/lib/config";

export const dynamic = "force-dynamic";

/** Balance proxy: the browser never talks to the RPC directly for reads. */
export async function GET(req: Request) {
  const addr = new URL(req.url).searchParams.get("addr");
  if (!addr || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) {
    return NextResponse.json({ error: "bad address" }, { status: 400 });
  }
  try {
    const res = await fetch(chain.rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [addr] }),
      cache: "no-store",
    });
    const j = (await res.json()) as { result?: { value?: number } };
    if (typeof j.result?.value !== "number") throw new Error("no value");
    return NextResponse.json(
      { lamports: j.result.value },
      { headers: { "cache-control": "public, s-maxage=8, stale-while-revalidate=30" } },
    );
  } catch {
    return NextResponse.json({ error: "rpc unavailable" }, { status: 503 });
  }
}
