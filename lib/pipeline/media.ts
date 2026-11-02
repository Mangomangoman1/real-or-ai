import { createHash } from "node:crypto";
import sharp from "sharp";
import { put } from "@vercel/blob";

export const OUT_W = 1440;
export const OUT_H = 1080;

/**
 * Both the real photo and its AI twin go through exactly this step:
 * centre-crop to 4:3, resize, strip metadata, same WebP quality.
 * That way file size, sharpness and EXIF never give the answer away.
 */
export async function normalise(input: Buffer) {
  return sharp(input, { failOn: "none" })
    .rotate()
    .resize(OUT_W, OUT_H, { fit: "cover", position: "attention" })
    .webp({ quality: 80, effort: 5 })
    .toBuffer();
}

/** Opaque file names, so the URL doesn't say which one is real. */
export function opaqueName(roundId: string, kind: string) {
  const salt = process.env.MEDIA_SALT || "roai-salt-v1";
  return "m/" + createHash("sha256").update(`${salt}:${roundId}:${kind}`).digest("hex").slice(0, 20) + ".webp";
}

export async function store(roundId: string, kind: string, buf: Buffer) {
  const res = await put(opaqueName(roundId, kind), buf, {
    access: "public",
    contentType: "image/webp",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });
  return res.url;
}

export const UA = "RealOrAIGame/0.1 (daily puzzle prototype; one-time fetch of openly licensed photos)";
