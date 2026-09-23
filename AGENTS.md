# WedPix repository agent guidance

This repository is a React + Vite frontend paired with a PHP backend. Use this file to understand the app structure, build commands, and important deployment/config conventions before editing.

## What this app is

- Frontend: `src/` contains a Vite-powered React app using Tailwind CSS.
- Backend: `api/` contains PHP endpoint files for auth, billing, uploads, images, events, and user actions.
- Deployment: static frontend build plus `api/` and `uploads/` on a PHP/MySQL host.

## Key files and config

- `package.json` — `npm install`, `npm run dev`, `npm run build`, `npm run preview`
- `vite.config.js` — `base: '/'` (app is served from the domain root) and a `/api` dev-proxy to `https://www.wedpix.ro`
- `api/config.php` — backend runtime configuration, database credentials, CORS origins, JWT keys, Stripe keys, upload URL, and session cookie settings (git-ignored; never commit real secrets)
- `api/config.example.php` — safe placeholder template for `api/config.php`; copy it to get started
- `.env.example` — local front-end runtime API override template
- `api/.user.ini` + root `.htaccess` — PHP upload-size limits (`post_max_size`/`upload_max_filesize`) for video uploads; `.htaccess` also carries security headers, static-asset caching, and SPA routing
- `DEPLOYMENT.md` — authoritative deployment and troubleshooting documentation
- `dist/` — generated production build output; do not edit generated files directly

## Local development conventions

- Uses `npm`/Node.js only; there is no Yarn or pnpm workflow in this repo.
- `npm run dev` starts Vite on `http://localhost:5173`.
- Local dev frontend expects backend requests under `/api` and proxies them to `https://www.wedpix.ro` by default (see `server.proxy` in `vite.config.js`).
- For an offline local backend, use a PHP server such as XAMPP/Laragon and configure local API URLs instead of relying on the remote proxy.

## Deployment and routing notes

- The app is deployed at the domain root (`https://www.wedpix.ro/`), matching `base: '/'` in `vite.config.js`.
- `api/` paths are served directly as PHP endpoints.
- `uploads/` is a writable public folder and must be protected with `.htaccess` to block PHP execution.
- Production runs on LiteSpeed (root-access Ubuntu VPS, no cPanel). PHP upload limits must be raised via the LSPHP `php.ini` directly (or `api/.user.ini`), not cPanel's MultiPHP INI Editor. See `DEPLOYMENT.md` Troubleshooting.
- `DEPLOYMENT.md` explains the required Apache/LiteSpeed `.htaccess` rules and hosting setup.

## Agent behavior guidance

- Preserve the `base` route and API route assumptions in `vite.config.js`.
- Do not commit new production secrets into `api/config.php`; treat that file as environment-specific config.
- Avoid making manual edits in `dist/`; regenerate builds with `npm run build`.
- Use `DEPLOYMENT.md` as the source of truth for hosting, permission, and environment setup.
- There is no automated test suite in this repository, so rely on local manual validation and browser testing after changes.

## Useful patterns

- API responses use JSON helpers in `api/config.php`.
- Authentication and session config are centralized in `api/config.php` and `api/middleware/auth.php`.
- Pricing/plan rules are defined in `api/config.php` under `PLANS`. Per-subscription add-ons (`extra_video`, `extra_zip`, `extra_slideshow` columns on `subscriptions`) are merged onto a plan via `effectivePlan($plan, $subscriptionRow)` — always resolve features through this helper, never read `PLANS[...]` directly for a specific subscription.
- Admin subscription changes (`api/admin/subscriptions.php`) upsert the user's existing active subscription instead of creating duplicates; a subscription only exposes its features to the ONE event it's attached to (`events.subscription_id`).

## Styling & accessibility conventions

- Brand colors are Tailwind tokens in `tailwind.config.js`. They are tuned to meet **WCAG AA** contrast on the light `ivory` background:
  - `rose-gold` = `#8A6E34` — a deep bronze-gold, the brightest gold that still passes 4.5:1 for text and for white text on solid gold buttons. Do not lighten it back toward champagne (`#C9A96E`) for text/buttons.
  - `taupe` = `#736767` — muted/secondary text, ~5:1 on ivory.
- White text on a gold **gradient** must use two dark stops, e.g. `bg-gradient-to-r from-rose-gold to-[#6F5827]`. Never pair white text with `gold-light` (it is intentionally light and fails contrast).
- `gold-light` and low-opacity gold (`/10`, `/20`, borders, glows, icon fills) are decorative-only — keep them light.
- When adding UI, verify text/background pairs hit 4.5:1 (normal text) or 3:1 (large/≥24px or bold ≥18.66px) before committing.

## Performance conventions (Lighthouse)

- Every meaningful `<img>` must carry explicit `width`/`height` (or an aspect-ratio wrapper as in `ImageCard.jsx`) to avoid CLS. Logos use the intrinsic 297×100 ratio.
- Above-the-fold images use `loading="eager"` + `fetchpriority="high"`; below-the-fold use `loading="lazy"` + `decoding="async"`.
- The hero uses `min-h-[90svh]` (stable small-viewport height) rather than `dvh` so the mobile address-bar resize does not shift vertically-centered content.
- Heavy modules (routes, `HeroParticles3D` / three.js) are code-split via `React.lazy` + `Suspense`; keep them lazy.
- Vendor chunking is configured in `vite.config.js` `manualChunks` — preserve the grouping when adding large deps.
- Static caching lives in the root `.htaccess`: content-hashed JS/CSS are cached `1 year, immutable`; HTML is `no-cache`. Keep hashed assets long-lived and HTML uncached.
