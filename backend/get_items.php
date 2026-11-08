<?php

declare(strict_types=1);

/**
 * Sesco Tyres — Shop Items API Endpoint
 * Target Runtime: PHP 8.5.12
 * Connects to the `treads` database and returns a 10-item sample from the `item` table.
 */

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/ItemRepository.php';
require_once __DIR__ . '/OrderRepository.php';

use Sesco\Backend\Database;
use Sesco\Backend\ItemRepository;
use Sesco\Backend\OrderRepository;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$config = require __DIR__ . '/config.php';

$limit      = isset($_GET['limit']) ? (int) $_GET['limit'] : (int) ($config['app']['default_sample_limit'] ?? 10);
$limit      = max(1, min((int) ($config['app']['max_sample_limit'] ?? 50), $limit));
$sampleMode = isset($_GET['mode']) ? trim((string) $_GET['mode']) : 'first10';
$search     = isset($_GET['search']) ? trim((string) $_GET['search']) : null;
$category   = isset($_GET['category']) ? trim((string) $_GET['category']) : null;

try {
    $pdo        = Database::connect($config['db']);
    $orderRepo  = new OrderRepository($pdo);
    $orderRepo->ensureSchemaAndRelationships();
    $repository = new ItemRepository($pdo);

    $items = $repository->fetchSampleItems(
        limit: $limit,
        sampleMode: $sampleMode,
        search: $search,
        category: $category
    );
    $stats = $repository->getCatalogueStats();

    echo json_encode([
        'success'     => true,
        'connected'   => true,
        'source'      => 'mysql:treads.item',
        'db_host'     => Database::getActiveHost(),
        'db_name'     => $config['db']['database'],
        'table'       => 'item',
        'php_version' => PHP_VERSION,
        'sample_mode' => $sampleMode,
        'count'       => count($items),
        'stats'       => $stats,
        'items'       => $items,
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    // Graceful fallback with exact 10 items from treads.sql if MySQL service is currently stopped
    $fallbackItems = ItemRepository::getSqlDumpSampleItems($sampleMode);

    if ($search !== null && $search !== '') {
        $q = strtolower($search);
        $fallbackItems = array_values(array_filter(
            $fallbackItems,
            static fn(array $item): bool => str_contains(strtolower($item['description'] . ' ' . $item['brand'] . ' ' . $item['size'] . ' ' . $item['item_id']), $q)
        ));
    }

    if ($category !== null && $category !== '' && $category !== 'all') {
        $fallbackItems = array_values(array_filter(
            $fallbackItems,
            static fn(array $item): bool => $item['category'] === $category
        ));
    }

    $fallbackItems = array_slice($fallbackItems, 0, $limit);

    echo json_encode([
        'success'     => true,
        'connected'   => false,
        'source'      => 'treads.sql-fallback',
        'db_name'     => $config['db']['database'],
        'table'       => 'item',
        'php_version' => PHP_VERSION,
        'sample_mode' => $sampleMode,
        'db_notice'   => $e->getMessage(),
        'count'       => count($fallbackItems),
        'stats'       => [
            'total_items'  => 690,
            'total_brands' => 210,
            'total_types'  => 38,
            'priced_items' => 645,
        ],
        'items'       => $fallbackItems,
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

