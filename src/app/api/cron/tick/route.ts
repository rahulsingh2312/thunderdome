import { NextResponse } from "next/server";
import { tick } from "@/lib/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Advances the arena one round. Vercel Cron sends the CRON_SECRET as a bearer
 * token; when no secret is configured the route stays open only in development.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }

  try {
    const { decided, skipped, state } = await tick();
    return NextResponse.json({ ok: true, decided, skipped, lastTick: state.lastTick });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "tick failed" },
      { status: 500 },
    );
  }
}
