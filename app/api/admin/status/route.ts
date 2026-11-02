import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";
import { opaqueName } from "@/lib/pipeline/media";
import source from "@/data/source.json";

export const dynamic = "force-dynamic";

/** Which rounds still lack a stored file of the given kind. ?kind=ai2 */
export async function GET(req: Request) {
  if (!pipelineEnabled()) return denied();
  const kind = new URL(req.url).searchParams.get("kind") ?? "ai2";
  const have = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "m/", cursor, limit: 1000 });
    page.blobs.forEach((b) => have.add(b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const missing = (source as { id: string }[]).map((s) => s.id).filter((id) => !have.has(opaqueName(id, kind)));
  return NextResponse.json({ kind, total: have.size, missing });
}
