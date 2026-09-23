<?php
// ============================================================
// WedPix SaaS — api/images/upload.php
// POST multipart: photo, event_id, uploader_name
// Public endpoint — auth by event ownership check is via event_id only.
// Quota and plan limits are enforced server-side.
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/email/mailer.php';

// Start session immediately for CSRF validation
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Method not allowed', 405);

// If the POST body exceeds PHP's post_max_size, PHP silently discards $_POST
// and $_FILES. Detect that here so the user gets a clear "too large" message
// instead of the misleading "event_id este obligatoriu".
$contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 0 && empty($_POST) && empty($_FILES)) {
    $postMax = ini_get('post_max_size') ?: '?';
    sendError(
        "Fișierul depășește limita serverului (post_max_size = {$postMax}). " .
        'Mărește upload_max_filesize și post_max_size în configurația PHP.',
        413
    );
}

// ── Inputs ────────────────────────────────────────────────────
$eventId      = (int)($_POST['event_id']      ?? 0);
$uploaderName = trim($_POST['uploader_name']  ?? '');

if (!$eventId)                         sendError('event_id este obligatoriu.');
if (!$uploaderName)                    sendError('Numele este obligatoriu.');
if (mb_strlen($uploaderName) > 100)    sendError('Numele este prea lung.');

// ── Load event + subscription ─────────────────────────────────
$db   = getDB();
$stmt = $db->prepare(
    'SELECT e.id, e.slug, e.name, e.status, e.expires_at,
            s.plan, s.extra_video, s.extra_zip, s.extra_slideshow, s.extra_photo_limit,
            u.id AS user_id, u.name AS user_name, u.email AS user_email
     FROM   events e
     JOIN   subscriptions s ON s.id = e.subscription_id
     JOIN   users u ON u.id = e.user_id
     WHERE  e.id = ? AND e.status = "active"'
);
$stmt->execute([$eventId]);
$event = $stmt->fetch();
if (!$event) sendError('Eveniment inexistent sau inactiv.', 404);

// Check expiry
if ($event['expires_at'] && strtotime($event['expires_at']) < time()) {
    sendError('Evenimentul a expirat. Uploadul nu mai este posibil.', 410);
}

$plan = effectivePlan($event['plan'], $event);

// ── Quota check ───────────────────────────────────────────────
$countStmt = $db->prepare('SELECT COUNT(*) FROM images WHERE event_id = ?');
$countStmt->execute([$eventId]);
$currentCount = (int)$countStmt->fetchColumn();

if ($plan['photo_limit'] !== PHP_INT_MAX && $currentCount >= $plan['photo_limit']) {
    sendError(
        'Limita de fotografii a fost atinsă pentru planul ' . strtoupper($event['plan']) .
            ' (' . $plan['photo_limit'] . ' poze). Faceți upgrade pentru mai multe.',
        429
    );
}

// Email notifications disabled for now (columns may not exist in production)
$shouldEmailNotifications = false;
$isFirstPhoto = $currentCount === 0;
$willCrossThreshold = false;
if ($plan['photo_limit'] !== PHP_INT_MAX && $currentCount < (int)floor($plan['photo_limit'] * 0.8) && $currentCount + 1 >= (int)floor($plan['photo_limit'] * 0.8)) {
    $willCrossThreshold = true;
}

// ── Rate limiting ──────────────────────────────────────────────
// Allow max 10 uploads per minute per IP + event combination
$clientIP = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateKey = "upload_{$clientIP}_{$eventId}";
if (!checkRateLimit($rateKey, 10, 60)) {
    sendError('Prea multe upload-uri. Încearcă din nou în câteva minute.', 429);
}

// ── CSRF protection ────────────────────────────────────────────
requireCSRF();

// ── File validation ───────────────────────────────────────────
if (empty($_FILES['photo']) || $_FILES['photo']['error'] === UPLOAD_ERR_NO_FILE) {
    sendError('Niciun fișier uploadat.');
}
$file = $_FILES['photo'];

$uploadErrors = [
    UPLOAD_ERR_INI_SIZE   => 'Fișierul depășește limita serverului.',
    UPLOAD_ERR_FORM_SIZE  => 'Fișierul depășește limita formularului.',
    UPLOAD_ERR_PARTIAL    => 'Fișierul a fost uploadat parțial.',
    UPLOAD_ERR_NO_TMP_DIR => 'Folder temporar lipsă.',
    UPLOAD_ERR_CANT_WRITE => 'Eroare la scrierea pe disk.',
];
if (isset($uploadErrors[$file['error']])) sendError($uploadErrors[$file['error']]);
if ($file['error'] !== UPLOAD_ERR_OK)     sendError('Eroare upload necunoscută.');

// ── Enhanced file validation ───────────────────────────────────
if (!validateFileType($file['tmp_name'], $file['name'])) {
    sendError('Tip de fișier invalid sau corupt. Sunt acceptate doar imagini și video valide.');
}

// ── Malware scan ───────────────────────────────────────────────
if (!scanForMalware($file['tmp_name'])) {
    sendError('Fișierul pare suspect și a fost respins din motive de securitate.');
}

// ── Get MIME type for database and filename generation ──────────
$finfo    = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

$allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
$allowedVideos = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-m4v'];
$isVideo       = false;

if (in_array($mimeType, $allowedImages, true)) {
    $isVideo = false;
} elseif ($plan['video'] && in_array($mimeType, $allowedVideos, true)) {
    $isVideo = true;
} elseif (in_array($mimeType, $allowedVideos, true)) {
    sendError('Videoclipurile nu sunt disponibile pentru acest abonament. Activează opțiunea Video.', 403);
} else {
    sendError('Tip de fișier invalid. Sunt acceptate imagini (JPG, PNG, WEBP, HEIC) și video (MP4, MOV, AVI).');
}

// ── Plan-based file size limit (images vs. video) ──────────────
$limitMb  = $isVideo ? (int)($plan['max_video_mb'] ?? 200) : (int)$plan['max_mb'];
$maxBytes = $limitMb * 1024 * 1024;
if ($file['size'] > $maxBytes) {
    $kind = $isVideo ? 'video' : 'imagine';
    sendError("Fișierul $kind este prea mare. Limita pentru planul {$event['plan']} este {$limitMb} MB.");
}

// ── Ensure upload directory ───────────────────────────────────
$dir = UPLOAD_DIR . $eventId . '/';
if (!is_dir($dir)) {
    if (!@mkdir($dir, 0755, true)) sendError('Nu s-a putut crea directorul de upload.', 500);
}
if (!is_writable($dir)) sendError('Directorul de upload nu este inscriptibil (chmod 755).', 500);

// ── Unique filename ───────────────────────────────────────────
$ext = match (true) {
    $mimeType === 'image/jpeg'                       => 'jpg',
    $mimeType === 'image/png'                        => 'png',
    $mimeType === 'image/webp'                       => 'webp',
    in_array($mimeType, ['image/heic', 'image/heif']) => 'heic',
    $mimeType === 'video/mp4'                        => 'mp4',
    $mimeType === 'video/quicktime'                  => 'mov',
    $mimeType === 'video/x-msvideo'                  => 'avi',
    $mimeType === 'video/x-m4v'                      => 'm4v',
    default                                          => 'jpg',
};

$filename    = sprintf('%s_%s.%s', date('Ymd_His'), bin2hex(random_bytes(8)), $ext);
$destination = $dir . $filename;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    sendError('Nu s-a putut salva fișierul.', 500);
}

// ── Image dimensions ──────────────────────────────────────────
$width = $height = null;
if (!$isVideo) {
    $info = @getimagesize($destination);
    if ($info) {
        $width = (int)$info[0];
        $height = (int)$info[1];
    }
}

// ── DB insert ─────────────────────────────────────────────────
try {
    $ins = $db->prepare(
        'INSERT INTO images (event_id, filename, original_name, mime_type,
                             size_bytes, width, height, uploader_name, is_video)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $ins->execute([
        $eventId,
        $filename,
        $file['name'],
        $mimeType,
        $file['size'],
        $width,
        $height,
        $uploaderName,
        (int)$isVideo,
    ]);
    $imageId = (int)$db->lastInsertId();
} catch (PDOException $e) {
    @unlink($destination);
    sendError('Eroare bază de date la salvarea metadatelor.', 500);
}

if ($shouldEmailNotifications) {
    if ($isFirstPhoto) {
        $guestUrl = $event['slug']
            ? sprintf('%s/event/%s', rtrim(APP_URL, '/'), $event['slug'])
            : sprintf('%s/event/%s', rtrim(APP_URL, '/'), urlencode((string)$eventId));
        @mailFirstPhotoUploaded($event['user_email'], $event['user_name'], $event['name'], $guestUrl);
    }
    if ($willCrossThreshold && (bool)$event['email_usage_alerts']) {
        @mailPlanLimitWarning(
            $event['user_email'],
            $event['user_name'],
            $event['name'],
            $currentCount + 1,
            $plan['photo_limit']
        );
    }
}

sendJson([
    'success' => true,
    'image'   => [
        'id'         => $imageId,
        'url'        => UPLOAD_URL . $eventId . '/' . $filename,
        'uploader'   => $uploaderName,
        'is_video'   => $isVideo,
        'created_at' => date('c'),
    ],
    'quota' => [
        'used'  => $currentCount + 1,
        'limit' => $plan['photo_limit'] === PHP_INT_MAX ? null : $plan['photo_limit'],
    ],
]);
