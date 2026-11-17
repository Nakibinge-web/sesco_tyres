<?php
declare(strict_types=1);

/**
 * Mail configuration for Sesco Tyres storefront (forgot-password emails, etc.).
 *
 * Configure real SMTP credentials either via environment variables:
 *   SESCO_SMTP_HOST, SESCO_SMTP_PORT, SESCO_SMTP_USER, SESCO_SMTP_PASS,
 *   SESCO_SMTP_ENCRYPTION ('tls' | 'ssl' | ''), SESCO_MAIL_FROM, SESCO_MAIL_FROM_NAME
 * or by setting the values directly below for production deployments.
 */
return [
    'smtp_host'       => getenv('SESCO_SMTP_HOST') ?: (getenv('SMTP_HOST') ?: ''),
    'smtp_port'       => (int) (getenv('SESCO_SMTP_PORT') ?: (getenv('SMTP_PORT') ?: 587)),
    'smtp_user'       => getenv('SESCO_SMTP_USER') ?: (getenv('SMTP_USER') ?: ''),
    'smtp_pass'       => getenv('SESCO_SMTP_PASS') ?: (getenv('SMTP_PASS') ?: ''),
    'smtp_encryption' => getenv('SESCO_SMTP_ENCRYPTION') ?: (getenv('SMTP_ENCRYPTION') ?: 'tls'),
    'from_email'      => getenv('SESCO_MAIL_FROM') ?: (getenv('MAIL_FROM_ADDRESS') ?: 'no-reply@sescotyres.com'),
    'from_name'       => getenv('SESCO_MAIL_FROM_NAME') ?: (getenv('MAIL_FROM_NAME') ?: 'Sesco Tyres Client Portal'),
    // Only used on loopback dev hosts (localhost / 127.0.0.1) when no SMTP or working local MTA is configured.
    'allow_local_outbox' => true,
    'outbox_dir'         => __DIR__ . '/mail_outbox',
];
