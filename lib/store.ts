export type DayResult = {
  picks: boolean[]; // true = spotted the AI
  done: boolean;
  daily: boolean; // played on its own day (counts toward the streak)
};

export type Saved = {
  results: Record<string, DayResult>;
  theme?: "light" | "dark";
  seenIntro?: boolean;
};

const KEY = "real-or-ai:v1";

export function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Saved;
  } catch {}
  return { results: {} };
}

export function save(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

/** Current streak: unbroken run of daily wins-or-losses ending today or yesterday. */
export function streak(s: Saved, todayNo: number) {
  let n = 0;
  let no = s.results[todayNo]?.done && s.results[todayNo]?.daily ? todayNo : todayNo - 1;
  while (no >= 1 && s.results[no]?.done && s.results[no]?.daily) {
    n++;
    no--;
  }
  return n;
}

export function bestStreak(s: Saved) {
  const nos = Object.keys(s.results)
    .map(Number)
    .filter((k) => s.results[k].done && s.results[k].daily)
    .sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = -10;
  for (const k of nos) {
    run = k === prev + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return best;
}

/** A random id for this browser, so the global stats count each player once. Nothing personal. */
export function deviceId() {
  const k = "real-or-ai:device";
  try {
    let id = localStorage.getItem(k);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(k, id);
    }
    return id;
  } catch {
    return null;
  }
}
