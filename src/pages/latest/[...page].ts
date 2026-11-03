// /latest isn't one of the site's pages (relay entry 127): every story is at /writing. Heliostet would otherwise add its own /latest
// page, so the site claims the address. The 301 in src/content/redirects.json answers first; this builds no page.
import type { APIRoute } from "astro";
export function getStaticPaths() {
  return [{ params: { page: "1" } }];
}

export const GET: APIRoute = () => new Response("/writing", { headers: { "content-type": "text/plain; charset=utf-8" } });
