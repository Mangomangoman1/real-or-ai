"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Brand";
import { capital, pad } from "@/lib/format";
import { aiOnLeft, msUntilNextPuzzle } from "@/lib/calendar";
import { beat, type Stats } from "@/lib/stats";
import { bestStreak, streak, type Saved } from "@/lib/store";
import type { Day } from "@/lib/types";

const RANK: Record<number, string> = {
  5: "Slop-proof",
  4: "Sharp-eyed",
  3: "Hard to fool",
  2: "Half-slopped",
  1: "Easily slopped",
  0: "Fully slopped",
};

const LINES: Record<number, string> = {
  5: "Five for five. Nothing gets past you.",
  4: "One got through. The machines are taking notes.",
  3: "Better than a coin flip, but not by much.",
  2: "The machines won this round. Tomorrow's a rematch.",
  1: "Fooled four times. It happens to the best eyes.",
  0: "A clean sweep, for the robots.",
};

const STEP = 260;

type Props = { no: number; launch: string; day: Day; picks: boolean[]; saved: Saved; todayNo: number; stats: Stats | null; onShare: () => void; onArchive: () => void };

export default function End({ no, day, picks, saved, todayNo, stats, onShare, onArchive }: Props) {
  const score = picks.filter(Boolean).length;
  const [shown, setShown] = useState(0); // tiles turned over so far
  const [left, setLeft] = useState(msUntilNextPuzzle());

  // Turn the tiles over one by one, then let the score settle.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(picks.length);
      return;
    }
    setShown(0);
    const ts = picks.map((_, i) => setTimeout(() => setShown(i + 1), 350 + i * STEP));
    return () => ts.forEach(clearTimeout);
  }, [no, picks]);

  useEffect(() => {
    const t = setInterval(() => setLeft(msUntilNextPuzzle()), 1000);
    return () => clearInterval(t);
  }, []);

  const counted = picks.slice(0, shown).filter(Boolean).length;
  const settled = shown >= picks.length;
  const done = Object.values(saved.results).filter((r) => r.done);
  const avg = done.length ? done.reduce((a, r) => a + r.picks.filter(Boolean).length, 0) / done.length : 0;
  const hh = String(Math.floor(left / 3.6e6)).padStart(2, "0");
  const mm = String(Math.floor((left % 3.6e6) / 6e4)).padStart(2, "0");
  const ss = String(Math.floor((left % 6e4) / 1000)).padStart(2, "0");
  const total = stats?.scores?.reduce((a, b) => a + b, 0) ?? 0;
  const pct = stats?.scores && total >= 10 ? beat(stats.scores, score) : null;

  return (
    <main className={`main end${settled ? " settled" : ""} score-${score}`}>
      <div className="end-col">
        <div className="kicker mono">
          <span className="live-dot" />
          No. {pad(no)} <span className="sep">/</span> your result
        </div>

        <div className="result">
          <ol className="tiles" aria-label={`Your five answers: ${picks.map((p) => (p ? "spotted" : "fooled")).join(", ")}`}>
            {day.rounds.map((r, i) => (
              <li key={r.id} className={`tile${i < shown ? " on" : ""} ${picks[i] ? "hit" : "miss"}`} aria-hidden>
                <span className="tile-face back" />
                <span className="tile-face front">
                  {!r.placeholder && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.ai.src} alt="" />
                  )}
                  <span className="tile-mark">{picks[i] ? Icon.check : Icon.cross}</span>
                </span>
              </li>
            ))}
          </ol>

          <div className="score-row" aria-label={`${score} of ${picks.length} spotted`}>
            <span className="score-num" key={counted}>
              {counted}
            </span>
            <span className="score-of">
              <span>of {picks.length}</span>
              <span>spotted</span>
            </span>
          </div>
          <h2 className="rank">{RANK[score]}</h2>
          <p className="rank-line">{LINES[score]}</p>
          {pct !== null && (
            <p className="beat">
              Better than <b>{pct}%</b> of players today
            </p>
          )}
        </div>

        <div className="end-actions">
          <button className="btn btn-play" onClick={onShare}>
            {Icon.share}
            Share your score
          </button>
          <button className="btn btn-ghost" onClick={onArchive}>
            Past puzzles
          </button>
        </div>

        <p className="next-in mono">
          Next puzzle in <b>{hh}:{mm}:{ss}</b>
        </p>

        <div className="stats">
          <div className="stat">
            <b>{done.length}</b>
            <span>played</span>
          </div>
          <div className="stat">
            <b>{avg ? avg.toFixed(1) : "0"}</b>
            <span>average</span>
          </div>
          <div className="stat">
            <b>{streak(saved, todayNo)}</b>
            <span>streak</span>
          </div>
          <div className="stat">
            <b>{bestStreak(saved)}</b>
            <span>best</span>
          </div>
        </div>

        {stats?.scores && total >= 10 && <Spread scores={stats.scores} mine={score} total={total} />}

        <section className="recap">
          <h3>The five pairs</h3>
          <ul>
            {day.rounds.map((r, i) => {
              const aiLeft = aiOnLeft(r.id);
              return (
                <li key={r.id}>
                  <div className="recap-pair">
                    {r.placeholder ? (
                      <>
                        <span className="ph" />
                        <span className="ph" />
                      </>
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={aiLeft ? r.ai.src : r.real.src} alt="" className={aiLeft ? "ai" : "real"} />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={aiLeft ? r.real.src : r.ai.src} alt="" className={aiLeft ? "real" : "ai"} />
                      </>
                    )}
                  </div>
                  <div className="what">
                    <b>{capital(r.subject)}</b>
                    <span>
                      AI was {aiLeft ? "A" : "B"}. {r.tell.text}
                    </span>
                  </div>
                  <span className={`res ${picks[i] ? "hit" : "miss"}`}>{picks[i] ? "spotted" : "fooled"}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}

/** How today's scores spread across everyone, with yours marked. */
function Spread({ scores, mine, total }: { scores: number[]; mine: number; total: number }) {
  const top = Math.max(...scores, 1);
  return (
    <div className="spread">
      <div className="spread-head mono">
        <span>How everyone did</span>
        <span>{total.toLocaleString()} players</span>
      </div>
      <div className="bars" role="img" aria-label={`Score spread across ${total} players. You scored ${mine} of 5.`}>
        {scores.map((n, s) => (
          <div key={s} className={`bar${s === mine ? " mine" : ""}`}>
            <span className="fill" style={{ height: `${Math.max(4, (n / top) * 100)}%` }} />
            <span className="lab">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
