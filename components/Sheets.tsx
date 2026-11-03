"use client";

import { capital } from "@/lib/format";
import { dateForNo } from "@/lib/calendar";
import type { Saved } from "@/lib/store";
import type { Day } from "@/lib/types";

export function Archive({ launch, saved, todayNo, onPick }: { launch: string; saved: Saved; todayNo: number; onPick: (n: number) => void }) {
  // A calendar from No. 1 to today, weeks starting on Monday.
  const lead = (dateForNo(launch, 1).getDay() + 6) % 7;
  const nos = Array.from({ length: todayNo }, (_, i) => i + 1);
  const played = nos.filter((n) => saved.results[n]?.done).length;
  return (
    <>
      <h4>Archive</h4>
      <p>
        Every puzzle so far. Only the day&rsquo;s own puzzle counts toward your streak, but you can play any of them.{" "}
        {played > 0 && `You've finished ${played} of ${todayNo}.`}
      </p>
      <div className="cal">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="dow">
            {d}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {nos.map((n) => {
          const r = saved.results[n];
          const d = dateForNo(launch, n);
          const sc = r?.done ? r.picks.filter(Boolean).length : null;
          const label = `No. ${n}, ${d.toLocaleDateString(undefined, { month: "long", day: "numeric" })}${sc !== null ? `, scored ${sc} of 5` : ""}`;
          return (
            <button key={n} aria-label={label} className={`${n === todayNo ? "today" : ""} ${r?.done ? `done s${sc}` : r?.picks?.length ? "part" : ""}`} onClick={() => onPick(n)}>
              <span className="d">{d.getDate() === 1 || n === 1 ? d.toLocaleDateString(undefined, { month: "short" }) : d.getDate()}</span>
              <span className="sc">{sc !== null ? `${sc}/5` : r?.picks?.length ? "…" : n}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

export function About({ days, theme, onTheme }: { days: Day[]; theme: "light" | "dark"; onTheme: () => void }) {
  const credits = days.flatMap((d) => d.rounds).filter((r) => !r.placeholder);
  return (
    <>
      <h4>How it works</h4>
      <p>
        Every real photo here is openly licensed and credited below. Each AI twin was made by describing that photo in words and asking an image model to
        paint it, so the two share a subject but not a single pixel. Both are cropped and compressed the same way, so file quality gives nothing away.
      </p>
      <p>No faces of real people, ever. Just animals, food, places and things.</p>
      <p>
        No account and no tracking cookies. Your scores and streak live in this browser. To show how everyone did, each answer is counted anonymously once
        per browser.
      </p>
      <div className="sheet-row">
        <span>Appearance</span>
        <button className="btn btn-ghost btn-sm" onClick={onTheme}>
          {theme === "dark" ? "Switch to light" : "Switch to dark"}
        </button>
      </div>
      <h5>Photo credits</h5>
      <ul className="credits-list">
        {credits.map((r) => (
          <li key={r.id}>
            {capital(r.subject)}:{" "}
            <a href={r.real.credit.sourceUrl} target="_blank" rel="noreferrer">
              {r.real.credit.author}
            </a>
            , {r.real.credit.license} via {r.real.credit.sourceName}. AI twin by {r.ai.model}.
          </li>
        ))}
      </ul>
    </>
  );
}
