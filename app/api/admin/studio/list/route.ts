import { NextResponse } from "next/server";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";
import { loadAll } from "@/lib/studio/store";

export const dynamic = "force-dynamic";

/** All drafts, or a summary with ?brief=1 */
export async function GET(req: Request) {
  if (!pipelineEnabled()) return denied();
  const all = await loadAll();
  if (new URL(req.url).searchParams.get("brief")) {
    const counts: Record<string, number> = {};
    all.forEach((d) => (counts[d.status] = (counts[d.status] ?? 0) + 1));
    return NextResponse.json({
      counts,
      drafts: all.map((d) => ({ id: d.id, status: d.status, q: d.query, subject: d.subject, model: d.ai?.model, diff: d.difficulty, day: d.day, note: d.note })),
    });
  }
  return NextResponse.json(all);
}
