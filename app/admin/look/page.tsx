import { notFound } from "next/navigation";
import { pipelineEnabled } from "@/lib/pipeline/guard";
import { meta } from "@/lib/pipeline/commons";

export const dynamic = "force-dynamic";

/** Large view of chosen files, cropped to 4:3 the way the game will crop them. ?t=File:A.jpg|File:B.jpg */
export default async function Look({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  if (!pipelineEnabled()) notFound();
  const sp = await searchParams;
  const items = await meta((sp.t ?? "").split("|").filter(Boolean));
  return (
    <main style={{ padding: 6, background: "#fff", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
      {items.map((c, i) => (
        <div key={c.title}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.thumb1600} alt="" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
          <div style={{ font: "11px system-ui" }}>
            <b>{i}</b> {c.title.slice(5, 70)}
          </div>
        </div>
      ))}
    </main>
  );
}
