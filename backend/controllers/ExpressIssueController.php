<?php
namespace App\Controllers;

use App\Config\Database;
use App\Middleware\Auth;
use App\Utils\ApiResponse;
use PDO;

/**
 * Express Issue Controller
 * 
 * Handles 2-Hour SLA Delay Incident Reporting for Express Lane customers
 * and feeds management reports.
 */
class ExpressIssueController
{
    /**
     * POST /api/express-issues
     * Submit an Express Lane 2-Hour delay report
     */
    public static function createIssue(): void
    {
        $user = Auth::getCurrentUser();
        if (!$user) {
            ApiResponse::unauthorized('Authentication required.');
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $jobId          = trim($input['jobId'] ?? '');
        $plate          = strtoupper(trim($input['plate'] ?? ''));
        $customerName   = trim($input['customerName'] ?? '');
        $vehicle        = trim($input['vehicle'] ?? '');
        $saName         = trim($input['saName'] ?? ($user['name'] ?? 'Front Desk SA'));
        $arrivalTime    = trim($input['arrivalTime'] ?? '');
        $elapsedMinutes = (int)($input['elapsedMinutes'] ?? 0);
        $reasonCategory = trim($input['reasonCategory'] ?? '');
        $reasonDetails  = trim($input['reasonDetails'] ?? '');

        if (empty($jobId) || empty($plate) || empty($reasonCategory)) {
            ApiResponse::badRequest('Job ID, Plate Number, and Reason Category are required.');
            return;
        }

        // Combine custom reason if 'Others'
        $finalReasonCategory = $reasonCategory;
        if ($reasonCategory === 'Others' && !empty($input['customReasonCategory'])) {
            $finalReasonCategory = 'Others: ' . trim($input['customReasonCategory']);
        }

        try {
            $db = Database::getConnection();

            $stmt = $db->prepare('
                INSERT INTO express_lane_issues 
                (job_id, plate, customer_name, vehicle, sa_name, arrival_time, elapsed_minutes, reason_category, reason_details, reported_by_id, reported_by_name)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');

            $stmt->execute([
                $jobId,
                $plate,
                $customerName ?: 'Walk-in Customer',
                $vehicle ?: 'Vehicle',
                $saName,
                $arrivalTime,
                $elapsedMinutes,
                $finalReasonCategory,
                $reasonDetails,
                $user['id'] ?? 0,
                $user['name'] ?? 'System User'
            ]);

            $issueId = $db->lastInsertId();

            // Also log this delay report into system audit trail
            $auditStmt = $db->prepare('
                INSERT INTO job_audit_logs 
                (job_id, plate, field_name, old_value, new_value, edit_reason, edited_by_id, edited_by_name, edited_by_role)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');

            $auditStmt->execute([
                $jobId,
                $plate,
                'express_delay_report',
                'In Progress (2H Limit)',
                "Reported: {$finalReasonCategory}",
                $reasonDetails ?: "Express 2H limit delay reported by {$user['name']}",
                $user['id'] ?? 0,
                $user['name'] ?? 'System User',
                $user['role'] ?? 'sa'
            ]);

            // Fetch created record
            $fetchStmt = $db->prepare('SELECT * FROM express_lane_issues WHERE id = ?');
            $fetchStmt->execute([$issueId]);
            $record = $fetchStmt->fetch(PDO::FETCH_ASSOC);

            ApiResponse::json($record, 201);
        } catch (\Exception $e) {
            ApiResponse::serverError('Failed to record express delay report.', $e->getMessage());
        }
    }

    /**
     * GET /api/express-issues
     * Retrieve logged express delay records with filtering
     */
    public static function getIssues(): void
    {
        $user = Auth::getCurrentUser();
        if (!$user) {
            ApiResponse::unauthorized('Authentication required.');
            return;
        }

        try {
            $db = Database::getConnection();

            $conditions = [];
            $params     = [];

            if (!empty($_GET['startDate'])) {
                $conditions[] = 'DATE(created_at) >= ?';
                $params[]     = $_GET['startDate'];
            }

            if (!empty($_GET['endDate'])) {
                $conditions[] = 'DATE(created_at) <= ?';
                $params[]     = $_GET['endDate'];
            }

            if (!empty($_GET['sa']) && $_GET['sa'] !== 'all') {
                $conditions[] = 'sa_name = ?';
                $params[]     = $_GET['sa'];
            }

            if (!empty($_GET['search'])) {
                $q = '%' . trim($_GET['search']) . '%';
                $conditions[] = '(plate LIKE ? OR customer_name LIKE ? OR vehicle LIKE ? OR reason_category LIKE ? OR reason_details LIKE ?)';
                $params[]     = $q;
                $params[]     = $q;
                $params[]     = $q;
                $params[]     = $q;
                $params[]     = $q;
            }

            $where = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';
            $stmt  = $db->prepare("SELECT * FROM express_lane_issues {$where} ORDER BY created_at DESC");
            $stmt->execute($params);
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

            ApiResponse::json($records);
        } catch (\Exception $e) {
            ApiResponse::serverError('Failed to fetch express delay records.', $e->getMessage());
        }
    }
}
