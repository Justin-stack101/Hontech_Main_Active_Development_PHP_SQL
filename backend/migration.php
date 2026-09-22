<?php
require_once __DIR__ . '/vendor/autoload.php';

use App\Config\Env;
use App\Config\Database;

Env::load();

try {
    $db = Database::getConnection();
    echo "SUCCESS: Connected to database successfully!\n";

    // 1. Alter users table to add is_deleted if it doesn't exist
    $checkUsersQuery = $db->query("SHOW COLUMNS FROM `users` LIKE 'is_deleted'");
    if ($checkUsersQuery->rowCount() === 0) {
        $db->exec("ALTER TABLE `users` ADD COLUMN `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_active`");
        echo "SUCCESS: Added `is_deleted` column to `users` table.\n";
    } else {
        echo "INFO: `is_deleted` column already exists in `users` table.\n";
    }

    // 2. Alter jobs table to add is_deleted if it doesn't exist
    $checkJobsQuery = $db->query("SHOW COLUMNS FROM `jobs` LIKE 'is_deleted'");
    if ($checkJobsQuery->rowCount() === 0) {
        $db->exec("ALTER TABLE `jobs` ADD COLUMN `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`");
        echo "SUCCESS: Added `is_deleted` column to `jobs` table.\n";
    } else {
        echo "INFO: `is_deleted` column already exists in `jobs` table.\n";
    }

    // 2.1 Add address column to jobs
    $checkCol = $db->query("SHOW COLUMNS FROM `jobs` LIKE 'address'");
    if ($checkCol->rowCount() === 0) {
        $db->exec("ALTER TABLE `jobs` ADD COLUMN `address` VARCHAR(255) NULL AFTER `name`");
        echo "SUCCESS: Added `address` column to `jobs` table.\n";
    }

    // 2.2 Add km_reading column to jobs
    $checkCol = $db->query("SHOW COLUMNS FROM `jobs` LIKE 'km_reading'");
    if ($checkCol->rowCount() === 0) {
        $db->exec("ALTER TABLE `jobs` ADD COLUMN `km_reading` INT NULL AFTER `vehicle`");
        echo "SUCCESS: Added `km_reading` column to `jobs` table.\n";
    }

    // 2.3 Add engine_no column to jobs
    $checkCol = $db->query("SHOW COLUMNS FROM `jobs` LIKE 'engine_no'");
    if ($checkCol->rowCount() === 0) {
        $db->exec("ALTER TABLE `jobs` ADD COLUMN `engine_no` VARCHAR(100) NULL AFTER `km_reading`");
        echo "SUCCESS: Added `engine_no` column to `jobs` table.\n";
    }

    // 2.4 Add color column to jobs
    $checkCol = $db->query("SHOW COLUMNS FROM `jobs` LIKE 'color'");
    if ($checkCol->rowCount() === 0) {
        $db->exec("ALTER TABLE `jobs` ADD COLUMN `color` VARCHAR(50) NULL AFTER `engine_no`");
        echo "SUCCESS: Added `color` column to `jobs` table.\n";
    }

    // 2.5 Add is_backjob column to jobs
    $checkCol = $db->query("SHOW COLUMNS FROM `jobs` LIKE 'is_backjob'");
    if ($checkCol->rowCount() === 0) {
        $db->exec("ALTER TABLE `jobs` ADD COLUMN `is_backjob` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`");
        echo "SUCCESS: Added `is_backjob` column to `jobs` table.\n";
    }

    // 2.6 Add parent_job_id column to jobs
    $checkCol = $db->query("SHOW COLUMNS FROM `jobs` LIKE 'parent_job_id'");
    if ($checkCol->rowCount() === 0) {
        $db->exec("ALTER TABLE `jobs` ADD COLUMN `parent_job_id` VARCHAR(50) NULL AFTER `is_backjob`");
        echo "SUCCESS: Added `parent_job_id` column to `jobs` table.\n";
    }

    // 2.7 Add backjob_reason column to jobs
    $checkCol = $db->query("SHOW COLUMNS FROM `jobs` LIKE 'backjob_reason'");
    if ($checkCol->rowCount() === 0) {
        $db->exec("ALTER TABLE `jobs` ADD COLUMN `backjob_reason` TEXT NULL AFTER `parent_job_id`");
        echo "SUCCESS: Added `backjob_reason` column to `jobs` table.\n";
    }

    // 2.8 Widen source column to support Returning, Back-Job, etc.
    $db->exec("ALTER TABLE `jobs` MODIFY COLUMN `source` VARCHAR(50) NOT NULL DEFAULT 'Walk-in'");
    echo "SUCCESS: Widened `source` column on `jobs` table.\n";

    // 2.9 Password reset columns (hashed one-time code, expiry, failed-attempt counter)
    $resetColumns = [
        'reset_otp'              => "VARCHAR(64) NULL DEFAULT NULL",
        'reset_token_expires_at' => "DATETIME NULL DEFAULT NULL",
        'reset_attempts'         => "TINYINT UNSIGNED NOT NULL DEFAULT 0",
    ];
    foreach ($resetColumns as $column => $definition) {
        $checkCol = $db->query("SHOW COLUMNS FROM `users` LIKE '{$column}'");
        if ($checkCol->rowCount() === 0) {
            $db->exec("ALTER TABLE `users` ADD COLUMN `{$column}` {$definition}");
            echo "SUCCESS: Added `{$column}` column to `users` table.\n";
        }
    }
    // reset_otp previously held plaintext 6-digit codes; widen so it can hold an HMAC-SHA256 hex digest
    $db->exec("ALTER TABLE `users` MODIFY COLUMN `reset_otp` VARCHAR(64) NULL DEFAULT NULL");
    // Invalidate any codes issued before hashing was introduced
    $db->exec("UPDATE `users` SET `reset_otp` = NULL, `reset_token_expires_at` = NULL, `reset_attempts` = 0 WHERE `reset_otp` IS NOT NULL AND CHAR_LENGTH(`reset_otp`) < 64");
    echo "SUCCESS: Password reset columns verified.\n";

    // 3. Create branches table
    $db->exec("CREATE TABLE IF NOT EXISTS `branches` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL UNIQUE,
        `code` VARCHAR(50) NOT NULL UNIQUE,
        `is_active` TINYINT(1) NOT NULL DEFAULT 1,
        `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
        `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    echo "SUCCESS: `branches` table verified/created.\n";

    // 4. Seed branches
    $checkBranchA = $db->prepare("SELECT id FROM `branches` WHERE `name` = ? OR `code` = ?");
    $checkBranchA->execute(['Branch A', 'BR-A']);
    if ($checkBranchA->rowCount() === 0) {
        $db->exec("INSERT INTO `branches` (`name`, `code`, `is_active`, `is_deleted`) VALUES ('Branch A', 'BR-A', 1, 0)");
        echo "SUCCESS: Seeded Branch A.\n";
    }
    
    $checkBranchB = $db->prepare("SELECT id FROM `branches` WHERE `name` = ? OR `code` = ?");
    $checkBranchB->execute(['Branch B', 'BR-B']);
    if ($checkBranchB->rowCount() === 0) {
        $db->exec("INSERT INTO `branches` (`name`, `code`, `is_active`, `is_deleted`) VALUES ('Branch B', 'BR-B', 1, 0)");
        echo "SUCCESS: Seeded Branch B.\n";
    }

    echo "SUCCESS: Migration completed successfully!\n";

} catch (Exception $e) {
    echo "ERROR: Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
