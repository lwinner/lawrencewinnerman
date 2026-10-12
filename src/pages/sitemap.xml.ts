// /sitemap.xml — homepage, the writing index, and every story page.
import type { APIRoute } from "astro";
import { stories } from "../lib/stories";

export const GET: APIRoute = ({ site }) => {
  const base = site!;
  // lastmod comes from real content dates, never the build date.
  const latest = stories[0]?.date ?? "2026-10-11";
  const urls = [
    { loc: new URL("/", base).href, lastmod: latest, priority: "1.0" },
    { loc: new URL("/writing/", base).href, lastmod: latest, priority: "0.9" },
    ...stories.map((s) => ({ loc: new URL(`/writing/${s.slug}/`, base).href, lastmod: s.date, priority: "0.7" })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>
`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
