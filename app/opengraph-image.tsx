import { ImageResponse } from "next/og";
import { BASE_DAYS as DAYS } from "@/lib/puzzles";
import { BG, CREAM, fonts, INK2, INK3, OG_SIZE, photo, RED, Wordmark } from "@/lib/og";

export const alt = "Sloppity: real or AI? Two photos, one is AI slop. Spot it.";
export const size = OG_SIZE;
export const contentType = "image/png";
// Drawn on first request, then cached, so the build never depends on the network.
export const revalidate = 86400;

export default async function Image() {
  const r = DAYS[0].rounds[0];
  // Blank frames stand in if the photos can't be fetched while building.
  const [a, b] = await Promise.all([photo(r.real.src), photo(r.ai.src)]).catch(() => [null, null]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: BG, padding: "64px 0 56px 72px", fontFamily: "Sans", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 630, display: "flex", backgroundImage: "radial-gradient(circle at 72% 50%, rgba(255,128,72,0.16), rgba(11,10,9,0) 45%)" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 540 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "Mono", fontSize: 20, color: INK3, letterSpacing: "0.12em" }}>
            <div style={{ width: 12, height: 12, borderRadius: 99, background: RED }} />
            A DAILY GAME
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Wordmark size={138} />
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: "Display", fontWeight: 600, fontSize: 44, color: INK2, letterSpacing: "-0.02em" }}>
              Real or
              <span style={{ fontFamily: "Mono", fontWeight: 700, color: RED, border: `4px solid ${RED}`, borderRadius: 10, padding: "0 10px", fontSize: 38, transform: "rotate(-3deg)" }}>AI</span>
              <span style={{ marginLeft: -8 }}>?</span>
            </div>
          </div>
          <div style={{ fontSize: 28, color: CREAM, lineHeight: 1.3 }}>Five pairs a day. One photo in each is real. Spot the slop.</div>
        </div>
        <div style={{ display: "flex", position: "relative", flex: 1 }}>
          {[
            [a, "A", -5, 40, 40],
            [b, "B", 4, 170, 230],
          ].map(([src, label, rot, left, top]) => (
            <div
              key={label as string}
              style={{
                position: "absolute",
                left: left as number,
                top: top as number,
                display: "flex",
                borderRadius: 22,
                overflow: "hidden",
                transform: `rotate(${rot}deg)`,
                boxShadow: "0 30px 60px -20px rgba(0,0,0,.9), 0 0 0 2px rgba(255,255,255,.08)",
              }}
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src as string} width={400} height={300} alt="" style={{ objectFit: "cover" }} />
              ) : (
                <div style={{ width: 400, height: 300, background: "#211e1b", display: "flex" }} />
              )}
              <div style={{ position: "absolute", left: 16, top: 16, width: 54, height: 54, borderRadius: 99, background: "rgba(12,11,10,.6)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Display", fontWeight: 800, fontSize: 28, color: "#fff" }}>
                {label as string}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: await fonts() },
  );
}
