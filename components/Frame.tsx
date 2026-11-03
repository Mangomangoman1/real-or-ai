"use client";

import { useEffect, useRef, useState } from "react";
import type { Credit } from "@/lib/types";

type Props = {
  label: "A" | "B";
  src: string;
  alt: string;
  selected: boolean;
  locked: boolean;
  ready: boolean;
  onLoad: () => void;
  onPick: () => void;
  /** Set after the guess */
  verdict?: { isAi: boolean; model?: string; credit?: Credit; tell?: { x: number; y: number }; dim?: boolean };
  showHint: boolean;
  placeholder?: { subject: string; isAi: boolean };
  /** Confetti from the stamp: you caught this one */
  burst?: boolean;
};

const HOLD_MS = 200;
const ZOOM = 2.8;

export default function Frame({ label, src, alt, selected, locked, ready, onLoad, onPick, verdict, showHint, placeholder, burst }: Props) {
  const photoRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [loupe, setLoupe] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const loupeOn = useRef(false);
  // A flaky connection gets two quiet retries before the frame says so.
  const [tries, setTries] = useState(0);
  const [failed, setFailed] = useState(false);
  const shown = tries ? `${src}${src.includes("?") ? "&" : "?"}r=${tries}` : src;

  // While the loupe is open on a phone, stop the page from scrolling under the finger.
  useEffect(() => {
    const el = photoRef.current;
    if (!el) return;
    const block = (e: TouchEvent) => {
      if (loupeOn.current) e.preventDefault();
    };
    el.addEventListener("touchmove", block, { passive: false });
    return () => el.removeEventListener("touchmove", block);
  }, []);

  function pos(e: React.PointerEvent) {
    const r = photoRef.current!.getBoundingClientRect();
    return {
      x: Math.min(Math.max(e.clientX - r.left, 0), r.width),
      y: Math.min(Math.max(e.clientY - r.top, 0), r.height),
      w: r.width,
      h: r.height,
    };
  }

  function down(e: React.PointerEvent) {
    if (e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY };
    const p = pos(e);
    timer.current = window.setTimeout(() => {
      loupeOn.current = true;
      setLoupe(p);
      try {
        (e.target as Element).setPointerCapture?.(e.pointerId);
      } catch {}
      if (navigator.vibrate) navigator.vibrate(8);
    }, HOLD_MS);
  }

  function move(e: React.PointerEvent) {
    if (loupeOn.current) {
      setLoupe(pos(e));
      return;
    }
    // A drag before the hold fires is a scroll, not a tap.
    if (start.current && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 10) {
      clear();
      start.current = null;
    }
  }

  function clear() {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  }

  function up() {
    const wasLoupe = loupeOn.current;
    clear();
    loupeOn.current = false;
    setLoupe(null);
    if (!wasLoupe && start.current && !locked) onPick();
    start.current = null;
  }

  function cancel() {
    clear();
    loupeOn.current = false;
    setLoupe(null);
    start.current = null;
  }

  const tell = verdict?.isAi && verdict.tell;
  const classes = [
    "card",
    selected && "selected",
    locked && "locked",
    verdict && (verdict.isAi ? "is-ai" : "is-real"),
    verdict?.dim && "dim",
    verdict && !verdict.isAi && selected && "wrong",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      role="button"
      tabIndex={locked ? -1 : 0}
      aria-pressed={selected}
      aria-label={`Photo ${label}${selected ? ", your pick for AI" : ""}${verdict ? (verdict.isAi ? ", this was AI" : ", this was real") : ""}`}
      onKeyDown={(e) => {
        if (!locked && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onPick();
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        ref={photoRef}
        className={["photo", ready && "ready", tell && "spotlight"].filter(Boolean).join(" ")}
        style={tell ? ({ "--tx": `${tell.x * 100}%`, "--ty": `${tell.y * 100}%` } as React.CSSProperties) : undefined}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={cancel}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") cancel();
        }}
      >
        <div className="shimmer" />
        {placeholder ? (
          <Placeholder subject={placeholder.subject} isAi={placeholder.isAi} onReady={onLoad} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shown}
            alt={alt}
            draggable={false}
            onLoad={() => {
              setFailed(false);
              onLoad();
            }}
            onError={() => {
              if (tries < 2) setTimeout(() => setTries((t) => t + 1), 600 * (tries + 1));
              else {
                setFailed(true);
                onLoad();
              }
            }}
            decoding="async"
          />
        )}

        {failed && (
          <div className="img-failed" role="alert">
            <span>This photo didn&rsquo;t load.</span>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setFailed(false);
                setTries((t) => t + 1);
              }}
            >
              Try again
            </button>
          </div>
        )}

        {verdict && <div className="flash" aria-hidden />}

        <span className="badge" aria-hidden>
          {label}
        </span>
        {selected && (
          <span className="pick-flag" aria-hidden>
            your pick
          </span>
        )}
        {showHint && !locked && !selected && (
          <span className="hold-hint" aria-hidden>
            {LOUPE_ICON}
            hold to zoom
          </span>
        )}

        {loupe && !placeholder && (
          <div
            className="loupe"
            style={{
              left: loupe.x,
              top: loupe.y,
              backgroundImage: `url("${shown}")`,
              backgroundSize: `${loupe.w * ZOOM}px ${loupe.h * ZOOM}px`,
              backgroundPosition: `${-(loupe.x * ZOOM - loupeSize() / 2)}px ${-(loupe.y * ZOOM - loupeSize() / 2)}px`,
            }}
          />
        )}

        {tell && <div className="tell-ring" style={{ left: `${tell.x * 100}%`, top: `${tell.y * 100}%` }} />}

        {verdict && (
          <div className={`stamp ${verdict.isAi ? "ai" : "real"} ${stampCorner(tell || undefined)}`}>
            {verdict.isAi ? "AI" : "Real"}
            <small>{verdict.isAi ? "machine-made" : "photograph"}</small>
            {burst && <Burst />}
          </div>
        )}

        {verdict && (
          <div className="caption">
            {verdict.credit ? (
              <span>
                Photo{" "}
                <a href={verdict.credit.sourceUrl} target="_blank" rel="noreferrer" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
                  {verdict.credit.author}
                </a>
                {" · "}
                {verdict.credit.licenseUrl ? (
                  <a href={verdict.credit.licenseUrl} target="_blank" rel="noreferrer" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
                    {verdict.credit.license}
                  </a>
                ) : (
                  verdict.credit.license
                )}
              </span>
            ) : verdict.isAi ? (
              <span>Made by {verdict.model}</span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

const LOUPE_ICON = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

/** A little burst of confetti out of the stamp when you catch the fake. */
function Burst() {
  const bits = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2 + (i % 2) * 0.3;
    const d = 60 + ((i * 37) % 50);
    return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, r: (i * 53) % 360, c: i % 3 };
  });
  return (
    <span className="burst" aria-hidden>
      {bits.map((b, i) => (
        <i key={i} className={`c${b.c}`} style={{ "--dx": `${b.dx}px`, "--dy": `${b.dy}px`, "--r": `${b.r}deg` } as React.CSSProperties} />
      ))}
    </span>
  );
}

/** Put the stamp in the corner farthest from the tell, so it never hides it. */
function stampCorner(tell?: { x: number; y: number }) {
  if (!tell) return "at-br";
  return `at-${tell.y > 0.5 ? "t" : "b"}${tell.x > 0.5 ? "l" : "r"}`;
}

function loupeSize() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 760px)").matches ? 220 : 160;
}

/** Stand-in for rounds whose photos aren't in yet. */
function Placeholder({ subject, isAi, onReady }: { subject: string; isAi: boolean; onReady: () => void }) {
  useEffect(() => {
    const t = setTimeout(onReady, 150);
    return () => clearTimeout(t);
  }, [onReady]);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: isAi
          ? "repeating-linear-gradient(135deg, var(--paper-2) 0 12px, var(--card) 12px 24px)"
          : "linear-gradient(160deg, var(--paper-2), var(--card))",
        color: "var(--ink-3)",
        fontFamily: "var(--mono)",
        fontSize: 12,
        textAlign: "center",
        padding: 12,
      }}
    >
      <span>
        {subject}
        <br />
        <small style={{ opacity: 0.7 }}>photo pending</small>
      </span>
    </div>
  );
}
