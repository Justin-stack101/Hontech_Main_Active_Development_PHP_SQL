<?php
namespace App\Repositories;

use App\Config\Database;
use PDO;

/**
 * Branch Repository
 * 
 * Handles all database operations for the branches table.
 */
class BranchRepository
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function getActiveBranches(): array
    {
        $stmt = $this->db->query('SELECT id, name, code, is_active FROM branches WHERE is_deleted = 0 AND is_active = 1 ORDER BY name ASC');
        return $stmt->fetchAll();
    }

    public function getAllBranches(): array
    {
        $stmt = $this->db->query('SELECT id, name, code, is_active, is_deleted FROM branches ORDER BY name ASC');
        return $stmt->fetchAll();
    }

    public function findById(int|string $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM branches WHERE id = ?');
        $stmt->execute([$id]);
        $branch = $stmt->fetch();
        return $branch ?: null;
    }

    public function findByNameOrCode(string $name, string $code): ?array
    {
        $stmt = $this->db->prepare('SELECT id, is_deleted FROM branches WHERE name = ? OR code = ?');
        $stmt->execute([$name, $code]);
        $branch = $stmt->fetch();
        return $branch ?: null;
    }

    public function create(string $name, string $code): bool
    {
        $stmt = $this->db->prepare('INSERT INTO branches (name, code, is_active, is_deleted) VALUES (?, ?, 1, 0)');
        return $stmt->execute([$name, $code]);
    }

    public function restoreAndReactivate(int|string $id, string $name, string $code): bool
    {
        $stmt = $this->db->prepare('UPDATE branches SET name = ?, code = ?, is_active = 1, is_deleted = 0 WHERE id = ?');
        return $stmt->execute([$name, $code, $id]);
    }

    public function update(int|string $id, array $data): bool
    {
        $fields = [];
        $params = [];

        if (isset($data['name']) && !empty($data['name'])) {
            $fields[] = 'name = ?';
            $params[] = $data['name'];
        }
        if (isset($data['code']) && !empty($data['code'])) {
            $fields[] = 'code = ?';
            $params[] = $data['code'];
        }
        if (isset($data['isActive'])) {
            $fields[] = 'is_active = ?';
            $params[] = (int)$data['isActive'];
        }

        if (empty($fields)) {
            return false;
        }

        $params[] = $id;
        $sql = 'UPDATE branches SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    public function getActiveStaffCountByBranch(string $branchName): int
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM users WHERE branch = ? AND is_deleted = 0");
        $stmt->execute([$branchName]);
        $row = $stmt->fetch();
        return (int)($row['count'] ?? 0);
    }

    public function softDelete(int|string $id): bool
    {
        $stmt = $this->db->prepare('UPDATE branches SET is_deleted = 1, is_active = 0 WHERE id = ?');
        return $stmt->execute([$id]);
    }

    public function restore(int|string $id): bool
    {
        $stmt = $this->db->prepare('UPDATE branches SET is_deleted = 0, is_active = 1 WHERE id = ?');
        return $stmt->execute([$id]);
    }
}
