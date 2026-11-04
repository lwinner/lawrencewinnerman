# lawrencewinnerman.com

The personal-brand surface for Lawrence Winnerman. A Heliostet site (Vellum & Volt's Astro package, vendored in
`vendor/` with its SHA-256 in `client.json`), served by a Cloudflare Worker in Lawrence's own Cloudflare account
(lwinner@gmail.com), never under TDWS.

## How it's built

- **The pages are data** in `site/` (relay entry 127): `site/pages/*.json` for the home page, `/writing`, `/keys`
  (locked: editable, never moved or deleted), and the 404, with `nav.json`, `site.json`, and `look.json`.
- **The look is today's** (Fork 7): Heliostet draws each page through the site's own frame (`src/lw/Frame.astro`) and
  its own components, named in `astro.config.mjs` (decision 0019). Nothing a reader sees changed in the move.
- **Addresses have no trailing slash:** `/writing`, `/writing/<slug>`, `/keys`. Every old slashed address answers a
  301 from `src/content/redirects.json`, and `/downloads/hardware-key-guide.pdf` answers one to `/files/`.
- **Files** are served at `/files/` from the site's own R2 bucket, `lawrencewinnerman-files` (`FILES` in
  `wrangler.toml`), and from `public/files/` when the bucket doesn't have one.

## Local development

```powershell
npm ci
npm run dev        # http://localhost:4321
npm run build      # outputs to ./dist, and runs Heliostet's site check
npm run preview    # wrangler dev: the Worker, the redirects, and /files/, locally
```

## Deploy

Workers Builds deploys the `lawrencewinnerman` Worker on every merge to `main`: build `npm run build`, deploy
`npx wrangler deploy`. Nothing else deploys it. Lawrence merges; Code Claude works on `drafts/code-claude/*` branches.

## Stories and Just Published

Stories and Just Published come through the Cockpit now, not the `narrareach` skill's Job 7 or the Story Pipeline:

1. **Check Substack** (`.github/workflows/substack.yml`) checks The Hinge & The Near Field every 30 minutes by day
   and hourly overnight, and runs **Rebuild** (`.github/workflows/rebuild.yml`) when there's a new post. Rebuild also
   runs once a day as the backstop.
2. **Rebuild** asks Workers Builds to build `main` again through the Worker's deploy hook (the
   `CLOUDFLARE_DEPLOY_HOOK` secret), and the build reads the newest posts into the home page's Just Published
   (`scripts/fetch-recent.mjs`, `src/data/recent.json`). A feed outage never fails the build.
3. The old daily Pages refresh (`refresh-recent-stories.yml`) is retired in place, unused. The `/api/recent` Pages
   Function and the home page's script that called it are gone: the cards are drawn at build time only, and a reading
   page carries no client script (PAGE-6).

The site's sources are Lawrence's own: The Hinge & The Near Field and Medium @lwinner. The Daily Whatever's feed is
not one of them; his TDWS pieces stay on TDWS.

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
