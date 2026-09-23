<?php
// ============================================================
// WedPix SaaS — api/billing/activate-demo.php
// POST /api/billing/activate-demo.php
// Activates the free Demo plan for the logged-in user
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';

// Ensure session is started to access CSRF token from cookies
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once dirname(__DIR__) . '/middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Method not allowed', 405);

// ── CSRF protection ────────────────────────────────────────────
requireCSRF();

$payload = requireAuth();
$userId  = (int)$payload['user_id'];
$planId  = 'demo';

$db = getDB();

// Check if user already has an active subscription
$stmt = $db->prepare('SELECT id FROM subscriptions WHERE user_id = ? AND status = "active"');
$stmt->execute([$userId]);
if ($stmt->fetch()) {
    sendError('Ai deja un abonament activ.');
}

// Check if they ever had a demo
$stmt = $db->prepare('SELECT id FROM subscriptions WHERE user_id = ? AND plan = "demo"');
$stmt->execute([$userId]);
if ($stmt->fetch()) {
    sendError('Ai folosit deja pachetul demo. Te rugăm să alegi un pachet premium.');
}

// Validity is in days, demo is 2/24
$validityDays = PLANS[$planId]['validity_days'];
$expiresAt = date('Y-m-d H:i:s', time() + (int)($validityDays * 86400));

// Insert active demo subscription
$stmt = $db->prepare('
    INSERT INTO subscriptions (user_id, plan, status, stripe_session_id, price_ron, started_at, expires_at)
    VALUES (?, ?, "active", "demo_session", 0.00, NOW(), ?)
');
$stmt->execute([$userId, $planId, $expiresAt]);

sendJson(['message' => 'Pachetul demo a fost activat!', 'expires_at' => $expiresAt]);
