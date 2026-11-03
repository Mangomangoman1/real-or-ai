import { NextResponse } from "next/server";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";
import { find, makeAi } from "@/lib/pipeline/make";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Try another image model on an existing round: ?id=d1r1&model=bfl/flux-3-image */
export async function GET(req: Request) {
  if (!pipelineEnabled()) return denied();
  const q = new URL(req.url).searchParams;
  const item = find(q.get("id"));
  const model = q.get("model");
  if (!item || !model) return NextResponse.json({ error: "id and model needed" }, { status: 400 });
  const t = Date.now();
  try {
    const out = await makeAi(item, model, `bake:${model}`);
    return NextResponse.json({ ...out, ms: Date.now() - t });
  } catch (e) {
    return NextResponse.json({ id: item.id, model, error: String(e).slice(0, 500) }, { status: 500 });
  }
}
