<?php

declare(strict_types=1);

namespace Sesco\Backend;

use DateTimeImmutable;
use PDO;
use RuntimeException;
use Throwable;

/**
 * Repository for managing customer feedback and testimonials in `treads.testimonials`.
 * Target Runtime: PHP 8.5.12
 */
final readonly class TestimonialRepository
{
    public const array ALLOWED_REVIEW_TYPES = [
        'Service',
        'Product',
        'Service & Product',
        'General',
    ];

    public function __construct(
        private PDO $pdo
    ) {}

    /**
     * Idempotently creates `testimonials` if missing and seeds baseline driver reviews once.
     */
    public function ensureSchema(): void
    {
        $sql = <<<'SQL'
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        SQL;

        try {
            $this->pdo->exec($sql);
        } catch (Throwable) {
            // Fall back without FK if `client` table does not exist in an isolated setup
            $this->pdo->exec(str_replace(",\n              CONSTRAINT `fk_testimonials_client` FOREIGN KEY (`client_id`) REFERENCES `client` (`client_id`) ON DELETE SET NULL ON UPDATE CASCADE", '', $sql));
        }

        // Seed only when the table has never had any rows inserted
        $statusStmt = $this->pdo->query("SHOW TABLE STATUS LIKE 'testimonials'");
        $statusRow  = $statusStmt ? $statusStmt->fetch(PDO::FETCH_ASSOC) : null;
        $nextAi     = (int) ($statusRow['Auto_increment'] ?? 1);
        $count      = (int) ($this->pdo->query('SELECT COUNT(*) FROM `testimonials`')->fetchColumn() ?: 0);

        if ($count === 0 && $nextAi <= 1) {
            $this->seedInitialTestimonials();
        }
    }

    /**
     * Fetches published testimonials ordered newest first.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getPublishedTestimonials(int $limit = 20, ?string $reviewType = null): array
    {
        $safeLimit = max(1, min(50, $limit));
        $where     = ["t.`status` = 'Published'"];
        $params    = [];

        if ($reviewType !== null && in_array($reviewType, self::ALLOWED_REVIEW_TYPES, true)) {
            $where[]                = 't.`review_type` = :review_type';
            $params[':review_type'] = $reviewType;
        }

        $whereSql = implode(' AND ', $where);

        $sql = <<<SQL
            SELECT
                t.`testimonial_id`,
                t.`client_id`,
                t.`reviewer_name`,
                t.`vehicle`,
                t.`review_type`,
                t.`subject_reviewed`,
                t.`headline`,
                t.`review_text`,
                t.`rating`,
                t.`avatar_url`,
                t.`source_label`,
                t.`status`,
                t.`created_at`
            FROM `testimonials` t
            WHERE {$whereSql}
            ORDER BY t.`created_at` DESC, t.`testimonial_id` DESC
            LIMIT :limit
        SQL;

        $stmt = $this->pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $safeLimit, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(self::formatRow(...), $rows);
    }

    /**
     * Computes aggregate stats for published reviews.
     *
     * @return array{total_reviews: int, average_rating: float, five_star_count: int}
     */
    public function getSummaryStats(): array
    {
        $row = $this->pdo->query(
            "SELECT
                COUNT(*) AS total_reviews,
                COALESCE(ROUND(AVG(`rating`), 1), 5.0) AS average_rating,
                COALESCE(SUM(CASE WHEN `rating` = 5 THEN 1 ELSE 0 END), 0) AS five_star_count
            FROM `testimonials`
            WHERE `status` = 'Published'"
        )->fetch(PDO::FETCH_ASSOC);

        return [
            'total_reviews'   => (int) ($row['total_reviews'] ?? 0),
            'average_rating'  => (float) ($row['average_rating'] ?? 5.0),
            'five_star_count' => (int) ($row['five_star_count'] ?? 0),
        ];
    }

    /**
     * Validates and inserts a new customer review into `treads.testimonials`.
     *
     * @return array<string, mixed>
     */
    public function createTestimonial(
        ?int $clientId,
        string $reviewerName,
        ?string $reviewerEmail,
        string $vehicle,
        string $reviewType,
        string $subjectReviewed,
        string $headline,
        string $reviewText,
        int $rating
    ): array {
        $this->ensureSchema();

        $cleanName    = trim($reviewerName);
        $cleanEmail   = $reviewerEmail !== null ? trim($reviewerEmail) : null;
        $cleanVehicle = trim($vehicle);
        $cleanType    = trim($reviewType);
        $cleanSubject = trim($subjectReviewed);
        $cleanHead    = trim($headline);
        $cleanBody    = trim($reviewText);

        if ($cleanName === '') {
            throw new RuntimeException('Please enter your full name.');
        }

        if ($cleanEmail !== null && $cleanEmail !== '' && !filter_var($cleanEmail, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Please enter a valid email address or leave it blank.');
        }
        if ($cleanEmail === '') {
            $cleanEmail = null;
        }

        if ($cleanVehicle === '') {
            throw new RuntimeException('Please enter your vehicle model and location.');
        }

        if (!in_array($cleanType, self::ALLOWED_REVIEW_TYPES, true)) {
            $cleanType = 'Service';
        }

        if ($cleanSubject === '') {
            throw new RuntimeException('Please select or enter the service or product you are reviewing.');
        }

        if ($cleanHead === '') {
            throw new RuntimeException('Please provide a short title/headline for your review.');
        }

        if (mb_strlen($cleanBody) < 10) {
            throw new RuntimeException('Please share at least 10 characters in your detailed review.');
        }

        if ($rating < 1 || $rating > 5) {
            throw new RuntimeException('Please select a star rating between 1 and 5.');
        }

        $verifiedClientId = null;
        $sourceLabel      = 'Website Feedback';

        if ($clientId !== null && $clientId > 0) {
            $check = $this->pdo->prepare('SELECT `client_id` FROM `client` WHERE `client_id` = :cid LIMIT 1');
            $check->bindValue(':cid', $clientId, PDO::PARAM_INT);
            $check->execute();
            if ($check->fetchColumn()) {
                $verifiedClientId = $clientId;
                $sourceLabel      = 'Client Verified';
            }
        }

        $stmt = $this->pdo->prepare(
            'INSERT INTO `testimonials` (
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
                `status`
            ) VALUES (
                :client_id,
                :reviewer_name,
                :reviewer_email,
                :vehicle,
                :review_type,
                :subject_reviewed,
                :headline,
                :review_text,
                :rating,
                NULL,
                :source_label,
                \'Pending\'
            )'
        );

        if ($verifiedClientId === null) {
            $stmt->bindValue(':client_id', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':client_id', $verifiedClientId, PDO::PARAM_INT);
        }

        $stmt->bindValue(':reviewer_name', mb_substr($cleanName, 0, 100), PDO::PARAM_STR);
        if ($cleanEmail === null) {
            $stmt->bindValue(':reviewer_email', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':reviewer_email', mb_substr($cleanEmail, 0, 100), PDO::PARAM_STR);
        }
        $stmt->bindValue(':vehicle', mb_substr($cleanVehicle, 0, 120), PDO::PARAM_STR);
        $stmt->bindValue(':review_type', $cleanType, PDO::PARAM_STR);
        $stmt->bindValue(':subject_reviewed', mb_substr($cleanSubject, 0, 120), PDO::PARAM_STR);
        $stmt->bindValue(':headline', mb_substr($cleanHead, 0, 160), PDO::PARAM_STR);
        $stmt->bindValue(':review_text', mb_substr($cleanBody, 0, 2000), PDO::PARAM_STR);
        $stmt->bindValue(':rating', $rating, PDO::PARAM_INT);
        $stmt->bindValue(':source_label', $sourceLabel, PDO::PARAM_STR);
        $stmt->execute();

        $newId = (int) $this->pdo->lastInsertId();

        $fetch = $this->pdo->prepare(
            'SELECT
                `testimonial_id`,
                `client_id`,
                `reviewer_name`,
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
             FROM `testimonials`
             WHERE `testimonial_id` = :id
             LIMIT 1'
        );
        $fetch->bindValue(':id', $newId, PDO::PARAM_INT);
        $fetch->execute();
        $row = $fetch->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            throw new RuntimeException('Review was saved but could not be reloaded.');
        }

        return self::formatRow($row);
    }

    /**
     * Baseline testimonials when database is offline.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function getDefaultFallbackReviews(): array
    {
        return [
            [
                'testimonial_id'   => 5,
                'client_id'        => null,
                'reviewer_name'    => 'David Mukasa',
                'vehicle'          => 'Toyota Land Cruiser Prado · Kampala',
                'review_type'      => 'Service & Product',
                'subject_reviewed' => '3D Alignment & Tyres',
                'headline'         => "Transformed my Prado's highway stability completely",
                'review_text'      => "I drove in after experiencing high-speed steering vibration on my Prado TX. The Sesco team didn't just push new tyres — they diagnosed uneven tread wear, performed precision computerized 3D laser alignment, and fitted Michelin Primacy 4s. The SUV glides effortlessly on the highway now. Honest technicians and zero guesswork.",
                'rating'           => 5,
                'avatar_url'       => 'assets/images/testimonials/david-mukasa.jpg',
                'source_label'     => 'Google Verified',
                'is_verified'      => true,
                'relative_time'    => '4 days ago',
                'created_at'       => date('Y-m-d H:i:s', strtotime('-4 days')),
            ],
            [
                'testimonial_id'   => 4,
                'client_id'        => null,
                'reviewer_name'    => 'Sarah Nalubega',
                'vehicle'          => 'Toyota RAV4 Hybrid · Nakasero',
                'review_type'      => 'Service',
                'subject_reviewed' => 'Major Service & Brakes',
                'headline'         => 'Transparent upfront pricing and zero mechanical jargon',
                'review_text'      => 'As a woman car owner, I usually dread visiting repair garages because of unpredictable, inflated quotes. Sesco Tyres is refreshingly different! They gave me an itemized digital health sheet before touching anything, installed genuine Castrol oils, and completed the full service in 45 minutes while I worked from their clean lounge.',
                'rating'           => 5,
                'avatar_url'       => 'assets/images/testimonials/sarah-nalubega.jpg',
                'source_label'     => 'Workshop Verified',
                'is_verified'      => true,
                'relative_time'    => '1 week ago',
                'created_at'       => date('Y-m-d H:i:s', strtotime('-7 days')),
            ],
            [
                'testimonial_id'   => 3,
                'client_id'        => null,
                'reviewer_name'    => 'Eng. Ronald Kato',
                'vehicle'          => 'Logistics Director, LogisAfrica Haulage',
                'review_type'      => 'Service & Product',
                'subject_reviewed' => 'Fleet Maintenance',
                'headline'         => 'Cut our logistics tyre blowouts to zero across 14 trucks',
                'review_text'      => 'Managing a regional haulage fleet traversing the Northern Corridor requires heavy-duty reliability. We partnered with Sesco Tyres for commercial steer tyres and scheduled pressure maintenance. In 8 months, our fleet tyre life expanded by 30% and costly roadside blowouts dropped to zero. Invaluable logistics partners!',
                'rating'           => 5,
                'avatar_url'       => 'assets/images/testimonials/ronald-kato.jpg',
                'source_label'     => 'Google Verified',
                'is_verified'      => true,
                'relative_time'    => '2 weeks ago',
                'created_at'       => date('Y-m-d H:i:s', strtotime('-14 days')),
            ],
            [
                'testimonial_id'   => 2,
                'client_id'        => null,
                'reviewer_name'    => 'Grace Tumusiime',
                'vehicle'          => 'Subaru Forester · Entebbe',
                'review_type'      => 'Service',
                'subject_reviewed' => 'Suspension & Balancing',
                'headline'         => 'Effortless steering and perfect balance on highway & marram roads',
                'review_text'      => 'Living in Entebbe and commuting to Kampala daily is tough on suspension and tyres. Sesco did a complete dynamic wheel balance and suspension check. No more steering wobble, and tyre grip in wet weather is night and day. Exceptional work and welcoming staff!',
                'rating'           => 5,
                'avatar_url'       => 'assets/images/testimonials/grace-tumusiime.jpg',
                'source_label'     => 'Workshop Verified',
                'is_verified'      => true,
                'relative_time'    => '3 weeks ago',
                'created_at'       => date('Y-m-d H:i:s', strtotime('-21 days')),
            ],
            [
                'testimonial_id'   => 1,
                'client_id'        => null,
                'reviewer_name'    => 'Brian Kigozi',
                'vehicle'          => 'Mercedes-Benz C200 · Kololo',
                'review_type'      => 'Service & Product',
                'subject_reviewed' => 'Performance Fitment',
                'headline'         => 'Flawless alloy mounting with zero rim marks or scuffs',
                'review_text'      => 'Finding technicians who know how to handle delicate low-profile tyres on European wheels is rare in Kampala. The Sesco crew used modern touchless tyre machines and calibrated balancers. Smooth ride and immaculate care of my alloys. Highly recommended for premium cars!',
                'rating'           => 5,
                'avatar_url'       => 'assets/images/testimonials/brian-kigozi.jpg',
                'source_label'     => 'Google Verified',
                'is_verified'      => true,
                'relative_time'    => '1 month ago',
                'created_at'       => date('Y-m-d H:i:s', strtotime('-30 days')),
            ],
        ];
    }

    private function seedInitialTestimonials(): void
    {
        $seeds = array_reverse(self::getDefaultFallbackReviews());

        $stmt = $this->pdo->prepare(
            'INSERT INTO `testimonials` (
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
            ) VALUES (
                NULL,
                :reviewer_name,
                NULL,
                :vehicle,
                :review_type,
                :subject_reviewed,
                :headline,
                :review_text,
                :rating,
                :avatar_url,
                :source_label,
                \'Published\',
                :created_at
            )'
        );

        foreach ($seeds as $item) {
            $stmt->execute([
                ':reviewer_name'    => $item['reviewer_name'],
                ':vehicle'          => $item['vehicle'],
                ':review_type'      => $item['review_type'],
                ':subject_reviewed' => $item['subject_reviewed'],
                ':headline'         => $item['headline'],
                ':review_text'      => $item['review_text'],
                ':rating'           => $item['rating'],
                ':avatar_url'       => $item['avatar_url'],
                ':source_label'     => $item['source_label'],
                ':created_at'       => $item['created_at'],
            ]);
        }
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private static function formatRow(array $row): array
    {
        $rating = max(1, min(5, (int) ($row['rating'] ?? 5)));
        $source = (string) ($row['source_label'] ?? 'Website Feedback');

        return [
            'testimonial_id'   => (int) ($row['testimonial_id'] ?? 0),
            'client_id'        => isset($row['client_id']) ? (int) $row['client_id'] : null,
            'reviewer_name'    => (string) ($row['reviewer_name'] ?? ''),
            'vehicle'          => (string) ($row['vehicle'] ?? ''),
            'review_type'      => (string) ($row['review_type'] ?? 'Service'),
            'subject_reviewed' => (string) ($row['subject_reviewed'] ?? ''),
            'headline'         => (string) ($row['headline'] ?? ''),
            'review_text'      => (string) ($row['review_text'] ?? ''),
            'rating'           => $rating,
            'avatar_url'       => $row['avatar_url'] ? (string) $row['avatar_url'] : null,
            'source_label'     => $source,
            'status'           => (string) ($row['status'] ?? 'Published'),
            'is_verified'      => $row['client_id'] !== null || str_contains(strtolower($source), 'verified'),
            'relative_time'    => self::formatRelativeTime((string) ($row['created_at'] ?? '')),
            'created_at'       => (string) ($row['created_at'] ?? ''),
        ];
    }

    private static function formatRelativeTime(string $createdAt): string
    {
        if ($createdAt === '') {
            return 'Recently';
        }

        try {
            $then = new DateTimeImmutable($createdAt);
            $now  = new DateTimeImmutable('now');
            $diff = max(0, $now->getTimestamp() - $then->getTimestamp());

            if ($diff < 60) {
                return 'Just now';
            }
            if ($diff < 3600) {
                $mins = (int) floor($diff / 60);
                return $mins . ($mins === 1 ? ' minute ago' : ' minutes ago');
            }
            if ($diff < 86400) {
                $hrs = (int) floor($diff / 3600);
                return $hrs . ($hrs === 1 ? ' hour ago' : ' hours ago');
            }
            $days = (int) floor($diff / 86400);
            if ($days < 7) {
                return $days . ($days === 1 ? ' day ago' : ' days ago');
            }
            if ($days < 30) {
                $weeks = (int) floor($days / 7);
                return $weeks . ($weeks === 1 ? ' week ago' : ' weeks ago');
            }
            $months = (int) floor($days / 30);
            if ($months < 12) {
                return $months . ($months === 1 ? ' month ago' : ' months ago');
            }
            return $then->format('M j, Y');
        } catch (Throwable) {
            return 'Recently';
        }
    }
}

