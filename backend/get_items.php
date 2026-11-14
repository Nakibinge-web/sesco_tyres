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

$limit          = isset($_GET['limit']) ? (int) $_GET['limit'] : (int) ($config['app']['default_sample_limit'] ?? 10);
$limit          = max(1, min(100, $limit));
$afterId        = max(0, (int) ($_GET['after_id'] ?? ($_GET['cursor'] ?? '0')));
$sampleMode     = isset($_GET['mode']) ? trim((string) $_GET['mode']) : 'first10';
$search         = isset($_GET['search']) ? trim((string) $_GET['search']) : null;
$category       = isset($_GET['category']) ? trim((string) $_GET['category']) : null;
$rim            = isset($_GET['rim']) ? trim((string) $_GET['rim']) : null;
$dimension      = isset($_GET['dimension']) ? trim((string) $_GET['dimension']) : null;
$rawId          = isset($_GET['id']) ? trim((string) $_GET['id']) : '';
$rawIds         = isset($_GET['ids']) ? trim((string) $_GET['ids']) : null;
$rawBrandIds    = isset($_GET['brand_ids']) ? trim((string) $_GET['brand_ids']) : '';
$rawTypeIds     = isset($_GET['type_ids']) ? trim((string) $_GET['type_ids']) : '';
$includeFilters = (string) ($_GET['include_filters'] ?? '1') !== '0';

$parseIdList = static function (string $csv): array {
    if ($csv === '') {
        return [];
    }
    $ids = [];
    foreach (explode(',', $csv) as $part) {
        $v = (int) trim($part);
        if ($v > 0 && !in_array($v, $ids, true)) {
            $ids[] = $v;
        }
    }
    return $ids;
};

$brandIds = $parseIdList($rawBrandIds);
$typeIds  = $parseIdList($rawTypeIds);

try {
    $pdo        = Database::connect($config['db']);
    $orderRepo  = new OrderRepository($pdo);
    $orderRepo->ensureSchemaAndRelationships();
    $repository = new ItemRepository($pdo);

    $totalMatching = 0;
    $lastId        = null;
    $nextCursor    = null;
    $hasMore       = false;

    if ($rawId !== '') {
        $parsedId      = preg_match('/^(?:item_)?(\d+)$/i', $rawId, $m) ? (int) $m[1] : 0;
        $found         = $parsedId > 0 ? $repository->fetchItemById($parsedId) : null;
        $items         = $found !== null ? [$found] : [];
        $totalMatching = count($items);
        $lastId        = $found !== null ? (int) $found['item_id'] : null;
    } elseif ($rawIds !== null) {
        $idParts       = $rawIds === '' ? [] : array_map('trim', explode(',', $rawIds));
        $items         = $repository->fetchItemsByIds($idParts);
        $totalMatching = count($items);
        $lastItem      = count($items) > 0 ? $items[count($items) - 1] : null;
        $lastId        = $lastItem !== null ? (int) $lastItem['item_id'] : null;
    } else {
        $pageResult = $repository->fetchCatalogueItems(
            limit: $limit,
            afterId: $afterId,
            sampleMode: $sampleMode,
            search: $search,
            category: $category,
            brandIds: $brandIds,
            typeIds: $typeIds,
            rim: $rim,
            dimension: $dimension
        );
        $items         = $pageResult['items'];
        $totalMatching = $pageResult['total_matching'];
        $lastId        = $pageResult['last_id'];
        $nextCursor    = $pageResult['next_cursor'];
        $hasMore       = $pageResult['has_more'];
    }
    $stats   = $repository->getCatalogueStats();
    $filters = ($rawId === '' && $rawIds === null && $includeFilters)
        ? $repository->getCatalogueFilters()
        : null;

    $responsePayload = [
        'success'        => true,
        'connected'      => true,
        'source'         => 'mysql:treads.item',
        'db_host'        => Database::getActiveHost(),
        'db_name'        => $config['db']['database'],
        'table'          => 'item',
        'php_version'    => PHP_VERSION,
        'sample_mode'    => $sampleMode,
        'pagination'     => 'keyset',
        'count'          => count($items),
        'total_matching' => $totalMatching,
        'after_id'       => $afterId,
        'last_id'        => $lastId,
        'next_cursor'    => $nextCursor,
        'has_more'       => $hasMore,
        'stats'          => $stats,
        'items'          => $items,
    ];
    if ($filters !== null) {
        $responsePayload['filters'] = $filters;
    }

    echo json_encode($responsePayload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    // Do not fall back to hardcoded tyres when disconnected; all shop products come from the database
    echo json_encode([
        'success'        => false,
        'connected'      => false,
        'source'         => 'database-disconnected',
        'db_name'        => $config['db']['database'],
        'table'          => 'item',
        'php_version'    => PHP_VERSION,
        'sample_mode'    => $sampleMode,
        'pagination'     => 'keyset',
        'db_notice'      => $e->getMessage(),
        'message'        => 'Not connected to the database. All products in the shop must be fetched from the database.',
        'count'          => 0,
        'total_matching' => 0,
        'after_id'       => $afterId,
        'last_id'        => null,
        'next_cursor'    => null,
        'has_more'       => false,
        'stats'          => [
            'total_items'  => 0,
            'total_brands' => 0,
            'total_types'  => 0,
            'priced_items' => 0,
        ],
        'filters'        => [
            'brands' => [],
            'types'  => [],
            'rims'   => [],
        ],
        'items'          => [],
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

