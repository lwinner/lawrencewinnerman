// Story catalog for /writing. One entry per story, however many places it lives.
// Source of truth: src/content/notes/<slug>.json (relay entry 127), one note each, which Heliostet also reads into its
// stories collection: a first-person note and links to every published version (Substack, Medium). The old
// src/content/stories.json is kept as history and read by nothing.
// Newest first; on the same day, in the order the site always showed them (src/lw/order.json), and a newer note
// that shares a day sorts by its slug.
const files = import.meta.glob<{ default: Note }>("../content/notes/*.json", { eager: true });
import order from "../lw/order.json";

type Note = {
  slug: string; title: string; dek?: string; date: string; note: string[]; tags?: string[];
  links: { label: string; platform?: string; url: string }[];
  image?: { src: string; alt?: string; width?: number; height?: number };
};
const rank = new Map((order as string[]).map((slug, i) => [slug, i]));
const fromNote = (n: Note): Story => ({
  slug: n.slug, title: n.title, dek: n.dek ?? "", date: n.date, tags: n.tags ?? [], summary: n.note,
  links: n.links.map((l) => ({ label: l.label, platform: l.platform ?? "", url: l.url })),
  image: n.image?.src ?? null,
  ...(n.image?.alt ? { imageAlt: n.image.alt } : {}),
  ...(n.image?.width ? { imageWidth: n.image.width } : {}),
  ...(n.image?.height ? { imageHeight: n.image.height } : {}),
});

export type StoryLink = { label: string; platform: string; url: string };
export type Story = {
  slug: string;
  title: string;
  dek: string;
  date: string; // YYYY-MM-DD, first publication
  tags: string[];
  summary: string[];
  links: StoryLink[];
  image: string | null;
  /** The picture's description, from its note (relay entry 127); the story's own page gives it, the cards don't. */
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
};

export const stories: Story[] = Object.values(files).map((f) => fromNote(f.default)).sort((a, b) =>
  b.date.localeCompare(a.date) || (rank.get(a.slug) ?? Infinity) - (rank.get(b.slug) ?? Infinity) || a.slug.localeCompare(b.slug)
);

export const storyPath = (s: Story) => `/writing/${s.slug}`;

const fmt = (iso: string, month: "short" | "long") =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    month, day: "numeric", year: "numeric", timeZone: "UTC",
  });
export const shortDate = (iso: string) => fmt(iso, "short");
export const longDate = (iso: string) => fmt(iso, "long");

// Map any published URL (Substack post or Medium story) to the local story page.
// Keys: "sub:<post-slug>" from a Substack /p/<slug> URL, "med:<12-hex id>" from Medium.
export function urlKey(url: string): string | null {
  try {
    const u = new URL(url);
    const p = u.pathname.replace(/\/+$/, "");
    if (u.hostname.endsWith("medium.com")) {
      const m = p.match(/-([0-9a-f]{12})$/);
      return m ? `med:${m[1]}` : null;
    }
    const m = p.match(/\/p\/([^/]+)$/);
    return m ? `sub:${m[1]}` : null;
  } catch {
    return null;
  }
}

export const pathByUrlKey: Record<string, string> = Object.fromEntries(
  stories.flatMap((s) =>
    s.links
      .map((l) => urlKey(l.url))
      .filter((k): k is string => !!k)
      .map((k) => [k, storyPath(s)])
  )
);

export const localPathFor = (url: string) => {
  const k = urlKey(url);
  return k ? pathByUrlKey[k] ?? null : null;
};
