<?php
// ============================================================
// WedPix SaaS — api/events/get.php
// GET ?slug=xxx  — public endpoint (no auth required)
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendError('Method not allowed', 405);

$slug = trim($_GET['slug'] ?? '');
if (!$slug) sendError('Slug-ul evenimentului este obligatoriu.');

$db   = getDB();
$stmt = $db->prepare(
    'SELECT e.id, e.name, e.slug, e.description, e.event_date,
            e.status, e.expires_at, e.cover_image, e.created_at,
            s.plan, s.extra_video, s.extra_zip, s.extra_slideshow,
            s.extra_validity_days, s.extra_photo_limit,
            (SELECT COUNT(*) FROM images i WHERE i.event_id = e.id) AS photo_count
     FROM   events e
     JOIN   subscriptions s ON s.id = e.subscription_id
     WHERE  e.slug = ?'
);
$stmt->execute([$slug]);
$event = $stmt->fetch();

if (!$event) sendError('Evenimentul nu a fost găsit.', 404);

// Check expiry
if (
    $event['status'] === 'expired' ||
    ($event['expires_at'] && strtotime($event['expires_at']) < time())
) {
    sendError('Acest eveniment a expirat.', 410);
}

$plan = effectivePlan($event['plan'], $event);

sendJson([
    'event' => [
        'id'          => (int)$event['id'],
        'name'        => $event['name'],
        'slug'        => $event['slug'],
        'description' => $event['description'],
        'event_date'  => $event['event_date'],
        'cover_image' => $event['cover_image'] ? UPLOAD_URL . $event['id'] . '/' . $event['cover_image'] : null,
        'expires_at'  => $event['expires_at'] ? date(DATE_ATOM, strtotime($event['expires_at'])) : null,
        'photo_count' => (int)$event['photo_count'],
        'plan'        => $event['plan'],
        'plan_info'   => [
            'name'         => $plan['name'],
            'photo_limit'  => $plan['photo_limit'] === PHP_INT_MAX ? null : $plan['photo_limit'],
            'slideshow'    => $plan['slideshow'],
            'video'        => $plan['video'],
            'zip'          => $plan['zip'],
            'max_mb'       => (int)$plan['max_mb'],
            'max_video_mb' => (int)($plan['max_video_mb'] ?? 0),
        ],
    ],
]);
