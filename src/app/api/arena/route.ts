import { NextResponse } from "next/server";
import { readArena } from "@/lib/engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const view = await readArena();
    return NextResponse.json(view, {
      headers: { "cache-control": "public, s-maxage=10, stale-while-revalidate=60" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "arena unavailable" },
      { status: 503 },
    );
  }
}
