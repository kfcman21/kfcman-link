<?php
// ==========================================================================
// kfcman.link URL Shortener PHP API Backend (With Security Authentication)
// ==========================================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-KFCMan-Auth");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// --------------------------------------------------------------------------
// ADMIN PASSWORD CONFIGURATION
// --------------------------------------------------------------------------
$ADMIN_PASSWORD = 'kfcman123'; // Change this to your desired password!
// --------------------------------------------------------------------------

// Derive a static secure token based on the admin password to prevent reverse engineering
$AUTH_TOKEN = hash('sha256', $ADMIN_PASSWORD . '_kfcman_secure_salt_777');

$db_file = __DIR__ . '/data/db.json';

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
    $dir = dirname($filePath);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    
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

// Helper: Validate the Authorization Token from Request Headers
function validateAuth($serverToken) {
    $headers = apache_request_headers();
    
    // Fallback if headers are in different cases
    $clientToken = '';
    if (isset($headers['X-KFCMan-Auth'])) {
        $clientToken = $headers['X-KFCMan-Auth'];
    } elseif (isset($_SERVER['HTTP_X_KFCMAN_AUTH'])) {
        $clientToken = $_SERVER['HTTP_X_KFCMAN_AUTH'];
    }
    
    if ($clientToken !== $serverToken) {
        http_response_code(401);
        echo json_encode(['error' => '접근 권한이 없습니다. 대시보드 비밀번호 인증이 필요합니다.']);
        exit;
    }
}

// Helper: Generate a unique short code of 6 characters
function generateUniqueCode($db) {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $blacklist = ['api', 'css', 'js', 'data', 'favicon', 'index', 'robots', 'auth'];
    
    for ($attempts = 0; $attempts < 10; $attempts++) {
        $code = '';
        for ($i = 0; $i < 6; $i++) {
            $code .= $chars[rand(0, strlen($chars) - 1)];
        }
        if (!isset($db['links'][$code]) && !in_array(strtolower($code), $blacklist)) {
            return $code;
        }
    }
    throw new Exception("Failed to generate a unique short code.");
}

// Helper: Validate custom code (Supports Korean Hangul Unicode!)
function isValidCustomCode($code) {
    $blacklist = ['api', 'css', 'js', 'data', 'favicon', 'index', 'robots', 'auth'];
    return preg_match('/^[\p{Hangul}a-zA-Z0-9_-]{1,16}$/u', $code) && !in_array(strtolower($code), $blacklist);
}

// Dispatching requests
$request_uri = $_SERVER['REQUEST_URI'];
$db = loadDatabase($db_file);

// --- 1. Endpoint: POST /api/auth (Login) ---
if (strpos($request_uri, '/api/auth') !== false && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $password = isset($input['password']) ? $input['password'] : '';
    
    if ($password === $ADMIN_PASSWORD) {
        echo json_encode(['token' => $AUTH_TOKEN]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => '비밀번호가 올바르지 않습니다. 다시 입력해 주세요.']);
    }
    exit;
}

// --------------------------------------------------------------------------
// SECURITY GATEWAY: Secure all subsequent APIs with the authorization token!
// --------------------------------------------------------------------------
validateAuth($AUTH_TOKEN);
// --------------------------------------------------------------------------

// --- 2. Endpoint: GET /api/stats/:code ---
if (isset($_GET['code'])) {
    $code = trim($_GET['code']);
    if (!isset($db['links'][$code])) {
        http_response_code(404);
        echo json_encode(['error' => 'Short URL not found.']);
        exit;
    }
    echo json_encode(['link' => $db['links'][$code]]);
    exit;
}

// --- 3. Endpoint: POST /api/shorten ---
if (strpos($request_uri, '/api/shorten') !== false && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $url = isset($input['url']) ? trim($input['url']) : '';
    $customCode = isset($input['customCode']) ? trim($input['customCode']) : '';

    if (empty($url)) {
        http_response_code(400);
        echo json_encode(['error' => 'URL is required.']);
        exit;
    }

    if (!preg_match('/^https?:\/\//i', $url)) {
        $url = 'http://' . $url;
    }

    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Please provide a valid HTTP or HTTPS URL.']);
        exit;
    }

    $code = '';
    if (!empty($customCode)) {
        if (!isValidCustomCode($customCode)) {
            http_response_code(400);
            echo json_encode(['error' => '맞춤 단축 주소는 한글, 영어 알파벳, 숫자, 하이픈(-), 언더바(_)로 구성된 1~16자여야 합니다. 시스템 예약어는 사용할 수 없습니다.']);
            exit;
        }
        if (isset($db['links'][$customCode])) {
            http_response_code(409);
            echo json_encode(['error' => 'This custom alias is already in use. Please try another one.']);
            exit;
        }
        $code = $customCode;
    } else {
        try {
            $code = generateUniqueCode($db);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
            exit;
        }
    }

    $newLink = [
        'code' => $code,
        'originalUrl' => $url,
        'createdAt' => gmdate('Y-m-d\TH:i:s\Z'),
        'clicks' => 0,
        'clicksData' => []
    ];

    $db['links'][$code] = $newLink;
    if (saveDatabaseAtomic($db_file, $db)) {
        http_response_code(201);
        echo json_encode([
            'message' => 'Successfully shortened.',
            'link' => [
                'code' => $code,
                'originalUrl' => $url,
                'createdAt' => $newLink['createdAt'],
                'clicks' => 0
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to write database file.']);
    }
    exit;
}

// --- 4. Endpoint: POST /api/links ---
if (strpos($request_uri, '/api/links') !== false && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $codes = isset($input['codes']) ? $input['codes'] : null;

    if (!is_array($codes)) {
        http_response_code(400);
        echo json_encode(['error' => 'An array of short codes is required.']);
        exit;
    }

    $results = [];
    foreach ($codes as $code) {
        if (isset($db['links'][$code])) {
            $results[] = $db['links'][$code];
        }
    }

    echo json_encode(['links' => $results]);
    exit;
}

// Unmatched API endpoint
http_response_code(404);
echo json_encode(['error' => 'API route not found.']);
exit;
