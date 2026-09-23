<?php
// ============================================================
// WedPix SaaS — api/cron/data-retention.php
// Cron job to enforce data retention policies
// Run daily: 0 2 * * * php /path/to/api/cron/data-retention.php
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';

$db = getDB();
$deletedEvents = 0;
$deletedUsers = 0;

// 1. Delete expired events and their data
echo "Starting data retention cleanup...\n";

// Get expired events
$expiredEventsStmt = $db->prepare("
    SELECT e.id, e.user_id, e.expires_at
    FROM events e
    WHERE e.status = 'active'
    AND e.expires_at < NOW()
");
$expiredEventsStmt->execute();
$expiredEvents = $expiredEventsStmt->fetchAll();

foreach ($expiredEvents as $event) {
    $eventId = $event['id'];

    echo "Deleting expired event ID: $eventId\n";

    // Delete image files from disk
    $imageStmt = $db->prepare('SELECT filename FROM images WHERE event_id = ?');
    $imageStmt->execute([$eventId]);
    $images = $imageStmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($images as $filename) {
        $filePath = UPLOAD_DIR . $eventId . '/' . $filename;
        if (file_exists($filePath)) {
            unlink($filePath);
            echo "Deleted file: $filePath\n";
        }
    }

    // Delete image records
    $deleteImagesStmt = $db->prepare('DELETE FROM images WHERE event_id = ?');
    $deleteImagesStmt->execute([$eventId]);

    // Mark event as expired (don't delete completely, keep for audit)
    $updateEventStmt = $db->prepare("UPDATE events SET status = 'expired' WHERE id = ?");
    $updateEventStmt->execute([$eventId]);

    // Delete event directory if empty
    $eventDir = UPLOAD_DIR . $eventId . '/';
    if (is_dir($eventDir)) {
        @rmdir($eventDir);
    }

    $deletedEvents++;
}

// 2. Delete inactive user accounts (3 years of inactivity)
$inactiveUsersStmt = $db->prepare("
    SELECT u.id, u.email, u.created_at
    FROM users u
    LEFT JOIN events e ON e.user_id = u.id
    WHERE u.created_at < DATE_SUB(NOW(), INTERVAL 3 YEAR)
    AND e.id IS NULL
    AND NOT EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.user_id = u.id
        AND s.status = 'active'
        AND s.expires_at > NOW()
    )
");
$inactiveUsersStmt->execute();
$inactiveUsers = $inactiveUsersStmt->fetchAll();

foreach ($inactiveUsers as $user) {
    $userId = $user['id'];
    $email = $user['email'];

    echo "Deleting inactive user account: $email (ID: $userId)\n";

    // Delete any remaining events (shouldn't exist, but safety check)
    $userEventsStmt = $db->prepare('SELECT id FROM events WHERE user_id = ?');
    $userEventsStmt->execute([$userId]);
    $userEventIds = $userEventsStmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($userEventIds as $eventId) {
        // Delete files
        $imageStmt = $db->prepare('SELECT filename FROM images WHERE event_id = ?');
        $imageStmt->execute([$eventId]);
        $images = $imageStmt->fetchAll(PDO::FETCH_COLUMN);

        foreach ($images as $filename) {
            $filePath = UPLOAD_DIR . $eventId . '/' . $filename;
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }

        // Delete records
        $db->prepare('DELETE FROM images WHERE event_id = ?')->execute([$eventId]);
        $db->prepare('DELETE FROM events WHERE id = ?')->execute([$eventId]);
    }

    // Delete subscriptions and user
    $db->prepare('DELETE FROM subscriptions WHERE user_id = ?')->execute([$userId]);
    $db->prepare('DELETE FROM users WHERE id = ?')->execute([$userId]);

    $deletedUsers++;
}

echo "Data retention cleanup completed.\n";
echo "Deleted expired events: $deletedEvents\n";
echo "Deleted inactive users: $deletedUsers\n";
