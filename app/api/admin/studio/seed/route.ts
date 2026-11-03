import { NextResponse } from "next/server";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";
import { loadAll, save } from "@/lib/studio/store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Add new drafts from a list of queries: ?q=a red panda|a bowl of pho&cat=animals
 * Ids continue from the highest existing one (s001, s002, ...).
 */
export async function GET(req: Request) {
  if (!pipelineEnabled()) return denied();
  const sp = new URL(req.url).searchParams;
  const queries = (sp.get("q") ?? "").split("|").map((s) => s.trim()).filter(Boolean);
  const all = await loadAll();
  const known = new Set(all.map((d) => d.query.toLowerCase()));
  let n = all.reduce((m, d) => Math.max(m, Number(d.id.slice(1)) || 0), 0);
  const made: string[] = [];
  for (const query of queries) {
    if (known.has(query.toLowerCase())) continue;
    const id = "s" + String(++n).padStart(3, "0");
    await save({ id, query, category: sp.get("cat") ?? undefined, status: "new", updatedAt: "" });
    made.push(id);
  }
  return NextResponse.json({ made });
}
