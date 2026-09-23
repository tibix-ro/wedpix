<?php
// ============================================================
// WedPix SaaS — api/billing/invoice-view.php
// GET ?id=X
// Returns HTML invoice for viewing/printing
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendError('Method not allowed', 405);

$auth = requireAuth();
$invoiceId = (int)($_GET['id'] ?? 0);

if (!$invoiceId) sendError('ID factură obligatoriu.', 400);

$db = getDB();

// Get invoice (verify ownership)
$stmt = $db->prepare('SELECT * FROM invoices WHERE id = ? AND user_id = ?');
$stmt->execute([$invoiceId, $auth['user_id']]);
$invoice = $stmt->fetch();

if (!$invoice) {
    http_response_code(404);
    sendJson(['error' => 'Factură nu găsită.']);
}

// Build HTML invoice
$html = buildInvoiceHTML($invoice);

header('Content-Type: text/html; charset=UTF-8');
echo $html;
exit();

// ── Invoice HTML template ─────────────────────────────────
function buildInvoiceHTML(array $invoice): string
{
    $invoiceNumber = htmlspecialchars($invoice['invoice_number']);
    $sellerName = htmlspecialchars($invoice['seller_name']);
    $sellerCUI = htmlspecialchars($invoice['seller_cui']);
    $sellerAddress = htmlspecialchars($invoice['seller_address']);
    $sellerPhone = htmlspecialchars($invoice['seller_phone']);
    $sellerEmail = htmlspecialchars($invoice['seller_email']);

    $clientName = htmlspecialchars($invoice['client_name']);
    $clientCUI = $invoice['client_cui'] ? htmlspecialchars($invoice['client_cui']) : '—';
    $clientAddress = htmlspecialchars($invoice['client_address'] ?? '');
    $clientCity = htmlspecialchars($invoice['client_city'] ?? '');
    $clientCounty = $invoice['client_county'] ? htmlspecialchars($invoice['client_county']) : '';
    $clientPostal = htmlspecialchars($invoice['client_postal_code'] ?? '');

    $description = htmlspecialchars($invoice['description']);
    $amountPretax = number_format($invoice['amount_pretax'], 2, ',', '.');
    $vatRate = number_format($invoice['vat_rate'], 2, ',', '.');
    $vatAmount = number_format($invoice['vat_amount'], 2, ',', '.');
    $totalAmount = number_format($invoice['total_amount'], 2, ',', '.');
    $currency = htmlspecialchars($invoice['currency']);
    $paymentMethod = htmlspecialchars($invoice['payment_method']);
    $issuedAt = date('d.m.Y H:i', strtotime($invoice['issued_at']));
    $dueAt = $invoice['due_at'] ? date('d.m.Y', strtotime($invoice['due_at'])) : date('d.m.Y', strtotime('+30 days', strtotime($invoice['issued_at'])));
    $status = htmlspecialchars($invoice['status']);
    $notes = $invoice['notes'] ? htmlspecialchars($invoice['notes']) : '';

    $clientFullAddress = trim("$clientAddress, $clientCity" . ($clientCounty ? ", $clientCounty" : "") . ($clientPostal ? ", $clientPostal" : ""));

    return <<<HTML
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factură $invoiceNumber</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        .container {
            background: #fff;
            border: 2px solid #C9A96E;
            padding: 40px;
            border-radius: 8px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 40px;
            border-bottom: 3px solid #C9A96E;
            padding-bottom: 20px;
        }
        .logo {
            line-height: 0;
        }
        .invoice-info {
            text-align: right;
        }
        .invoice-info p {
            margin: 4px 0;
            font-size: 14px;
        }
        .invoice-number {
            font-size: 18px;
            font-weight: bold;
            color: #3D3535;
        }
        .invoice-status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            margin-top: 8px;
        }
        .status-issued { background: #C9A96E; color: white; }
        .status-paid { background: #4CAF50; color: white; }
        .status-draft { background: #9E9E9E; color: white; }
        .status-cancelled { background: #F44336; color: white; }
        
        .parties {
            display: flex;
            justify-content: space-between;
            margin: 30px 0;
        }
        .party {
            flex: 1;
            padding: 0 15px;
        }
        .party h3 {
            margin: 0 0 10px;
            font-size: 14px;
            font-weight: bold;
            color: #C9A96E;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .party p {
            margin: 6px 0;
            font-size: 13px;
            line-height: 1.6;
        }
        .party-divider {
            flex: 0;
            width: 1px;
            background: #ddd;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
        }
        th {
            background: #C9A96E;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            font-size: 13px;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
        }
        tr:last-child td {
            border-bottom: none;
        }
        
        .totals {
            display: flex;
            justify-content: flex-end;
            margin: 20px 0;
        }
        .totals-table {
            width: 350px;
        }
        .totals-table tr td:first-child {
            text-align: right;
            padding-right: 20px;
            font-weight: 600;
        }
        .totals-table tr td:last-child {
            text-align: right;
            font-weight: 600;
        }
        .total-row {
            background: #C9A96E;
            color: white;
            font-size: 14px !important;
        }
        .total-row td {
            border: none;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
        }
        .footer p {
            margin: 4px 0;
        }
        
        .notes {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
            font-size: 12px;
        }
        
        @media print {
            body { margin: 0; padding: 0; }
            .container { border: none; box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo"><img src="https://www.wedpix.ro/LOGO-WEDPIX-TRANS.png" alt="WedPix" style="height:40px;width:auto;" /></div>
            <div class="invoice-info">
                <div class="invoice-number">Factură $invoiceNumber</div>
                <div class="invoice-status status-$status">$status</div>
                <p><strong>Data emiterii:</strong> $issuedAt</p>
                <p><strong>Scadență:</strong> $dueAt</p>
            </div>
        </div>

        <!-- Parties (Seller & Client) -->
        <div class="parties">
            <div class="party">
                <h3>Furnizor</h3>
                <p><strong>$sellerName</strong></p>
                <p>CUI: $sellerCUI</p>
                <p>$sellerAddress</p>
                <p>Tel: $sellerPhone</p>
                <p>Email: $sellerEmail</p>
            </div>
            <div class="party-divider"></div>
            <div class="party">
                <h3>Client</h3>
                <p><strong>$clientName</strong></p>
                <p>CUI: $clientCUI</p>
                <p>$clientFullAddress</p>
            </div>
        </div>

        <!-- Items Table -->
        <table>
            <thead>
                <tr>
                    <th style="width: 50%;">Descriere</th>
                    <th style="width: 15%; text-align: center;">Cantitate</th>
                    <th style="width: 20%; text-align: right;">Preț unitar</th>
                    <th style="width: 15%; text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>$description</td>
                    <td style="text-align: center;">1</td>
                    <td style="text-align: right;">$amountPretax $currency</td>
                    <td style="text-align: right;"><strong>$amountPretax $currency</strong></td>
                </tr>
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
            <table class="totals-table">
                <tr>
                    <td>Subtotal:</td>
                    <td>$amountPretax $currency</td>
                </tr>
                <tr>
                    <td>TVA ($vatRate%):</td>
                    <td>$vatAmount $currency</td>
                </tr>
                <tr class="total-row">
                    <td>TOTAL:</td>
                    <td>$totalAmount $currency</td>
                </tr>
            </table>
        </div>

        <!-- Payment Info -->
        <div style="margin: 30px 0; padding: 15px; background: #FDF8F0; border-radius: 4px; font-size: 13px;">
            <p><strong>Metoda de plată:</strong> $paymentMethod</p>
            <p><strong>Monedă:</strong> $currency</p>
            <p><strong>Status plată:</strong> 
                HTML;
    if ($invoice['status'] === 'paid') {
        $paidAt = date('d.m.Y', strtotime($invoice['paid_at']));
        $html .= "Plătit la $paidAt";
    } else {
        $html .= "Neachitat";
    }
    $html .= <<<HTML
            </p>
        </div>

        <!-- Notes -->
        HTML;
    if ($notes) {
        $html .= <<<HTML
        <div class="notes">
            <strong>Note:</strong><br>
            $notes
        </div>
HTML;
    }

    $html .= <<<HTML
        <!-- Footer -->
        <div class="footer">
            <p>Această factură a fost emisă automat de sistem WedPix SaaS.</p>
            <p>Pentru orice întrebări, contactați: $sellerEmail</p>
            <p style="margin-top: 10px; text-align: center; color: #999;">
                WedPix © 2024. Toate drepturile rezervate. | www.wedpix.ro/events
            </p>
        </div>
    </div>
</body>
</html>
HTML;

    return $html;
}
