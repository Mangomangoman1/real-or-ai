"use client";

import { Wordmark } from "@/components/Brand";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="fallback">
      <Wordmark className="fallback-mark" />
      <p className="kicker mono">
        <span className="live-dot" />
        Something went wrong
      </p>
      <h1 className="fallback-title">
        A glitch, not a <em>fake</em>.
      </h1>
      <p className="lede">The page hit a problem loading. Your scores and streak are safe in this browser.</p>
      <button className="btn btn-play" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
