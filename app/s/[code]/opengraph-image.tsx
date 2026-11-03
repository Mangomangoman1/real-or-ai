import { ImageResponse } from "next/og";
import { BG, CREAM, fonts, GREEN, INK2, INK3, OG_SIZE, RED, Wordmark } from "@/lib/og";
import { parseShare } from "@/lib/share";

export const alt = "A Sloppity result";
export const size = OG_SIZE;
export const contentType = "image/png";

const RANK = ["Fully slopped", "Easily slopped", "Half-slopped", "Hard to fool", "Sharp-eyed", "Slop-proof"];

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const s = parseShare((await params).code) ?? { no: 1, picks: [], score: 0 };
  const tone = s.score >= 4 ? GREEN : s.score <= 1 ? RED : CREAM;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: BG, padding: "54px 72px", fontFamily: "Sans" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Wordmark size={64} />
          <div style={{ fontFamily: "Mono", fontSize: 24, color: INK3, letterSpacing: "0.1em" }}>{`NO. ${String(s.no).padStart(3, "0")}`}</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 34 }}>
          <div style={{ fontFamily: "Display", fontWeight: 800, fontSize: 250, lineHeight: 0.8, color: CREAM, letterSpacing: "-0.06em", display: "flex" }}>{String(s.score)}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingBottom: 12 }}>
            <div style={{ fontFamily: "Mono", fontSize: 26, color: INK3, letterSpacing: "0.08em" }}>{`OF ${s.picks.length} SPOTTED`}</div>
            <div style={{ fontFamily: "Display", fontWeight: 800, fontSize: 76, color: tone, letterSpacing: "-0.04em", lineHeight: 1 }}>{RANK[s.score] ?? ""}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 14 }}>
            {s.picks.map((p, i) => (
              <div key={i} style={{ width: 70, height: 70, borderRadius: 16, background: p ? GREEN : RED, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Display", fontWeight: 800, fontSize: 36, color: p ? "#06140c" : "#fff" }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={p ? "#06140c" : "#fff"} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={p ? "M5 12.5l4.5 4.5L19 7.5" : "M6.5 6.5l11 11M17.5 6.5l-11 11"} />
                </svg>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: "Display", fontWeight: 600, fontSize: 36, color: INK2, letterSpacing: "-0.02em" }}>Can you beat it?</div>
        </div>
      </div>
    ),
    { ...size, fonts: await fonts() },
  );
}
