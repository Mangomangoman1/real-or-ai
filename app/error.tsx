"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="shell fallback">
      <p className="issue">
        <span className="dot" />
        Something went wrong
      </p>
      <h1 className="hero-title">
        A <em>glitch</em>, not a fake.
      </h1>
      <p className="lede">The page hit a problem loading. Your scores and streak are safe in this browser.</p>
      <button className="btn btn-primary btn-wide" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
