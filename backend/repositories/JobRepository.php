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

    public function getFilteredJobs(array $user, bool $all = false, bool $monitor = false, ?string $branchFilter = null): array
    {
        $conditions = ["is_deleted = 0"];
        $params     = [];

        if (!$all && !$monitor) {
            $conditions[] = "status != ?";
            $params[]     = 'Completed';
        }

        // Branch partitioning logic
        $targetBranch = $branchFilter ?? ($_GET['branch'] ?? null);

        if ($user['role'] === 'owner' || $user['role'] === 'admin' || $user['role'] === 'assistant' || $user['role'] === 'sa') {
            if (!empty($targetBranch) && !in_array(strtolower($targetBranch), ['all', 'combined', 'both'], true)) {
                if ($targetBranch === 'Branch A' || $targetBranch === 'Marikina' || $targetBranch === 'Marikina Branch') {
                    $conditions[] = "(branch = 'Marikina Branch' OR branch = 'Branch A' OR branch = 'Marikina' OR branch IS NULL OR branch = '')";
                } else {
                    $conditions[] = "branch = ?";
                    $params[]     = $targetBranch;
                }
            }
            // If no specific branch query filter is supplied, SA / Assistant / Admin / Owner receive records so client-side can partition or switch branches seamlessly
        } else {
            $userBranch = $user['branch'] ?? 'Marikina Branch';
            if (empty($userBranch) || $userBranch === 'Branch A' || $userBranch === 'Marikina' || $userBranch === 'Marikina Branch') {
                $conditions[] = "(branch = 'Marikina Branch' OR branch = 'Branch A' OR branch = 'Marikina' OR branch IS NULL OR branch = '')";
            } else {
                $conditions[] = "branch = ?";
                $params[]     = $userBranch;
            }
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
        $stmt = $this->db->prepare("SELECT claim_stub FROM jobs WHERE claim_stub LIKE ?");
        $stmt->execute([$datePrefix . '%']);
        $rows = $stmt->fetchAll();
        $max = 0;
        foreach ($rows as $r) {
            $stub = $r['claim_stub'] ?? '';
            if (preg_match('/^' . preg_quote($datePrefix, '/') . '[-_]?j(\d+)$/i', $stub, $m)) {
                $idx = (int)$m[1];
                if ($idx > $max) {
                    $max = $idx;
                }
            }
        }
        return $max;
    }
}
