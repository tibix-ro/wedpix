<?php
// ============================================================
// WedPix SaaS — api/images/delete.php
// DELETE ?image_id=X — organizer only
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') sendError('Method not allowed', 405);

$auth    = requireAuth();
$imageId = (int)($_GET['image_id'] ?? 0);
if (!$imageId) sendError('image_id este obligatoriu.');

$db = getDB();

// Verify organizer owns the event that contains this image
$stmt = $db->prepare(
    'SELECT i.filename, i.event_id
     FROM   images i
     JOIN   events e ON e.id = i.event_id
     WHERE  i.id = ? AND e.user_id = ?'
);
$stmt->execute([$imageId, $auth['user_id']]);
$image = $stmt->fetch();
if (!$image) sendError('Imagine negăsită sau acces interzis.', 403);

// Remove from DB
$db->prepare('DELETE FROM images WHERE id = ?')->execute([$imageId]);

// Remove from disk
$path = UPLOAD_DIR . $image['event_id'] . '/' . $image['filename'];
@unlink($path);

sendJson(['success' => true]);
