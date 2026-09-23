<?php
// ============================================================
// WedPix SaaS — api/images/list.php
// GET ?event_id=X&page=1&limit=20
// Public endpoint, but shows hidden photos to organizers
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendError('Method not allowed', 405);

$eventId = (int)($_GET['event_id'] ?? 0);
$page    = max(1, (int)($_GET['page']  ?? 1));
$limit   = min(50, max(1, (int)($_GET['limit'] ?? 20)));
$offset  = ($page - 1) * $limit;

if (!$eventId) sendError('event_id este obligatoriu.');

$db = getDB();

// ── Check if user is authenticated and owns this event (organizer view) ──
// Try to extract JWT from Authorization header to detect organizer
$isOrganizer = false;
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (preg_match('/Bearer\s+([^\s]+)/', $authHeader, $matches)) {
    $token = $matches[1];
    try {
        // Decode JWT and check if user owns the event
        $decoded = json_decode(
            base64_decode(str_replace(['-', '_'], ['+', '/'], explode('.', $token)[1])),
            true
        );
        if ($decoded && isset($decoded['user_id'])) {
            $stmt = $db->prepare('SELECT id FROM events WHERE id = ? AND user_id = ?');
            $stmt->execute([$eventId, $decoded['user_id']]);
            $isOrganizer = $stmt->fetch() !== false;
        }
    } catch (Exception $e) {
        // Token invalid or parsing failed – treat as guest
        $isOrganizer = false;
    }
}

// Guests only see visible photos; organizers see everything (incl. hidden)
$whereClause = 'event_id = ?';
$params = [$eventId];
if (!$isOrganizer) {
    $whereClause .= ' AND is_hidden = 0';
}

$cntStmt = $db->prepare("SELECT COUNT(*) FROM images WHERE $whereClause");
$cntStmt->execute($params);
$total = (int)$cntStmt->fetchColumn();

$stmt = $db->prepare(
    "SELECT id, filename, mime_type, width, height, uploader_name, is_video, is_hidden, created_at
     FROM   images
     WHERE  $whereClause
     ORDER  BY created_at DESC
     LIMIT  ? OFFSET ?"
);
$stmt->execute(array_merge($params, [$limit, $offset]));
$rows = $stmt->fetchAll();

$photos = array_map(function (array $r) use ($eventId) {
    return [
        'id'           => (int)$r['id'],
        'url'          => UPLOAD_URL . $eventId . '/' . $r['filename'],
        'mime_type'    => $r['mime_type'],
        'width'        => $r['width']  !== null ? (int)$r['width']  : null,
        'height'       => $r['height'] !== null ? (int)$r['height'] : null,
        'uploader'     => $r['uploader_name'],
        'is_video'     => (bool)$r['is_video'],
        'is_hidden'    => (bool)$r['is_hidden'],
        'created_at'   => $r['created_at'],
    ];
}, $rows);

sendJson([
    'photos'      => $photos,
    'total'       => $total,
    'page'        => $page,
    'limit'       => $limit,
    'has_more'    => ($offset + $limit) < $total,
    'is_organizer' => $isOrganizer,
]);
