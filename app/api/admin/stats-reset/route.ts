import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";

export const dynamic = "force-dynamic";

/**
 * Clears the global stats (every guess and score), for a clean start at launch.
 * Preview only. ?confirm=1 does it; without it, this only counts what would go.
 */
export async function GET(req: Request) {
  if (!pipelineEnabled()) return denied();
  const { q, ready } = sql();
  await ready;
  const [g] = await q`SELECT count(*)::int AS n FROM guesses`;
  const [s] = await q`SELECT count(*)::int AS n FROM scores`;
  if (new URL(req.url).searchParams.get("confirm") !== "1") return NextResponse.json({ guesses: g.n, scores: s.n, cleared: false });
  await q`DELETE FROM guesses`;
  await q`DELETE FROM scores`;
  return NextResponse.json({ guesses: g.n, scores: s.n, cleared: true });
}
