// Home's head, checked against main's (Cowork's ruling, November 5): on Heliostet's frame, Home's title, descriptions,
// canonical, icons, manifest, Open Graph and share image, feed and sitemap links, and its whole @graph are the ones main
// draws, in its order. The fixture is main's, from its build. Run after `astro build`: npm run check:head
import { readFileSync } from "node:fs";
import { headTags } from "./lib/head-tags.mjs";

const want = JSON.parse(readFileSync(new URL("./fixtures/head-home.json", import.meta.url), "utf8"));
const got = headTags(readFileSync(new URL("../dist/index.html", import.meta.url), "utf8"));
const missing = want.filter((t) => !got.includes(t));
const extra = got.filter((t) => !want.includes(t));
const inOrder = want.every((t, i) => got[i] === t) && got.length === want.length;
for (const t of missing) console.error(`missing: ${t.slice(0, 160)}`);
for (const t of extra) console.error(`extra:   ${t.slice(0, 160)}`);
if (!missing.length && !extra.length && !inOrder) console.error("The tags are all there, in another order.");
if (!inOrder) process.exit(1);
console.log(`Home's head: ${want.length} tags, each as main draws it, in its order.`);
