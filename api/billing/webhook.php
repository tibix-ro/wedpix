<?php
// ============================================================
// WedPix SaaS — api/billing/webhook.php
// Stripe webhook receiver — verifies signature, activates subscription
// ============================================================
declare(strict_types=1);
// NOTE: Do NOT output CORS headers before this — webhook comes from Stripe
require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/email/mailer.php';

// Override Content-Type for webhook (Stripe sends raw body)
$rawBody   = file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

// ── Verify Stripe signature ───────────────────────────────────
if (!verifyStripeSignature($rawBody, $sigHeader, STRIPE_WEBHOOK_SECRET)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid signature']);
    exit();
}

$event = json_decode($rawBody, true);
if (!$event) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payload']);
    exit();
}

$db = getDB();

// ── Handle events ─────────────────────────────────────────────
switch ($event['type']) {

    case 'checkout.session.completed':
        $session = $event['data']['object'];
        $subId   = (int)($session['metadata']['sub_id']  ?? 0);
        $plan    = $session['metadata']['plan']           ?? '';
        $userId  = (int)($session['metadata']['user_id'] ?? 0);
        $piId    = $session['payment_intent']             ?? null;

        if (!$subId || !$plan || !isset(PLANS[$plan])) break;

        // Read back the add-ons stored at checkout creation so extra
        // validity days (if purchased) are reflected in the expiry date.
        $subRow = $db->prepare('SELECT extra_validity_days FROM subscriptions WHERE id = ?');
        $subRow->execute([$subId]);
        $subExtras = $subRow->fetch() ?: [];

        $planData   = effectivePlan($plan, $subExtras);
        $validDays  = $planData['validity_days'];
        $startedAt  = date('Y-m-d H:i:s');
        $expiresAt  = date('Y-m-d H:i:s', strtotime("+{$validDays} days"));

        $db->prepare(
            'UPDATE subscriptions
             SET    status = "active", stripe_payment_intent = ?,
                    started_at = ?, expires_at = ?
             WHERE  id = ?'
        )->execute([$piId, $startedAt, $expiresAt, $subId]);

        // Notify user
        $userStmt = $db->prepare('SELECT name, email FROM users WHERE id = ?');
        $userStmt->execute([$userId]);
        $user = $userStmt->fetch();
        if ($user) {
            $createUrl = APP_URL . '/dashboard/events/new?sub=' . $subId;
            mailSubscriptionActive($user['email'], $user['name'], $plan, $createUrl);

            // Generate invoice asynchronously (non-blocking)
            if ($plan !== 'demo') {
                generateInvoiceAsync($subId, $userId);
            }
        }
        break;

    case 'payment_intent.payment_failed':
        $pi    = $event['data']['object'];
        $subId = (int)($pi['metadata']['sub_id'] ?? 0);
        if ($subId) {
            $db->prepare("UPDATE subscriptions SET status = 'cancelled' WHERE id = ?")
                ->execute([$subId]);
        }
        break;
}

http_response_code(200);
echo json_encode(['received' => true]);
exit();

// ── Stripe signature verification ─────────────────────────────
function verifyStripeSignature(string $payload, string $sigHeader, string $secret): bool
{
    if (!$sigHeader) return false;

    $parts     = [];
    foreach (explode(',', $sigHeader) as $part) {
        [$k, $v] = explode('=', $part, 2);
        $parts[$k] = $v;
    }

    if (empty($parts['t']) || empty($parts['v1'])) return false;

    $signedPayload = $parts['t'] . '.' . $payload;
    $expected      = hash_hmac('sha256', $signedPayload, $secret);

    // Reject events older than 5 minutes (replay protection)
    if (abs(time() - (int)$parts['t']) > 300) return false;

    return hash_equals($expected, $parts['v1']);
}

// ── Generate invoice async ────────────────────────────────────
function generateInvoiceAsync(int $subscriptionId, int $userId): void
{
    // Call invoice-generate.php endpoint internally via curl
    // This runs in background without blocking webhook response
    $ch = curl_init();
    $payload = json_encode([
        'subscription_id' => $subscriptionId,
        'user_id' => $userId,
    ]);

    curl_setopt_array($ch, [
        CURLOPT_URL => API_URL . '/billing/invoice-generate.php',
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_CONNECTTIMEOUT => 2,
    ]);

    @curl_exec($ch);
    @curl_close($ch);
}
