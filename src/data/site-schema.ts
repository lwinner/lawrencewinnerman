// Structured data for the site: one graph, stable @ids, so every page points at
// the same Person. Facts come from the Brand and Metadata Workbook (final,
// Oct. 10, 2026) and bio-library.md v1.1. Rules: no birth date, no alternate
// names, no pen names, no clients, "founder" (never "owner") for projects.
const S = "https://lawrencewinnerman.com";
export const PERSON_ID = `${S}/#person`;
export const WEBSITE_ID = `${S}/#website`;
const ref = (id: string) => ({ "@id": id });

export const ONE_SENTENCE =
  "Lawrence Winnerman is a Gen X writer and strategist, a former Amazon and Microsoft program leader, writing about AI, work, democracy, and the near future.";

export const BOOKING_URL = "https://calendar.app.google/f1672UKQNTGLXVPY6";
export const EMAIL = "hello@lawrencewinnerman.com";

export const PROFILES = [
  { label: "Substack", url: "https://lwinner.substack.com/" },
  { label: "LinkedIn", url: "https://www.linkedin.com/in/lawrencewinnerman" },
  { label: "Bluesky", url: "https://bsky.app/profile/lwinner.bsky.social" },
  { label: "X", url: "https://x.com/L_Winnerman" },
  { label: "Threads", url: "https://www.threads.net/@lwinnerman" },
  { label: "Instagram", url: "https://www.instagram.com/lwinnerman" },
  { label: "Medium", url: "https://medium.com/@lwinner" },
  { label: "TikTok", url: "https://www.tiktok.com/@lawrencewinnerman" },
  { label: "Pinterest", url: "https://www.pinterest.com/lwinnerman" },
  { label: "YouTube", url: "https://www.youtube.com/@LawrenceWinnerman" },
];

// Sitewide nodes: emitted on every page.
export const sitewideGraph = [
  { "@type": "WebSite", "@id": WEBSITE_ID, url: `${S}/`, name: "Lawrence Winnerman", inLanguage: "en-US", publisher: ref(PERSON_ID), about: ref(PERSON_ID) },
  {
    "@type": "Person", "@id": PERSON_ID, name: "Lawrence Winnerman", url: `${S}/`,
    description: ONE_SENTENCE,
    disambiguatingDescription: "American writer and strategist based in Fort Wayne, Indiana; publisher of The Hinge & The Near Field and co-host of The Daily Whatever Show.",
    jobTitle: "Writer and Strategist",
    image: ref(`${S}/#headshot`),
    brand: ref(`${S}/#brand`),
    homeLocation: { "@type": "Place", name: "Fort Wayne, Indiana", address: { "@type": "PostalAddress", addressLocality: "Fort Wayne", addressRegion: "IN", addressCountry: "US" } },
    knowsAbout: ["AI and the future of work", "American democracy and power", "The near future", "Generational theory", "Speculative fiction", "Program management", "Content strategy", "Search and answer-engine optimization", "Independent publishing", "LGBTQ history", "Peptide science publishing"],
    alumniOf: [
      { "@type": "CollegeOrUniversity", name: "University of Florida", url: "https://www.ufl.edu/" },
      { "@type": "Organization", name: "Amazon", url: "https://www.amazon.com/" },
      { "@type": "Organization", name: "Microsoft", url: "https://www.microsoft.com/" },
      { "@type": "OrganizationRole", roleName: "Chief Operating Officer", startDate: "2025-09", endDate: "2026-09", alumniOf: { "@type": "Organization", name: "Blue Amp Media", url: "https://blueampmedia.com/" } },
    ],
    hasCredential: { "@type": "EducationalOccupationalCredential", credentialCategory: "degree", name: "Bachelor of Arts in English Literature, specialization in Medieval English Literature", recognizedBy: { "@type": "CollegeOrUniversity", name: "University of Florida" }, dateCreated: "1992" },
    memberOf: { "@type": "OrganizationRole", roleName: "Co-founder", memberOf: { "@type": "Organization", name: "genXy", url: "https://medium.com/genxy" } },
    email: `mailto:${EMAIL}`,
    contactPoint: { "@type": "ContactPoint", contactType: "bookings, press, and consulting", email: EMAIL, url: BOOKING_URL, availableLanguage: "en" },
    sameAs: PROFILES.map((p) => p.url),
  },
  {
    "@type": "ImageObject", "@id": `${S}/#headshot`, url: `${S}/images/lawrence-winnerman-headshot-800.jpg`, contentUrl: `${S}/images/lawrence-winnerman-headshot-800.jpg`,
    width: 800, height: 800, caption: "Lawrence Winnerman", creditText: "Lawrence Winnerman", creator: ref(PERSON_ID), copyrightHolder: ref(PERSON_ID),
    copyrightNotice: "© Lawrence Winnerman. Free for editorial use with credit.",
  },
  { "@type": "Brand", "@id": `${S}/#brand`, name: "Lawrence Winnerman", slogan: "Writing the hinge. Building the future.", logo: { "@type": "ImageObject", "@id": `${S}/#sigil`, url: `${S}/sigil-master.svg`, caption: "Lawrence Winnerman's sigil, the letters L and W as nested red chevrons." } },
];

// Homepage-only nodes.
export const homeGraph = [
  { "@type": "WebPage", "@id": `${S}/#webpage`, url: `${S}/`, name: "Lawrence Winnerman | Writer and Strategist", isPartOf: ref(WEBSITE_ID), about: ref(PERSON_ID), inLanguage: "en-US" },
  { "@type": "Blog", "@id": `${S}/#hinge`, name: "The Hinge & The Near Field", url: "https://lwinner.substack.com/", author: ref(PERSON_ID), publisher: ref(PERSON_ID), inLanguage: "en-US", sameAs: ["https://www.facebook.com/profile.php?id=61591811609154"], description: "Essays, near-future scenarios, and serialized fiction on AI, work, democracy, and the near future." },
  { "@type": "PodcastSeries", "@id": `${S}/#dws`, name: "The Daily Whatever Show", url: "https://www.thedailywhatevershow.com/", author: [ref(PERSON_ID), { "@type": "Person", name: "Dana DuBois" }], description: "Satire and news commentary, co-hosted and co-owned by Lawrence Winnerman and Dana DuBois." },
  {
    "@type": "CreativeWorkSeries", "@id": `${S}/#shattered-world`, name: "The Shattered World", author: ref(PERSON_ID),
    hasPart: [
      { "@type": "Book", "@id": `${S}/#light-shines-through`, name: "Light Shines Through", author: ref(PERSON_ID), position: 1, creativeWorkStatus: "Serializing", isPartOf: ref(`${S}/#shattered-world`), publisher: ref(`${S}/#hinge`) },
      { "@type": "Book", name: "Any Open Door", author: ref(PERSON_ID), position: 2, creativeWorkStatus: "In development", isPartOf: ref(`${S}/#shattered-world`) },
    ],
  },
];
