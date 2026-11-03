import { NextResponse } from "next/server";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";
import { advance } from "@/lib/studio/run";
import { loadAll, save } from "@/lib/studio/store";
import type { Draft } from "@/lib/studio/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const OPEN = new Set(["new", "picked", "made"]);
const MAX_FAILS = 3;

/**
 * Push unfinished drafts forward for about four minutes, a few at a time: ?n=6
 * Call it again until "open" reaches 0. A draft that fails three times is set aside.
 */
export async function GET(req: Request) {
  if (!pipelineEnabled()) return denied();
  const n = Math.min(10, Math.max(1, Number(new URL(req.url).searchParams.get("n")) || 6));
  const deadline = Date.now() + 230_000;
  const all = await loadAll();
  const used = new Set(all.filter((d) => d.photo).map((d) => d.photo!.title));
  const queue = all.filter((d) => OPEN.has(d.status));
  const moved: string[] = [];
  const errors: string[] = [];

  async function worker() {
    for (;;) {
      if (Date.now() > deadline) return;
      let d: Draft | undefined = queue.shift();
      if (!d) return;
      // Carry one draft as far as time allows, stage by stage.
      while (d && OPEN.has(d.status) && Date.now() < deadline) {
        const from: string = d.status;
        try {
          const next: Draft = await advance(d, used);
          if (next.photo) used.add(next.photo.title);
          moved.push(`${d.id} ${from}→${next.status}`);
          if (next.status === from) break;
          d = next;
        } catch (e) {
          const fails = (d.fails ?? 0) + 1;
          errors.push(`${d.id} ${from}: ${String(e).slice(0, 160)}`);
          await save({ ...d, fails, status: fails >= MAX_FAILS ? "rejected" : d.status, note: fails >= MAX_FAILS ? `failed ${fails}x: ${String(e).slice(0, 120)}` : d.note });
          break;
        }
      }
    }
  }

  await Promise.all(Array.from({ length: n }, worker));
  const after = await loadAll();
  const count = (s: string) => after.filter((d) => d.status === s).length;
  return NextResponse.json({
    open: after.filter((d) => OPEN.has(d.status)).length,
    drafted: count("drafted"),
    approved: count("approved"),
    rejected: count("rejected"),
    moved,
    errors,
  });
}
