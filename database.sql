-- ============================================================
-- HonTech AutoCenter Operations System - MySQL Database Schema
-- Migrated from MongoDB/Mongoose to MySQL (MariaDB via XAMPP)
-- ============================================================

CREATE DATABASE IF NOT EXISTS `hontech` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hontech`;

-- ============================================================
-- USERS TABLE
-- Maps from: backend/models/User.js (Mongoose Schema)
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
    `id`                        INT AUTO_INCREMENT PRIMARY KEY,
    `name`                      VARCHAR(255) NOT NULL,
    `email`                     VARCHAR(255) NOT NULL UNIQUE,
    `password`                  VARCHAR(255) NOT NULL,
    `role`                      ENUM('owner','admin','assistant','sa') NOT NULL DEFAULT 'assistant',
    `branch`                    VARCHAR(100) NOT NULL DEFAULT 'Branch A',
    `is_active`                 TINYINT(1) NOT NULL DEFAULT 1,

    -- Password Reset (disabled but schema preserved)
    `reset_password_token`      VARCHAR(255) NULL DEFAULT NULL,
    `reset_password_expires`    DATETIME NULL DEFAULT NULL,

    -- Google SSO Integration
    `google_id`                 VARCHAR(255) NULL DEFAULT NULL,
    `google_email`              VARCHAR(255) NULL DEFAULT NULL,

    -- Backup Recovery Email
    `backup_email`              VARCHAR(255) NULL DEFAULT NULL,
    `backup_email_otp`          VARCHAR(10) NULL DEFAULT NULL,
    `backup_email_otp_expires`  DATETIME NULL DEFAULT NULL,

    -- Email Change Verification
    `new_email_pending`         VARCHAR(255) NULL DEFAULT NULL,
    `new_email_otp`             VARCHAR(10) NULL DEFAULT NULL,
    `new_email_otp_expires`     DATETIME NULL DEFAULT NULL,

    -- Multi-Factor Authentication (TOTP)
    `mfa_secret`                VARCHAR(255) NULL DEFAULT NULL,
    `mfa_enabled`               TINYINT(1) NOT NULL DEFAULT 0,
    `backup_codes`              TEXT NULL DEFAULT NULL,

    -- Presence / Online Status
    `is_online`                 TINYINT(1) NOT NULL DEFAULT 0,
    `last_active`               DATETIME NULL DEFAULT NULL,

    -- Timestamps
    `created_at`                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    UNIQUE INDEX `idx_google_id` (`google_id`),
    INDEX `idx_google_email` (`google_email`),
    INDEX `idx_role` (`role`),
    INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- JOBS TABLE
-- Maps from: backend/models/Job.js (Mongoose Schema)
-- ============================================================
CREATE TABLE IF NOT EXISTS `jobs` (
    `id`                    INT AUTO_INCREMENT PRIMARY KEY,
    `job_id`                VARCHAR(20) NOT NULL UNIQUE,
    `source`                ENUM('Walk-in','Online') NOT NULL,
    `plate`                 VARCHAR(20) NOT NULL,
    `name`                  VARCHAR(255) NOT NULL,
    `contact`               VARCHAR(50) NULL DEFAULT NULL,
    `vehicle`               VARCHAR(255) NOT NULL,
    `category`              VARCHAR(100) NOT NULL,
    `concern`               TEXT NULL DEFAULT NULL,

    -- Lane Assignment
    `lane_type`             VARCHAR(50) NOT NULL DEFAULT '',

    -- Scheduling
    `date_received`         DATE NOT NULL,
    `arrival`               VARCHAR(10) NOT NULL DEFAULT '',
    `departure`             VARCHAR(10) NOT NULL DEFAULT '',
    `appt_date`             DATE NULL DEFAULT NULL,
    `appt_time`             VARCHAR(10) NOT NULL DEFAULT '',
    `confirmed`             TINYINT(1) NOT NULL DEFAULT 0,

    -- Tracking
    `claim_stub`            VARCHAR(30) NOT NULL DEFAULT '',
    `parts_available`       VARCHAR(20) NOT NULL DEFAULT 'Pending',
    `evaluation`            TEXT NOT NULL DEFAULT (''),
    `status`                VARCHAR(50) NOT NULL DEFAULT 'Pending',
    `location`              VARCHAR(20) NOT NULL DEFAULT 'None',
    `branch`                VARCHAR(20) NOT NULL DEFAULT 'Branch A',
    `bay_assigned`          INT NULL DEFAULT NULL,
    `promised_date`         DATE NULL DEFAULT NULL,
    `carry_over_status`     VARCHAR(255) NOT NULL DEFAULT '',
    `remarks`               TEXT NOT NULL DEFAULT (''),
    `sa_name`               VARCHAR(255) NOT NULL DEFAULT '',

    -- Performance / Goal Tracking
    `goal_status`           VARCHAR(20) NOT NULL DEFAULT 'N/A',

    -- Recommendation Workflow
    `recommendation`        VARCHAR(30) NOT NULL DEFAULT 'None',
    `recommendation_notes`  TEXT NOT NULL DEFAULT (''),

    -- Completion
    `date_completed`        DATE NULL DEFAULT NULL,

    -- Timestamps
    `created_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX `idx_status` (`status`),
    INDEX `idx_branch` (`branch`),
    INDEX `idx_date_received` (`date_received`),
    INDEX `idx_date_completed` (`date_completed`),
    INDEX `idx_source` (`source`),
    INDEX `idx_plate` (`plate`),
    INDEX `idx_name` (`name`),
    INDEX `idx_claim_stub` (`claim_stub`),
    INDEX `idx_vehicle` (`vehicle`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
