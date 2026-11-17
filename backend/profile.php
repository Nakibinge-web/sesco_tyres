<?php
declare(strict_types=1);

/**
 * Sesco Tyres — Authenticated Client Profile Endpoint
 * Allows the currently signed-in client (from $_SESSION['client_id']) to fetch
 * and update their own Name, Email, and Password with strict client isolation.
 */

if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/ClientRepository.php';

use Sesco\Backend\ClientRepository;
use Sesco\Backend\Database;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#i', $origin)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($method !== 'GET' && $method !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use GET or POST.',
    ]);
    exit;
}

function sendProfileJson(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function clearProfileSessionKeys(): void
{
    unset(
        $_SESSION['client_id'],
        $_SESSION['client_name'],
        $_SESSION['client_email'],
        $_SESSION['client_phone'],
        $_SESSION['client_address']
    );
}

$sessionClientId = (int) ($_SESSION['client_id'] ?? 0);
if ($sessionClientId <= 0) {
    sendProfileJson(401, [
        'success' => false,
        'code'    => 'AUTH_REQUIRED',
        'message' => 'Your sign-in session is missing or expired. Please sign in again to edit your profile.',
    ]);
}

$config = require __DIR__ . '/config.php';

try {
    $pdo = Database::connect($config['db'] ?? []);
    $repo = new ClientRepository($pdo);

    if ($method === 'GET') {
        $profile = $repo->findPublicProfileById($sessionClientId);
        if ($profile === null) {
            clearProfileSessionKeys();
            sendProfileJson(401, [
                'success' => false,
                'code'    => 'AUTH_REQUIRED',
                'message' => 'Account session is no longer valid. Please sign in again.',
            ]);
        }

        $_SESSION['client_name']  = $profile['name'];
        $_SESSION['client_email'] = $profile['email'];

        sendProfileJson(200, [
            'success' => true,
            'client'  => $profile,
        ]);
    }

    $rawBody = file_get_contents('php://input');
    $payload = is_string($rawBody) && trim($rawBody) !== '' ? json_decode($rawBody, true) : $_POST;
    if (!is_array($payload)) {
        sendProfileJson(400, [
            'success' => false,
            'message' => 'Invalid profile update request payload.',
        ]);
    }

    // Strictly bind identity to $_SESSION['client_id']; never accept client_id from request input.
    $name            = (string) ($payload['name'] ?? '');
    $email           = (string) ($payload['email'] ?? '');
    $currentPassword = (string) ($payload['current_password'] ?? '');
    $newPassword     = (string) ($payload['new_password'] ?? '');
    $confirmPassword = (string) ($payload['confirm_password'] ?? '');

    $result = $repo->updateClientProfile(
        $sessionClientId,
        $name,
        $email,
        $currentPassword,
        $newPassword,
        $confirmPassword
    );

    $updatedClient = $result['client'];
    $_SESSION['client_id']    = $updatedClient['client_id'];
    $_SESSION['client_name']  = $updatedClient['name'];
    $_SESSION['client_email'] = $updatedClient['email'];

    if ($result['email_changed'] || $result['password_changed']) {
        @session_regenerate_id(true);
    }

    sendProfileJson(200, [
        'success'          => true,
        'message'          => $result['password_changed']
            ? 'Profile and password updated successfully.'
            : 'Profile details updated successfully.',
        'email_changed'    => $result['email_changed'],
        'password_changed' => $result['password_changed'],
        'client'           => $updatedClient,
    ]);
} catch (\RuntimeException $e) {
    $code = (int) $e->getCode();
    $httpStatus = ($code >= 400 && $code < 500) ? $code : 422;
    sendProfileJson($httpStatus, [
        'success' => false,
        'message' => $e->getMessage(),
    ]);
} catch (\Throwable $e) {
    sendProfileJson(500, [
        'success' => false,
        'message' => 'Server error while updating your profile.',
    ]);
}
