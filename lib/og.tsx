import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

export const OG_SIZE = { width: 1200, height: 630 };
export const BG = "#0b0a09";
export const CREAM = "#f3ede2";
export const INK2 = "#b7afa1";
export const INK3 = "#7b7469";
export const RED = "#ff4d36";
export const GREEN = "#5ad891";

const font = (f: string) => readFile(join(process.cwd(), "assets/fonts", f));

export async function fonts() {
  const [serif, serifItalic, mono, monoBold, sans, display, display6] = await Promise.all([
    font("instrument-serif-latin-400-normal.woff"),
    font("instrument-serif-latin-400-italic.woff"),
    font("jetbrains-mono-latin-500-normal.woff"),
    font("jetbrains-mono-latin-700-normal.woff"),
    font("inter-tight-latin-500-normal.woff"),
    font("bricolage-grotesque-latin-800-normal.woff"),
    font("bricolage-grotesque-latin-600-normal.woff"),
  ]);
  return [
    { name: "Serif", data: serif, style: "normal" as const, weight: 400 as const },
    { name: "Serif", data: serifItalic, style: "italic" as const, weight: 400 as const },
    { name: "Mono", data: mono, style: "normal" as const, weight: 500 as const },
    { name: "Mono", data: monoBold, style: "normal" as const, weight: 700 as const },
    { name: "Sans", data: sans, style: "normal" as const, weight: 500 as const },
    { name: "Display", data: display, style: "normal" as const, weight: 800 as const },
    { name: "Display", data: display6, style: "normal" as const, weight: 600 as const },
  ];
}

/** Share images can't draw WebP, so photos are turned into small JPEGs first. */
export async function photo(url: string, w = 520) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`photo ${r.status}`);
  const buf = await sharp(Buffer.from(await r.arrayBuffer())).resize(w, Math.round((w * 3) / 4)).jpeg({ quality: 82 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

/** The Sloppity wordmark: chunky lowercase, the i's dot a drop of safelight red. */
export function Wordmark({ size = 64, color = CREAM }: { size?: number; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", fontFamily: "Display", fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: "-0.05em", color }}>
      <span>slopp</span>
      <span style={{ position: "relative", display: "flex" }}>
        ı
        <span style={{ position: "absolute", left: "50%", top: size * 0.1, width: size * 0.175, height: size * 0.175, marginLeft: -size * 0.0875, borderRadius: 999, background: RED }} />
      </span>
      <span>ty</span>
    </div>
  );
}
