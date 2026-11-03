// /subscribe isn't one of the site's pages (relay entry 127): Subscribe is a section of the home page. Heliostet would otherwise add its own /subscribe
// page, so the site claims the address. The 301 in src/content/redirects.json answers first; this builds no page.
import type { APIRoute } from "astro";

export const GET: APIRoute = () => new Response("/#subscribe", { headers: { "content-type": "text/plain; charset=utf-8" } });
