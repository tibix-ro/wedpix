<?php
// ============================================================
// WedPix SaaS — api/config.example.php
// ------------------------------------------------------------
// TEMPLATE ONLY. Copy this file to `api/config.php` and replace
// every CHANGE_ME / placeholder value with your real secrets.
//   cp api/config.example.php api/config.php
// `api/config.php` is git-ignored and must NEVER be committed.
// ============================================================
declare(strict_types=1);

// ── Session configuration ──────────────────────────────────────
// Must be set BEFORE session_start() is called anywhere
ini_set('session.cookie_secure', '1');      // Only send cookie over HTTPS
ini_set('session.cookie_httponly', '1');    // Prevent JS from accessing session cookie
ini_set('session.cookie_samesite', 'None'); // Allow cross-site requests with credentials
ini_set('session.cookie_path', '/'); // Session cookie available for entire / path
ini_set('session.use_only_cookies', '1');   // Only use cookies for session ID
session_name('wedpix_session');              // Custom session name

// ── Database ─────────────────────────────────────────────────
define('DB_HOST', 'localhost');
define('DB_NAME', 'wedpix');
define('DB_USER', 'wedpix');
define('DB_PASS', 'CHANGE_ME_db_password');
define('DB_CHARSET', 'utf8mb4');

// ── URLs ──────────────────────────────────────────────────────
define('APP_URL', 'https://yourdomain.com');
define('API_URL', 'https://yourdomain.com/api');
define('UPLOAD_DIR', dirname(__DIR__) . '/uploads/');
define('UPLOAD_URL', 'https://yourdomain.com/uploads/');

// ── JWT ───────────────────────────────────────────────────────
// Generate a strong random secret, e.g.:  openssl rand -base64 32
define('JWT_SECRET', 'CHANGE_ME_generate_with_openssl_rand_base64_32');
define('JWT_EXPIRY', 7 * 24 * 3600); // 7 days

// ── Stripe ────────────────────────────────────────────────────
// Keep TEST mode on for development (no real charges).
// Get keys from https://dashboard.stripe.com/apikeys
define('STRIPE_TEST_MODE', true);

if (STRIPE_TEST_MODE) {
    define('STRIPE_SECRET_KEY',      'sk_test_CHANGE_ME');
    define('STRIPE_PUBLIC_KEY',      'pk_test_CHANGE_ME');
    define('STRIPE_WEBHOOK_SECRET',  'whsec_CHANGE_ME');
    define('STRIPE_PRICE_SILVER',    'price_CHANGE_ME_silver_test');
    define('STRIPE_PRICE_GOLD',      'price_CHANGE_ME_gold_test');
    define('STRIPE_PRICE_PLATINUM',  'price_CHANGE_ME_platinum_test');
} else {
    define('STRIPE_SECRET_KEY',      'sk_live_CHANGE_ME');
    define('STRIPE_PUBLIC_KEY',      'pk_live_CHANGE_ME');
    define('STRIPE_WEBHOOK_SECRET',  'whsec_CHANGE_ME');
    define('STRIPE_PRICE_SILVER',    'price_CHANGE_ME_silver_live');
    define('STRIPE_PRICE_GOLD',      'price_CHANGE_ME_gold_live');
    define('STRIPE_PRICE_PLATINUM',  'price_CHANGE_ME_platinum_live');
}

// ── Email ─────────────────────────────────────────────────────
define('MAIL_FROM', 'hello@yourdomain.com');
define('MAIL_FROM_NAME', 'WedPix');
define('MAIL_REPLY_TO', 'help@yourdomain.com');

define('SMTP_HOST', 'smtp-relay.example.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'CHANGE_ME_smtp_user');
define('SMTP_PASS', 'CHANGE_ME_smtp_password');
define('SMTP_FROM', 'noreply@yourdomain.com');
define('SMTP_FROM_NAME', 'WedPix');

// ── Plans ─────────────────────────────────────────────────────
define('PLANS', [
    'demo' => [
        'name' => 'Demo',
        'price_ron' => 0.00,
        'original_price_ron' => null,
        'photo_limit' => 50,
        'video' => false,
        'zip' => false,
        'slideshow' => false,
        'validity_days' => 2 / 24, // 2 hours
        'max_mb' => 10,
        'max_video_mb' => 0,
        'compress_w' => 1280,
    ],
    'silver' => [
        'name' => 'Silver',
        'price_ron' => 49.00,
        'original_price_ron' => 119.00,
        'photo_limit' => 200,
        'video' => false,
        'zip' => false,
        'slideshow' => false,
        'validity_days' => 3,
        'max_mb' => 15,         // per-file server limit
        'max_video_mb' => 0,
        'compress_w' => 1280,       // server-side max width hint
    ],
    'gold' => [
        'name' => 'Gold',
        'price_ron' => 149.00,
        'original_price_ron' => 229.00,
        'photo_limit' => 1000,
        'video' => false,
        'zip' => true,
        'slideshow' => false,
        'validity_days' => 30,
        'max_mb' => 50,
        'max_video_mb' => 200,
        'compress_w' => null,       // no server resize
    ],
    'platinum' => [
        'name' => 'Platinum',
        'price_ron' => 299.00,
        'original_price_ron' => 399.00,
        'photo_limit' => PHP_INT_MAX,
        'video' => true,
        'zip' => true,
        'slideshow' => true,
        'validity_days' => 365,
        'max_mb' => 200,
        'max_video_mb' => 500,
        'compress_w' => null,
    ],
]);

/**
 * Merge per-subscription add-ons onto a base plan.
 * Extras force a capability ON regardless of the plan default:
 * effective feature = plan_default OR extra_flag.
 *
 * @param string $planName  demo|silver|gold|platinum
 * @param array  $sub       subscription row that may contain extra_video/extra_zip/extra_slideshow
 */
function effectivePlan(string $planName, array $sub = []): array
{
    $plan = PLANS[$planName] ?? PLANS['silver'];
    if (!empty($sub['extra_video'])) {
        $plan['video'] = true;
        // Grant a sensible video size limit if the base plan had none
        if ((int)($plan['max_video_mb'] ?? 0) < 1) $plan['max_video_mb'] = 200;
    }
    if (!empty($sub['extra_zip']))       $plan['zip']       = true;
    if (!empty($sub['extra_slideshow'])) $plan['slideshow'] = true;
    return $plan;
}


// ── CORS ──────────────────────────────────────────────────────
$allowedOrigins = [
    'https://www.yourdomain.com',
    'https://yourdomain.com',
    'http://localhost:5173',
    'http://localhost:4173',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: https://yourdomain.com');
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// ── PDO singleton ─────────────────────────────────────────────
function getDB(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', DB_HOST, DB_NAME, DB_CHARSET);
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            sendError('Database connection failed', 500);
        }
    }
    return $pdo;
}

// ── Response helpers ──────────────────────────────────────────
function sendJson(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

function sendError(string $message, int $code = 400): void
{
    sendJson(['error' => $message], $code);
}

// ── Security functions ─────────────────────────────────────────

// Rate limiting using file-based storage (for simplicity)
// In production, consider Redis or database
function checkRateLimit(string $key, int $maxRequests, int $windowSeconds): bool
{
    $cacheDir = sys_get_temp_dir() . '/wedpix_rate_limit/';
    if (!is_dir($cacheDir)) mkdir($cacheDir, 0755, true);

    $file = $cacheDir . md5($key) . '.txt';
    $now = time();

    // Read existing requests
    $requests = [];
    if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true) ?: [];
        $requests = array_filter($data, fn($time) => $now - $time < $windowSeconds);
    }

    // Check limit
    if (count($requests) >= $maxRequests) {
        return false; // Rate limit exceeded
    }

    // Add current request
    $requests[] = $now;
    file_put_contents($file, json_encode($requests));

    return true;
}

// CSRF token generation and validation
function generateCSRFToken(): string
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validateCSRFToken(?string $token): bool
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token ?? '');
}

// Validate CSRF for state-changing requests
function requireCSRF(): void
{
    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    if (!in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'])) {
        return; // Only check for state-changing requests
    }

    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
    $sessionToken = $_SESSION['csrf_token'] ?? null;

    if (!$token || !validateCSRFToken($token)) {
        // Log for debugging (remove in production)
        error_log(sprintf(
            '[CSRF] Validation failed: received=%s, session=%s, session_id=%s',
            $token ? substr($token, 0, 8) . '...' : 'NULL',
            $sessionToken ? substr($sessionToken, 0, 8) . '...' : 'NULL',
            session_id()
        ));
        sendError('Token CSRF invalid.', 403);
    }
}

function usersTableHasNotificationColumns(PDO $db): bool
{
    static $hasColumns = null;
    if ($hasColumns !== null) {
        return $hasColumns;
    }

    try {
        $stmt = $db->prepare("SHOW COLUMNS FROM users LIKE ?");
        $stmt->execute(['email_notifications_enabled']);
        $hasColumns = (bool)$stmt->fetch();
    } catch (PDOException $e) {
        $hasColumns = false;
    }

    return $hasColumns;
}

function usersTableHasAdminColumn(PDO $db): bool
{
    static $has = null;
    if ($has !== null) return $has;
    try {
        $s = $db->prepare("SHOW COLUMNS FROM users LIKE 'is_admin'");
        $s->execute();
        $has = (bool)$s->fetch();
    } catch (PDOException $e) {
        $has = false;
    }
    return $has;
}

// Enhanced file type validation
function validateFileType(string $filePath, string $originalName): bool
{
    // Get MIME type using multiple methods
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($filePath);

    // Check against allowed types
    $allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-m4v'
    ];

    if (!in_array($mimeType, $allowedMimes, true)) {
        return false;
    }

    // Additional check: file extension
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'mp4', 'mov', 'avi', 'm4v'];

    if (!in_array($extension, $allowedExts, true)) {
        return false;
    }

    // Check file header (magic bytes)
    $handle = fopen($filePath, 'rb');
    if (!$handle) return false;

    $header = fread($handle, 12);
    fclose($handle);

    // JPEG: FF D8 FF
    if ($mimeType === 'image/jpeg' && !preg_match('/^\xFF\xD8\xFF/', $header)) {
        return false;
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if ($mimeType === 'image/png' && !preg_match('/^\x89PNG\x0D\x0A\x1A\x0A/', $header)) {
        return false;
    }

    // MP4 / MOV / M4V: 'ftyp' box at offset 4 (box size byte varies)
    if (
        in_array($mimeType, ['video/mp4', 'video/quicktime', 'video/x-m4v'], true) &&
        substr($header, 4, 4) !== 'ftyp'
    ) {
        return false;
    }

    return true;
}

// Basic malware scanning (file size and content checks)
// For production, integrate with ClamAV or cloud service
function scanForMalware(string $filePath): bool
{
    // Check file size (additional to plan limits)
    if (filesize($filePath) > 500 * 1024 * 1024) { // 500MB absolute max
        return false;
    }

    // Check for suspicious content patterns
    $content = file_get_contents($filePath, false, null, 0, 1024); // First 1KB
    if (!$content) return false;

    // Common malware signatures (basic check)
    $suspicious = [
        '<?php',
        '<script',
        'eval(',
        'base64_decode',
        'system(',
        'exec(',
        '\x00\x00\x00\x00', // Null bytes in images
    ];

    foreach ($suspicious as $pattern) {
        if (stripos($content, $pattern) !== false) {
            return false;
        }
    }

    // For images, check if it's actually an image
    $imageInfo = getimagesize($filePath);
    if (!$imageInfo && !preg_match('/^video\//', mime_content_type($filePath))) {
        return false;
    }

    return true;
}
