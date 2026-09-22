<?php
namespace App\Controllers;

use App\Repositories\UserRepository;
use App\Utils\ApiResponse;
use App\Utils\EmailUtils;
use App\Utils\SecurityUtils;

/**
 * Password Recovery & Reset Controller
 *
 * Self-service recovery via a 6-digit one-time code sent to the account email.
 * - The code is never returned by the API; it is only delivered by email.
 * - Only a keyed hash of the code is stored, bound to the account email.
 * - Codes expire after 15 minutes, work once, and lock after 5 wrong guesses.
 * - Responses never reveal whether an email address is registered.
 */
class PasswordResetController
{
    private const CODE_TTL_SECONDS        = 900; // 15 minutes
    private const RESEND_COOLDOWN_SECONDS = 60;
    private const MAX_ATTEMPTS            = 5;

    private const GENERIC_REQUEST_MESSAGE = 'If an account exists for that email, a 6-digit reset code has been sent.';
    private const INVALID_CODE_MESSAGE    = 'Invalid or expired reset code.';

    /**
     * POST /api/auth/forgot-password
     */
    public static function forgotPassword(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $email = strtolower(trim($input['email'] ?? ''));

            if ($email === '') {
                ApiResponse::badRequest('Email address is required.');
                return;
            }

            $userRepo = new UserRepository();
            $user     = $userRepo->findByEmail($email);

            if ($user && (int)$user['is_active'] === 1 && !self::isWithinResendCooldown($user)) {
                $code      = SecurityUtils::generateNumericCode(6);
                $expiresAt = date('Y-m-d H:i:s', time() + self::CODE_TTL_SECONDS);

                $userRepo->saveResetCodeHash(
                    (int)$user['id'],
                    SecurityUtils::hashOneTimeCode($user['email'], $code),
                    $expiresAt
                );

                EmailUtils::sendPasswordResetEmail($user['email'], $user['name'], $code);
            }

            // Identical response for known, unknown, inactive and rate-limited accounts.
            ApiResponse::json(['message' => self::GENERIC_REQUEST_MESSAGE]);
        } catch (\Throwable $e) {
            error_log('[forgot-password] ' . $e->getMessage());
            ApiResponse::serverError('Unable to process the password reset request right now.');
        }
    }

    /**
     * POST /api/auth/reset-password
     */
    public static function resetPassword(): void
    {
        try {
            $input    = json_decode(file_get_contents('php://input'), true) ?? [];
            $email    = strtolower(trim($input['email'] ?? ''));
            $code     = trim((string)($input['otp'] ?? $input['code'] ?? ''));
            $password = (string)($input['newPassword'] ?? '');

            if ($email === '' || $code === '' || $password === '') {
                ApiResponse::badRequest('Email, reset code and new password are required.');
                return;
            }

            $policyError = SecurityUtils::validatePasswordStrength($password, $email);
            if ($policyError !== null) {
                ApiResponse::badRequest($policyError);
                return;
            }

            $userRepo = new UserRepository();
            $user     = $userRepo->findByEmail($email);

            if (
                !$user
                || (int)$user['is_active'] !== 1
                || empty($user['reset_otp'])
                || empty($user['reset_token_expires_at'])
                || strtotime($user['reset_token_expires_at']) < time()
                || (int)$user['reset_attempts'] >= self::MAX_ATTEMPTS
            ) {
                ApiResponse::badRequest(self::INVALID_CODE_MESSAGE);
                return;
            }

            $expected = SecurityUtils::hashOneTimeCode($user['email'], $code);
            if (!hash_equals($user['reset_otp'], $expected)) {
                $userRepo->incrementResetAttempts((int)$user['id']);
                if ((int)$user['reset_attempts'] + 1 >= self::MAX_ATTEMPTS) {
                    // Too many wrong guesses: burn the code so a new one must be requested.
                    $userRepo->clearResetCode((int)$user['id']);
                }
                ApiResponse::badRequest(self::INVALID_CODE_MESSAGE);
                return;
            }

            $hashed = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
            $userRepo->updatePasswordAndClearResetCode((int)$user['id'], $hashed);

            EmailUtils::sendPasswordChangedNotice($user['email'], $user['name']);

            ApiResponse::json(['message' => 'Your password has been reset successfully. You may now sign in with your new password.']);
        } catch (\Throwable $e) {
            error_log('[reset-password] ' . $e->getMessage());
            ApiResponse::serverError('Unable to reset the password right now.');
        }
    }

    /**
     * A code was issued less than RESEND_COOLDOWN_SECONDS ago (issue time = expiry - TTL).
     */
    private static function isWithinResendCooldown(array $user): bool
    {
        if (empty($user['reset_otp']) || empty($user['reset_token_expires_at'])) {
            return false;
        }
        $issuedAt = strtotime($user['reset_token_expires_at']) - self::CODE_TTL_SECONDS;
        return $issuedAt > (time() - self::RESEND_COOLDOWN_SECONDS);
    }
}
