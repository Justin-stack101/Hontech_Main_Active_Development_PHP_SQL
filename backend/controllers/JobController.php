<?php
namespace App\Controllers;

use App\Config\Database;

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
        file_put_contents(self::getTempStorePath(), json_encode($files));
    }

    /**
     * Generate a claim stub number unique to the current date
     */
    private static function generateStubNumber(): string
    {
        $db = Database::getConnection();

        $mm = date('m');
        $dd = date('d');
        $yy = date('y');
        $datePrefix = "{$mm}{$dd}{$yy}";

        $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM jobs WHERE claim_stub LIKE ?");
        $stmt->execute([$datePrefix . '-%']);
        $row   = $stmt->fetch();
        $count = (int)($row['cnt'] ?? 0);

        return $datePrefix . '-' . str_pad((string)($count + 1), 3, '0', STR_PAD_LEFT);
    }

    /**
     * Normalize a job row from snake_case DB columns to camelCase for frontend
     */
    private static function normalizeJob(array $job): array
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
            'concern'            => $job['concern'],
            'laneType'           => $job['lane_type'],
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
        $user = $GLOBALS['user'];

        try {
            $db         = Database::getConnection();
            $conditions = ["is_deleted = 0"];
            $params     = [];

            if (isset($_GET['all']) && $_GET['all'] === 'true') {
                if ($user['role'] !== 'owner' && $user['role'] !== 'admin') {
                    http_response_code(403);
                    echo json_encode(['message' => 'Access forbidden. Only Owners and Admins can access historical records.']);
                    return;
                }
            } elseif (!isset($_GET['monitor']) || $_GET['monitor'] !== 'true') {
                $conditions[] = "status != ?";
                $params[]     = 'Completed';
            }

            // Branch partitioning
            if ($user['role'] !== 'owner' && $user['role'] !== 'admin' && $user['role'] !== 'assistant') {
                $conditions[] = "branch = ?";
                $params[]     = $user['branch'] ?: 'Branch A';
            }

            $where = '';
            if (!empty($conditions)) {
                $where = 'WHERE ' . implode(' AND ', $conditions);
            }

            $stmt = $db->prepare("SELECT * FROM jobs {$where} ORDER BY updated_at DESC");
            $stmt->execute($params);
            $jobs = $stmt->fetchAll();

            $result = array_map([self::class, 'normalizeJob'], $jobs);
            echo json_encode($result);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error retrieving jobs.', 'error' => $e->getMessage()]);
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
        $contact      = $input['contact'] ?? '';
        $vehicle      = trim($input['vehicle'] ?? '');
        $category     = $input['category'] ?? '';
        $concern      = $input['concern'] ?? '';
        $dateReceived = $input['dateReceived'] ?? date('Y-m-d');
        $arrival      = $input['arrival'] ?? '';
        $apptDate     = $input['apptDate'] ?? null;
        $apptTime     = $input['apptTime'] ?? '';
        $confirmed    = $input['confirmed'] ?? false;
        $branch       = $input['branch'] ?? 'Branch A';
        $laneType     = $input['laneType'] ?? '';

        if (empty($plate) || empty($name) || empty($vehicle) || empty($category)) {
            http_response_code(400);
            echo json_encode(['message' => 'Plate, Name, Vehicle, and Category are required.']);
            return;
        }

        try {
            $isWalkin = ($source === 'Walk-in');
            $prefix   = $isWalkin ? 'WLK-' : 'ONL-';
            $jobId    = $prefix . random_int(1000, 9999);

            $finalArrival   = $arrival;
            $claimStub      = '';
            $initialStatus  = 'Pending';

            if ($isWalkin) {
                if (empty($finalArrival)) {
                    $finalArrival = date('H:i');
                }
                $claimStub     = self::generateStubNumber();
                $initialStatus = 'Waiting';
            }

            // Branch assignment based on role
            $finalBranch = ($user['role'] === 'owner' || $user['role'] === 'admin' || $user['role'] === 'assistant')
                ? ($branch ?: 'Branch A')
                : ($user['branch'] ?: 'Branch A');

            $saName = ($isWalkin && !empty($user['name'])) ? $user['name'] : '';

            $db   = Database::getConnection();
            $stmt = $db->prepare(
                'INSERT INTO jobs (job_id, source, plate, name, contact, vehicle, category, concern, lane_type, date_received, arrival, appt_date, appt_time, confirmed, claim_stub, status, branch, location, sa_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $jobId, $source, $plate, $name, $contact, $vehicle, $category, $concern,
                $laneType, $dateReceived, $finalArrival,
                !empty($apptDate) ? $apptDate : null,
                $apptTime, $confirmed ? 1 : 0, $claimStub,
                $initialStatus, $finalBranch, 'None', $saName
            ]);

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

            // Branch Security
            if ($user['role'] !== 'owner' && $user['role'] !== 'admin' && $user['role'] !== 'assistant' && $job['branch'] !== $user['branch']) {
                http_response_code(403);
                echo json_encode(['message' => 'Access forbidden. This vehicle belongs to another branch.']);
                return;
            }

            // Role Security
            if ($field === 'arrival' && $job['source'] === 'Online') {
                if ($user['role'] !== 'sa' && $user['role'] !== 'assistant') {
                    http_response_code(403);
                    echo json_encode(['message' => 'Access forbidden. Only SAs and Assistants can edit arrival for online bookings.']);
                    return;
                }
            } else {
                if ($user['role'] === 'owner' || $user['role'] === 'admin') {
                    http_response_code(403);
                    echo json_encode(['message' => 'Access forbidden. Owners and Admins are read-only for operational records.']);
                    return;
                }
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
                'claimStub'          => 'claim_stub',
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
                if (!empty($value) && str_starts_with($value, 'Lift')) {
                    $liftNum = (int)explode(' ', $value)[1] - 1;

                    // Collision check
                    $stmt = $db->prepare("SELECT job_id, plate FROM jobs WHERE job_id != ? AND location = ? AND status NOT IN ('Completed', 'Released')");
                    $stmt->execute([$jobId, $value]);
                    $occupied = $stmt->fetch();

                    if ($occupied) {
                        http_response_code(400);
                        $liftLabel = str_pad((string)($liftNum + 1), 2, '0', STR_PAD_LEFT);
                        echo json_encode(['message' => "Lift {$liftLabel} is already occupied by vehicle {$occupied['plate']}!"]);
                        return;
                    }

                    $stmt = $db->prepare('UPDATE jobs SET location = ?, bay_assigned = ?, status = ? WHERE id = ?');
                    $stmt->execute([$value, $liftNum, 'In Progress', $job['id']]);
                } else {
                    $newStatus = ($job['status'] === 'In Progress') ? 'Waiting' : $job['status'];
                    $stmt = $db->prepare('UPDATE jobs SET location = ?, bay_assigned = NULL, status = ? WHERE id = ?');
                    $stmt->execute(['None', $newStatus, $job['id']]);
                }
            } else {
                $dbCol = $fieldMap[$field] ?? $field;

                // Validate that the column exists in our map
                if (!in_array($dbCol, $fieldMap, true) && !array_key_exists($field, $fieldMap)) {
                    http_response_code(400);
                    echo json_encode(['message' => "Invalid field: {$field}"]);
                    return;
                }

                $stmt = $db->prepare("UPDATE jobs SET `{$dbCol}` = ? WHERE id = ?");
                $stmt->execute([$value, $job['id']]);
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

            // Branch Security
            if ($user['role'] !== 'owner' && $user['role'] !== 'admin' && $user['role'] !== 'assistant' && $job['branch'] !== $user['branch']) {
                http_response_code(403);
                echo json_encode(['message' => 'Access forbidden. This vehicle belongs to another branch.']);
                return;
            }

            // Role Security
            if ($user['role'] === 'owner' || $user['role'] === 'admin') {
                http_response_code(403);
                echo json_encode(['message' => 'Access forbidden. Owners and Admins are read-only for operational records.']);
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
            if ($status === 'Released' && empty($job['departure'])) {
                $updates['departure'] = date('H:i');
            }

            // Completion logic
            if ($status === 'Completed') {
                $updates['date_completed'] = date('Y-m-d');
                if (empty($job['departure'])) {
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

            // Branch Security
            if ($user['role'] !== 'owner' && $user['role'] !== 'admin' && $user['role'] !== 'assistant' && $job['branch'] !== $user['branch']) {
                http_response_code(403);
                echo json_encode(['message' => 'Access forbidden. This vehicle belongs to another branch.']);
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

            if (!empty($startDate)) {
                $conditions[] = "date_received >= ?";
                $params[]     = $startDate;
            }
            if (!empty($endDate)) {
                $conditions[] = "date_received <= ?";
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
}
