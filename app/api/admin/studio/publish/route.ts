import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";
import { BASE_DAYS } from "@/lib/puzzles";
import { publish, plan } from "@/lib/studio/schedule";
import { loadAll, save } from "@/lib/studio/store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Put every approved round into the calendar and make it live. ?dry=1 shows the plan
 * without saving. Days already given out keep their place.
 */
export async function GET(req: Request) {
  if (!pipelineEnabled()) return denied();
  const dry = new URL(req.url).searchParams.has("dry");
  const all = await loadAll();
  const { assigned, left } = plan(all, BASE_DAYS.length + 1);
  const days = new Map<number, string[]>();
  for (const d of assigned) days.set(d.day!, [...(days.get(d.day!) ?? []), `${d.id} ${d.category ?? ""} d${d.difficulty ?? "?"}`]);
  if (dry) return NextResponse.json({ dry: true, newDays: Object.fromEntries(days), left });

  for (let i = 0; i < assigned.length; i += 10) await Promise.all(assigned.slice(i, i + 10).map((d) => save(d)));
  const byId = new Map(assigned.map((d) => [d.id, d]));
  const merged = all.map((d) => byId.get(d.id) ?? d);
  const live = await publish(merged);
  revalidateTag("schedule", { expire: 0 });
  revalidatePath("/");
  return NextResponse.json({ newDays: Object.fromEntries(days), left, published: live.map((d) => d.no) });
}
