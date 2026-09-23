# WedPix

A SaaS platform for wedding photo sharing. Guests scan a QR code to upload photos directly — no account or app required. Couples manage their event gallery and download all photos as a zip archive.

## Tech Stack

| Layer    | Technology                                            |
| -------- | ----------------------------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Three.js |
| Backend  | PHP 8.x, PDO/MySQL                                    |
| Payments | Stripe (Checkout + Webhooks)                          |
| Email    | Brevo (SMTP)                                          |
| Auth     | JWT + PHP sessions                                    |
| Hosting  | Apache + MySQL (cPanel / Hetzner VPS)                 |

## Features

- **QR code guest uploads** — guests upload without an account
- **Event gallery** — real-time photo feed with likes and moderation, infinite scroll, and a native-feel mobile lightbox (swipe-to-navigate, pinch-zoom + pan, swipe-down to dismiss)
- **Photo & video uploads** — plan-based size limits, with video/zip/slideshow available as per-subscription add-ons independent of the base plan
- **Live Slideshow** — fullscreen animated photo slideshow with TV/Chromecast casting (Presentation API) and optional background music
- **Zip download** — bulk download of all event photos
- **Subscription plans** — Demo (free), Silver, Gold, Platinum, each individually upgradable/downgradable with add-ons from the admin panel
- **Stripe billing** — checkout, webhooks, invoice generation, with automatic recovery from stale (test/live mode mismatch) customer IDs
- **Admin panel** — user, event, and subscription management (mobile-responsive), including per-subscription plan changes and add-on toggles
- **GDPR tooling** — data export, account deletion, cookie consent, DPA

## Plans

| Plan     | Price   | Photos    | Validity |
| -------- | ------- | --------- | -------- |
| Demo     | Free    | 50        | 2 hours  |
| Silver   | 49 RON  | 200       | 3 days   |
| Gold     | 149 RON | 1 000     | 30 days  |
| Platinum | 299 RON | Unlimited | 365 days |

## Project Structure

```
├── api/                  PHP backend endpoints
│   ├── config.php        Runtime configuration (DB, JWT, Stripe, SMTP) — git-ignored
│   ├── config.example.php  Safe placeholder template; copy to config.php
│   ├── .user.ini         PHP upload-size limits (post_max_size/upload_max_filesize)
│   ├── auth/             Login, register, me
│   ├── billing/          Stripe checkout, webhooks, invoices
│   ├── events/           Create, get, list, delete events
│   ├── images/           Upload, list, hide, like, delete, zip download
│   ├── slideshow/        Live slideshow polling (plan/add-on gated)
│   ├── user/             Profile update, export, delete
│   ├── admin/            Admin-only endpoints (users, events, images, subscriptions)
│   ├── cron/             Data retention + notification jobs
│   └── middleware/       JWT auth guard
├── src/                  React frontend
│   ├── pages/            Route-level page components
│   ├── components/       Shared UI components
│   ├── context/          AuthContext (global auth state)
│   └── utils/            API client, plan definitions
├── public/               Static assets (sitemap, robots.txt, llms.txt)
├── scripts/              Build-time scripts (sitemap generator)
├── .htaccess             Security headers, static caching, SPA routing, PHP upload limits
└── wedpix_schema.sql     Database schema
```

## Local Development

### Prerequisites

- Node.js 18+
- PHP 8.x + MySQL (e.g. XAMPP or Laragon)
- Composer (if adding PHP dependencies)

### Frontend

```bash
npm install
npm run dev        # http://localhost:5173
```

The dev server proxies `/api/*` to `https://www.wedpix.ro` by default. To point at a local PHP server, update `vite.config.js`:

```js
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
},
```

### Backend

Copy the example config and fill in real values (see [Configuration](#configuration)):

```bash
cp api/config.example.php api/config.php
cp .env.example .env

# Serve from the repo root with PHP built-in server
php -S localhost:8000
```

Import the schema into MySQL:

```sql
mysql -u root -p < wedpix_schema.sql
```

## Configuration

All runtime secrets live in `api/config.php` (git-ignored). **Never commit real credentials.**
Start from the safe template: `cp api/config.example.php api/config.php`, then fill in the
real values below:

| Constant                                      | Description                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| `DB_HOST` / `DB_NAME` / `DB_USER` / `DB_PASS` | MySQL connection                                                               |
| `JWT_SECRET`                                  | Random 32+ char string — sign/verify all tokens                                |
| `STRIPE_TEST_MODE`                            | `true` for dev (test keys, no real charges)                                    |
| `STRIPE_SECRET_KEY`                           | Stripe secret key (`sk_live_…` or `sk_test_…`)                                 |
| `STRIPE_PUBLIC_KEY`                           | Stripe publishable key                                                         |
| `STRIPE_WEBHOOK_SECRET`                       | Webhook signing secret from Stripe dashboard                                   |
| `STRIPE_PRICE_*`                              | Stripe Price IDs for each plan                                                 |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS`       | Brevo (or any SMTP) credentials                                                |
| `APP_URL` / `UPLOAD_URL`                      | Public base URLs for the app and uploads folder                                |
| `PLANS`                                       | Per-plan limits/features; merge per-subscription add-ons via `effectivePlan()` |

Front-end runtime overrides (API/App URLs) live in `.env` — copy `.env.example` to `.env`.
Switching `STRIPE_TEST_MODE` after customers already exist in the other mode requires no
manual DB cleanup: `api/billing/create-checkout.php` auto-recreates a stale Stripe customer
the first time checkout fails with a mode mismatch.

## Production Build

```bash
npm run build      # outputs to dist/
```

Upload `dist/` contents and `api/` to the web root. See [DEPLOYMENT.md](DEPLOYMENT.md) for full Apache / cPanel setup, `.htaccess` rules, and `uploads/` permission requirements.

## Database

SQL files are included:

| File                          | Purpose                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `wedpix_schema.sql`           | Main schema (events, images, users, subscriptions)                                                                  |
| `wedpix_saas_schema.sql`      | SaaS-specific tables                                                                                                |
| `wedpix_full_migration.sql`   | Full migration from legacy schema                                                                                   |
| `wedpix_extras_migration.sql` | Adds `extra_video`/`extra_zip`/`extra_slideshow` add-on columns to `subscriptions` — run once on existing databases |

## Security Notes

- `uploads/` must have an `.htaccess` blocking PHP execution (see `DEPLOYMENT.md`)
- `api/config.php` must never be committed with real secrets — use `api/config.example.php` as the shareable template
- `.gitignore` blocks config files, `.env*`, keys/certs (`.pem`/`.key`/`.ppk`/etc.), credentials files, and DB dumps/backups by default
- SSH private keys must never be stored in the repository
- Rotate all secrets if they have been accidentally committed to a public repository

## License

Private — all rights reserved. Not open source.
