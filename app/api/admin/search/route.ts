import { NextResponse } from "next/server";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";
import { UA } from "@/lib/pipeline/media";

export const dynamic = "force-dynamic";

/** Raw Commons search, for debugging rate limits. ?q= */
export async function GET(req: Request) {
  if (!pipelineEnabled()) return denied();
  const q = new URL(req.url).searchParams.get("q") ?? "fox";
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  Object.entries({ action: "query", format: "json", list: "search", srnamespace: "6", srlimit: "3", srsearch: q }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u, { headers: { "User-Agent": UA }, cache: "no-store" });
  return NextResponse.json({ status: r.status, retryAfter: r.headers.get("retry-after"), body: (await r.text()).slice(0, 800) });
}
