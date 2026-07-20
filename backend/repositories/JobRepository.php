<?php
namespace App\Repositories;

use App\Config\Database;
use PDO;

/**
 * Job Repository
 * 
 * Encapsulates all SQL query logic for the jobs table.
 */
class JobRepository
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function getFilteredJobs(array $user, bool $all = false, bool $monitor = false): array
    {
        $conditions = ["is_deleted = 0"];
        $params     = [];

        if (!$all && !$monitor) {
            $conditions[] = "status != ?";
            $params[]     = 'Completed';
        }

        // Branch partitioning logic
        if ($user['role'] !== 'owner' && $user['role'] !== 'assistant') {
            $conditions[] = "branch = ?";
            $params[]     = $user['branch'] ?: 'Branch A';
        }

        $where = 'WHERE ' . implode(' AND ', $conditions);

        $stmt = $this->db->prepare("SELECT * FROM jobs {$where} ORDER BY updated_at DESC");
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function findById(int|string $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM jobs WHERE (id = ? OR job_id = ?) AND is_deleted = 0');
        $stmt->execute([$id, $id]);
        $job = $stmt->fetch();
        return $job ?: null;
    }

    public function getNextStubCount(string $datePrefix): int
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) as cnt FROM jobs WHERE claim_stub LIKE ?");
        $stmt->execute([$datePrefix . '-%']);
        $row = $stmt->fetch();
        return (int)($row['cnt'] ?? 0);
    }
}
