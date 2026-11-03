import { NextResponse } from "next/server";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";
import { advance } from "@/lib/studio/run";
import { load, loadAll } from "@/lib/studio/store";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Advance one draft by one stage: ?id=s001 */
export async function GET(req: Request) {
  if (!pipelineEnabled()) return denied();
  const id = new URL(req.url).searchParams.get("id");
  const d = id ? await load(id) : null;
  if (!d) return NextResponse.json({ error: "unknown id" }, { status: 404 });
  const used = new Set((await loadAll()).filter((x) => x.id !== d.id && x.photo).map((x) => x.photo!.title));
  const t = Date.now();
  try {
    const next = await advance(d, used);
    return NextResponse.json({ id: d.id, from: d.status, to: next.status, note: next.note, ms: Date.now() - t });
  } catch (e) {
    return NextResponse.json({ id: d.id, from: d.status, error: String(e).slice(0, 400), ms: Date.now() - t }, { status: 500 });
  }
}
