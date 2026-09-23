<?php
// ============================================================
// WedPix SaaS — api/email/mailer.php
// SMTP delivery via Brevo (smtp-relay.brevo.com:587 + STARTTLS)
// From: hello@wedpix.ro
// ============================================================
declare(strict_types=1);

/**
 * Send an HTML email via SMTP (no external dependencies).
 *
 * @param string $to      Recipient email
 * @param string $subject Subject line
 * @param string $html    HTML body
 * @return bool           true on success, false on failure
 */
function sendMail(string $to, string $subject, string $html): bool
{
    $host    = defined('SMTP_HOST')      ? SMTP_HOST      : '';
    $port    = defined('SMTP_PORT')      ? (int)SMTP_PORT : 587;
    $user    = defined('SMTP_USER')      ? SMTP_USER      : '';
    $pass    = defined('SMTP_PASS')      ? SMTP_PASS      : '';
    $from    = defined('SMTP_FROM')      ? SMTP_FROM      : MAIL_FROM;
    $fromName = defined('SMTP_FROM_NAME') ? SMTP_FROM_NAME : MAIL_FROM_NAME;
    $replyTo = MAIL_REPLY_TO;

    // ── Build RFC 2822 message ───────────────────────────────
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $boundary       = md5(uniqid((string)mt_rand(), true));
    $date           = date('r');
    $msgId          = '<' . uniqid('wedpix', true) . '@wedpix.ro>';

    $headers  = "Date: {$date}\r\n";
    $headers .= "Message-ID: {$msgId}\r\n";
    $headers .= "From: {$fromName} <{$from}>\r\n";
    $headers .= "Reply-To: {$replyTo}\r\n";
    $headers .= "To: {$to}\r\n";
    $headers .= "Subject: {$encodedSubject}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: base64\r\n";
    $headers .= "X-Mailer: WedPix/SMTP\r\n";

    $body = chunk_split(base64_encode($html));
    $message = $headers . "\r\n" . $body;

    // ── SMTP conversation ────────────────────────────────────
    $errno = 0; $errstr = '';
    $sock = @fsockopen($host, $port, $errno, $errstr, 10);
    if (!$sock) {
        error_log("[WedPix Mail] fsockopen failed: {$errno} {$errstr}");
        return false;
    }

    $read = function() use ($sock): string {
        $resp = '';
        while ($line = fgets($sock, 512)) {
            $resp .= $line;
            if ($line[3] === ' ') break; // last line of multi-line reply
        }
        return $resp;
    };

    $send = function(string $cmd) use ($sock): void {
        fwrite($sock, $cmd . "\r\n");
    };

    $expect = function(string $code) use ($read): bool {
        $resp = $read();
        return str_starts_with(trim($resp), $code);
    };

    try {
        $read(); // 220 greeting

        $send('EHLO wedpix.ro');
        $read(); // 250 capabilities

        // STARTTLS
        $send('STARTTLS');
        if (!$expect('220')) throw new \RuntimeException('STARTTLS rejected');

        if (!stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            throw new \RuntimeException('TLS handshake failed');
        }

        $send('EHLO wedpix.ro');
        $read();

        // AUTH LOGIN
        $send('AUTH LOGIN');
        if (!$expect('334')) throw new \RuntimeException('AUTH LOGIN rejected');
        $send(base64_encode($user));
        if (!$expect('334')) throw new \RuntimeException('AUTH username rejected');
        $send(base64_encode($pass));
        if (!$expect('235')) throw new \RuntimeException('AUTH password rejected');

        // Envelope
        $send("MAIL FROM:<{$from}>");
        if (!$expect('250')) throw new \RuntimeException('MAIL FROM rejected');
        $send("RCPT TO:<{$to}>");
        if (!$expect('250')) throw new \RuntimeException('RCPT TO rejected');

        // Data
        $send('DATA');
        if (!$expect('354')) throw new \RuntimeException('DATA rejected');
        fwrite($sock, $message . "\r\n.");
        $send('');
        if (!$expect('250')) throw new \RuntimeException('Message body rejected');

        $send('QUIT');
        fclose($sock);
        return true;

    } catch (\Throwable $e) {
        error_log('[WedPix Mail] SMTP error: ' . $e->getMessage());
        @fclose($sock);
        return false;
    }
}

/**
 * Wrap HTML body in a branded email layout.
 */
function mailLayout(string $title, string $body): string
{
  return <<<HTML
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$title}</title>
</head>
<body style="margin:0;padding:0;background:#FDF8F0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#fff;border-radius:16px;overflow:hidden;
                      border:1px solid rgba(201,169,110,0.2);
                      box-shadow:0 4px 24px rgba(61,53,53,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#FFFBF5;padding:24px 40px;text-align:center;
                        border-bottom:3px solid #C9A96E;">
              <img src="https://www.wedpix.ro/LOGO-WEDPIX-TRANS.png" alt="WedPix"
                   style="height:44px;width:auto;" />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              {$body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:#FDF8F0;text-align:center;
                        border-top:1px solid rgba(201,169,110,0.15);">
              <p style="margin:0;color:#8B7B7B;font-size:12px;">
                WedPix &middot;
                <a href="https://www.wedpix.ro" style="color:#C9A96E;text-decoration:none;">wedpix.ro</a>
                &nbsp;|&nbsp;
                <a href="mailto:help@wedpix.ro" style="color:#C9A96E;text-decoration:none;">help@wedpix.ro</a>
              </p>
              <p style="margin:4px 0 0;color:#C5B8B8;font-size:10px;">
                Nixart Romania SRL &middot; Licurici 2, Bacău &middot; CUI: J2022002045045
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

// ── Email templates ──────────────────────────────────────────

function mailWelcome(string $to, string $name): bool
{
  $body = <<<HTML
<h2 style="color:#3D3535;font-weight:300;margin-top:0;">Bun venit, {$name}! 🎉</h2>
<p style="color:#3D3535;line-height:1.7;">
  Contul tău WedPix a fost creat cu succes. Acum poți crea primul tău eveniment
  și să distribui amintiri frumoase cu invitații tăi.
</p>
<div style="text-align:center;margin:32px 0;">
  <a href="https://www.wedpix.ro/dashboard"
     style="background:linear-gradient(135deg,#C9A96E,#E8D5A3);color:#fff;
            text-decoration:none;padding:14px 32px;border-radius:12px;
            font-weight:600;font-size:15px;display:inline-block;">
    Accesează Dashboard →
  </a>
</div>
HTML;
  return sendMail($to, 'Bun venit la WedPix! 🌸', mailLayout('Bun venit', $body));
}

function mailSubscriptionActive(string $to, string $name, string $plan, string $eventLink): bool
{
  $planLabel = strtoupper($plan);
  $body = <<<HTML
<h2 style="color:#3D3535;font-weight:300;margin-top:0;">Abonamentul tău este activ! ✨</h2>
<p style="color:#3D3535;line-height:1.7;">
  Plata pentru planul <strong>{$planLabel}</strong> a fost procesată cu succes.
  Poți crea acum evenimentul tău și să înceapă magia.
</p>
<div style="text-align:center;margin:32px 0;">
  <a href="{$eventLink}"
     style="background:linear-gradient(135deg,#C9A96E,#E8D5A3);color:#fff;
            text-decoration:none;padding:14px 32px;border-radius:12px;
            font-weight:600;font-size:15px;display:inline-block;">
    Creează evenimentul →
  </a>
</div>
HTML;
  return sendMail($to, "Abonamentul $planLabel este activ — WedPix", mailLayout('Abonament activ', $body));
}

function mailEventCreated(string $to, string $name, string $eventName, string $guestUrl, string $qrUrl): bool
{
  $body = <<<HTML
<h2 style="color:#3D3535;font-weight:300;margin-top:0;">Evenimentul „{$eventName}" a fost creat! 💐</h2>
<p style="color:#3D3535;line-height:1.7;">
  Distribuie linkul de mai jos invitaților tăi sau afișează codul QR la eveniment:
</p>
<div style="background:#FDF8F0;border:1px solid rgba(201,169,110,0.3);
            border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
  <p style="margin:0 0 8px;color:#8B7B7B;font-size:12px;text-transform:uppercase;letter-spacing:2px;">
    Link invitați
  </p>
  <a href="{$guestUrl}" style="color:#C9A96E;font-size:16px;word-break:break-all;">
    {$guestUrl}
  </a>
</div>
<div style="text-align:center;margin:32px 0;">
  <a href="https://www.wedpix.ro/dashboard"
     style="background:linear-gradient(135deg,#C9A96E,#E8D5A3);color:#fff;
            text-decoration:none;padding:14px 32px;border-radius:12px;
            font-weight:600;font-size:15px;display:inline-block;">
    Mergi la Dashboard →
  </a>
</div>
HTML;
  return sendMail($to, "Evenimentul „{$eventName}” este live — WedPix", mailLayout('Eveniment creat', $body));
}

function mailExpiryWarning(string $to, string $name, string $eventName, string $expiresAt): bool
{
  $body = <<<HTML
<h2 style="color:#3D3535;font-weight:300;margin-top:0;">⚠️ Evenimentul tău expiră în curând</h2>
<p style="color:#3D3535;line-height:1.7;">
  Evenimentul <strong>„{$eventName}”</strong> va expira la <strong>{$expiresAt}</strong>.
  Descarcă fotografiile înainte ca linkul să devină inactiv.
</p>
<div style="text-align:center;margin:32px 0;">
  <a href="https://www.wedpix.ro/dashboard"
     style="background:linear-gradient(135deg,#C9A96E,#E8D5A3);color:#fff;
            text-decoration:none;padding:14px 32px;border-radius:12px;
            font-weight:600;font-size:15px;display:inline-block;">
    Descarcă fotografiile →
  </a>
</div>
HTML;
  return sendMail($to, "Evenimentul „{$eventName}” expiră în curând — WedPix", mailLayout('Avertisment expirare', $body));
}

function mailFirstPhotoUploaded(string $to, string $name, string $eventName, string $guestUrl): bool
{
  $body = <<<HTML
<h2 style="color:#3D3535;font-weight:300;margin-top:0;">Prima amintire a sosit! 🎉</h2>
<p style="color:#3D3535;line-height:1.7;">
  Oaspeții tăi au început să încarce fotografii pentru evenimentul <strong>„{$eventName}”</strong>.
  Urmărește povestea vizuală și descarcă cele mai frumoase momente.
</p>
<div style="background:#FDF8F0;border:1px solid rgba(201,169,110,0.3);
            border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
  <p style="margin:0 0 8px;color:#8B7B7B;font-size:12px;text-transform:uppercase;letter-spacing:2px;">
    Link invitați
  </p>
  <a href="{$guestUrl}" style="color:#C9A96E;font-size:16px;word-break:break-all;">
    {$guestUrl}
  </a>
</div>
<div style="text-align:center;margin:32px 0;">
  <a href="https://www.wedpix.ro/dashboard"
     style="background:linear-gradient(135deg,#C9A96E,#E8D5A3);color:#fff;
            text-decoration:none;padding:14px 32px;border-radius:12px;
            font-weight:600;font-size:15px;display:inline-block;">
    Vezi evenimentul →
  </a>
</div>
HTML;
  return sendMail($to, 'Prima amintire a sosit! 🎉', mailLayout('Prima amintire', $body));
}

function mailPlanLimitWarning(string $to, string $name, string $eventName, int $used, int $limit): bool
{
  $body = <<<HTML
<h2 style="color:#3D3535;font-weight:300;margin-top:0;">Upgrade recomandat</h2>
<p style="color:#3D3535;line-height:1.7;">
  Evenimentul <strong>„{$eventName}”</strong> a ajuns la <strong>{$used}</strong> fotografii, adică peste 80% din limita planului.
  Dacă ai nevoie de mai mult spațiu, upgradează pentru a continua fără întreruperi.
</p>
<div style="text-align:center;margin:32px 0;">
  <a href="https://www.wedpix.ro/dashboard"
     style="background:linear-gradient(135deg,#C9A96E,#E8D5A3);color:#fff;
            text-decoration:none;padding:14px 32px;border-radius:12px;
            font-weight:600;font-size:15px;display:inline-block;">
    Mergi la upgrade →
  </a>
</div>
HTML;
  return sendMail($to, 'Upgrade recomandat — limita fotografiilor aproape atinsă', mailLayout('Upgrade recomandat', $body));
}

function mailDailyUploadSummary(string $to, string $name, array $events): bool
{
  $eventRows = '';
  foreach ($events as $event) {
    $eventRows .= <<<HTML
        <tr>
          <td style="padding:12px 16px;border:1px solid #F1E6D1;">{$event['name']}</td>
          <td style="padding:12px 16px;border:1px solid #F1E6D1;text-align:center;">{$event['new_photos']}</td>
          <td style="padding:12px 16px;border:1px solid #F1E6D1;text-align:center;"><a href="{$event['link']}" style="color:#C9A96E;text-decoration:none;">Vezi</a></td>
        </tr>
      HTML;
  }

  $body = <<<HTML
<h2 style="color:#3D3535;font-weight:300;margin-top:0;">Rezumatul zilei: fotografii noi au fost încărcate</h2>
<p style="color:#3D3535;line-height:1.7;">
  Ai primit fotografii noi la următoarele evenimente în ultimele 24 de ore:
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:20px;">
  <thead>
    <tr>
      <th align="left" style="padding:12px 16px;border:1px solid #F1E6D1;background:#F4EEE5;">Eveniment</th>
      <th align="center" style="padding:12px 16px;border:1px solid #F1E6D1;background:#F4EEE5;">Fotografii noi</th>
      <th align="center" style="padding:12px 16px;border:1px solid #F1E6D1;background:#F4EEE5;">Link</th>
    </tr>
  </thead>
  <tbody>
    {$eventRows}
  </tbody>
</table>
<div style="text-align:center;margin:32px 0;">
  <a href="https://www.wedpix.ro/dashboard"
     style="background:linear-gradient(135deg,#C9A96E,#E8D5A3);color:#fff;
            text-decoration:none;padding:14px 32px;border-radius:12px;
            font-weight:600;font-size:15px;display:inline-block;">
    Vezi dashboard-ul →
  </a>
</div>
HTML;
  return sendMail($to, 'Rezumatul zilnic WedPix: fotografii noi astăzi', mailLayout('Rezumat zilnic', $body));
}
function mailInvoiceReady(string $to, string $name, string $invoiceNumber, string $amount, string $invoiceViewUrl): bool
{
  $body = <<<HTML
<h2 style="color:#3D3535;font-weight:300;margin-top:0;">Factură emisă ✓</h2>
<p style="color:#3D3535;line-height:1.7;">
  Factură <strong>{$invoiceNumber}</strong> a fost generată în urma abonamentului dvs.
</p>
<div style="background:#FDF8F0;border:1px solid rgba(201,169,110,0.3);
            border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
  <p style="margin:0 0 8px;color:#8B7B7B;font-size:12px;text-transform:uppercase;letter-spacing:2px;">
    Detalii
  </p>
  <p style="margin:8px 0;color:#3D3535;font-size:16px;font-weight:600;">
    {$amount} RON
  </p>
</div>
<div style="text-align:center;margin:32px 0;">
  <a href="{$invoiceViewUrl}"
     style="background:linear-gradient(135deg,#C9A96E,#E8D5A3);color:#fff;
            text-decoration:none;padding:14px 32px;border-radius:12px;
            font-weight:600;font-size:15px;display:inline-block;">
    Vezi și descarcă factură →
  </a>
</div>
<p style="color:#8B7B7B;font-size:12px;line-height:1.7;">
  Puteți accesa facturile oricând din dashboard-ul dvs., secțiunea „Facturi".
</p>
HTML;
  return sendMail($to, "Factură {$invoiceNumber} — WedPix", mailLayout('Factură emisă', $body));
}
