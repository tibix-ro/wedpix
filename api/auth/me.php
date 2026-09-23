<?php
// ============================================================
// WedPix SaaS — api/auth/me.php
// GET — returns current user + active subscription + events count
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendError('Method not allowed', 405);

$auth = requireAuth();
$db   = getDB();

// User
$select = 'SELECT id, name, email, stripe_customer_id, created_at';
if (usersTableHasNotificationColumns($db)) {
    $select .= ', email_notifications_enabled, email_daily_summary, email_usage_alerts, email_expiry_alerts';
}
if (usersTableHasAdminColumn($db)) {
    $select .= ', is_admin';
}
$select .= ' FROM users WHERE id = ?';
$stmt = $db->prepare($select);
$stmt->execute([$auth['user_id']]);
$user = $stmt->fetch();
if (!$user) sendError('Utilizator negăsit.', 404);

if (!isset($user['email_notifications_enabled'])) {
    $user['email_notifications_enabled'] = 1;
    $user['email_daily_summary'] = 0;
    $user['email_usage_alerts']  = 1;
    $user['email_expiry_alerts'] = 1;
}

// Active subscription
$subStmt = $db->prepare(
    'SELECT id, plan, status, expires_at, started_at
     FROM   subscriptions
     WHERE  user_id = ? AND status = "active"
     ORDER  BY created_at DESC LIMIT 1'
);
$subStmt->execute([$auth['user_id']]);
$subscription = $subStmt->fetch() ?: null;

// Events count
$evtCount = (int)$db->prepare('SELECT COUNT(*) FROM events WHERE user_id = ?')
    ->execute([$auth['user_id']]) ? $db->query('SELECT FOUND_ROWS()')->fetchColumn() : 0;

$countStmt = $db->prepare('SELECT COUNT(*) FROM events WHERE user_id = ?');
$countStmt->execute([$auth['user_id']]);
$eventCount = (int)$countStmt->fetchColumn();

sendJson([
    'user' => [
        'id'                         => (int)$user['id'],
        'name'                       => $user['name'],
        'email'                      => $user['email'],
        'created_at'                 => $user['created_at'],
        'is_admin'                   => (bool)($user['is_admin'] ?? false),
        'email_notifications_enabled' => (bool)$user['email_notifications_enabled'],
        'email_daily_summary'        => (bool)$user['email_daily_summary'],
        'email_usage_alerts'         => (bool)$user['email_usage_alerts'],
        'email_expiry_alerts'        => (bool)$user['email_expiry_alerts'],
    ],
    'subscription'  => $subscription,
    'events_count'  => $eventCount,
]);
