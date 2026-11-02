import { NextResponse } from "next/server";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!pipelineEnabled()) return denied();
  const out: Record<string, unknown> = {
    oidc: Boolean(process.env.VERCEL_OIDC_TOKEN),
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  };
  try {
    const r = await fetch("https://ai-gateway.vercel.sh/v1/credits", {
      headers: { Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN}` },
    });
    out.credits = { status: r.status, body: (await r.text()).slice(0, 300) };
  } catch (e) {
    out.credits = String(e);
  }
  try {
    const r = await fetch("https://ai-gateway.vercel.sh/v1/models");
    const j = (await r.json()) as { data: { id: string; type?: string; pricing?: unknown }[] };
    out.imageModels = j.data
      .filter((m) => m.type === "image" || /image|flux|seedream|imagen/i.test(m.id))
      .map((m) => ({ id: m.id, type: m.type, pricing: m.pricing }));
  } catch (e) {
    out.models = String(e);
  }
  return NextResponse.json(out);
}
