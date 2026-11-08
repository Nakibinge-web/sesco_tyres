<?php

declare(strict_types=1);

/**
 * Sesco Tyres — Order Request Handler Endpoint
 * Target Runtime: PHP 8.5.12
 * Receives customer details (Name, Contact, Email [optional], Location) and
 * selected cart items from the Cart page ("Send order request") and saves
 * them into the `orders` table in the `treads` database.
 * If the client has not logged in, `client_id` in `orders` is stored as NULL.
 */

if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/OrderRepository.php';

use Sesco\Backend\Database;
use Sesco\Backend\OrderRepository;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use POST to send an order request.',
    ]);
    exit;
}

$rawBody = file_get_contents('php://input');
$payload = is_string($rawBody) && $rawBody !== '' ? json_decode($rawBody, true) : $_POST;

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid order request payload.',
    ]);
    exit;
}

// Extract the 4 order fields: Name, Contact, Email (optional), Location
$name     = trim((string) ($payload['name'] ?? $payload['customer_name'] ?? ''));
$contact  = trim((string) ($payload['contact'] ?? $payload['customer_phone'] ?? ''));
$emailRaw = trim((string) ($payload['email'] ?? $payload['customer_email'] ?? ''));
$email    = $emailRaw !== '' ? $emailRaw : null;
$location = trim((string) ($payload['location'] ?? $payload['customer_location'] ?? ''));
$items    = is_array($payload['items'] ?? null) ? $payload['items'] : [];

// Determine client_id: NULL when the client has not logged in
$rawClientId = $_SESSION['client_id'] ?? $payload['client_id'] ?? null;
$clientId    = ($rawClientId !== null && $rawClientId !== '' && (int) $rawClientId > 0)
    ? (int) $rawClientId
    : null;

if ($name === '' || $contact === '' || $location === '') {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Please fill in your Name, Contact, and Location before sending the order request.',
    ]);
    exit;
}

if (count($items) === 0) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Your cart is empty. Please select at least one item before sending an order request.',
    ]);
    exit;
}

$orderRef = 'ORD-SESCO-' . date('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));
$config   = require __DIR__ . '/config.php';

try {
    $pdo       = Database::connect($config['db']);
    $orderRepo = new OrderRepository($pdo);

    $result = $orderRepo->createOrderRequest(
        orderReference: $orderRef,
        clientId: $clientId,
        name: $name,
        contact: $contact,
        email: $email,
        location: $location,
        cartItems: $items
    );

    echo json_encode([
        'success'               => true,
        'saved_to_orders_table' => true,
        'db_connected'          => true,
        'table'                 => 'orders',
        'order_id'              => $result['order_id'],
        'order_ids'             => $result['order_ids'],
        'order_reference'       => $result['order_reference'],
        'client_id'             => $result['client_id'], // null when client has not logged in
        'name'                  => $name,
        'contact'               => $contact,
        'email'                 => $email,
        'location'              => $location,
        'items'                 => $result['items'],
        'total_qty'             => $result['total_qty'],
        'total_amount'          => $result['total_amount'],
        'currency'              => 'UGX',
        'inserted_rows'         => $result['inserted_rows'],
        'timestamp'             => date('Y-m-d H:i:s'),
        'php_version'           => PHP_VERSION,
        'message'               => sprintf(
            'Order request %s (1 record saved in treads.orders with %d item(s) in items array) has been submitted.',
            $result['order_reference'],
            count($result['items'])
        ),
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    // Fallback response if MySQL server is offline so the UI still provides feedback + error detail
    $totalAmount = 0.0;
    $totalQty    = 0;
    $lineItems   = [];

    foreach ($items as $entry) {
        $qty   = max(1, (int) ($entry['qty'] ?? 1));
        $price = max(0.0, (float) ($entry['price'] ?? 0));
        $sub   = $qty * $price;

        $totalQty    += $qty;
        $totalAmount += $sub;

        $lineItems[] = [
            'item_id'     => (int) ($entry['item_id'] ?? 0),
            'name'        => (string) ($entry['name'] ?? 'Tyre Item'),
            'quantity'    => $qty,
            'unit_price'  => $price,
            'total_price' => $sub,
            'client_id'   => $clientId,
        ];
    }

    echo json_encode([
        'success'               => true,
        'saved_to_orders_table' => false,
        'db_connected'          => false,
        'db_error'              => $e->getMessage(),
        'table'                 => 'orders',
        'order_reference'       => $orderRef,
        'order_ids'             => [],
        'client_id'             => $clientId,
        'name'                  => $name,
        'contact'               => $contact,
        'email'                 => $email,
        'location'              => $location,
        'total_qty'             => $totalQty,
        'total_amount'          => $totalAmount,
        'currency'              => 'UGX',
        'inserted_rows'         => $lineItems,
        'timestamp'             => date('Y-m-d H:i:s'),
        'php_version'           => PHP_VERSION,
        'message'               => sprintf(
            'Order request %s prepared (MySQL connection notice: %s).',
            $orderRef,
            $e->getMessage()
        ),
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
