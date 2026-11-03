import { NextResponse } from "next/server";
import { sql, statsEnabled } from "@/lib/db";
import { DAYS, dayFor, puzzleNoFor } from "@/lib/puzzles";

export const dynamic = "force-dynamic";

const DEVICE = /^[a-z0-9-]{16,40}$/i;
const ROUND_IDS = new Set(DAYS.flatMap((d) => d.rounds.map((r) => r.id)));

/** How everyone did on one puzzle: ?no=12 */
export async function GET(req: Request) {
  if (!statsEnabled) return NextResponse.json({ enabled: false });
  const no = Number(new URL(req.url).searchParams.get("no"));
  if (!Number.isInteger(no) || no < 1) return NextResponse.json({ error: "bad no" }, { status: 400 });
  const ids = dayFor(no).rounds.map((r) => r.id);
  const { q, ready } = sql();
  await ready;
  const [rounds, scores] = await Promise.all([
    q`SELECT round_id, count(*)::int AS plays, count(*) FILTER (WHERE hit)::int AS hits
      FROM guesses WHERE round_id = ANY(${ids}) AND puzzle_no = ${no} GROUP BY round_id`,
    q`SELECT score, count(*)::int AS n FROM scores WHERE puzzle_no = ${no} GROUP BY score`,
  ]);
  const dist = [0, 0, 0, 0, 0, 0];
  for (const s of scores as { score: number; n: number }[]) if (s.score >= 0 && s.score <= 5) dist[s.score] = s.n;
  return NextResponse.json(
    {
      enabled: true,
      rounds: Object.fromEntries((rounds as { round_id: string; plays: number; hits: number }[]).map((r) => [r.round_id, { plays: r.plays, hits: r.hits }])),
      scores: dist,
    },
    { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=120" } },
  );
}

/**
 * Record a guess or a final score. Only the first answer from a device counts,
 * so replays and refreshes don't skew anything.
 * { device, no, roundId, hit } or { device, no, score }
 */
export async function POST(req: Request) {
  if (!statsEnabled) return NextResponse.json({ enabled: false });
  let body: { device?: string; no?: number; roundId?: string; hit?: boolean; score?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const { device, no, roundId, hit, score } = body;
  // Allow a day of slack for players whose local date is ahead of the server's.
  if (!device || !DEVICE.test(device) || !Number.isInteger(no) || no! < 1 || no! > puzzleNoFor() + 1) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const { q, ready } = sql();
  await ready;
  if (typeof roundId === "string" && typeof hit === "boolean") {
    if (!ROUND_IDS.has(roundId) || !dayFor(no!).rounds.some((r) => r.id === roundId)) {
      return NextResponse.json({ error: "bad round" }, { status: 400 });
    }
    await q`INSERT INTO guesses (device, round_id, puzzle_no, hit) VALUES (${device}, ${roundId}, ${no}, ${hit}) ON CONFLICT DO NOTHING`;
  } else if (Number.isInteger(score) && score! >= 0 && score! <= 5) {
    await q`INSERT INTO scores (device, puzzle_no, score) VALUES (${device}, ${no}, ${score}) ON CONFLICT DO NOTHING`;
  } else {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
