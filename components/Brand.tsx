/** The wordmark: lowercase and chunky, with the i's dot in safelight red, like a drop of slop. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`} aria-label="Sloppity" role="img">
      <span aria-hidden>slopp</span>
      <span className="wm-i" aria-hidden>
        ı<span className="wm-dot" />
      </span>
      <span aria-hidden>ty</span>
    </span>
  );
}

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const Icon = {
  calendar: (
    <svg viewBox="0 0 24 24" {...S}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" {...S}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" {...S}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" {...S}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" {...S}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  share: (
    <svg viewBox="0 0 24 24" {...S} strokeWidth={2}>
      <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" {...S} strokeWidth={2.2}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" {...S} strokeWidth={3}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  cross: (
    <svg viewBox="0 0 24 24" {...S} strokeWidth={3}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </svg>
  ),
  loupe: (
    <svg viewBox="0 0 24 24" {...S} strokeWidth={2.2}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  ),
  tap: (
    <svg viewBox="0 0 24 24" {...S}>
      <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V12m0-1a1.5 1.5 0 0 1 3 0v4.5a5.5 5.5 0 0 1-5.5 5.5h-1A5.5 5.5 0 0 1 7 16.6L5.2 13.5a1.5 1.5 0 0 1 2.5-1.6L9 13.5" />
    </svg>
  ),
  bulb: (
    <svg viewBox="0 0 24 24" {...S}>
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z" />
    </svg>
  ),
  flame: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.5c.4 3.3-1.6 5-3.2 6.8C7.3 11 6 12.8 6 15.2A6 6 0 0 0 18 15c0-2.7-1.4-4.4-2.6-5.7-.3 1.4-1 2.4-2 2.9.6-3.5-.2-7.1-1.4-9.7z" />
    </svg>
  ),
};
