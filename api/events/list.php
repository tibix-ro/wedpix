<?php
// ============================================================
// WedPix SaaS — api/events/list.php
// GET — organizer's events with photo count and quota info
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendError('Method not allowed', 405);

$auth = requireAuth();
$db   = getDB();

$stmt = $db->prepare(
    'SELECT e.id, e.name, e.slug, e.description, e.event_date,
            e.status, e.expires_at, e.created_at, e.cover_image,
            s.plan, s.extra_video, s.extra_zip, s.extra_slideshow,
            s.extra_validity_days, s.extra_photo_limit,
            (SELECT COUNT(*) FROM images i WHERE i.event_id = e.id) AS photo_count
     FROM   events e
     JOIN   subscriptions s ON s.id = e.subscription_id
     WHERE  e.user_id = ?
     ORDER  BY e.created_at DESC'
);
$stmt->execute([$auth['user_id']]);
$events = $stmt->fetchAll();

foreach ($events as &$event) {
    $plan              = effectivePlan($event['plan'], $event);
    $event['id']       = (int)$event['id'];
    $event['photo_count'] = (int)$event['photo_count'];
    $event['plan_info'] = [
        'name'         => $plan['name'],
        'photo_limit'  => $plan['photo_limit'] === PHP_INT_MAX ? null : $plan['photo_limit'],
        'zip'          => $plan['zip'],
        'slideshow'    => $plan['slideshow'],
        'video'        => $plan['video'],
        'max_mb'       => (int)$plan['max_mb'],
        'max_video_mb' => (int)($plan['max_video_mb'] ?? 0),
    ];
    $event['guest_url'] = APP_URL . '/event/' . $event['slug'];
    $event['expires_at'] = $event['expires_at'] ? date(DATE_ATOM, strtotime($event['expires_at'])) : null;
}

sendJson(['events' => $events, 'total' => count($events)]);
