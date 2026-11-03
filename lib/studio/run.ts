import { createHash } from "node:crypto";
import { normalise, store } from "@/lib/pipeline/media";
import { STYLE, twin } from "@/lib/pipeline/make";
import source from "@/data/source.json";
import { bytes, candidates, sized } from "./commons";
import { save } from "./store";
import type { Draft } from "./types";
import { describe, pick, tell } from "./vision";

/** Image models the twins rotate through, so players can't learn one model's habits. */
export const TWIN_MODELS = (process.env.STUDIO_TWIN_MODELS || "bytedance/seedream-5.0-lite").split(",");

export function modelFor(id: string) {
  const h = createHash("sha256").update(id).digest()[0];
  return TWIN_MODELS[h % TWIN_MODELS.length];
}

const USED = new Set((source as { title: string }[]).map((s) => s.title));

/** Move one draft forward by one stage. Each stage saves, so a failure never loses work. */
export async function advance(d: Draft, used: Set<string>): Promise<Draft> {
  if (d.status === "new") {
    const all = (await candidates(d.query)).filter((p) => !USED.has(p.title) && !used.has(p.title)).slice(0, 6);
    if (!all.length) return save({ ...d, status: "rejected", note: "no usable Commons photos for this query" });
    const thumbs = await Promise.all(all.map((p) => bytes(sized(p.thumb, 500))));
    const choice = await pick(d.query, all, thumbs);
    const photo = all[choice.choice];
    if (!photo) return save({ ...d, status: "rejected", note: `none usable: ${choice.reason}` });
    const big = await bytes(sized(photo.thumb, 1280));
    const desc = await describe(choice.subject, big);
    if (desc.people) return save({ ...d, status: "rejected", photo, note: "a person is visible" });
    return save({ ...d, status: "picked", subject: choice.subject, photo, description: desc.description, note: choice.reason });
  }
  if (d.status === "picked" && d.photo && d.description) {
    const model = d.ai?.model || modelFor(d.id);
    const [realBuf, aiRaw] = await Promise.all([
      bytes(sized(d.photo.thumb, 1920)).then((b) => normalise(Buffer.from(b))),
      twin(d.description + STYLE, model),
    ]);
    const aiBuf = await normalise(Buffer.from(aiRaw));
    // Fresh names each time, so a redone twin or re-picked photo never shows a cached old file.
    const v = Date.now().toString(36);
    const [realSrc, aiSrc] = await Promise.all([store(d.id, `real:${v}`, realBuf), store(d.id, `ai:${model}:${v}`, aiBuf)]);
    return save({ ...d, status: "made", realSrc, ai: { model, src: aiSrc } });
  }
  if (d.status === "made" && d.realSrc && d.ai) {
    const [real, ai] = await Promise.all([bytes(`${d.realSrc}?v=${Date.now()}`), bytes(`${d.ai.src}?v=${Date.now()}`)]);
    const t = await tell(d.subject ?? d.query, real, ai);
    return save({
      ...d,
      status: "drafted",
      tell: { text: t.text, x: t.x, y: t.y },
      difficulty: t.difficulty,
      note: t.giveaway ? "possible giveaway" : d.note,
    });
  }
  return d;
}
