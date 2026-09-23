# WedPix — Deployment Guide

## Requirements

| Requirement                              | Version                |
| ---------------------------------------- | ---------------------- |
| PHP                                      | 7.4+ (8.x recommended) |
| MySQL / MariaDB                          | 5.7+ / 10.3+           |
| Node.js (build machine)                  | 18+                    |
| Apache or LiteSpeed with rewrite support | ✓                      |

> [!NOTE]
> These steps assume shared/cPanel hosting. Production currently runs on a root-access
> Ubuntu VPS with **LiteSpeed and no cPanel** — where a step below assumes cPanel
> (phpMyAdmin, MultiPHP INI Editor), an SSH-only alternative is called out inline.
> The app is served from the **domain root** (`https://www.wedpix.ro/`), not a subpath.

---

## Step 1 — Prepare the Database

**cPanel:**

1. Log into **cPanel → MySQL Databases**
2. Create a database (example: `srgsgxsh_wedpix`)
3. Create a user and assign **ALL PRIVILEGES** on that database
4. Open **phpMyAdmin**, select the database
5. Click **Import** and upload `wedpix_schema.sql`

**Root/SSH (no cPanel):**

```bash
mysql -u root -p -e "CREATE DATABASE wedpix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p wedpix < wedpix_schema.sql
```

---

## Step 2 — Configure Backend (api/config.php)

Copy the safe template and edit it with your real credentials — never edit or commit
`api/config.example.php` itself:

```bash
cp api/config.example.php api/config.php
```

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'srgsgxsh_wedpix');
define('DB_USER', 'srgsgxsh_weduser');
define('DB_PASS', 'YOUR_REAL_PASSWORD');
```

Also verify that `UPLOAD_URL` and `APP_URL` match your domain (app is served at the domain root):

```php
define('APP_URL', 'https://www.wedpix.ro');
define('UPLOAD_URL', 'https://www.wedpix.ro/uploads/');
```

---

## Step 3 — Build the Frontend

On your **local machine** (requires Node 18+):

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

This produces a `dist/` folder.

---

## Step 4 — Upload Files to Hosting

Use FTP / cPanel File Manager (or `scp`/`rsync` over SSH) to upload into the **domain root**
(`public_html/`, or your vhost's docroot on a non-cPanel VPS):

```
public_html/                  (domain root — app lives here, not a subfolder)
├── api/                     ← entire api/ folder, including config.php and .user.ini
│   ├── config.php
│   ├── .user.ini             ← PHP upload-size limits (FPM/CGI hosts)
│   ├── auth/ billing/ events/ images/ slideshow/ user/ admin/ cron/ middleware/
├── uploads/
│   └── .htaccess             ← MUST be present (blocks PHP in uploads)
├── .htaccess                 ← Root .htaccess from the repo (security headers,
│                                caching, SPA routing, PHP upload limits) — upload as-is
└── (contents of dist/)       ← index.html, assets/, etc.
```

> [!IMPORTANT]
> Upload the **contents** of `dist/` into the domain root, not the `dist/` folder itself.
> The `index.html` should live at `public_html/index.html`.

---

## Step 5 — .htaccess (SPA routing, security, PHP limits)

The repo already ships a complete root `.htaccess` — **upload it as-is**, don't hand-write a
minimal version. It includes SPA rewrite rules, security headers, long-lived static-asset
caching, and `php_value` upload-size overrides for Apache/mod_php and LiteSpeed hosts.

On PHP-FPM/CGI hosts (and as a LiteSpeed fallback), also upload `api/.user.ini` — it sets
`post_max_size`/`upload_max_filesize` for video uploads. See **Troubleshooting** below if
limits don't take effect (common on LiteSpeed without cPanel).

---

## Step 6 — Set Folder Permissions

Via cPanel File Manager or FTP:

```
uploads/   → chmod 755  (PHP needs to write here)
api/       → chmod 644 for .php files, 755 for the directory
```

If uploads fail with "not writable", try `chmod 775` on the `uploads/` folder.

---

## Step 7 — Verify

| Test                                               | Expected                                  |
| -------------------------------------------------- | ----------------------------------------- |
| Open `https://www.wedpix.ro/`                      | Landing page loads                        |
| Log in → create an event → open the guest link     | Upload zone + QR code render              |
| Upload 1–3 photos (and a video, if plan allows)    | Progress bars, then ✅                    |
| Scroll gallery                                     | Photos appear, infinite-scroll loads more |
| Visit `https://www.wedpix.ro/uploads/somefile.php` | **403 Forbidden** (security ✓)            |

---

## Local Development

```bash
npm install
cp api/config.example.php api/config.php   # fill in real values
cp .env.example .env
npm run dev
```

The Vite dev server runs on `http://localhost:5173` and proxies
`/api/*` to `https://www.wedpix.ro` automatically (configured in `vite.config.js`).

> [!NOTE]
> For fully offline local dev, run XAMPP/Laragon locally, place the `api/` folder
> in your local web root, and set `VITE_API_URL`/`VITE_APP_URL` in `.env` to your
> local server (e.g. `http://localhost:8000/api`).

---

## QR Code

Generate a QR code pointing to `https://yourdomain.com/` using any free tool
(the app already generates and displays a per-event QR code automatically in
`QRCodeDisplay.jsx` — this section is only for a general venue signpost):

- [qr-code-generator.com](https://www.qr-code-generator.com)
- [qrcode.app](https://qrcode.app)

Print it at the wedding venue (table cards, reception poster, etc.).

---

## Troubleshooting

| Problem                                          | Fix                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `403 Forbidden` on API                           | Check `api/` folder permission is 755                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `500` on upload                                  | Check `uploads/` is writable (chmod 755/775)                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `event_id este obligatoriu` when uploading video | The file exceeds PHP's `post_max_size`, so PHP drops the POST body. Raise `upload_max_filesize`/`post_max_size` via `api/.user.ini` (PHP-FPM/CGI), the `php_value` block in `.htaccess` (mod_php/LiteSpeed), or cPanel's **MultiPHP INI Editor**. On a root-access LiteSpeed VPS without cPanel, edit the LSPHP `php.ini` directly (e.g. `/usr/local/lsws/lsphpXX/etc/php.ini`) and `systemctl restart lsws`. Values must exceed the largest plan `max_video_mb`. |
| Gallery empty                                    | Confirm `UPLOAD_URL` ends with `/` and is publicly accessible                                                                                                                                                                                                                                                                                                                                                                                                     |
| CORS error in browser                            | Confirm your domain is in `$allowedOrigins` in `config.php`                                                                                                                                                                                                                                                                                                                                                                                                       |
| Images don't show                                | Check PHP `finfo` extension is enabled on hosting                                                                                                                                                                                                                                                                                                                                                                                                                 |
| White page after deploy                          | Verify `base: '/'` in `vite.config.js` matches the deployed path (domain root)                                                                                                                                                                                                                                                                                                                                                                                    |
| `No such customer` Stripe error                  | A `stripe_customer_id` was created in the other Stripe mode (test vs. live). `create-checkout.php` auto-recreates the customer on the next attempt — just retry checkout.                                                                                                                                                                                                                                                                                         |
