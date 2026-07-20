<?php
namespace App\Middleware;

use App\Config\Database;
use App\Config\Env;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

/**
 * Authentication & Authorization Middleware
 * 
 * Direct port of backend/middleware/auth.js
 * Uses firebase/php-jwt for token verification.
 */
class Auth
{
    private static ?array $currentUser = null;

    public static function getCurrentUser(): ?array
    {
        return self::$currentUser ?? ($GLOBALS['user'] ?? null);
    }

    public static function setCurrentUser(?array $user): void
    {
        self::$currentUser = $user;
        $GLOBALS['user'] = $user;
    }

    /**
     * Authenticate the user via JWT cookie.
     */
    public static function authenticateUser(): bool
    {
        $token = $_COOKIE['token'] ?? null;

        if (!$token) {
            \App\Utils\ApiResponse::unauthorized('Authentication required. Access denied.');
            return false;
        }

        try {
            Env::load();
            $jwtSecret = Env::get('JWT_SECRET', 'supersecretjwtkey12345!');

            $decoded = JWT::decode($token, new Key($jwtSecret, 'HS256'));

            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT id, name, email, role, branch, is_active, backup_email, mfa_enabled, mfa_secret, backup_codes, google_id, google_email, is_online, last_active FROM users WHERE id = ? AND is_deleted = 0');
            $stmt->execute([$decoded->id]);
            $user = $stmt->fetch();

            if (!$user || !$user['is_active']) {
                \App\Utils\ApiResponse::unauthorized('User account is inactive or deleted.');
                return false;
            }

            // Normalize field names to camelCase for compatibility with frontend
            $normalizedUser = [
                '_id'          => $user['id'],
                'id'           => $user['id'],
                'name'         => $user['name'],
                'email'        => $user['email'],
                'role'         => $user['role'],
                'branch'       => $user['branch'] ?: 'Branch A',
                'isActive'     => (bool)$user['is_active'],
                'backupEmail'  => $user['backup_email'],
                'mfaEnabled'   => (bool)$user['mfa_enabled'],
                'mfaSecret'    => $user['mfa_secret'],
                'backupCodes'  => $user['backup_codes'] ? json_decode($user['backup_codes'], true) : [],
                'googleId'     => $user['google_id'],
                'googleEmail'  => $user['google_email'],
                'isOnline'     => (bool)$user['is_online'],
                'lastActive'   => $user['last_active'],
            ];

            self::setCurrentUser($normalizedUser);

            return true;
        } catch (ExpiredException $e) {
            \App\Utils\ApiResponse::unauthorized('Invalid or expired authentication token.');
            return false;
        } catch (\Exception $e) {
            \App\Utils\ApiResponse::unauthorized('Invalid or expired authentication token.');
            return false;
        }
    }

    /**
     * Check if the authenticated user has one of the allowed roles.
     * Must be called after authenticateUser().
     */
    public static function requireRole(array $allowedRoles): bool
    {
        $user = self::getCurrentUser();

        if (!$user) {
            \App\Utils\ApiResponse::unauthorized('Authentication required.');
            return false;
        }

        if (!in_array($user['role'], $allowedRoles, true)) {
            \App\Utils\ApiResponse::forbidden('Access forbidden. Insufficient permissions.');
            return false;
        }

        return true;
    }

    /**
     * Generate a JWT token and set it as an HTTP-only cookie
     */
    public static function generateToken(int $userId, string $role): void
    {
        Env::load();
        $jwtSecret = Env::get('JWT_SECRET', 'supersecretjwtkey12345!');
        $appEnv    = Env::get('APP_ENV', 'development');

        $payload = [
            'id'   => $userId,
            'role' => $role,
            'iat'  => time(),
            'exp'  => time() + (24 * 60 * 60) // 1 day
        ];

        $token = JWT::encode($payload, $jwtSecret, 'HS256');

        $secure   = ($appEnv === 'production');
        $httpOnly = true;
        $sameSite = 'Strict';
        $maxAge   = 24 * 60 * 60; // 1 day in seconds
        $path     = '/';

        // Set cookie with SameSite (requires header approach for full compatibility)
        $cookieString = "token={$token}; Path={$path}; Max-Age={$maxAge}; HttpOnly; SameSite={$sameSite}";
        if ($secure) {
            $cookieString .= '; Secure';
        }
        header("Set-Cookie: {$cookieString}", false);
    }

    /**
     * Clear the JWT token cookie (logout)
     */
    public static function clearToken(): void
    {
        $appEnv = Env::get('APP_ENV', 'development');
        $secure = ($appEnv === 'production');

        $cookieString = "token=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
        if ($secure) {
            $cookieString .= '; Secure';
        }
        header("Set-Cookie: {$cookieString}", false);
    }
}
