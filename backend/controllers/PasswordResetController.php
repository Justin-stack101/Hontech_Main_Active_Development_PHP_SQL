<?php
namespace App\Controllers;

use App\Repositories\UserRepository;
use App\Utils\ApiResponse;
use App\Utils\EmailUtils;
use App\Utils\SecurityUtils;

/**
 * Password Recovery & Reset Controller
 * 
 * Handles password recovery requests, verification tokens, and password updates.
 */
class PasswordResetController
{
    /**
     * POST /api/auth/forgot-password
     */
    public static function forgotPassword(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $email = trim($input['email'] ?? '');

            if (empty($email)) {
                ApiResponse::badRequest('Email address is required.');
                return;
            }

            $userRepo = new UserRepository();
            $user = $userRepo->findByEmail($email);

            if (!$user) {
                // Return generic success to prevent email enumeration attacks
                ApiResponse::json(['message' => 'If an account exists with that email, a password reset link has been sent.']);
                return;
            }

            $token = SecurityUtils::generateToken(32);
            $otp = sprintf('%06d', mt_rand(0, 999999));
            $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour validity

            $userRepo->savePasswordResetToken($user['id'], $token, $otp, $expiresAt);

            // Dispatch simulated email
            EmailUtils::sendPasswordResetEmail($user['email'], $user['name'], $token, $otp);

            ApiResponse::json(['message' => 'Password reset instructions have been sent to your email.']);
        } catch (\Exception $e) {
            ApiResponse::serverError('Error processing forgot password request.', $e->getMessage());
        }
    }

    /**
     * POST /api/auth/reset-password
     */
    public static function resetPassword(): void
    {
        try {
            $input    = json_decode(file_get_contents('php://input'), true) ?? [];
            $token    = trim($input['token'] ?? '');
            $otp      = trim($input['otp'] ?? '');
            $password = $input['password'] ?? '';

            if (empty($password)) {
                ApiResponse::badRequest('New password is required.');
                return;
            }

            $userRepo = new UserRepository();
            $user = null;

            if (!empty($token)) {
                $user = $userRepo->findByResetToken($token);
            } elseif (!empty($otp)) {
                $user = $userRepo->findByResetOtp($otp);
            }

            if (!$user) {
                ApiResponse::badRequest('Invalid or expired password reset request.');
                return;
            }

            // Check expiration
            if (strtotime($user['reset_token_expires_at']) < time()) {
                ApiResponse::badRequest('Password reset token has expired. Please request a new one.');
                return;
            }

            $hashed = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
            $userRepo->updatePasswordAndClearResetTokens($user['id'], $hashed);

            ApiResponse::json(['message' => 'Your password has been reset successfully. You may now log in with your new password.']);
        } catch (\Exception $e) {
            ApiResponse::serverError('Error resetting password.', $e->getMessage());
        }
    }
}
