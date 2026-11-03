import "server-only";
import { ImageResponse } from "next/og";
import { fonts } from "./og";

/** The app icon: the machine half of the wordmark, stamped on darkroom black with a safelight dot. */
export async function icon(px: number) {
  const f = (await fonts()).filter((x) => x.name === "Mono");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1b1a17", borderRadius: px >= 128 ? 0 : px * 0.22, position: "relative" }}>
        <div
          style={{
            fontFamily: "Mono",
            fontWeight: 700,
            fontSize: px * 0.4,
            color: "#f2eee5",
            border: `${Math.max(2, px * 0.045)}px solid #f2eee5`,
            borderRadius: px * 0.08,
            padding: `${px * 0.01}px ${px * 0.07}px`,
            lineHeight: 1.1,
          }}
        >
          AI
        </div>
        <div style={{ position: "absolute", top: px * 0.16, right: px * 0.16, width: px * 0.11, height: px * 0.11, borderRadius: 99, background: "#d9412e" }} />
      </div>
    ),
    { width: px, height: px, fonts: f },
  );
}
