"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Frame from "./Frame";
import End from "./End";
import { About, Archive } from "./Sheets";
import { Icon, Wordmark } from "./Brand";
import { aiOnLeft, dateForNo, pickDay, puzzleNoFor } from "@/lib/calendar";
import { fetchStats, report, type Stats } from "@/lib/stats";
import { shareCode } from "@/lib/share";
import { load, save, streak, type Saved } from "@/lib/store";
import type { Day, Round } from "@/lib/types";
import { pad } from "@/lib/format";

type Phase = "title" | "play" | "end";
type Side = "L" | "R";

type Props = {
  launch: string;
  days: Day[];
  total: number;
  /** Set when someone opened a friend's share link */
  challenge?: { no: number; score: number; of: number };
};




export default function Game({ launch, days, total, challenge }: Props) {
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState<Saved>({ results: {} });
  const [todayNo, setTodayNo] = useState(1);
  const [no, setNo] = useState(1);
  const [phase, setPhase] = useState<Phase>("title");
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<boolean[]>([]);
  const [selected, setSelected] = useState<Side | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loaded, setLoaded] = useState({ L: false, R: false });
  const [sheet, setSheet] = useState<null | "archive" | "about">(null);
  const [toast, setToast] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [stats, setStats] = useState<Stats | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const dayFor = useCallback((n: number) => pickDay(days, total, n), [days, total]);
  const day: Day = useMemo(() => dayFor(no), [dayFor, no]);
  const round: Round | undefined = day.rounds[idx];
  const left = round ? aiOnLeft(round.id) : true;
  const hit = revealed ? picks[idx] : undefined;

  // First load: saved state lives in this browser only.
  useEffect(() => {
    const s = load();
    const t = puzzleNoFor(launch);
    setSaved(s);
    setTodayNo(t);
    setNo(t);
    const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(s.theme ?? (sysDark ? "dark" : "light"));
    if (s.results[t]?.done && !challenge) {
      setPicks(s.results[t].picks);
      setPhase("end");
    }
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Everyone else's results for the puzzle on screen.
  useEffect(() => {
    if (!mounted || phase === "title") return;
    let live = true;
    fetchStats(no).then((s) => live && setStats(s));
    return () => {
      live = false;
    };
  }, [mounted, no, phase]);

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
  }

  function call() {
    if (!selected || revealed || !round) return;
    const got = (selected === "L") === left;
    const nextPicks = [...picks, got];
    setPicks(nextPicks);
    setRevealed(true);
    persist({ ...saved, results: { ...saved.results, [no]: { picks: nextPicks, done: false, daily: no === todayNo } } });
    if (navigator.vibrate) navigator.vibrate(got ? 12 : [20, 40, 20]);
    void report({ no, roundId: round.id, hit: got }).then(() => fetchStats(no).then((st) => st && setStats(st)));
    setTimeout(() => nextRef.current?.focus({ preventScroll: true }), 700);
  }

  function next() {
    if (idx + 1 >= day.rounds.length) {
      persist({ ...saved, results: { ...saved.results, [no]: { picks, done: true, daily: no === todayNo } } });
      setPhase("end");
      void report({ no, score: picks.filter(Boolean).length }).then(() => fetchStats(no).then(setStats));
      return;
    }
    setIdx(idx + 1);
    setSelected(null);
    setRevealed(false);
    setLoaded({ L: false, R: false });
  }

  // Keyboard: A / B or arrows to choose, Enter to lock it in or move on.
  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      if (sheet || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (!revealed && (k === "a" || k === "arrowleft" || k === "1")) setSelected("L");
      else if (!revealed && (k === "b" || k === "arrowright" || k === "2")) setSelected("R");
      else if (k === "enter" && (e.target as HTMLElement)?.tagName !== "BUTTON") {
        e.preventDefault();
        if (revealed) next();
        else call();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Escape closes a sheet.
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

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
    const text = [`Sloppity No. ${no}`, `${grid} ${picks.filter(Boolean).length}/${picks.length}`, st > 1 ? `🔥 ${st}-day streak` : null, `${window.location.origin}/s/${shareCode(no, picks)}`]
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
  const score = picks.filter(Boolean).length;
  const isLast = idx + 1 >= day.rounds.length;
  const crowd = round ? stats?.rounds?.[round.id] : undefined;

  return (
    <div className={`game phase-${phase}`}>
      <header className="hud">
        <button className="home" onClick={() => setPhase(saved.results[no]?.done ? "end" : "title")} aria-label="Sloppity, home">
          <Wordmark />
        </button>

        {phase === "play" && (
          <ol className="track" aria-label={`Round ${idx + 1} of ${day.rounds.length}. ${score} spotted so far.`}>
            {day.rounds.map((_, i) => {
              const done = i < picks.length;
              const state = done ? (picks[i] ? "hit" : "miss") : i === idx ? "now" : "";
              return (
                <li key={i} className={`slot ${state}`} aria-hidden>
                  {done ? (picks[i] ? Icon.check : Icon.cross) : <span>{i + 1}</span>}
                </li>
              );
            })}
          </ol>
        )}

        <div className="hud-actions">
          {phase === "play" && (
            <span className="score-chip" aria-hidden key={score}>
              <b>{score}</b>
              <span>spotted</span>
            </span>
          )}
          <button className="icon-btn" onClick={() => setSheet("archive")} aria-label="Archive of past puzzles">
            {Icon.calendar}
          </button>
          <button className="icon-btn" onClick={() => setSheet("about")} aria-label="How it works and photo credits">
            {Icon.info}
          </button>
          <button className="icon-btn hide-sm" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}>
            {theme === "dark" ? Icon.sun : Icon.moon}
          </button>
        </div>
      </header>

      {!mounted ? (
        <main className="main" />
      ) : phase === "title" ? (
        <Title
          no={no}
          launch={launch}
          day={day}
          saved={saved}
          todayNo={todayNo}
          challenge={challenge}
          onStart={() => startDay(no)}
          onArchive={() => setSheet("archive")}
          onAbout={() => setSheet("about")}
        />
      ) : phase === "play" && round ? (
        <main className={`main play${revealed ? " revealed" : ""}${revealed ? (hit ? " got-it" : " fooled") : ""}`} key={`${no}-${idx}`}>
          <div className="prompt">
            <div className="kicker mono">
              Round {idx + 1} of {day.rounds.length} <span className="sep">/</span> {round.subject}
            </div>
            <h2 aria-live="polite">
              {revealed ? (
                hit ? (
                  <span className="verdict-word hit">Spotted it.</span>
                ) : (
                  <span className="verdict-word miss">Fooled you.</span>
                )
              ) : (
                <>
                  Which one is <em>AI</em>?
                </>
              )}
            </h2>
          </div>

          <div className="stage">
            <div className="pair">
              {(["L", "R"] as Side[]).map((side, i) => {
                const isAi = side === "L" ? left : !left;
                return (
                  <Frame
                    key={side}
                    label={side === "L" ? "A" : "B"}
                    src={isAi ? round.ai.src : round.real.src}
                    alt={`${round.subject}, photo ${side === "L" ? "A" : "B"}`}
                    selected={selected === side}
                    locked={revealed}
                    ready={bothReady}
                    onLoad={() => setLoaded((l) => ({ ...l, [side]: true }))}
                    onPick={() => setSelected(side)}
                    showHint={idx === 0 && i === 0}
                    placeholder={round.placeholder ? { subject: round.subject, isAi } : undefined}
                    burst={revealed && isAi && selected === side}
                    verdict={revealed ? { isAi, model: round.ai.model, credit: isAi ? undefined : round.real.credit, tell: round.tell, dim: !isAi } : undefined}
                  />
                );
              })}
              <span className="coin" aria-hidden>
                or
              </span>
            </div>
          </div>

          <div className="dock">
            {revealed ? (
              <div className="dock-inner reveal">
                <div className="tell">
                  <span className="tell-label">
                    {Icon.bulb}
                    The tell
                  </span>
                  <p>{round.tell.text}</p>
                  {crowd && crowd.plays >= 5 && <Crowd plays={crowd.plays} hits={crowd.hits} hit={!!hit} />}
                </div>
                <button ref={nextRef} className="btn btn-go" onClick={next}>
                  {isLast ? "See your score" : "Next pair"}
                  {Icon.arrow}
                </button>
              </div>
            ) : (
              <div className="dock-inner">
                <p className="dock-hint">
                  <span className="only-touch">Tap the fake. Hold a photo to zoom in.</span>
                  <span className="only-mouse">
                    Click the fake, or press <kbd>A</kbd> <kbd>B</kbd>. Hold to zoom.
                  </span>
                </p>
                <button className={`btn btn-go${selected ? " armed" : ""}`} disabled={!selected} onClick={call}>
                  {selected ? (
                    <>
                      Lock in <b className="pick-letter">{selected === "L" ? "A" : "B"}</b>
                    </>
                  ) : (
                    "Pick the fake"
                  )}
                </button>
              </div>
            )}
          </div>
        </main>
      ) : phase === "end" ? (
        <End no={no} launch={launch} day={day} picks={picks} saved={saved} todayNo={todayNo} stats={stats} onShare={share} onArchive={() => setSheet("archive")} />
      ) : (
        <main className="main" />
      )}

      {sheet && (
        <>
          <div className="scrim" onClick={() => setSheet(null)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-label={sheet === "archive" ? "Archive" : "How it works"}>
            <div className="grab" />
            <button className="icon-btn close" onClick={() => setSheet(null)} aria-label="Close" autoFocus>
              {Icon.close}
            </button>
            {sheet === "archive" ? (
              <Archive launch={launch} saved={saved} todayNo={todayNo} onPick={startDay} />
            ) : (
              <About days={days} theme={theme} onTheme={toggleTheme} />
            )}
          </div>
        </>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

/** One line under the tell: how the crowd did on this pair. */
function Crowd({ plays, hits, hit }: { plays: number; hits: number; hit: boolean }) {
  const pct = Math.round((hits / plays) * 100);
  const line = pct >= 75 ? "Most people catch this one." : pct <= 35 ? (hit ? "Few people catch this one. Nice eye." : "This one fools most people.") : "This one splits the crowd.";
  return (
    <div className="crowd">
      <span className="crowd-bar" aria-hidden>
        <span style={{ width: `${pct}%` }} />
      </span>
      <span>
        <b>{pct}%</b> spotted it. {line}
      </span>
    </div>
  );
}

function Title({
  no,
  launch,
  day,
  saved,
  todayNo,
  challenge,
  onStart,
  onArchive,
  onAbout,
}: {
  no: number;
  launch: string;
  day: Day;
  saved: Saved;
  todayNo: number;
  challenge?: Props["challenge"];
  onStart: () => void;
  onArchive: () => void;
  onAbout: () => void;
}) {
  const r = saved.results[no];
  const st = streak(saved, todayNo);
  const date = dateForNo(launch, no).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const label = r?.done ? "See your result" : r?.picks?.length ? `Keep going, ${r.picks.length} of 5 done` : `Play No. ${pad(no)}`;

  return (
    <main className="main title">
      <div className="title-copy">
        <div className="kicker mono">
          <span className="live-dot" />
          No. {pad(no)} <span className="sep">/</span> {date}
        </div>
        {challenge && (
          <p className="challenge">
            A friend spotted <b>{challenge.score} of {challenge.of}</b> on No. {challenge.no}. Your turn.
          </p>
        )}
        <h1 className="title-mark">
          <Wordmark />
        </h1>
        <p className="title-q">
          Real or <span className="ai-chip">AI</span>?
        </p>
        <p className="lede">
          Five pairs a day. In each, one photo is real and its twin is AI slop, made from a description of it. <strong>Spot the slop.</strong>
        </p>
        <div className="title-cta">
          <button className="btn btn-play" onClick={onStart} autoFocus>
            {label}
            {Icon.arrow}
          </button>
          <div className="chips">
            {st > 0 && (
              <span className="chip flame">
                {Icon.flame}
                {st}-day streak
              </span>
            )}
            <span className="chip">5 rounds, about 2 min</span>
            <button className="chip linkish" onClick={onArchive}>
              Archive
            </button>
            <button className="chip linkish" onClick={onAbout}>
              How it works
            </button>
          </div>
        </div>
      </div>

      <div className="hand" aria-hidden>
        {day.rounds.map((rd, i) => {
          const done = r?.picks?.[i];
          return (
            <div key={rd.id} className={`hcard${done === true ? " hit" : done === false ? " miss" : ""}`} style={{ "--i": i - (day.rounds.length - 1) / 2, "--y": `${Math.abs(i - (day.rounds.length - 1) / 2) ** 1.6 * 9}px`, "--d": `${i * 70}ms` } as React.CSSProperties}>
              {!rd.placeholder && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={rd.real.src} alt="" />
              )}
              <span className="hcard-no">{String(i + 1).padStart(2, "0")}</span>
              <span className="hcard-q">?</span>
            </div>
          );
        })}
      </div>

      <ol className="rules">
        <li>
          <span className="rule-ico">{Icon.tap}</span>
          <span>
            <b>Pick</b> the photo a machine made.
          </span>
        </li>
        <li>
          <span className="rule-ico">{Icon.loupe}</span>
          <span>
            <b>Hold</b> to look through a loupe.
          </span>
        </li>
        <li>
          <span className="rule-ico">{Icon.bulb}</span>
          <span>
            <b>Learn</b> the tell after every pair.
          </span>
        </li>
      </ol>
    </main>
  );
}
