<?php
// ============================================================
// WedPix Admin — api/admin/images.php
// GET  ?event_id=&page=   → list images
// DELETE ?id=             → delete image + file
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/middleware/auth.php';

requireAdmin();
$db = getDB();

// ── GET ──────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $eventId = (int)($_GET['event_id'] ?? 0);
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = 30;
    $offset  = ($page - 1) * $perPage;

    $where  = '';
    $params = [];
    if ($eventId) {
        $where    = 'WHERE i.event_id = ?';
        $params[] = $eventId;
    }

    $cntStmt = $db->prepare("SELECT COUNT(*) FROM images i $where");
    $cntStmt->execute($params);
    $total = (int)$cntStmt->fetchColumn();

    $sql = "SELECT i.id, i.filename, i.original_name, i.size_bytes, i.is_hidden, i.is_video,
                   i.uploader_name, i.created_at, i.width, i.height, i.likes_count,
                   e.id AS event_id, e.name AS event_name, e.slug AS event_slug,
                   u.id AS user_id, u.name AS user_name
            FROM images i
            JOIN events e ON e.id = i.event_id
            JOIN users u ON u.id = e.user_id
            $where
            ORDER BY i.created_at DESC
            LIMIT $perPage OFFSET $offset";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $images = $stmt->fetchAll();

    foreach ($images as &$img) {
        $img['id']         = (int)$img['id'];
        $img['event_id']   = (int)$img['event_id'];
        $img['user_id']    = (int)$img['user_id'];
        $img['size_bytes'] = (int)$img['size_bytes'];
        $img['is_hidden']  = (bool)$img['is_hidden'];
        $img['is_video']   = (bool)$img['is_video'];
        $img['likes_count']= (int)($img['likes_count'] ?? 0);
        $img['url']        = rtrim(UPLOAD_URL, '/') . '/' . $img['event_id'] . '/' . $img['filename'];
    }
    unset($img);

    sendJson([
        'images'    => $images,
        'total'     => $total,
        'page'      => $page,
        'per_page'  => $perPage,
        'last_page' => (int)ceil($total / $perPage),
    ]);
}

// ── DELETE ───────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) sendError('ID lipsă.');

    $stmt = $db->prepare('SELECT filename, event_id FROM images WHERE id = ?');
    $stmt->execute([$id]);
    $img = $stmt->fetch();
    if (!$img) sendError('Imaginea nu există.', 404);

    $path = rtrim(UPLOAD_DIR, '/') . '/' . $img['event_id'] . '/' . $img['filename'];
    if (file_exists($path)) @unlink($path);

    $db->prepare('DELETE FROM images WHERE id = ?')->execute([$id]);
    sendJson(['deleted' => true]);
}

// ── PATCH — toggle is_hidden ──────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) sendError('ID lipsă.');

    $stmt = $db->prepare('SELECT id, is_hidden FROM images WHERE id = ?');
    $stmt->execute([$id]);
    $img = $stmt->fetch();
    if (!$img) sendError('Imaginea nu există.', 404);

    $newHidden = $img['is_hidden'] ? 0 : 1;
    $db->prepare('UPDATE images SET is_hidden = ? WHERE id = ?')->execute([$newHidden, $id]);
    sendJson(['is_hidden' => (bool)$newHidden]);
}

sendError('Method not allowed', 405);
