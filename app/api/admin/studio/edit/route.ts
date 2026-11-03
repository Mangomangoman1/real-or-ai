import { NextResponse } from "next/server";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";
import { load, save } from "@/lib/studio/store";
import type { Status } from "@/lib/studio/types";

export const dynamic = "force-dynamic";

const STATUSES: Status[] = ["new", "picked", "made", "drafted", "approved", "rejected"];

/**
 * Change a draft by query string: ?id=s001&status=approved&x=0.4&y=0.6&tell=...&model=...&note=...&day=9
 * Setting status back to "picked" with a new model remakes the twin on the next step.
 */
export async function GET(req: Request) {
  if (!pipelineEnabled()) return denied();
  const sp = new URL(req.url).searchParams;
  const d = await load(sp.get("id") ?? "");
  if (!d) return NextResponse.json({ error: "unknown id" }, { status: 404 });
  const status = sp.get("status") as Status | null;
  if (status && STATUSES.includes(status)) d.status = status;
  if (sp.has("tell") || sp.has("x") || sp.has("y")) {
    d.tell = {
      text: sp.get("tell") ?? d.tell?.text ?? "",
      x: sp.has("x") ? Number(sp.get("x")) : d.tell?.x ?? 0.5,
      y: sp.has("y") ? Number(sp.get("y")) : d.tell?.y ?? 0.5,
    };
  }
  if (sp.has("model")) d.ai = { model: sp.get("model")!, src: d.ai?.src ?? "" };
  if (sp.has("note")) d.note = sp.get("note") || undefined;
  if (sp.has("subject")) d.subject = sp.get("subject")!;
  if (sp.has("query")) d.query = sp.get("query")!;
  if (sp.has("day")) d.day = sp.get("day") ? Number(sp.get("day")) : undefined;
  if (sp.has("diff")) d.difficulty = Number(sp.get("diff"));
  await save(d);
  return NextResponse.json(d);
}
