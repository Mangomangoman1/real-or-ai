import { NextResponse } from "next/server";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";
import { meta } from "@/lib/pipeline/commons";

export const dynamic = "force-dynamic";

/** ?t=File:A.jpg|File:B.jpg → licence, author and 1600px thumb for each. */
export async function GET(req: Request) {
  if (!pipelineEnabled()) return denied();
  const t = (new URL(req.url).searchParams.get("t") ?? "").split("|").filter(Boolean);
  return NextResponse.json(await meta(t));
}
