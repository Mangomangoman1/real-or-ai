"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Frame from "./Frame";
import { aiOnLeft, dateForNo, dayFor, DAYS, msUntilNextPuzzle, puzzleNoFor } from "@/lib/puzzles";
import { bestStreak, load, save, streak, type Saved } from "@/lib/store";
import type { Day, Round } from "@/lib/types";

type Phase = "intro" | "play" | "end";
type Side = "L" | "R";

const LINES: Record<number, string> = {
  5: "A sharp eye. Nothing gets past you.",
  4: "Hard to fool. One got through.",
  3: "Better than a coin flip. Barely.",
  2: "The machines are winning this one.",
  1: "Fooled four times. It happens.",
  0: "A clean sweep, for the robots.",
};

export default function Game() {
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState<Saved>({ results: {} });
  const [todayNo, setTodayNo] = useState(1);
  const [no, setNo] = useState(1);
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<boolean[]>([]);
  const [selected, setSelected] = useState<Side | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loaded, setLoaded] = useState({ L: false, R: false });
  const [sheet, setSheet] = useState<null | "week" | "about">(null);
  const [toast, setToast] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const verdictRef = useRef<HTMLDivElement>(null);

  const day: Day = useMemo(() => dayFor(no), [no]);
  const round: Round | undefined = day.rounds[idx];
  const left = round ? aiOnLeft(round.id) : true;

  // First load: read saved state on the client only.
  useEffect(() => {
    const s = load();
    const t = puzzleNoFor();
    setSaved(s);
    setTodayNo(t);
    setNo(t);
    const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(s.theme ?? (sysDark ? "dark" : "light"));
    const r = s.results[t];
    if (r?.done) {
      setPicks(r.picks);
      setPhase("end");
    }
    setMounted(true);
  }, []);

  const persist = useCallback((next: Saved) => {
    setSaved(next);
    save(next);
  }, []);

  function startDay(n: number) {
    const r = saved.results[n];
    setNo(n);
    setSheet(null);
    setSelected(null);
    setRevealed(false);
    setLoaded({ L: false, R: false });
    if (r?.done) {
      setPicks(r.picks);
      setPhase("end");
      return;
    }
    const resume = r?.picks ?? [];
    setPicks(resume);
    setIdx(Math.min(resume.length, dayFor(n).rounds.length - 1));
    setPhase("play");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function call() {
    if (!selected || revealed || !round) return;
    const pickedLeft = selected === "L";
    const hit = pickedLeft === left;
    const nextPicks = [...picks, hit];
    setPicks(nextPicks);
    setRevealed(true);
    const done = nextPicks.length >= day.rounds.length;
    persist({
      ...saved,
      results: { ...saved.results, [no]: { picks: nextPicks, done: false, daily: no === todayNo } },
    });
    if (navigator.vibrate) navigator.vibrate(hit ? 12 : [20, 40, 20]);
    void done;
    setTimeout(() => verdictRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 450);
  }

  function next() {
    if (idx + 1 >= day.rounds.length) {
      persist({
        ...saved,
        results: { ...saved.results, [no]: { picks, done: true, daily: no === todayNo } },
      });
      setPhase("end");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setIdx(idx + 1);
    setSelected(null);
    setRevealed(false);
    setLoaded({ L: false, R: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Keyboard: A / B or arrows to choose, Enter to call it or go on.
  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      if (sheet) return;
      const k = e.key.toLowerCase();
      if (!revealed && (k === "a" || k === "arrowleft" || k === "1")) setSelected("L");
      else if (!revealed && (k === "b" || k === "arrowright" || k === "2")) setSelected("R");
      else if (k === "enter") {
        e.preventDefault();
        revealed ? next() : call();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Preload the next pair so it appears instantly.
  useEffect(() => {
    const nr = day.rounds[idx + 1];
    if (!nr || nr.placeholder) return;
    [nr.real.src, nr.ai.src].forEach((s) => {
      const i = new Image();
      i.src = s;
    });
  }, [day, idx]);

  function toggleTheme() {
    const t = theme === "dark" ? "light" : "dark";
    setTheme(t);
    document.documentElement.dataset.theme = t;
    persist({ ...saved, theme: t });
  }

  async function share() {
    const grid = picks.map((p) => (p ? "🟩" : "🟥")).join("");
    const st = streak(saved, todayNo);
    const text = [
      `Real or AI No. ${no}`,
      `${grid} ${picks.filter(Boolean).length}/${picks.length}`,
      st > 1 ? `🔥 ${st}-day streak` : null,
      typeof window !== "undefined" ? window.location.origin : "",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      flash("Copied. Paste it anywhere.");
    } catch {
      flash("Couldn't copy. Long-press to select instead.");
    }
  }

  function flash(t: string) {
    setToast(t);
    setTimeout(() => setToast(null), 2200);
  }

  const bothReady = loaded.L && loaded.R;
  const dateLabel = dateForNo(no).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const isPlaceholderDay = day.rounds.some((r) => r.placeholder);

  return (
    <div className="shell">
      <header className="topbar">
        <button className="wordmark" style={{ background: "none", border: 0, padding: 0 }} onClick={() => setPhase(saved.results[no]?.done ? "end" : "intro")} aria-label="Real or AI, home">
          <span className="w-real">Real</span>
          <span className="w-or">or</span>
          <span className="w-ai">AI</span>
        </button>
        <div className="top-actions">
          <button className="icon-btn" onClick={() => setSheet("week")} aria-label="Play another day">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
              <path d="M3.5 10h17M8 3v4M16 3v4" />
            </svg>
          </button>
          <button className="icon-btn" onClick={() => setSheet("about")} aria-label="About and photo credits">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 11v5M12 8h.01" />
            </svg>
          </button>
          <button className="icon-btn" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}>
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {!mounted ? null : phase === "intro" ? (
        <Intro no={no} dateLabel={dateLabel} day={day} saved={saved} todayNo={todayNo} onStart={() => startDay(no)} onWeek={() => setSheet("week")} placeholder={isPlaceholderDay} />
      ) : phase === "play" && round ? (
        <section className="play" key={`${no}-${idx}`}>
          <div className="progress">
            <span className="count">
              No. {String(no).padStart(3, "0")} · <b>{idx + 1}</b>/{day.rounds.length}
            </span>
            <div className="pips" aria-hidden>
              {day.rounds.map((_, i) => (
                <span key={i} className={`pip ${i < picks.length ? (picks[i] ? "hit" : "miss") : i === idx ? "now" : ""}`} />
              ))}
            </div>
          </div>

          <div className="question">
            <h2>
              {revealed ? round.subject : (
                <>
                  Which one is <em>AI</em>?
                </>
              )}
            </h2>
            <p>{revealed ? "One real photo, one twin made from a description of it." : `${capital(round.subject)}. Tap the fake, hold to inspect.`}</p>
          </div>

          <div className={`pair${revealed ? " revealed" : ""}`}>
            {(["L", "R"] as Side[]).map((side) => {
              const isAi = side === "L" ? left : !left;
              const src = isAi ? round.ai.src : round.real.src;
              return (
                <Frame
                  key={side}
                  label={side === "L" ? "A" : "B"}
                  src={src}
                  alt={`${round.subject}, photo ${side === "L" ? "A" : "B"}`}
                  selected={selected === side}
                  locked={revealed}
                  ready={bothReady}
                  onLoad={() => setLoaded((l) => ({ ...l, [side]: true }))}
                  onPick={() => setSelected(side)}
                  showHint={idx === 0 && side === "L" && !selected}
                  placeholder={round.placeholder ? { subject: round.subject, isAi } : undefined}
                  verdict={
                    revealed
                      ? {
                          isAi,
                          model: round.ai.model,
                          credit: isAi ? undefined : round.real.credit,
                          tell: round.tell,
                          dim: !isAi,
                        }
                      : undefined
                  }
                />
              );
            })}
          </div>

          {revealed ? (
            <div className="verdict" ref={verdictRef}>
              <div className="verdict-head">
                <h3 className={picks[idx] ? "hit" : "miss shake"}>{picks[idx] ? "Spotted it." : "Fooled you."}</h3>
                <span className="model">AI was {left ? "A" : "B"}</span>
              </div>
              <p className="tell">
                <b>The tell</b>
                {round.tell.text}
              </p>
              <div className="sticky-cta" style={{ margin: 0 }}>
                <button className="btn btn-primary btn-wide" onClick={next} autoFocus>
                  {idx + 1 >= day.rounds.length ? "See your score" : "Next pair"} <span className="kbd">↵</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="sticky-cta">
              <button className="btn btn-primary btn-wide" disabled={!selected} onClick={call}>
                {selected ? `${selected === "L" ? "A" : "B"} is the AI` : "Pick the fake"}
                {selected && <span className="kbd">↵</span>}
              </button>
            </div>
          )}
        </section>
      ) : phase === "end" ? (
        <End no={no} day={day} picks={picks} saved={saved} todayNo={todayNo} onShare={share} onWeek={() => setSheet("week")} />
      ) : null}

      {sheet && (
        <>
          <div className="scrim" onClick={() => setSheet(null)} />
          <div className="sheet" role="dialog" aria-modal="true">
            <div className="grab" />
            <button className="icon-btn close" onClick={() => setSheet(null)} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            {sheet === "week" ? <Week saved={saved} todayNo={todayNo} onPick={startDay} /> : <About />}
          </div>
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function capital(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Intro({ no, dateLabel, day, saved, todayNo, onStart, onWeek, placeholder }: { no: number; dateLabel: string; day: Day; saved: Saved; todayNo: number; onStart: () => void; onWeek: () => void; placeholder: boolean }) {
  const r = saved.results[no];
  const st = streak(saved, todayNo);
  return (
    <section className="intro">
      <div className="issue">
        <span className="dot" />
        No. {String(no).padStart(3, "0")} · {dateLabel}
      </div>
      <h1 className="hero-title">
        <em>Real</em> or <span className="machine">AI</span>
      </h1>
      <p className="lede">
        Five pairs. In each, <strong>one photo is real</strong> and its twin was made by AI from a description of it. Find the fake.
      </p>

      <div className="strip" aria-hidden>
        {day.rounds.map((rd, i) => (
          <div className="strip-cell" key={rd.id}>
            {!rd.placeholder && (
              <>
                {/* Both photos blended and blurred, so the strip hints at the subject without giving the answer away */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={rd.real.src} alt="" style={{ position: "absolute", inset: 0, filter: "blur(6px)", transform: "scale(1.2)" }} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={rd.ai.src} alt="" style={{ position: "absolute", inset: 0, opacity: 0.5, filter: "blur(6px)", transform: "scale(1.2)" }} />
              </>
            )}
            <span>{String(i + 1).padStart(2, "0")}A</span>
          </div>
        ))}
      </div>

      <ol className="how">
        <li>
          <b>01 · TAP</b>Pick the photo you think a machine made.
        </li>
        <li>
          <b>02 · HOLD</b>Press and hold to look through a loupe.
        </li>
        <li>
          <b>03 · LEARN</b>Every answer shows the tell to watch for.
        </li>
      </ol>

      <div className="intro-foot">
        <button className="btn btn-primary btn-wide" onClick={onStart}>
          {r?.picks?.length ? `Keep going · ${r.picks.length}/5 done` : `Start No. ${String(no).padStart(3, "0")}`}
        </button>
        <div className="intro-meta">
          <span>{st > 0 ? `🔥 ${st}-day streak` : "New puzzle every midnight"}</span>
          <button className="linkish" onClick={onWeek}>
            Play the week
          </button>
        </div>
        {placeholder && <div className="banner">Prototype: some photos here are still placeholders.</div>}
      </div>
    </section>
  );
}

function End({ no, day, picks, saved, todayNo, onShare, onWeek }: { no: number; day: Day; picks: boolean[]; saved: Saved; todayNo: number; onShare: () => void; onWeek: () => void }) {
  const score = picks.filter(Boolean).length;
  const [left, setLeft] = useState(msUntilNextPuzzle());
  useEffect(() => {
    const t = setInterval(() => setLeft(msUntilNextPuzzle()), 1000);
    return () => clearInterval(t);
  }, []);
  const done = Object.values(saved.results).filter((r) => r.done);
  const avg = done.length ? done.reduce((a, r) => a + r.picks.filter(Boolean).length, 0) / done.length : 0;
  const hh = String(Math.floor(left / 3.6e6)).padStart(2, "0");
  const mm = String(Math.floor((left % 3.6e6) / 6e4)).padStart(2, "0");
  const ss = String(Math.floor((left % 6e4) / 1000)).padStart(2, "0");

  return (
    <section className="end">
      <div className="issue">
        <span className="dot" />
        No. {String(no).padStart(3, "0")} · result
      </div>
      <div>
        <div className="score-big">
          <span className="n">{score}</span>
          <span className="of mono">of {picks.length} spotted</span>
        </div>
        <p className="score-line">{LINES[score] ?? ""}</p>
      </div>

      <ul className="recap">
        {day.rounds.map((r, i) => (
          <li key={r.id} style={{ animationDelay: `${i * 60}ms` }}>
            {r.placeholder ? (
              <span style={{ width: 64, height: 48, borderRadius: 5, background: "var(--paper-2)" }} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.ai.src} alt="" />
            )}
            <div className="what">
              {capital(r.subject)}
              <span>{r.tell.text}</span>
            </div>
            <span className={`res ${picks[i] ? "hit" : "miss"}`}>{picks[i] ? "spotted" : "fooled"}</span>
          </li>
        ))}
      </ul>

      <div className="actions-row">
        <button className="btn btn-primary" onClick={onShare}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
          </svg>
          Share score
        </button>
        <button className="btn btn-ghost" onClick={onWeek}>
          Play the week
        </button>
      </div>

      <div className="stats">
        <div className="stat">
          <b>{done.length}</b>
          <span>played</span>
        </div>
        <div className="stat">
          <b>{avg ? avg.toFixed(1) : "0"}</b>
          <span>avg / 5</span>
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

      <p className="next-in">
        Next puzzle in <b>{hh}:{mm}:{ss}</b>
      </p>
    </section>
  );
}

function Week({ saved, todayNo, onPick }: { saved: Saved; todayNo: number; onPick: (n: number) => void }) {
  // Show the week that today falls in, starting from No. 1 of this loop.
  const base = Math.floor((todayNo - 1) / DAYS.length) * DAYS.length + 1;
  const nos = Array.from({ length: DAYS.length }, (_, i) => base + i);
  return (
    <>
      <h4>Play the week</h4>
      <p>The prototype has seven puzzles. Your streak only counts the day you&rsquo;re on, but you can play any of them.</p>
      <div className="week">
        {nos.map((n) => {
          const r = saved.results[n];
          const d = dateForNo(n);
          return (
            <button key={n} className={`${n === todayNo ? "today" : ""} ${r?.done ? "done" : ""}`} onClick={() => onPick(n)}>
              <span className="d">{d.toLocaleDateString(undefined, { weekday: "short" })}</span>
              <span className="no">{n}</span>
              <span className="sc">{r?.done ? `${r.picks.filter(Boolean).length}/5` : r?.picks?.length ? "…" : "·"}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function About() {
  const credits = DAYS.flatMap((d) => d.rounds).filter((r) => !r.placeholder);
  return (
    <>
      <h4>How it works</h4>
      <p>
        Every real photo here is openly licensed and credited below. Each AI twin was made by describing that photo in words and asking an image model to
        make it, so the two share a subject but not a single pixel. Both are cropped and compressed the same way, so file quality gives nothing away.
      </p>
      <p>No faces of real people, ever. Just animals, food, places and things.</p>
      <h4 style={{ fontSize: 22, marginTop: 18 }}>Photo credits</h4>
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
