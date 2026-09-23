<?php
// ============================================================
// WedPix SaaS — api/images/download-zip.php
// GET ?event_id=X — GOLD+ plan only, streams ZIP
// Requires authentication (organizer only)
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendError('Method not allowed', 405);

$auth    = requireAuth();
$eventId = (int)($_GET['event_id'] ?? 0);
if (!$eventId) sendError('event_id este obligatoriu.');

// Check if PHP ZIP extension or Archive_Zip fallback is available
$hasZipArchive = extension_loaded('zip');
$hasArchiveZip = @include_once 'Archive/Zip.php';
if (!$hasZipArchive && !$hasArchiveZip) {
    sendError('Funcția de download ZIP nu este disponibilă pe server. Contact suport tehnic.', 503);
}

$db = getDB();

// Verify ownership + plan
$stmt = $db->prepare(
    'SELECT e.name, s.plan, s.extra_video, s.extra_zip, s.extra_slideshow
     FROM   events e
     JOIN   subscriptions s ON s.id = e.subscription_id
     WHERE  e.id = ? AND e.user_id = ?'
);
$stmt->execute([$eventId, $auth['user_id']]);
$event = $stmt->fetch();
if (!$event) sendError('Eveniment negăsit sau acces interzis.', 403);

$plan = effectivePlan($event['plan'], $event);
if (!$plan['zip']) {
    sendError('Download ZIP este disponibil doar pentru planurile Gold și Platinum.', 403);
}

// Get all images
$imgs = $db->prepare('SELECT filename, original_name FROM images WHERE event_id = ? ORDER BY created_at ASC');
$imgs->execute([$eventId]);
$images = $imgs->fetchAll();
if (!$images) sendError('Nu există fotografii de descărcat.', 404);

// Build ZIP in memory
$tmpZip = tempnam(sys_get_temp_dir(), 'wedpix_');

if ($hasZipArchive) {
    // Use native ZipArchive
    $zip = new ZipArchive();
    if ($zip->open($tmpZip, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        sendError('Nu s-a putut crea arhiva ZIP.', 500);
    }

    $dir = UPLOAD_DIR . $eventId . '/';
    foreach ($images as $img) {
        $path = $dir . $img['filename'];
        if (file_exists($path)) {
            $zip->addFile($path, $img['original_name']);
        }
    }
    $zip->close();
} else {
    // Fallback to PEAR Archive_Zip
    $zip = new Archive_Zip($tmpZip);
    $dir = UPLOAD_DIR . $eventId . '/';

    foreach ($images as $img) {
        $path = $dir . $img['filename'];
        if (file_exists($path)) {
            $zip->addLargeFile($path, $img['original_name']);
        }
    }
}

// Stream ZIP to browser
$safeName = preg_replace('/[^a-z0-9-]/i', '_', $event['name']);
$zipName  = 'WedPix_' . $safeName . '_' . date('Ymd') . '.zip';

header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="' . $zipName . '"');
header('Content-Length: ' . filesize($tmpZip));
header('Cache-Control: no-cache');

readfile($tmpZip);
@unlink($tmpZip);
exit();
