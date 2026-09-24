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
}
