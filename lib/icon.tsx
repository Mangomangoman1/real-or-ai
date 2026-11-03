import "server-only";
import { ImageResponse } from "next/og";
import { fonts } from "./og";

/** The app icon: a chunky lowercase s on darkroom black, with the red drop from the wordmark. */
export async function icon(px: number) {
  const f = (await fonts()).filter((x) => x.name === "Display");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0a09", borderRadius: px >= 128 ? 0 : px * 0.22, position: "relative" }}>
        <div style={{ fontFamily: "Display", fontWeight: 800, fontSize: px * 0.86, lineHeight: 1, color: "#f3ede2", marginTop: -px * 0.14, letterSpacing: "-0.04em" }}>s</div>
        <div style={{ position: "absolute", top: px * 0.17, right: px * 0.17, width: px * 0.17, height: px * 0.17, borderRadius: 999, background: "#ff4d36" }} />
      </div>
    ),
    { width: px, height: px, fonts: f },
  );
}
