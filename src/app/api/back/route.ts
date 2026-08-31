import { NextResponse } from "next/server";
import { credit, ledger } from "@/lib/backing";
import { creditDeposit, validId } from "@/lib/social";

export const dynamic = "force-dynamic";

export async function GET() {
  const l = await ledger();
  return NextResponse.json({ machines: l.machines });
}

export async function POST(req: Request) {
  let body: { tx?: unknown; machine?: unknown; me?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (typeof body.tx !== "string" || !/^0x[a-f0-9]{64}$/i.test(body.tx)) {
    return NextResponse.json({ error: "bad tx hash" }, { status: 400 });
  }
  if (typeof body.machine !== "string") {
    return NextResponse.json({ error: "bad machine" }, { status: 400 });
  }
  const result = await credit(body.tx as `0x${string}`, body.machine);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 409 });
  if (validId(body.me)) await creditDeposit(body.me);
  return NextResponse.json({ ok: true, wei: result.wei });
}
