<?php

declare(strict_types=1);

namespace Sesco\Backend;

use PDO;
use Throwable;

/**
 * Repository for managing the `orders` table in the `treads` database.
 * Inserts each customer order request as a single row in `orders`:
 * - `item_id` stores the single item ID or array of item IDs (e.g. `[1, 2]`) when >1 item is ordered.
 * - `item_brand_id` stores the single brand ID or array of brand IDs (e.g. `[3, 34]`) when items have different brands.
 * - `item_category_id` stores the single category ID or array of category IDs when items have different categories.
 * - `item_type_id` stores the single type ID or array of type IDs (e.g. `[41, 1]`) when items have different types.
 * - `item_unit_id` stores the single unit ID or array of unit IDs (e.g. `[1, 3]`) when items have different units.
 * - `item_image_id` stores the single image ID or array of image IDs when items have different images (or NULL).
 * - `quantity` stores the single item quantity (e.g. `2`) or array map of quantities (e.g. `[1 => 2, 2 => 3]`) when >1 item is ordered.
 * Target Runtime: PHP 8.5.12
 */
final readonly class OrderRepository
{
    public function __construct(
        private PDO $pdo
    ) {}

    /**
     * Formats a list of IDs from the ordered items:
     * - Returns `null` if no non-null positive IDs exist.
     * - Returns the single ID as a string (e.g. `'3'`) when all items share the same ID (or only 1 item was ordered).
     * - Returns an array string (e.g. `'[1, 2]'` or `'[3, 34]'`) when there are multiple distinct IDs.
     *
     * @param array<int, int|string|null> $values
     */
    public function formatIdOrArray(array $values): ?string
    {
        $nonNull = [];
        foreach ($values as $v) {
            if (is_string($v) && str_starts_with(trim($v), '[')) {
                $decoded = json_decode($v, true);
                if (is_array($decoded)) {
                    foreach ($decoded as $dv) {
                        if ($dv !== null && $dv !== '' && (int) $dv > 0) {
                            $nonNull[] = (int) $dv;
                        }
                    }
                    continue;
                }
            }
            if ($v !== null && $v !== '' && (int) $v > 0) {
                $nonNull[] = (int) $v;
            }
        }

        $unique = array_values(array_unique($nonNull));
        $count  = count($unique);

        if ($count === 0) {
            return null;
        }
        if ($count === 1) {
            return (string) $unique[0];
        }

        return '[' . implode(', ', $unique) . ']';
    }

    /**
     * Formats a list of unit prices from the ordered items:
     * - Returns `'0.00'` if no prices are provided.
     * - Returns the single formatted price (e.g. `'150000.00'`) when all items share the same unit price (or only 1 item was ordered).
     * - Returns an array string (e.g. `'[150000.00, 160000.00]'`) when items have different unit prices.
     *
     * @param array<int, float|int|string|null> $prices
     */
    public function formatPriceOrArray(array $prices): string
    {
        $formatted = [];
        foreach ($prices as $p) {
            if (is_string($p) && str_starts_with(trim($p), '[')) {
                $decoded = json_decode($p, true);
                if (is_array($decoded)) {
                    foreach ($decoded as $dp) {
                        if ($dp !== null && $dp !== '' && is_numeric($dp)) {
                            $formatted[] = number_format((float) $dp, 2, '.', '');
                        }
                    }
                    continue;
                }
            }
            if ($p !== null && $p !== '' && is_numeric($p)) {
                $formatted[] = number_format((float) $p, 2, '.', '');
            }
        }

        $unique = array_values(array_unique($formatted));
        $count  = count($unique);

        if ($count === 0) {
            return '0.00';
        }
        if ($count === 1) {
            return $unique[0];
        }

        return '[' . implode(', ', $unique) . ']';
    }

    /**
     * Formats a map of item_id => quantity for the `orders.quantity` column:
     * - Returns `'1'` if the map is empty.
     * - Returns the single item quantity as string (e.g. `'2'`) when only 1 distinct item is ordered.
     * - Returns an associative representation (e.g. `'[1 => 2, 2 => 3]'`) when 2 or more distinct items are ordered.
     *
     * @param array<int|string, int> $itemQtyMap Associative array of item_id => quantity
     */
    public function formatQuantityOrMap(array $itemQtyMap): string
    {
        if (count($itemQtyMap) === 0) {
            return '1';
        }

        if (count($itemQtyMap) === 1) {
            return (string) reset($itemQtyMap);
        }

        $parts = [];
        foreach ($itemQtyMap as $itemId => $qty) {
            $parts[] = "$itemId => $qty";
        }

        return '[' . implode(', ', $parts) . ']';
    }

    /**
     * Idempotently creates or migrates the `orders` table so the item columns
     * (`item_id`, `item_brand_id`, `item_category_id`, `item_type_id`, `item_unit_id`, `item_image_id`, `unit_price`)
     * can store single values or arrays of values (e.g. `[1, 2]`, `[150000.00, 160000.00]`), and consolidates any existing records.
     */
    public function ensureSchemaAndRelationships(): void
    {
        try {
            $checkTable = $this->pdo->query("SHOW TABLES LIKE 'orders'");
            $tableExists = $checkTable !== false && $checkTable->fetchColumn() !== false;

            if ($tableExists) {
                $colStmt = $this->pdo->query("SHOW COLUMNS FROM `orders` LIKE 'item_id'");
                $colInfo = $colStmt ? $colStmt->fetch() : null;
                $colType = strtolower((string) ($colInfo['Type'] ?? ''));

                $priceColStmt = $this->pdo->query("SHOW COLUMNS FROM `orders` LIKE 'unit_price'");
                $priceColInfo = $priceColStmt ? $priceColStmt->fetch() : null;
                $priceColType = strtolower((string) ($priceColInfo['Type'] ?? ''));

                $qtyColStmt = $this->pdo->query("SHOW COLUMNS FROM `orders` LIKE 'quantity'");
                $qtyColInfo = $qtyColStmt ? $qtyColStmt->fetch() : null;
                $qtyColType = strtolower((string) ($qtyColInfo['Type'] ?? ''));

                $itemsColStmt = $this->pdo->query("SHOW COLUMNS FROM `orders` LIKE 'items'");
                $hasItemsCol  = $itemsColStmt !== false && $itemsColStmt->fetchColumn() !== false;

                if (str_contains($colType, 'int') || str_contains($priceColType, 'decimal') || str_contains($qtyColType, 'int') || $hasItemsCol) {
                    $this->migrateOrdersColumnsToArrayCapable();
                }
                return;
            }
        } catch (Throwable) {
            // Proceed to full table creation if check fails
        }

        // 1. Normalize any legacy `item_unit_id = 0` rows in `item` so FK to `item_unit` is 100% valid
        try {
            $this->pdo->exec('UPDATE `item` SET `item_unit_id` = 1 WHERE `item_unit_id` = 0');
        } catch (Throwable) {
            // Ignore if table is read-only or not yet populated
        }

        // 2. Create `orders` table
        $createOrdersSql = <<<'SQL'
            CREATE TABLE IF NOT EXISTS `orders` (
              `order_id` int(11) NOT NULL AUTO_INCREMENT,
              `order_reference` varchar(40) NOT NULL,
              `order_date` datetime NOT NULL DEFAULT current_timestamp(),
              `client_id` int(5) DEFAULT NULL,
              `name` varchar(100) NOT NULL,
              `contact` varchar(30) NOT NULL,
              `email` varchar(100) DEFAULT NULL,
              `location` varchar(150) NOT NULL,
              `item_id` varchar(255) NOT NULL,
              `item_brand_id` varchar(255) DEFAULT NULL,
              `item_category_id` varchar(255) DEFAULT NULL,
              `item_type_id` varchar(255) DEFAULT NULL,
              `item_unit_id` varchar(255) DEFAULT NULL,
              `item_image_id` varchar(255) DEFAULT NULL,
              `quantity` varchar(255) NOT NULL DEFAULT '1',
              `unit_price` varchar(255) NOT NULL DEFAULT '0.00',
              `total_price` decimal(12,2) NOT NULL DEFAULT 0.00,
              `status` enum('Pending','Confirmed','Processing','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
              PRIMARY KEY (`order_id`),
              KEY `idx_orders_reference` (`order_reference`),
              KEY `fk_orders_client` (`client_id`),
              KEY `idx_orders_item` (`item_id`),
              KEY `idx_orders_item_brand` (`item_brand_id`),
              KEY `idx_orders_item_category` (`item_category_id`),
              KEY `idx_orders_item_type` (`item_type_id`),
              KEY `idx_orders_item_unit` (`item_unit_id`),
              KEY `idx_orders_item_image` (`item_image_id`),
              CONSTRAINT `fk_orders_client` FOREIGN KEY (`client_id`) REFERENCES `client` (`client_id`) ON DELETE SET NULL ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        SQL;

        $this->pdo->exec($createOrdersSql);
    }

    /**
     * Migrates existing `orders` table columns (`item_id`, `item_brand_id`, `item_category_id`,
     * `item_type_id`, `item_unit_id`, `item_image_id`, `unit_price`) to `varchar(255)` and updates
     * existing records so multi-item orders display arrays in those columns.
     */
    public function migrateOrdersColumnsToArrayCapable(): void
    {
        $fksToDrop = [
            'fk_orders_item',
            'fk_orders_item_brand',
            'fk_orders_item_category',
            'fk_orders_item_type',
            'fk_orders_item_unit',
            'fk_orders_item_image',
        ];

        foreach ($fksToDrop as $fkName) {
            try {
                $this->pdo->exec("ALTER TABLE `orders` DROP FOREIGN KEY `$fkName`");
            } catch (Throwable) {
                // Ignore if FK does not exist
            }
        }

        try {
            $this->pdo->exec(<<<'SQL'
                ALTER TABLE `orders`
                  MODIFY COLUMN `item_id` varchar(255) NOT NULL,
                  MODIFY COLUMN `item_brand_id` varchar(255) DEFAULT NULL,
                  MODIFY COLUMN `item_category_id` varchar(255) DEFAULT NULL,
                  MODIFY COLUMN `item_type_id` varchar(255) DEFAULT NULL,
                  MODIFY COLUMN `item_unit_id` varchar(255) DEFAULT NULL,
                  MODIFY COLUMN `item_image_id` varchar(255) DEFAULT NULL,
                  MODIFY COLUMN `quantity` varchar(255) NOT NULL DEFAULT '1',
                  MODIFY COLUMN `unit_price` varchar(255) NOT NULL DEFAULT '0.00'
            SQL);
        } catch (Throwable) {
            // Continue if columns are already varchar(255)
        }

        // Consolidate and populate existing rows in `orders`
        try {
            $stmt = $this->pdo->query('SELECT * FROM `orders` ORDER BY `order_id` ASC');
            $rows = $stmt ? $stmt->fetchAll() : [];

            if ($rows) {
                $grouped = [];
                foreach ($rows as $r) {
                    $ref = (string) $r['order_reference'];
                    $grouped[$ref][] = $r;
                }

                $priceLookupStmt = $this->pdo->prepare(
                    'SELECT MAX(`selling_price`) FROM `price_list` WHERE `item_id` = :item_id'
                );

                $updateStmt = $this->pdo->prepare(<<<'SQL'
                    UPDATE `orders`
                    SET `item_id` = :item_id,
                        `item_brand_id` = :item_brand_id,
                        `item_category_id` = :item_category_id,
                        `item_type_id` = :item_type_id,
                        `item_unit_id` = :item_unit_id,
                        `item_image_id` = :item_image_id,
                        `quantity` = :quantity,
                        `unit_price` = :unit_price,
                        `total_price` = :total_price
                    WHERE `order_id` = :order_id
                SQL);

                $deleteStmt = $this->pdo->prepare('DELETE FROM `orders` WHERE `order_id` = :order_id');

                foreach ($grouped as $ref => $groupRows) {
                    $firstRow          = $groupRows[0];
                    $keepOrderId       = (int) $firstRow['order_id'];
                    $formattedQuantity = null;

                    $itemIds    = [];
                    $brandIds   = [];
                    $catIds     = [];
                    $typeIds    = [];
                    $unitIds    = [];
                    $imageIds   = [];
                    $unitPrices = [];
                    $itemQtyMap = [];
                    $sumQty     = 0;
                    $sumTotal   = 0.0;

                    foreach ($groupRows as $row) {
                        $parsedItems = (isset($row['items']) && is_string($row['items']))
                            ? json_decode($row['items'], true)
                            : null;

                        if (is_array($parsedItems) && count($parsedItems) > 0 && count($groupRows) === 1) {
                            foreach ($parsedItems as $pi) {
                                $iid          = (int) ($pi['item_id'] ?? 0);
                                $iqty         = max(1, (int) ($pi['quantity'] ?? 1));
                                $itemIds[]    = $iid ?: null;
                                $brandIds[]   = $pi['item_brand_id'] ?? null;
                                $catIds[]     = $pi['item_category_id'] ?? null;
                                $typeIds[]    = $pi['item_type_id'] ?? null;
                                $unitIds[]    = $pi['item_unit_id'] ?? null;
                                $imageIds[]   = $pi['item_image_id'] ?? null;
                                $unitPrices[] = $pi['unit_price'] ?? null;
                                if ($iid > 0) {
                                    $itemQtyMap[$iid] = ($itemQtyMap[$iid] ?? 0) + $iqty;
                                }
                            }
                            $sumQty   = (int) $row['quantity'];
                            $sumTotal = (float) $row['total_price'];
                            break;
                        }

                        $rItemId      = (int) ($row['item_id'] ?? 0);
                        $rQty         = max(1, (int) ($row['quantity'] ?? 1));
                        $itemIds[]    = $row['item_id'] ?? null;
                        $brandIds[]   = $row['item_brand_id'] ?? null;
                        $catIds[]     = $row['item_category_id'] ?? null;
                        $typeIds[]    = $row['item_type_id'] ?? null;
                        $unitIds[]    = $row['item_unit_id'] ?? null;
                        $imageIds[]   = $row['item_image_id'] ?? null;
                        $unitPrices[] = $row['unit_price'] ?? null;
                        $sumQty      += $rQty;
                        $sumTotal    += (float) $row['total_price'];
                        if ($rItemId > 0) {
                            $itemQtyMap[$rItemId] = ($itemQtyMap[$rItemId] ?? 0) + $rQty;
                        }
                    }

                    $formattedItemIds = $this->formatIdOrArray($itemIds) ?? (string) $firstRow['item_id'];

                    // If item_id contains multiple items (e.g. `[1, 2]`), resolve each item's unit price from `price_list`
                    if (str_starts_with($formattedItemIds, '[')) {
                        $decodedIds = json_decode($formattedItemIds, true);
                        if (is_array($decodedIds) && count($decodedIds) > 1) {
                            $resolvedPrices = [];
                            foreach ($decodedIds as $iid) {
                                $priceLookupStmt->execute([':item_id' => (int) $iid]);
                                $dbPrice = $priceLookupStmt->fetchColumn();
                                if ($dbPrice !== false && $dbPrice !== null) {
                                    $resolvedPrices[] = (float) $dbPrice;
                                }
                            }
                            if (count($resolvedPrices) > 0) {
                                $unitPrices = $resolvedPrices;
                            }

                            // If existing row had consolidated items without per-item quantity map
                            if (count($itemQtyMap) === 0) {
                                $rawExistingQty    = (string) ($firstRow['quantity'] ?? '');
                                $parsedExistingMap = [];
                                if (str_starts_with($rawExistingQty, '[')) {
                                    if (preg_match_all('/(\d+)\s*=>\s*(\d+)/', $rawExistingQty, $pm, PREG_SET_ORDER)) {
                                        foreach ($pm as $m) {
                                            $parsedExistingMap[(int) $m[1]] = (int) $m[2];
                                        }
                                    }
                                }
                                $allKeysMatch = count($parsedExistingMap) > 0 &&
                                    count(array_diff($decodedIds, array_keys($parsedExistingMap))) === 0 &&
                                    count(array_diff(array_keys($parsedExistingMap), $decodedIds)) === 0;

                                $checkSum = 0.0;
                                if ($allKeysMatch) {
                                    foreach ($parsedExistingMap as $mid => $mqty) {
                                        $mPrice = 0.0;
                                        foreach ($decodedIds as $dIdx => $did) {
                                            if ((int) $did === (int) $mid && isset($resolvedPrices[$dIdx])) {
                                                $mPrice = (float) $resolvedPrices[$dIdx];
                                                break;
                                            }
                                        }
                                        $checkSum += $mPrice * $mqty;
                                    }
                                }

                                if ($allKeysMatch && abs($checkSum - $sumTotal) < 0.01) {
                                    $itemQtyMap = $parsedExistingMap;
                                } else {
                                    if (count($decodedIds) === 2 && count($resolvedPrices) === 2) {
                                        $idA = (int) $decodedIds[0];
                                        $idB = (int) $decodedIds[1];
                                        $pA  = (float) $resolvedPrices[0];
                                        $pB  = (float) $resolvedPrices[1];
                                        $foundDeduction = false;
                                        if ($pA > 0 && $pB > 0 && $sumTotal > 0) {
                                            for ($qA = 1; $qA <= 50; $qA++) {
                                                $rem = $sumTotal - ($qA * $pA);
                                                if ($rem <= 0) {
                                                    break;
                                                }
                                                $qB = (int) round($rem / $pB);
                                                if ($qB >= 1 && abs(($qA * $pA + $qB * $pB) - $sumTotal) < 0.01) {
                                                    $itemQtyMap[$idA] = $qA;
                                                    $itemQtyMap[$idB] = $qB;
                                                    $foundDeduction   = true;
                                                    break;
                                                }
                                            }
                                        }
                                        if (!$foundDeduction) {
                                            foreach ($decodedIds as $did) {
                                                $itemQtyMap[(int) $did] = 1;
                                            }
                                        }
                                    } else {
                                        foreach ($decodedIds as $did) {
                                            $itemQtyMap[(int) $did] = 1;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if ($formattedQuantity === null) {
                        $formattedQuantity = $this->formatQuantityOrMap($itemQtyMap);
                        if ($formattedQuantity === '1' && $sumQty > 1 && count($itemQtyMap) <= 1) {
                            $formattedQuantity = (string) $sumQty;
                        }
                    }

                    $updateStmt->execute([
                        ':item_id'          => $formattedItemIds,
                        ':item_brand_id'    => $this->formatIdOrArray($brandIds),
                        ':item_category_id' => $this->formatIdOrArray($catIds),
                        ':item_type_id'     => $this->formatIdOrArray($typeIds),
                        ':item_unit_id'     => $this->formatIdOrArray($unitIds),
                        ':item_image_id'    => $this->formatIdOrArray($imageIds),
                        ':quantity'         => $formattedQuantity,
                        ':unit_price'       => $this->formatPriceOrArray($unitPrices),
                        ':total_price'      => number_format($sumTotal, 2, '.', ''),
                        ':order_id'         => $keepOrderId,
                    ]);

                    for ($i = 1, $n = count($groupRows); $i < $n; $i++) {
                        $deleteStmt->execute([':order_id' => (int) $groupRows[$i]['order_id']]);
                    }
                }
            }
        } catch (Throwable) {
            // Ignore row consolidation errors
        }

        // Drop temporary `items` column if it was added previously
        try {
            $itemsColStmt = $this->pdo->query("SHOW COLUMNS FROM `orders` LIKE 'items'");
            if ($itemsColStmt !== false && $itemsColStmt->fetchColumn() !== false) {
                $this->pdo->exec('ALTER TABLE `orders` DROP COLUMN `items`');
            }
        } catch (Throwable) {
            // Ignore if already dropped
        }
    }

    /**
     * Inserts the visitor's order request as ONE single record in the `orders` table:
     * - `item_id` shows all item IDs sent in the order request (e.g. `[1, 2]`).
     * - `item_brand_id` shows all brand IDs if items have different brands (e.g. `[3, 34]`), or the single brand ID.
     * - `item_category_id` shows all category IDs if items have different categories, or the single category ID.
     * - `item_type_id` shows all type IDs if items have different types (e.g. `[41, 1]`), or the single type ID.
     * - `item_unit_id` shows all unit IDs if items have different units (e.g. `[1, 3]`), or the single unit ID.
     * - `item_image_id` shows all image IDs if items have different images, or the single image ID (or NULL).
     *
     * @param string                            $orderReference
     * @param int|null                          $clientId
     * @param string                            $name
     * @param string                            $contact
     * @param string|null                       $email
     * @param string                            $location
     * @param array<int, array<string, mixed>>  $cartItems
     * @return array{
     *   order_id: int,
     *   order_ids: array<int, int>,
     *   order_reference: string,
     *   client_id: int|null,
     *   total_qty: int,
     *   total_amount: float,
     *   items: array<int, array<string, mixed>>,
     *   inserted_rows: array<int, array<string, mixed>>
     * }
     */
    public function createOrderRequest(
        string $orderReference,
        ?int $clientId,
        string $name,
        string $contact,
        ?string $email,
        string $location,
        array $cartItems
    ): array {
        $this->ensureSchemaAndRelationships();

        // Verify client_id exists in `client` if provided; otherwise set to NULL (non-logged-in client)
        $validClientId = null;
        if ($clientId !== null && $clientId > 0) {
            $clientStmt = $this->pdo->prepare('SELECT `client_id` FROM `client` WHERE `client_id` = :cid LIMIT 1');
            $clientStmt->bindValue(':cid', $clientId, PDO::PARAM_INT);
            $clientStmt->execute();
            $foundClient = $clientStmt->fetchColumn();
            if ($foundClient !== false) {
                $validClientId = (int) $foundClient;
            }
        }

        $cleanEmail = ($email !== null && trim($email) !== '') ? trim($email) : null;

        // Prepare statement to look up item & its related IDs from `item`, `item_image`, `price_list`
        $itemLookupStmt = $this->pdo->prepare(<<<'SQL'
            SELECT
                i.item_id,
                i.description,
                i.item_brand_id,
                i.item_category_id,
                i.item_type_id,
                i.item_unit_id,
                (SELECT MAX(img.item_image_id) FROM `item_image` img WHERE img.item_id = i.item_id) AS item_image_id,
                (SELECT MAX(pl.selling_price) FROM `price_list` pl WHERE pl.item_id = i.item_id) AS db_selling_price
            FROM `item` i
            WHERE i.item_id = :item_id
            LIMIT 1
        SQL);

        $fallbackFirstItemStmt = $this->pdo->query(<<<'SQL'
            SELECT
                i.item_id,
                i.description,
                i.item_brand_id,
                i.item_category_id,
                i.item_type_id,
                i.item_unit_id,
                (SELECT MAX(img.item_image_id) FROM `item_image` img WHERE img.item_id = i.item_id) AS item_image_id,
                (SELECT MAX(pl.selling_price) FROM `price_list` pl WHERE pl.item_id = i.item_id) AS db_selling_price
            FROM `item` i
            ORDER BY i.item_id ASC
            LIMIT 1
        SQL);
        $fallbackItemRow = $fallbackFirstItemStmt ? ($fallbackFirstItemStmt->fetch() ?: null) : null;

        $insertOrderStmt = $this->pdo->prepare(<<<'SQL'
            INSERT INTO `orders` (
                `order_reference`,
                `order_date`,
                `client_id`,
                `name`,
                `contact`,
                `email`,
                `location`,
                `item_id`,
                `item_brand_id`,
                `item_category_id`,
                `item_type_id`,
                `item_unit_id`,
                `item_image_id`,
                `quantity`,
                `unit_price`,
                `total_price`,
                `status`
            ) VALUES (
                :order_reference,
                NOW(),
                :client_id,
                :name,
                :contact,
                :email,
                :location,
                :item_id,
                :item_brand_id,
                :item_category_id,
                :item_type_id,
                :item_unit_id,
                :item_image_id,
                :quantity,
                :unit_price,
                :total_price,
                'Pending'
            )
        SQL);

        $itemsArray  = [];
        $totalQty    = 0;
        $totalAmount = 0.0;
        $itemQtyMap  = [];

        foreach ($cartItems as $entry) {
            $requestedItemId = (int) ($entry['item_id'] ?? 0);
            if ($requestedItemId <= 0 && isset($entry['id']) && is_string($entry['id'])) {
                if (preg_match('/^item_(\d+)$/', $entry['id'], $m)) {
                    $requestedItemId = (int) $m[1];
                } elseif (preg_match('/^p(\d+)$/', $entry['id'], $m)) {
                    $requestedItemId = (int) $m[1];
                }
            }

            $dbItem = null;
            if ($requestedItemId > 0) {
                $itemLookupStmt->bindValue(':item_id', $requestedItemId, PDO::PARAM_INT);
                $itemLookupStmt->execute();
                $dbItem = $itemLookupStmt->fetch() ?: null;
            }

            if ($dbItem === null) {
                $dbItem = $fallbackItemRow;
            }

            if ($dbItem === null) {
                continue;
            }

            $resolvedItemId     = (int) $dbItem['item_id'];
            $resolvedBrandId    = (int) ($dbItem['item_brand_id'] ?? 0) > 0 ? (int) $dbItem['item_brand_id'] : null;
            $resolvedCategoryId = (int) ($dbItem['item_category_id'] ?? 0) > 0 ? (int) $dbItem['item_category_id'] : null;
            $resolvedTypeId     = (int) ($dbItem['item_type_id'] ?? 0) > 0 ? (int) $dbItem['item_type_id'] : null;
            $resolvedUnitId     = (int) ($dbItem['item_unit_id'] ?? 0) > 0 ? (int) $dbItem['item_unit_id'] : 1;
            $resolvedImageId    = isset($dbItem['item_image_id']) && (int) $dbItem['item_image_id'] > 0
                ? (int) $dbItem['item_image_id']
                : null;

            $qty       = max(1, (int) ($entry['qty'] ?? 1));
            $unitPrice = (float) ($entry['price'] ?? $dbItem['db_selling_price'] ?? 0);
            $lineTotal = $qty * $unitPrice;

            $totalQty    += $qty;
            $totalAmount += $lineTotal;

            $itemQtyMap[$resolvedItemId] = ($itemQtyMap[$resolvedItemId] ?? 0) + $qty;

            $itemsArray[] = [
                'item_id'          => $resolvedItemId,
                'description'      => (string) $dbItem['description'],
                'item_brand_id'    => $resolvedBrandId,
                'item_category_id' => $resolvedCategoryId,
                'item_type_id'     => $resolvedTypeId,
                'item_unit_id'     => $resolvedUnitId,
                'item_image_id'    => $resolvedImageId,
                'quantity'         => $qty,
                'unit_price'       => $unitPrice,
                'total_price'      => $lineTotal,
            ];
        }

        if (count($itemsArray) === 0 && $fallbackItemRow !== null) {
            $fallbackId = (int) $fallbackItemRow['item_id'];
            $itemsArray[] = [
                'item_id'          => $fallbackId,
                'description'      => (string) $fallbackItemRow['description'],
                'item_brand_id'    => (int) ($fallbackItemRow['item_brand_id'] ?? 0) ?: null,
                'item_category_id' => (int) ($fallbackItemRow['item_category_id'] ?? 0) ?: null,
                'item_type_id'     => (int) ($fallbackItemRow['item_type_id'] ?? 0) ?: null,
                'item_unit_id'     => (int) ($fallbackItemRow['item_unit_id'] ?? 1) ?: 1,
                'item_image_id'    => null,
                'quantity'         => 1,
                'unit_price'       => (float) ($fallbackItemRow['db_selling_price'] ?? 0),
                'total_price'      => (float) ($fallbackItemRow['db_selling_price'] ?? 0),
            ];
            $totalQty    = 1;
            $totalAmount = (float) ($fallbackItemRow['db_selling_price'] ?? 0);
            $itemQtyMap[$fallbackId] = 1;
        }

        $primaryItem     = $itemsArray[0];
        $itemIdCol       = $this->formatIdOrArray(array_column($itemsArray, 'item_id')) ?? (string) $primaryItem['item_id'];
        $itemBrandIdCol  = $this->formatIdOrArray(array_column($itemsArray, 'item_brand_id'));
        $itemCatIdCol    = $this->formatIdOrArray(array_column($itemsArray, 'item_category_id'));
        $itemTypeIdCol   = $this->formatIdOrArray(array_column($itemsArray, 'item_type_id'));
        $itemUnitIdCol   = $this->formatIdOrArray(array_column($itemsArray, 'item_unit_id'));
        $itemImageIdCol  = $this->formatIdOrArray(array_column($itemsArray, 'item_image_id'));
        $unitPriceCol    = $this->formatPriceOrArray(array_column($itemsArray, 'unit_price'));
        $quantityCol     = $this->formatQuantityOrMap($itemQtyMap);

        $this->pdo->beginTransaction();

        try {
            $insertOrderStmt->bindValue(':order_reference', $orderReference, PDO::PARAM_STR);
            if ($validClientId === null) {
                $insertOrderStmt->bindValue(':client_id', null, PDO::PARAM_NULL);
            } else {
                $insertOrderStmt->bindValue(':client_id', $validClientId, PDO::PARAM_INT);
            }
            $insertOrderStmt->bindValue(':name', $name, PDO::PARAM_STR);
            $insertOrderStmt->bindValue(':contact', $contact, PDO::PARAM_STR);
            if ($cleanEmail === null) {
                $insertOrderStmt->bindValue(':email', null, PDO::PARAM_NULL);
            } else {
                $insertOrderStmt->bindValue(':email', $cleanEmail, PDO::PARAM_STR);
            }
            $insertOrderStmt->bindValue(':location', $location, PDO::PARAM_STR);
            $insertOrderStmt->bindValue(':item_id', $itemIdCol, PDO::PARAM_STR);
            $insertOrderStmt->bindValue(':item_brand_id', $itemBrandIdCol, $itemBrandIdCol === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $insertOrderStmt->bindValue(':item_category_id', $itemCatIdCol, $itemCatIdCol === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $insertOrderStmt->bindValue(':item_type_id', $itemTypeIdCol, $itemTypeIdCol === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $insertOrderStmt->bindValue(':item_unit_id', $itemUnitIdCol, $itemUnitIdCol === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $insertOrderStmt->bindValue(':item_image_id', $itemImageIdCol, $itemImageIdCol === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $insertOrderStmt->bindValue(':quantity', $quantityCol, PDO::PARAM_STR);
            $insertOrderStmt->bindValue(':unit_price', $unitPriceCol, PDO::PARAM_STR);
            $insertOrderStmt->bindValue(':total_price', number_format($totalAmount, 2, '.', ''), PDO::PARAM_STR);

            $insertOrderStmt->execute();
            $newOrderId = (int) $this->pdo->lastInsertId();

            $this->pdo->commit();
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }

        $insertedRecord = [
            'order_id'         => $newOrderId,
            'order_reference'  => $orderReference,
            'client_id'        => $validClientId,
            'name'             => $name,
            'contact'          => $contact,
            'email'            => $cleanEmail,
            'location'         => $location,
            'item_id'          => $itemIdCol,
            'item_brand_id'    => $itemBrandIdCol,
            'item_category_id' => $itemCatIdCol,
            'item_type_id'     => $itemTypeIdCol,
            'item_unit_id'     => $itemUnitIdCol,
            'item_image_id'    => $itemImageIdCol,
            'quantity'         => $quantityCol,
            'unit_price'       => $unitPriceCol,
            'total_price'      => $totalAmount,
            'status'           => 'Pending',
        ];

        return [
            'order_id'        => $newOrderId,
            'order_ids'       => [$newOrderId],
            'order_reference' => $orderReference,
            'client_id'       => $validClientId,
            'total_qty'       => $totalQty,
            'quantity'        => $quantityCol,
            'total_amount'    => $totalAmount,
            'items'           => $itemsArray,
            'inserted_rows'   => [$insertedRecord],
        ];
    }
}
