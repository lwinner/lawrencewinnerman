// Story catalog for /writing. One entry per story, however many places it lives.
// Source of truth: src/content/stories.json (newest first). Each story has a
// first-person summary and links to every published version (Substack, Medium).
import data from "../content/stories.json";

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
  imageWidth?: number;
  imageHeight?: number;
};

export const stories: Story[] = [...(data.stories as Story[])].sort((a, b) =>
  b.date.localeCompare(a.date)
);

export const storyPath = (s: Story) => `/writing/${s.slug}/`;

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
