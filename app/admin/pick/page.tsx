import { notFound } from "next/navigation";
import { pipelineEnabled } from "@/lib/pipeline/guard";
import { search } from "@/lib/pipeline/commons";

export const dynamic = "force-dynamic";

const OK = /^(CC0|Public domain|PD|CC BY(-SA)? (2\.0|2\.5|3\.0|4\.0))/i;

/** Contact sheet of Commons candidates. ?q=one|two|three */
export default async function Pick({ searchParams }: { searchParams: Promise<{ q?: string; n?: string }> }) {
  if (!pipelineEnabled()) notFound();
  const sp = await searchParams;
  const qs = (sp.q ?? "").split("|").filter(Boolean);
  const results = await Promise.all(qs.map((q) => search(q, Number(sp.n ?? 6)).catch(() => [])));
  return (
    <main style={{ padding: 6, fontFamily: "system-ui", fontSize: 10, background: "#fff", color: "#000" }}>
      {qs.map((q, qi) => (
        <section key={q} style={{ marginBottom: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 12 }}>
            {qi}: {q}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {results[qi].map((c, i) => {
              const ratio = c.width / c.height;
              const good = OK.test(c.license) && ratio >= 1.2 && ratio <= 1.85 && c.width >= 2000;
              return (
                <div key={c.title} style={{ width: 200, opacity: good ? 1 : 0.35 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.thumb} alt="" style={{ width: 200, height: 150, objectFit: "cover", display: "block" }} />
                  <b style={{ color: "#c00", fontSize: 13 }}>
                    {qi}.{i}
                  </b>{" "}
                  {c.license} {ratio.toFixed(2)}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <pre id="keys" style={{ fontSize: 9, whiteSpace: "pre-wrap" }}>
        {qs.map((q, qi) => results[qi].map((c, i) => `${qi}.${i}\t${c.title}`).join("\n")).join("\n")}
      </pre>
    </main>
  );
}
