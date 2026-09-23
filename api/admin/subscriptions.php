<?php
// ============================================================
// WedPix Admin — api/admin/subscriptions.php
// GET  ?status=&plan=&page=   → list subscriptions
// PATCH {id, status}          → update status
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/middleware/auth.php';

requireAdmin();
$db = getDB();

// ── GET ──────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $status  = $_GET['status'] ?? '';
    $plan    = $_GET['plan']   ?? '';
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = 20;
    $offset  = ($page - 1) * $perPage;

    $conditions = [];
    $params     = [];
    if ($status) { $conditions[] = 's.status = ?'; $params[] = $status; }
    if ($plan)   { $conditions[] = 's.plan = ?';   $params[] = $plan; }
    $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

    $cntStmt = $db->prepare("SELECT COUNT(*) FROM subscriptions s $where");
    $cntStmt->execute($params);
    $total = (int)$cntStmt->fetchColumn();

    $sql = "SELECT s.id, s.plan, s.status, s.price_ron, s.started_at, s.expires_at, s.created_at,
                   s.stripe_payment_intent,
                   s.extra_video, s.extra_zip, s.extra_slideshow,
                   s.extra_validity_days, s.extra_photo_limit,
                   u.id AS user_id, u.name AS user_name, u.email AS user_email,
                   (SELECT COUNT(*) FROM events WHERE subscription_id = s.id) AS event_count,
                   (SELECT name FROM events WHERE subscription_id = s.id LIMIT 1) AS event_name
            FROM subscriptions s
            JOIN users u ON u.id = s.user_id
            $where
            ORDER BY s.created_at DESC
            LIMIT $perPage OFFSET $offset";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $subs = $stmt->fetchAll();

    foreach ($subs as &$s) {
        $s['id']                  = (int)$s['id'];
        $s['user_id']             = (int)$s['user_id'];
        $s['event_count']         = (int)$s['event_count'];
        $s['price_ron']           = (float)$s['price_ron'];
        $s['extra_video']         = (bool)$s['extra_video'];
        $s['extra_zip']           = (bool)$s['extra_zip'];
        $s['extra_slideshow']     = (bool)$s['extra_slideshow'];
        $s['extra_validity_days'] = (int)$s['extra_validity_days'];
        $s['extra_photo_limit']   = (int)$s['extra_photo_limit'];
    }
    unset($s);

    sendJson([
        'subscriptions' => $subs,
        'total'         => $total,
        'page'          => $page,
        'per_page'      => $perPage,
        'last_page'     => (int)ceil($total / $perPage),
    ]);
}

// ── PATCH ── update status / plan (upgrade–downgrade) / extras ──
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int)($body['id'] ?? 0);
    if (!$id) sendError('ID lipsă.');

    // Load current subscription
    $cur = $db->prepare('SELECT plan, status, expires_at FROM subscriptions WHERE id = ?');
    $cur->execute([$id]);
    $row = $cur->fetch();
    if (!$row) sendError('Abonament inexistent.', 404);

    $fields = [];
    $vals   = [];

    // Plan upgrade / downgrade
    $targetPlan = $row['plan'];
    if (array_key_exists('plan', $body)) {
        $targetPlan = strtolower(trim((string)$body['plan']));
        if (!isset(PLANS[$targetPlan])) {
            sendError('Plan invalid. Alege: demo, silver, gold sau platinum.');
        }
        $fields[] = 'plan = ?';
        $vals[]   = $targetPlan;
        $fields[] = 'price_ron = ?';
        $vals[]   = (float)PLANS[$targetPlan]['price_ron'];
    }

    // Extra add-ons (force feature ON)
    foreach (['extra_video', 'extra_zip', 'extra_slideshow'] as $ex) {
        if (array_key_exists($ex, $body)) {
            $fields[] = "$ex = ?";
            $vals[]   = !empty($body[$ex]) ? 1 : 0;
        }
    }

    // Stackable extras (extra validity days / extra photo storage)
    foreach (['extra_validity_days', 'extra_photo_limit'] as $ex) {
        if (array_key_exists($ex, $body)) {
            $fields[] = "$ex = ?";
            $vals[]   = max(0, (int)$body[$ex]);
        }
    }

    // Status change
    if (array_key_exists('status', $body)) {
        $status = $body['status'] ?? '';
        if (!in_array($status, ['active', 'cancelled', 'expired', 'pending'], true)) {
            sendError('Status invalid.');
        }
        $fields[] = 'status = ?';
        $vals[]   = $status;

        // When (re)activating and no expiry set, compute from the target plan
        if ($status === 'active' && empty($row['expires_at'])) {
            $days     = (int)(PLANS[$targetPlan]['validity_days'] ?? 30);
            $fields[] = 'started_at = NOW()';
            $fields[] = 'expires_at = DATE_ADD(NOW(), INTERVAL ' . $days . ' DAY)';
        }
    }

    if (!$fields) sendError('Nimic de actualizat.');

    $vals[] = $id;
    $db->prepare('UPDATE subscriptions SET ' . implode(', ', $fields) . ' WHERE id = ?')
       ->execute($vals);

    sendJson(['updated' => true]);
}

// ── POST — create manual subscription ────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $userId = (int)($body['user_id'] ?? 0);
    $plan   = strtolower(trim($body['plan'] ?? ''));

    if (!$userId) sendError('user_id lipsă.');
    if (!isset(PLANS[$plan])) sendError('Plan invalid. Alege: demo, silver, gold sau platinum.');

    // Verify user exists
    $userStmt = $db->prepare('SELECT id FROM users WHERE id = ?');
    $userStmt->execute([$userId]);
    if (!$userStmt->fetch()) sendError('Utilizatorul nu există.', 404);

    $planData  = PLANS[$plan];
    $priceRon  = (float)$planData['price_ron'];

    $extraVideo     = !empty($body['extra_video']) ? 1 : 0;
    $extraZip       = !empty($body['extra_zip']) ? 1 : 0;
    $extraSlideshow = !empty($body['extra_slideshow']) ? 1 : 0;
    $extraValidityDays = max(0, (int)($body['extra_validity_days'] ?? 0));
    $extraPhotoLimit   = max(0, (int)($body['extra_photo_limit'] ?? 0));

    // If the user already has an active subscription, update it in place
    // (plan + extras) instead of creating a duplicate.
    $existing = $db->prepare(
        'SELECT id FROM subscriptions
         WHERE user_id = ? AND status = "active"
         ORDER BY created_at DESC LIMIT 1'
    );
    $existing->execute([$userId]);
    $activeId = $existing->fetchColumn();

    if ($activeId) {
        $db->prepare(
            'UPDATE subscriptions
             SET plan = ?, price_ron = ?, extra_video = ?, extra_zip = ?, extra_slideshow = ?,
                 extra_validity_days = ?, extra_photo_limit = ?
             WHERE id = ?'
        )->execute([$plan, $priceRon, $extraVideo, $extraZip, $extraSlideshow, $extraValidityDays, $extraPhotoLimit, (int)$activeId]);

        sendJson(['updated' => true, 'subscription_id' => (int)$activeId]);
    }

    // Otherwise create a new active subscription
    $days      = (float)$planData['validity_days'];
    $startedAt = date('Y-m-d H:i:s');
    $expiresAt = date('Y-m-d H:i:s', (int)(time() + ($days + $extraValidityDays) * 86400));

    $stmt = $db->prepare(
        'INSERT INTO subscriptions
            (user_id, plan, extra_video, extra_zip, extra_slideshow, extra_validity_days, extra_photo_limit, status, price_ron, started_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, "active", ?, ?, ?)'
    );
    $stmt->execute([$userId, $plan, $extraVideo, $extraZip, $extraSlideshow, $extraValidityDays, $extraPhotoLimit, $priceRon, $startedAt, $expiresAt]);
    $subId = (int)$db->lastInsertId();

    sendJson(['created' => true, 'subscription_id' => $subId, 'expires_at' => $expiresAt]);
}

// ── DELETE — remove a subscription that has no event attached ──
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) sendError('ID lipsă.');

    $usedStmt = $db->prepare('SELECT COUNT(*) FROM events WHERE subscription_id = ?');
    $usedStmt->execute([$id]);
    if ((int)$usedStmt->fetchColumn() > 0) {
        sendError('Abonamentul are un eveniment atașat și nu poate fi șters.', 409);
    }

    $del = $db->prepare('DELETE FROM subscriptions WHERE id = ?');
    $del->execute([$id]);
    if ($del->rowCount() === 0) sendError('Abonament inexistent.', 404);

    sendJson(['deleted' => true]);
}

sendError('Method not allowed', 405);
