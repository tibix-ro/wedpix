<?php
// ============================================================
// WedPix SaaS — api/images/hide.php
// POST ?image_id=X&action=hide|unhide — organizer only
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Method not allowed', 405);

$auth    = requireAuth();
$imageId = (int)($_GET['image_id'] ?? 0);
$action  = $_GET['action'] ?? '';

if (!$imageId) sendError('image_id este obligatoriu.');
if (!in_array($action, ['hide', 'unhide'])) sendError('action trebuie să fie "hide" sau "unhide".');

$db = getDB();

// Verify organizer owns the event that contains this image
$stmt = $db->prepare(
    'SELECT i.id, i.is_hidden
     FROM   images i
     JOIN   events e ON e.id = i.event_id
     WHERE  i.id = ? AND e.user_id = ?'
);
$stmt->execute([$imageId, $auth['user_id']]);
$image = $stmt->fetch();
if (!$image) sendError('Imagine negăsită sau acces interzis.', 403);

// Update hidden status
$newHiddenStatus = $action === 'hide' ? 1 : 0;
$db->prepare('UPDATE images SET is_hidden = ? WHERE id = ?')
    ->execute([$newHiddenStatus, $imageId]);

sendJson(['success' => true, 'is_hidden' => (bool)$newHiddenStatus]);
