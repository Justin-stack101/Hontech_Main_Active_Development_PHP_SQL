<?php
namespace App\Repositories;

use App\Config\Database;
use PDO;

/**
 * User Repository
 * 
 * Encapsulates database queries for the users table.
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
        $stmt = $this->db->prepare('SELECT id, name, email, password, role, branch, is_active, backup_email, mfa_enabled, mfa_secret, backup_codes, google_id, google_email, is_online, last_active FROM users WHERE id = ? AND is_deleted = 0');
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

    public function getStaffList(): array
    {
        $stmt = $this->db->query("SELECT id, name, email, role, branch, is_active, is_online, last_active, created_at FROM users WHERE is_deleted = 0 ORDER BY id ASC");
        return $stmt->fetchAll();
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
}
