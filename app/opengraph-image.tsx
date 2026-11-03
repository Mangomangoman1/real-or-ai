import { ImageResponse } from "next/og";
import { DAYS } from "@/lib/puzzles";
import { fonts, INK, INK3, OG_SIZE, PAPER, photo, RED, Wordmark } from "@/lib/og";

export const alt = "Real or AI: a daily eye test. Two photos, one is fake.";
export const size = OG_SIZE;
export const contentType = "image/png";
// Drawn on first request, then cached, so the build never depends on the network.
export const revalidate = 86400;

export default async function Image() {
  const r = DAYS[0].rounds[0];
  // A plain paper card stands in if the photos can't be fetched while building.
  const [a, b] = await Promise.all([photo(r.real.src), photo(r.ai.src)]).catch(() => [null, null]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: PAPER, padding: "56px 64px", fontFamily: "Sans" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 470 }}>
          <Wordmark size={70} />
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontFamily: "Serif", fontSize: 58, lineHeight: 1.02, color: INK }}>One is a photo. One was made by a machine.</div>
            <div style={{ fontSize: 26, color: INK3, lineHeight: 1.3 }}>Five pairs a day. Can you spot the fake?</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "Mono", fontSize: 20, color: RED, letterSpacing: "0.08em" }}>
            <div style={{ width: 12, height: 12, borderRadius: 99, background: RED }} />
            NEW PUZZLE EVERY MIDNIGHT
          </div>
        </div>
        <div style={{ display: "flex", position: "relative", flex: 1, marginLeft: 30 }}>
          {[
            [a, "A", -4, 20, 40],
            [b, "B", 3, 190, 230],
          ].map(([src, label, rot, left, top]) => (
            <div
              key={label as string}
              style={{
                position: "absolute",
                left: left as number,
                top: top as number,
                display: "flex",
                flexDirection: "column",
                background: "#fff",
                padding: "12px 12px 34px",
                transform: `rotate(${rot}deg)`,
                boxShadow: "0 18px 40px -14px rgba(40,30,10,.45)",
              }}
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src as string} width={400} height={300} alt="" style={{ objectFit: "cover" }} />
              ) : (
                <div style={{ width: 400, height: 300, background: "#ebe5d8", display: "flex" }} />
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Mono", fontSize: 18, color: INK3, marginTop: 8 }}>
                <span>{label as string}</span>
                <span>real or ai?</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: await fonts() },
  );
}
