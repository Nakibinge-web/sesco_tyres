<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use POST.',
    ]);
    exit;
}

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Mailer.php';
require_once __DIR__ . '/PasswordResetRepository.php';

use Sesco\Backend\Database;
use Sesco\Backend\Mailer;
use Sesco\Backend\PasswordResetRepository;

/**
 * Emit a JSON response with an explicit HTTP status code and terminate.
 */
function respondJson(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Clear stale client session credentials if a session cookie exists.
 */
function clearClientSessionIfPresent(): void
{
    $sessionName = session_name();
    if ($sessionName !== '' && isset($_COOKIE[$sessionName])) {
        if (session_status() === PHP_SESSION_NONE) {
            @session_start();
        }
        unset(
            $_SESSION['client_id'],
            $_SESSION['client_name'],
            $_SESSION['client_email'],
            $_SESSION['client_phone'],
            $_SESSION['client_address']
        );
    }
}

$rawBody = file_get_contents('php://input');
$payload = json_decode($rawBody ?: '', true);
if (!is_array($payload)) {
    $payload = $_POST;
}

$action = trim((string) ($payload['action'] ?? ''));

try {
    $config = require __DIR__ . '/config.php';
    $pdo = Database::connect($config['db'] ?? []);
    $repo = new PasswordResetRepository($pdo);

    switch ($action) {
        case 'request_code':
            $email = (string) ($payload['email'] ?? '');
            $result = $repo->createResetRequest($email);
            if (!$result['ok']) {
                respondJson((int) $result['status'], [
                    'success' => false,
                    'message' => (string) $result['message'],
                ]);
            }

            $mailer = new Mailer($config['mail'] ?? []);
            $delivery = $mailer->sendPasswordResetCode(
                (string) $result['email'],
                (string) $result['client_name'],
                (string) $result['code'],
                (int) $result['expires_minutes']
            );

            if (!$delivery['delivered']) {
                $repo->invalidateResetRequest((int) $result['reset_id'], (int) $result['client_id']);
                respondJson(503, [
                    'success' => false,
                    'message' => 'Unable to deliver verification email at the moment. Please configure SMTP settings or try again later.',
                ]);
            }

            $targetEmail = (string) $result['email'];
            $transport = (string) $delivery['transport'];
            $msg = $transport === 'local_outbox'
                ? sprintf(
                    'Verification code created for %s. On this local XAMPP server (SMTP not configured), the email was saved to backend/mail_outbox/. Enter that 6-digit code below.',
                    $targetEmail
                )
                : sprintf(
                    'A 6-digit verification code has been sent to %s. Enter the code below within %d minutes.',
                    $targetEmail,
                    (int) $result['expires_minutes']
                );

            respondJson(200, [
                'success'         => true,
                'email'           => $targetEmail,
                'expires_minutes' => (int) $result['expires_minutes'],
                'delivery_mode'   => $transport,
                'message'         => $msg,
            ]);

        case 'verify_code':
            $email = (string) ($payload['email'] ?? '');
            $code = (string) ($payload['code'] ?? '');
            $result = $repo->verifyCode($email, $code);

            if (!$result['ok']) {
                $errorPayload = [
                    'success' => false,
                    'message' => (string) $result['message'],
                ];
                if (isset($result['remaining_attempts'])) {
                    $errorPayload['remaining_attempts'] = (int) $result['remaining_attempts'];
                }
                respondJson((int) $result['status'], $errorPayload);
            }

            respondJson(200, [
                'success'     => true,
                'email'       => (string) $result['email'],
                'reset_token' => (string) $result['reset_token'],
                'message'     => 'Verification code confirmed. Please create your new password below.',
            ]);

        case 'reset_password':
            $email = (string) ($payload['email'] ?? '');
            $code = (string) ($payload['code'] ?? '');
            $resetToken = (string) ($payload['reset_token'] ?? '');
            $newPassword = (string) ($payload['new_password'] ?? '');
            $confirmPassword = (string) ($payload['confirm_password'] ?? '');

            $result = $repo->resetPasswordWithVerifiedCode(
                $email,
                $code,
                $resetToken,
                $newPassword,
                $confirmPassword
            );

            if (!$result['ok']) {
                respondJson((int) $result['status'], [
                    'success' => false,
                    'message' => (string) $result['message'],
                ]);
            }

            clearClientSessionIfPresent();

            respondJson(200, [
                'success' => true,
                'email'   => (string) $result['email'],
                'message' => (string) $result['message'],
            ]);

        default:
            respondJson(400, [
                'success' => false,
                'message' => 'Invalid password reset action.',
            ]);
    }
} catch (Throwable $e) {
    respondJson(500, [
        'success' => false,
        'message' => 'Server error while processing password reset request.',
    ]);
}
