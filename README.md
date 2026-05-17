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
