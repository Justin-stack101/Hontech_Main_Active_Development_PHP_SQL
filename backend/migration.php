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
    $checkBranchA = $db->prepare("SELECT id FROM `branches` WHERE `name` = ?");
    $checkBranchA->execute(['Branch A']);
    if ($checkBranchA->rowCount() === 0) {
        $db->exec("INSERT INTO `branches` (`name`, `code`, `is_active`, `is_deleted`) VALUES ('Branch A', 'BR-A', 1, 0)");
        echo "SUCCESS: Seeded Branch A.\n";
    }
    
    $checkBranchB = $db->prepare("SELECT id FROM `branches` WHERE `name` = ?");
    $checkBranchB->execute(['Branch B']);
    if ($checkBranchB->rowCount() === 0) {
        $db->exec("INSERT INTO `branches` (`name`, `code`, `is_active`, `is_deleted`) VALUES ('Branch B', 'BR-B', 1, 0)");
        echo "SUCCESS: Seeded Branch B.\n";
    }

    echo "SUCCESS: Migration completed successfully!\n";

} catch (Exception $e) {
    echo "ERROR: Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
