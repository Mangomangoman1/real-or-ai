import { createHash } from "node:crypto";
import { del, list, put } from "@vercel/blob";
import type { Draft } from "./types";

/**
 * Drafts live in Blob under opaque names, so a guessed URL can't leak answers.
 * Each save writes a new file instead of overwriting, because an overwritten
 * Blob file can be served stale for up to a minute, and a stale read made the
 * pipeline redo (and re-pay for) a stage.
 */
function dir(id: string) {
  const salt = process.env.MEDIA_SALT || "roai-salt-v1";
  return "studio/" + createHash("sha256").update(`${salt}:studio:${id}`).digest("hex").slice(0, 24) + "/";
}

export async function save(d: Draft) {
  d.updatedAt = new Date().toISOString();
  const stamp = String(Date.now()).padStart(15, "0");
  const old = (await list({ prefix: dir(d.id) })).blobs.map((b) => b.url);
  await put(dir(d.id) + stamp + ".json", JSON.stringify(d), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    cacheControlMaxAge: 31536000,
  });
  if (old.length) await del(old).catch(() => {});
  return d;
}

async function read(url: string) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`read ${r.status}`);
  return (await r.json()) as Draft;
}

/** Newest file per draft folder. */
function newest(blobs: { pathname: string; url: string }[]) {
  const by = new Map<string, { pathname: string; url: string }>();
  for (const b of blobs) {
    const folder = b.pathname.slice(0, b.pathname.lastIndexOf("/"));
    const cur = by.get(folder);
    if (!cur || b.pathname > cur.pathname) by.set(folder, b);
  }
  return [...by.values()].map((b) => b.url);
}

export async function load(id: string) {
  const { blobs } = await list({ prefix: dir(id) });
  const [url] = newest(blobs);
  return url ? read(url) : legacy(id);
}

/** Drafts saved before the versioned layout. */
async function legacy(id: string) {
  const salt = process.env.MEDIA_SALT || "roai-salt-v1";
  const p = "studio/" + createHash("sha256").update(`${salt}:studio:${id}`).digest("hex").slice(0, 24) + ".json";
  const { blobs } = await list({ prefix: p, limit: 1 });
  return blobs[0] ? read(`${blobs[0].url}?v=${Date.now()}`) : null;
}

export async function loadAll() {
  const all: { pathname: string; url: string }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "studio/", cursor, limit: 1000 });
    all.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const versioned = newest(all.filter((b) => b.pathname.split("/").length === 3));
  const flat = all.filter((b) => b.pathname.split("/").length === 2).map((b) => `${b.url}?v=${Date.now()}`);
  const urls = [...versioned, ...flat];
  const out = new Map<string, Draft>();
  for (let i = 0; i < urls.length; i += 25) {
    const got = await Promise.all(urls.slice(i, i + 25).map((u) => read(u).catch(() => null)));
    for (const d of got) {
      if (!d) continue;
      const cur = out.get(d.id);
      if (!cur || (d.updatedAt ?? "") > (cur.updatedAt ?? "")) out.set(d.id, d);
    }
  }
  return [...out.values()].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}
