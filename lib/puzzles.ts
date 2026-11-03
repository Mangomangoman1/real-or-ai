import "server-only";
import { unstable_cache } from "next/cache";
import data from "@/data/puzzles.json";
import { pickDay, puzzleNoFor as noFor } from "./calendar";
import { readSchedule } from "./studio/schedule";
import type { Day, PuzzleFile } from "./types";

const file = data as PuzzleFile;

export const LAUNCH = file.launch;
/** The first week ships with the code; later days come from the studio's published schedule. */
export const BASE_DAYS: Day[] = file.days;

const scheduled = unstable_cache(
  async () => {
    try {
      return await readSchedule();
    } catch (e) {
      console.error("schedule read failed", e);
      return [];
    }
  },
  ["schedule-v1"],
  { revalidate: 300, tags: ["schedule"] },
);

/** Every puzzle in order, with no gaps: the shipped week, then each published day that follows on. */
export async function allDays(): Promise<Day[]> {
  const days = [...BASE_DAYS];
  const extra = (await scheduled()).filter((d) => d.no > days.length).sort((a, b) => a.no - b.no);
  for (const d of extra) {
    if (d.no !== days.length + 1) break;
    days.push(d);
  }
  return days;
}

/** Today's puzzle number by the server clock. */
export function puzzleNoFor(date = new Date()) {
  return noFor(LAUNCH, date);
}

export async function dayFor(no: number) {
  const days = await allDays();
  return pickDay(days, days.length, no);
}

/**
 * What the browser gets: every puzzle up to tomorrow by the server clock (time zones
 * run up to 14 hours ahead), and nothing later, so future answers aren't in the page.
 */
export async function available() {
  const days = await allDays();
  const max = puzzleNoFor() + 1;
  return { launch: LAUNCH, total: days.length, days: days.slice(0, Math.min(days.length, max)) };
}
