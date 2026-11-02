import { NextResponse } from "next/server";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";
import { DEFAULT_MODEL, find, makeAi, makeReal } from "@/lib/pipeline/make";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** ?ids=d1r1,d1r2&kind=real|ai&model= — runs the ids side by side. */
export async function GET(req: Request) {
  if (!pipelineEnabled()) return denied();
  const q = new URL(req.url).searchParams;
  const ids = (q.get("ids") ?? "").split(",").filter(Boolean).slice(0, 15);
  const kind = q.get("kind") === "ai" ? "ai" : "real";
  const model = q.get("model") || DEFAULT_MODEL;
  // The image model allows 5 requests a minute, so AI runs go in paced groups of 5.
  const size = kind === "ai" ? 5 : 10;
  const out: unknown[] = [];
  for (let i = 0; i < ids.length; i += size) {
    const started = Date.now();
    out.push(...(await runGroup(ids.slice(i, i + size), kind, model)));
    const wait = 62_000 - (Date.now() - started);
    if (kind === "ai" && i + size < ids.length && wait > 0) await new Promise((r) => setTimeout(r, wait));
  }
  return NextResponse.json(out);
}

function runGroup(ids: string[], kind: string, model: string) {
  return Promise.all(
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
}
