<?php
// ============================================================
// WedPix SaaS — api/user/update.php
// PUT/POST {email_notifications_enabled, email_daily_summary, email_usage_alerts, email_expiry_alerts}
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';

// Ensure session is started to access CSRF token from cookies
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once dirname(__DIR__) . '/middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

requireCSRF();

$auth = requireAuth();
$body = json_decode(file_get_contents('php://input'), true) ?? [];

$emailNotifications = isset($body['email_notifications_enabled']) ? (int)(bool)$body['email_notifications_enabled'] : null;
$dailySummary = isset($body['email_daily_summary']) ? (int)(bool)$body['email_daily_summary'] : null;
$usageAlerts  = isset($body['email_usage_alerts'])  ? (int)(bool)$body['email_usage_alerts']  : null;
$expiryAlerts = isset($body['email_expiry_alerts']) ? (int)(bool)$body['email_expiry_alerts'] : null;

if ($emailNotifications === null && $dailySummary === null && $usageAlerts === null && $expiryAlerts === null) {
    sendError('Nu există setări de actualizat.');
}

$db = getDB();
$hasPrefs = usersTableHasNotificationColumns($db);

if ($hasPrefs) {
    // Load current values to preserve missing fields
    $userStmt = $db->prepare(
        'SELECT email_notifications_enabled, email_daily_summary, email_usage_alerts, email_expiry_alerts
         FROM users WHERE id = ?'
    );
    $userStmt->execute([$auth['user_id']]);
    $current = $userStmt->fetch();
    if (!$current) sendError('Utilizator negăsit.', 404);

    $emailNotifications = $emailNotifications ?? (int)$current['email_notifications_enabled'];
    $dailySummary = $dailySummary ?? (int)$current['email_daily_summary'];
    $usageAlerts  = $usageAlerts  ?? (int)$current['email_usage_alerts'];
    $expiryAlerts = $expiryAlerts ?? (int)$current['email_expiry_alerts'];

    $updateStmt = $db->prepare(
        'UPDATE users
         SET email_notifications_enabled = ?,
             email_daily_summary = ?,
             email_usage_alerts = ?,
             email_expiry_alerts = ?
         WHERE id = ?'
    );
    $updateStmt->execute([$emailNotifications, $dailySummary, $usageAlerts, $expiryAlerts, $auth['user_id']]);
} else {
    $emailNotifications = $emailNotifications ?? 1;
    $dailySummary = $dailySummary ?? 0;
    $usageAlerts  = $usageAlerts  ?? 1;
    $expiryAlerts = $expiryAlerts ?? 1;
}

sendJson([
    'success' => true,
    'user' => [
        'id'                          => (int)$auth['user_id'],
        'email_notifications_enabled' => (bool)$emailNotifications,
        'email_daily_summary'         => (bool)$dailySummary,
        'email_usage_alerts'          => (bool)$usageAlerts,
        'email_expiry_alerts'         => (bool)$expiryAlerts,
    ],
]);
