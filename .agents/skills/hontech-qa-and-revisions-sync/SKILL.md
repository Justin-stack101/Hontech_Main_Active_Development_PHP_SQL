---
name: hontech-qa-and-revisions-sync
description: Automated standard operating procedure for synchronizing code changes across REVISIONS_LOG.md, Revisions checklist.csv, HONTECH_QA_TEST_CHECKLIST.csv, terminal test suites (tests/), and GitHub commit history. Enforces whole-system regression prevention, self-debugging, and 1:1 GitHub commit traceability.
---

# HonTech QA, Revisions, Testing & GitHub Commit Sync Skill

This skill governs the mandatory synchronization process whenever any code, UI, backend feature, or test suite is altered in the HonTech Operations System.

---

## 🎯 The Core Philosophy: "No Blind Changes, No Broken Modules, 100% Traceability"
Whenever you make a modification:
1. **Never break existing modules:** The 5 core operational views (Master Daily Intakes, Online Booking, Carry-Over Table, TV Monitor, Owner Analytics) and the 4 user roles (Owner, Admin, Service Advisor, Assistant) must remain 100% functional.
2. **Never leave groupmates guessing:** Every single change must produce a corresponding manual QA test case in `HONTECH_QA_TEST_CHECKLIST.csv` so Catherine and the QA team know exactly what to test in the browser.
3. **Never push unverified code:** Developers must execute `npm.cmd test` to verify that frontend math, backend API endpoints, and security barriers are intact.
4. **Always maintain 1:1 GitHub Traceability:** Every commit to GitHub must link to its corresponding Task ID from `Revisions checklist.csv` (e.g. `feat(REV-071): ...`).

---

## 📋 File-by-File Synchronization Specifications

### 1. `Revisions checklist.csv`
- **Location:** Workspace root (`Revisions checklist.csv`).
- **Format:**
  ```csv
  "Task_ID","Date_Requested","Requested_By","Target_Role","Module_Section","Specification_Task","Implementation_Status","Git_Commit","Git_Branch","Verified_By","Implementation_Remarks"
  ```
- **Rules:**
  - Check the latest `Task_ID` (e.g., `REV-070`) and increment by 1 (e.g., `"REV-071"`).
  - Target Role must be specific (`"Owner"`, `"SA"`, `"Assistant"`, `"Admin"`, or `"All Roles"`).
  - `Implementation_Status`: `"Done"` once coded and tested.
  - `Git_Branch`: Must match the active branch (e.g. `"prototype_process"` or `"branch2-Security-Account-Recovery"`).
  - `Git_Commit`: The actual short commit hash (e.g. `"a3b9f12"` or `"HEAD"` prior to commit).
  - `Verified_By`: `"Antigravity QA & Automated Test Suite"`.

### 2. `REVISIONS_LOG.md`
- **Location:** Workspace root (`REVISIONS_LOG.md`).
- **Format:**
  ```markdown
  ### 🛠️ [Feature / Module Name] (vX.XX)
  * **Objective & Context**: Explain why the change was made and what problem it solves.
  * **Core Changes Made**:
    - Bullet point breakdown of specific frontend DOM elements, tables, or backend controllers modified.
  * **Automated & Manual QA Verification**:
    - List verified automated test assertions and manual test IDs.
  * **Cache Busting**: Note the updated script version in `frontend/index.html` (e.g. `js/app.js?v=5.XX`).
  ```

### 3. `HONTECH_QA_TEST_CHECKLIST.csv`
- **Location:** `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
- **Format:**
  ```csv
  Test ID,Testing Risk Tier,Module / Category,Target Role,Action Under Test,Expected Behavior,Status (Pass/Fail/Pending),Tester Notes / Observed Behavior
  ```
- **ID Conventions:**
  - `AUTH-XX`: Authentication, Google OAuth, Password Recovery, Sessions.
  - `SA-XX`: Service Advisor workflow (Intakes, Bay assignment, Diagnoses).
  - `AST-XX`: Assistant Staff workflow (Online bookings, inquiries).
  - `OWN-XX`: Owner / Admin Analytics, Staff Management, Branch Settings.
  - `TV-XX`: TV Monitor, Audio Chime, Voice Announcements.
  - `SLA-XX`: 2-Hour Express PMS Turnaround & Delay Reporting.
  - `SEC-XX`: RBAC Route Protection, SQL Injection Guard, Security Headers.
  - `CLI-XX`: Terminal Dev Tools & Automated Test Runner execution.
- **Rule:** When adding a feature, append the new test row with `Status` set to `"Pending"` so the QA team can execute and mark it `"Pass"`.

### 4. `tests/` Automated Test Harness
- **Location:** `tests/` at workspace root.
  - `tests/frontend/`: Logic, SLA calculations, role mappings, sanitization.
  - `tests/backend/`: PHP API endpoints, DB connectivity, JSON schema responses.
  - `tests/security/`: 401/403 RBAC boundaries, SQL injection resilience.
- **Rule:** Always run `npm.cmd test`. If any assertion fails:
  1. Read the error trace.
  2. Inspect the modified file.
  3. Fix the underlying bug (self-debug) until all tests report green.

### 5. GitHub Commit & Remote Push Protocol
- **Format Standard:**
  ```bash
  git add .
  git commit -m "<type>(REV-XXX): <concise summary of changes>"
  git push origin <active-branch>
  ```
- **Commit Types:**
  - `feat(REV-XXX)`: New user capability, screen, or operational tool.
  - `fix(REV-XXX)`: Bug fix, DOM error correction, layout adjustment.
  - `test(REV-XXX)`: Adding or updating automated script test assertions.
  - `docs(REV-XXX)`: Updating manuals, guides, or QA matrices.
  - `refactor(REV-XXX)`: Code reorganization without changing external behavior.
- **Sync Hash:** Update the `Git_Commit` column in `Revisions checklist.csv` with the commit hash produced by Git.

---

## 🛡️ Backend Data & PDO Safety Rules
1. Never write raw concatenated SQL queries (`"SELECT * FROM jobs WHERE plate = '" . $plate . "'"` is STRICTLY FORBIDDEN).
2. Always use PDO parameter binding:
   ```php
   $stmt = $db->prepare("SELECT * FROM jobs WHERE plate = :plate AND is_deleted = 0");
   $stmt->execute([':plate' => $plate]);
   ```
3. Always verify that JSON responses are wrapped in `ApiResponse::success(...)` or `ApiResponse::error(...)`.
4. Never delete records with `DELETE FROM ...`. Always set `is_deleted = 1` for soft deletion audit preservation.
