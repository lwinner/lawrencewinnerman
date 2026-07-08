import { defineConfig } from 'astro/config';
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

export default defineConfig({
  site: 'https://lawrencewinnerman.com',
  build: {
    inlineStylesheets: 'auto',
  },
  prefetch: true,
  integrations: [recentStories],
});
