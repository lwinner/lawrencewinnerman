// A page's head as search and sharing see it: the title, meta, links, and structured data, in order, without Heliostet's
// charset, viewport, stylesheets, and font preconnects, and with &amp; read as & (scripts/check-head.mjs).
export function headTags(html) {
  const head = html.slice(0, html.indexOf("</head>")).replace(/<style[^>]*>[\s\S]*?<\/style>/g, "");
  const tags = head.match(/<title>[^<]*<\/title>|<meta [^>]*>|<link [^>]*>|<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g) ?? [];
  return tags.filter((t) => !/charset|viewport|rel="(stylesheet|preconnect|preload)"/.test(t)).map((t) => t.replace(/\s*\/?>$/, ">").replace(/&amp;/g, "&"));
}
