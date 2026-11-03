import { neon } from "@neondatabase/serverless";

const URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

/** Global stats need a database. Without one the game still works; the stats just stay hidden. */
export const statsEnabled = Boolean(URL);

let ready: Promise<unknown> | null = null;

export function sql() {
  if (!URL) throw new Error("no database");
  const q = neon(URL);
  ready ??= Promise.all([
    q`CREATE TABLE IF NOT EXISTS guesses (
        device text NOT NULL, round_id text NOT NULL, puzzle_no int NOT NULL, hit boolean NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (device, round_id))`,
    q`CREATE TABLE IF NOT EXISTS scores (
        device text NOT NULL, puzzle_no int NOT NULL, score int NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (device, puzzle_no))`,
  ]).then(() =>
    Promise.all([
      q`CREATE INDEX IF NOT EXISTS guesses_round ON guesses (round_id)`,
      q`CREATE INDEX IF NOT EXISTS scores_no ON scores (puzzle_no)`,
    ]),
  );
  return { q, ready };
}
