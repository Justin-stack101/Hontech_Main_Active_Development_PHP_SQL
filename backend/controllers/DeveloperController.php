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
}
