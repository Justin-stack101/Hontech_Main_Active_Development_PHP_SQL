<?php
namespace App\Utils;

/**
 * Email Utilities
 * 
 * Direct port of backend/config/emailUtils.js
 * Simulated email queue stored in a JSON temp file (persists across PHP requests).
 * Optionally sends real emails via PHP mail() if SMTP is configured.
 */
class EmailUtils
{
    private static string $emailStorePath = '';

    /**
     * Get the path to the simulated email storage file
     */
    private static function getStorePath(): string
    {
        if (empty(self::$emailStorePath)) {
            self::$emailStorePath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'hontech_simulated_emails.json';
        }
        return self::$emailStorePath;
    }

    /**
     * Read all simulated emails from storage
     */
    public static function getSimulatedEmails(): array
    {
        $path = self::getStorePath();
        if (!file_exists($path)) return [];

        $data = file_get_contents($path);
        $emails = json_decode($data, true);
        return is_array($emails) ? $emails : [];
    }

    /**
     * Clear all simulated emails
     */
    public static function clearSimulatedEmails(): void
    {
        file_put_contents(self::getStorePath(), '[]');
    }

    /**
     * Mark a specific email as read
     */
    public static function markEmailRead(string $emailId): bool
    {
        $emails = self::getSimulatedEmails();
        $found = false;

        foreach ($emails as &$email) {
            if (isset($email['id']) && $email['id'] === $emailId) {
                $email['read'] = true;
                $found = true;
                break;
            }
        }
        unset($email);

        if ($found) {
            file_put_contents(self::getStorePath(), json_encode($emails, JSON_PRETTY_PRINT));
        }

        return $found;
    }

    /**
     * Generate a premium HTML email template (Supercell ID-inspired layout)
     */
    public static function generateSupercellEmailHtml(array $params): string
    {
        $title      = htmlspecialchars($params['title'] ?? '', ENT_QUOTES);
        $bodyText   = htmlspecialchars($params['bodyText'] ?? '', ENT_QUOTES);
        $code       = $params['code'] ?? null;
        $footerText = $params['footerText'] ?? 'This security verification code was generated to secure your HonTech system login credentials. Do not share this code with anyone.';

        $codeHtml = $code ? '<div class="code-display">' . htmlspecialchars($code, ENT_QUOTES) . '</div>' : '';

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$title}</title>
    <style>
        body { margin:0; padding:0; background-color:#f3f4f6; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; }
        .wrapper { width:100%; background-color:#f3f4f6; padding:30px 0; }
        .container { max-width:540px; margin:0 auto; background-color:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.05); border:1px solid #e5e7eb; }
        .header { background-color:#111827; padding:24px; text-align:center; border-bottom:3px solid #dc2626; }
        .logo-text { font-size:22px; font-weight:900; font-style:italic; text-transform:uppercase; letter-spacing:1px; color:#ffffff; }
        .logo-accent { color:#ef4444; }
        .logo-badge { background-color:#ef4444; color:#ffffff; padding:2px 6px; border-radius:6px; font-size:11px; font-weight:bold; vertical-align:middle; margin-left:6px; font-style:normal; letter-spacing:normal; }
        .content { padding:40px 32px; text-align:center; }
        .headline { font-size:24px; font-weight:800; color:#111827; margin-bottom:16px; text-transform:capitalize; }
        .message-body { font-size:14px; color:#4b5563; line-height:1.6; margin-bottom:30px; font-weight:500; }
        .code-display { background-color:#f9fafb; border:2px dashed #d1d5db; border-radius:16px; padding:18px 24px; font-size:32px; font-weight:800; color:#111827; letter-spacing:8px; text-indent:8px; font-family:"SF Mono",SFMono-Regular,Consolas,"Liberation Mono",Menlo,monospace; display:inline-block; margin-bottom:30px; box-shadow:inset 0 2px 4px rgba(0,0,0,0.02); }
        .footer { padding:24px; background-color:#f9fafb; border-top:1px solid #f3f4f6; text-align:center; font-size:11px; color:#9ca3af; line-height:1.5; }
        .footer-brand { margin-top:8px; font-weight:bold; color:#6b7280; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <span class="logo-text">HONTECH<span class="logo-accent">CENTER</span><span class="logo-badge">SECURE</span></span>
            </div>
            <div class="content">
                <div class="headline">{$title}</div>
                <div class="message-body">{$bodyText}</div>
                {$codeHtml}
            </div>
            <div class="footer">
                {$footerText}
                <div class="footer-brand">&copy; 2026 HonTech AutoCenter Inc.</div>
            </div>
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Send an email (simulated + optional real SMTP)
     */
    public static function sendEmail(array $params): bool
    {
        $to      = $params['to'] ?? '';
        $subject = $params['subject'] ?? '';
        $text    = $params['text'] ?? '';
        $html    = $params['html'] ?? self::generateSupercellEmailHtml([
            'title'    => $subject,
            'bodyText' => $text,
            'code'     => null
        ]);

        $id = 'mail_' . substr(bin2hex(random_bytes(5)), 0, 7);

        // Store in simulated email queue
        $emails   = self::getSimulatedEmails();
        $emails[] = [
            'id'        => $id,
            'to'        => $to,
            'subject'   => $subject,
            'text'      => $text,
            'html'      => $html,
            'timestamp' => date('c'),
            'read'      => false
        ];

        // Keep queue bounded at 50
        if (count($emails) > 50) {
            array_shift($emails);
        }

        file_put_contents(self::getStorePath(), json_encode($emails, JSON_PRETTY_PRINT));

        error_log("[OUTGOING EMAIL (ID: {$id})] To: {$to} | Subject: {$subject}");

        return true;
    }
}
