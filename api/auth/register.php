<?php
// ============================================================
// WedPix SaaS — api/auth/register.php
// POST {name, email, password}
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/middleware/auth.php';
require_once dirname(__DIR__) . '/email/mailer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Method not allowed', 405);

$body = json_decode(file_get_contents('php://input'), true) ?? [];

// ── Validate ──────────────────────────────────────────────────
$name     = trim($body['name']     ?? '');
$email    = trim($body['email']    ?? '');
$password =      $body['password'] ?? '';

if (!$name || mb_strlen($name) < 2)            sendError('Numele este obligatoriu (min 2 caractere).');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) sendError('Adresă de email invalidă.');
if (strlen($password) < 8)                     sendError('Parola trebuie să aibă cel puțin 8 caractere.');

// ── Check duplicate ───────────────────────────────────────────
$db   = getDB();
$stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) sendError('Există deja un cont cu această adresă de email.', 409);

// ── Create user ───────────────────────────────────────────────
$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
$columns = ['name', 'email', 'password_hash'];
$placeholders = ['?', '?', '?'];
$values = [$name, $email, $hash];

if (usersTableHasNotificationColumns($db)) {
    $columns = array_merge($columns, [
        'email_notifications_enabled',
        'email_daily_summary',
        'email_usage_alerts',
        'email_expiry_alerts',
    ]);
    $placeholders = array_merge($placeholders, ['1', '0', '1', '1']);
}

$stmt = $db->prepare(
    sprintf(
        'INSERT INTO users (%s) VALUES (%s)',
        implode(', ', $columns),
        implode(', ', $placeholders)
    )
);
$stmt->execute($values);
$userId = (int)$db->lastInsertId();

// ── Issue token ───────────────────────────────────────────────
$token = issueToken($userId, $email);

// ── Send welcome email ────────────────────────────────────────
mailWelcome($email, $name);

$select = 'SELECT id, name, email, created_at';
if (usersTableHasNotificationColumns($db)) {
    $select .= ', email_notifications_enabled, email_daily_summary, email_usage_alerts, email_expiry_alerts';
}
$select .= ' FROM users WHERE id = ?';
$userStmt = $db->prepare($select);
$userStmt->execute([$userId]);
$user = $userStmt->fetch();

if (!isset($user['email_notifications_enabled'])) {
    $user['email_notifications_enabled'] = 1;
    $user['email_daily_summary'] = 0;
    $user['email_usage_alerts']  = 1;
    $user['email_expiry_alerts'] = 1;
}

sendJson([
    'token' => $token,
    'user'  => [
        'id'                         => (int)$user['id'],
        'name'                       => $user['name'],
        'email'                      => $user['email'],
        'created_at'                 => $user['created_at'],
        'email_notifications_enabled' => (bool)$user['email_notifications_enabled'],
        'email_daily_summary'        => (bool)$user['email_daily_summary'],
        'email_usage_alerts'         => (bool)$user['email_usage_alerts'],
        'email_expiry_alerts'        => (bool)$user['email_expiry_alerts'],
    ],
], 201);
