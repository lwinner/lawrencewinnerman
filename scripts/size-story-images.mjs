// Smaller copies of each story's picture (the search gate's page-speed budget, November 6): a phone takes the
// 720-pixel copy instead of the 1280-pixel original, which was the story page's Largest Contentful Paint. Writes
// public/stories/w720/<name>.webp beside each public/stories/<name>.jpg that is wider than 720 pixels, and skips
// a copy that is already there. Run after adding a story's picture:
// npm run size:images
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const dir = new URL("../public/stories/", import.meta.url);
const WIDTHS = [720];
let written = 0;
for (const name of readdirSync(dir).filter((n) => /\.(jpe?g|png|webp)$/i.test(n))) {
  const source = new URL(name, dir);
  const { width = 0 } = await sharp(fileURLToPath(source)).metadata();
  for (const w of WIDTHS) {
    if (width <= w) continue;
    const out = new URL(`w${w}/${name.replace(/\.[^.]+$/, ".webp")}`, dir);
    if (existsSync(out)) continue;
    mkdirSync(new URL(`w${w}/`, dir), { recursive: true });
    await sharp(fileURLToPath(source)).resize({ width: w }).webp({ quality: 78 }).toFile(fileURLToPath(out));
    written++;
  }
}
console.log(`${written} smaller ${written === 1 ? "copy" : "copies"} written.`);
