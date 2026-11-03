import "server-only";
import data from "@/data/puzzles.json";
import { pickDay, puzzleNoFor as noFor } from "./calendar";
import type { Day, PuzzleFile } from "./types";

const file = data as PuzzleFile;

export const LAUNCH = file.launch;
export const DAYS: Day[] = file.days;

/** Today's puzzle number by the server clock. */
export function puzzleNoFor(date = new Date()) {
  return noFor(LAUNCH, date);
}

export function dayFor(no: number) {
  return pickDay(DAYS, DAYS.length, no);
}

/**
 * What the browser gets: every puzzle up to tomorrow by the server clock (time zones
 * run up to 14 hours ahead), and nothing later, so future answers aren't in the page.
 */
export function available() {
  const max = puzzleNoFor() + 1;
  return { launch: LAUNCH, total: DAYS.length, days: DAYS.slice(0, Math.min(DAYS.length, max)) };
}
