<?php
// ============================================================
// WedPix SaaS — api/middleware/auth.php
// Hand-rolled HS256 JWT (no external library)
// ============================================================
declare(strict_types=1);

/**
 * Encode a JWT token.
 */
function jwtEncode(array $payload): string
{
    $header  = base64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64url(json_encode($payload));
    $sig     = base64url(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    return "$header.$payload.$sig";
}

/**
 * Decode and verify a JWT. Returns payload array or null on failure.
 */
function jwtDecode(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$header, $payload, $sig] = $parts;
    $expected = base64url(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));

    // Constant-time comparison
    if (!hash_equals($expected, $sig)) return null;

    $data = json_decode(base64_decode(strtr($payload, '-_', '+/')), true);
    if (!$data) return null;
    if (isset($data['exp']) && $data['exp'] < time()) return null;

    return $data;
}

/**
 * base64url encoding helper.
 */
function base64url(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Require a valid JWT Bearer token.
 * Returns the decoded payload (contains user_id, email).
 * Sends 401 and exits on failure.
 */
function requireAuth(): array
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
        sendError('Autentificare necesară.', 401);
    }
    $payload = jwtDecode(trim($m[1]));
    if (!$payload || empty($payload['user_id'])) {
        sendError('Token invalid sau expirat.', 401);
    }
    return $payload;
}

/**
 * Require the current user to be an admin (is_admin = 1 in DB).
 * Returns the JWT payload array on success, sends 403 and exits on failure.
 */
function requireAdmin(): array
{
    $auth = requireAuth();
    $db   = getDB();
    $stmt = $db->prepare('SELECT is_admin FROM users WHERE id = ?');
    $stmt->execute([$auth['user_id']]);
    $row = $stmt->fetch();
    if (!$row || empty($row['is_admin'])) {
        sendError('Acces interzis. Doar administratorii pot accesa aceasta resursa.', 403);
    }
    return $auth;
}

/**
 * Issue a JWT for a user.
 */
function issueToken(int $userId, string $email): string
{
    return jwtEncode([
        'user_id' => $userId,
        'email'   => $email,
        'iat'     => time(),
        'exp'     => time() + JWT_EXPIRY,
    ]);
}
