import { NextResponse } from "next/server";

/**
 * The puzzle pipeline only runs on preview deployments that have
 * ADMIN_PIPELINE=1 set. Production never exposes it.
 */
export function pipelineEnabled() {
  return process.env.ADMIN_PIPELINE === "1" && process.env.VERCEL_ENV !== "production";
}

export function denied() {
  return NextResponse.json({ error: "pipeline disabled" }, { status: 404 });
}
