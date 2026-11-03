import { notFound } from "next/navigation";
import { pipelineEnabled } from "@/lib/pipeline/guard";
import { allDays } from "@/lib/puzzles";

export const dynamic = "force-dynamic";

/** Contact sheet for checking pairs and placing tells. Preview only. */
export default async function Review({ searchParams }: { searchParams: Promise<{ day?: string; grid?: string }> }) {
  if (!pipelineEnabled()) notFound();
  const sp = await searchParams;
  const DAYS = await allDays();
  const days = sp.day ? DAYS.filter((d) => String(d.no) === sp.day) : DAYS;
  const grid = sp.grid === "1";
  return (
    <main style={{ padding: 12, fontFamily: "var(--mono)", fontSize: 12 }}>
      {days.map((d) =>
        d.rounds.map((r) => (
          <section key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <b>{r.id}</b> {r.subject} · ai: {r.ai.model}
            </div>
            {[
              ["REAL", r.real.src],
              ["AI", r.ai.src],
            ].map(([k, src]) => (
              <div key={k} style={{ position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" style={{ width: "100%", display: "block", aspectRatio: "4/3", objectFit: "cover" }} />
                <span style={{ position: "absolute", top: 4, left: 4, background: "#000", color: "#fff", padding: "1px 5px" }}>{k}</span>
                {grid && k === "AI" && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage:
                        "linear-gradient(to right, rgba(255,0,0,.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,0,0,.55) 1px, transparent 1px)",
                      backgroundSize: "10% 10%",
                    }}
                  />
                )}
              </div>
            ))}
          </section>
        )),
      )}
    </main>
  );
}
