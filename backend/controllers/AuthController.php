<?php
namespace App\Controllers;

use App\Config\Database;
use App\Config\Env;
use App\Middleware\Auth;
use App\Utils\SecurityUtils;
use App\Utils\EmailUtils;

/**
 * Authentication Controller
 * 
 * Complete port of backend/controllers/authController.js (739 lines → PHP)
 * Handles: login, MFA, logout, profile management, staff CRUD, Google SSO, admin controls
 */
class AuthController
{
    // =============================================
    // CORE AUTHENTICATION
    // =============================================

    /**
     * POST /api/auth/login
     */
    public static function login(): void
    {
        $input    = json_decode(file_get_contents('php://input'), true) ?? [];
        $email    = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(['message' => 'Email and password are required.']);
            return;
        }

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT * FROM users WHERE email = ? AND is_deleted = 0');
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if (!$user || !password_verify($password, $user['password'])) {
                http_response_code(401);
                echo json_encode(['message' => 'Invalid credentials.']);
                return;
            }

            if (!$user['is_active']) {
                http_response_code(403);
                echo json_encode(['message' => 'Account has been deactivated.']);
                return;
            }

            // Check MFA
            if ($user['mfa_enabled']) {
                echo json_encode([
                    'requiresMfa' => true,
                    'userId'      => $user['id'],
                    'email'       => $user['email']
                ]);
                return;
            }

            // Update online status
            $stmt = $db->prepare('UPDATE users SET is_online = 1, last_active = NOW() WHERE id = ?');
            $stmt->execute([$user['id']]);

            Auth::generateToken($user['id'], $user['role']);

            echo json_encode([
                'id'    => $user['id'],
                'name'  => $user['name'],
                'email' => $user['email'],
                'role'  => $user['role']
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Server error during login.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/auth/verify-mfa
     */
    public static function verifyMfa(): void
    {
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $userId  = $input['userId'] ?? null;
        $mfaCode = $input['mfaCode'] ?? '';

        if (!$userId || empty($mfaCode)) {
            http_response_code(400);
            echo json_encode(['message' => 'User ID and MFA code are required.']);
            return;
        }

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT * FROM users WHERE id = ?');
            $stmt->execute([$userId]);
            $user = $stmt->fetch();

            if (!$user || !$user['is_active']) {
                http_response_code(401);
                echo json_encode(['message' => 'User account not found or deactivated.']);
                return;
            }

            $isCodeValid = false;

            // 1. Verify TOTP Code
            if (!empty($user['mfa_secret'])) {
                $isCodeValid = SecurityUtils::verifyTOTP($user['mfa_secret'], $mfaCode);
            }

            // 2. Fallback to Backup Codes
            if (!$isCodeValid && !empty($user['backup_codes'])) {
                $backupCodes = json_decode($user['backup_codes'], true) ?? [];
                $codeUpper   = strtoupper(trim($mfaCode));

                foreach ($backupCodes as $i => $hashedCode) {
                    if (password_verify($codeUpper, $hashedCode)) {
                        $isCodeValid = true;
                        // Consume this single-use backup code
                        array_splice($backupCodes, $i, 1);
                        $stmt = $db->prepare('UPDATE users SET backup_codes = ? WHERE id = ?');
                        $stmt->execute([json_encode($backupCodes), $user['id']]);
                        break;
                    }
                }
            }

            if (!$isCodeValid) {
                http_response_code(401);
                echo json_encode(['message' => 'Invalid MFA verification code.']);
                return;
            }

            // Update online status
            $stmt = $db->prepare('UPDATE users SET is_online = 1, last_active = NOW() WHERE id = ?');
            $stmt->execute([$user['id']]);

            Auth::generateToken($user['id'], $user['role']);

            echo json_encode([
                'id'    => $user['id'],
                'name'  => $user['name'],
                'email' => $user['email'],
                'role'  => $user['role']
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Server error during MFA verification.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/auth/logout
     */
    public static function logout(): void
    {
        try {
            $token = $_COOKIE['token'] ?? null;
            if ($token) {
                try {
                    Env::load();
                    $jwtSecret = Env::get('JWT_SECRET');
                    $decoded   = \Firebase\JWT\JWT::decode($token, new \Firebase\JWT\Key($jwtSecret, 'HS256'));

                    $db   = Database::getConnection();
                    $stmt = $db->prepare('UPDATE users SET is_online = 0 WHERE id = ?');
                    $stmt->execute([$decoded->id]);
                } catch (\Exception $e) {
                    // Ignore — token may be expired
                }
            }

            Auth::clearToken();
            echo json_encode(['message' => 'Successfully logged out.']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Server error during logout.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/auth/ping
     */
    public static function pingActiveSession(): void
    {
        $user = $GLOBALS['user'] ?? null;
        if (!$user) {
            http_response_code(401);
            echo json_encode(['message' => 'Not authenticated.']);
            return;
        }

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('UPDATE users SET is_online = 1, last_active = NOW() WHERE id = ?');
            $stmt->execute([$user['id']]);

            echo json_encode(['success' => true]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Server error during ping.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/auth/me
     */
    public static function getMe(): void
    {
        $user = $GLOBALS['user'];
        echo json_encode([
            'id'           => $user['id'],
            'name'         => $user['name'],
            'email'        => $user['email'],
            'role'         => $user['role'],
            'branch'       => $user['branch'] ?: 'Branch A',
            'backupEmail'  => $user['backupEmail'],
            'mfaEnabled'   => $user['mfaEnabled'],
            'googleLinked' => !empty($user['googleId']),
            'googleEmail'  => $user['googleEmail']
        ]);
    }

    // =============================================
    // STAFF MANAGEMENT (Owner/Admin only)
    // =============================================

    /**
     * GET /api/auth/staff
     */
    public static function getStaff(): void
    {
        try {
            $db   = Database::getConnection();
            $stmt = $db->query('SELECT id, name, email, role, branch, is_active, backup_email, mfa_enabled, google_id, google_email, is_online, last_active, created_at, updated_at FROM users WHERE is_deleted = 0 ORDER BY created_at ASC');
            $staff = $stmt->fetchAll();

            // Normalize field names for frontend compatibility
            $result = array_map(function ($u) {
                return [
                    '_id'         => $u['id'],
                    'id'          => $u['id'],
                    'name'        => $u['name'],
                    'email'       => $u['email'],
                    'role'        => $u['role'],
                    'branch'      => $u['branch'],
                    'isActive'    => (bool)$u['is_active'],
                    'backupEmail' => $u['backup_email'],
                    'mfaEnabled'  => (bool)$u['mfa_enabled'],
                    'googleId'    => $u['google_id'],
                    'googleEmail' => $u['google_email'],
                    'isOnline'    => (bool)$u['is_online'],
                    'lastActive'  => $u['last_active'],
                    'createdAt'   => $u['created_at'],
                    'updatedAt'   => $u['updated_at']
                ];
            }, $staff);

            echo json_encode($result);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error retrieving staff roster.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/auth/staff
     */
    public static function createStaff(): void
    {
        $input    = json_decode(file_get_contents('php://input'), true) ?? [];
        $name     = trim($input['name'] ?? '');
        $email    = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        $role     = $input['role'] ?? '';
        $branch   = $input['branch'] ?? 'Branch A';

        if (empty($name) || empty($email) || empty($password) || empty($role)) {
            http_response_code(400);
            echo json_encode(['message' => 'All fields are required.']);
            return;
        }

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
            $stmt->execute([$email]);

            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['message' => 'Email is already registered.']);
                return;
            }

            $hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);

            $stmt = $db->prepare('INSERT INTO users (name, email, password, role, branch) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([$name, $email, $hashedPassword, $role, $branch]);

            $newId = $db->lastInsertId();

            http_response_code(201);
            echo json_encode([
                'id'     => (int)$newId,
                'name'   => $name,
                'email'  => $email,
                'role'   => $role,
                'branch' => $branch
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error creating staff account.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * DELETE /api/auth/staff/:id
     */
    public static function deleteStaff(string $id): void
    {
        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT id, name, role FROM users WHERE id = ?');
            $stmt->execute([$id]);
            $user = $stmt->fetch();

            if (!$user) {
                http_response_code(404);
                echo json_encode(['message' => 'Staff member not found.']);
                return;
            }

            if ($user['role'] === 'owner') {
                http_response_code(403);
                echo json_encode(['message' => 'Access forbidden. System Owner accounts cannot be deleted.']);
                return;
            }

            $stmt = $db->prepare('DELETE FROM users WHERE id = ?');
            $stmt->execute([$id]);

            echo json_encode(['message' => 'Staff access successfully revoked.']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error removing staff account.', 'error' => $e->getMessage()]);
        }
    }

    // =============================================
    // PROFILE MANAGEMENT & SECURITY
    // =============================================

    /**
     * PUT /api/auth/profile/password
     */
    public static function updatePassword(): void
    {
        $input           = json_decode(file_get_contents('php://input'), true) ?? [];
        $currentPassword = $input['currentPassword'] ?? '';
        $newPassword     = $input['newPassword'] ?? '';
        $user            = $GLOBALS['user'];

        if (empty($currentPassword) || empty($newPassword)) {
            http_response_code(400);
            echo json_encode(['message' => 'Current password and new password are required.']);
            return;
        }

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT password FROM users WHERE id = ?');
            $stmt->execute([$user['id']]);
            $row = $stmt->fetch();

            if (!$row || !password_verify($currentPassword, $row['password'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Current password is incorrect.']);
                return;
            }

            $hashed = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 10]);
            $stmt   = $db->prepare('UPDATE users SET password = ? WHERE id = ?');
            $stmt->execute([$hashed, $user['id']]);

            echo json_encode(['message' => 'Password updated successfully.']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Server error during password update.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/auth/profile/email-change/request
     */
    public static function requestEmailChange(): void
    {
        $input    = json_decode(file_get_contents('php://input'), true) ?? [];
        $password = $input['password'] ?? '';
        $newEmail = strtolower(trim($input['newEmail'] ?? ''));
        $user     = $GLOBALS['user'];

        if (empty($password) || empty($newEmail)) {
            http_response_code(400);
            echo json_encode(['message' => 'Password and new email are required.']);
            return;
        }

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT password FROM users WHERE id = ?');
            $stmt->execute([$user['id']]);
            $row = $stmt->fetch();

            if (!password_verify($password, $row['password'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Incorrect password.']);
                return;
            }

            $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
            $stmt->execute([$newEmail]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['message' => 'This email is already registered.']);
                return;
            }

            $otp     = (string)random_int(100000, 999999);
            $expires = date('Y-m-d H:i:s', time() + 15 * 60);

            $stmt = $db->prepare('UPDATE users SET new_email_pending = ?, new_email_otp = ?, new_email_otp_expires = ? WHERE id = ?');
            $stmt->execute([$newEmail, $otp, $expires, $user['id']]);

            EmailUtils::sendEmail([
                'to'      => $newEmail,
                'subject' => 'HonTech Security: Verify Your New Email Address',
                'text'    => "Your email change verification code is: {$otp}.",
                'html'    => EmailUtils::generateSupercellEmailHtml([
                    'title'      => 'Verify New Email Address',
                    'bodyText'   => "Please enter the verification code below in your profile dashboard to verify and update your primary email address to {$newEmail}:",
                    'code'       => $otp,
                    'footerText' => 'This email change verification code is valid for 15 minutes. If you did not request this update, please ignore this email.'
                ])
            ]);

            echo json_encode([
                'message' => "A verification code has been sent. For testing, the code is: {$otp}",
                'token'   => $otp
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Server error requesting email change.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/auth/profile/email-change/verify
     */
    public static function verifyEmailChange(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $otp   = $input['otp'] ?? '';
        $user  = $GLOBALS['user'];

        if (empty($otp)) {
            http_response_code(400);
            echo json_encode(['message' => 'Verification OTP code is required.']);
            return;
        }

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT new_email_pending, new_email_otp, new_email_otp_expires FROM users WHERE id = ?');
            $stmt->execute([$user['id']]);
            $row = $stmt->fetch();

            if (empty($row['new_email_pending']) || empty($row['new_email_otp']) || $row['new_email_otp'] !== $otp || strtotime($row['new_email_otp_expires']) < time()) {
                http_response_code(400);
                echo json_encode(['message' => 'Invalid or expired verification code.']);
                return;
            }

            $newEmail = $row['new_email_pending'];
            $stmt     = $db->prepare('UPDATE users SET email = ?, new_email_pending = NULL, new_email_otp = NULL, new_email_otp_expires = NULL WHERE id = ?');
            $stmt->execute([$newEmail, $user['id']]);

            echo json_encode([
                'message' => 'Primary email address verified and updated successfully.',
                'email'   => $newEmail
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Server error verifying email change.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/auth/profile/backup-email/request
     */
    public static function requestBackupEmail(): void
    {
        $input       = json_decode(file_get_contents('php://input'), true) ?? [];
        $password    = $input['password'] ?? '';
        $backupEmail = strtolower(trim($input['backupEmail'] ?? ''));
        $user        = $GLOBALS['user'];

        if (empty($password) || empty($backupEmail)) {
            http_response_code(400);
            echo json_encode(['message' => 'Password and backup recovery email are required.']);
            return;
        }

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT password, email FROM users WHERE id = ?');
            $stmt->execute([$user['id']]);
            $row = $stmt->fetch();

            if (!password_verify($password, $row['password'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Incorrect password.']);
                return;
            }

            if ($backupEmail === $row['email']) {
                http_response_code(400);
                echo json_encode(['message' => 'Backup recovery email must be different from your primary email.']);
                return;
            }

            $otp     = (string)random_int(100000, 999999);
            $expires = date('Y-m-d H:i:s', time() + 15 * 60);

            $stmt = $db->prepare('UPDATE users SET backup_email_otp = ?, backup_email_otp_expires = ? WHERE id = ?');
            $stmt->execute([$otp, $expires, $user['id']]);

            EmailUtils::sendEmail([
                'to'      => $backupEmail,
                'subject' => 'HonTech Security: Verify Backup Recovery Email',
                'text'    => "Your backup email verification code is: {$otp}.",
                'html'    => EmailUtils::generateSupercellEmailHtml([
                    'title'      => 'Verify Backup Recovery Email',
                    'bodyText'   => 'Please enter the verification code below to verify and link this email address as your secondary backup recovery email:',
                    'code'       => $otp,
                    'footerText' => 'This backup recovery verification code is valid for 15 minutes. If you did not initiate this configuration, please secure your account.'
                ])
            ]);

            echo json_encode([
                'message' => "A verification code has been sent. For testing, the code is: {$otp}",
                'token'   => $otp
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Server error requesting backup email.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/auth/profile/backup-email/verify
     */
    public static function verifyBackupEmail(): void
    {
        $input       = json_decode(file_get_contents('php://input'), true) ?? [];
        $otp         = $input['otp'] ?? '';
        $backupEmail = strtolower(trim($input['backupEmail'] ?? ''));
        $user        = $GLOBALS['user'];

        if (empty($otp) || empty($backupEmail)) {
            http_response_code(400);
            echo json_encode(['message' => 'OTP code and backup email are required.']);
            return;
        }

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT backup_email_otp, backup_email_otp_expires FROM users WHERE id = ?');
            $stmt->execute([$user['id']]);
            $row = $stmt->fetch();

            if (empty($row['backup_email_otp']) || $row['backup_email_otp'] !== $otp || strtotime($row['backup_email_otp_expires']) < time()) {
                http_response_code(400);
                echo json_encode(['message' => 'Invalid or expired verification code.']);
                return;
            }

            $stmt = $db->prepare('UPDATE users SET backup_email = ?, backup_email_otp = NULL, backup_email_otp_expires = NULL WHERE id = ?');
            $stmt->execute([$backupEmail, $user['id']]);

            echo json_encode([
                'message'     => 'Backup recovery email verified and linked successfully.',
                'backupEmail' => $backupEmail
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Server error verifying backup email.', 'error' => $e->getMessage()]);
        }
    }

    // =============================================
    // MULTI-FACTOR AUTHENTICATION (MFA)
    // =============================================

    /**
     * POST /api/auth/mfa/setup
     */
    public static function setupMfa(): void
    {
        $user = $GLOBALS['user'];

        try {
            $secret = SecurityUtils::generateBase32Secret();

            $db   = Database::getConnection();
            $stmt = $db->prepare('UPDATE users SET mfa_secret = ? WHERE id = ?');
            $stmt->execute([$secret, $user['id']]);

            $label      = 'HonTech:' . $user['email'];
            $otpauthUrl = 'otpauth://totp/' . rawurlencode($label) . '?secret=' . $secret . '&issuer=HonTech';
            $qrCodeUrl  = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . rawurlencode($otpauthUrl);

            echo json_encode([
                'secret'    => $secret,
                'qrCodeUrl' => $qrCodeUrl
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Server error setting up MFA.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/auth/mfa/enable
     */
    public static function enableMfa(): void
    {
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $otpCode = $input['otpCode'] ?? '';
        $user    = $GLOBALS['user'];

        if (empty($otpCode)) {
            http_response_code(400);
            echo json_encode(['message' => 'OTP code is required.']);
            return;
        }

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT mfa_secret FROM users WHERE id = ?');
            $stmt->execute([$user['id']]);
            $row = $stmt->fetch();

            if (empty($row['mfa_secret'])) {
                http_response_code(400);
                echo json_encode(['message' => 'MFA setup not initiated. Please request MFA secret first.']);
                return;
            }

            if (!SecurityUtils::verifyTOTP($row['mfa_secret'], $otpCode)) {
                http_response_code(400);
                echo json_encode(['message' => 'Invalid MFA verification code.']);
                return;
            }

            // Generate 8 backup codes
            $rawCodes    = SecurityUtils::generateBackupCodes(8);
            $hashedCodes = array_map(fn($code) => password_hash($code, PASSWORD_BCRYPT, ['cost' => 10]), $rawCodes);

            $stmt = $db->prepare('UPDATE users SET mfa_enabled = 1, backup_codes = ? WHERE id = ?');
            $stmt->execute([json_encode($hashedCodes), $user['id']]);

            echo json_encode([
                'message'     => 'Multi-Factor Authentication activated successfully.',
                'backupCodes' => $rawCodes
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Server error enabling MFA.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/auth/mfa/disable
     */
    public static function disableMfa(): void
    {
        $input    = json_decode(file_get_contents('php://input'), true) ?? [];
        $password = $input['password'] ?? '';
        $user     = $GLOBALS['user'];

        if (empty($password)) {
            http_response_code(400);
            echo json_encode(['message' => 'Password is required to disable MFA.']);
            return;
        }

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT password FROM users WHERE id = ?');
            $stmt->execute([$user['id']]);
            $row = $stmt->fetch();

            if (!password_verify($password, $row['password'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Incorrect password.']);
                return;
            }

            $stmt = $db->prepare('UPDATE users SET mfa_enabled = 0, mfa_secret = NULL, backup_codes = NULL WHERE id = ?');
            $stmt->execute([$user['id']]);

            echo json_encode(['message' => 'Multi-Factor Authentication disabled.']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Server error disabling MFA.', 'error' => $e->getMessage()]);
        }
    }

    // =============================================
    // GOOGLE SSO INTEGRATION
    // =============================================

    /**
     * POST /api/auth/google/link
     */
    public static function googleLink(): void
    {
        $input       = json_decode(file_get_contents('php://input'), true) ?? [];
        $googleEmail = strtolower(trim($input['googleEmail'] ?? ''));
        $googleId    = $input['googleId'] ?? '';
        $user        = $GLOBALS['user'];

        if (empty($googleEmail)) {
            http_response_code(400);
            echo json_encode(['message' => 'Google email is required.']);
            return;
        }

        try {
            $db = Database::getConnection();

            // Check duplicate
            $stmt = $db->prepare('SELECT id FROM users WHERE google_email = ? AND id != ?');
            $stmt->execute([$googleEmail, $user['id']]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['message' => 'This Google account is already linked to another user.']);
                return;
            }

            $finalGoogleId = !empty($googleId) ? $googleId : 'g_' . random_int(10000000, 99999999);

            $stmt = $db->prepare('UPDATE users SET google_email = ?, google_id = ? WHERE id = ?');
            $stmt->execute([$googleEmail, $finalGoogleId, $user['id']]);

            echo json_encode([
                'message'     => 'Google account linked successfully.',
                'googleEmail' => $googleEmail
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Server error linking Google account.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/auth/google/unlink
     */
    public static function googleUnlink(): void
    {
        $user = $GLOBALS['user'];

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('UPDATE users SET google_email = NULL, google_id = NULL WHERE id = ?');
            $stmt->execute([$user['id']]);

            echo json_encode(['message' => 'Google account unlinked successfully.']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error unlinking Google account.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/auth/google/login
     */
    public static function googleLogin(): void
    {
        $input       = json_decode(file_get_contents('php://input'), true) ?? [];
        $googleEmail = strtolower(trim($input['googleEmail'] ?? ''));

        if (empty($googleEmail)) {
            http_response_code(400);
            echo json_encode(['message' => 'Google email is required.']);
            return;
        }

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT * FROM users WHERE (google_email = ? OR email = ?) AND is_deleted = 0 LIMIT 1');
            $stmt->execute([$googleEmail, $googleEmail]);
            $user = $stmt->fetch();

            if (!$user) {
                http_response_code(401);
                echo json_encode(['message' => 'Google login failed. No user found with this Google account.']);
                return;
            }

            if (!$user['is_active']) {
                http_response_code(403);
                echo json_encode(['message' => 'Account has been deactivated.']);
                return;
            }

            // Auto-link if not set
            if (empty($user['google_email'])) {
                $gId = $user['google_id'] ?: 'g_' . random_int(10000000, 99999999);
                $stmt = $db->prepare('UPDATE users SET google_email = ?, google_id = ? WHERE id = ?');
                $stmt->execute([$googleEmail, $gId, $user['id']]);
            }

            if ($user['mfa_enabled']) {
                echo json_encode([
                    'requiresMfa' => true,
                    'userId'      => $user['id'],
                    'email'       => $user['email']
                ]);
                return;
            }

            $stmt = $db->prepare('UPDATE users SET is_online = 1, last_active = NOW() WHERE id = ?');
            $stmt->execute([$user['id']]);

            Auth::generateToken($user['id'], $user['role']);

            echo json_encode([
                'id'    => $user['id'],
                'name'  => $user['name'],
                'email' => $user['email'],
                'role'  => $user['role']
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Server error during Google Login.', 'error' => $e->getMessage()]);
        }
    }

    // =============================================
    // ADMIN CONTROLS
    // =============================================

    /**
     * POST /api/auth/staff/:id/reset-password
     */
    public static function resetStaffPassword(string $id): void
    {
        $input       = json_decode(file_get_contents('php://input'), true) ?? [];
        $newPassword = $input['newPassword'] ?? '';
        $currentUser = $GLOBALS['user'];

        if (empty($newPassword)) {
            http_response_code(400);
            echo json_encode(['message' => 'New password is required.']);
            return;
        }

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT id, name, role FROM users WHERE id = ?');
            $stmt->execute([$id]);
            $user = $stmt->fetch();

            if (!$user) {
                http_response_code(404);
                echo json_encode(['message' => 'Personnel account not found.']);
                return;
            }

            if ($user['role'] === 'owner' && $currentUser['role'] === 'admin') {
                http_response_code(403);
                echo json_encode(['message' => 'Access forbidden. Administrators cannot modify the System Owner account.']);
                return;
            }

            $hashed = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 10]);
            $stmt   = $db->prepare('UPDATE users SET password = ? WHERE id = ?');
            $stmt->execute([$hashed, $id]);

            echo json_encode(['message' => "Password for {$user['name']} has been reset successfully."]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error resetting personnel password.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * PATCH /api/auth/staff/:id/toggle-active
     */
    public static function toggleStaffActiveStatus(string $id): void
    {
        $input    = json_decode(file_get_contents('php://input'), true) ?? [];
        $isActive = $input['isActive'] ?? null;

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT id, name, role FROM users WHERE id = ?');
            $stmt->execute([$id]);
            $user = $stmt->fetch();

            if (!$user) {
                http_response_code(404);
                echo json_encode(['message' => 'Personnel account not found.']);
                return;
            }

            if ($user['role'] === 'owner') {
                http_response_code(403);
                echo json_encode(['message' => 'Cannot suspend or deactivate System Owner accounts.']);
                return;
            }

            $activeVal = $isActive ? 1 : 0;
            $stmt      = $db->prepare('UPDATE users SET is_active = ? WHERE id = ?');
            $stmt->execute([$activeVal, $id]);

            $statusMsg = $isActive ? 'restored' : 'suspended';
            echo json_encode([
                'message'  => "Personnel account access {$statusMsg}.",
                'isActive' => (bool)$isActive
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error updating personnel active status.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * PUT /api/auth/staff/:id/role
     */
    public static function updateStaffRole(string $id): void
    {
        $input       = json_decode(file_get_contents('php://input'), true) ?? [];
        $role        = $input['role'] ?? '';
        $currentUser = $GLOBALS['user'];

        if (empty($role)) {
            http_response_code(400);
            echo json_encode(['message' => 'Role is required.']);
            return;
        }

        $validRoles = ['owner', 'admin', 'assistant', 'sa'];
        if (!in_array($role, $validRoles, true)) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid role type.']);
            return;
        }

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT id, name, email, role FROM users WHERE id = ?');
            $stmt->execute([$id]);
            $user = $stmt->fetch();

            if (!$user) {
                http_response_code(404);
                echo json_encode(['message' => 'Staff member not found.']);
                return;
            }

            if ($user['role'] === 'owner' || ($role === 'owner' && $currentUser['role'] !== 'owner')) {
                http_response_code(403);
                echo json_encode(['message' => 'Access forbidden. Owner role is protected and cannot be assigned or demoted by Administrators.']);
                return;
            }

            $stmt = $db->prepare('UPDATE users SET role = ? WHERE id = ?');
            $stmt->execute([$role, $id]);

            echo json_encode([
                'message' => "Role for {$user['name']} updated to {$role} successfully.",
                'id'      => (int)$user['id'],
                'name'    => $user['name'],
                'email'   => $user['email'],
                'role'    => $role
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error updating staff role.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * PATCH /api/auth/staff/:id/branch
     */
    public static function updateStaffBranch(string $id): void
    {
        $input       = json_decode(file_get_contents('php://input'), true) ?? [];
        $branch      = $input['branch'] ?? '';
        $currentUser = $GLOBALS['user'];

        if (empty($branch)) {
            http_response_code(400);
            echo json_encode(['message' => 'Branch is required.']);
            return;
        }

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT id, name, email, role, branch FROM users WHERE id = ?');
            $stmt->execute([$id]);
            $user = $stmt->fetch();

            if (!$user) {
                http_response_code(404);
                echo json_encode(['message' => 'Staff member not found.']);
                return;
            }

            if ($user['role'] === 'owner' && $currentUser['role'] === 'admin') {
                http_response_code(403);
                echo json_encode(['message' => 'Access forbidden. Administrators cannot modify the System Owner account.']);
                return;
            }

            $stmt = $db->prepare('UPDATE users SET branch = ? WHERE id = ?');
            $stmt->execute([$branch, $id]);

            echo json_encode([
                'message' => "Branch assignment for {$user['name']} updated to {$branch} successfully.",
                'id'      => (int)$user['id'],
                'name'    => $user['name'],
                'email'   => $user['email'],
                'role'    => $user['role'],
                'branch'  => $branch
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error updating staff branch.', 'error' => $e->getMessage()]);
        }
    }

    // =============================================
    // DEVELOPER TOOLS
    // =============================================

    /**
     * GET /api/auth/developer/emails
     */
    public static function getSimulatedEmails(): void
    {
        echo json_encode(EmailUtils::getSimulatedEmails());
    }

    /**
     * DELETE /api/auth/developer/emails
     */
    public static function clearSimulatedEmails(): void
    {
        EmailUtils::clearSimulatedEmails();
        echo json_encode(['message' => 'Simulated email queue cleared.']);
    }

    /**
     * PATCH /api/auth/developer/emails/:id/read
     */
    public static function markEmailRead(string $emailId): void
    {
        EmailUtils::markEmailRead($emailId);
        echo json_encode(['success' => true]);
    }

    // =============================================
    // DISABLED SELF-SERVICE RECOVERY
    // =============================================

    public static function forgotPassword(): void
    {
        http_response_code(403);
        echo json_encode(['message' => 'Self-service password recovery is disabled. Please contact your system administrator to recover or reset your password.']);
    }

    public static function resetPassword(): void
    {
        http_response_code(403);
        echo json_encode(['message' => 'Self-service password recovery is disabled. Please contact your system administrator to recover or reset your password.']);
    }

    /**
     * PUT /api/auth/staff/:id/edit
     * Edits a staff member's core details (Admin/Owner only)
     */
    public static function editStaff(string $id): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $name = trim($input['name'] ?? '');
        $email = strtolower(trim($input['email'] ?? ''));
        $role = trim($input['role'] ?? '');
        $branch = trim($input['branch'] ?? '');
        $currentUser = $GLOBALS['user'];

        if (empty($name) || empty($email) || empty($role) || empty($branch)) {
            http_response_code(400);
            echo json_encode(['message' => 'All fields (name, email, role, branch) are required.']);
            return;
        }

        $validRoles = ['owner', 'admin', 'assistant', 'sa'];
        if (!in_array($role, $validRoles, true)) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid system role specified.']);
            return;
        }

        try {
            $db = Database::getConnection();

            // Verify staff member exists
            $stmt = $db->prepare('SELECT id, role, email FROM users WHERE id = ? AND is_deleted = 0');
            $stmt->execute([$id]);
            $user = $stmt->fetch();

            if (!$user) {
                http_response_code(404);
                echo json_encode(['message' => 'Staff member not found.']);
                return;
            }

            // Prevent modifying the Owner
            if ($user['role'] === 'owner' && $currentUser['role'] === 'admin') {
                http_response_code(403);
                echo json_encode(['message' => 'Access forbidden. Administrators cannot modify the System Owner account.']);
                return;
            }

            // Prevent non-owners from elevating to owner or demoting an owner
            if ($user['role'] === 'owner' || ($role === 'owner' && $currentUser['role'] !== 'owner')) {
                if ($currentUser['role'] !== 'owner') {
                    http_response_code(403);
                    echo json_encode(['message' => 'Access forbidden. Owner role is protected and cannot be assigned or modified by Administrators.']);
                    return;
                }
            }

            // Check if new email is already in use by another active user
            if ($email !== $user['email']) {
                $stmt = $db->prepare('SELECT id FROM users WHERE email = ? AND id != ? AND is_deleted = 0');
                $stmt->execute([$email, $id]);
                if ($stmt->fetch()) {
                    http_response_code(400);
                    echo json_encode(['message' => 'Email address is already in use.']);
                    return;
                }
            }

            // Update details
            $stmt = $db->prepare('UPDATE users SET name = ?, email = ?, role = ?, branch = ? WHERE id = ?');
            $stmt->execute([$name, $email, $role, $branch, $id]);

            echo json_encode(['message' => 'Staff member details updated successfully.']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error updating staff member details.', 'error' => $e->getMessage()]);
        }
    }
}
