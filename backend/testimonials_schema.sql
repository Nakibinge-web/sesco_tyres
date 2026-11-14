-- ============================================================================
-- Sesco Tyres (`treads` DB) — `testimonials` Table & Initial Reviews
-- Stores customer feedback and product/service reviews submitted via
-- `feedback.html`. The Homepage "What Our Drivers Say" testimonials showcase
-- and Feedback community feed read directly from this table.
-- ============================================================================

SET NAMES utf8mb4;

USE `treads`;

CREATE TABLE IF NOT EXISTS `testimonials` (
  `testimonial_id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(5) DEFAULT NULL COMMENT 'Nullable link to logged-in client account',
  `reviewer_name` varchar(100) NOT NULL,
  `reviewer_email` varchar(100) DEFAULT NULL,
  `vehicle` varchar(120) DEFAULT NULL COMMENT 'Vehicle model & location e.g. Toyota Prado · Kampala',
  `review_type` enum('Service','Product','Service & Product','General') NOT NULL DEFAULT 'Service',
  `subject_reviewed` varchar(120) NOT NULL COMMENT 'Specific service or product reviewed',
  `headline` varchar(160) NOT NULL,
  `review_text` text NOT NULL,
  `rating` tinyint(1) NOT NULL DEFAULT 5,
  `avatar_url` varchar(255) DEFAULT NULL,
  `source_label` varchar(80) NOT NULL DEFAULT 'Website Feedback',
  `status` enum('Published','Pending','Hidden') NOT NULL DEFAULT 'Pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`testimonial_id`),
  KEY `idx_testimonials_status_created` (`status`, `created_at`),
  KEY `fk_testimonials_client` (`client_id`),
  CONSTRAINT `fk_testimonials_client` FOREIGN KEY (`client_id`) REFERENCES `client` (`client_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seed initial driver reviews only when the table is empty
INSERT INTO `testimonials` (
  `client_id`,
  `reviewer_name`,
  `reviewer_email`,
  `vehicle`,
  `review_type`,
  `subject_reviewed`,
  `headline`,
  `review_text`,
  `rating`,
  `avatar_url`,
  `source_label`,
  `status`,
  `created_at`
)
SELECT * FROM (
  SELECT
    NULL AS client_id,
    'Brian Kigozi' AS reviewer_name,
    NULL AS reviewer_email,
    'Mercedes-Benz C200 · Kololo' AS vehicle,
    'Service & Product' AS review_type,
    'Performance Fitment' AS subject_reviewed,
    'Flawless alloy mounting with zero rim marks or scuffs' AS headline,
    'Finding technicians who know how to handle delicate low-profile tyres on European wheels is rare in Kampala. The Sesco crew used modern touchless tyre machines and calibrated balancers. Smooth ride and immaculate care of my alloys. Highly recommended for premium cars!' AS review_text,
    5 AS rating,
    'assets/images/testimonials/brian-kigozi.jpg' AS avatar_url,
    'Google Verified' AS source_label,
    'Published' AS status,
    DATE_SUB(NOW(), INTERVAL 30 DAY) AS created_at
  UNION ALL SELECT NULL, 'Grace Tumusiime', NULL, 'Subaru Forester · Entebbe', 'Service', 'Suspension & Balancing',
    'Effortless steering and perfect balance on highway & marram roads',
    'Living in Entebbe and commuting to Kampala daily is tough on suspension and tyres. Sesco did a complete dynamic wheel balance and suspension check. No more steering wobble, and tyre grip in wet weather is night and day. Exceptional work and welcoming staff!',
    5, 'assets/images/testimonials/grace-tumusiime.jpg', 'Workshop Verified', 'Published', DATE_SUB(NOW(), INTERVAL 21 DAY)
  UNION ALL SELECT NULL, 'Eng. Ronald Kato', NULL, 'Logistics Director, LogisAfrica Haulage', 'Service & Product', 'Fleet Maintenance',
    'Cut our logistics tyre blowouts to zero across 14 trucks',
    'Managing a regional haulage fleet traversing the Northern Corridor requires heavy-duty reliability. We partnered with Sesco Tyres for commercial steer tyres and scheduled pressure maintenance. In 8 months, our fleet tyre life expanded by 30% and costly roadside blowouts dropped to zero. Invaluable logistics partners!',
    5, 'assets/images/testimonials/ronald-kato.jpg', 'Google Verified', 'Published', DATE_SUB(NOW(), INTERVAL 14 DAY)
  UNION ALL SELECT NULL, 'Sarah Nalubega', NULL, 'Toyota RAV4 Hybrid · Nakasero', 'Service', 'Major Service & Brakes',
    'Transparent upfront pricing and zero mechanical jargon',
    'As a woman car owner, I usually dread visiting repair garages because of unpredictable, inflated quotes. Sesco Tyres is refreshingly different! They gave me an itemized digital health sheet before touching anything, installed genuine Castrol oils, and completed the full service in 45 minutes while I worked from their clean lounge.',
    5, 'assets/images/testimonials/sarah-nalubega.jpg', 'Workshop Verified', 'Published', DATE_SUB(NOW(), INTERVAL 7 DAY)
  UNION ALL SELECT NULL, 'David Mukasa', NULL, 'Toyota Land Cruiser Prado · Kampala', 'Service & Product', '3D Alignment & Tyres',
    'Transformed my Prado''s highway stability completely',
    'I drove in after experiencing high-speed steering vibration on my Prado TX. The Sesco team didn''t just push new tyres — they diagnosed uneven tread wear, performed precision computerized 3D laser alignment, and fitted Michelin Primacy 4s. The SUV glides effortlessly on the highway now. Honest technicians and zero guesswork.',
    5, 'assets/images/testimonials/david-mukasa.jpg', 'Google Verified', 'Published', DATE_SUB(NOW(), INTERVAL 4 DAY)
) AS seed_rows
WHERE NOT EXISTS (SELECT 1 FROM `testimonials` LIMIT 1);
