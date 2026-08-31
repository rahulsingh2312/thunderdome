import { NextResponse } from "next/server";
import { board, claim, hello, validId } from "@/lib/social";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ board: await board() });
}

export async function POST(req: Request) {
  let body: { action?: string; me?: unknown; ref?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!validId(body.me)) return NextResponse.json({ error: "bad id" }, { status: 400 });

  if (body.action === "hello") {
    const user = await hello(body.me, typeof body.ref === "string" ? body.ref : null);
    return NextResponse.json({ user });
  }
  if (body.action === "claim") {
    const result = await claim(body.me);
    if (!result) return NextResponse.json({ error: "unknown user" }, { status: 404 });
    return NextResponse.json(result);
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
