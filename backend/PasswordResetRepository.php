<?php
declare(strict_types=1);

namespace Sesco\Backend;

use PDO;
use RuntimeException;
use Throwable;

/**
 * Client-isolated password reset workflow backed by MySQL.
 *
 * Every reset code and verification token is cryptographically hashed and
 * strictly bound to a single (client_id, normalized_email) pair so a code or
 * token issued for one client can never verify or modify another client's password.
 */
final class PasswordResetRepository
{
    public const CODE_TTL_MINUTES = 15;
    public const MAX_VERIFY_ATTEMPTS = 5;

    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->ensureSchema();
    }

    public function ensureSchema(): void
    {
        $sql = <<<'SQL'
CREATE TABLE IF NOT EXISTS `client_password_resets` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `client_id` INT(5) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `code_hash` VARCHAR(255) NOT NULL,
    `reset_token_hash` CHAR(64) NULL DEFAULT NULL,
    `attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `max_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 5,
    `expires_at` DATETIME NOT NULL,
    `verified_at` DATETIME NULL DEFAULT NULL,
    `used_at` DATETIME NULL DEFAULT NULL,
    `invalidated_at` DATETIME NULL DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_cpr_client_email` (`client_id`, `email`),
    INDEX `idx_cpr_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
SQL;
        $this->pdo->exec($sql);
    }

    public function normalizeEmail(string $email): string
    {
        $normalized = strtolower(trim($email));
        if ($normalized === '' || strlen($normalized) > 100 || !filter_var($normalized, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Please enter a valid email address.', 400);
        }
        return $normalized;
    }

    public function normalizeCode(string $code): string
    {
        $cleaned = preg_replace('/\s+/', '', trim($code));
        if ($cleaned === null || !preg_match('/^\d{6}$/', $cleaned)) {
            throw new RuntimeException('Please enter the 6-digit verification code sent to your email.', 400);
        }
        return $cleaned;
    }

    /**
     * Resolve exactly one client account for the given normalized email.
     */
    public function findIsolatedClientByEmail(string $normalizedEmail): ?array
    {
        $stmt = $this->pdo->prepare(
            "SELECT `client_id`, `name`, `email`, `telephone`, `password`
             FROM `client`
             WHERE `email` IS NOT NULL
               AND TRIM(`email`) <> ''
               AND LOWER(TRIM(`email`)) = :email
             ORDER BY `client_id` DESC
             LIMIT 1"
        );
        $stmt->execute([':email' => $normalizedEmail]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row || (int) ($row['client_id'] ?? 0) <= 0) {
            return null;
        }

        if (strtolower(trim((string) $row['email'])) !== $normalizedEmail) {
            return null;
        }

        return $row;
    }

    /**
     * Issue a new 6-digit reset code bound strictly to this client account.
     *
     * @return array{
     *   ok:bool,
     *   status:int,
     *   reset_id?:int,
     *   client_id?:int,
     *   client_name?:string,
     *   email?:string,
     *   code?:string,
     *   expires_minutes?:int,
     *   message?:string
     * }
     */
    public function createResetRequest(string $rawEmail): array
    {
        try {
            $normalizedEmail = $this->normalizeEmail($rawEmail);
        } catch (RuntimeException $e) {
            return ['ok' => false, 'status' => 400, 'message' => $e->getMessage()];
        }

        $client = $this->findIsolatedClientByEmail($normalizedEmail);
        if (!$client) {
            return [
                'ok'      => false,
                'status'  => 404,
                'message' => 'No client account was found with that email address.',
            ];
        }

        $clientId = (int) $client['client_id'];
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $codeHash = password_hash($code, PASSWORD_DEFAULT);
        $ttl = self::CODE_TTL_MINUTES;

        $this->pdo->beginTransaction();
        try {
            // Invalidate only prior open reset records belonging to this exact client_id
            $invStmt = $this->pdo->prepare(
                "UPDATE `client_password_resets`
                 SET `invalidated_at` = UTC_TIMESTAMP()
                 WHERE `client_id` = :client_id
                   AND `used_at` IS NULL
                   AND `invalidated_at` IS NULL"
            );
            $invStmt->execute([':client_id' => $clientId]);

            $insStmt = $this->pdo->prepare(
                "INSERT INTO `client_password_resets` (
                    `client_id`, `email`, `code_hash`, `max_attempts`, `expires_at`, `created_at`
                 ) VALUES (
                    :client_id, :email, :code_hash, :max_attempts, DATE_ADD(UTC_TIMESTAMP(), INTERVAL :ttl MINUTE), UTC_TIMESTAMP()
                 )"
            );
            $insStmt->bindValue(':client_id', $clientId, PDO::PARAM_INT);
            $insStmt->bindValue(':email', $normalizedEmail, PDO::PARAM_STR);
            $insStmt->bindValue(':code_hash', $codeHash, PDO::PARAM_STR);
            $insStmt->bindValue(':max_attempts', self::MAX_VERIFY_ATTEMPTS, PDO::PARAM_INT);
            $insStmt->bindValue(':ttl', $ttl, PDO::PARAM_INT);
            $insStmt->execute();

            $resetId = (int) $this->pdo->lastInsertId();
            $this->pdo->commit();

            return [
                'ok'              => true,
                'status'          => 200,
                'reset_id'        => $resetId,
                'client_id'       => $clientId,
                'client_name'     => (string) ($client['name'] ?? ''),
                'email'           => $normalizedEmail,
                'code'            => $code,
                'expires_minutes' => $ttl,
            ];
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Roll back a specific reset request row belonging to client_id (e.g. if email transport failed).
     */
    public function invalidateResetRequest(int $resetId, int $clientId): void
    {
        if ($resetId <= 0 || $clientId <= 0) {
            return;
        }
        $stmt = $this->pdo->prepare(
            "UPDATE `client_password_resets`
             SET `invalidated_at` = UTC_TIMESTAMP()
             WHERE `id` = :id
               AND `client_id` = :client_id
               AND `used_at` IS NULL"
        );
        $stmt->execute([
            ':id'        => $resetId,
            ':client_id' => $clientId,
        ]);
    }

    /**
     * Verify a 6-digit code strictly for the owner of $rawEmail.
     * Rejects mismatched client records, expired codes, locked codes, and wrong codes.
     *
     * @return array{ok:bool,status:int,email?:string,reset_token?:string,remaining_attempts?:int,message?:string}
     */
    public function verifyCode(string $rawEmail, string $rawCode): array
    {
        try {
            $normalizedEmail = $this->normalizeEmail($rawEmail);
            $code = $this->normalizeCode($rawCode);
        } catch (RuntimeException $e) {
            return ['ok' => false, 'status' => 400, 'message' => $e->getMessage()];
        }

        $client = $this->findIsolatedClientByEmail($normalizedEmail);
        if (!$client) {
            return [
                'ok'      => false,
                'status'  => 404,
                'message' => 'No client account matches that email address.',
            ];
        }

        $clientId = (int) $client['client_id'];

        $this->pdo->beginTransaction();
        try {
            $row = $this->lockLatestActiveResetRow($clientId, $normalizedEmail, false);
            if (!$row) {
                $this->pdo->commit();
                return [
                    'ok'      => false,
                    'status'  => 400,
                    'message' => 'No active verification code was found for this account. Please request a new code.',
                ];
            }

            if (!$this->rowMatchesClient($row, $clientId, $normalizedEmail)) {
                $this->pdo->rollBack();
                return [
                    'ok'      => false,
                    'status'  => 403,
                    'message' => 'Client verification isolation check failed. Please request a new code.',
                ];
            }

            if ((int) ($row['is_expired'] ?? 1) === 1) {
                $this->markRowInvalidated((int) $row['id'], $clientId);
                $this->pdo->commit();
                return [
                    'ok'      => false,
                    'status'  => 400,
                    'message' => 'Your verification code has expired. Please request a new code.',
                ];
            }

            $attempts = (int) $row['attempts'];
            $maxAttempts = (int) $row['max_attempts'];
            if ($attempts >= $maxAttempts) {
                $this->markRowInvalidated((int) $row['id'], $clientId);
                $this->pdo->commit();
                return [
                    'ok'      => false,
                    'status'  => 429,
                    'message' => 'Too many incorrect code attempts. Please request a new verification code.',
                ];
            }

            if (!password_verify($code, (string) $row['code_hash'])) {
                $nextAttempts = $attempts + 1;
                $locked = $nextAttempts >= $maxAttempts;
                $updFail = $this->pdo->prepare(
                    "UPDATE `client_password_resets`
                     SET `attempts` = :attempts,
                         `verified_at` = NULL,
                         `reset_token_hash` = NULL,
                         `invalidated_at` = CASE WHEN :locked = 1 THEN UTC_TIMESTAMP() ELSE `invalidated_at` END
                     WHERE `id` = :id
                       AND `client_id` = :client_id
                       AND `email` = :email"
                );
                $updFail->execute([
                    ':attempts'  => $nextAttempts,
                    ':locked'    => $locked ? 1 : 0,
                    ':id'        => (int) $row['id'],
                    ':client_id' => $clientId,
                    ':email'     => $normalizedEmail,
                ]);
                $this->pdo->commit();

                $remaining = max(0, $maxAttempts - $nextAttempts);
                $msg = $locked
                    ? 'Incorrect verification code. Maximum attempts reached; please request a new code.'
                    : sprintf(
                        'Incorrect verification code. You cannot create a new password until the right code is entered (%d attempt%s remaining).',
                        $remaining,
                        $remaining === 1 ? '' : 's'
                    );

                return [
                    'ok'                 => false,
                    'status'             => $locked ? 429 : 401,
                    'remaining_attempts' => $remaining,
                    'message'            => $msg,
                ];
            }

            $resetToken = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $resetToken);

            $updOk = $this->pdo->prepare(
                "UPDATE `client_password_resets`
                 SET `verified_at` = UTC_TIMESTAMP(),
                     `reset_token_hash` = :token_hash,
                     `expires_at` = GREATEST(`expires_at`, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE))
                 WHERE `id` = :id
                   AND `client_id` = :client_id
                   AND `email` = :email
                   AND `used_at` IS NULL
                   AND `invalidated_at` IS NULL"
            );
            $updOk->execute([
                ':token_hash' => $tokenHash,
                ':id'         => (int) $row['id'],
                ':client_id'  => $clientId,
                ':email'      => $normalizedEmail,
            ]);

            $this->pdo->commit();

            return [
                'ok'          => true,
                'status'      => 200,
                'email'       => $normalizedEmail,
                'reset_token' => $resetToken,
            ];
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Update the password strictly for the verified client owning BOTH the code and reset_token.
     *
     * @return array{ok:bool,status:int,email?:string,message?:string}
     */
    public function resetPasswordWithVerifiedCode(
        string $rawEmail,
        string $rawCode,
        string $resetToken,
        string $newPassword,
        string $confirmPassword
    ): array {
        try {
            $normalizedEmail = $this->normalizeEmail($rawEmail);
            $code = $this->normalizeCode($rawCode);
        } catch (RuntimeException $e) {
            return ['ok' => false, 'status' => 400, 'message' => $e->getMessage()];
        }

        $cleanToken = strtolower(trim($resetToken));
        if (!preg_match('/^[a-f0-9]{64}$/', $cleanToken)) {
            return [
                'ok'      => false,
                'status'  => 401,
                'message' => 'Verification required. Please enter the code sent to your email first.',
            ];
        }

        if (strlen($newPassword) < 6) {
            return [
                'ok'      => false,
                'status'  => 400,
                'message' => 'New password must be at least 6 characters long.',
            ];
        }

        if (strlen($newPassword) > 128) {
            return [
                'ok'      => false,
                'status'  => 400,
                'message' => 'New password must not exceed 128 characters.',
            ];
        }

        if (!hash_equals($newPassword, $confirmPassword)) {
            return [
                'ok'      => false,
                'status'  => 400,
                'message' => 'New password and confirmation password do not match.',
            ];
        }

        $client = $this->findIsolatedClientByEmail($normalizedEmail);
        if (!$client) {
            return [
                'ok'      => false,
                'status'  => 404,
                'message' => 'No client account matches that email address.',
            ];
        }

        $clientId = (int) $client['client_id'];
        $providedTokenHash = hash('sha256', $cleanToken);

        $this->pdo->beginTransaction();
        try {
            $row = $this->lockLatestActiveResetRow($clientId, $normalizedEmail, true);
            if (!$row) {
                $this->pdo->commit();
                return [
                    'ok'      => false,
                    'status'  => 401,
                    'message' => 'No verified reset session exists for this account. Please verify your email code first.',
                ];
            }

            if (!$this->rowMatchesClient($row, $clientId, $normalizedEmail)) {
                $this->pdo->rollBack();
                return [
                    'ok'      => false,
                    'status'  => 403,
                    'message' => 'Client data isolation violation rejected. This verification code belongs to a different client.',
                ];
            }

            if ((int) ($row['is_expired'] ?? 1) === 1) {
                $this->markRowInvalidated((int) $row['id'], $clientId);
                $this->pdo->commit();
                return [
                    'ok'      => false,
                    'status'  => 400,
                    'message' => 'Your verification session has expired. Please request a new code.',
                ];
            }

            $storedTokenHash = (string) ($row['reset_token_hash'] ?? '');
            if (
                $storedTokenHash === '' ||
                !hash_equals($storedTokenHash, $providedTokenHash) ||
                !password_verify($code, (string) $row['code_hash'])
            ) {
                $this->pdo->rollBack();
                return [
                    'ok'      => false,
                    'status'  => 401,
                    'message' => 'Verification failed for this client account. Please re-verify your code.',
                ];
            }

            $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);

            // Strictly scoped UPDATE matching BOTH client_id and normalized email
            $updClient = $this->pdo->prepare(
                "UPDATE `client`
                 SET `password` = :password
                 WHERE `client_id` = :client_id
                   AND LOWER(TRIM(`email`)) = :email
                 LIMIT 1"
            );
            $updClient->execute([
                ':password'  => $passwordHash,
                ':client_id' => $clientId,
                ':email'     => $normalizedEmail,
            ]);

            if ($updClient->rowCount() < 1) {
                // Ensure the password didn't happen to match exact DB row or missing target
                $verifyOwner = $this->findIsolatedClientByEmail($normalizedEmail);
                if (!$verifyOwner || (int) $verifyOwner['client_id'] !== $clientId) {
                    $this->pdo->rollBack();
                    return [
                        'ok'      => false,
                        'status'  => 404,
                        'message' => 'Unable to locate isolated client record for update.',
                    ];
                }
            }

            $consumeStmt = $this->pdo->prepare(
                "UPDATE `client_password_resets`
                 SET `used_at` = UTC_TIMESTAMP(),
                     `invalidated_at` = COALESCE(`invalidated_at`, UTC_TIMESTAMP())
                 WHERE `client_id` = :client_id
                   AND `used_at` IS NULL"
            );
            $consumeStmt->execute([':client_id' => $clientId]);

            $this->pdo->commit();

            return [
                'ok'      => true,
                'status'  => 200,
                'email'   => $normalizedEmail,
                'message' => 'Password updated successfully. You can now sign in with your new password.',
            ];
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    private function lockLatestActiveResetRow(int $clientId, string $normalizedEmail, bool $requireVerified): ?array
    {
        $verifiedClause = $requireVerified ? 'AND `verified_at` IS NOT NULL' : '';
        $stmt = $this->pdo->prepare(
            "SELECT *, (`expires_at` <= UTC_TIMESTAMP()) AS `is_expired`
             FROM `client_password_resets`
             WHERE `client_id` = :client_id
               AND `email` = :email
               AND `used_at` IS NULL
               AND `invalidated_at` IS NULL
               {$verifiedClause}
             ORDER BY `id` DESC
             LIMIT 1
             FOR UPDATE"
        );
        $stmt->execute([
            ':client_id' => $clientId,
            ':email'     => $normalizedEmail,
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    private function rowMatchesClient(array $row, int $clientId, string $normalizedEmail): bool
    {
        return (int) ($row['client_id'] ?? 0) === $clientId
            && hash_equals($normalizedEmail, strtolower(trim((string) ($row['email'] ?? ''))));
    }

    private function markRowInvalidated(int $id, int $clientId): void
    {
        $stmt = $this->pdo->prepare(
            "UPDATE `client_password_resets`
             SET `invalidated_at` = UTC_TIMESTAMP()
             WHERE `id` = :id
               AND `client_id` = :client_id"
        );
        $stmt->execute([
            ':id'        => $id,
            ':client_id' => $clientId,
        ]);
    }
}
