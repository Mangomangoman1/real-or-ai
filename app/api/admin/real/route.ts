import { NextResponse } from "next/server";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";
import { normalise, store, UA } from "@/lib/pipeline/media";
import source from "@/data/source.json";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Src = { id: string; thumb1600: string };

export async function GET(req: Request) {
  if (!pipelineEnabled()) return denied();
  const id = new URL(req.url).searchParams.get("id");
  const item = (source as Src[]).find((s) => s.id === id);
  if (!item) return NextResponse.json({ error: "unknown id" }, { status: 400 });
  const r = await fetch(item.thumb1600, { headers: { "User-Agent": UA } });
  if (!r.ok) return NextResponse.json({ error: `fetch ${r.status}` }, { status: 502 });
  const buf = await normalise(Buffer.from(await r.arrayBuffer()));
  const url = await store(item.id, "real", buf);
  return NextResponse.json({ id, url, bytes: buf.length });
}
