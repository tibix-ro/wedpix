<?php
// ============================================================
// WedPix Admin — api/admin/users.php
// GET  ?search=&page=&per_page=   → list users
// DELETE ?id=                     → delete user
// PATCH {id, is_admin}            → toggle admin role
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/middleware/auth.php';

$admin = requireAdmin();
$db    = getDB();

// ── GET ──────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $search  = trim($_GET['search'] ?? '');
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(50, max(10, (int)($_GET['per_page'] ?? 20)));
    $offset  = ($page - 1) * $perPage;

    $where  = '';
    $params = [];
    if ($search !== '') {
        $where    = 'WHERE u.name LIKE ? OR u.email LIKE ?';
        $like     = '%' . $search . '%';
        $params[] = $like;
        $params[] = $like;
    }

    $hasAdmin = usersTableHasAdminColumn($db);
    $adminSel = $hasAdmin ? ', u.is_admin' : ', 0 AS is_admin';

    $total = (int)$db->prepare("SELECT COUNT(*) FROM users u $where")
        ->execute($params) ? $db->prepare("SELECT COUNT(*) FROM users u $where")->execute($params) : 0;
    $cntStmt = $db->prepare("SELECT COUNT(*) FROM users u $where");
    $cntStmt->execute($params);
    $total = (int)$cntStmt->fetchColumn();

    $sql = "SELECT u.id, u.name, u.email, u.created_at {$adminSel},
                   (SELECT plan  FROM subscriptions WHERE user_id = u.id AND status='active' LIMIT 1) AS active_plan,
                   (SELECT COUNT(*) FROM events WHERE user_id = u.id) AS event_count,
                   (SELECT COUNT(*) FROM images i JOIN events e ON e.id=i.event_id WHERE e.user_id=u.id) AS image_count
            FROM users u
            $where
            ORDER BY u.created_at DESC
            LIMIT $perPage OFFSET $offset";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll();

    foreach ($users as &$u) {
        $u['id']         = (int)$u['id'];
        $u['is_admin']   = (bool)$u['is_admin'];
        $u['event_count'] = (int)$u['event_count'];
        $u['image_count'] = (int)$u['image_count'];
    }
    unset($u);

    sendJson([
        'users'      => $users,
        'total'      => $total,
        'page'       => $page,
        'per_page'   => $perPage,
        'last_page'  => (int)ceil($total / $perPage),
    ]);
}

// ── DELETE ───────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) sendError('ID lipsă.');
    if ($id === (int)$admin['user_id']) sendError('Nu poți șterge propriul cont de admin.', 403);

    // Don't allow deleting another admin
    if (usersTableHasAdminColumn($db)) {
        $checkStmt = $db->prepare('SELECT is_admin FROM users WHERE id = ?');
        $checkStmt->execute([$id]);
        $row = $checkStmt->fetch();
        if ($row && $row['is_admin']) sendError('Nu poți șterge un alt admin.', 403);
    }

    $db->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
    sendJson(['deleted' => true]);
}

// ── PATCH ────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $body    = json_decode(file_get_contents('php://input'), true) ?? [];
    $id      = (int)($body['id'] ?? 0);
    $isAdmin = (bool)($body['is_admin'] ?? false);

    if (!$id) sendError('ID lipsă.');
    if ($id === (int)$admin['user_id']) sendError('Nu poți modifica propriul rol.', 403);
    if (!usersTableHasAdminColumn($db)) sendError('Coloana is_admin nu există. Rulează migrarea SQL.', 500);

    $db->prepare('UPDATE users SET is_admin = ? WHERE id = ?')->execute([(int)$isAdmin, $id]);
    sendJson(['updated' => true, 'is_admin' => $isAdmin]);
}

sendError('Method not allowed', 405);
