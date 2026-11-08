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
}

