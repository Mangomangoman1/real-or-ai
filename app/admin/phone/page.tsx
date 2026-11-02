import { notFound } from "next/navigation";
import { pipelineEnabled } from "@/lib/pipeline/guard";

export const dynamic = "force-dynamic";

/** Shows the game inside phone-sized frames, for testing on a desktop browser. Preview only. */
export default async function Phone({ searchParams }: { searchParams: Promise<{ w?: string; h?: string }> }) {
  if (!pipelineEnabled()) notFound();
  const sp = await searchParams;
  const w = Number(sp.w) || 390;
  const h = Number(sp.h) || 844;
  return (
    <main style={{ display: "flex", gap: 24, padding: 16, alignItems: "flex-start" }}>
      <iframe src="/" title="Phone" style={{ width: w, height: h, border: "1px solid #999", borderRadius: 18, flex: "none" }} />
    </main>
  );
}
