<?php
// ============================================================
// WedPix SaaS — api/events/create.php
// POST {subscription_id, name, description?, event_date?}
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';

// Ensure session is started to access CSRF token from cookies
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once dirname(__DIR__) . '/middleware/auth.php';
require_once dirname(__DIR__) . '/email/mailer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Method not allowed', 405);

// ── CSRF protection ────────────────────────────────────────────
requireCSRF();

$auth = requireAuth();
$body = json_decode(file_get_contents('php://input'), true) ?? [];
$db   = getDB();

$subId      = (int)($body['subscription_id'] ?? 0);
$name       = trim($body['name']        ?? '');
$desc       = trim($body['description'] ?? '');
$eventDate  = trim($body['event_date']  ?? '');

if (!$name) sendError('Numele evenimentului este obligatoriu.');

// ── Verify subscription belongs to user and is active ─────────
$subStmt = $db->prepare(
    'SELECT s.id, s.plan, s.expires_at, s.extra_video, s.extra_zip, s.extra_slideshow,
            s.extra_validity_days, s.extra_photo_limit
     FROM   subscriptions s
     WHERE  s.id = ? AND s.user_id = ? AND s.status = "active"'
);
$subStmt->execute([$subId, $auth['user_id']]);
$sub = $subStmt->fetch();
if (!$sub) sendError('Abonament invalid sau inactiv.', 403);

// ── Check subscription not already used for an event ──────────
$usedStmt = $db->prepare('SELECT id FROM events WHERE subscription_id = ?');
$usedStmt->execute([$subId]);
if ($usedStmt->fetch()) sendError('Acest abonament este deja utilizat pentru un eveniment.', 409);

// ── Generate unique slug ───────────────────────────────────────
function generateSlug(string $name): string
{
    $slug = mb_strtolower($name, 'UTF-8');
    $slug = preg_replace('/[^a-z0-9\s-]/u', '', transliterator_transliterate('Any-Latin; Latin-ASCII', $slug) ?? $slug);
    $slug = preg_replace('/[\s_]+/', '-', $slug);
    $slug = preg_replace('/-+/', '-', $slug);
    return trim($slug, '-');
}

$baseSlug = generateSlug($name) ?: 'event';
$slug     = $baseSlug;
$db2      = getDB();
$i        = 1;
while (true) {
    $chk = $db2->prepare('SELECT id FROM events WHERE slug = ?');
    $chk->execute([$slug]);
    if (!$chk->fetch()) break;
    $slug = $baseSlug . '-' . $i++;
}

// ── Calculate expiry from subscription plan (+ any purchased add-ons) ──
$plan      = effectivePlan($sub['plan'], $sub);
$validitySeconds = (int)($plan['validity_days'] * 86400);
$expiresAt = date('Y-m-d H:i:s', time() + $validitySeconds);

// ── Create upload directory ────────────────────────────────────
// We'll create it after we have the event_id

// ── Insert event ──────────────────────────────────────────────
$stmt = $db->prepare(
    'INSERT INTO events (user_id, subscription_id, name, slug, description, event_date, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)'
);
$stmt->execute([
    $auth['user_id'],
    $subId,
    $name,
    $slug,
    $desc ?: null,
    $eventDate ?: null,
    $expiresAt,
]);
$eventId = (int)$db->lastInsertId();

// ── Create per-event upload directory + .htaccess ─────────────
$dir = UPLOAD_DIR . $eventId . '/';
if (!is_dir($dir)) {
    @mkdir($dir, 0755, true);
    // Copy security .htaccess
    $htaccess = UPLOAD_DIR . '.htaccess';
    if (file_exists($htaccess)) {
        @copy($htaccess, $dir . '.htaccess');
    }
}

// ── Send email ────────────────────────────────────────────────
$userStmt = $db->prepare('SELECT name, email FROM users WHERE id = ?');
$userStmt->execute([$auth['user_id']]);
$user = $userStmt->fetch();
$guestUrl = APP_URL . '/event/' . $slug;
mailEventCreated($user['email'], $user['name'], $name, $guestUrl, '');

sendJson([
    'event' => [
        'id'          => $eventId,
        'name'        => $name,
        'slug'        => $slug,
        'description' => $desc ?: null,
        'event_date'  => $eventDate ?: null,
        'plan'        => $sub['plan'],
        'expires_at'  => date(DATE_ATOM, strtotime($expiresAt)),
        'guest_url'   => $guestUrl,
        'status'      => 'active',
    ],
], 201);
