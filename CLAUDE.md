# CLAUDE.md

Guidance for Claude / AI agents working in the WedPix repository.

> **Source of truth:** [`AGENTS.md`](AGENTS.md) holds the full app structure, build
> commands, and deployment/config conventions. Read it first. This file summarizes
> the points most often needed while editing and mirrors the conventions there.

## Quick facts

- **Stack:** React + Vite + Tailwind CSS frontend (`src/`); PHP + MySQL backend (`api/`).
- **Package manager:** `npm` only (no Yarn/pnpm).
- **Commands:** `npm install`, `npm run dev` (Vite on `http://localhost:5173`),
  `npm run build` (also regenerates `public/sitemap.xml`), `npm run preview`.
- **No automated test suite** — validate changes with a build and manual browser testing.
- Never edit `dist/` by hand; regenerate with `npm run build`.
- Do not commit production secrets into `api/config.php` (environment-specific config; copy from `api/config.example.php` to bootstrap).
- The app is deployed at the domain root (`base: '/'` in `vite.config.js`), not under a subpath.
- Production host is a root-access Ubuntu VPS running LiteSpeed (no cPanel) — see `DEPLOYMENT.md` Troubleshooting for PHP upload-limit tuning.

## Styling & accessibility (WCAG AA)

Brand colors are Tailwind tokens in `tailwind.config.js`, tuned for AA contrast on the
light `ivory` background:

- `rose-gold` = `#8A6E34` — deep bronze-gold; brightest gold that passes 4.5:1 for text
  and for white text on solid gold buttons. Do **not** revert it to champagne `#C9A96E`.
- `taupe` = `#736767` — muted/secondary text (~5:1 on ivory).
- White text on a gold **gradient** needs two dark stops:
  `bg-gradient-to-r from-rose-gold to-[#6F5827]`. Never put white text on `gold-light`.
- `gold-light` and low-opacity gold (borders, `/10`–`/20` fills, glows, icons) are
  decorative-only — keep them light.
- Check every text/background pair: 4.5:1 for normal text, 3:1 for large/bold text.

## Performance (Lighthouse)

- Give every meaningful `<img>` explicit `width`/`height` (or an aspect-ratio wrapper like
  `ImageCard.jsx`) to prevent CLS.
- Above-the-fold images: `loading="eager"` + `fetchpriority="high"`; below-the-fold:
  `loading="lazy"` + `decoding="async"`.
- The hero uses `min-h-[90svh]` (stable) instead of `dvh` to avoid mobile viewport-resize CLS.
- Keep heavy modules (routes, `HeroParticles3D`/three.js) code-split via `React.lazy` + `Suspense`.
- Preserve the `manualChunks` vendor grouping in `vite.config.js` when adding large deps.
- Root `.htaccess` caches content-hashed JS/CSS `1 year, immutable` and HTML `no-cache` —
  keep hashed assets long-lived and HTML uncached.

## Plans & subscriptions

- Plan features (video, zip, slideshow, size limits) live in `PLANS` in `api/config.php`.
- Per-subscription add-ons (`extra_video`/`extra_zip`/`extra_slideshow`) are merged onto the base plan via `effectivePlan($plan, $subscriptionRow)` — always resolve features through this helper, not `PLANS[...]` directly.
- One subscription powers exactly one event (`events.subscription_id`); admin edits must target the subscription actually attached to the event.

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for the authoritative hosting, `.htaccess`, and
permission setup. `api/` paths are served as PHP endpoints; `uploads/` is public/writable
and must block PHP execution via its own `.htaccess`.
