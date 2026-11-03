import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell fallback">
      <p className="issue">
        <span className="dot" />
        404
      </p>
      <h1 className="hero-title">
        This page is <em>not real</em>.
      </h1>
      <p className="lede">There&rsquo;s nothing here. Today&rsquo;s puzzle is waiting on the front page.</p>
      <Link className="btn btn-primary btn-wide" href="/">
        Play today&rsquo;s puzzle
      </Link>
    </main>
  );
}
