import { createHash } from "node:crypto";
import { list, put } from "@vercel/blob";
import type { Draft } from "./types";

/** Drafts live in Blob under opaque names, so a guessed URL can't leak answers. */
function path(id: string) {
  const salt = process.env.MEDIA_SALT || "roai-salt-v1";
  return "studio/" + createHash("sha256").update(`${salt}:studio:${id}`).digest("hex").slice(0, 24) + ".json";
}

export async function save(d: Draft) {
  d.updatedAt = new Date().toISOString();
  await put(path(d.id), JSON.stringify(d), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
  return d;
}

async function read(url: string) {
  // The query string skips the CDN copy, so a just-saved draft reads back fresh.
  const r = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`read ${r.status}`);
  return (await r.json()) as Draft;
}

export async function load(id: string) {
  const { blobs } = await list({ prefix: path(id), limit: 1 });
  return blobs[0] ? read(blobs[0].url) : null;
}

export async function loadAll() {
  const urls: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "studio/", cursor, limit: 1000 });
    page.blobs.forEach((b) => urls.push(b.url));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const out: Draft[] = [];
  for (let i = 0; i < urls.length; i += 25) {
    out.push(...(await Promise.all(urls.slice(i, i + 25).map((u) => read(u).catch(() => null)))).filter((d): d is Draft => !!d));
  }
  return out.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}
