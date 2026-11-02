import { NextResponse } from "next/server";

/**
 * The puzzle pipeline only runs when ADMIN_PIPELINE=1 is set on the project.
 * Turn it off (remove the variable) once a batch of puzzles is made.
 * Every deployment URL is behind Vercel Authentication as well.
 */
export function pipelineEnabled() {
  return process.env.ADMIN_PIPELINE === "1";
}

export function denied() {
  return NextResponse.json({ error: "pipeline disabled" }, { status: 404 });
}
