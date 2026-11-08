<?php

declare(strict_types=1);

/**
 * Sesco Tyres — Client Registration Endpoint
 * Target Runtime: PHP 8.5.12
 * Registers a new client and saves their details into the `client` table
 * in the `treads` database.
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
        'message' => 'Method not allowed. Use POST to register.',
    ]);
    exit;
}

$rawBody = file_get_contents('php://input');
$payload = is_string($rawBody) && $rawBody !== '' ? json_decode($rawBody, true) : $_POST;

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid registration request payload.',
    ]);
    exit;
}

$name            = trim((string) ($payload['name'] ?? $payload['reg_name'] ?? ''));
$email           = trim((string) ($payload['email'] ?? $payload['reg_email'] ?? ''));
$password        = (string) ($payload['password'] ?? $payload['reg_password'] ?? '');
$confirmPassword = (string) ($payload['confirm_password'] ?? $payload['reg_confirm'] ?? '');
$telephone       = trim((string) ($payload['telephone'] ?? $payload['phone'] ?? $payload['reg_phone'] ?? ''));
$address         = trim((string) ($payload['address'] ?? $payload['location'] ?? ''));

if ($name === '') {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Please enter your full name.',
    ]);
    exit;
}

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Please provide a valid email address.',
    ]);
    exit;
}

if (strlen($password) < 6) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Password must be at least 6 characters.',
    ]);
    exit;
}

if ($confirmPassword !== '' && $password !== $confirmPassword) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Passwords do not match.',
    ]);
    exit;
}

$config = require __DIR__ . '/config.php';

try {
    $pdo = Database::connect($config['db']);
    $repo = new ClientRepository($pdo);

    $client = $repo->registerClient(
        name: $name,
        email: $email,
        password: $password,
        telephone: $telephone !== '' ? $telephone : null,
        address: $address !== '' ? $address : null
    );

    // Save client info to session
    $_SESSION['client_id']    = $client['client_id'];
    $_SESSION['client_name']  = $client['name'];
    $_SESSION['client_email'] = $client['email'];

    echo json_encode([
        'success'   => true,
        'message'   => 'Account created successfully and saved in the client table.',
        'client_id' => $client['client_id'],
        'client'    => [
            'client_id' => $client['client_id'],
            'name'      => $client['name'],
            'email'     => $client['email'],
            'telephone' => $client['telephone'],
            'address'   => $client['address'],
        ],
    ]);
} catch (\Throwable $e) {
    $isConflict = str_contains($e->getMessage(), 'already exists');
    http_response_code($isConflict ? 409 : 500);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
}

