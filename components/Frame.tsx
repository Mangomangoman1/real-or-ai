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
};

const HOLD_MS = 200;
const ZOOM = 2.8;

export default function Frame({ label, src, alt, selected, locked, ready, onLoad, onPick, verdict, showHint, placeholder }: Props) {
  const photoRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [loupe, setLoupe] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const loupeOn = useRef(false);

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

  const classes = ["frame", selected && "selected", locked && "locked", verdict?.dim && "dim"].filter(Boolean).join(" ");
  const tell = verdict?.isAi && verdict.tell;

  return (
    <div
      className={classes}
      role="button"
      tabIndex={locked ? -1 : 0}
      aria-pressed={selected}
      aria-label={`Photo ${label}${selected ? ", chosen as AI" : ""}`}
      onKeyDown={(e) => {
        if (!locked && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onPick();
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="tag" aria-hidden>
        {label}
      </span>
      {showHint && !locked && (
        <span className="hold-hint" aria-hidden>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          hold to look closer
        </span>
      )}

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
          <img src={src} alt={alt} draggable={false} onLoad={onLoad} onError={onLoad} decoding="async" />
        )}

        {loupe && !placeholder && (
          <div
            className="loupe"
            style={{
              left: loupe.x,
              top: loupe.y,
              backgroundImage: `url("${src}")`,
              backgroundSize: `${loupe.w * ZOOM}px ${loupe.h * ZOOM}px`,
              backgroundPosition: `${-(loupe.x * ZOOM - (loupeSize() / 2))}px ${-(loupe.y * ZOOM - (loupeSize() / 2))}px`,
            }}
          />
        )}

        {tell && <div className="tell-ring" style={{ left: `${tell.x * 100}%`, top: `${tell.y * 100}%` }} />}

        {verdict && (
          <div className={`stamp ${verdict.isAi ? "ai" : "real"}`}>
            {verdict.isAi ? "AI" : "Real"}
            <small>{verdict.isAi ? "machine-made" : "photograph"}</small>
          </div>
        )}
      </div>

      <div className="frame-foot">
        {verdict?.credit ? (
          <span>
            <a href={verdict.credit.sourceUrl} target="_blank" rel="noreferrer">
              {verdict.credit.author}
            </a>{" "}
            ·{" "}
            {verdict.credit.licenseUrl ? (
              <a href={verdict.credit.licenseUrl} target="_blank" rel="noreferrer">
                {verdict.credit.license}
              </a>
            ) : (
              verdict.credit.license
            )}
          </span>
        ) : verdict?.isAi ? (
          <span>Made by {verdict.model}</span>
        ) : (
          <span>{selected ? "your pick" : " "}</span>
        )}
        <span>{label === "A" ? "01" : "02"}</span>
      </div>
    </div>
  );
}

function loupeSize() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 760px)").matches ? 190 : 150;
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
