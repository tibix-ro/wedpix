<?php
// ============================================================
// WedPix SaaS — api/billing/invoice-settings.php
// POST {fiscal_type, company_name?, cui?, address, city, county, postal_code}
// Saves user's fiscal/invoice details
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Method not allowed', 405);

$auth = requireAuth();
$body = json_decode(file_get_contents('php://input'), true) ?? [];

$fiscalType = strtoupper(trim($body['fiscal_type'] ?? ''));
$companyName = trim($body['company_name'] ?? '');
$cui = trim($body['cui'] ?? '');
$address = trim($body['address'] ?? '');
$city = trim($body['city'] ?? '');
$county = trim($body['county'] ?? '');
$postalCode = trim($body['postal_code'] ?? '');

// Validate fiscal type
if (!in_array($fiscalType, ['PF', 'PJ'])) {
    sendError('fiscal_type trebuie să fie PF (Persoană Fizică) sau PJ (Persoană Juridică).', 400);
}

// For PJ, CUI is mandatory
if ($fiscalType === 'PJ' && !$cui) {
    sendError('CUI-ul este obligatoriu pentru Persoană Juridică.', 400);
}

// Validate CUI format if provided
if ($cui && !validateRomanianCUI($cui)) {
    sendError('Formatul CUI-ului nu este valid. Exemplu: RO12345678.', 400);
}

// Basic validation
if (!$address || !$city) {
    sendError('Adresa și orașul sunt obligatorii.', 400);
}

$db = getDB();

// Update user fiscal details
$stmt = $db->prepare(
    'UPDATE users 
     SET    fiscal_type = ?, company_name = ?, cui = ?, address = ?, city = ?, county = ?, postal_code = ?
     WHERE  id = ?'
);
$stmt->execute([$fiscalType, $companyName ?: null, $cui ?: null, $address, $city, $county ?: null, $postalCode ?: null, $auth['user_id']]);

sendJson(['message' => 'Date fiscale salvate cu succes.']);

// ── CUI validation ────────────────────────────────────────
function validateRomanianCUI(string $cui): bool
{
    $cui = strtoupper(trim($cui));
    if (!preg_match('/^RO\d{8,10}$/', $cui)) return false;

    $numbers = substr($cui, 2);
    if (strlen($numbers) < 8) return false;

    $control = (int)substr($numbers, -1);
    $digits = substr($numbers, 0, -1);

    $weights = [7, 5, 3, 2, 1, 4, 6, 7, 5];
    $sum = 0;

    for ($i = 0; $i < strlen($digits); $i++) {
        $sum += (int)$digits[$i] * $weights[$i];
    }

    $checkDigit = (10 - ($sum % 10)) % 10;
    return $checkDigit === $control;
}
