import Link from "next/link";
import { Wordmark } from "@/components/Brand";

export default function NotFound() {
  return (
    <main className="fallback">
      <Wordmark className="fallback-mark" />
      <p className="kicker mono">
        <span className="live-dot" />
        404
      </p>
      <h1 className="fallback-title">
        This page is <em>not real</em>.
      </h1>
      <p className="lede">There&rsquo;s nothing here. Today&rsquo;s puzzle is waiting on the front page.</p>
      <Link className="btn btn-play" href="/">
        Play today&rsquo;s puzzle
      </Link>
    </main>
  );
}
