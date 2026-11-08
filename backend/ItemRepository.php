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
        $limit = max(1, min(50, $limit));

        $whereClauses = ['1=1'];
        $params       = [];

        if ($search !== null && trim($search) !== '') {
            $whereClauses[]    = '(i.description LIKE :search OR b.name LIKE :searchBrand OR CAST(i.item_id AS CHAR) = :exactId)';
            $params[':search']      = '%' . trim($search) . '%';
            $params[':searchBrand'] = '%' . trim($search) . '%';
            $params[':exactId']     = trim($search);
        }

        if ($sampleMode === 'featured' && ($search === null || trim($search) === '')) {
            // Pick a rich, representative 10-item sample across distinct tyre brands with active prices
            $whereClauses[] = 'i.item_id IN (1, 2, 4, 5, 10, 13, 14, 15, 35, 6875)';
        }

        $orderBy = match ($sampleMode) {
            'random'   => 'RAND()',
            'featured' => 'FIELD(i.item_id, 4, 5, 10, 35, 6875, 13, 14, 15, 1, 2), i.item_id ASC',
            default    => 'i.item_id ASC',
        };

        $whereSql = implode(' AND ', $whereClauses);

        $sql = <<<SQL
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
            WHERE {$whereSql}
            ORDER BY {$orderBy}
            LIMIT :limit
        SQL;

        $stmt = $this->pdo->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val, PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();

        $enriched = [];
        foreach ($rows as $index => $row) {
            $item = self::enrichItemRow($row, $index);
            if ($category !== null && $category !== '' && $category !== 'all' && $item['category'] !== $category) {
                continue;
            }
            $enriched[] = $item;
        }

        return array_values($enriched);
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

        // Parse tyre size (e.g. 185/70R13, 205/65R16, 255/70R15C, 225/55ZR17, 9.5R17.5, 315/80R22.5)
        $parsedSize      = 'Standard Fit';
        $parsedLoadSpeed = 'Certified';
        $parsedPattern   = '';
        $rimDiameter     = 15.0;
        $widthMm         = 205;

        if (preg_match('/(\d{3})\s*\/\s*(\d{2})\s*(Z?R)\s*(\d{2}(?:\.\d)?[A-Z]*)/i', $description, $m)) {
            $widthMm     = (int) $m[1];
            $profile     = (int) $m[2];
            $radial      = strtoupper($m[3]);
            $rimStr      = strtoupper($m[4]);
            $rimDiameter = (float) preg_replace('/[^0-9.]/', '', $rimStr);
            $parsedSize  = sprintf('%d/%d %s%s', $widthMm, $profile, $radial, $rimStr);
        } elseif (preg_match('/(\d{2,4}(?:\.\d{1,2})?)\s*R\s*(\d{2}(?:\.\d)?[A-Z]*)/i', $description, $m)) {
            $rimDiameter = (float) preg_replace('/[^0-9.]/', '', $m[2]);
            $parsedSize  = strtoupper($m[1] . ' R' . $m[2]);
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

    /**
     * Exact 10-item sample directly from `treads.sql` (`item` + `item_brand` + `price_list`)
     * used as a seamless fallback if the local MySQL service is not yet started.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function getSqlDumpSampleItems(string $sampleMode = 'first10'): array
    {
        $first10Rows = [
            ['item_id' => 1,  'date' => '2020-09-22 00:00:00', 'item_type_id' => 41, 'item_brand_id' => 3,  'description' => 'RODEO 185/70R13/86H/RP113',    'restock_point' => '1', 'item_unit_id' => 1, 'item_category_id' => 1, 'brand_name' => 'RODEO',     'type_name' => 'SERVICE', 'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 150000],
            ['item_id' => 2,  'date' => '2020-09-22 00:00:00', 'item_type_id' => 41, 'item_brand_id' => 3,  'description' => 'RODEO 185/70R14/86H RP101',    'restock_point' => '8', 'item_unit_id' => 1, 'item_category_id' => 1, 'brand_name' => 'RODEO',     'type_name' => 'SERVICE', 'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 160000],
            ['item_id' => 3,  'date' => '2020-09-22 00:00:00', 'item_type_id' => 41, 'item_brand_id' => 34, 'description' => 'COMFORSER 195/65R15/91H',      'restock_point' => '1', 'item_unit_id' => 1, 'item_category_id' => 1, 'brand_name' => 'COMFORSER', 'type_name' => 'SERVICE', 'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 210000],
            ['item_id' => 4,  'date' => '2020-09-22 00:00:00', 'item_type_id' => 1,  'item_brand_id' => 3,  'description' => 'RODEO 205/65R16/95H',          'restock_point' => '1', 'item_unit_id' => 3, 'item_category_id' => 1, 'brand_name' => 'RODEO',     'type_name' => 'TYRE',    'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 240000],
            ['item_id' => 5,  'date' => '2020-09-22 00:00:00', 'item_type_id' => 1,  'item_brand_id' => 7,  'description' => 'COUGAR 205/60R16/92H',         'restock_point' => '1', 'item_unit_id' => 1, 'item_category_id' => 1, 'brand_name' => 'COUGAR',    'type_name' => 'TYRE',    'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 240000],
            ['item_id' => 6,  'date' => '2020-09-22 00:00:00', 'item_type_id' => 1,  'item_brand_id' => 3,  'description' => 'RODEO 205/70R15/95T/RP101',    'restock_point' => '1', 'item_unit_id' => 1, 'item_category_id' => 1, 'brand_name' => 'RODEO',     'type_name' => 'TYRE',    'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 250000],
            ['item_id' => 7,  'date' => '2020-09-22 00:00:00', 'item_type_id' => 1,  'item_brand_id' => 3,  'description' => 'RODEO 215/60R16/95H/RP101',    'restock_point' => '4', 'item_unit_id' => 1, 'item_category_id' => 1, 'brand_name' => 'RODEO',     'type_name' => 'TYRE',    'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 260000],
            ['item_id' => 9,  'date' => '2020-09-22 00:00:00', 'item_type_id' => 1,  'item_brand_id' => 5,  'description' => 'HABILEAD 255/70R15C/112/110S', 'restock_point' => '8', 'item_unit_id' => 1, 'item_category_id' => 1, 'brand_name' => 'HABILEAD',  'type_name' => 'TYRE',    'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 490000],
            ['item_id' => 10, 'date' => '2020-09-22 00:00:00', 'item_type_id' => 1,  'item_brand_id' => 5,  'description' => 'HABILEAD 255/70R16/111H/RS21', 'restock_point' => '8', 'item_unit_id' => 1, 'item_category_id' => 1, 'brand_name' => 'HABILEAD',  'type_name' => 'TYRE',    'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 480000],
            ['item_id' => 11, 'date' => '2020-09-22 00:00:00', 'item_type_id' => 1,  'item_brand_id' => 5,  'description' => 'HABILEAD 245/70R16/111H/XL',   'restock_point' => '2', 'item_unit_id' => 1, 'item_category_id' => 1, 'brand_name' => 'HABILEAD',  'type_name' => 'TYRE',    'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 460000],
        ];

        $featured10Rows = [
            ['item_id' => 4,    'date' => '2020-09-22 00:00:00', 'item_type_id' => 1,  'item_brand_id' => 3,  'description' => 'RODEO 205/65R16/95H',             'restock_point' => '1', 'item_unit_id' => 3, 'item_category_id' => 1, 'brand_name' => 'RODEO',    'type_name' => 'TYRE',    'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 240000],
            ['item_id' => 5,    'date' => '2020-09-22 00:00:00', 'item_type_id' => 1,  'item_brand_id' => 7,  'description' => 'COUGAR 205/60R16/92H',            'restock_point' => '1', 'item_unit_id' => 1, 'item_category_id' => 1, 'brand_name' => 'COUGAR',   'type_name' => 'TYRE',    'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 240000],
            ['item_id' => 10,   'date' => '2020-09-22 00:00:00', 'item_type_id' => 1,  'item_brand_id' => 5,  'description' => 'HABILEAD 255/70R16/111H/RS21',    'restock_point' => '8', 'item_unit_id' => 1, 'item_category_id' => 1, 'brand_name' => 'HABILEAD', 'type_name' => 'TYRE',    'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 480000],
            ['item_id' => 35,   'date' => '2020-09-25 00:00:00', 'item_type_id' => 1,  'item_brand_id' => 12, 'description' => 'DUNLOP 205/55ZR16/94W',           'restock_point' => '2', 'item_unit_id' => 1, 'item_category_id' => 1, 'brand_name' => 'DUNLOP',   'type_name' => 'TYRE',    'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 280000],
            ['item_id' => 6875, 'date' => '2020-11-16 19:15:37', 'item_type_id' => 1,  'item_brand_id' => 2,  'description' => 'BEARWAY 265/65R17',               'restock_point' => '8', 'item_unit_id' => 1, 'item_category_id' => 1, 'brand_name' => 'BEARWAY',  'type_name' => 'TYRE',    'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 650000],
            ['item_id' => 13,   'date' => '2020-09-22 00:00:00', 'item_type_id' => 1,  'item_brand_id' => 51, 'description' => 'HIFLY 215/75R15/111T/AT',         'restock_point' => '1', 'item_unit_id' => 1, 'item_category_id' => 1, 'brand_name' => 'HIFLY',    'type_name' => 'TYRE',    'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 190000],
            ['item_id' => 14,   'date' => '2020-09-22 00:00:00', 'item_type_id' => 1,  'item_brand_id' => 83, 'description' => 'FARROAD 225/55ZR17/101W/XL',      'restock_point' => '2', 'item_unit_id' => 1, 'item_category_id' => 1, 'brand_name' => 'FARROAD',  'type_name' => 'TYRE',    'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 320000],
            ['item_id' => 15,   'date' => '2020-09-22 00:00:00', 'item_type_id' => 1,  'item_brand_id' => 4,  'description' => 'TITONG 9.5R17.5/18PR/HS928/MD',   'restock_point' => '1', 'item_unit_id' => 1, 'item_category_id' => 1, 'brand_name' => 'TITONG',   'type_name' => 'TYRE',    'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 640000],
            ['item_id' => 1,    'date' => '2020-09-22 00:00:00', 'item_type_id' => 41, 'item_brand_id' => 3,  'description' => 'RODEO 185/70R13/86H/RP113',       'restock_point' => '1', 'item_unit_id' => 1, 'item_category_id' => 1, 'brand_name' => 'RODEO',    'type_name' => 'SERVICE', 'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 150000],
            ['item_id' => 2,    'date' => '2020-09-22 00:00:00', 'item_type_id' => 41, 'item_brand_id' => 3,  'description' => 'RODEO 185/70R14/86H RP101',       'restock_point' => '8', 'item_unit_id' => 1, 'item_category_id' => 1, 'brand_name' => 'RODEO',    'type_name' => 'SERVICE', 'unit_name' => 'Pieces', 'unit_symbol' => 'Pc(s)', 'category_name' => 'Sales', 'selling_price' => 160000],
        ];

        $sourceRows = $sampleMode === 'featured' ? $featured10Rows : $first10Rows;
        if ($sampleMode === 'random') {
            $merged = array_merge($first10Rows, $featured10Rows);
            $unique = [];
            foreach ($merged as $r) {
                $unique[$r['item_id']] = $r;
            }
            $sourceRows = array_values($unique);
            shuffle($sourceRows);
            $sourceRows = array_slice($sourceRows, 0, 10);
        }

        $result = [];
        foreach ($sourceRows as $idx => $row) {
            $result[] = self::enrichItemRow($row, $idx);
        }

        return $result;
    }
}

