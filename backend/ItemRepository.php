<?php

declare(strict_types=1);

namespace Sesco\Backend;

use PDO;

/**
 * Repository for querying and enriching records from `treads.item`
 * and its related tables (`item_brand`, `item_type`, `item_unit`, `item_category`, `price_list`, `item_image`).
 * Target Runtime: PHP 8.5.12
 */
final readonly class ItemRepository
{
    private const array TRANSPARENT_TYRE_IMAGES = [
        'assets/images/tyres/p1_michelin.png',
        'assets/images/tyres/p2_bridgestone.png',
        'assets/images/tyres/p3_goodyear.png',
        'assets/images/tyres/p4_continental.png',
        'assets/images/tyres/p5_pirelli.png',
        'assets/images/tyres/p6_dunlop.png',
    ];

    public function __construct(
        private PDO $pdo
    ) {}

    /**
     * Fetch a sample of items (default 10) from the `item` table in the `treads` database.
     *
     * @param int         $limit      Number of items to fetch (default: 10)
     * @param string      $sampleMode 'first10' | 'featured' | 'random'
     * @param string|null $search     Optional search filter on description or brand
     * @param string|null $category   Optional category filter
     * @return array<int, array<string, mixed>>
     */
    public function fetchSampleItems(
        int $limit = 10,
        string $sampleMode = 'first10',
        ?string $search = null,
        ?string $category = null
    ): array {
        $result = $this->fetchCatalogueItems(
            limit: $limit,
            afterId: 0,
            sampleMode: $sampleMode,
            search: $search,
            category: $category
        );

        return $result['items'];
    }

    /**
     * Fetch items from `treads.item` using key-set (cursor-based) pagination
     * where `i.item_id > $afterId`, with optional brand IDs, product type IDs,
     * search query, and rim diameter filter.
     *
     * @param array<int, int> $brandIds
     * @param array<int, int> $typeIds
     * @return array{
     *     items: array<int, array<string, mixed>>,
     *     total_matching: int,
     *     after_id: int,
     *     next_cursor: int|null,
     *     last_id: int|null,
     *     has_more: bool
     * }
     */
    public function fetchCatalogueItems(
        int $limit = 10,
        int $afterId = 0,
        string $sampleMode = 'first10',
        ?string $search = null,
        ?string $category = null,
        array $brandIds = [],
        array $typeIds = [],
        ?string $rim = null,
        ?string $dimension = null
    ): array {
        $limit   = max(1, min(100, $limit));
        $afterId = max(0, $afterId);

        $cleanBrandIds       = array_values(array_unique(array_filter(array_map('intval', $brandIds), static fn (int $v): bool => $v > 0)));
        $cleanTypeIds        = array_values(array_unique(array_filter(array_map('intval', $typeIds), static fn (int $v): bool => $v > 0)));
        $searchTrimmed       = $search !== null ? trim($search) : '';
        $hasSearch           = $searchTrimmed !== '';
        $cleanRim            = self::normalizeRimFilter($rim);
        $hasRim              = $cleanRim !== null;
        $normalizedDimension = self::normalizeDimensionQuery($dimension);
        $hasDimension        = $normalizedDimension !== null;
        $hasFilters          = count($cleanBrandIds) > 0 || count($cleanTypeIds) > 0 || $hasSearch || $hasRim || $hasDimension;

        $whereClauses = ['1=1'];
        $params       = [];

        if (count($cleanBrandIds) > 0) {
            $placeholders = [];
            foreach ($cleanBrandIds as $idx => $brandId) {
                $key            = ':brand_id_' . $idx;
                $placeholders[] = $key;
                $params[$key]   = [$brandId, PDO::PARAM_INT];
            }
            $whereClauses[] = 'i.item_brand_id IN (' . implode(', ', $placeholders) . ')';
        }

        if (count($cleanTypeIds) > 0) {
            $placeholders = [];
            foreach ($cleanTypeIds as $idx => $typeId) {
                $key            = ':type_id_' . $idx;
                $placeholders[] = $key;
                $params[$key]   = [$typeId, PDO::PARAM_INT];
            }
            $whereClauses[] = 'i.item_type_id IN (' . implode(', ', $placeholders) . ')';
        }

        if ($hasSearch) {
            $whereClauses[]         = '(i.description LIKE :search OR b.name LIKE :searchBrand OR t.name LIKE :searchType OR CAST(i.item_id AS CHAR) = :exactId)';
            $params[':search']      = ['%' . $searchTrimmed . '%', PDO::PARAM_STR];
            $params[':searchBrand'] = ['%' . $searchTrimmed . '%', PDO::PARAM_STR];
            $params[':searchType']  = ['%' . $searchTrimmed . '%', PDO::PARAM_STR];
            $params[':exactId']     = [$searchTrimmed, PDO::PARAM_STR];
        }

        if ($hasDimension && $normalizedDimension !== null) {
            $whereClauses[]       = "REPLACE(REPLACE(REPLACE(UPPER(i.description), ' ', ''), 'ZR', 'R'), 'R.', 'R') LIKE :dimension";
            $params[':dimension'] = ['%' . $normalizedDimension . '%', PDO::PARAM_STR];
        }

        if (!$hasFilters && $sampleMode === 'featured' && $afterId === 0) {
            // Pick a rich, representative 10-item sample across distinct tyre brands with active prices
            $whereClauses[] = 'i.item_id IN (1, 2, 4, 5, 10, 13, 14, 15, 35, 6875)';
        }

        $baseWhereSql = implode(' AND ', $whereClauses);
        $baseSql      = self::getBaseSelectSql();

        // When rim diameter filtering is active, match extracted rim diameter using key-set ID cursor (> $afterId)
        if ($hasRim) {
            $scanSql = <<<SQL
                SELECT i.item_id, i.description
                FROM `item` i
                LEFT JOIN `item_brand` b ON b.item_brand_id = i.item_brand_id
                LEFT JOIN `item_type` t ON t.item_type_id = i.item_type_id
                WHERE {$baseWhereSql}
                ORDER BY i.item_id ASC
            SQL;
            $scanStmt = $this->pdo->prepare($scanSql);
            foreach ($params as $key => [$val, $type]) {
                $scanStmt->bindValue($key, $val, $type);
            }
            $scanStmt->execute();

            $allMatchingIds = [];
            while ($candidate = $scanStmt->fetch(PDO::FETCH_ASSOC)) {
                if (self::extractRimDiameter((string) ($candidate['description'] ?? '')) === $cleanRim) {
                    $allMatchingIds[] = (int) $candidate['item_id'];
                }
            }

            $totalMatching = count($allMatchingIds);
            $remainingIds  = array_values(array_filter(
                $allMatchingIds,
                static fn (int $id): bool => $id > $afterId
            ));

            $hasMore = count($remainingIds) > $limit;
            $pageIds = array_slice($remainingIds, 0, $limit);
            $rows    = [];

            if (count($pageIds) > 0) {
                $idPlaceholders = [];
                $idParams       = [];
                foreach ($pageIds as $idx => $id) {
                    $key              = ':page_id_' . $idx;
                    $idPlaceholders[] = $key;
                    $idParams[$key]   = $id;
                }
                $inSql   = implode(', ', $idPlaceholders);
                $pageSql = <<<SQL
                    {$baseSql}
                    WHERE i.item_id IN ({$inSql}) AND i.item_id > :after_id
                    ORDER BY i.item_id ASC
                SQL;
                $pageStmt = $this->pdo->prepare($pageSql);
                foreach ($idParams as $key => $val) {
                    $pageStmt->bindValue($key, $val, PDO::PARAM_INT);
                }
                $pageStmt->bindValue(':after_id', $afterId, PDO::PARAM_INT);
                $pageStmt->execute();
                $rows = $pageStmt->fetchAll();
            }
        } else {
            $isRandomMode = !$hasFilters && $sampleMode === 'random' && $afterId === 0;
            $orderBy      = match (true) {
                $isRandomMode                            => 'RAND()',
                !$hasFilters && $sampleMode === 'featured' => 'FIELD(i.item_id, 4, 5, 10, 35, 6875, 13, 14, 15, 1, 2), i.item_id ASC',
                default                                  => 'i.item_id ASC',
            };

            $countSql = <<<SQL
                SELECT COUNT(*)
                FROM `item` i
                LEFT JOIN `item_brand` b ON b.item_brand_id = i.item_brand_id
                LEFT JOIN `item_type` t ON t.item_type_id = i.item_type_id
                WHERE {$baseWhereSql}
            SQL;
            $countStmt = $this->pdo->prepare($countSql);
            foreach ($params as $key => [$val, $type]) {
                $countStmt->bindValue($key, $val, $type);
            }
            $countStmt->execute();
            $totalMatching = (int) $countStmt->fetchColumn();

            $keysetWhereClauses = $whereClauses;
            $keysetParams       = $params;
            if (!$isRandomMode && $afterId > 0) {
                $keysetWhereClauses[]      = 'i.item_id > :after_id';
                $keysetParams[':after_id'] = [$afterId, PDO::PARAM_INT];
            }
            $keysetWhereSql = implode(' AND ', $keysetWhereClauses);
            $fetchLimit     = $isRandomMode ? $limit : ($limit + 1);

            $sql = <<<SQL
                {$baseSql}
                WHERE {$keysetWhereSql}
                ORDER BY {$orderBy}
                LIMIT :limit
            SQL;

            $stmt = $this->pdo->prepare($sql);
            foreach ($keysetParams as $key => [$val, $type]) {
                $stmt->bindValue($key, $val, $type);
            }
            $stmt->bindValue(':limit', $fetchLimit, PDO::PARAM_INT);
            $stmt->execute();

            $rows = $stmt->fetchAll();

            if (!$hasFilters && $sampleMode === 'featured' && $afterId === 0 && count($rows) === 0) {
                $totalMatching = (int) $this->pdo->query('SELECT COUNT(*) FROM `item`')->fetchColumn();
                $fallbackSql   = <<<SQL
                    {$baseSql}
                    WHERE i.item_id > 0
                    ORDER BY i.item_id ASC
                    LIMIT :limit
                SQL;
                $fallbackStmt = $this->pdo->prepare($fallbackSql);
                $fallbackStmt->bindValue(':limit', $limit + 1, PDO::PARAM_INT);
                $fallbackStmt->execute();
                $rows = $fallbackStmt->fetchAll();
            }

            if ($isRandomMode) {
                $hasMore = false;
            } else {
                $hasMore = count($rows) > $limit;
                if ($hasMore) {
                    $rows = array_slice($rows, 0, $limit);
                }
            }
        }

        $enriched = [];
        foreach ($rows as $index => $row) {
            $item = self::enrichItemRow($row, $index);
            if ($category !== null && $category !== '' && $category !== 'all' && $item['category'] !== $category) {
                continue;
            }
            $enriched[] = $item;
        }

        $lastItem   = count($enriched) > 0 ? $enriched[count($enriched) - 1] : null;
        $lastId     = $lastItem !== null ? (int) $lastItem['item_id'] : null;
        $nextCursor = ($hasMore && $lastId !== null) ? $lastId : null;

        return [
            'items'          => array_values($enriched),
            'total_matching' => $totalMatching,
            'after_id'       => $afterId,
            'next_cursor'    => $nextCursor,
            'last_id'        => $lastId,
            'has_more'       => $hasMore,
        ];
    }

    /**
     * Fetch specific items by numeric IDs (or `item_<id>` strings) in the requested order.
     *
     * @param array<int, int|string> $itemIds
     * @return array<int, array<string, mixed>>
     */
    public function fetchItemsByIds(array $itemIds): array
    {
        $cleanIds = [];
        foreach ($itemIds as $raw) {
            if (is_int($raw)) {
                $id = $raw;
            } elseif (preg_match('/^(?:item_)?(\d+)$/i', trim((string) $raw), $m)) {
                $id = (int) $m[1];
            } else {
                $id = 0;
            }
            if ($id > 0 && !in_array($id, $cleanIds, true)) {
                $cleanIds[] = $id;
            }
            if (count($cleanIds) >= 50) {
                break;
            }
        }

        if (count($cleanIds) === 0) {
            return [];
        }

        $placeholders = implode(', ', array_fill(0, count($cleanIds), '?'));
        $baseSql      = self::getBaseSelectSql();
        $sql          = "{$baseSql} WHERE i.item_id IN ({$placeholders})";

        $stmt = $this->pdo->prepare($sql);
        foreach ($cleanIds as $idx => $id) {
            $stmt->bindValue($idx + 1, $id, PDO::PARAM_INT);
        }
        $stmt->execute();

        $byId = [];
        foreach ($stmt->fetchAll() as $index => $row) {
            $item = self::enrichItemRow($row, $index);
            $byId[(int) $item['item_id']] = $item;
        }

        $ordered = [];
        foreach ($cleanIds as $id) {
            if (isset($byId[$id])) {
                $ordered[] = $byId[$id];
            }
        }

        return $ordered;
    }

    /**
     * Fetch a single item by its numeric `item_id`.
     *
     * @return array<string, mixed>|null
     */
    public function fetchItemById(int $itemId): ?array
    {
        if ($itemId <= 0) {
            return null;
        }
        $items = $this->fetchItemsByIds([$itemId]);
        return $items[0] ?? null;
    }

    private static function getBaseSelectSql(): string
    {
        return <<<SQL
            SELECT
                i.item_id,
                i.date,
                i.item_type_id,
                i.item_brand_id,
                i.description,
                i.restock_point,
                i.item_unit_id,
                i.item_category_id,
                COALESCE(b.name, 'SESCO') AS brand_name,
                COALESCE(t.name, 'TYRE') AS type_name,
                COALESCE(u.name, 'Pieces') AS unit_name,
                COALESCE(u.abbr, 'Pc(s)') AS unit_symbol,
                COALESCE(c.name, 'Sales') AS category_name,
                pl.selling_price,
                img.item_image_id AS db_image_id,
                img.src AS db_image_src
            FROM `item` i
            LEFT JOIN `item_brand` b ON b.item_brand_id = i.item_brand_id
            LEFT JOIN `item_type` t ON t.item_type_id = i.item_type_id
            LEFT JOIN `item_unit` u ON u.item_unit_id = i.item_unit_id
            LEFT JOIN `item_category` c ON c.item_category_id = i.item_category_id
            LEFT JOIN (
                SELECT `item_id`, MAX(`selling_price`) AS `selling_price`
                FROM `price_list`
                GROUP BY `item_id`
            ) pl ON pl.item_id = i.item_id
            LEFT JOIN (
                SELECT `item_id`, MAX(`item_image_id`) AS `item_image_id`, MAX(`src`) AS `src`
                FROM `item_image`
                GROUP BY `item_id`
            ) img ON img.item_id = i.item_id
        SQL;
    }

    /**
     * Get summary counts from `treads` tables for the Shop telemetry bar.
     *
     * @return array{total_items: int, total_brands: int, total_types: int, priced_items: int}
     */
    public function getCatalogueStats(): array
    {
        $totalItems  = (int) $this->pdo->query('SELECT COUNT(*) FROM `item`')->fetchColumn();
        $totalBrands = (int) $this->pdo->query('SELECT COUNT(*) FROM `item_brand`')->fetchColumn();
        $totalTypes  = (int) $this->pdo->query('SELECT COUNT(*) FROM `item_type`')->fetchColumn();
        $pricedItems = (int) $this->pdo->query('SELECT COUNT(DISTINCT `item_id`) FROM `price_list`')->fetchColumn();

        return [
            'total_items'  => $totalItems,
            'total_brands' => $totalBrands,
            'total_types'  => $totalTypes,
            'priced_items' => $pricedItems,
        ];
    }

    /**
     * Fetch every brand from `item_brand`, every product type from `item_type`,
     * and every distinct rim diameter from `item`, with live product counts.
     *
     * @return array{
     *     brands: array<int, array<string, mixed>>,
     *     types: array<int, array<string, mixed>>,
     *     rims: array<int, array<string, mixed>>
     * }
     */
    public function getCatalogueFilters(): array
    {
        $brandRows = $this->pdo->query(<<<'SQL'
            SELECT
                b.item_brand_id,
                TRIM(b.name) AS name,
                b.item_type_id,
                COUNT(i.item_id) AS item_count
            FROM `item_brand` b
            LEFT JOIN `item` i ON i.item_brand_id = b.item_brand_id
            GROUP BY b.item_brand_id, b.name, b.item_type_id
            ORDER BY item_count DESC, TRIM(b.name) ASC, b.item_brand_id ASC
        SQL)->fetchAll();

        $nameCounts = [];
        foreach ($brandRows as $r) {
            $norm = strtoupper((string) ($r['name'] ?? ''));
            $nameCounts[$norm] = ($nameCounts[$norm] ?? 0) + 1;
        }

        $brands = [];
        foreach ($brandRows as $r) {
            $name = (string) ($r['name'] ?? '');
            $norm = strtoupper($name);
            $id   = (int) ($r['item_brand_id'] ?? 0);
            $brands[] = [
                'id'           => $id,
                'name'         => $name,
                'label'        => ($nameCounts[$norm] ?? 0) > 1 ? "{$name} (#{$id})" : $name,
                'item_type_id' => (int) ($r['item_type_id'] ?? 1),
                'item_count'   => (int) ($r['item_count'] ?? 0),
            ];
        }

        $typeRows = $this->pdo->query(<<<'SQL'
            SELECT
                t.item_type_id,
                TRIM(t.name) AS name,
                t.item_category_id,
                COUNT(i.item_id) AS item_count
            FROM `item_type` t
            LEFT JOIN `item` i ON i.item_type_id = t.item_type_id
            GROUP BY t.item_type_id, t.name, t.item_category_id
            ORDER BY item_count DESC, TRIM(t.name) ASC, t.item_type_id ASC
        SQL)->fetchAll();

        $types = [];
        foreach ($typeRows as $r) {
            $types[] = [
                'id'               => (int) ($r['item_type_id'] ?? 0),
                'name'             => (string) ($r['name'] ?? ''),
                'item_category_id' => (int) ($r['item_category_id'] ?? 1),
                'item_count'       => (int) ($r['item_count'] ?? 0),
            ];
        }

        $descRows = $this->pdo->query('SELECT `description` FROM `item`')->fetchAll(PDO::FETCH_COLUMN);
        $rimCounts = [];
        foreach ($descRows as $desc) {
            $rim = self::extractRimDiameter((string) $desc);
            if ($rim !== null) {
                $rimCounts[$rim] = ($rimCounts[$rim] ?? 0) + 1;
            }
        }
        uksort(
            $rimCounts,
            static fn (string $a, string $b): int => (float) substr($a, 1) <=> (float) substr($b, 1)
        );

        $rims = [];
        foreach ($rimCounts as $rimLabel => $count) {
            $rims[] = [
                'rim'        => $rimLabel,
                'label'      => $rimLabel,
                'diameter'   => (float) substr($rimLabel, 1),
                'item_count' => $count,
            ];
        }

        return [
            'brands' => $brands,
            'types'  => $types,
            'rims'   => $rims,
        ];
    }

    /**
     * Extract normalized radial rim diameter token (e.g. 'R15', 'R17.5', 'R22.5') from item description.
     */
    public static function extractRimDiameter(string $description): ?string
    {
        $norm = static function (string $s): string {
            if (str_contains($s, '.')) {
                return rtrim(rtrim($s, '0'), '.');
            }
            $trimmed = ltrim($s, '0');
            return $trimmed !== '' ? $trimmed : '0';
        };

        if (preg_match('/\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?\s*Z?R\.?\s*(\d{1,2}(?:\.\d)?)(?=[A-Z\s\/\-]|$)/i', $description, $m)) {
            return 'R' . $norm($m[1]);
        }
        if (preg_match('/\b\d+(?:\.\d+)?(?:\s*[X\/]\s*\d+(?:\.\d+)?)?\s*Z?R\.?\s*(\d{1,2}(?:\.\d)?)(?=[A-Z\s\/\-]|$)/i', $description, $m)) {
            return 'R' . $norm($m[1]);
        }

        return null;
    }

    /**
     * Normalize a rim filter string (e.g. '16', 'r16', 'R17.5') into canonical 'R16' / 'R17.5'.
     */
    public static function normalizeRimFilter(?string $rim): ?string
    {
        if ($rim === null) {
            return null;
        }
        $trimmed = strtoupper(trim($rim));
        if ($trimmed === '') {
            return null;
        }
        if (preg_match('/^R?\s*(\d{1,2}(?:\.\d)?)$/', $trimmed, $m)) {
            $val = $m[1];
            if (str_contains($val, '.')) {
                $val = rtrim(rtrim($val, '0'), '.');
            } else {
                $val = ltrim($val, '0');
                if ($val === '') {
                    $val = '0';
                }
            }
            return 'R' . $val;
        }

        return null;
    }

    /**
     * Normalize a tyre dimension query string (e.g. "185/70 R13", "185/70R13", "245/45 ZR18")
     * into a canonical uppercase token without spaces for matching against item descriptions.
     */
    private static function normalizeDimensionQuery(?string $dimension): ?string
    {
        if ($dimension === null) {
            return null;
        }

        $clean = strtoupper(trim($dimension));
        if ($clean === '') {
            return null;
        }

        $clean = preg_replace('/\b(\d{2,3})\s+(\d{2})(?=\s*(?:Z?R|\/|\s|$))/i', '$1/$2', $clean) ?? $clean;
        $clean = str_replace([' ', "\t", "\r", "\n", '%', '_'], '', $clean);
        $clean = str_replace(['ZR', 'R.'], 'R', $clean);

        return $clean !== '' ? $clean : null;
    }

    /**
     * Transform a raw database row from `treads.item` into a rich frontend-ready item structure.
     *
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    public static function enrichItemRow(array $row, int $index = 0): array
    {
        $itemId      = (int) ($row['item_id'] ?? 0);
        $description = trim((string) ($row['description'] ?? ''));
        $brandName   = trim((string) ($row['brand_name'] ?? 'SESCO'));
        $typeName    = trim((string) ($row['type_name'] ?? 'TYRE'));
        $unitName    = trim((string) ($row['unit_name'] ?? 'Pieces'));
        $unitSymbol  = trim((string) ($row['unit_symbol'] ?? 'Pc(s)'));
        $catName     = trim((string) ($row['category_name'] ?? 'Sales'));
        $restockPt   = (int) ($row['restock_point'] ?? 0);
        $itemTypeId  = (int) ($row['item_type_id'] ?? 1);
        $itemBrandId = (int) ($row['item_brand_id'] ?? 0);
        $rawDate     = (string) ($row['date'] ?? '2020-09-22 00:00:00');

        if ($brandName === '' || strtoupper($brandName) === 'NONE') {
            $parts     = preg_split('/\s+/', $description) ?: [];
            $brandName = $parts[0] ?? 'SESCO';
        }

        // Parse tyre size (e.g. 185/70R13, 205/65R16, 255/70R15C, 225/55ZR17, 9.5R17.5, 315/80R22.5, 12.5/80R18)
        $parsedSize      = 'Standard Fit';
        $parsedLoadSpeed = 'Certified';
        $parsedPattern   = '';
        $extractedRim    = self::extractRimDiameter($description);
        $rimDiameter     = $extractedRim !== null ? (float) substr($extractedRim, 1) : 15.0;
        $widthMm         = 205;

        if (preg_match('/(\d{3})\s*\/\s*(\d{2})\s*(Z?R)\s*\.?\s*(\d{1,2}(?:\.\d)?[A-Z]*)/i', $description, $m)) {
            $widthMm     = (int) $m[1];
            $profile     = (int) $m[2];
            $radial      = strtoupper($m[3]);
            $rimStr      = strtoupper($m[4]);
            $rimDiameter = (float) preg_replace('/[^0-9.]/', '', $rimStr);
            $parsedSize  = sprintf('%d/%d %s%s', $widthMm, $profile, $radial, $rimStr);
        } elseif (preg_match('/(\d{1,4}(?:\.\d{1,2})?(?:\s*[\/X]\s*\d+(?:\.\d+)?)?)\s*(Z?R)\s*\.?\s*(\d{1,2}(?:\.\d)?[A-Z]*)/i', $description, $m)) {
            $rimDiameter = (float) preg_replace('/[^0-9.]/', '', $m[3]);
            $parsedSize  = strtoupper(preg_replace('/\s+/', '', $m[1]) . ' ' . $m[2] . $m[3]);
        }

        // Extract Load/Speed Index or Ply Rating (e.g. 86H, 95H, 112/110S, 18PR, 20PR, 94W)
        if (preg_match('/\b(\d{2,3}(?:\/\d{2,3})?[A-Z]{1,2}|\d{1,2}PR)\b/i', $description, $lm)) {
            $parsedLoadSpeed = strtoupper($lm[1]);
        }

        // Extract Pattern Code (e.g. RP113, RP101, RS21, S801, HS928, HS205, HF201, BW666)
        if (preg_match('/\b(RP\d+|RS\d+|S\d+|HS\d+|RT\d+|HF\d+|BW\d+|SP\d+|RX\d+|AT\d+|H\d+)\b/i', $description, $pm)) {
            $parsedPattern = strtoupper($pm[1]);
        }

        // Classify into frontend filter category using PHP 8 match expression
        $isCommercial = str_contains(strtoupper($description), 'PR')
            || str_contains(strtoupper($description), 'R17.5')
            || str_contains(strtoupper($description), 'R19.5')
            || str_contains(strtoupper($description), 'R22.5')
            || str_contains(strtoupper($description), 'R20')
            || str_contains(strtoupper($description), '15C')
            || str_contains(strtoupper($description), '14C')
            || str_contains(strtoupper($description), '13C');

        $isPerformance = str_contains(strtoupper($description), 'ZR')
            || str_contains(strtoupper($description), 'XL')
            || str_ends_with($parsedLoadSpeed, 'W')
            || str_ends_with($parsedLoadSpeed, 'V');

        $isSuv = $widthMm >= 235
            || $rimDiameter >= 17
            || str_contains(strtoupper($description), 'AT')
            || str_contains(strtoupper($description), 'SUV')
            || str_contains(strtoupper($description), 'RS21');

        $category = match (true) {
            $isCommercial        => 'commercial',
            $isPerformance       => 'performance',
            $isSuv               => 'suv',
            $widthMm <= 195      => 'economy',
            default              => 'touring',
        };

        $categoryLabel = match ($category) {
            'commercial'  => 'Commercial / LT',
            'performance' => 'Performance XL',
            'suv'         => 'SUV & 4x4 Terrain',
            'economy'     => 'Everyday Value',
            default       => 'Touring Comfort',
        };

        // Determine Selling Price in UGX (from `price_list` or calculated fallback)
        $rawPrice = $row['selling_price'] ?? null;
        if ($rawPrice !== null && (int) $rawPrice > 0) {
            $sellingPrice = (int) $rawPrice;
            $priceSource  = 'price_list';
        } else {
            // Deterministic UGX price based on tyre size if item has no row in price_list
            $sellingPrice = match ($category) {
                'commercial'  => 480000,
                'performance' => 380000,
                'suv'         => 450000,
                'economy'     => 185000,
                default       => 240000,
            };
            $priceSource = 'estimated';
        }

        // Assign visual image from local assets
        $imgIdx          = abs($itemId + $index) % count(self::TRANSPARENT_TYRE_IMAGES);
        $transparentImg  = self::TRANSPARENT_TYRE_IMAGES[$imgIdx];

        // Build clean human-readable display name while preserving exact DB description
        $cleanName = $description;
        if (str_starts_with(strtoupper($cleanName), strtoupper($brandName) . ' ')) {
            $cleanName = trim(substr($cleanName, strlen($brandName)));
        }
        $displayTitle = $brandName . ' ' . $cleanName;

        return [
            'id'               => 'item_' . $itemId,
            'item_id'          => $itemId,
            'name'             => $displayTitle,
            'description'      => $description,
            'brand'            => $brandName,
            'item_brand_id'    => $itemBrandId,
            'item_type'        => $typeName,
            'item_type_id'     => $itemTypeId,
            'item_category'    => $catName,
            'item_category_id' => (int) ($row['item_category_id'] ?? 1),
            'unit'             => $unitSymbol !== '-' ? $unitSymbol : 'Unit',
            'unit_name'        => $unitName,
            'item_unit_id'     => (int) ($row['item_unit_id'] ?? 1),
            'size'             => $parsedSize,
            'rim'              => $extractedRim,
            'load_speed'       => $parsedLoadSpeed,
            'pattern'          => $parsedPattern !== '' ? $parsedPattern : 'Standard Tread',
            'price'            => $sellingPrice,
            'price_source'     => $priceSource,
            'restock_point'    => $restockPt,
            'category'         => $category,
            'category_label'   => $categoryLabel,
            'tag'              => $categoryLabel,
            'image'            => $transparentImg,
            'transparentImage' => $transparentImg,
            'item_image_id'    => isset($row['db_image_id']) && (int) $row['db_image_id'] > 0 ? (int) $row['db_image_id'] : null,
            'db_image_src'     => $row['db_image_src'] ?? null,
            'date_added'       => substr($rawDate, 0, 10),
            'rating'           => '★★★★★',
            'ratingText'       => '(Verified DB Item #' . $itemId . ')',
            'fitment'          => 'Queens Way & Katwe Branches',
            'stock'            => $restockPt > 0 ? "Active Stock (Reorder Pt: {$restockPt})" : 'In Stock · Ready to Fit',
            'warranty'         => 'Manufacturer Warranty',
        ];
    }
}

