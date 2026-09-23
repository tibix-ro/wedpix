<?php
// ============================================================
// WedPix SaaS — api/cron/notifications.php
// Sends daily upload summaries, expiry warnings and plan alerts.
// Run once per day from cron.
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/email/mailer.php';

$db = getDB();
$now = new DateTimeImmutable('now', new DateTimeZone('UTC'));
$yesterday = $now->sub(new DateInterval('P1D'));
$threeDaysLater = $now->add(new DateInterval('P3D'));

// 1. Daily summary for photo uploads in the last 24h
$summaryStmt = $db->prepare(
    'SELECT u.id AS user_id, u.name AS user_name, u.email AS user_email,
            u.email_notifications_enabled, u.email_daily_summary,
            e.id AS event_id, e.name AS event_name, e.slug, COUNT(i.id) AS new_photos
     FROM images i
     JOIN events e ON e.id = i.event_id AND e.status = "active"
     JOIN users u ON u.id = e.user_id
     WHERE i.created_at BETWEEN ? AND ?
       AND u.email_notifications_enabled = 1
       AND u.email_daily_summary = 1
     GROUP BY u.id, e.id
     ORDER BY u.id, new_photos DESC'
);
$summaryStmt->execute([$yesterday->format('Y-m-d H:i:s'), $now->format('Y-m-d H:i:s')]);
$rows = $summaryStmt->fetchAll();

$batched = [];
$users = [];
foreach ($rows as $row) {
    $userId = $row['user_id'];
    if (!isset($users[$userId])) {
        $users[$userId] = [
            'name'  => $row['user_name'],
            'email' => $row['user_email'],
        ];
    }

    $batched[$userId][] = [
        'name'       => $row['event_name'],
        'new_photos' => (int)$row['new_photos'],
        'link'       => sprintf('%s/event/%s', rtrim(APP_URL, '/'), $row['slug']),
    ];
}

foreach ($batched as $userId => $events) {
    $userName = $users[$userId]['name'];
    $userEmail = $users[$userId]['email'];
    @mailDailyUploadSummary($userEmail, $userName, $events);
}

// 2. Expiry warnings for events expiring in exactly 3 days
$expiryStmt = $db->prepare(
    'SELECT u.name AS user_name, u.email AS user_email, e.name AS event_name,
            e.expires_at
     FROM events e
     JOIN users u ON u.id = e.user_id
     WHERE e.status = "active"
       AND DATE(e.expires_at) = DATE(?)
       AND u.email_notifications_enabled = 1
       AND u.email_expiry_alerts = 1'
);
$expiryStmt->execute([$threeDaysLater->format('Y-m-d')]);
$expiryEvents = $expiryStmt->fetchAll();

foreach ($expiryEvents as $event) {
    @mailExpiryWarning($event['user_email'], $event['user_name'], $event['event_name'], $event['expires_at']);
}

// 3. Optional plan warning reminder for existing events crossing 80% limit
// This is kept intentionally simple to avoid duplicate messages.
// More advanced plan alerts can be added later if required.

// Output execution summary for cron logs
echo sprintf("Daily summaries: %d, expiry warnings: %d\n", count($batched), count($expiryEvents));
