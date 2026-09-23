<?php
// ============================================================
// WedPix SaaS — api/user/export.php
// GET - Export all user data (GDPR Right to Data Portability)
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendError('Method not allowed', 405);

$auth = requireAuth();
$userId = (int)$auth['user_id'];

$db = getDB();
$data = [
    'export_date' => date('c'),
    'user_info' => null,
    'events' => [],
    'images' => [],
    'subscriptions' => []
];

// Get user info
$userStmt = $db->prepare(
    'SELECT id, name, email, created_at,
            email_notifications_enabled, email_daily_summary,
            email_usage_alerts, email_expiry_alerts
     FROM users
     WHERE id = ?'
);
$userStmt->execute([$userId]);
$user = $userStmt->fetch();
if ($user) {
    $data['user_info'] = $user;
}

// Get events
$eventsStmt = $db->prepare('SELECT id, name, slug, description, event_date, status, expires_at, created_at FROM events WHERE user_id = ?');
$eventsStmt->execute([$userId]);
$data['events'] = $eventsStmt->fetchAll();

// Get images (without actual file data for privacy)
$imagesStmt = $db->prepare('
    SELECT i.id, i.filename, i.original_name, i.mime_type, i.size_bytes, i.width, i.height,
           i.uploader_name, i.is_video, i.created_at, e.name as event_name
    FROM images i
    JOIN events e ON e.id = i.event_id
    WHERE e.user_id = ?
');
$imagesStmt->execute([$userId]);
$data['images'] = $imagesStmt->fetchAll();

// Get subscriptions
$subsStmt = $db->prepare('SELECT id, plan, status, created_at, expires_at FROM subscriptions WHERE user_id = ?');
$subsStmt->execute([$userId]);
$data['subscriptions'] = $subsStmt->fetchAll();

sendJson($data);
