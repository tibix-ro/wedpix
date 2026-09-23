<?php
// ============================================================
// WedPix SaaS — api/billing/invoice-list.php
// GET — returns user's invoices
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendError('Method not allowed', 405);

$auth = requireAuth();
$db = getDB();

// Get invoices for logged-in user
$stmt = $db->prepare(
    'SELECT id, invoice_number, client_name, total_amount, status, issued_at, due_at, payment_method
     FROM invoices
     WHERE user_id = ?
     ORDER BY issued_at DESC'
);
$stmt->execute([$auth['user_id']]);
$invoices = $stmt->fetchAll();

$formattedInvoices = array_map(function ($inv) {
    return [
        'id' => (int)$inv['id'],
        'number' => $inv['invoice_number'],
        'client' => $inv['client_name'],
        'amount' => (float)$inv['total_amount'],
        'status' => $inv['status'],
        'issued_at' => $inv['issued_at'],
        'due_at' => $inv['due_at'],
        'payment_method' => $inv['payment_method'],
    ];
}, $invoices);

sendJson(['invoices' => $formattedInvoices]);
