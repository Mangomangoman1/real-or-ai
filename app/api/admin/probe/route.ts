import { NextResponse } from "next/server";
import { getVercelOidcToken } from "@vercel/oidc";
import { denied, pipelineEnabled } from "@/lib/pipeline/guard";

export const dynamic = "force-dynamic";

/** Credit balance and the models the gateway offers. */
export async function GET() {
  if (!pipelineEnabled()) return denied();
  const out: Record<string, unknown> = {};
  try {
    const token = process.env.AI_GATEWAY_API_KEY || (await getVercelOidcToken());
    const r = await fetch("https://ai-gateway.vercel.sh/v1/credits", { headers: { Authorization: `Bearer ${token}` } });
    out.credits = { status: r.status, body: (await r.text()).slice(0, 300) };
  } catch (e) {
    out.credits = String(e);
  }
  try {
    const r = await fetch("https://ai-gateway.vercel.sh/v1/models");
    const j = (await r.json()) as { data: { id: string; type?: string; pricing?: { input?: string; output?: string } }[] };
    out.vision = j.data
      .filter((m) => m.type === "language" && /^(anthropic|google\/gemini-3|openai\/gpt-5)/.test(m.id))
      .map((m) => `${m.id} ${m.pricing?.input ?? ""}/${m.pricing?.output ?? ""}`);
  } catch (e) {
    out.models = String(e);
  }
  return NextResponse.json(out);
}
