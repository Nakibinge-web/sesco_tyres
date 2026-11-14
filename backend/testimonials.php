<?php

declare(strict_types=1);

/**
 * Sesco Tyres — Customer Feedback & Testimonials Endpoint
 * Target Runtime: PHP 8.5.12
 * - GET:  Returns published customer reviews from `treads.testimonials`.
 * - POST: Validates and saves user feedback about services and products into `treads.testimonials`.
 */

if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/TestimonialRepository.php';

use Sesco\Backend\Database;
use Sesco\Backend\TestimonialRepository;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$config = require __DIR__ . '/config.php';

if ($method === 'GET') {
    $limit      = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
    $reviewType = isset($_GET['type']) ? trim((string) $_GET['type']) : null;
    if ($reviewType === '' || $reviewType === 'all') {
        $reviewType = null;
    }

    try {
        $pdo  = Database::connect($config['db']);
        $repo = new TestimonialRepository($pdo);
        $repo->ensureSchema();

        $testimonials = $repo->getPublishedTestimonials(limit: $limit, reviewType: $reviewType);
        $stats        = $repo->getSummaryStats();

        echo json_encode([
            'success'      => true,
            'connected'    => true,
            'source'       => 'mysql:treads.testimonials',
            'db_host'      => Database::getActiveHost(),
            'db_name'      => $config['db']['database'],
            'table'        => 'testimonials',
            'count'        => count($testimonials),
            'stats'        => $stats,
            'testimonials' => $testimonials,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    } catch (Throwable $e) {
        $fallback = TestimonialRepository::getDefaultFallbackReviews();
        if ($reviewType !== null) {
            $fallback = array_values(array_filter(
                $fallback,
                static fn(array $r): bool => $r['review_type'] === $reviewType
            ));
        }
        $fallback = array_slice($fallback, 0, max(1, min(50, $limit)));

        echo json_encode([
            'success'      => true,
            'connected'    => false,
            'source'       => 'fallback-testimonials',
            'db_name'      => $config['db']['database'],
            'table'        => 'testimonials',
            'db_notice'    => $e->getMessage(),
            'count'        => count($fallback),
            'stats'        => [
                'total_reviews'   => count($fallback),
                'average_rating'  => 5.0,
                'five_star_count' => count($fallback),
            ],
            'testimonials' => $fallback,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
    exit;
}

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use GET or POST.',
    ]);
    exit;
}

$rawBody = file_get_contents('php://input');
$payload = is_string($rawBody) && $rawBody !== '' ? json_decode($rawBody, true) : $_POST;

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid review request payload.',
    ]);
    exit;
}

$name            = trim((string) ($payload['reviewer_name'] ?? $payload['name'] ?? ''));
$emailRaw        = trim((string) ($payload['reviewer_email'] ?? $payload['email'] ?? ''));
$email           = $emailRaw !== '' ? $emailRaw : null;
$vehicle         = trim((string) ($payload['vehicle'] ?? ''));
$reviewType      = trim((string) ($payload['review_type'] ?? 'Service'));
$subjectReviewed = trim((string) ($payload['subject_reviewed'] ?? $payload['subject'] ?? ''));
$headline        = trim((string) ($payload['headline'] ?? ''));
$reviewText      = trim((string) ($payload['review_text'] ?? $payload['message'] ?? ''));
$rating          = (int) ($payload['rating'] ?? 5);

$rawClientId = $_SESSION['client_id'] ?? $payload['client_id'] ?? null;
$clientId    = ($rawClientId !== null && $rawClientId !== '' && (int) $rawClientId > 0)
    ? (int) $rawClientId
    : null;

try {
    $pdo  = Database::connect($config['db']);
    $repo = new TestimonialRepository($pdo);

    $created = $repo->createTestimonial(
        clientId: $clientId,
        reviewerName: $name,
        reviewerEmail: $email,
        vehicle: $vehicle,
        reviewType: $reviewType,
        subjectReviewed: $subjectReviewed,
        headline: $headline,
        reviewText: $reviewText,
        rating: $rating
    );

    $stats = $repo->getSummaryStats();

    $reviewerName = (string) ($created['reviewer_name'] ?? $name);

    http_response_code(201);
    echo json_encode([
        'success'                     => true,
        'saved_to_testimonials_table' => true,
        'table'                       => 'testimonials',
        'db_name'                     => $config['db']['database'],
        'status'                      => $created['status'] ?? 'Pending',
        'message'                     => sprintf('Thank you %s. Your feedback has been submitted and is being reviewed by our team', $reviewerName),
        'testimonial'                 => $created,
        'stats'                       => $stats,
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (RuntimeException $e) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Unable to save review right now: ' . $e->getMessage(),
    ]);
}

