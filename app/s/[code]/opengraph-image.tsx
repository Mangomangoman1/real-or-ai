import { ImageResponse } from "next/og";
import { fonts, GREEN, INK, INK3, OG_SIZE, PAPER, RED, Wordmark } from "@/lib/og";
import { parseShare } from "@/lib/share";

export const alt = "A Real or AI result";
export const size = OG_SIZE;
export const contentType = "image/png";

const LINES = ["A clean sweep, for the robots.", "Fooled four times.", "The machines are winning.", "Better than a coin flip.", "Hard to fool.", "A sharp eye."];

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const s = parseShare((await params).code) ?? { no: 1, picks: [], score: 0 };
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: PAPER, padding: "56px 68px", fontFamily: "Sans" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Wordmark size={60} />
          <div style={{ fontFamily: "Mono", fontSize: 24, color: INK3, letterSpacing: "0.08em" }}>{`NO. ${String(s.no).padStart(3, "0")}`}</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 28 }}>
          <div style={{ fontFamily: "Serif", fontSize: 230, lineHeight: 0.8, color: INK }}>{s.score}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 18 }}>
            <div style={{ fontFamily: "Mono", fontSize: 28, color: INK3 }}>{`of ${s.picks.length} spotted`}</div>
            <div style={{ fontFamily: "Serif", fontStyle: "italic", fontSize: 48, color: INK }}>{LINES[s.score] ?? ""}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 14 }}>
            {s.picks.map((p, i) => (
              <div key={i} style={{ width: 64, height: 64, borderRadius: 12, background: p ? GREEN : RED, display: "flex" }} />
            ))}
          </div>
          <div style={{ fontSize: 30, color: INK }}>Can you beat it?</div>
        </div>
      </div>
    ),
    { ...size, fonts: await fonts() },
  );
}
