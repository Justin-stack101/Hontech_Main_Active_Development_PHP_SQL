<?php
namespace App\Controllers;

use App\Config\Database;
use App\Config\Env;
use App\Utils\ApiResponse;
use App\Utils\EmailUtils;

/**
 * Developer Sandbox Controller
 * 
 * Handles simulated email mailbox features and development database seed resets.
 */
class DeveloperController
{
    /**
     * GET /api/auth/developer/emails
     */
    public static function getSimulatedEmails(): void
    {
        try {
            $emails = EmailUtils::getSimulatedEmails();
            ApiResponse::json($emails);
        } catch (\Exception $e) {
            ApiResponse::serverError('Error fetching simulated developer emails.', $e->getMessage());
        }
    }

    /**
     * DELETE /api/auth/developer/emails
     */
    public static function clearSimulatedEmails(): void
    {
        try {
            EmailUtils::clearSimulatedEmails();
            ApiResponse::json(['message' => 'Simulated developer mailbox cleared.']);
        } catch (\Exception $e) {
            ApiResponse::serverError('Error clearing developer emails.', $e->getMessage());
        }
    }

    /**
     * PATCH /api/auth/developer/emails/{id}/read
     */
    public static function markEmailRead(string $id): void
    {
        try {
            EmailUtils::markEmailAsRead($id);
            ApiResponse::json(['message' => 'Email marked as read.']);
        } catch (\Exception $e) {
            ApiResponse::serverError('Error updating email status.', $e->getMessage());
        }
    }

    /**
     * POST /api/auth/developer/reset-seed
     */
    public static function resetSeedDev(): void
    {
        try {
            Env::load();
            if (Env::get('APP_ENV', 'development') !== 'development') {
                ApiResponse::forbidden('Database reset/seeding is only allowed in development environment.');
                return;
            }

            $db = Database::getConnection();
            $db->exec("SET FOREIGN_KEY_CHECKS = 0;");
            $db->exec("TRUNCATE TABLE jobs;");
            $db->exec("TRUNCATE TABLE users;");
            $db->exec("SET FOREIGN_KEY_CHECKS = 1;");

            // Execute seeder file in output buffer to capture stdout
            ob_start();
            require __DIR__ . '/../seed.php';
            $log = ob_get_clean();

            ApiResponse::json([
                'message' => 'Database successfully wiped and re-seeded!',
                'log'     => $log
            ]);
        } catch (\Exception $e) {
            ApiResponse::serverError('Error during developer reset/seeding.', $e->getMessage());
        }
    }

    /**
     * POST /api/auth/developer/clear-audit-logs
     */
    public static function clearAuditLogs(): void
    {
        try {
            $db = Database::getConnection();
            $db->exec("TRUNCATE TABLE express_lane_issues;");
            $db->exec("TRUNCATE TABLE job_audit_logs;");

            ApiResponse::json([
                'message' => 'Test express issues and audit trail logs cleared successfully.'
            ]);
        } catch (\Exception $e) {
            ApiResponse::serverError('Failed to clear audit logs.', $e->getMessage());
        }
    }

    /**
     * POST /api/auth/developer/simulate-express-overdue
     */
    public static function simulateExpressOverdue(): void
    {
        try {
            $db = Database::getConnection();

            // Calculate arrival time as 2 hours and 15 minutes ago
            $now = new DateInterval('PT2H15M');
            $arrDate = new \DateTime();
            $arrDate->sub($now);
            $arrTime24 = $arrDate->format('H:i');

            $testPlate = 'SIM-' . rand(100, 999);
            $jobId     = 'JOB-SIM-' . time();
            $stubNum   = 'EX-' . date('d') . '-' . rand(100, 999);

            $stmt = $db->prepare('
                INSERT INTO jobs 
                (job_id, claim_stub, plate, name, vehicle, contact, category, lane_type, source, date_received, arrival, evaluation, status, branch, sa_name)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?)
            ');

            $stmt->execute([
                $jobId,
                $stubNum,
                $testPlate,
                'Dev Simulation Customer',
                'Toyota Vios (Simulated 2H Overrun)',
                '09170009999',
                'PMS',
                'Express Lane',
                'Walk-in',
                $arrTime24,
                'Simulated 2-hour overdue Express Lane vehicle',
                'Waiting',
                'Branch A',
                'Front Desk SA'
            ]);

            $fetchStmt = $db->prepare('SELECT * FROM jobs WHERE job_id = ?');
            $fetchStmt->execute([$jobId]);
            $job = $fetchStmt->fetch();

            ApiResponse::json([
                'message' => "Simulated 2H overdue vehicle {$testPlate} created (Arrival: {$arrTime24})",
                'job'     => JobController::normalizeJob($job)
            ], 201);
        } catch (\Exception $e) {
            ApiResponse::serverError('Failed to simulate express overdue job.', $e->getMessage());
        }
    }
}

