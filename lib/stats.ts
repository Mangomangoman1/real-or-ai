import { deviceId } from "./store";

export type Stats = { enabled: boolean; rounds?: Record<string, { plays: number; hits: number }>; scores?: number[] };

export async function fetchStats(no: number): Promise<Stats | null> {
  try {
    const r = await fetch(`/api/stats?no=${no}`);
    return r.ok ? ((await r.json()) as Stats) : null;
  } catch {
    return null;
  }
}

export function report(body: { no: number; roundId?: string; hit?: boolean; score?: number }) {
  const device = deviceId();
  if (!device) return Promise.resolve();
  return fetch("/api/stats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device, ...body }),
    keepalive: true,
  }).catch(() => undefined);
}

/** Share of players who scored lower, counting ties as half. */
export function beat(scores: number[], mine: number) {
  const total = scores.reduce((a, b) => a + b, 0);
  if (!total) return null;
  const below = scores.slice(0, mine).reduce((a, b) => a + b, 0);
  return Math.round(((below + scores[mine] / 2) / total) * 100);
}
