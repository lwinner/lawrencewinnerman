import { defineConfig } from 'astro/config';
import heliostet from '@vellumandvolt/heliostet';
import { fetchRecent } from './scripts/fetch-recent.mjs';

// Regenerate src/data/recent.json from the Substack feed at the start of every
// build (spec Option A). Tying this to the build itself — rather than an npm
// `prebuild` hook — means it runs on any `astro build`, no matter how the host
// invokes it. fetchRecent() never throws, so a feed outage can't fail the build.
const recentStories = {
  name: 'recent-stories-fetch',
  hooks: {
    'astro:build:start': async () => {
      await fetchRecent();
    },
  },
};

// The site's own drawing (relay entry 127, decision 0019): Heliostet holds the pages as data in site/, and each is
// drawn by the site's own frame and components, exactly as before the move, so nothing a reader sees changes (Fork 7).
// A variant marked title draws the page's main heading.
const v = (component, title = false) => (title ? { component, title } : component);
const OWN = {
  frame: 'src/lw/Frame.astro',
  variants: {
    'hello:lw-hero': v('src/components/Hero.astro', true),
    'list:lw-featured': v('src/components/FeaturedStories.astro'),
    'prose:lw-work': v('src/components/Work.astro'),
    'list:lw-recent': v('src/components/RecentStories.astro'),
    'prose:lw-consulting': v('src/components/Consulting.astro'),
    'prose:lw-bio': v('src/components/Bio.astro'),
    'prose:lw-pull': v('src/components/PullQuote.astro'),
    'subscribe:lw-subscribe': v('src/components/Subscribe.astro'),
    'prose:lw-contact': v('src/components/Contact.astro'),
    'list:lw-writing': v('src/lw/variants/Writing.astro', true),
    'download-guide:lw-keys': v('src/lw/variants/Keys.astro', true),
    'prose:lw-not-found': v('src/lw/variants/NotFound.astro', true),
    'story-note:lw-story': v('src/lw/variants/Story.astro', true),
  },
};

export default defineConfig({
  site: 'https://lawrencewinnerman.com',
  output: 'static',
  // Addresses have no trailing slash (Lawrence's ruling, relay entry 127); each old one has a 301 in redirects.json.
  trailingSlash: 'never',
  // The site's components were written for Astro 5, which kept a space where the markup breaks a line between two
  // elements. Astro 7's default ('jsx') drops it, so the Hero's name read "LawrenceWinnerman" and the contact line
  // "athello@" (relay entry 127, Major 2). true is Astro 5's lossless compression.
  compressHTML: true,
  build: {
    format: 'file',
    inlineStylesheets: 'auto',
  },
  prefetch: true,
  devToolbar: { enabled: false },
  // Astro 7's default CSS minifier (Lightning CSS) folds the nav's backdrop-filter into its -webkit- form alone, which
  // Chrome ignores, losing the frosted nav (relay entry 127, the screenshot check). esbuild keeps both, as Astro 5 did.
  vite: { build: { cssMinify: 'esbuild' } },
  integrations: [recentStories, heliostet({ own: OWN })],
});
