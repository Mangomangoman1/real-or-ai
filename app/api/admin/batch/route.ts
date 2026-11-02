import { NextResponse } from "next/server";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";
import { DEFAULT_MODEL, find, makeAi, makeReal } from "@/lib/pipeline/make";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** ?ids=d1r1,d1r2&kind=real|ai&model= — runs the ids side by side. */
export async function GET(req: Request) {
  if (!pipelineEnabled()) return denied();
  const q = new URL(req.url).searchParams;
  const ids = (q.get("ids") ?? "").split(",").filter(Boolean).slice(0, 10);
  const kind = q.get("kind") === "ai" ? "ai" : "real";
  const model = q.get("model") || DEFAULT_MODEL;
  const out = await Promise.all(
    ids.map(async (id) => {
      const item = find(id);
      if (!item) return { id, error: "unknown id" };
      try {
        return kind === "ai" ? await makeAi(item, model) : await makeReal(item);
      } catch (e) {
        return { id, error: String(e).slice(0, 300) };
      }
    }),
  );
  return NextResponse.json(out);
}
