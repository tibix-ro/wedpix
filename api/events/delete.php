<?php
// ============================================================
// WedPix SaaS — api/events/delete.php
// DELETE ?event_id=X — organizer only, cascades images + folder
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') sendError('Method not allowed', 405);

$auth    = requireAuth();
$eventId = (int)($_GET['event_id'] ?? $_GET['id'] ?? 0);
if (!$eventId) sendError('event_id este obligatoriu.');

$db = getDB();

// Verify ownership
$stmt = $db->prepare('SELECT id FROM events WHERE id = ? AND user_id = ?');
$stmt->execute([$eventId, $auth['user_id']]);
if (!$stmt->fetch()) sendError('Eveniment negăsit sau acces interzis.', 403);

// Collect filenames before delete
$files = $db->prepare('SELECT filename FROM images WHERE event_id = ?');
$files->execute([$eventId]);
$filenames = $files->fetchAll(PDO::FETCH_COLUMN);

// Delete from DB (FK cascade deletes images rows)
$db->prepare('DELETE FROM events WHERE id = ?')->execute([$eventId]);

// Remove files from disk
$dir = UPLOAD_DIR . $eventId . '/';
foreach ($filenames as $f) {
    @unlink($dir . $f);
}
@rmdir($dir);

sendJson(['success' => true, 'deleted_files' => count($filenames)]);
