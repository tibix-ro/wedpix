<?php
// ============================================================
// WedPix Admin — api/admin/stats.php   GET
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendError('Method not allowed', 405);
requireAdmin();

$db = getDB();

$stats = [];

// Counts
$stats['total_users']           = (int)$db->query('SELECT COUNT(*) FROM users')->fetchColumn();
$stats['active_subscriptions']  = (int)$db->query('SELECT COUNT(*) FROM subscriptions WHERE status = "active"')->fetchColumn();
$stats['total_events']          = (int)$db->query('SELECT COUNT(*) FROM events')->fetchColumn();
$stats['total_images']          = (int)$db->query('SELECT COUNT(*) FROM images')->fetchColumn();
$stats['pending_subscriptions'] = (int)$db->query('SELECT COUNT(*) FROM subscriptions WHERE status = "pending"')->fetchColumn();

// Revenue (all paid subs)
$rev = $db->query('SELECT COALESCE(SUM(price_ron),0) FROM subscriptions WHERE status IN ("active","expired")')->fetchColumn();
$stats['total_revenue_ron'] = round((float)$rev, 2);

// Plan breakdown
$planRows = $db->query(
    'SELECT plan, COUNT(*) AS cnt FROM subscriptions WHERE status = "active" GROUP BY plan'
)->fetchAll();
$stats['active_by_plan'] = array_column($planRows, 'cnt', 'plan');

// Recent users (last 10)
$stats['recent_users'] = $db->query(
    'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 10'
)->fetchAll();

// Recent active subscriptions (last 10)
$stats['recent_subscriptions'] = $db->query(
    'SELECT s.id, s.plan, s.price_ron, s.started_at, u.name AS user_name, u.email AS user_email
     FROM subscriptions s
     JOIN users u ON u.id = s.user_id
     WHERE s.status = "active"
     ORDER BY s.started_at DESC LIMIT 10'
)->fetchAll();

// Storage used (sum of image sizes)
$bytes = $db->query('SELECT COALESCE(SUM(size_bytes),0) FROM images')->fetchColumn();
$stats['storage_bytes'] = (int)$bytes;

sendJson(['stats' => $stats]);
