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

        if ($user['role'] === 'admin') {
            // Admins are strictly confined to their own branch's data and cannot escape it via a
            // ?branch= override — only the Owner role is allowed to see/switch between both branches.
            $userBranch = $user['branch'] ?? 'Marikina Branch';
            if (empty($userBranch) || $userBranch === 'Branch A' || $userBranch === 'Marikina' || $userBranch === 'Marikina Branch') {
                $conditions[] = "(branch = 'Marikina Branch' OR branch = 'Branch A' OR branch = 'Marikina' OR branch IS NULL OR branch = '')";
            } else {
                $conditions[] = "branch = ?";
                $params[]     = $userBranch;
            }
        } elseif ($user['role'] === 'owner' || $user['role'] === 'assistant' || $user['role'] === 'sa') {
            if (!empty($targetBranch) && !in_array(strtolower($targetBranch), ['all', 'combined', 'both'], true)) {
                if ($targetBranch === 'Branch A' || $targetBranch === 'Marikina' || $targetBranch === 'Marikina Branch') {
                    $conditions[] = "(branch = 'Marikina Branch' OR branch = 'Branch A' OR branch = 'Marikina' OR branch IS NULL OR branch = '')";
                } else {
                    $conditions[] = "branch = ?";
                    $params[]     = $targetBranch;
                }
            }
            // If no specific branch query filter is supplied, SA / Assistant / Owner receive records so
            // client-side can partition or switch branches seamlessly. Owner is the only role that can
            // legitimately see both branches at once this way.

            // REV-142: Pending Online bookings are dispatched by the Assistant to exactly one branch's
            // Booking Module. A Service Advisor only ever receives their own branch's pending bookings;
            // other records stay cross-branch so Customer Lookup history keeps working.
            if ($user['role'] === 'sa') {
                [$branchSql, $branchParams] = self::branchMatchSql($user['branch'] ?? '');
                $conditions[] = "(NOT (source = 'Online' AND status = 'Pending') OR {$branchSql})";
                array_push($params, ...$branchParams);
            }
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

    /**
     * Builds a parameterized SQL condition matching every stored alias of a branch
     * (legacy 'Branch A' / 'Branch B' values and the Regalado display name included).
     *
     * @return array{0: string, 1: array}
     */
    public static function branchMatchSql(?string $branch): array
    {
        $normalized = BayRepository::normalizeBranch($branch);
        if ($normalized === 'Marikina Branch') {
            return ["(branch = 'Marikina Branch' OR branch = 'Branch A' OR branch = 'Marikina' OR branch IS NULL OR branch = '')", []];
        }
        if (in_array($normalized, ['East Branch', 'Regalado Branch', 'Regalado'], true)) {
            return ["(branch = 'East Branch' OR branch = 'Branch B' OR branch = 'Regalado Branch' OR branch = 'Regalado')", []];
        }
        return ["branch = ?", [$normalized]];
    }

    /**
     * True when two stored branch values refer to the same physical branch.
     */
    public static function isSameBranch(?string $a, ?string $b): bool
    {
        $canon = static function (?string $branch): string {
            $normalized = BayRepository::normalizeBranch($branch);
            return in_array($normalized, ['Regalado Branch', 'Regalado'], true) ? 'East Branch' : $normalized;
        };
        return $canon($a) === $canon($b);
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
