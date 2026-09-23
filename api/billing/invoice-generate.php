<?php
// ============================================================
// WedPix SaaS — api/billing/invoice-generate.php
// POST Internal endpoint — generates invoice after payment
// Called from webhook or manually
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/email/mailer.php';

// This endpoint can be called internally or via direct POST
// For security, you may want to add a shared secret check

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') sendError('Method not allowed', 405);

$body = json_decode(file_get_contents('php://input'), true) ?? [];

$subscriptionId = (int)($body['subscription_id'] ?? 0);
$userId = (int)($body['user_id'] ?? 0);

if (!$subscriptionId || !$userId) {
    sendError('subscription_id și user_id sunt obligatorii.', 400);
}

$db = getDB();

// Get subscription details
$subStmt = $db->prepare('
    SELECT s.*, u.name, u.email, u.fiscal_type, u.company_name, u.cui, 
           u.address, u.city, u.county, u.postal_code
    FROM subscriptions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.user_id = ? AND s.status = "active"
');
$subStmt->execute([$subscriptionId, $userId]);
$subscription = $subStmt->fetch();

if (!$subscription) {
    sendError('Subscription not found or not active.', 404);
}

$plan = $subscription['plan'];
$planData = PLANS[$plan] ?? null;

if (!$planData || $plan === 'demo') {
    // Demo plans don't generate invoices
    sendJson(['message' => 'No invoice for demo plan.']);
}

// Check if invoice already exists for this subscription
$existingStmt = $db->prepare('SELECT id FROM invoices WHERE subscription_id = ?');
$existingStmt->execute([$subscriptionId]);
if ($existingStmt->fetch()) {
    sendJson(['message' => 'Invoice already exists for this subscription.']);
}

// Generate invoice number: FACTURA-YYYY-MM-AUTO_INCREMENT
$invoiceNumber = 'FACTURA-' . date('Ym') . '-' . str_pad($subscriptionId, 6, '0', STR_PAD_LEFT);

// Client details
$clientName = $subscription['fiscal_type'] === 'PJ'
    ? $subscription['company_name'] ?: $subscription['name']
    : $subscription['name'];
$clientCUI = $subscription['cui'] ?: null;
$clientAddress = $subscription['address'] ?: 'București, România';
$clientCity = $subscription['city'] ?: 'București';
$clientCounty = $subscription['county'] ?: null;
$clientPostal = $subscription['postal_code'] ?: null;

// Calculate amounts
$amountPretax = (float)$subscription['price_ron'];
$vatRate = 19.00; // Standard VAT in Romania
$vatAmount = round($amountPretax * $vatRate / 100, 2);
$totalAmount = round($amountPretax + $vatAmount, 2);

// Description
$planName = $planData['name'];
$validityDays = (int)$planData['validity_days'];
$description = "Pachet {$planName} - WedPix SaaS (valabil {$validityDays} zile)";

// Insert invoice
$invoiceStmt = $db->prepare(
    'INSERT INTO invoices (
        subscription_id, user_id, invoice_number, fiscal_type,
        seller_name, seller_cui, seller_address, seller_phone, seller_email,
        client_name, client_cui, client_address, client_city, client_county, client_postal_code,
        description, amount_pretax, vat_rate, vat_amount, total_amount,
        currency, payment_method, status, issued_at, due_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))'
);

$invoiceStmt->execute([
    $subscriptionId,
    $userId,
    $invoiceNumber,
    $subscription['fiscal_type'],
    'Nixart Romania SRL',
    'J2022002045045',
    'Licurici 2, Bacău',
    '0750 222 962',
    'help@wedpix.ro',
    $clientName,
    $clientCUI,
    $clientAddress,
    $clientCity,
    $clientCounty,
    $clientPostal,
    $description,
    $amountPretax,
    $vatRate,
    $vatAmount,
    $totalAmount,
    'RON',
    'Stripe',
    'issued'
]);

$invoiceId = (int)$db->lastInsertId();

// Send email with invoice
$invoiceViewUrl = APP_URL . '/dashboard/invoices/' . $invoiceId;
mailInvoiceReady(
    $subscription['email'],
    $subscription['name'],
    $invoiceNumber,
    number_format($totalAmount, 2, ',', '.') . ' RON',
    $invoiceViewUrl
);

sendJson([
    'message' => 'Invoice generated successfully.',
    'invoice_id' => $invoiceId,
    'invoice_number' => $invoiceNumber,
    'total' => $totalAmount,
]);
