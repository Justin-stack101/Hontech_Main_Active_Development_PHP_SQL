<?php
namespace App\Repositories;

use App\Config\Database;
use PDO;

/**
 * User Repository
 * 
 * Encapsulates database queries for the users table according to the Repository Pattern.
 */
class UserRepository
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT id, name, email, password, role, branch, is_active, backup_email, mfa_enabled, mfa_secret, backup_codes, google_id, google_email, is_online, last_active, reset_token, reset_otp, reset_token_expires_at FROM users WHERE id = ? AND is_deleted = 0');
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE email = ? AND is_deleted = 0');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public function findByGoogleId(string $googleId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE google_id = ? AND is_deleted = 0');
        $stmt->execute([$googleId]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public function findByResetToken(string $token): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE reset_token = ? AND is_deleted = 0');
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public function findByResetOtp(string $otp): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE reset_otp = ? AND is_deleted = 0');
        $stmt->execute([$otp]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public function getAllActiveStaff(): array
    {
        $stmt = $this->db->query("SELECT id, name, email, role, branch, is_active, is_online, last_active, created_at FROM users WHERE is_deleted = 0 ORDER BY id ASC");
        return $stmt->fetchAll();
    }

    public function getStaffByBranch(string $branch): array
    {
        $stmt = $this->db->prepare("SELECT id, name, email, role, branch, is_active, is_online, last_active, created_at FROM users WHERE is_deleted = 0 AND branch = ? ORDER BY id ASC");
        $stmt->execute([$branch]);
        return $stmt->fetchAll();
    }

    public function createStaffUser(string $name, string $email, string $password, string $role, string $branch): array
    {
        $hashed = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
        $stmt = $this->db->prepare('INSERT INTO users (name, email, password, role, branch, is_active) VALUES (?, ?, ?, ?, ?, 1)');
        $stmt->execute([$name, $email, $hashed, $role, $branch]);
        
        $newId = (int)$this->db->lastInsertId();
        return $this->findById($newId);
    }

    public function updateStaffUser(int $id, string $name, string $email, string $role, string $branch): bool
    {
        $stmt = $this->db->prepare('UPDATE users SET name = ?, email = ?, role = ?, branch = ? WHERE id = ?');
        return $stmt->execute([$name, $email, $role, $branch, $id]);
    }

    public function toggleActiveStatus(int $id, bool $isActive): bool
    {
        $stmt = $this->db->prepare('UPDATE users SET is_active = ? WHERE id = ?');
        return $stmt->execute([$isActive ? 1 : 0, $id]);
    }

    public function softDeleteUser(int $id): bool
    {
        $stmt = $this->db->prepare('UPDATE users SET is_deleted = 1 WHERE id = ?');
        return $stmt->execute([$id]);
    }

    public function updateOnlineStatus(int $userId, bool $isOnline): bool
    {
        $stmt = $this->db->prepare('UPDATE users SET is_online = ?, last_active = NOW() WHERE id = ?');
        return $stmt->execute([$isOnline ? 1 : 0, $userId]);
    }

    public function updatePassword(int $userId, string $hashedPassword): bool
    {
        $stmt = $this->db->prepare('UPDATE users SET password = ? WHERE id = ?');
        return $stmt->execute([$hashedPassword, $userId]);
    }

    public function savePasswordResetToken(int $userId, string $token, string $otp, string $expiresAt): bool
    {
        $stmt = $this->db->prepare('UPDATE users SET reset_token = ?, reset_otp = ?, reset_token_expires_at = ? WHERE id = ?');
        return $stmt->execute([$token, $otp, $expiresAt, $userId]);
    }

    public function updatePasswordAndClearResetTokens(int $userId, string $hashedPassword): bool
    {
        $stmt = $this->db->prepare('UPDATE users SET password = ?, reset_token = NULL, reset_otp = NULL, reset_token_expires_at = NULL WHERE id = ?');
        return $stmt->execute([$hashedPassword, $userId]);
    }
}
