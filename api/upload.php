<?php
// ============================================================
// WedPix — api/upload.php
// Handles multipart/form-data photo uploads
// ============================================================
declare(strict_types=1);
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

// ── 1. Validate uploader name ────────────────────────────────
$uploaderName = trim($_POST['uploader_name'] ?? '');
if ($uploaderName === '') {
    sendError('Uploader name is required.');
}
if (mb_strlen($uploaderName) < 2) {
    sendError('Name must be at least 2 characters.');
}
if (mb_strlen($uploaderName) > 100) {
    sendError('Name is too long (max 100 characters).');
}

// ── 2. Validate file presence ────────────────────────────────
if (empty($_FILES['photo']) || $_FILES['photo']['error'] === UPLOAD_ERR_NO_FILE) {
    sendError('No file uploaded.');
}

$file = $_FILES['photo'];

// ── 3. Check PHP upload error codes ─────────────────────────
$uploadErrors = [
    UPLOAD_ERR_INI_SIZE   => 'File exceeds the server upload limit.',
    UPLOAD_ERR_FORM_SIZE  => 'File exceeds the form size limit.',
    UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded.',
    UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder on server.',
    UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
    UPLOAD_ERR_EXTENSION  => 'Upload blocked by server extension.',
];
if (isset($uploadErrors[$file['error']])) {
    sendError($uploadErrors[$file['error']]);
}
if ($file['error'] !== UPLOAD_ERR_OK) {
    sendError('Unknown upload error.');
}

// ── 4. Validate file size ────────────────────────────────────
if ($file['size'] > MAX_FILE_SIZE) {
    sendError('File too large. Maximum allowed size is 20 MB.');
}

// ── 5. Validate MIME type via finfo (not trusting client) ────
$finfo    = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!in_array($mimeType, ALLOWED_MIME_TYPES, true)) {
    sendError('Invalid file type. Only JPEG, PNG, WebP and HEIC images are allowed.');
}

// ── 6. Ensure upload directory exists and is writable ────────
if (!is_dir(UPLOAD_DIR)) {
    if (!@mkdir(UPLOAD_DIR, 0755, true)) {
        sendError('Upload directory could not be created. Check server permissions.', 500);
    }
}
if (!is_writable(UPLOAD_DIR)) {
    sendError('Upload directory is not writable. Check server permissions (chmod 755).', 500);
}

// ── 7. Generate unique filename ──────────────────────────────
$ext = match ($mimeType) {
    'image/jpeg'        => 'jpg',
    'image/png'         => 'png',
    'image/webp'        => 'webp',
    'image/heic',
    'image/heif'        => 'heic',
    default             => 'jpg',
};

$uniqueFilename = sprintf(
    '%s_%s.%s',
    date('Ymd_His'),
    bin2hex(random_bytes(8)),
    $ext
);
$destination = UPLOAD_DIR . $uniqueFilename;

// ── 8. Move uploaded file ────────────────────────────────────
if (!move_uploaded_file($file['tmp_name'], $destination)) {
    sendError('Failed to save the uploaded file.', 500);
}

// ── 9. Get image dimensions ──────────────────────────────────
$imageSize = @getimagesize($destination);
$width     = $imageSize ? (int)$imageSize[0] : null;
$height    = $imageSize ? (int)$imageSize[1] : null;

// ── 10. Persist metadata to database ────────────────────────
try {
    $db   = getDB();
    $stmt = $db->prepare(
        'INSERT INTO photos (filename, original_name, mime_type, size_bytes, width, height, uploader_name)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $uniqueFilename,
        $file['name'],
        $mimeType,
        $file['size'],
        $width,
        $height,
        $uploaderName,
    ]);
    $photoId = (int)$db->lastInsertId();
} catch (PDOException $e) {
    @unlink($destination); // rollback file on DB error
    sendError('Database error: could not save photo metadata.', 500);
}

// ── 11. Return success ───────────────────────────────────────
sendJson([
    'success' => true,
    'photo'   => [
        'id'         => $photoId,
        'url'        => UPLOAD_URL . $uniqueFilename,
        'uploader'   => $uploaderName,
        'width'      => $width,
        'height'     => $height,
        'created_at' => date('c'),
    ],
]);
