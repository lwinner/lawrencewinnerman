// Build-time RSS fetch for the "Recent stories" section (spec Option A).
//
// Invoked two ways, both of which end up calling fetchRecent():
//   - the Astro integration in astro.config.mjs (astro:build:start) — the
//     primary path, so it runs on ANY `astro build` regardless of whether the
//     host calls `npm run build` or `astro build` directly;
//   - `npm run fetch:recent` for a manual refresh / debugging.
// Fetches the Substack feed(s), maps each item to card data per the build spec
// §6, and writes src/data/recent.json for RecentStories.astro to import at
// build time. No client fetch, no CORS.
//
// Refresh cadence: a daily GitHub Action pings a Cloudflare Pages Deploy Hook,
// which reruns this script on a fresh build so new posts appear (spec §5).
//
// Graceful behavior: on fetch/parse failure we DO NOT overwrite an existing
// good recent.json — the last-good data (committed to the repo) is kept so the
// section never goes empty. Only if there is no prior data do we write an
// { ok: false } payload, which makes RecentStories.astro render the archive
// fallback line instead of a broken block. The script never fails the build.

import { XMLParser } from "fast-xml-parser";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ---- Config -----------------------------------------------------------------
// H&NF only. Blue Amp merge is a one-line flag, default OFF (spec §4.2 / handoff).
const INCLUDE_BLUE_AMP = false;
const COUNT = 4;

const FEEDS = [
  { url: "https://lwinner.substack.com/feed", source: "H&NF" },
  ...(INCLUDE_BLUE_AMP
    ? [{ url: "https://www.blueamp.co/feed", source: "Blue Amp" }]
    : []),
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/data/recent.json");

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "__cdata",
  trimValues: true,
});

// ---- Helpers ----------------------------------------------------------------

// fast-xml-parser hands CDATA back under __cdata; plain text comes as a string
// (or number). Normalize any node to its string value.
function text(node) {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (typeof node === "object") {
    if (node.__cdata != null) return String(node.__cdata);
    if (node["#text"] != null) return String(node["#text"]);
  }
  return "";
}

const NAMED = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’",
  hellip: "…", mdash: "—", ndash: "–",
};

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => (name in NAMED ? NAMED[name] : m));
}

function stripHtml(html) {
  return decodeEntities(
    html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
  ).trim();
}

function excerptFrom(html, limit = 160) {
  const t = stripHtml(html);
  if (t.length <= limit) return t;
  return t.slice(0, limit).replace(/\s+\S*$/, "") + "…";
}

const AUDIO_RE = /\.(mp3|m4a|mp4|wav|ogg|aac|flac)(\?|$)/i;

// Image per spec §6 + handoff §2:
//   <enclosure type="image/*"> → <media:content url> / <media:thumbnail>
//   → first <img src> in content:encoded → none.
// Podcast posts ship an AUDIO enclosure — never treat that as an image.
function imageFrom(item, contentHtml) {
  const enc = item.enclosure;
  if (enc) {
    const encList = Array.isArray(enc) ? enc : [enc];
    for (const e of encList) {
      const type = e["@_type"] || "";
      const url = e["@_url"] || "";
      if (url && type.startsWith("image/")) return url;
    }
  }
  const mc = item["media:content"];
  if (mc) {
    const mcList = Array.isArray(mc) ? mc : [mc];
    for (const m of mcList) {
      const url = m["@_url"] || "";
      const type = m["@_medium"] || m["@_type"] || "";
      if (url && (type === "image" || type.startsWith("image/") || !type) && !AUDIO_RE.test(url)) {
        return url;
      }
    }
  }
  const mt = item["media:thumbnail"];
  if (mt) {
    const url = (Array.isArray(mt) ? mt[0] : mt)["@_url"] || "";
    if (url && !AUDIO_RE.test(url)) return url;
  }
  const m = contentHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m && !AUDIO_RE.test(m[1])) return m[1];
  return null;
}

// Pin the timezone so the formatted date is identical in local dev and in the
// (UTC) Cloudflare build — otherwise a post published near midnight GMT renders
// a different day depending on where the build runs. Eastern matches Lawrence's
// authoring context.
const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York",
});

function mapItem(item, source) {
  const title = decodeEntities(text(item.title)).trim();
  const link = text(item.link).trim();
  const guid = text(item.guid).trim() || link;
  const pubDate = text(item.pubDate).trim();
  const descHtml = text(item.description);
  const contentHtml = text(item["content:encoded"]);

  const d = new Date(pubDate);
  const iso = isNaN(d) ? null : d.toISOString();

  return {
    id: guid,
    title,
    link,
    iso,
    date: isNaN(d) ? "" : DATE_FMT.format(d),
    excerpt: excerptFrom(descHtml || contentHtml),
    image: imageFrom(item, contentHtml),
    source,
  };
}

async function fetchFeed(feed) {
  const res = await fetch(feed.url, {
    headers: { "user-agent": "lawrencewinnerman.com build bot" },
  });
  if (!res.ok) throw new Error(`${feed.url} → HTTP ${res.status}`);
  const xml = await res.text();
  const doc = parser.parse(xml);
  const channel = doc?.rss?.channel;
  if (!channel) throw new Error(`${feed.url} → no <channel>`);
  const items = Array.isArray(channel.item)
    ? channel.item
    : channel.item
    ? [channel.item]
    : [];
  return items.map((it) => mapItem(it, feed.source));
}

// ---- Main -------------------------------------------------------------------

async function build() {
  let all = [];
  for (const feed of FEEDS) {
    const items = await fetchFeed(feed); // throw → caught below → keep last-good
    all.push(...items);
  }

  // Dedupe on normalized link/guid (handles cross-posts), newest first.
  const seen = new Set();
  all = all.filter((s) => {
    const key = (s.id || s.link || s.title).replace(/[?#].*$/, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  all.sort((a, b) => new Date(b.iso || 0) - new Date(a.iso || 0));

  const stories = all.slice(0, COUNT);
  if (!stories.length) throw new Error("feed parsed but yielded 0 stories");

  const payload = {
    ok: true,
    generatedAt: new Date().toISOString(),
    source: INCLUDE_BLUE_AMP ? "H&NF + Blue Amp" : "H&NF",
    stories,
  };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log(`[recent] wrote ${stories.length} stories → src/data/recent.json`);
}

// Never throws — on failure it keeps last-good data (or writes an { ok:false }
// payload if there is none) so the build always succeeds and the section never
// renders a broken block.
export async function fetchRecent() {
  try {
    await build();
  } catch (err) {
    console.warn(`[recent] fetch failed: ${err.message}`);
    if (existsSync(OUT)) {
      try {
        const prior = JSON.parse(readFileSync(OUT, "utf8"));
        if (prior && Array.isArray(prior.stories) && prior.stories.length) {
          console.warn("[recent] keeping last-good src/data/recent.json");
          return;
        }
      } catch { /* fall through to writing an empty payload */ }
    }
    // No prior data — write an explicit failure payload so the section renders
    // the graceful archive fallback instead of a broken/empty block.
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, JSON.stringify({ ok: false, generatedAt: new Date().toISOString(), stories: [] }, null, 2) + "\n");
    console.warn("[recent] wrote fallback { ok:false } payload");
  }
}

// Run directly (npm run fetch:recent) — as opposed to being imported by the
// Astro integration.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  fetchRecent();
}
