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
}
