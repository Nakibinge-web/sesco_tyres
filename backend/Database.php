<?php

declare(strict_types=1);

namespace Sesco\Backend;

use PDO;
use PDOException;
use RuntimeException;

/**
 * PDO Database Connection Manager for the `treads` database.
 * Compatible with PHP 8.5.12 and MariaDB/MySQL (XAMPP).
 */
final class Database
{
    private static ?PDO $connection = null;
    private static ?string $activeHost = null;

    /**
     * Establish or reuse a PDO connection to the `treads` database.
     *
     * @param array<string, mixed> $dbConfig
     */
    public static function connect(array $dbConfig): PDO
    {
        if (self::$connection instanceof PDO) {
            return self::$connection;
        }

        $hosts    = (array) ($dbConfig['hosts'] ?? ['127.0.0.1', 'localhost']);
        $port     = (int) ($dbConfig['port'] ?? 3306);
        $database = (string) ($dbConfig['database'] ?? 'treads');
        $username = (string) ($dbConfig['username'] ?? 'root');
        $password = (string) ($dbConfig['password'] ?? '');
        $charset  = (string) ($dbConfig['charset'] ?? 'utf8mb4');

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_TIMEOUT            => 4,
        ];

        $lastException = null;

        foreach ($hosts as $host) {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $host,
                $port,
                $database,
                $charset
            );

            try {
                self::$connection = new PDO($dsn, $username, $password, $options);
                self::$activeHost = (string) $host;
                return self::$connection;
            } catch (PDOException $e) {
                $lastException = $e;
            }
        }

        throw new RuntimeException(
            sprintf(
                'Could not connect to MySQL database "%s": %s',
                $database,
                $lastException?->getMessage() ?? 'Unknown PDO error'
            ),
            0,
            $lastException
        );
    }

    public static function getActiveHost(): ?string
    {
        return self::$activeHost;
    }
}

