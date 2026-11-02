import { UA } from "./media";

export type Candidate = {
  title: string;
  thumb: string;
  thumb1600: string;
  width: number;
  height: number;
  author: string;
  license: string;
  licenseUrl: string;
  pageUrl: string;
};

const API = "https://commons.wikimedia.org/w/api.php";

function strip(html = "") {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function clean(u = "") {
  return u.split("?")[0];
}

type Page = {
  title: string;
  index?: number;
  imageinfo?: {
    thumburl: string;
    width: number;
    height: number;
    descriptionurl: string;
    extmetadata?: Record<string, { value: string }>;
  }[];
};

async function query(params: Record<string, string>) {
  const u = new URL(API);
  Object.entries({
    action: "query",
    format: "json",
    formatversion: "2",
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiextmetadatafilter: "LicenseShortName|LicenseUrl|Artist",
    ...params,
  }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u, { headers: { "User-Agent": UA }, cache: "no-store" });
  if (!r.ok) throw new Error(`commons ${r.status}`);
  const j = (await r.json()) as { query?: { pages?: Page[] } };
  return (j.query?.pages ?? []).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}

function toCandidate(p: Page, big: Page | undefined): Candidate | null {
  const ii = p.imageinfo?.[0];
  if (!ii) return null;
  const m = ii.extmetadata ?? {};
  return {
    title: p.title,
    thumb: clean(ii.thumburl),
    thumb1600: clean(big?.imageinfo?.[0]?.thumburl ?? ii.thumburl),
    width: ii.width,
    height: ii.height,
    author: strip(m.Artist?.value).slice(0, 80),
    license: strip(m.LicenseShortName?.value),
    licenseUrl: m.LicenseUrl?.value ?? "",
    pageUrl: ii.descriptionurl,
  };
}

export async function search(q: string, limit = 8) {
  const pages = await query({
    generator: "search",
    gsrnamespace: "6",
    gsrlimit: String(limit),
    gsrsearch: `${q} filetype:bitmap`,
    iiurlwidth: "420",
  });
  return pages.map((p) => toCandidate(p, undefined)).filter(Boolean) as Candidate[];
}

export async function meta(titles: string[]) {
  const pages = await query({ titles: titles.join("|"), iiurlwidth: "1600" });
  return pages.map((p) => toCandidate(p, p)).filter(Boolean) as Candidate[];
}
