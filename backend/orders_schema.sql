-- ============================================================================
-- Sesco Tyres (`treads` DB) — `orders` Table & Relational Foreign Keys
-- Stores each order request as a single record in `orders`.
-- When a user orders multiple items, `item_id` stores the array of item IDs
-- (e.g. `[1, 2]`), and `item_brand_id`, `item_category_id`, `item_type_id`,
-- `item_unit_id`, `item_image_id`, and `unit_price` store the array of distinct
-- values whenever the ordered items have different brands, categories, types,
-- units, images, or unit prices.
-- ============================================================================

USE `treads`;

-- 1. Create the `orders` table (`client_id` is NULL when client has not logged in)
CREATE TABLE IF NOT EXISTS `orders` (
  `order_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_reference` varchar(40) NOT NULL,
  `order_date` datetime NOT NULL DEFAULT current_timestamp(),
  `client_id` int(5) DEFAULT NULL COMMENT 'NULL when guest/non-logged-in client submits order',
  `name` varchar(100) NOT NULL,
  `contact` varchar(30) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `location` varchar(150) NOT NULL,
  `item_id` varchar(255) NOT NULL COMMENT 'Single item_id or array of item_ids e.g. [1, 2]',
  `item_brand_id` varchar(255) DEFAULT NULL COMMENT 'Single brand_id or array of brand_ids when different brands e.g. [3, 34]',
  `item_category_id` varchar(255) DEFAULT NULL COMMENT 'Single category_id or array of category_ids when different categories',
  `item_type_id` varchar(255) DEFAULT NULL COMMENT 'Single type_id or array of type_ids when different types e.g. [41, 1]',
  `item_unit_id` varchar(255) DEFAULT NULL COMMENT 'Single unit_id or array of unit_ids when different units e.g. [1, 3]',
  `item_image_id` varchar(255) DEFAULT NULL COMMENT 'Single image_id or array of image_ids when different images',
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` varchar(255) NOT NULL DEFAULT '0.00' COMMENT 'Single unit_price or array of unit_prices when different unit prices e.g. [150000.00, 160000.00]',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Normalize any legacy `item_unit_id = 0` rows in `item` to `1` (Pieces) before adding FK
UPDATE `item` SET `item_unit_id` = 1 WHERE `item_unit_id` = 0;

-- 3. Add Foreign Key relationships across the item tables (`item`, `item_brand`, `item_category`, `item_type`, `item_unit`, `item_image`)
ALTER TABLE `item`
  ADD CONSTRAINT `fk_item_brand` FOREIGN KEY (`item_brand_id`) REFERENCES `item_brand` (`item_brand_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_item_category` FOREIGN KEY (`item_category_id`) REFERENCES `item_category` (`item_category_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_item_type` FOREIGN KEY (`item_type_id`) REFERENCES `item_type` (`item_type_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_item_unit` FOREIGN KEY (`item_unit_id`) REFERENCES `item_unit` (`item_unit_id`) ON UPDATE CASCADE;

ALTER TABLE `item_brand`
  ADD CONSTRAINT `fk_item_brand_type` FOREIGN KEY (`item_type_id`) REFERENCES `item_type` (`item_type_id`) ON UPDATE CASCADE;

ALTER TABLE `item_type`
  ADD CONSTRAINT `fk_item_type_category` FOREIGN KEY (`item_category_id`) REFERENCES `item_category` (`item_category_id`) ON UPDATE CASCADE;
