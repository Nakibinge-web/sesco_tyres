<?php

declare(strict_types=1);

namespace Sesco\Backend;

use PDO;
use RuntimeException;
use Throwable;

/**
 * Repository for managing the `client` table in the `treads` database.
 * Handles client registration, schema verification, and authentication lookup.
 * Target Runtime: PHP 8.5.12
 */
final readonly class ClientRepository
{
    public function __construct(
        private PDO $pdo
    ) {}

    /**
     * Idempotently ensures the `password` column exists in the `client` table
     * so client passwords can be securely stored and verified.
     */
    public function ensureSchema(): void
    {
        try {
            $colStmt = $this->pdo->query("SHOW COLUMNS FROM `client` LIKE 'password'");
            $colInfo = $colStmt ? $colStmt->fetch(PDO::FETCH_ASSOC) : null;
            if (!$colInfo) {
                $this->pdo->exec(
                    "ALTER TABLE `client` ADD COLUMN `password` varchar(255) DEFAULT NULL COMMENT 'Hashed password for client login' AFTER `email`"
                );
            }
        } catch (Throwable) {
            // Ignore if column already exists or table cannot be modified
        }
    }

    /**
     * Finds a client record by email address.
     *
     * @return array<string, mixed>|null
     */
    public function findByEmail(string $email): ?array
    {
        $cleanEmail = trim($email);
        if ($cleanEmail === '') {
            return null;
        }

        $stmt = $this->pdo->prepare('SELECT * FROM `client` WHERE `email` = :email ORDER BY `client_id` DESC LIMIT 1');
        $stmt->bindValue(':email', $cleanEmail, PDO::PARAM_STR);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    /**
     * Finds a client record by client_id.
     *
     * @return array<string, mixed>|null
     */
    public function findById(int $clientId): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM `client` WHERE `client_id` = :id LIMIT 1');
        $stmt->bindValue(':id', $clientId, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    /**
     * Registers a new client record into the `client` table in `treads`.
     *
     * @param string      $name
     * @param string      $email
     * @param string      $password
     * @param string|null $telephone
     * @param string|null $address
     * @return array{
     *   client_id: int,
     *   name: string,
     *   email: string,
     *   telephone: string,
     *   address: string,
     *   date: string
     * }
     */
    public function registerClient(
        string $name,
        string $email,
        string $password,
        ?string $telephone = null,
        ?string $address = null
    ): array {
        $this->ensureSchema();

        $cleanName  = trim($name);
        $cleanEmail = trim($email);
        $cleanPhone = $telephone !== null ? trim($telephone) : '';
        $cleanAddr  = ($address !== null && trim($address) !== '') ? trim($address) : 'Kampala, Uganda';

        if ($cleanName === '') {
            throw new RuntimeException('Full name is required.');
        }

        if ($cleanEmail === '' || !filter_var($cleanEmail, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('A valid email address is required.');
        }

        if (strlen($password) < 6) {
            throw new RuntimeException('Password must be at least 6 characters long.');
        }

        // Check if an account with this email already exists
        $existing = $this->findByEmail($cleanEmail);
        if ($existing !== null) {
            throw new RuntimeException('An account with this email address already exists. Please sign in instead.');
        }

        // Format telephone: fallback to 'Na' or '0700000000' if not provided
        $finalPhone = $cleanPhone !== '' ? $cleanPhone : 'Na';
        // Password hash
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        // Standard Sesco defaults:
        // shop_id = 1 (Queens Way)
        // branch_id = 1 (Kampala)
        // user_id = 1 (Default staff admin)
        // care_of = 'Self'
        // category = 'Individual'
        // openning_bal = 0
        // credit_limit = 2000
        $shopId   = 1;
        $branchId = 1;
        $userId   = 1;
        $careOf   = 'Self';
        $category = 'Individual';

        $insertSql = <<<'SQL'
            INSERT INTO `client` (
                `date`,
                `shop_id`,
                `user_id`,
                `branch_id`,
                `tin`,
                `name`,
                `care_of`,
                `address`,
                `telephone`,
                `email`,
                `contact_name`,
                `contact_phone`,
                `category`,
                `openning_bal`,
                `credit_limit`,
                `password`
            ) VALUES (
                NOW(),
                :shop_id,
                :user_id,
                :branch_id,
                NULL,
                :name,
                :care_of,
                :address,
                :telephone,
                :email,
                :contact_name,
                :contact_phone,
                :category,
                0,
                2000,
                :password
            )
        SQL;

        $stmt = $this->pdo->prepare($insertSql);
        $stmt->bindValue(':shop_id', $shopId, PDO::PARAM_INT);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':branch_id', $branchId, PDO::PARAM_INT);
        $stmt->bindValue(':name', $cleanName, PDO::PARAM_STR);
        $stmt->bindValue(':care_of', $careOf, PDO::PARAM_STR);
        $stmt->bindValue(':address', $cleanAddr, PDO::PARAM_STR);
        $stmt->bindValue(':telephone', $finalPhone, PDO::PARAM_STR);
        $stmt->bindValue(':email', $cleanEmail, PDO::PARAM_STR);
        $stmt->bindValue(':contact_name', $cleanName, PDO::PARAM_STR);
        $stmt->bindValue(':contact_phone', $finalPhone, PDO::PARAM_STR);
        $stmt->bindValue(':category', $category, PDO::PARAM_STR);
        $stmt->bindValue(':password', $hashedPassword, PDO::PARAM_STR);

        $stmt->execute();

        $newClientId = (int) $this->pdo->lastInsertId();

        return [
            'client_id' => $newClientId,
            'name'      => $cleanName,
            'email'     => $cleanEmail,
            'telephone' => $finalPhone,
            'address'   => $cleanAddr,
            'date'      => date('Y-m-d H:i:s'),
        ];
    }

    /**
     * Verifies client credentials against the `client` table.
     *
     * @return array<string, mixed>|null Returns client details if valid, null otherwise
     */
    public function verifyCredentials(string $email, string $password): ?array
    {
        $this->ensureSchema();
        $client = $this->findByEmail($email);
        if ($client === null) {
            return null;
        }

        $storedHash = (string) ($client['password'] ?? '');
        if ($storedHash === '' || !password_verify($password, $storedHash)) {
            return null;
        }

        // Return client info without sensitive password hash
        unset($client['password']);
        return $client;
    }

    /**
     * Returns safe profile fields for an authenticated client without exposing password hashes.
     *
     * @return array<string, mixed>|null
     */
    public function findPublicProfileById(int $clientId): ?array
    {
        $this->ensureSchema();
        if ($clientId <= 0) {
            return null;
        }

        $client = $this->findById($clientId);
        if ($client === null) {
            return null;
        }

        return [
            'client_id'    => (int) $client['client_id'],
            'name'         => (string) ($client['name'] ?? ''),
            'email'        => (string) ($client['email'] ?? ''),
            'telephone'    => (string) ($client['telephone'] ?? ''),
            'address'      => (string) ($client['address'] ?? ''),
            'has_password' => trim((string) ($client['password'] ?? '')) !== '',
        ];
    }

    /**
     * Updates an authenticated client's name, email, and (optionally) password
     * under strict single-client isolation by $clientId.
     *
     * @return array{
     *   client: array<string, mixed>,
     *   email_changed: bool,
     *   password_changed: bool
     * }
     */
    public function updateClientProfile(
        int $clientId,
        string $name,
        string $email,
        string $currentPassword = '',
        string $newPassword = '',
        string $confirmPassword = ''
    ): array {
        $this->ensureSchema();
        if ($clientId <= 0) {
            throw new RuntimeException('Authentication required.', 401);
        }

        $cleanName  = trim($name);
        $cleanEmail = strtolower(trim($email));

        $nameLen = function_exists('mb_strlen') ? mb_strlen($cleanName, 'UTF-8') : strlen($cleanName);
        if ($cleanName === '' || $nameLen < 2) {
            throw new RuntimeException('Full name must be at least 2 characters long.', 422);
        }
        if ($nameLen > 100) {
            throw new RuntimeException('Full name must not exceed 100 characters.', 422);
        }

        if ($cleanEmail === '' || !filter_var($cleanEmail, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Please enter a valid email address.', 422);
        }
        if (strlen($cleanEmail) > 50) {
            throw new RuntimeException('Email address must not exceed 50 characters.', 422);
        }

        $wantsPasswordChange = ($newPassword !== '' || $confirmPassword !== '');
        if (!$wantsPasswordChange && $currentPassword !== '') {
            throw new RuntimeException('Please enter a new password to update your password, or leave all password fields blank.', 422);
        }

        if ($wantsPasswordChange) {
            if (strlen($newPassword) < 6) {
                throw new RuntimeException('New password must be at least 6 characters long.', 422);
            }
            if (strlen($newPassword) > 128) {
                throw new RuntimeException('New password must not exceed 128 characters.', 422);
            }
            if (!hash_equals($newPassword, $confirmPassword)) {
                throw new RuntimeException('New password and confirmation password do not match.', 422);
            }
        }

        $this->pdo->beginTransaction();
        try {
            $lockStmt = $this->pdo->prepare(
                'SELECT `client_id`, `name`, `email`, `telephone`, `address`, `password`
                 FROM `client`
                 WHERE `client_id` = :client_id
                 LIMIT 1
                 FOR UPDATE'
            );
            $lockStmt->bindValue(':client_id', $clientId, PDO::PARAM_INT);
            $lockStmt->execute();
            $currentRow = $lockStmt->fetch(PDO::FETCH_ASSOC);

            if (!$currentRow) {
                $this->pdo->rollBack();
                throw new RuntimeException('Client account could not be found.', 404);
            }

            // Reject duplicate email belonging to any other client
            $dupStmt = $this->pdo->prepare(
                "SELECT `client_id`
                 FROM `client`
                 WHERE `client_id` <> :self_id
                   AND `email` IS NOT NULL
                   AND TRIM(`email`) <> ''
                   AND LOWER(TRIM(`email`)) = :email
                 LIMIT 1
                 FOR UPDATE"
            );
            $dupStmt->execute([
                ':self_id' => $clientId,
                ':email'   => $cleanEmail,
            ]);
            if ($dupStmt->fetch(PDO::FETCH_ASSOC)) {
                $this->pdo->rollBack();
                throw new RuntimeException('An account with this email address already exists. Please use a different email.', 409);
            }

            $storedHash = (string) ($currentRow['password'] ?? '');
            $passwordHashToSave = null;
            if ($wantsPasswordChange) {
                if ($storedHash !== '') {
                    if ($currentPassword === '') {
                        $this->pdo->rollBack();
                        throw new RuntimeException('Please enter your current password to set a new password.', 422);
                    }
                    if (!password_verify($currentPassword, $storedHash)) {
                        $this->pdo->rollBack();
                        throw new RuntimeException('Current password is incorrect.', 401);
                    }
                }
                $passwordHashToSave = password_hash($newPassword, PASSWORD_DEFAULT);
            }

            $oldEmail = strtolower(trim((string) ($currentRow['email'] ?? '')));
            $emailChanged = $oldEmail !== $cleanEmail;

            if ($passwordHashToSave !== null) {
                $updStmt = $this->pdo->prepare(
                    'UPDATE `client`
                     SET `name` = :name, `email` = :email, `password` = :password
                     WHERE `client_id` = :client_id
                     LIMIT 1'
                );
                $updStmt->bindValue(':password', $passwordHashToSave, PDO::PARAM_STR);
            } else {
                $updStmt = $this->pdo->prepare(
                    'UPDATE `client`
                     SET `name` = :name, `email` = :email
                     WHERE `client_id` = :client_id
                     LIMIT 1'
                );
            }
            $updStmt->bindValue(':name', $cleanName, PDO::PARAM_STR);
            $updStmt->bindValue(':email', $cleanEmail, PDO::PARAM_STR);
            $updStmt->bindValue(':client_id', $clientId, PDO::PARAM_INT);
            $updStmt->execute();

            if ($emailChanged || $wantsPasswordChange) {
                $this->invalidateOpenResetCodesForClient($clientId);
            }

            $this->pdo->commit();

            return [
                'client' => [
                    'client_id'    => $clientId,
                    'name'         => $cleanName,
                    'email'        => $cleanEmail,
                    'telephone'    => (string) ($currentRow['telephone'] ?? ''),
                    'address'      => (string) ($currentRow['address'] ?? ''),
                    'has_password' => $wantsPasswordChange || $storedHash !== '',
                ],
                'email_changed'    => $emailChanged,
                'password_changed' => $wantsPasswordChange,
            ];
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    private function invalidateOpenResetCodesForClient(int $clientId): void
    {
        try {
            $stmt = $this->pdo->prepare(
                'UPDATE `client_password_resets`
                 SET `invalidated_at` = UTC_TIMESTAMP()
                 WHERE `client_id` = :client_id
                   AND `used_at` IS NULL
                   AND `invalidated_at` IS NULL'
            );
            $stmt->execute([':client_id' => $clientId]);
        } catch (Throwable) {
            // Table may not exist yet if forgot-password has not been triggered
        }
    }
}

