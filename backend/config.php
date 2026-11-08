<?php

declare(strict_types=1);

/**
 * Sesco Tyres — Treads Database Configuration
 * Target Runtime: PHP 8.5.12 (XAMPP MariaDB / MySQL)
 * Database Schema: treads (from treads.sql)
 */

return [
    'db' => [
        'hosts'    => [
            getenv('DB_HOST') ?: '127.0.0.1',
            'localhost',
        ],
        'port'     => (int) (getenv('DB_PORT') ?: 3306),
        'database' => getenv('DB_NAME') ?: 'treads',
        'username' => getenv('DB_USER') ?: 'root',
        'password' => getenv('DB_PASS') !== false ? (string) getenv('DB_PASS') : '',
        'charset'  => 'utf8mb4',
    ],
    'app' => [
        'company_id'           => 1,
        'default_sample_limit' => 10,
        'max_sample_limit'     => 50,
        'currency'             => 'UGX',
    ],
];

