import { NextResponse } from "next/server";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";
import { DEFAULT_MODEL, find, makeAi } from "@/lib/pipeline/make";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!pipelineEnabled()) return denied();
  const q = new URL(req.url).searchParams;
  const item = find(q.get("id"));
  const model = q.get("model") || DEFAULT_MODEL;
  if (!item) return NextResponse.json({ error: "unknown id" }, { status: 400 });
  try {
    return NextResponse.json(await makeAi(item, model));
  } catch (e) {
    return NextResponse.json({ id: item.id, model, error: String(e).slice(0, 500) }, { status: 500 });
  }
}
