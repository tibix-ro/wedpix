<?php
// ============================================================
// WedPix — api/images/like.php
// POST { image_id, action: 'like'|'unlike' }
// No auth required — guests can like photos
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Method not allowed.', 405);

$input   = json_decode(file_get_contents('php://input'), true) ?? [];
$imageId = (int)($input['image_id'] ?? 0);
$action  = $input['action'] ?? 'like';

if (!$imageId)                                       sendError('image_id lipsă.');
if (!in_array($action, ['like', 'unlike'], true))    sendError('Acțiune invalidă.');

$db = getDB();

$stmt = $db->prepare('SELECT id, likes_count FROM images WHERE id = ?');
$stmt->execute([$imageId]);
$img = $stmt->fetch();
if (!$img) sendError('Imaginea nu există.', 404);

if ($action === 'like') {
    $db->prepare('UPDATE images SET likes_count = likes_count + 1 WHERE id = ?')->execute([$imageId]);
    $newCount = (int)$img['likes_count'] + 1;
} else {
    $newCount = max(0, (int)$img['likes_count'] - 1);
    $db->prepare('UPDATE images SET likes_count = ? WHERE id = ?')->execute([$newCount, $imageId]);
}

sendJson(['likes_count' => $newCount]);
