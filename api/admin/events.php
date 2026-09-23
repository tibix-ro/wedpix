<?php
// ============================================================
// WedPix Admin — api/admin/events.php
// GET   ?search=&page=   → list events
// PATCH {id, expires_at} → update event link expiry
// DELETE ?id=            → delete event
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/middleware/auth.php';

requireAdmin();
$db = getDB();

// ── GET ──────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $search  = trim($_GET['search'] ?? '');
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = 20;
    $offset  = ($page - 1) * $perPage;

    $where  = '';
    $params = [];
    if ($search !== '') {
        $where    = 'WHERE e.name LIKE ? OR e.slug LIKE ? OR u.name LIKE ?';
        $like     = '%' . $search . '%';
        $params   = [$like, $like, $like];
    }

    $cntStmt = $db->prepare("SELECT COUNT(*) FROM events e JOIN users u ON u.id=e.user_id $where");
    $cntStmt->execute($params);
    $total = (int)$cntStmt->fetchColumn();

    $sql = "SELECT e.id, e.name, e.slug, e.status, e.event_date, e.expires_at, e.created_at,
                   s.plan,
                   u.id AS user_id, u.name AS user_name, u.email AS user_email,
                   (SELECT COUNT(*) FROM images WHERE event_id = e.id) AS image_count,
                   (SELECT COALESCE(SUM(size_bytes),0) FROM images WHERE event_id = e.id) AS storage_bytes
            FROM events e
            JOIN users u ON u.id = e.user_id
            JOIN subscriptions s ON s.id = e.subscription_id
            $where
            ORDER BY e.created_at DESC
            LIMIT $perPage OFFSET $offset";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $events = $stmt->fetchAll();

    foreach ($events as &$ev) {
        $ev['id']            = (int)$ev['id'];
        $ev['user_id']       = (int)$ev['user_id'];
        $ev['image_count']   = (int)$ev['image_count'];
        $ev['storage_bytes'] = (int)$ev['storage_bytes'];
    }
    unset($ev);

    sendJson([
        'events'    => $events,
        'total'     => $total,
        'page'      => $page,
        'per_page'  => $perPage,
        'last_page' => (int)ceil($total / $perPage),
    ]);
}

// ── PATCH ────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    requireCSRF();

    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = (int)($body['id'] ?? 0);
    $expiresAtInput = trim((string)($body['expires_at'] ?? ''));
    if (!$id) sendError('ID lipsă.');
    if (!$expiresAtInput) sendError('Data expirării este obligatorie.');

    $date = DateTime::createFromFormat('Y-m-d\\TH:i', $expiresAtInput);
    $dateErrors = DateTime::getLastErrors();
    if (!$date || ($dateErrors !== false && ($dateErrors['warning_count'] || $dateErrors['error_count']))) {
        sendError('Data expirării este invalidă.');
    }

    $expiresAt = $date->format('Y-m-d H:i:s');
    $eventStmt = $db->prepare('SELECT id FROM events WHERE id = ?');
    $eventStmt->execute([$id]);
    if (!$eventStmt->fetch()) sendError('Evenimentul nu există.', 404);

    $status = $date->getTimestamp() <= time() ? 'expired' : 'active';
    $stmt = $db->prepare('UPDATE events SET expires_at = ?, status = ? WHERE id = ?');
    $stmt->execute([$expiresAt, $status, $id]);

    sendJson([
        'updated' => true,
        'expires_at' => date(DATE_ATOM, $date->getTimestamp()),
        'status' => $status,
    ]);
}

// ── DELETE ───────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) sendError('ID lipsă.');

    // Get event images to delete files
    $imgs = $db->prepare('SELECT filename FROM images WHERE event_id = ?');
    $imgs->execute([$id]);
    foreach ($imgs->fetchAll() as $img) {
        $path = rtrim(UPLOAD_DIR, '/') . '/' . $id . '/' . $img['filename'];
        if (file_exists($path)) @unlink($path);
    }
    // Remove event directory
    $dir = rtrim(UPLOAD_DIR, '/') . '/' . $id;
    if (is_dir($dir)) @rmdir($dir);

    $db->prepare('DELETE FROM events WHERE id = ?')->execute([$id]);
    sendJson(['deleted' => true]);
}

sendError('Method not allowed', 405);
