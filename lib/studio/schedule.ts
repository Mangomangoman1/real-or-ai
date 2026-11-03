import "server-only";
import { createHash } from "node:crypto";
import { del, list, put } from "@vercel/blob";
import type { Day, Round } from "@/lib/types";
import { capital } from "@/lib/format";
import type { Draft } from "./types";

/**
 * Puzzles made in the studio go live without a deploy: approving rounds and pressing
 * Publish writes the schedule to Blob, and the site reads it back (cached for a few minutes).
 * The file name is salted so the schedule, answers included, can't be guessed.
 */
function dir() {
  const salt = process.env.MEDIA_SALT || "roai-salt-v1";
  return "schedule/" + createHash("sha256").update(`${salt}:schedule`).digest("hex").slice(0, 24) + "/";
}

export async function readSchedule(): Promise<Day[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  const { blobs } = await list({ prefix: dir() });
  const newest = blobs.sort((a, b) => b.pathname.localeCompare(a.pathname))[0];
  if (!newest) return [];
  const r = await fetch(newest.url, { cache: "no-store" });
  if (!r.ok) throw new Error(`schedule ${r.status}`);
  return ((await r.json()) as { days: Day[] }).days;
}

async function writeSchedule(days: Day[]) {
  const old = (await list({ prefix: dir() })).blobs.map((b) => b.url);
  await put(`${dir()}${String(Date.now()).padStart(15, "0")}.json`, JSON.stringify({ days }), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    cacheControlMaxAge: 31536000,
  });
  if (old.length) await del(old).catch(() => {});
}

export function toRound(d: Draft): Round {
  if (!d.realSrc || !d.ai?.src || !d.photo || !d.tell) throw new Error(`${d.id} is not complete`);
  return {
    id: d.id,
    subject: capital(d.subject ?? d.query),
    real: { src: d.realSrc, credit: d.photo.credit },
    ai: { src: d.ai.src, model: d.ai.model },
    tell: d.tell,
  };
}

/**
 * Give each approved round without a day a place in the calendar, five a day after
 * `firstNo - 1`. Each day mixes categories (no two from the same one while others are
 * left) and runs easiest to hardest. Days already given out never change.
 */
export function plan(drafts: Draft[], firstNo: number) {
  const ready = drafts.filter((d) => d.status === "approved");
  const placed = ready.filter((d) => d.day);
  const pool = ready.filter((d) => !d.day).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const taken = new Set(placed.map((d) => d.day!));
  let next = Math.max(firstNo, ...[...taken].map((n) => n + 1));
  const assigned: Draft[] = [];

  const byCat = new Map<string, Draft[]>();
  for (const d of pool) {
    const c = d.category ?? "other";
    byCat.set(c, [...(byCat.get(c) ?? []), d]);
  }
  // Spread each category evenly through the run rather than front-loading it.
  const remaining = () => [...byCat.values()].reduce((n, l) => n + l.length, 0);
  while (remaining() >= 5) {
    const day: Draft[] = [];
    while (day.length < 5) {
      const used = new Set(day.map((d) => d.category ?? "other"));
      const cats = [...byCat.entries()].filter(([, l]) => l.length).sort((a, b) => b[1].length - a[1].length);
      const fresh = cats.find(([c]) => !used.has(c)) ?? cats[0];
      day.push(fresh[1].shift()!);
    }
    day.sort((a, b) => (a.difficulty ?? 3) - (b.difficulty ?? 3));
    day.forEach((d) => assigned.push({ ...d, day: next }));
    next++;
  }
  return { assigned, left: remaining() };
}

/** Build the schedule from every approved round that has a day, and write it. */
export async function publish(drafts: Draft[]) {
  const byDay = new Map<number, Draft[]>();
  for (const d of drafts) if (d.status === "approved" && d.day) byDay.set(d.day, [...(byDay.get(d.day) ?? []), d]);
  const days: Day[] = [...byDay.entries()]
    .filter(([, l]) => l.length === 5)
    .sort((a, b) => a[0] - b[0])
    .map(([no, l]) => ({ no, rounds: l.sort((a, b) => (a.difficulty ?? 3) - (b.difficulty ?? 3)).map(toRound) }));
  await writeSchedule(days);
  return days;
}
