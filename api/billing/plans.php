<?php
// ============================================================
// WedPix SaaS — api/billing/plans.php
// GET — returns public plan list (no auth)
// ============================================================
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendError('Method not allowed', 405);

$plans = array_map(function (string $key, array $p) {
    return [
        'id'          => $key,
        'name'        => $p['name'],
        'price_ron'   => $p['price_ron'],
        'photo_limit' => $p['photo_limit'] === PHP_INT_MAX ? null : $p['photo_limit'],
        'video'       => $p['video'],
        'zip'         => $p['zip'],
        'slideshow'   => $p['slideshow'],
        'validity_days'=> $p['validity_days'],
        'max_mb'      => $p['max_mb'],
    ];
}, array_keys(PLANS), PLANS);

$addons = array_map(function (string $key, array $a) {
    return [
        'id'         => $key,
        'name'       => $a['name'],
        'price_ron'  => $a['price_ron'],
        'type'       => $a['type'],
        'unit_days'  => $a['unit_days']   ?? null,
        'unit_photos'=> $a['unit_photos'] ?? null,
        'max_units'  => $a['max_units']   ?? null,
    ];
}, array_keys(ADDONS), ADDONS);

sendJson(['plans' => $plans, 'addons' => $addons]);
