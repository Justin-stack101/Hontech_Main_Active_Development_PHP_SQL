<?php
namespace App\Controllers;

use App\Config\Database;
use App\Config\Env;
use App\Middleware\Auth;
use App\Repositories\BayRepository;
use App\Repositories\JobRepository;
use App\Utils\ApiResponse;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

/**
 * Smart TV Monitor (REV-186)
 *
 * - One broadcast session (live flag + 4-digit PIN) per branch, stored in `tv_sessions`.
 * - Only Service Advisors and Assistants control their branch's session.
 * - A TV unlocks with the PIN and receives a branch-scoped token (HMAC of branch + PIN), so
 *   generating a new PIN signs out every TV of that branch. Pausing the broadcast only puts TVs
 *   on standby; they resume by themselves when it goes live again.
 * - The TV feed returns only the branch's arrived vehicles with the fields the screen shows and
 *   the customer name masked ("Juan D."), per RA 10173.
 * - Logged-in staff (HDMI kiosk / in-app view) can read their own branch's feed without a PIN.
 */
class TvController
{
    private const CONTROL_ROLES = ['sa', 'assistant'];
    private const MAX_PIN_ATTEMPTS = 5;
    private const PIN_LOCK_MINUTES = 10;

    // ------------------------------------------------------------------ schema

    public static function ensureTables(\PDO $db): void
    {
        static $done = false;
        if ($done) return;
        $db->exec("CREATE TABLE IF NOT EXISTS `tv_sessions` (
            `branch`      VARCHAR(50) NOT NULL PRIMARY KEY,
            `active`      TINYINT(1) NOT NULL DEFAULT 0,
            `pin`         VARCHAR(8) NOT NULL,
            `updated_by`  INT NULL DEFAULT NULL,
            `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        // REV-189: announcements recorded by the server when an SA changes a vehicle; each TV plays them once
        $db->exec("CREATE TABLE IF NOT EXISTS `tv_announcements` (
            `id`          INT AUTO_INCREMENT PRIMARY KEY,
            `branch`      VARCHAR(50) NOT NULL,
            `type`        VARCHAR(20) NOT NULL,
            `job_id`      VARCHAR(30) NULL DEFAULT NULL,
            `plate`       VARCHAR(20) NOT NULL DEFAULT '',
            `vehicle`     VARCHAR(255) NOT NULL DEFAULT '',
            `bay`         VARCHAR(20) NULL DEFAULT NULL,
            `created_by`  INT NULL DEFAULT NULL,
            `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_tv_ann_branch_id` (`branch`, `id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $db->exec("CREATE TABLE IF NOT EXISTS `tv_pin_attempts` (
            `ip`          VARCHAR(64) NOT NULL PRIMARY KEY,
            `attempts`    INT NOT NULL DEFAULT 0,
            `first_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $done = true;
    }

    // ------------------------------------------------------------------ helpers

    /** 'Marikina Branch' or 'East Branch' (Regalado), whatever alias is stored */
    public static function canonicalBranch(?string $branch): string
    {
        $normalized = BayRepository::normalizeBranch($branch);
        return in_array($normalized, ['Regalado Branch', 'Regalado', 'East Branch'], true) ? 'East Branch' : 'Marikina Branch';
    }

    public static function branchDisplayName(string $branch): string
    {
        return self::canonicalBranch($branch) === 'East Branch' ? 'Regalado Branch' : 'Marikina Main Branch';
    }

    /** "Juan Dela Cruz" -> "Juan D."; a single name is shown as is */
    public static function maskName(?string $name): string
    {
        $parts = preg_split('/\s+/', trim((string)$name), -1, PREG_SPLIT_NO_EMPTY);
        if (!$parts) return 'Customer';
        if (count($parts) === 1) return $parts[0];
        return $parts[0] . ' ' . mb_strtoupper(mb_substr($parts[1], 0, 1)) . '.';
    }

    private static function secret(): string
    {
        Env::load();
        return (string)Env::get('JWT_SECRET', 'supersecretjwtkey12345!');
    }

    private static function makeToken(string $branch, string $pin): string
    {
        $b = rtrim(strtr(base64_encode($branch), '+/', '-_'), '=');
        return $b . '.' . hash_hmac('sha256', $branch . '|' . $pin, self::secret());
    }

    private static function randomPin(\PDO $db, ?string $exceptBranch = null): string
    {
        // PINs are unique across branches so a PIN identifies its branch
        $taken = $db->query('SELECT branch, pin FROM tv_sessions')->fetchAll(\PDO::FETCH_KEY_PAIR);
        if ($exceptBranch !== null) unset($taken[$exceptBranch]);
        do {
            $pin = str_pad((string)random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        } while (in_array($pin, $taken, true));
        return $pin;
    }

    public static function getSession(\PDO $db, string $branch): array
    {
        self::ensureTables($db);
        $branch = self::canonicalBranch($branch);
        $stmt = $db->prepare('SELECT * FROM tv_sessions WHERE branch = ?');
        $stmt->execute([$branch]);
        $row = $stmt->fetch();
        if (!$row) {
            $db->prepare('INSERT INTO tv_sessions (branch, active, pin) VALUES (?, 0, ?)')->execute([$branch, self::randomPin($db)]);
            $stmt->execute([$branch]);
            $row = $stmt->fetch();
        }
        return $row;
    }

    private static function publicSession(array $row, bool $withPin): array
    {
        $out = [
            'active'     => (bool)$row['active'],
            'branch'     => $row['branch'],
            'branchName' => self::branchDisplayName($row['branch']),
            'updated_at' => $row['updated_at'],
        ];
        if ($withPin) $out['pin'] = $row['pin'];
        return $out;
    }

    /** Branch of a valid TV token (signature checked against the branch's current PIN), else null */
    private static function branchFromToken(\PDO $db, ?string $token): ?string
    {
        if (!$token || !str_contains($token, '.')) return null;
        [$b64, $sig] = explode('.', $token, 2);
        $branch = base64_decode(strtr($b64, '-_', '+/'), true);
        if (!$branch || !in_array($branch, ['Marikina Branch', 'East Branch'], true)) return null;
        $session = self::getSession($db, $branch);
        return hash_equals(self::makeToken($branch, $session['pin']), $token) ? $branch : null;
    }

    /** Logged-in staff from the JWT cookie, without sending a 401 (TV routes stay usable for PIN TVs) */
    private static function staffFromCookie(\PDO $db): ?array
    {
        $jwt = $_COOKIE['token'] ?? null;
        if (!$jwt) return null;
        try {
            $decoded = JWT::decode($jwt, new Key(self::secret(), 'HS256'));
            $stmt = $db->prepare('SELECT id, name, role, branch, is_active FROM users WHERE id = ? AND is_deleted = 0');
            $stmt->execute([$decoded->id]);
            $user = $stmt->fetch();
            return ($user && $user['is_active']) ? $user : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /** Branch the caller may read: TV token first, then logged-in staff (owner/admin may pick ?branch=) */
    private static function viewerBranch(\PDO $db): ?string
    {
        $token = $_SERVER['HTTP_X_TV_TOKEN'] ?? ($_GET['token'] ?? null);
        $branch = self::branchFromToken($db, $token);
        if ($branch) return $branch;
        $staff = self::staffFromCookie($db);
        if (!$staff) return null;
        if (in_array($staff['role'], ['owner', 'admin'], true) && !empty($_GET['branch'])) {
            return self::canonicalBranch($_GET['branch']);
        }
        return self::canonicalBranch($staff['branch']);
    }

    private static function clientIp(): string
    {
        return substr((string)($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 0, 64);
    }

    // ------------------------------------------------------------------ announcements (REV-189)

    public const ANNOUNCEMENT_TYPES = ['bay', 'processing', 'ready', 'carryover', 'returned', 'released', 'recall', 'test'];
    private const ANNOUNCEMENT_MAX_AGE_MINUTES = 10;

    /** Record one TV announcement for the job's branch. Never breaks the job update that triggered it. */
    public static function announce(\PDO $db, array $job, string $type, ?string $bay = null, ?int $userId = null): void
    {
        if (!in_array($type, self::ANNOUNCEMENT_TYPES, true)) return;
        try {
            self::ensureTables($db);
            $db->prepare('INSERT INTO tv_announcements (branch, type, job_id, plate, vehicle, bay, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
               ->execute([
                   self::canonicalBranch($job['branch'] ?? ''), $type, $job['job_id'] ?? null,
                   (string)($job['plate'] ?? ''), (string)($job['vehicle'] ?? ''), $bay, $userId,
               ]);
        } catch (\Exception $e) {
            error_log('TV announcement not recorded: ' . $e->getMessage());
        }
    }

    /** Announcement for a status change made in Daily Intakes (online bookings are never announced) */
    public static function announceStatusChange(\PDO $db, array $jobBefore, string $newStatus, ?int $userId = null): void
    {
        $old = (string)($jobBefore['status'] ?? '');
        if ($old === $newStatus || $old === 'Pending') return;
        $active  = ['Processing', 'Monitoring'];
        $ready   = ['Ready', 'Ready to Release'];
        $done    = ['Released', 'Completed'];
        $type = null;
        if (in_array($newStatus, $ready, true) && !in_array($old, $ready, true)) {
            $type = 'ready';
        } elseif (in_array($newStatus, $done, true) && !in_array($old, $done, true)) {
            $type = 'released';
        } elseif ($newStatus === 'Carry Over') {
            $type = 'carryover';
        } elseif ($newStatus === 'Waiting' && $old === 'Carry Over') {
            $type = 'returned';
        } elseif (in_array($newStatus, $active, true) && !in_array($old, $active, true)) {
            $type = in_array($old, ['Carry Over', 'Released', 'Completed'], true) ? 'returned' : 'processing';
        }
        if ($type) self::announce($db, $jobBefore, $type, null, $userId);
    }

    // ------------------------------------------------------------------ routes

    /** GET /tv/session — staff only: their branch's session including the PIN (TV Broadcast Hub) */
    public static function getSessionForStaff(): void
    {
        $user = Auth::getCurrentUser();
        $db = Database::getConnection();
        $row = self::getSession($db, $user['branch'] ?? '');
        ApiResponse::json(self::publicSession($row, in_array($user['role'], self::CONTROL_ROLES, true)));
    }

    /** POST /tv/session — SA / Assistant only: { active: bool } or { generate_pin: true } for their branch */
    public static function updateSession(): void
    {
        $user = Auth::getCurrentUser();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $db = Database::getConnection();
        $row = self::getSession($db, $user['branch'] ?? '');
        $branch = $row['branch'];

        $active = isset($input['active']) ? ((bool)$input['active'] ? 1 : 0) : (int)$row['active'];
        $pin = $row['pin'];
        if (!empty($input['generate_pin'])) {
            $pin = self::randomPin($db, $branch); // signs out every TV of this branch
        }
        $db->prepare('UPDATE tv_sessions SET active = ?, pin = ?, updated_by = ? WHERE branch = ?')
           ->execute([$active, $pin, (int)$user['id'], $branch]);

        $row = self::getSession($db, $branch);
        ApiResponse::json(['message' => 'TV broadcast session updated.', 'session' => self::publicSession($row, true)]);
    }

    /** POST /tv/verify-pin — public: { pin } -> branch-scoped TV token (5 wrong PINs per 10 minutes per device) */
    public static function verifyPin(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $pin = preg_replace('/\D/', '', (string)($input['pin'] ?? ''));
        $db = Database::getConnection();
        self::ensureTables($db);

        $ip = self::clientIp();
        $db->prepare('DELETE FROM tv_pin_attempts WHERE first_at < (NOW() - INTERVAL ' . self::PIN_LOCK_MINUTES . ' MINUTE)')->execute();
        $stmt = $db->prepare('SELECT attempts FROM tv_pin_attempts WHERE ip = ?');
        $stmt->execute([$ip]);
        if ((int)$stmt->fetchColumn() >= self::MAX_PIN_ATTEMPTS) {
            ApiResponse::error('Too many wrong PIN attempts. Please wait ' . self::PIN_LOCK_MINUTES . ' minutes and try again.', 429);
            return;
        }

        $stmt = $db->prepare('SELECT * FROM tv_sessions WHERE pin = ?');
        $stmt->execute([$pin]);
        $row = $pin !== '' ? $stmt->fetch() : false;
        if (!$row) {
            $db->prepare('INSERT INTO tv_pin_attempts (ip, attempts) VALUES (?, 1) ON DUPLICATE KEY UPDATE attempts = attempts + 1')->execute([$ip]);
            ApiResponse::unauthorized('Invalid TV Access PIN. Please enter the 4-digit PIN shown in the TV Broadcast Hub.');
            return;
        }
        $db->prepare('DELETE FROM tv_pin_attempts WHERE ip = ?')->execute([$ip]);
        ApiResponse::json([
            'valid'      => true,
            'message'    => 'TV Access PIN verified successfully.',
            'token'      => self::makeToken($row['branch'], $row['pin']),
            'branch'     => $row['branch'],
            'branchName' => self::branchDisplayName($row['branch']),
            'active'     => (bool)$row['active'],
        ]);
    }

    /** GET /tv/feed (and legacy /jobs/tv) — TV token or logged-in staff: live branch board */
    public static function feed(): void
    {
        $db = Database::getConnection();
        $branch = self::viewerBranch($db);
        if (!$branch) {
            ApiResponse::unauthorized('TV access token required. Enter the TV Access PIN.');
            return;
        }
        $session = self::getSession($db, $branch);
        $bay = (new BayRepository($db))->getSettings($branch);
        $base = [
            'active'     => (bool)$session['active'],
            'branch'     => $branch,
            'branchName' => self::branchDisplayName($branch),
            'bayCount'   => max(1, (int)($bay['activeBayCount'] ?? 6)),
        ];
        if (!$session['active'] && !self::staffFromCookie($db)) {
            ApiResponse::json($base + ['jobs' => []]); // standby: no job data while paused
            return;
        }

        [$branchSql, $params] = JobRepository::branchMatchSql($branch);
        $stmt = $db->prepare("SELECT * FROM jobs WHERE is_deleted = 0 AND status NOT IN ('Pending', 'Completed', 'Released') AND {$branchSql} ORDER BY created_at ASC");
        $stmt->execute($params);
        $jobs = array_map(static function (array $j): array {
            return [
                'id'              => $j['job_id'],
                'plate'           => $j['plate'],
                'vehicle'         => $j['vehicle'],
                'customer'        => self::maskName($j['name']),
                'category'        => $j['category'],
                'laneType'        => JobController::normalizeLaneType($j['lane_type'] ?? null),
                'location'        => $j['location'],
                'bayAssigned'     => $j['bay_assigned'] !== null ? (int)$j['bay_assigned'] : null,
                'status'          => $j['status'],
                'claimStub'       => $j['claim_stub'],
                'saName'          => $j['sa_name'],
                'arrival'         => $j['arrival'],
                'carryOverStatus' => $j['carry_over_status'],
            ];
        }, $stmt->fetchAll());
        ApiResponse::json($base + ['jobs' => $jobs]);
    }

    /** GET /tv/announcements?after=ID — TV token or staff: new announcements of the branch, oldest first.
     *  Without `after` only the latest id is returned, so a TV that (re)connects does not replay history. */
    public static function announcements(): void
    {
        $db = Database::getConnection();
        $branch = self::viewerBranch($db);
        if (!$branch) {
            ApiResponse::unauthorized('TV access token required. Enter the TV Access PIN.');
            return;
        }
        self::ensureTables($db);
        $stmt = $db->prepare('SELECT COALESCE(MAX(id), 0) FROM tv_announcements WHERE branch = ?');
        $stmt->execute([$branch]);
        $latestId = (int)$stmt->fetchColumn();
        if (!isset($_GET['after']) || $_GET['after'] === '') {
            ApiResponse::json(['latestId' => $latestId, 'items' => []]);
            return;
        }
        $stmt = $db->prepare('SELECT id, type, plate, vehicle, bay, created_at FROM tv_announcements
            WHERE branch = ? AND id > ? AND created_at >= (NOW() - INTERVAL ' . self::ANNOUNCEMENT_MAX_AGE_MINUTES . ' MINUTE)
            ORDER BY id ASC LIMIT 20');
        $stmt->execute([$branch, (int)$_GET['after']]);
        $items = array_map(static fn(array $r) => ['id' => (int)$r['id']] + $r, $stmt->fetchAll());
        ApiResponse::json(['latestId' => $latestId, 'items' => $items]);
    }

    /** POST /tv/announcements/recall — SA / Assistant: { jobId } of a Ready vehicle in their branch ("Call Customer Again") */
    public static function recall(): void
    {
        $user = Auth::getCurrentUser();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $jobId = trim((string)($input['jobId'] ?? ''));
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM jobs WHERE (job_id = ? OR id = ?) AND is_deleted = 0');
        $stmt->execute([$jobId, $jobId]);
        $job = $stmt->fetch();
        if (!$job) {
            ApiResponse::notFound('Job not found.');
            return;
        }
        if (!JobRepository::isSameBranch($job['branch'] ?? '', $user['branch'] ?? '')) {
            ApiResponse::forbidden('Access forbidden. This vehicle belongs to another branch.');
            return;
        }
        if (!in_array($job['status'], ['Ready', 'Ready to Release'], true)) {
            ApiResponse::badRequest('Only vehicles that are Ready to Release can be called again.');
            return;
        }
        self::ensureTables($db);
        $stmt = $db->prepare("SELECT COUNT(*) FROM tv_announcements WHERE job_id = ? AND type = 'recall' AND created_at >= (NOW() - INTERVAL 15 SECOND)");
        $stmt->execute([$job['job_id']]);
        if ((int)$stmt->fetchColumn() > 0) {
            ApiResponse::error('This customer was just called. Please wait a few seconds before calling again.', 429);
            return;
        }
        self::announce($db, $job, 'recall', null, (int)$user['id']);
        ApiResponse::json(['message' => 'Customer called again on the TV.', 'plate' => $job['plate']]);
    }

    /** POST /tv/announcements/test — SA / Assistant: play a test announcement on their branch's TVs */
    public static function testAnnouncement(): void
    {
        $user = Auth::getCurrentUser();
        $db = Database::getConnection();
        self::announce($db, ['branch' => $user['branch'] ?? '', 'plate' => 'TEST 123', 'vehicle' => 'Sound check'], 'test', null, (int)$user['id']);
        $session = self::getSession($db, $user['branch'] ?? '');
        ApiResponse::json(['message' => 'Test announcement sent.', 'active' => (bool)$session['active']]);
    }
}
