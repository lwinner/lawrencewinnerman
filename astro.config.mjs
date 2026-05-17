import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://lawrencewinnerman.com',
  build: {
    inlineStylesheets: 'auto',
  },
  prefetch: true,
});
