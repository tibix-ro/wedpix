<?php
// ============================================================
// WedPix SaaS — api/user/delete.php
// DELETE - Complete account deletion (GDPR Right to Erasure)
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') sendError('Method not allowed', 405);

$auth = requireAuth();
$userId = (int)$auth['user_id'];

$db = getDB();

// Start transaction for data consistency
$db->beginTransaction();

try {
    // Get all events for this user to delete their files
    $eventsStmt = $db->prepare('SELECT id FROM events WHERE user_id = ?');
    $eventsStmt->execute([$userId]);
    $eventIds = $eventsStmt->fetchAll(PDO::FETCH_COLUMN);

    // Delete all images and their files
    foreach ($eventIds as $eventId) {
        // Delete image files from disk
        $imageStmt = $db->prepare('SELECT filename FROM images WHERE event_id = ?');
        $imageStmt->execute([$eventId]);
        $images = $imageStmt->fetchAll(PDO::FETCH_COLUMN);

        foreach ($images as $filename) {
            $filePath = UPLOAD_DIR . $eventId . '/' . $filename;
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }

        // Delete image records
        $deleteImagesStmt = $db->prepare('DELETE FROM images WHERE event_id = ?');
        $deleteImagesStmt->execute([$eventId]);

        // Delete event directory if empty
        $eventDir = UPLOAD_DIR . $eventId . '/';
        if (is_dir($eventDir)) {
            @rmdir($eventDir);
        }
    }

    // Delete events
    $deleteEventsStmt = $db->prepare('DELETE FROM events WHERE user_id = ?');
    $deleteEventsStmt->execute([$userId]);

    // Delete subscriptions
    $deleteSubsStmt = $db->prepare('DELETE FROM subscriptions WHERE user_id = ?');
    $deleteSubsStmt->execute([$userId]);

    // Finally, delete the user account
    $deleteUserStmt = $db->prepare('DELETE FROM users WHERE id = ?');
    $deleteUserStmt->execute([$userId]);

    // Commit transaction
    $db->commit();

    sendJson(['success' => true, 'message' => 'Cont șters cu succes']);
} catch (Exception $e) {
    // Rollback on error
    $db->rollBack();
    error_log('Account deletion failed: ' . $e->getMessage());
    sendError('Eroare la ștergerea contului. Te rugăm să contactezi suportul.', 500);
}
