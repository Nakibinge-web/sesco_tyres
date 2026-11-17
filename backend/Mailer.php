<?php
declare(strict_types=1);

namespace Sesco\Backend;

use RuntimeException;
use Throwable;

/**
 * Lightweight zero-dependency email sender for Sesco Tyres storefront.
 * Supports authenticated SMTP (TLS/SSL), native PHP mail(), and local dev outbox spooling on localhost.
 */
final class Mailer
{
    private array $config;

    public function __construct(array $overrideConfig = [])
    {
        $baseConfig = [];
        $mailConfigPath = __DIR__ . '/mail_config.php';
        if (is_file($mailConfigPath)) {
            $loaded = require $mailConfigPath;
            if (is_array($loaded)) {
                $baseConfig = $loaded;
            }
        }

        $appConfigPath = __DIR__ . '/config.php';
        if (is_file($appConfigPath)) {
            $appCfg = require $appConfigPath;
            if (is_array($appCfg) && isset($appCfg['mail']) && is_array($appCfg['mail'])) {
                $baseConfig = array_merge($baseConfig, $appCfg['mail']);
            }
        }

        $this->config = array_merge($baseConfig, $overrideConfig);
    }

    /**
     * Send a password reset verification code to the target client email.
     *
     * @return array{delivered:bool,transport:string,outbox_file:?string,error:?string}
     */
    public function sendPasswordResetCode(
        string $toEmail,
        string $clientName,
        string $code,
        int $expiresMinutes
    ): array {
        $toEmail = $this->sanitizeHeaderValue($toEmail);
        $clientName = trim($this->sanitizeHeaderValue($clientName)) ?: 'Valued Client';
        $fromEmail = $this->sanitizeHeaderValue((string) ($this->config['from_email'] ?? 'no-reply@sescotyres.com'));
        $fromName = $this->sanitizeHeaderValue((string) ($this->config['from_name'] ?? 'Sesco Tyres Client Portal'));
        $subject = 'Sesco Tyres - Password Reset Verification Code';

        $plainBody = $this->buildResetPlainBody($clientName, $toEmail, $code, $expiresMinutes);
        $htmlBody = $this->buildResetHtmlBody($clientName, $toEmail, $code, $expiresMinutes);
        $boundary = 'sesco_' . bin2hex(random_bytes(12));

        $mimeHeaders = [
            'From'         => sprintf('"%s" <%s>', str_replace('"', '', $fromName), $fromEmail),
            'To'           => sprintf('<%s>', $toEmail),
            'Subject'      => $subject,
            'Date'         => gmdate('D, d M Y H:i:s') . ' +0000',
            'Message-ID'   => sprintf('<%s@sescotyres.local>', bin2hex(random_bytes(12))),
            'MIME-Version' => '1.0',
            'Content-Type' => sprintf('multipart/alternative; boundary="%s"', $boundary),
        ];

        $mimeBody = $this->buildMultipartBody($boundary, $plainBody, $htmlBody);

        // 1. Real authenticated SMTP when host is configured
        $smtpHost = trim((string) ($this->config['smtp_host'] ?? ''));
        if ($smtpHost !== '') {
            try {
                $this->sendViaSmtp($fromEmail, $toEmail, $mimeHeaders, $mimeBody);
                return [
                    'delivered'   => true,
                    'transport'   => 'smtp',
                    'outbox_file' => null,
                    'error'       => null,
                ];
            } catch (Throwable $e) {
                return [
                    'delivered'   => false,
                    'transport'   => 'smtp',
                    'outbox_file' => null,
                    'error'       => $e->getMessage(),
                ];
            }
        }

        // 2. Native PHP mail() only if an active local MTA / sendmail binary is reachable
        if ($this->canUsePhpMail()) {
            $sent = $this->sendViaPhpMail($toEmail, $subject, $mimeBody, $mimeHeaders);
            if ($sent) {
                return [
                    'delivered'   => true,
                    'transport'   => 'php_mail',
                    'outbox_file' => null,
                    'error'       => null,
                ];
            }
        }

        // 3. Loopback dev fallback (XAMPP localhost without SMTP configured)
        if ($this->isLoopbackEnvironment() && !empty($this->config['allow_local_outbox'])) {
            $outboxFile = $this->spoolToLocalOutbox($toEmail, $mimeHeaders, $mimeBody);
            return [
                'delivered'   => true,
                'transport'   => 'local_outbox',
                'outbox_file' => $outboxFile,
                'error'       => null,
            ];
        }

        return [
            'delivered'   => false,
            'transport'   => 'none',
            'outbox_file' => null,
            'error'       => 'Email delivery is not configured on this server. Configure SMTP credentials in backend/mail_config.php.',
        ];
    }

    private function buildResetPlainBody(string $clientName, string $email, string $code, int $expiresMinutes): string
    {
        return implode("\r\n", [
            "Hello {$clientName},",
            '',
            "We received a request to reset the password for your Sesco Tyres account ({$email}).",
            '',
            "Your 6-digit password reset verification code is: {$code}",
            '',
            "This code expires in {$expiresMinutes} minutes and only works for this account ({$email}).",
            'If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.',
            '',
            'Sesco Tyres Client Portal',
        ]);
    }

    private function buildResetHtmlBody(string $clientName, string $email, string $code, int $expiresMinutes): string
    {
        $safeName = htmlspecialchars($clientName, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $safeEmail = htmlspecialchars($email, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $safeCode = htmlspecialchars($code, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Sesco Tyres Password Reset</title></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;padding:28px;">
    <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#163687;margin-bottom:10px;">
      Sesco Tyres Client Portal
    </div>
    <h1 style="margin:0 0 12px;font-size:22px;color:#0f172a;">Password Reset Verification Code</h1>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#334155;">
      Hello {$safeName},
    </p>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#334155;">
      Enter the verification code below on the Sesco Tyres Sign In page to confirm ownership of <strong>{$safeEmail}</strong> and choose a new password:
    </p>
    <div style="margin:0 0 18px;padding:16px 20px;background:#f1f5f9;border-left:4px solid #163687;text-align:center;">
      <div style="font-size:32px;font-weight:800;letter-spacing:0.28em;color:#0f172a;font-family:Consolas,monospace;">
        {$safeCode}
      </div>
    </div>
    <p style="margin:0 0 10px;font-size:13px;line-height:1.5;color:#475569;">
      This verification code expires in <strong>{$expiresMinutes} minutes</strong> and is strictly bound to <strong>{$safeEmail}</strong>.
    </p>
    <p style="margin:0;font-size:13px;line-height:1.5;color:#64748b;">
      If you did not request a password reset, you can safely ignore this message.
    </p>
  </div>
</body>
</html>
HTML;
    }

    private function buildMultipartBody(string $boundary, string $plainBody, string $htmlBody): string
    {
        return implode("\r\n", [
            "--{$boundary}",
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
            '',
            $plainBody,
            '',
            "--{$boundary}",
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
            '',
            $htmlBody,
            '',
            "--{$boundary}--",
            '',
        ]);
    }

    private function sendViaSmtp(string $fromEmail, string $toEmail, array $headers, string $body): void
    {
        $host = trim((string) $this->config['smtp_host']);
        $port = (int) ($this->config['smtp_port'] ?: 587);
        $encryption = strtolower(trim((string) ($this->config['smtp_encryption'] ?? 'tls')));
        $user = (string) ($this->config['smtp_user'] ?? '');
        $pass = (string) ($this->config['smtp_pass'] ?? '');

        $remote = ($encryption === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;
        $ctx = stream_context_create([
            'ssl' => [
                'verify_peer'      => true,
                'verify_peer_name' => true,
            ],
        ]);

        $socket = @stream_socket_client($remote, $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $ctx);
        if (!$socket) {
            throw new RuntimeException("SMTP connection failed ({$errno}): {$errstr}");
        }

        stream_set_timeout($socket, 10);

        try {
            $this->expectSmtpCode($socket, 220);
            $ehloHost = preg_replace('/[^a-zA-Z0-9.-]/', '', (string) ($_SERVER['HTTP_HOST'] ?? 'localhost')) ?: 'localhost';
            $this->writeSmtpLine($socket, "EHLO {$ehloHost}");
            $this->expectSmtpCode($socket, 250);

            if ($encryption === 'tls') {
                $this->writeSmtpLine($socket, 'STARTTLS');
                $this->expectSmtpCode($socket, 220);
                if (!@stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    throw new RuntimeException('Failed to negotiate STARTTLS encryption.');
                }
                $this->writeSmtpLine($socket, "EHLO {$ehloHost}");
                $this->expectSmtpCode($socket, 250);
            }

            if ($user !== '') {
                $this->writeSmtpLine($socket, 'AUTH LOGIN');
                $this->expectSmtpCode($socket, 334);
                $this->writeSmtpLine($socket, base64_encode($user));
                $this->expectSmtpCode($socket, 334);
                $this->writeSmtpLine($socket, base64_encode($pass));
                $this->expectSmtpCode($socket, 235);
            }

            $this->writeSmtpLine($socket, "MAIL FROM:<{$fromEmail}>");
            $this->expectSmtpCode($socket, 250);
            $this->writeSmtpLine($socket, "RCPT TO:<{$toEmail}>");
            $this->expectSmtpCode($socket, 250);
            $this->writeSmtpLine($socket, 'DATA');
            $this->expectSmtpCode($socket, 354);

            $rawMessage = $this->formatRawMessage($headers, $body);
            // Dot-stuff lines starting with '.' per RFC 5321
            $escaped = preg_replace('/^\./m', '..', $rawMessage);
            fwrite($socket, $escaped . "\r\n.\r\n");
            $this->expectSmtpCode($socket, 250);

            $this->writeSmtpLine($socket, 'QUIT');
            $this->readSmtpResponse($socket);
        } finally {
            fclose($socket);
        }
    }

    private function canUsePhpMail(): bool
    {
        if (!function_exists('mail')) {
            return false;
        }

        $sendmailPath = trim((string) ini_get('sendmail_path'));
        if ($sendmailPath !== '') {
            return true;
        }

        if (PHP_OS_FAMILY === 'Windows') {
            $smtp = trim((string) ini_get('SMTP'));
            $port = (int) (ini_get('smtp_port') ?: 25);
            if ($smtp === '') {
                return false;
            }
            $probe = @fsockopen($smtp, $port, $errno, $errstr, 1.0);
            if ($probe) {
                fclose($probe);
                return true;
            }
            return false;
        }

        return false;
    }

    private function sendViaPhpMail(string $toEmail, string $subject, string $body, array $headers): bool
    {
        $filteredHeaders = [];
        foreach ($headers as $name => $value) {
            if (in_array(strtolower($name), ['to', 'subject'], true)) {
                continue;
            }
            $filteredHeaders[] = "{$name}: {$value}";
        }
        return @mail($toEmail, $subject, $body, implode("\r\n", $filteredHeaders));
    }

    private function spoolToLocalOutbox(string $toEmail, array $headers, string $body): string
    {
        $dir = (string) ($this->config['outbox_dir'] ?? (__DIR__ . '/mail_outbox'));
        if (!is_dir($dir) && !@mkdir($dir, 0750, true) && !is_dir($dir)) {
            throw new RuntimeException('Unable to initialize local mail outbox directory.');
        }

        // Prevent direct HTTP web access to spooled emails
        $htaccessPath = $dir . '/.htaccess';
        if (!is_file($htaccessPath)) {
            @file_put_contents($htaccessPath, "Require all denied\nDeny from all\n");
        }
        $indexPath = $dir . '/index.php';
        if (!is_file($indexPath)) {
            @file_put_contents($indexPath, "<?php http_response_code(403); exit;\n");
        }

        $safeSlug = preg_replace('/[^a-z0-9._-]+/i', '_', $toEmail) ?: 'client';
        $filename = sprintf('%s_%s_%s.eml', gmdate('Ymd_His'), substr($safeSlug, 0, 40), bin2hex(random_bytes(4)));
        $fullPath = $dir . '/' . $filename;

        if (@file_put_contents($fullPath, $this->formatRawMessage($headers, $body), LOCK_EX) === false) {
            throw new RuntimeException('Failed writing verification email to local outbox.');
        }

        return $filename;
    }

    private function formatRawMessage(array $headers, string $body): string
    {
        $lines = [];
        foreach ($headers as $name => $value) {
            $lines[] = "{$name}: {$value}";
        }
        return implode("\r\n", $lines) . "\r\n\r\n" . $body;
    }

    private function writeSmtpLine($socket, string $line): void
    {
        if (fwrite($socket, $line . "\r\n") === false) {
            throw new RuntimeException('Failed writing to SMTP socket.');
        }
    }

    private function expectSmtpCode($socket, int $expectedCode): void
    {
        [$code, $response] = $this->readSmtpResponse($socket);
        if ($code !== $expectedCode) {
            throw new RuntimeException("Unexpected SMTP response ({$code}): " . trim($response));
        }
    }

    /**
     * @return array{0:int,1:string}
     */
    private function readSmtpResponse($socket): array
    {
        $full = '';
        $code = 0;
        while (($line = fgets($socket, 2048)) !== false) {
            $full .= $line;
            if (preg_match('/^(\d{3})([ -])/', $line, $m)) {
                $code = (int) $m[1];
                if ($m[2] === ' ') {
                    break;
                }
            } else {
                break;
            }
        }
        return [$code, $full];
    }

    private function isLoopbackEnvironment(): bool
    {
        if (PHP_SAPI === 'cli' || PHP_SAPI === 'phpdbg') {
            return true;
        }
        $remoteAddr = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
        $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
        $hostNoPort = preg_replace('/:\d+$/', '', $host);

        $isLoopbackIp = in_array($remoteAddr, ['127.0.0.1', '::1'], true);
        $isLocalHost = in_array($hostNoPort, ['localhost', '127.0.0.1', '[::1]'], true);

        return $isLoopbackIp && $isLocalHost;
    }

    private function sanitizeHeaderValue(string $value): string
    {
        return trim(str_replace(["\r", "\n", "\0"], '', $value));
    }
}
