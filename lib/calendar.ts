import type { Day } from "./types";

/** Date maths shared by the server and the browser. Puzzles roll over at local midnight. */

function localMidnight(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function parseLocal(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** Puzzle number for a date, counted from the launch day (No. 1). */
export function puzzleNoFor(launch: string, date = new Date()) {
  const diff = Math.round((localMidnight(date) - parseLocal(launch)) / 86_400_000);
  return Math.max(1, diff + 1);
}

export function dateForNo(launch: string, no: number) {
  return new Date(parseLocal(launch) + (no - 1) * 86_400_000);
}

/** Once the bank runs out, older puzzles come round again rather than leaving a gap. */
export function pickDay(days: Day[], total: number, no: number): Day {
  const d = days[(no - 1) % total] ?? days[days.length - 1];
  return { ...d, no };
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
