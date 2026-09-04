# HonTech Operational Revisions Plan: Express Lane 2-Hour SLA Delay Reporting & System-Wide Edit Reason Audit Trail

## Overview
This implementation plan outlines the two core operational and security features requested for the **HonTech AutoCenter Management System**:

### 1. Express Lane 2-Hour SLA Peak Limit Alert & Customer Delay Reporting:
* **Tracks 2-Hour Duration**: Measures elapsed turnaround time for all Express Lane customer vehicles against the 24-hour arrival time benchmark.
* **Proactive Advisor Alert**: Alerts the Service Advisor when a vehicle reaches or exceeds 2 hours in the workshop.
* **Streamlined Delay Reporting Modal**: Provides an intuitive popup modal for the Service Advisor to document root causes and technical remarks without forced lane switching.
* **Automatic Management Records**: Automatically persists delay reports into `express_lane_issues` and mirrors entries into `job_audit_logs`.

### 2. System-Wide Reason-Required Edit Audit Guard:
* **Anti-Tampering Protection**: Protects all saved customer and vehicle records across the entire system against silent or unauthorized modifications.
* **Mandatory Reason Prompt**: Whenever any staff member or administrator edits a saved field (such as departure time, diagnosis, vehicle model, plate number, service category, or status), the system requires a mandatory explanation reason.
* **Immutable Audit Trail**: Stores an immutable change history recording who made the change (Name & Role), what field was modified, old value, new value, exact reason provided, and timestamp.
* **Audit History Timeline**: Provides an Audit History modal (`#modal-job-audit-history`) for the Owner, Admins, and Staff to inspect any vehicle's change log.

---

## 📖 Word-by-Word User Explanations

### 1. How the Express Lane 2-Hour Delay Reporting Works:

1. **A Customer Vehicle Arrives in the Express Lane**:
   * The Service Advisor registers the customer's vehicle (e.g., at 08:00 AM) under the **Express Lane**.
2. **The System Watches the Clock**:
   * The system continuously tracks how many minutes have passed since the 24-hour arrival time (`convertTimeTo24Hour()`).
3. **The 2-Hour Mark is Reached (10:00 AM)**:
   * If the vehicle is still in progress and 2 hours have passed ($\ge 120\text{ min}$), the system alerts the Service Advisor by showing a calm duration indicator on that vehicle's card in the table (`⏱️ Express: 2h 15m`) along with a `📄 Report Reason` button.
4. **The Service Advisor Reports the Delay**:
   * The Service Advisor clicks the **"Report Reason"** button.
   * A modal pops up showing the customer's plate, car model, and total time elapsed (for example, 2 hours and 15 minutes).
   * The Service Advisor selects an operational reason from the list:
     - *Required Parts Delay / Not In Stock*
     - *Additional Deep Diagnostics Required*
     - *Customer Requested Scope Change / Additional Work*
     - *Technician Bay Bottleneck / Lift Availability*
     - *Unforeseen Mechanical Complications*
     - *Others (Specify Custom Reason)*
   * The Service Advisor enters brief operational notes and clicks **"Save Progress Note"**.
5. **The Table Updates Immediately**:
   * The table row immediately reflects the updated state with a clean note badge: `Note: Parts Not in Stock`.
   * This informs everyone on the shop floor that the delay reason has been officially documented.
   * The report is automatically synced to the **Workshop Management Report Center** for Owner and Admin review.

---

### 2. How the Reason-Required Edit System Works (For All Saved Data):

1. **Staff Wants to Correct Saved Data**:
   * Suppose a Service Advisor, Admin, or Owner needs to change a customer's record that was already saved—such as updating Departure Time from 03:00 PM to 04:30 PM, correcting a diagnosis note, or adjusting service category.
2. **The System Asks for a Mandatory Reason**:
   * The moment the staff member modifies the field, a modal prompt appears (`#modal-edit-reason-prompt`) displaying:
     - Field Name Being Modified
     - Previous Saved Value vs. Updated New Value
     - Reason Preset Dropdown (*Typo / Data Entry Correction*, *Customer Requested Scope Change*, *Diagnostic Escalation*, *Technical Re-evaluation*, *Others*)
     - Operational Justification Textbox
3. **Validation & Protection**:
   * If the staff member leaves the reason blank when custom justification is required, the system stops them with an alert: *"Please provide an operational justification reason for this modification."*
   * Once valid justification is provided, they click **"Save Modification"**.
4. **Permanent Audit Record**:
   * The system updates the customer's record in `jobs` and writes a permanent log into the database `job_audit_logs` recording:
     - **Who made the change**: Staff Name and Role (`edited_by_name`, `edited_by_role`, `edited_by_id`)
     - **What field was changed**: `field_name` (e.g., `departure`, `evaluation`, `category`, `laneType`)
     - **What the old value was**: `old_value`
     - **What the new value is**: `new_value`
     - **The exact reason provided**: `edit_reason`
     - **The exact date and time**: `created_at`

---

### 3. How the Owner and Admins Review History:

1. **Viewing a Single Vehicle's Edit History**:
   * The Owner, Admin, or Staff can click the **Audit History** button (`<i data-lucide="history"></i>`) next to any ticket in the table to open `#modal-job-audit-history`.
   * The modal renders a complete chronological timeline displaying every modification made to that specific vehicle, who made it, old/new diffs, and the exact justification reason.
2. **Viewing Management Delay Reports**:
   * The Owner can open the **Reports Tab** (`⚡ Express Lane & Delay Intelligence` / `#db-tab-express`) to view a comprehensive breakdown of all Express Lane jobs exceeding benchmark turnaround, showing which advisor handled them, categorized root causes, Chart.js visualizations, and options to print or export to Excel/CSV.

---

## 🏛️ Database Architecture

### Table: `express_lane_issues`
```sql
CREATE TABLE IF NOT EXISTS `express_lane_issues` (
    `id`                    INT AUTO_INCREMENT PRIMARY KEY,
    `job_id`                VARCHAR(20) NOT NULL,
    `plate`                 VARCHAR(20) NOT NULL,
    `customer_name`         VARCHAR(255) NOT NULL,
    `vehicle`               VARCHAR(255) NOT NULL,
    `sa_name`               VARCHAR(255) NOT NULL,
    `arrival_time`          VARCHAR(10) NOT NULL,
    `elapsed_minutes`       INT NOT NULL DEFAULT 0,
    `reason_category`       VARCHAR(100) NOT NULL,
    `reason_details`        TEXT NOT NULL,
    `reported_by_id`        INT NOT NULL,
    `reported_by_name`      VARCHAR(255) NOT NULL,
    `created_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_job_id` (`job_id`),
    INDEX `idx_plate` (`plate`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: `job_audit_logs`
```sql
CREATE TABLE IF NOT EXISTS `job_audit_logs` (
    `id`                    INT AUTO_INCREMENT PRIMARY KEY,
    `job_id`                VARCHAR(20) NOT NULL,
    `plate`                 VARCHAR(20) NOT NULL,
    `field_name`            VARCHAR(100) NOT NULL,
    `old_value`             TEXT NULL,
    `new_value`             TEXT NULL,
    `edit_reason`           TEXT NOT NULL,
    `edited_by_id`          INT NOT NULL,
    `edited_by_name`        VARCHAR(255) NOT NULL,
    `edited_by_role`        VARCHAR(50) NOT NULL,
    `created_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_job_id` (`job_id`),
    INDEX `idx_plate` (`plate`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
