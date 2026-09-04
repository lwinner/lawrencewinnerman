// GET /api/recent — live "Recent stories" JSON for lawrencewinnerman.com.
//
// Cloudflare Pages Function (auto-deployed from /functions alongside the static
// build). Fetches the Substack RSS on the edge, maps it with the SAME parser the
// build uses (scripts/lib/recent-feed.mjs), and returns the four newest stories.
// The client script in src/components/RecentStories.astro calls this on page
// load and swaps in anything newer than the build-time cards, so a new post
// shows up within CACHE_SECONDS of publishing — no redeploy required.
//
// Caching: the response is cached at the Cloudflare edge for CACHE_SECONDS via
// Cache-Control, and Substack's feed fetch is itself edge-cached for the same
// window (cf.cacheTtl). Worst case is one origin fetch per edge PoP per window.
//
// Failure: any fetch/parse error returns { ok: false } with a short cache so the
// client keeps the build-time cards and nothing on the page breaks.

import { collectRecent, payloadFor } from "../../scripts/lib/recent-feed.mjs";

const CACHE_SECONDS = 600; // 10 minutes
const ERROR_CACHE_SECONDS = 60;

function json(body, status, maxAge) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${maxAge}, s-maxage=${maxAge}`,
      "access-control-allow-origin": "https://lawrencewinnerman.com",
    },
  });
}

export async function onRequestGet() {
  try {
    const stories = await collectRecent();
    return json(payloadFor(stories), 200, CACHE_SECONDS);
  } catch (err) {
    console.warn(`[api/recent] feed failed: ${err && err.message}`);
    return json(
      { ok: false, generatedAt: new Date().toISOString(), stories: [] },
      200,
      ERROR_CACHE_SECONDS
    );
  }
}
