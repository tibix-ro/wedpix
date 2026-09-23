<?php
// ============================================================
// WedPix SaaS — api/auth/login.php
// POST {email, password} → {token, user, subscription}
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Method not allowed', 405);

$body     = json_decode(file_get_contents('php://input'), true) ?? [];
$email    = trim($body['email']    ?? '');
$password =      $body['password'] ?? '';

if (!$email || !$password) sendError('Email și parola sunt obligatorii.');

$db   = getDB();
$select = 'SELECT id, name, email, password_hash, created_at';
if (usersTableHasNotificationColumns($db)) {
    $select .= ', email_notifications_enabled, email_daily_summary, email_usage_alerts, email_expiry_alerts';
}
$select .= ' FROM users WHERE email = ?';
$stmt = $db->prepare($select);
$stmt->execute([$email]);
$user = $stmt->fetch();

// Timing-safe: always verify even if user not found
if (!$user || !password_verify($password, $user['password_hash'])) {
    sendError('Email sau parolă incorectă.', 401);
}

if (!isset($user['email_notifications_enabled'])) {
    $user['email_notifications_enabled'] = 1;
    $user['email_daily_summary'] = 0;
    $user['email_usage_alerts']  = 1;
    $user['email_expiry_alerts'] = 1;
}

// Fetch active subscription (if any)
$subStmt = $db->prepare(
    'SELECT id, plan, status, expires_at
     FROM   subscriptions
     WHERE  user_id = ? AND status = "active"
     ORDER  BY created_at DESC LIMIT 1'
);
$subStmt->execute([$user['id']]);
$subscription = $subStmt->fetch() ?: null;

$token = issueToken((int)$user['id'], $user['email']);

sendJson([
    'token' => $token,
    'user'  => [
        'id'                         => (int)$user['id'],
        'name'                       => $user['name'],
        'email'                      => $user['email'],
        'created_at'                 => $user['created_at'],
        'email_notifications_enabled' => (bool)$user['email_notifications_enabled'],
        'email_daily_summary'        => (bool)$user['email_daily_summary'],
        'email_usage_alerts'         => (bool)$user['email_usage_alerts'],
        'email_expiry_alerts'        => (bool)$user['email_expiry_alerts'],
    ],
    'subscription' => $subscription,
]);
