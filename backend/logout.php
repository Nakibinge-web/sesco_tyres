<?php

declare(strict_types=1);

/**
 * Sesco Tyres — Client Logout Endpoint
 * Target Runtime: PHP 8.5.12
 * Clears active client session.
 */

if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}

$_SESSION['client_id']    = null;
$_SESSION['client_name']  = null;
$_SESSION['client_email'] = null;
unset($_SESSION['client_id'], $_SESSION['client_name'], $_SESSION['client_email']);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully.',
]);

