<?php
// ============================================================
// WedPix — api/get_images.php
// Returns paginated list of uploaded photos as JSON
// ============================================================
declare(strict_types=1);
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

// ── Pagination params ────────────────────────────────────────
$page  = max(1, (int)($_GET['page']  ?? 1));
$limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;

// ── Query ────────────────────────────────────────────────────
try {
    $db = getDB();

    $total = (int)$db->query('SELECT COUNT(*) FROM photos')->fetchColumn();

    $stmt = $db->prepare(
        'SELECT id, filename, mime_type, width, height, uploader_name, created_at
         FROM   photos
         ORDER  BY created_at DESC
         LIMIT  ? OFFSET ?'
    );
    $stmt->execute([$limit, $offset]);
    $rows = $stmt->fetchAll();

    // Enrich each row with a full URL
    $photos = array_map(function (array $row) {
        return [
            'id'           => (int)$row['id'],
            'url'          => UPLOAD_URL . $row['filename'],
            'mime_type'    => $row['mime_type'],
            'width'        => $row['width']  !== null ? (int)$row['width']  : null,
            'height'       => $row['height'] !== null ? (int)$row['height'] : null,
            'uploader'     => $row['uploader_name'],
            'created_at'   => $row['created_at'],
        ];
    }, $rows);

    sendJson([
        'photos'   => $photos,
        'total'    => $total,
        'page'     => $page,
        'limit'    => $limit,
        'has_more' => ($offset + $limit) < $total,
    ]);
} catch (PDOException $e) {
    sendError('Database error: could not fetch photos.', 500);
}
