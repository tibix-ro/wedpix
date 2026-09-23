<?php
// ============================================================
// WedPix SaaS — api/csrf-token.php
// GET CSRF token for frontend (no authentication required)
// ============================================================
declare(strict_types=1);
require_once __DIR__ . '/config.php';

// Start session immediately before any token generation
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

// Generate and return CSRF token
$csrfToken = generateCSRFToken();

sendJson(['csrf_token' => $csrfToken]);
