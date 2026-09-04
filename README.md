# lawrencewinnerman.com

The personal-brand surface for Lawrence Winnerman. Built in Astro, deployed on Cloudflare Pages.

## Local development

```powershell
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs to ./dist
npm run preview    # serves the built site locally
```

## Deploy

Pushes to `main` auto-deploy via Cloudflare Pages.

## Recent Stories Feed

The "Recent stories" section (`src/components/RecentStories.astro`) shows the four newest posts from the Hinge & Near Field Substack. It has two layers that share one parser (`scripts/lib/recent-feed.mjs`):

1. **Build time.** `scripts/fetch-recent.mjs` runs from an Astro integration on every build and writes `src/data/recent.json`, so the first paint already has cards and the section works with JavaScript off. A feed outage never fails the build; the last-good JSON is kept.
2. **Load time.** `functions/api/recent.js` is a Cloudflare Pages Function at `/api/recent` that fetches the feed on the edge (cached ten minutes) and returns the live top four. A small client script in `RecentStories.astro` calls it on load and swaps in newer cards. New posts appear within about ten minutes of publishing with no redeploy.

The daily GitHub Action (`.github/workflows/refresh-recent-stories.yml`) is optional belt-and-suspenders that keeps the build-time cards fresh; it needs the `CF_DEPLOY_HOOK_URL` secret to do anything.

Local check of the function: `npx wrangler pages dev dist` after `npm run build`, then `curl http://127.0.0.1:8788/api/recent`.

## Brand authority

This site implements the locked brand system documented in:
- `../brand-foundation.md` — thesis, pillars, tagline
- `../brand-assets/brand-reference.md` — colors, sigil, type, weight set

Visual identity is locked. Do not introduce new colors, fonts, or geometry without updating the foundation docs first.

## Typography

Adobe Typekit, kit ID `qbo5oht`. Loaded via `<link>` in `src/layouts/Base.astro`.
- Display: Arno Pro Display (700, 400 Italic)
- Subhead: Arno Pro Subhead (700)
- Body: Arno Pro (400, 400 Italic)
- UI: Acumin Pro (400, 500, 600)
