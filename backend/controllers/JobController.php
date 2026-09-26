<?php
namespace App\Controllers;

use App\Config\Database;
use App\Middleware\Auth;
use App\Repositories\JobRepository;
use App\Utils\ApiResponse;

/**
 * Job Controller
 * 
 * Complete port of backend/controllers/jobController.js (363 lines → PHP)
 * Handles: CRUD for job records, lift assignment, status workflow, analytics, temp file export
 */
class JobController
{
    /**
     * In-memory temp file cache stored in a session-like temp file
     */
    private static function getTempStorePath(): string
    {
        return sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'hontech_temp_files.json';
    }

    private static function loadTempFiles(): array
    {
        $path = self::getTempStorePath();
        if (!file_exists($path)) return [];
        $data = json_decode(file_get_contents($path), true);
        return is_array($data) ? $data : [];
    }

    private static function saveTempFiles(array $files): void
    {
        file_put_contents(self::getTempStorePath(), json_encode($files), LOCK_EX);
    }

    /**
     * Generate a claim stub number unique to the current date
     */
    /**
     * REV-203: claim stubs are assigned by the server only, first come first served:
     * MMDDYY (Manila date) + "J" + the customer's number for that day (J1, J2, J3 ...).
     * One counter row per day; the atomic INSERT ... ON DUPLICATE KEY UPDATE with LAST_INSERT_ID
     * gives every registration its own number even when two SAs register at the same moment.
     */
    public static function claimStubDatePrefix(): string
    {
        return (new \DateTime('now', new \DateTimeZone('Asia/Manila')))->format('mdy');
    }

    public static function ensureClaimStubCounterTable(\PDO $db): void
    {
        $db->exec("CREATE TABLE IF NOT EXISTS `claim_stub_counters` (
            `stub_date` CHAR(6) NOT NULL PRIMARY KEY,
            `last_no`   INT NOT NULL DEFAULT 0,
            `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }

    private static function generateStubNumber(): string
    {
        $db = Database::getConnection();
        self::ensureClaimStubCounterTable($db);
        $datePrefix = self::claimStubDatePrefix();
        // never below a number already printed today (older stubs, or ones typed in before REV-203)
        $floor = (new JobRepository($db))->getNextStubCount($datePrefix) + 1;
        $stmt = $db->prepare('INSERT INTO claim_stub_counters (stub_date, last_no) VALUES (?, LAST_INSERT_ID(?))
            ON DUPLICATE KEY UPDATE last_no = LAST_INSERT_ID(GREATEST(last_no + 1, ?))');
        $stmt->execute([$datePrefix, $floor, $floor]);
        $next = (int)$db->query('SELECT LAST_INSERT_ID()')->fetchColumn();
        return $datePrefix . 'J' . $next;
    }

    /** REV-203: the number the next registration will get (preview only, nothing is reserved) */
    public static function peekNextStubNumber(): string
    {
        $db = Database::getConnection();
        self::ensureClaimStubCounterTable($db);
        $datePrefix = self::claimStubDatePrefix();
        $stmt = $db->prepare('SELECT last_no FROM claim_stub_counters WHERE stub_date = ?');
        $stmt->execute([$datePrefix]);
        $counter = (int)($stmt->fetchColumn() ?: 0);
        $used = (new JobRepository($db))->getNextStubCount($datePrefix);
        return $datePrefix . 'J' . (max($counter, $used) + 1);
    }

    /** GET /jobs/next-claim-stub */
    public static function nextClaimStub(): void
    {
        echo json_encode(['claimStub' => self::peekNextStubNumber()]);
    }

    /**
     * Normalize lane type string consistently across the system
     */
    /** REV-176: referral channels captured on the Workshop_Monitoring intake (Referred By) */
    public const REFERRAL_SOURCES = ['Relative', 'Friends', 'Social Media (Facebook, Instagram, etc.)', 'Others'];
    public const REFERRAL_DEFAULT = 'Walk-in / Direct';

    public static function normalizeReferredBy($value): string
    {
        $v = trim((string)($value ?? ''));
        return in_array($v, self::REFERRAL_SOURCES, true) ? $v : self::REFERRAL_DEFAULT;
    }

    /**
     * REV-176: make sure jobs.referred_by exists (self-healing for databases that have not run
     * backend/migration.php yet), so registering a job never fails on the new column.
     */
    public static function ensureReferredByColumn(\PDO $db): bool
    {
        static $ready = null;
        if ($ready !== null) return $ready;
        try {
            if ($db->query("SHOW COLUMNS FROM `jobs` LIKE 'referred_by'")->rowCount() === 0) {
                $db->exec("ALTER TABLE `jobs` ADD COLUMN `referred_by` VARCHAR(100) NOT NULL DEFAULT 'Walk-in / Direct' AFTER `category`");
            }
            $ready = true;
        } catch (\Exception $e) {
            $ready = false;
        }
        return $ready;
    }

    public static function normalizeLaneType(?string $lane): string
    {
        if (empty($lane)) return 'Flexible Lane';
        $l = strtolower(trim($lane));
        // REV-201: four lanes - Flexible, Express (2 hours), PMS & GRS, Priority.
        // Retired Special / Regular lanes (and anything unknown) read as Flexible Lane.
        if (str_contains($l, 'express')) return 'Express Lane';
        if (str_contains($l, 'priority')) return 'Priority Lane';
        if (str_contains($l, 'pms') || str_contains($l, 'grs')) return 'PMS & GRS Lane';
        return 'Flexible Lane';
    }

    /**
     * Normalize a job row from snake_case DB columns to camelCase for frontend
     */
    public static function normalizeJob(array $job): array
    {
        return [
            '_id'                => $job['id'],
            'id'                 => $job['job_id'],
            'source'             => $job['source'],
            'plate'              => $job['plate'],
            'name'               => $job['name'],
            'contact'            => $job['contact'],
            'vehicle'            => $job['vehicle'],
            'category'           => $job['category'],
            'referredBy'         => $job['referred_by'] ?? self::REFERRAL_DEFAULT,
            'concern'            => $job['concern'],
            'laneType'           => self::normalizeLaneType($job['lane_type'] ?? null),
            'dateReceived'       => $job['date_received'],
            'arrival'            => $job['arrival'],
            'departure'          => $job['departure'],
            'apptDate'           => $job['appt_date'],
            'apptTime'           => $job['appt_time'],
            'confirmed'          => (bool)$job['confirmed'],
            'claimStub'          => $job['claim_stub'],
            'partsAvailable'     => $job['parts_available'],
            'evaluation'         => $job['evaluation'],
            'status'             => $job['status'],
            'location'           => $job['location'],
            'branch'             => $job['branch'],
            'bayAssigned'        => $job['bay_assigned'],
            'promisedDate'       => $job['promised_date'],
            'carryOverStatus'    => $job['carry_over_status'],
            'remarks'            => $job['remarks'],
            'saName'             => $job['sa_name'],
            'address'            => $job['address'] ?? '',
            'kmReading'          => !is_null($job['km_reading'] ?? null) ? (int)$job['km_reading'] : null,
            'engineNo'           => $job['engine_no'] ?? '',
            'color'              => $job['color'] ?? '',
            'isBackjob'          => (bool)($job['is_backjob'] ?? false),
            'parentJobId'        => $job['parent_job_id'] ?? null,
            'backjobReason'      => $job['backjob_reason'] ?? '',
            'goalStatus'         => $job['goal_status'],
            'recommendation'     => $job['recommendation'],
            'recommendationNotes'=> $job['recommendation_notes'],
            'dateCompleted'      => $job['date_completed'],
            'createdAt'          => $job['created_at'],
            'updatedAt'          => $job['updated_at']
        ];
    }

    /**
     * GET /api/jobs
     */
    public static function getJobs(): void
    {
        $user = Auth::getCurrentUser();

        try {
            $isAll = (isset($_GET['all']) && $_GET['all'] === 'true');
            $isMonitor = (isset($_GET['monitor']) && $_GET['monitor'] === 'true');

            if ($isAll && ($user['role'] !== 'owner' && $user['role'] !== 'admin')) {
                ApiResponse::forbidden('Access forbidden. Only Owners and Admins can access historical records.');
                return;
            }

            $repo = new JobRepository();
            $jobs = $repo->getFilteredJobs($user, $isAll, $isMonitor);

            $result = array_map([self::class, 'normalizeJob'], $jobs);
            ApiResponse::json($result);
        } catch (\Exception $e) {
            ApiResponse::serverError('Error retrieving jobs.', $e->getMessage());
        }
    }

    /**
     * POST /api/jobs
     */
    public static function createJob(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $user  = $GLOBALS['user'];

        $source       = $input['source'] ?? 'Walk-in';
        $plate        = strtoupper(trim($input['plate'] ?? ''));
        $name         = trim($input['name'] ?? '');
        $address      = trim($input['address'] ?? '');
        $contact      = $input['contact'] ?? '';
        $vehicle      = trim($input['vehicle'] ?? ($input['model'] ?? ''));
        $kmReading    = isset($input['kmReading']) ? (int)$input['kmReading'] : (isset($input['km']) ? (int)$input['km'] : null);
        $engineNo     = trim($input['engineNo'] ?? ($input['engine'] ?? ''));
        $color        = trim($input['color'] ?? '');
        $category     = $input['category'] ?? '';
        $referredBy   = self::normalizeReferredBy($input['referredBy'] ?? ($input['referred_by'] ?? null));
        $concern      = $input['concern'] ?? '';
        $evaluation   = trim($input['evaluation'] ?? ($input['diagnostic'] ?? ''));
        $dateReceived = $input['dateReceived'] ?? ($input['intakeDate'] ?? date('Y-m-d'));
        $promisedDate = !empty($input['promisedDate']) ? $input['promisedDate'] : (!empty($input['promiseDate']) ? $input['promiseDate'] : null);
        $arrival      = $input['arrival'] ?? '';
        $apptDate     = $input['apptDate'] ?? null;
        $apptTime     = $input['apptTime'] ?? '';
        $confirmed    = $input['confirmed'] ?? false;
        $branch       = $input['branch'] ?? 'Branch A';
        $laneType     = self::normalizeLaneType($input['laneType'] ?? null);
        $isBackjob    = (!empty($input['isBackjob']) || !empty($input['is_backjob'])) ? 1 : 0;
        $parentJobId  = !empty($input['parentJobId']) ? trim($input['parentJobId']) : (!empty($input['parent_job_id']) ? trim($input['parent_job_id']) : null);
        $backjobReason= trim($input['backjobReason'] ?? ($input['backjob_reason'] ?? ''));
        $customJobId  = !empty($input['jobId']) ? trim($input['jobId']) : (!empty($input['jobNo']) ? trim($input['jobNo']) : null);
        $customSa     = trim($input['saName'] ?? ($input['sa'] ?? ''));

        if (empty($plate) || empty($name) || empty($vehicle) || empty($category)) {
            http_response_code(400);
            echo json_encode(['message' => 'Plate, Name, Vehicle, and Category are required.']);
            return;
        }

        try {
            $isWalkin = ($source === 'Walk-in' || $source === 'Studio Form' || $source === 'Returning' || $source === 'Back-Job');
            $prefix   = $isWalkin ? 'WLK-' : 'ONL-';
            $jobId    = $customJobId ?: ($prefix . random_int(1000, 9999));

            $finalArrival   = $arrival;
            // REV-203: the client's claim stub is only a preview; the server assigns the real one
            $claimStub      = '';
            $initialStatus  = !empty($input['status']) ? $input['status'] : 'Pending';

            if ($isWalkin) {
                if (empty($finalArrival)) {
                    $finalArrival = date('H:i');
                }
                if ($initialStatus === 'Pending') {
                    $initialStatus = 'Waiting';
                }
            }

            // REV-142: SA "Load to 2025 RO Studio" handover — the pending Online booking row is promoted
            // into the active workshop job (keeping its job_id and audit trail) instead of inserting a
            // duplicate, which also clears it from the pending Booking Module list.
            $fromBookingId = !empty($input['fromBookingId']) ? trim((string)$input['fromBookingId']) : null;
            if ($fromBookingId !== null && $user['role'] === 'sa') {
                $db   = Database::getConnection();
                $hasReferral = self::ensureReferredByColumn($db);
                $stmt = $db->prepare("SELECT * FROM jobs WHERE (id = ? OR job_id = ?) AND is_deleted = 0 AND source = 'Online' AND status = 'Pending'");
                $stmt->execute([$fromBookingId, $fromBookingId]);
                $booking = $stmt->fetch();

                if (!$booking) {
                    http_response_code(404);
                    echo json_encode(['message' => 'Online booking not found or already registered to the workshop floor.']);
                    return;
                }
                if (!JobRepository::isSameBranch($booking['branch'] ?? '', $user['branch'] ?? '')) {
                    http_response_code(403);
                    echo json_encode(['message' => 'Access forbidden. This online booking belongs to another branch.']);
                    return;
                }

                $convertedStatus = ($initialStatus === 'Pending') ? 'Waiting' : $initialStatus;
                $claimStub = !empty($booking['claim_stub']) ? $booking['claim_stub'] : self::generateStubNumber();
                $stmt = $db->prepare(
                    'UPDATE jobs SET plate = ?, name = ?, address = ?, contact = ?, vehicle = ?, km_reading = ?,
                        engine_no = ?, color = ?, category = ?, concern = ?, evaluation = ?, lane_type = ?,
                        date_received = ?, promised_date = ?, arrival = ?, claim_stub = ?, status = ?,
                        confirmed = 1, sa_name = ?' . ($hasReferral ? ', referred_by = ?' : '') . '
                     WHERE id = ? AND is_deleted = 0'
                );
                $stmt->execute(array_merge([
                    $plate, $name, $address, $contact, $vehicle, $kmReading,
                    $engineNo, $color, $category, $concern, $evaluation, $laneType,
                    $dateReceived, $promisedDate, $finalArrival ?: date('H:i'),
                    $claimStub, $convertedStatus,
                    $customSa ?: ($user['name'] ?? '')
                ], $hasReferral ? [$referredBy] : [], [$booking['id']]));

                $stmt = $db->prepare('SELECT * FROM jobs WHERE id = ?');
                $stmt->execute([$booking['id']]);
                echo json_encode(self::normalizeJob($stmt->fetch()));
                return;
            }

            // Branch assignment based on role
            $finalBranch =($user['role'] === 'owner' || $user['role'] === 'admin' || $user['role'] === 'assistant')
                ? ($branch ?: 'Branch A')
                : ($user['branch'] ?: 'Branch A');

            $saName = $customSa ?: (($isWalkin && !empty($user['name'])) ? $user['name'] : '');

            // REV-203: every vehicle that enters the floor (not a pending online booking) gets the next number
            if ($initialStatus !== 'Pending') {
                $claimStub = self::generateStubNumber();
            }

            $db   = Database::getConnection();
            $hasReferral = self::ensureReferredByColumn($db);
            $stmt = $db->prepare(
                'INSERT INTO jobs (
                    job_id, source, plate, name, address, contact, vehicle, km_reading, engine_no, color,
                    category, concern, evaluation, lane_type, date_received, promised_date, arrival,
                    appt_date, appt_time, confirmed, claim_stub, status, is_backjob, parent_job_id,
                    backjob_reason, branch, location, sa_name' . ($hasReferral ? ', referred_by' : '') . '
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?' . ($hasReferral ? ', ?' : '') . ')'
            );
            $stmt->execute(array_merge([
                $jobId, $source, $plate, $name, $address, $contact, $vehicle, $kmReading, $engineNo, $color,
                $category, $concern, $evaluation, $laneType, $dateReceived, $promisedDate, $finalArrival,
                !empty($apptDate) ? $apptDate : null,
                $apptTime, $confirmed ? 1 : 0, $claimStub,
                $initialStatus, $isBackjob, $parentJobId, $backjobReason,
                $finalBranch, 'None', $saName
            ], $hasReferral ? [$referredBy] : []));

            $newId = $db->lastInsertId();

            // Fetch the created job
            $stmt = $db->prepare('SELECT * FROM jobs WHERE id = ?');
            $stmt->execute([$newId]);
            $job = $stmt->fetch();

            http_response_code(201);
            echo json_encode(self::normalizeJob($job));
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error registering job.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * PATCH /api/jobs/:id/field
     */
    public static function updateJobField(string $jobId): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $field = $input['field'] ?? '';
        $value = $input['value'] ?? '';
        $user  = $GLOBALS['user'];

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT * FROM jobs WHERE job_id = ?');
            $stmt->execute([$jobId]);
            $job = $stmt->fetch();

            if (!$job) {
                http_response_code(404);
                echo json_encode(['message' => 'Job not found.']);
                return;
            }

            // Branch Security (Assistants dispatch Online bookings across branches). Admins and SAs
            // only ever manage their own branch's jobs — including Online bookings (REV-142 branch
            // lock) — matching the read-side branch scoping in JobRepository::getFilteredJobs.
            if ($user['role'] !== 'owner' && $user['role'] !== 'assistant' && !JobRepository::isSameBranch($job['branch'] ?? '', $user['branch'] ?? '')) {
                http_response_code(403);
                echo json_encode(['message' => 'Access forbidden. This vehicle belongs to another branch.']);
                return;
            }

            // Role Security
            if ($user['role'] === 'owner' || $user['role'] === 'admin') {
                http_response_code(403);
                echo json_encode(['message' => 'Access forbidden. Owners and Admins have viewing-only access to workshop records.']);
                return;
            }

            if ($field === 'arrival' && $job['source'] === 'Online') {
                if ($user['role'] !== 'sa' && $user['role'] !== 'assistant') {
                    http_response_code(403);
                    echo json_encode(['message' => 'Access forbidden. Only SAs and Assistants can edit arrival for online bookings.']);
                    return;
                }
            } else {
                if ($user['role'] === 'assistant' && $job['status'] !== 'Pending') {
                    http_response_code(403);
                    echo json_encode(['message' => 'Access forbidden. Assistant is read-only for active workshop records.']);
                    return;
                }
            }

            // Map camelCase field names to snake_case DB columns
            $fieldMap = [
                'arrival'            => 'arrival',
                'departure'          => 'departure',
                'evaluation'         => 'evaluation',
                'partsAvailable'     => 'parts_available',
                'concern'            => 'concern',
                'remarks'            => 'remarks',
                'promisedDate'       => 'promised_date',
                'carryOverStatus'    => 'carry_over_status',
                'saName'             => 'sa_name',
                'laneType'           => 'lane_type',
                // REV-203: 'claimStub' is not editable - assigned once by the server
                'confirmed'          => 'confirmed',
                'apptDate'           => 'appt_date',
                'apptTime'           => 'appt_time',
                'contact'            => 'contact',
                'category'           => 'category',
                'goalStatus'         => 'goal_status',
                'recommendation'     => 'recommendation',
                'recommendationNotes'=> 'recommendation_notes',
                'location'           => 'location',
                'bayAssigned'        => 'bay_assigned',
                'status'             => 'status',
            ];

            if ($field === 'location') {
                if (!empty($value) && (str_starts_with($value, 'Bay') || str_starts_with($value, 'Lift'))) {
                    preg_match('/\d+/', $value, $matches);
                    $bayNum = !empty($matches) ? (int)$matches[0] : 1;
                    $normalizedLocation = "Bay {$bayNum}";

                    // Vacate any prior occupant in this bay so reassignment happens seamlessly
                    $vacateStmt = $db->prepare("UPDATE jobs SET location = 'None', bay_assigned = NULL, updated_at = NOW() WHERE id != ? AND (location = ? OR location = ? OR bay_assigned = ?) AND status NOT IN ('Completed', 'Released')");
                    $vacateStmt->execute([$job['id'], "Bay {$bayNum}", "Lift {$bayNum}", $bayNum]);

                    $newStatus = ($job['status'] === 'Waiting' || $job['status'] === 'Pending') ? 'Processing' : $job['status'];
                    $stmt = $db->prepare('UPDATE jobs SET location = ?, bay_assigned = ?, status = ?, updated_at = NOW() WHERE id = ?');
                    $stmt->execute([$normalizedLocation, $bayNum, $newStatus, $job['id']]);
                    // REV-189: announce the bay on the branch TV (only when the bay actually changed)
                    if ((string)$job['location'] !== $normalizedLocation) {
                        TvController::announce($db, $job, 'bay', $normalizedLocation, isset($user['id']) ? (int)$user['id'] : null);
                    }
                } else {
                    // Selecting Waiting Area preserves existing status (e.g. Processing remains Processing)
                    $stmt = $db->prepare("UPDATE jobs SET location = 'None', bay_assigned = NULL, updated_at = NOW() WHERE id = ?");
                    $stmt->execute([$job['id']]);
                }
            } else {
                $dbCol = $fieldMap[$field] ?? $field;

                // Validate that the column exists in our map
                if (!in_array($dbCol, $fieldMap, true) && !array_key_exists($field, $fieldMap)) {
                    http_response_code(400);
                    echo json_encode(['message' => "Invalid field: {$field}"]);
                    return;
                }

                if ($field === 'laneType' || $dbCol === 'lane_type') {
                    $value = self::normalizeLaneType($value);
                }

                $stmt = $db->prepare("UPDATE jobs SET `{$dbCol}` = ? WHERE id = ?");
                $stmt->execute([$value, $job['id']]);
                if ($dbCol === 'status') {
                    TvController::announceStatusChange($db, $job, (string)$value, isset($user['id']) ? (int)$user['id'] : null);
                }

                // Record immutable audit log entry if edit reason provided
                $editReason = trim($input['editReason'] ?? $input['edit_reason'] ?? $input['reason'] ?? '');
                if (!empty($editReason)) {
                    $auditStmt = $db->prepare('
                        INSERT INTO job_audit_logs 
                        (job_id, plate, field_name, old_value, new_value, edit_reason, edited_by_id, edited_by_name, edited_by_role)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ');
                    $auditStmt->execute([
                        $job['job_id'],
                        $job['plate'],
                        $field,
                        (string)($job[$dbCol] ?? ''),
                        (string)$value,
                        $editReason,
                        $user['id'] ?? 0,
                        $user['name'] ?? 'Staff User',
                        $user['role'] ?? 'sa'
                    ]);
                }
            }

            // Auto-calculate goalStatus if relevant fields change
            if (in_array($field, ['arrival', 'departure', 'category'])) {
                // Re-fetch job
                $stmt = $db->prepare('SELECT * FROM jobs WHERE id = ?');
                $stmt->execute([$job['id']]);
                $updatedJob = $stmt->fetch();

                $isPMS = !empty($updatedJob['category']) && stripos($updatedJob['category'], 'PMS') !== false;
                if ($isPMS && !empty($updatedJob['arrival']) && !empty($updatedJob['departure'])) {
                    $arrParts = explode(':', $updatedJob['arrival']);
                    $depParts = explode(':', $updatedJob['departure']);

                    if (count($arrParts) >= 2 && count($depParts) >= 2) {
                        $arrMin = (int)$arrParts[0] * 60 + (int)$arrParts[1];
                        $depMin = (int)$depParts[0] * 60 + (int)$depParts[1];
                        $diff   = $depMin - $arrMin;
                        if ($diff < 0) $diff += 24 * 60;

                        $goalStatus = ($diff <= 120) ? 'Successful' : 'Failed';
                        $stmt = $db->prepare('UPDATE jobs SET goal_status = ? WHERE id = ?');
                        $stmt->execute([$goalStatus, $job['id']]);
                    }
                }
            }

            // Fetch and return updated job
            $stmt = $db->prepare('SELECT * FROM jobs WHERE id = ?');
            $stmt->execute([$job['id']]);
            $finalJob = $stmt->fetch();

            echo json_encode(self::normalizeJob($finalJob));
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error updating field.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * PATCH /api/jobs/:id/status
     */
    public static function setJobStatus(string $jobId): void
    {
        $input  = json_decode(file_get_contents('php://input'), true) ?? [];
        $status = $input['status'] ?? '';
        $user   = $GLOBALS['user'];

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT * FROM jobs WHERE job_id = ?');
            $stmt->execute([$jobId]);
            $job = $stmt->fetch();

            if (!$job) {
                http_response_code(404);
                echo json_encode(['message' => 'Job not found.']);
                return;
            }

            // Branch Security (Assistants dispatch Online bookings across branches). Admins and SAs
            // only ever manage their own branch's jobs — including Online bookings (REV-142 branch
            // lock) — matching the read-side branch scoping in JobRepository::getFilteredJobs.
            if ($user['role'] !== 'owner' && $user['role'] !== 'assistant' && !JobRepository::isSameBranch($job['branch'] ?? '', $user['branch'] ?? '')) {
                http_response_code(403);
                echo json_encode(['message' => 'Access forbidden. This vehicle belongs to another branch.']);
                return;
            }

            // Role Security
            if ($user['role'] === 'owner' || $user['role'] === 'admin') {
                http_response_code(403);
                echo json_encode(['message' => 'Access forbidden. Owners and Admins have viewing-only access to workshop records.']);
                return;
            }

            if ($user['role'] === 'assistant' && $job['status'] !== 'Pending') {
                http_response_code(403);
                echo json_encode(['message' => 'Access forbidden. Assistant is read-only for active workshop records.']);
                return;
            }

            $originalStatus = $job['status'];
            $updates        = ['status' => $status];

            // Clear location for non-working states
            if (in_array($status, ['Ready', 'Released', 'Completed', 'Carry Over', 'Waiting'])) {
                $updates['location']     = 'None';
                $updates['bay_assigned'] = null;
            }

            // Clear remarks when pushing to daily intakes
            if ($status === 'Waiting' && $originalStatus === 'Pending') {
                $updates['remarks'] = '';
            }

            // Generate claim stub for online bookings becoming active
            if ($status === 'Waiting' && $job['source'] === 'Online' && empty($job['claim_stub'])) {
                $updates['claim_stub'] = self::generateStubNumber();
            }

            // Set departure on release
            if ($status === 'Released') {
                $updates['date_completed'] = date('Y-m-d');
                if (!empty($input['departure'])) {
                    $updates['departure'] = $input['departure'];
                } elseif (empty($job['departure'])) {
                    $updates['departure'] = date('H:i');
                }
            }

            // Same-day re-open logic: reset departure and completion date
            if ($status === 'Processing' && (!empty($input['reopen']) || in_array($originalStatus, ['Released', 'Completed']))) {
                $updates['departure']      = '';
                $updates['date_completed'] = null;
                $updates['goal_status']    = 'N/A';
            }

            // Completion logic
            if ($status === 'Completed') {
                $updates['date_completed'] = date('Y-m-d');
                if (!empty($input['departure'])) {
                    $updates['departure'] = $input['departure'];
                } elseif (empty($job['departure'])) {
                    $updates['departure'] = date('H:i');
                }
            }

            // Build UPDATE query
            $setClauses = [];
            $params     = [];
            foreach ($updates as $col => $val) {
                $setClauses[] = "`{$col}` = ?";
                $params[]     = $val;
            }
            $params[] = $job['id'];

            $sql  = 'UPDATE jobs SET ' . implode(', ', $setClauses) . ' WHERE id = ?';
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            // REV-189: record the TV announcement for this status change (ready, released, carry-over, ...)
            TvController::announceStatusChange($db, $job, $status, isset($user['id']) ? (int)$user['id'] : null);

            // Auto-calculate goalStatus
            $stmt = $db->prepare('SELECT * FROM jobs WHERE id = ?');
            $stmt->execute([$job['id']]);
            $updatedJob = $stmt->fetch();

            $isPMS = !empty($updatedJob['category']) && stripos($updatedJob['category'], 'PMS') !== false;
            if ($isPMS && !empty($updatedJob['arrival']) && !empty($updatedJob['departure'])
                && ($updatedJob['goal_status'] === 'N/A' || empty($updatedJob['goal_status']))) {

                $arrParts = explode(':', $updatedJob['arrival']);
                $depParts = explode(':', $updatedJob['departure']);

                if (count($arrParts) >= 2 && count($depParts) >= 2) {
                    $arrMin = (int)$arrParts[0] * 60 + (int)$arrParts[1];
                    $depMin = (int)$depParts[0] * 60 + (int)$depParts[1];
                    $diff   = $depMin - $arrMin;
                    if ($diff < 0) $diff += 24 * 60;

                    $goalStatus = ($diff <= 120) ? 'Successful' : 'Failed';
                    $stmt = $db->prepare('UPDATE jobs SET goal_status = ? WHERE id = ?');
                    $stmt->execute([$goalStatus, $job['id']]);
                }
            }

            // Re-fetch final state
            $stmt = $db->prepare('SELECT * FROM jobs WHERE id = ?');
            $stmt->execute([$job['id']]);
            $finalJob = $stmt->fetch();

            echo json_encode(self::normalizeJob($finalJob));
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error updating job status.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * DELETE /api/jobs/:id
     */
    public static function deleteJob(string $jobId): void
    {
        $user = $GLOBALS['user'];

        try {
            $db   = Database::getConnection();
            $stmt = $db->prepare('SELECT * FROM jobs WHERE job_id = ?');
            $stmt->execute([$jobId]);
            $job = $stmt->fetch();

            if (!$job) {
                http_response_code(404);
                echo json_encode(['message' => 'Job record not found.']);
                return;
            }

            // Branch Security (Assistants dispatch Online bookings across branches). Admins and SAs
            // only ever manage their own branch's jobs — including Online bookings (REV-142 branch
            // lock) — matching the read-side branch scoping in JobRepository::getFilteredJobs.
            if ($user['role'] !== 'owner' && $user['role'] !== 'assistant' && !JobRepository::isSameBranch($job['branch'] ?? '', $user['branch'] ?? '')) {
                http_response_code(403);
                echo json_encode(['message' => 'Access forbidden. This vehicle belongs to another branch.']);
                return;
            }

            if ($user['role'] === 'owner' || $user['role'] === 'admin') {
                http_response_code(403);
                echo json_encode(['message' => 'Access forbidden. Owners and Admins have viewing-only access to workshop records.']);
                return;
            }

            if ($user['role'] === 'assistant' && $job['status'] !== 'Pending') {
                http_response_code(403);
                echo json_encode(['message' => 'Access forbidden. Assistant can only delete pending bookings.']);
                return;
            }

            $stmt = $db->prepare('DELETE FROM jobs WHERE job_id = ?');
            $stmt->execute([$jobId]);

            echo json_encode(['message' => 'Job successfully removed from system.']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error deleting job record.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/jobs/export-temp
     */
    public static function uploadTempFile(): void
    {
        $input       = json_decode(file_get_contents('php://input'), true) ?? [];
        $fileData    = $input['fileData'] ?? '';
        $fileName    = $input['fileName'] ?? '';
        $contentType = $input['contentType'] ?? '';

        if (empty($fileData) || empty($fileName) || empty($contentType)) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing parameters.']);
            return;
        }

        $fileId    = 'temp_' . substr(bin2hex(random_bytes(8)), 0, 13);
        $tempFiles = self::loadTempFiles();

        // Clean up expired files (older than 2 minutes)
        $now = time();
        $tempFiles = array_filter($tempFiles, fn($f) => ($now - ($f['timestamp'] ?? 0)) < 120);

        $tempFiles[$fileId] = [
            'fileData'    => $fileData,
            'fileName'    => $fileName,
            'contentType' => $contentType,
            'timestamp'   => $now
        ];

        self::saveTempFiles($tempFiles);

        echo json_encode(['fileId' => $fileId]);
    }

    /**
     * GET /api/jobs/export-download/:fileId
     */
    public static function downloadTempFile(string $fileId): void
    {
        $tempFiles = self::loadTempFiles();
        $file      = $tempFiles[$fileId] ?? null;

        if (!$file) {
            http_response_code(404);
            echo 'File not found or link has expired.';
            return;
        }

        $buffer = base64_decode($file['fileData']);
        header('Content-Type: ' . $file['contentType']);
        header('Content-Disposition: attachment; filename="' . $file['fileName'] . '"');

        echo $buffer;

        // Remove file after sending
        unset($tempFiles[$fileId]);
        self::saveTempFiles($tempFiles);
    }

    /**
     * GET /api/jobs/analytics
     */
    public static function getAnalyticsData(): void
    {
        try {
            $db         = Database::getConnection();
            $conditions = ["is_deleted = 0"];
            $params     = [];

            $startDate = $_GET['startDate'] ?? '';
            $endDate   = $_GET['endDate'] ?? '';
            $branch    = $_GET['branch'] ?? '';

            $user = Auth::getCurrentUser();

            // Limitation #7: Admins strictly restricted to their branch analytics
            if ($user && $user['role'] === 'admin') {
                $conditions[] = "branch = ?";
                $params[]     = $user['branch'] ?? 'Marikina';
            } elseif (!empty($branch) && !in_array($branch, ['All', 'Combined', 'both'], true)) {
                $conditions[] = "branch = ?";
                $params[]     = $branch;
            }

            if (!empty($startDate)) {
                $conditions[] = "(date_received >= ? OR date_completed >= ?)";
                $params[]     = $startDate;
                $params[]     = $startDate;
            }
            if (!empty($endDate)) {
                $conditions[] = "(date_received <= ? OR date_completed <= ?)";
                $params[]     = $endDate;
                $params[]     = $endDate;
            }

            $where = '';
            if (!empty($conditions)) {
                $where = 'WHERE ' . implode(' AND ', $conditions);
            }

            $stmt = $db->prepare("SELECT * FROM jobs {$where} ORDER BY date_received DESC");
            $stmt->execute($params);
            $jobs = $stmt->fetchAll();

            $result = array_map([self::class, 'normalizeJob'], $jobs);
            echo json_encode($result);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error retrieving analytics data.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/jobs/:id/audit-history
     * Retrieve chronological audit log entries for a specific job
     */
    public static function getJobAuditHistory(string $jobId): void
    {
        $user = Auth::getCurrentUser();
        if (!$user) {
            ApiResponse::unauthorized('Authentication required.');
            return;
        }

        try {
            $db = Database::getConnection();
            $stmt = $db->prepare('SELECT * FROM job_audit_logs WHERE job_id = ? ORDER BY created_at DESC');
            $stmt->execute([$jobId]);
            $logs = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            ApiResponse::json($logs);
        } catch (\Exception $e) {
            ApiResponse::serverError('Failed to fetch job audit history.', $e->getMessage());
        }
    }

    /**
     * GET /api/audit-logs
     * Retrieve system-wide operational audit log entries (Owner/Admin)
     */
    public static function getSystemAuditLogs(): void
    {
        $user = Auth::getCurrentUser();
        if (!$user) {
            ApiResponse::unauthorized('Authentication required.');
            return;
        }

        try {
            $db = Database::getConnection();
            $conditions = [];
            $params = [];

            if (!empty($_GET['startDate'])) {
                $conditions[] = 'DATE(created_at) >= ?';
                $params[] = $_GET['startDate'];
            }
            if (!empty($_GET['endDate'])) {
                $conditions[] = 'DATE(created_at) <= ?';
                $params[] = $_GET['endDate'];
            }
            if (!empty($_GET['search'])) {
                $q = '%' . trim($_GET['search']) . '%';
                $conditions[] = '(plate LIKE ? OR job_id LIKE ? OR field_name LIKE ? OR edit_reason LIKE ? OR edited_by_name LIKE ?)';
                $params[] = $q;
                $params[] = $q;
                $params[] = $q;
                $params[] = $q;
                $params[] = $q;
            }

            $where = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';
            $stmt = $db->prepare("SELECT * FROM job_audit_logs {$where} ORDER BY created_at DESC LIMIT 500");
            $stmt->execute($params);
            $logs = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            ApiResponse::json($logs);
        } catch (\Exception $e) {
            ApiResponse::serverError('Failed to fetch system audit logs.', $e->getMessage());
        }
    }
}

