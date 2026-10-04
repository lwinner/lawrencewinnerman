// /sitemap.xml — homepage, the writing index, and every story page.
import type { APIRoute } from "astro";
import { stories } from "../lib/stories";

export const GET: APIRoute = ({ site }) => {
  const base = site!;
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: new URL("/", base).href, lastmod: today, priority: "1.0" },
    { loc: new URL("/writing/", base).href, lastmod: stories[0]?.date ?? today, priority: "0.9" },
    ...stories.map((s) => ({ loc: new URL(`/writing/${s.slug}/`, base).href, lastmod: s.date, priority: "0.7" })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>
`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
