import { NextResponse } from "next/server";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";
import { load, save } from "@/lib/studio/store";
import type { Status } from "@/lib/studio/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Set one status on many drafts: ?status=approved&ids=s001,s002 (only drafts in `from`, default drafted). */
export async function GET(req: Request) {
  if (!pipelineEnabled()) return denied();
  const sp = new URL(req.url).searchParams;
  const status = sp.get("status") as Status | null;
  const from = (sp.get("from") ?? "drafted").split(",");
  const ids = (sp.get("ids") ?? "").split(",").filter(Boolean);
  if (!status || !["approved", "rejected", "drafted"].includes(status) || !ids.length) {
    return NextResponse.json({ error: "status and ids needed" }, { status: 400 });
  }
  const changed: string[] = [];
  const skipped: string[] = [];
  for (let i = 0; i < ids.length; i += 10) {
    await Promise.all(
      ids.slice(i, i + 10).map(async (id) => {
        const d = await load(id);
        if (!d || !from.includes(d.status)) return void skipped.push(id);
        d.status = status;
        if (sp.has("note")) d.note = sp.get("note") || undefined;
        await save(d);
        changed.push(id);
      }),
    );
  }
  return NextResponse.json({ changed: changed.length, skipped });
}
