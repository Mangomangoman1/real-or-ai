import type { Credit } from "@/lib/types";
import { UA } from "@/lib/pipeline/media";

const API = "https://commons.wikimedia.org/w/api.php";
const OK_LICENSE = /^(CC0|CC BY(-SA)? [1-4]\.0|Public domain|PD)/i;

export type Photo = { title: string; thumb: string; width: number; height: number; credit: Credit };

type Page = {
  title: string;
  index?: number;
  imageinfo?: { thumburl: string; width: number; height: number; descriptionurl: string; extmetadata?: Record<string, { value: string }> }[];
};

/**
 * Wikimedia rate-limits bursts, so calls go out two at a time and a 429 waits and retries
 * (honouring Retry-After) instead of failing the draft.
 */
let active = 0;
const waiting: (() => void)[] = [];
async function politely(url: string | URL, init?: RequestInit) {
  if (active >= 2) await new Promise<void>((r) => waiting.push(r));
  active++;
  try {
    for (let i = 0; ; i++) {
      const r = await fetch(url, { ...init, headers: { "User-Agent": UA } });
      if (r.status !== 429 && r.status !== 503) return r;
      if (i >= 4) return r;
      const after = Number(r.headers.get("retry-after")) || 2 ** i * 2;
      await new Promise((res) => setTimeout(res, Math.min(after, 20) * 1000));
    }
  } finally {
    active--;
    waiting.shift()?.();
  }
}

const strip = (h = "") => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/**
 * Commons "Quality images" only: sharp, well-exposed, reviewed by people, and always
 * under a free licence. Landscape-ish frames only, since every round is cropped to 4:3.
 */
export async function candidates(query: string, limit = 12): Promise<Photo[]> {
  const u = new URL(API);
  Object.entries({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrnamespace: "6",
    gsrlimit: String(limit),
    gsrsearch: `${query} incategory:Quality_images filetype:bitmap`,
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiextmetadatafilter: "LicenseShortName|LicenseUrl|Artist",
    iiurlwidth: "1920",
  }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await politely(u, { cache: "no-store" });
  if (!r.ok) throw new Error(`commons ${r.status}`);
  const j = (await r.json()) as { query?: { pages?: Page[] } };
  const pages = (j.query?.pages ?? []).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const out: Photo[] = [];
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii) continue;
    const m = ii.extmetadata ?? {};
    const license = strip(m.LicenseShortName?.value);
    const ratio = ii.width / ii.height;
    if (!OK_LICENSE.test(license) || ii.width < 1600 || ratio < 1.2 || ratio > 1.85) continue;
    out.push({
      title: p.title,
      thumb: ii.thumburl.split("?")[0],
      width: ii.width,
      height: ii.height,
      credit: {
        author: strip(m.Artist?.value).slice(0, 80) || "Unknown",
        license,
        licenseUrl: m.LicenseUrl?.value || undefined,
        sourceUrl: ii.descriptionurl,
        sourceName: "Wikimedia Commons",
      },
    });
  }
  return out;
}

/** Commons thumbnails come in fixed steps; swap the width in the URL. */
export function sized(thumb: string, w: number) {
  return thumb.replace(/\/(\d+)px-/, `/${w}px-`);
}

export async function bytes(url: string) {
  const r = await politely(url);
  if (!r.ok) throw new Error(`fetch ${r.status} ${url}`);
  return new Uint8Array(await r.arrayBuffer());
}
