import { NextResponse } from "next/server";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";
import { find, makeReal } from "@/lib/pipeline/make";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!pipelineEnabled()) return denied();
  const item = find(new URL(req.url).searchParams.get("id"));
  if (!item) return NextResponse.json({ error: "unknown id" }, { status: 400 });
  try {
    return NextResponse.json(await makeReal(item));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
