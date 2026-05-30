<?php
// ==========================================================================
// kfcman.link URL Shortener PHP Redirect Controller
// ==========================================================================

$code = isset($_GET['code']) ? trim($_GET['code']) : '';
$db_file = __DIR__ . '/data/db.json';

if (empty($code)) {
    header("Location: /", true, 302);
    exit;
}

// Helper: Load database safely
function loadDatabase($filePath) {
    if (!file_exists($filePath)) {
        return ['links' => []];
    }
    $content = file_get_contents($filePath);
    $data = json_decode($content, true);
    if (!$data || !isset($data['links'])) {
        return ['links' => []];
    }
    return $data;
}

// Helper: Save database atomically
function saveDatabaseAtomic($filePath, $data) {
    $tempPath = $filePath . '.' . uniqid('', true) . '.tmp';
    $jsonContent = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    
    if (file_put_contents($tempPath, $jsonContent, LOCK_EX) === false) {
        return false;
    }
    
    if (!rename($tempPath, $filePath)) {
        @unlink($tempPath);
        return false;
    }
    return true;
}

$db = loadDatabase($db_file);

if (!isset($db['links'][$code])) {
    // Redirect back to frontend with error variables
    header("Location: /?error=notfound&code=" . urlencode($code), true, 302);
    exit;
}

$link = $db['links'][$code];
$originalUrl = $link['originalUrl'];

// Track click details
$referrer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : 'Direct';
$ip = 'Unknown';
if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $ip = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
} elseif (isset($_SERVER['REMOTE_ADDR'])) {
    $ip = $_SERVER['REMOTE_ADDR'];
}

// Clean up referrer domain
$cleanReferrer = 'Direct';
if ($referrer !== 'Direct') {
    $parts = parse_url($referrer);
    if (isset($parts['host'])) {
        $cleanReferrer = $parts['host'];
    } else {
        $cleanReferrer = $referrer;
    }
}

// Update DB
$db['links'][$code]['clicks'] = ($link['clicks'] ?? 0) + 1;

if (!isset($db['links'][$code]['clicksData'])) {
    $db['links'][$code]['clicksData'] = [];
}

$clickEvent = [
    'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
    'referrer' => $cleanReferrer,
    'ip' => $ip
];

$db['links'][$code]['clicksData'][] = $clickEvent;

// Keep click log light (limit to 50)
if (count($db['links'][$code]['clicksData']) > 50) {
    array_shift($db['links'][$code]['clicksData']);
}

saveDatabaseAtomic($db_file, $db);

// Perform Redirection
header("Location: " . $originalUrl, true, 302);
exit;
