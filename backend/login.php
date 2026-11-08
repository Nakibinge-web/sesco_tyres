<?php

declare(strict_types=1);

/**
 * Sesco Tyres — Client Login Endpoint
 * Target Runtime: PHP 8.5.12
 * Authenticates client credentials against the `client` table in `treads`.
 */

if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/ClientRepository.php';

use Sesco\Backend\Database;
use Sesco\Backend\ClientRepository;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use POST to log in.',
    ]);
    exit;
}

$rawBody = file_get_contents('php://input');
$payload = is_string($rawBody) && $rawBody !== '' ? json_decode($rawBody, true) : $_POST;

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid login payload.',
    ]);
    exit;
}

$email    = trim((string) ($payload['email'] ?? ''));
$password = (string) ($payload['password'] ?? '');

if ($email === '' || $password === '') {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Please enter both email and password.',
    ]);
    exit;
}

$config = require __DIR__ . '/config.php';

try {
    $pdo = Database::connect($config['db']);
    $repo = new ClientRepository($pdo);

    $client = $repo->verifyCredentials($email, $password);

    if ($client === null) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email address or password.',
        ]);
        exit;
    }

    $_SESSION['client_id']    = $client['client_id'];
    $_SESSION['client_name']  = $client['name'];
    $_SESSION['client_email'] = $client['email'];

    echo json_encode([
        'success'   => true,
        'message'   => 'Login successful.',
        'client_id' => $client['client_id'],
        'client'    => [
            'client_id' => $client['client_id'],
            'name'      => $client['name'],
            'email'     => $client['email'],
            'telephone' => $client['telephone'] ?? '',
            'address'   => $client['address'] ?? '',
        ],
    ]);
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
}

