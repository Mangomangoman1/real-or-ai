import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

export const OG_SIZE = { width: 1200, height: 630 };
export const PAPER = "#f2eee5";
export const INK = "#1b1a17";
export const INK3 = "#8b8578";
export const RED = "#d9412e";
export const GREEN = "#2f6f4e";

const font = (f: string) => readFile(join(process.cwd(), "assets/fonts", f));

export async function fonts() {
  const [serif, serifItalic, mono, monoBold, sans] = await Promise.all([
    font("instrument-serif-latin-400-normal.woff"),
    font("instrument-serif-latin-400-italic.woff"),
    font("jetbrains-mono-latin-500-normal.woff"),
    font("jetbrains-mono-latin-700-normal.woff"),
    font("inter-tight-latin-500-normal.woff"),
  ]);
  return [
    { name: "Serif", data: serif, style: "normal" as const, weight: 400 as const },
    { name: "Serif", data: serifItalic, style: "italic" as const, weight: 400 as const },
    { name: "Mono", data: mono, style: "normal" as const, weight: 500 as const },
    { name: "Mono", data: monoBold, style: "normal" as const, weight: 700 as const },
    { name: "Sans", data: sans, style: "normal" as const, weight: 500 as const },
  ];
}

/** Share images can't draw WebP, so photos are turned into small JPEGs first. */
export async function photo(url: string, w = 520) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`photo ${r.status}`);
  const buf = await sharp(Buffer.from(await r.arrayBuffer())).resize(w, Math.round((w * 3) / 4)).jpeg({ quality: 82 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

export function Wordmark({ size = 64 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.22, color: INK }}>
      <span style={{ fontFamily: "Serif", fontStyle: "italic", fontSize: size * 1.25, lineHeight: 1 }}>Real</span>
      <span style={{ fontFamily: "Mono", fontSize: size * 0.34, color: INK3, letterSpacing: "0.12em" }}>OR</span>
      <span
        style={{
          fontFamily: "Mono",
          fontWeight: 700,
          fontSize: size * 0.62,
          border: `${Math.max(3, size * 0.05)}px solid ${INK}`,
          borderRadius: size * 0.1,
          padding: `${size * 0.02}px ${size * 0.14}px`,
          lineHeight: 1.1,
        }}
      >
        AI
      </span>
    </div>
  );
}
