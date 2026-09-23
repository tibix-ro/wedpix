<?php
// ============================================================
// WedPix SaaS — api/billing/create-checkout.php
// POST {plan, addons?, success_url?, cancel_url?}
// addons: { zip, slideshow, video, extra_validity_units, extra_storage_units }
// Creates a Stripe Checkout Session via cURL (no SDK)
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';

// Ensure session is started to access CSRF token from cookies
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once dirname(__DIR__) . '/middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Method not allowed', 405);

// ── CSRF protection ────────────────────────────────────────────
requireCSRF();

$auth = requireAuth();
$body = json_decode(file_get_contents('php://input'), true) ?? [];
$plan = strtolower(trim($body['plan'] ?? ''));

if (!isset(PLANS[$plan]) || $plan === 'demo') {
    sendError('Plan invalid. Alege: silver, gold sau platinum.');
}

$planData = PLANS[$plan];

// ── Add-ons selected by the customer ───────────────────────────
$addonsInput = is_array($body['addons'] ?? null) ? $body['addons'] : [];

// Toggle add-ons are only chargeable if the base plan doesn't already include them
$wantZip       = !empty($addonsInput['zip']);
$wantSlideshow = !empty($addonsInput['slideshow']);
$wantVideo     = !empty($addonsInput['video']);

$chargeZip       = $wantZip && !$planData['zip'];
$chargeSlideshow = $wantSlideshow && !$planData['slideshow'];
$chargeVideo     = $wantVideo && !$planData['video'];

// Quantity add-ons (stackable), clamped to configured max units
$validityUnits = max(0, min((int)($addonsInput['extra_validity_units'] ?? 0), ADDONS['extra_validity']['max_units']));
$storageUnits  = max(0, min((int)($addonsInput['extra_storage_units'] ?? 0), ADDONS['extra_storage']['max_units']));
if ($planData['photo_limit'] === PHP_INT_MAX) $storageUnits = 0; // unlimited plan already

$extraValidityDays = $validityUnits * ADDONS['extra_validity']['unit_days'];
$extraPhotoLimit   = $storageUnits * ADDONS['extra_storage']['unit_photos'];

$addonsCost  = 0.0;
$addonLabels = [];
if ($chargeZip)       { $addonsCost += ADDONS['zip']['price_ron'];       $addonLabels[] = ADDONS['zip']['name']; }
if ($chargeSlideshow) { $addonsCost += ADDONS['slideshow']['price_ron']; $addonLabels[] = ADDONS['slideshow']['name']; }
if ($chargeVideo)     { $addonsCost += ADDONS['video']['price_ron'];     $addonLabels[] = ADDONS['video']['name']; }
if ($validityUnits > 0) {
    $addonsCost   += $validityUnits * ADDONS['extra_validity']['price_ron'];
    $addonLabels[] = ADDONS['extra_validity']['name'] . ' x' . $validityUnits;
}
if ($storageUnits > 0) {
    $addonsCost   += $storageUnits * ADDONS['extra_storage']['price_ron'];
    $addonLabels[] = ADDONS['extra_storage']['name'] . ' x' . $storageUnits;
}

$totalPriceRon = (float)$planData['price_ron'] + $addonsCost;

$db = getDB();

// Get or create Stripe Customer
$userStmt = $db->prepare('SELECT id, name, email, stripe_customer_id FROM users WHERE id = ?');
$userStmt->execute([$auth['user_id']]);
$user = $userStmt->fetch();

$customerId = $user['stripe_customer_id'];
if (!$customerId) {
    $customerId = stripeCreateCustomer($user['email'], $user['name']);
    if (!$customerId) sendError('Nu s-a putut crea clientul Stripe.', 500);
    $db->prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?')
        ->execute([$customerId, $auth['user_id']]);
}

// Create pending subscription row (add-ons are stored immediately so the
// subscription already carries them once payment/webhook activates it)
$subStmt = $db->prepare(
    'INSERT INTO subscriptions
        (user_id, plan, extra_video, extra_zip, extra_slideshow, extra_validity_days, extra_photo_limit, status, price_ron)
     VALUES (?, ?, ?, ?, ?, ?, ?, "pending", ?)'
);
$subStmt->execute([
    $auth['user_id'],
    $plan,
    $wantVideo ? 1 : 0,
    $wantZip ? 1 : 0,
    $wantSlideshow ? 1 : 0,
    $extraValidityDays,
    $extraPhotoLimit,
    $totalPriceRon,
]);
$subId = (int)$db->lastInsertId();

$successUrl = $body['success_url'] ?? (APP_URL . '/dashboard?payment=success&sub=' . $subId);
$cancelUrl  = $body['cancel_url']  ?? (APP_URL . '/dashboard?payment=cancelled');

// Single combined total as one dynamic Stripe line item (plan + add-ons)
$sessionParams = [
    'mode'                                           => 'payment',
    'customer'                                       => $customerId,
    'line_items[0][price_data][currency]'            => STRIPE_CURRENCY,
    'line_items[0][price_data][product_data][name]'  => 'WedPix ' . $planData['name'],
    'line_items[0][price_data][unit_amount]'         => (string)(int)round($totalPriceRon * 100),
    'line_items[0][quantity]'                        => '1',
    'success_url'                                    => $successUrl,
    'cancel_url'                                     => $cancelUrl,
    'metadata[sub_id]'                                => (string)$subId,
    'metadata[plan]'                                  => $plan,
    'metadata[user_id]'                               => (string)$auth['user_id'],
    'payment_intent_data[metadata][sub_id]'           => (string)$subId,
];
if ($addonLabels) {
    $sessionParams['line_items[0][price_data][product_data][description]'] = 'Include: ' . implode(', ', $addonLabels);
}

$session = stripeRequest('POST', '/v1/checkout/sessions', $sessionParams);

// A stale customer_id from a different Stripe mode (e.g. saved while
// STRIPE_TEST_MODE was on, now running live) is rejected by Stripe as
// "No such customer" / resource_missing. Recreate the customer once and retry.
if (isset($session['error']) && ($session['error']['code'] ?? '') === 'resource_missing'
    && stripos($session['error']['param'] ?? '', 'customer') !== false
) {
    $customerId = stripeCreateCustomer($user['email'], $user['name']);
    if ($customerId) {
        $db->prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?')
            ->execute([$customerId, $auth['user_id']]);

        $sessionParams['customer'] = $customerId;
        $session = stripeRequest('POST', '/v1/checkout/sessions', $sessionParams);
    }
}

if (isset($session['error'])) {
    sendError('Eroare Stripe: ' . ($session['error']['message'] ?? 'necunoscută'), 500);
}

// Save session ID
$db->prepare('UPDATE subscriptions SET stripe_session_id = ? WHERE id = ?')
    ->execute([$session['id'], $subId]);

sendJson([
    'checkout_url'  => $session['url'],
    'session_id'    => $session['id'],
    'subscription_id' => $subId,
    'total_price_ron' => $totalPriceRon,
]);

// ── Stripe helpers ────────────────────────────────────────────
function stripeRequest(string $method, string $path, array $params = []): array
{
    $ch = curl_init();
    $url = 'https://api.stripe.com' . $path;

    $options = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERPWD        => STRIPE_SECRET_KEY . ':',
        CURLOPT_HTTPHEADER     => ['Stripe-Version: 2024-04-10'],
    ];

    if ($method === 'POST') {
        $options[CURLOPT_POST]       = true;
        $options[CURLOPT_POSTFIELDS] = http_build_query($params);
    } elseif ($method === 'GET' && $params) {
        $url .= '?' . http_build_query($params);
    }
    $options[CURLOPT_URL] = $url;

    curl_setopt_array($ch, $options);
    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true) ?? ['error' => ['message' => 'Invalid Stripe response']];
}

function stripeCreateCustomer(string $email, string $name): ?string
{
    $res = stripeRequest('POST', '/v1/customers', [
        'email' => $email,
        'name'  => $name,
        'metadata[source]' => 'wedpix',
    ]);
    return $res['id'] ?? null;
}
