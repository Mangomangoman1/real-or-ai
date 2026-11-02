import data from "@/data/puzzles.json";
import type { Day, PuzzleFile } from "./types";

const file = data as PuzzleFile;

export const LAUNCH = file.launch;
export const DAYS: Day[] = file.days;

function localMidnight(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function parseLocal(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** Puzzle number for a date, counted from the launch day (No. 1). */
export function puzzleNoFor(date = new Date()) {
  const diff = Math.round((localMidnight(date) - parseLocal(LAUNCH)) / 86_400_000);
  return Math.max(1, diff + 1);
}

/** The prototype only has a week, so later days loop back through it. */
export function dayFor(no: number): Day {
  const d = DAYS[(no - 1) % DAYS.length];
  return { ...d, no };
}

export function dateForNo(no: number) {
  const t = parseLocal(LAUNCH) + (no - 1) * 86_400_000;
  return new Date(t);
}

/** Small stable hash so each round puts the AI image on a fixed but varied side. */
export function aiOnLeft(roundId: string) {
  let h = 2166136261;
  for (let i = 0; i < roundId.length; i++) {
    h ^= roundId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) & 1) === 0;
}

export function msUntilNextPuzzle(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  return next - now.getTime();
}
