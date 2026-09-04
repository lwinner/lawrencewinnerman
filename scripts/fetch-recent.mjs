// Build-time RSS fetch for the "Recent stories" section.
//
// Invoked two ways, both of which end up calling fetchRecent():
//   - the Astro integration in astro.config.mjs (astro:build:start) — the
//     primary path, so it runs on ANY `astro build` regardless of whether the
//     host calls `npm run build` or `astro build` directly;
//   - `npm run fetch:recent` for a manual refresh / debugging.
// Writes src/data/recent.json for RecentStories.astro to import at build time.
// That gives the page a correct FIRST PAINT; freshness between deploys comes
// from functions/api/recent.js + the client script in RecentStories.astro,
// which share the parser in scripts/lib/recent-feed.mjs.
//
// Graceful behavior: on fetch/parse failure we DO NOT overwrite an existing
// good recent.json — the last-good data (committed to the repo) is kept so the
// section never goes empty. Only if there is no prior data do we write an
// { ok: false } payload, which makes RecentStories.astro render the archive
// fallback line instead of a broken block. The script never fails the build.

import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectRecent, payloadFor } from "./lib/recent-feed.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/data/recent.json");

async function build() {
  const stories = await collectRecent(); // throw → caught below → keep last-good
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(payloadFor(stories), null, 2) + "\n");
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
