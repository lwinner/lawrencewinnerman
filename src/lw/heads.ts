// The head of each page the site draws itself (relay entry 127, decision 0019): the title, description, and
// structured data each page passed its Base layout before it moved onto Heliostet, now given by src/lw/Frame.astro.
import { PERSON_ID, WEBSITE_ID } from "../data/site-schema";
import { stories } from "../lib/stories";
import type { Story } from "../lib/stories";

/** /writing: every story, as a CollectionPage. */
export function writingHead(site: URL) {
  const title = "Essays and Fiction by Lawrence Winnerman";
  const description = "Essays, satire, and fiction by Lawrence Winnerman on AI and work, democracy and power, and the near future, with links to every place each piece lives.";
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Writing by Lawrence Winnerman",
    url: new URL("/writing", site).href,
    description,
    author: { "@id": "https://lawrencewinnerman.com/#person" },
    isPartOf: { "@id": "https://lawrencewinnerman.com/#website" },
    hasPart: stories.map((s) => ({
      "@type": "Article",
      headline: s.title,
      url: new URL(`/writing/${s.slug}`, site).href,
      datePublished: s.date,
    })),
  };
  return { title, description, ld };
}

/** /keys: The Hardware Key Guide, as an Article, with its breadcrumb. */
export function keysHead(site: URL) {
  const url = new URL("/keys", site).href;
  const pdf = "/files/hardware-key-guide.pdf";
  const title = "The Hardware Key Guide";
  const dek = "How to lock down your accounts, phone, and privacy, step by step, with no technical background.";
  const description = "A plain-language, step-by-step guide to hardware security keys, password managers, AI-scam defenses, doxxing cleanup, and protest-day phone safety. Read it here or download the PDF.";
  const published = "2026-10-23";
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      alternativeHeadline: dek,
      description,
      datePublished: published,
      dateModified: published,
      url,
      mainEntityOfPage: url,
      keywords: "security keys, passkeys, YubiKey, password manager, two-factor authentication, AI scams, doxxing, Signal, digital security",
      author: { "@id": PERSON_ID },
      publisher: { "@id": PERSON_ID },
      isPartOf: { "@id": WEBSITE_ID },
      associatedMedia: { "@type": "MediaObject", contentUrl: new URL(pdf, site).href, encodingFormat: "application/pdf", name: `${title} (PDF)` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: site.href },
        { "@type": "ListItem", position: 2, name: title, item: url },
      ],
    },
  ];
  return { title: `${title} | Lawrence Winnerman`, description, published, ld };
}

/** /writing/<slug>: a story, as an Article, with its breadcrumb and its share image. */
export function storyHead(site: URL, slug: string) {
  const s: Story = stories.find((x) => x.slug === slug)!;
  const url = new URL(`/writing/${s.slug}`, site).href;
  const description = s.summary[0].length > 155 ? s.summary[0].slice(0, 154).replace(/\s+\S*$/, "") + "…" : s.summary[0];
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: s.title,
      alternativeHeadline: s.dek,
      description,
      datePublished: s.date,
      url,
      mainEntityOfPage: url,
      image: s.image ? new URL(s.image, site).href : undefined,
      keywords: s.tags.join(", "),
      author: { "@id": PERSON_ID },
      publisher: { "@id": PERSON_ID },
      isPartOf: { "@id": WEBSITE_ID },
      sameAs: s.links.map((l) => l.url),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: site.href },
        { "@type": "ListItem", position: 2, name: "Writing", item: new URL("/writing", site).href },
        { "@type": "ListItem", position: 3, name: s.title, item: url },
      ],
    },
  ];
  return { title: `${s.title} | Lawrence Winnerman`, description, date: s.date, tags: s.tags, image: s.image ?? undefined, imageWidth: s.imageWidth, imageHeight: s.imageHeight, ld };
}
