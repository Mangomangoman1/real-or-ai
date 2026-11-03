import { notFound } from "next/navigation";
import { pipelineEnabled } from "@/lib/pipeline/guard";
import { opaqueName } from "@/lib/pipeline/media";
import { BASE_DAYS as DAYS } from "@/lib/puzzles";

export const dynamic = "force-dynamic";

const BASE = "https://hlpvosalf6tojyv9.public.blob.vercel-storage.com/";

/** Side-by-side of one round across image models: ?ids=d1r1,d2r2&models=a,b */
export default async function Bake({ searchParams }: { searchParams: Promise<{ ids?: string; models?: string; w?: string }> }) {
  if (!pipelineEnabled()) notFound();
  const sp = await searchParams;
  const ids = (sp.ids ?? "").split(",").filter(Boolean);
  const models = (sp.models ?? "").split(",").filter(Boolean);
  const rounds = DAYS.flatMap((d) => d.rounds).filter((r) => ids.includes(r.id));
  const w = Number(sp.w) || 300;
  return (
    <main style={{ padding: 10, fontFamily: "var(--mono)", fontSize: 11 }}>
      {rounds.map((r) => (
        <section key={r.id} style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {[["real", r.real.src], ["seedream-5-lite", r.ai.src], ...models.map((m) => [m, BASE + opaqueName(r.id, `bake:${m}`)])].map(([k, src]) => (
            <figure key={k} style={{ margin: 0, width: w }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
              <figcaption>{r.id} · {k}</figcaption>
            </figure>
          ))}
        </section>
      ))}
    </main>
  );
}
