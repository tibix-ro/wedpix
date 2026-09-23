<?php
// ============================================================
// WedPix SaaS — api/slideshow/get.php
// GET ?event_id=X&after_id=0&limit=10
// PLATINUM plan only — returns new images for live slideshow polling
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendError('Method not allowed', 405);

$eventId = (int)($_GET['event_id'] ?? 0);
$afterId = (int)($_GET['after_id'] ?? 0);
$limit   = min(20, max(1, (int)($_GET['limit'] ?? 10)));

if (!$eventId) sendError('event_id este obligatoriu.');

$db = getDB();

// Verify event is slideshow-enabled + active
$stmt = $db->prepare(
    'SELECT e.status, e.expires_at, s.plan, s.extra_slideshow
     FROM   events e
     JOIN   subscriptions s ON s.id = e.subscription_id
     WHERE  e.id = ? AND e.status = "active"'
);
$stmt->execute([$eventId]);
$event = $stmt->fetch();

if (!$event) sendError('Eveniment inexistent sau inactiv.', 404);
if (!effectivePlan($event['plan'], $event)['slideshow']) {
    sendError('Live Slideshow nu este disponibil pentru acest abonament.', 403);
}
if ($event['expires_at'] && strtotime($event['expires_at']) < time()) {
    sendError('Evenimentul a expirat.', 410);
}

// Fetch new images since after_id
$imgStmt = $db->prepare(
    'SELECT id, filename, uploader_name, created_at
     FROM   images
     WHERE  event_id = ? AND id > ? AND is_video = 0 AND is_hidden = 0
     ORDER  BY id ASC
     LIMIT  ?'
);
$imgStmt->execute([$eventId, $afterId, $limit]);
$rows = $imgStmt->fetchAll();

$images = array_map(function (array $r) use ($eventId) {
    return [
        'id'         => (int)$r['id'],
        'url'        => UPLOAD_URL . $eventId . '/' . $r['filename'],
        'uploader'   => $r['uploader_name'],
        'created_at' => $r['created_at'],
    ];
}, $rows);

// Return last id for next poll
$lastId = $rows ? (int)end($rows)['id'] : $afterId;

sendJson([
    'images'  => $images,
    'last_id' => $lastId,
    'count'   => count($images),
]);
