// Shared Substack-feed parsing for the "Recent stories" section.
//
// ONE parser, two callers (per the one-universal-script rule):
//   - scripts/fetch-recent.mjs  — build-time: writes src/data/recent.json so the
//     first paint of the page already has cards (no-JS fallback, SEO).
//   - functions/api/recent.js   — request-time: the Cloudflare Pages Function
//     that serves fresh JSON to the client script in RecentStories.astro.
// Keep this module free of Node-only imports (fs, path) so it also runs on the
// Workers runtime. fast-xml-parser is pure JS and works in both.

import { XMLParser } from "fast-xml-parser";

// ---- Config -----------------------------------------------------------------
// H&NF only. Blue Amp merge is a one-line flag, default OFF (spec §4.2 / handoff).
export const INCLUDE_BLUE_AMP = false;
export const COUNT = 4;

export const FEEDS = [
  { url: "https://lwinner.substack.com/feed", source: "H&NF" },
  ...(INCLUDE_BLUE_AMP
    ? [{ url: "https://www.blueamp.co/feed", source: "Blue Amp" }]
    : []),
];

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

export async function fetchFeed(feed) {
  const res = await fetch(feed.url, {
    headers: { "user-agent": "lawrencewinnerman.com feed bot" },
    // Workers-only hint (ignored by Node): edge-cache Substack's XML so the
    // Pages Function never hammers the origin. Matches CACHE_SECONDS in
    // functions/api/recent.js.
    cf: { cacheTtl: 600, cacheEverything: true },
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


// Fetch every configured feed, dedupe on normalized link/guid (handles
// cross-posts), sort newest first, and return the top COUNT. Throws on any
// feed failure — callers decide how to degrade.
export async function collectRecent(count = COUNT) {
  let all = [];
  for (const feed of FEEDS) {
    const items = await fetchFeed(feed);
    all.push(...items);
  }
  const seen = new Set();
  all = all.filter((s) => {
    const key = (s.id || s.link || s.title).replace(/[?#].*$/, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  all.sort((a, b) => new Date(b.iso || 0) - new Date(a.iso || 0));
  const stories = all.slice(0, count);
  if (!stories.length) throw new Error("feed parsed but yielded 0 stories");
  return stories;
}

export function payloadFor(stories) {
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    source: INCLUDE_BLUE_AMP ? "H&NF + Blue Amp" : "H&NF",
    stories,
  };
}
