<?php
namespace App\Repositories;

use App\Config\Database;
use PDO;

/**
 * Bay Repository
 *
 * Handles per-branch Workshop Bay settings (Admin-configured ceiling, SA-operated active count).
 * Owner has no functionality against this table — enforced at the controller/route level.
 */
class BayRepository
{
    private PDO $db;

    private const DEFAULT_MAX_BAY_LIMIT = 6;
    private const DEFAULT_ACTIVE_BAY_COUNT = 6;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    /**
     * Normalizes legacy branch aliases ('Branch A', 'Marikina') so bay settings are keyed
     * consistently with how JobRepository partitions branch data.
     */
    public static function normalizeBranch(?string $branch): string
    {
        $branch = trim((string)$branch);
        if (empty($branch) || $branch === 'Branch A' || $branch === 'Marikina') {
            return 'Marikina Branch';
        }
        if ($branch === 'Branch B') {
            return 'East Branch';
        }
        return $branch;
    }

    public function getSettings(string $branch): array
    {
        $branch = self::normalizeBranch($branch);
        $stmt = $this->db->prepare('SELECT branch, max_bay_limit, active_bay_count, updated_at FROM branch_bay_settings WHERE branch = ?');
        $stmt->execute([$branch]);
        $row = $stmt->fetch();

        if (!$row) {
            return [
                'branch' => $branch,
                'maxBayLimit' => self::DEFAULT_MAX_BAY_LIMIT,
                'activeBayCount' => self::DEFAULT_ACTIVE_BAY_COUNT,
                'updatedAt' => null,
            ];
        }

        return [
            'branch' => $row['branch'],
            'maxBayLimit' => (int)$row['max_bay_limit'],
            'activeBayCount' => (int)$row['active_bay_count'],
            'updatedAt' => $row['updated_at'],
        ];
    }

    public function setMaxBayLimit(string $branch, int $maxBayLimit, int $updatedBy): array
    {
        $branch = self::normalizeBranch($branch);
        $existing = $this->getSettings($branch);
        // Clamp the SA's active operational count down if it now exceeds the new ceiling
        $activeBayCount = min($existing['activeBayCount'], $maxBayLimit);

        $stmt = $this->db->prepare(
            'INSERT INTO branch_bay_settings (branch, max_bay_limit, active_bay_count, updated_by)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE max_bay_limit = VALUES(max_bay_limit), active_bay_count = VALUES(active_bay_count), updated_by = VALUES(updated_by)'
        );
        $stmt->execute([$branch, $maxBayLimit, $activeBayCount, $updatedBy]);

        return $this->getSettings($branch);
    }

    public function setActiveBayCount(string $branch, int $activeBayCount, int $updatedBy): array
    {
        $branch = self::normalizeBranch($branch);
        $existing = $this->getSettings($branch);
        // The SA can never operate more bays than the Admin's configured ceiling
        $clamped = max(1, min($activeBayCount, $existing['maxBayLimit']));

        $stmt = $this->db->prepare(
            'INSERT INTO branch_bay_settings (branch, max_bay_limit, active_bay_count, updated_by)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE active_bay_count = VALUES(active_bay_count), updated_by = VALUES(updated_by)'
        );
        $stmt->execute([$branch, $existing['maxBayLimit'], $clamped, $updatedBy]);

        return $this->getSettings($branch);
    }
}
