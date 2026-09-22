<?php
namespace App\Utils;

/**
 * Security Utilities for TOTP/MFA
 * 
 * Direct port of backend/config/securityUtils.js
 * Handles Base32 encoding/decoding, TOTP verification, and backup code generation.
 */
class SecurityUtils
{
    private const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    /**
     * Decode a Base32-encoded string to raw bytes
     */
    private static function base32Decode(string $base32): string
    {
        $base32 = strtoupper(rtrim($base32, '='));
        $binary = '';

        for ($i = 0; $i < strlen($base32); $i++) {
            $char = $base32[$i];
            $val  = strpos(self::BASE32_ALPHABET, $char);
            if ($val === false) continue;
            $binary .= str_pad(decbin($val), 5, '0', STR_PAD_LEFT);
        }

        $bytes = '';
        for ($i = 0; $i + 8 <= strlen($binary); $i += 8) {
            $bytes .= chr(bindec(substr($binary, $i, 8)));
        }

        return $bytes;
    }

    /**
     * Generate a random Base32 secret for Google Authenticator (16 characters)
     */
    public static function generateBase32Secret(int $length = 16): string
    {
        $secret = '';
        $randomBytes = random_bytes($length);

        for ($i = 0; $i < $length; $i++) {
            $secret .= self::BASE32_ALPHABET[ord($randomBytes[$i]) % strlen(self::BASE32_ALPHABET)];
        }

        return $secret;
    }

    /**
     * Verify a 6-digit TOTP token against a Base32 secret
     * Supports clock skew of ±30 seconds (current, -1, +1 time steps)
     */
    public static function verifyTOTP(string $secret, string $userToken): bool
    {
        if (empty($secret) || empty($userToken)) return false;

        $cleanToken = trim($userToken);
        $timeSteps  = [0, -1, 1]; // Allow clock skew

        foreach ($timeSteps as $step) {
            $counter = intval(floor(time() / 30)) + $step;

            // Write 64-bit counter to binary string (big-endian)
            $counterBytes = pack('N*', 0, $counter);

            // HMAC-SHA1
            $key      = self::base32Decode($secret);
            $hmacHash = hash_hmac('sha1', $counterBytes, $key, true);

            // Dynamic truncation
            $offset = ord($hmacHash[strlen($hmacHash) - 1]) & 0x0F;
            $binary = ((ord($hmacHash[$offset]) & 0x7F) << 24)
                     | ((ord($hmacHash[$offset + 1]) & 0xFF) << 16)
                     | ((ord($hmacHash[$offset + 2]) & 0xFF) << 8)
                     | (ord($hmacHash[$offset + 3]) & 0xFF);

            $otp = str_pad((string)($binary % 1000000), 6, '0', STR_PAD_LEFT);

            if ($otp === $cleanToken) return true;
        }

        return false;
    }

    /**
     * Generate a set of random hex-alphanumeric backup codes (8 characters each)
     */
    public static function generateBackupCodes(int $count = 8): array
    {
        $codes = [];
        $chars = '0123456789ABCDEF';

        for ($c = 0; $c < $count; $c++) {
            $code  = '';
            $bytes = random_bytes(8);
            for ($i = 0; $i < 8; $i++) {
                $code .= $chars[ord($bytes[$i]) % strlen($chars)];
            }
            $codes[] = $code;
        }

        return $codes;
    }

    /**
     * Cryptographically secure numeric one-time code (e.g. 6-digit reset code)
     */
    public static function generateNumericCode(int $digits = 6): string
    {
        return str_pad((string)random_int(0, (10 ** $digits) - 1), $digits, '0', STR_PAD_LEFT);
    }

    /**
     * Keyed hash of a one-time code, bound to the account email.
     * Only this hash is stored, so a database leak does not expose live codes.
     */
    public static function hashOneTimeCode(string $email, string $code): string
    {
        $secret = \App\Config\Env::get('JWT_SECRET', '');
        if ($secret === '') {
            throw new \RuntimeException('JWT_SECRET must be configured to issue one-time codes.');
        }
        return hash_hmac('sha256', strtolower($email) . '|' . trim($code), $secret);
    }

    /**
     * Password policy check. Returns an error message, or null when acceptable.
     */
    public static function validatePasswordStrength(string $password, string $email = ''): ?string
    {
        if (strlen($password) < 10) {
            return 'Password must be at least 10 characters long.';
        }
        if (strlen($password) > 128) {
            return 'Password must be 128 characters or fewer.';
        }
        if (!preg_match('/[A-Za-z]/', $password) || !preg_match('/\d/', $password)) {
            return 'Password must contain at least one letter and one number.';
        }

        $lower = strtolower($password);
        $localPart = strtolower(explode('@', $email)[0] ?? '');
        if (strlen($localPart) >= 3 && str_contains($lower, $localPart)) {
            return 'Password must not contain your email name.';
        }

        $common = ['password123', 'password1234', '1234567890', 'qwerty12345', 'hontech1234', 'admin12345', 'letmein1234'];
        if (in_array($lower, $common, true)) {
            return 'That password is too common. Please choose a stronger one.';
        }

        return null;
    }
}
