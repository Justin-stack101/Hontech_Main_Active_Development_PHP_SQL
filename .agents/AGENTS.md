# HonTech Project Agent Directives & Behavioral Guidelines

## Overview
This document defines project-specific guidelines, architectural rules, and quality standards for the **HonTech AutoCenter Management System**.

---

## 🔄 Mandatory 6-Stage AI Closed-Loop Lifecycle
Whenever the AI is requested to make any changes (features, bug fixes, UI adjustments, or backend modifications), it **MUST** execute this complete 6-stage loop without skipping any stage:

1. **Stage 1: Pre-Flight Context Reading & Ingestion**
   - Read the master blueprint: [`Hontech Documentation/Technical/HONTECH_SYSTEM_ARCHITECTURE_AND_USER_JOURNEY_MAP.md`](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Prototype_Process/Hontech%20Documentation/Technical/HONTECH_SYSTEM_ARCHITECTURE_AND_USER_JOURNEY_MAP.md).
   - Review existing schema rules and the most recent entries in `REVISIONS_LOG.md` and `Revisions checklist.csv`.
   - Never write code based on assumptions; ground all changes in existing architectural patterns and user journey steps.

2. **Stage 2: Implementation, Defensive Coding & Cache Busting**
   - **Backend Guardrails:** Use PDO prepared statements with parameter binding for all queries. Always filter active records using `is_deleted = 0`. Use `App\Utils\ApiResponse` for JSON responses.
   - **Frontend Guardrails:** Always perform defensive DOM checks (`if (document.getElementById('...'))`) before accessing properties (`.innerText`, `.classList`, `.style`) to prevent `TypeError` exceptions.
   - **Cache Busting:** Always increment the query parameter version in `frontend/index.html` (e.g. `js/app.js?v=5.xx`) whenever modifying client scripts or styles to prevent stale browser caching.

3. **Stage 3: Whole-System Integrity Check & Auto-Debugging**
   - **Cross-Module Verification:** Verify that changes in one module do NOT break other core modules:
     - Master Daily Intakes Queue (`#container-daily-intakes`)
     - Online Booking Module (`#container-online-queue`)
     - Carry-Over Data Table (`#container-carry-over`)
     - Wireless Smart TV Monitor (`frontend/tv.html` & `#section-tv`)
     - Executive Analytics & Audit Logs (`#db-tab-analytics`, `#db-tab-audits`)
     - 4-Role RBAC (Owner, Admin, Service Advisor, Assistant)
   - **Self-Debugging Mandate:** Run automated test scripts via `npm.cmd test`. If any test fails or any module breaks, the AI must diagnose the root cause and self-debug immediately before concluding the task.

4. **Stage 4: Track A — Manual QA Checklist Synchronization**
   - Whenever modifying or adding a feature, append a new testing row to `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
   - Specify: `Test ID` (e.g. `AUTH-XX`, `SA-XX`, `AST-XX`, `OWN-XX`, `TV-XX`, `SEC-XX`), `Testing Risk Tier`, `Target Role`, `Action Under Test`, and `Expected Behavior` so human QA testers (Catherine & Mary Dayne) have an explicit checklist to verify.

5. **Stage 5: Track B — Automated Script Testing & Revisions Logging**
   - Update or add automated assertions in `tests/` (`tests/frontend/`, `tests/backend/`, `tests/security/`).
   - Append a detailed entry in `REVISIONS_LOG.md` detailing what changed, tables affected, and version.
   - Append a new tracking row in `Revisions checklist.csv` with the next sequential `Task_ID` (e.g. `REV-071`), Date, Role, and Remarks.

6. **Stage 6: GitHub Commit Traceability & Remote Sync**
   - Stage all modified files, tests, and documentation (`git add .`).
   - Create a semantic commit with explicit Task ID traceability:
     `git commit -m "<type>(REV-XXX): <description>"`
     *(Types: `feat`, `fix`, `docs`, `test`, `refactor`)*
   - Sync the short commit hash (`git rev-parse --short HEAD`) into `Revisions checklist.csv`.
   - Push cleanly to the active remote branch (`git push origin <active-branch>`).

---

## 🛡️ Security & Authentication Rules
1. **Defensive DOM Operations**: Always verify element existence (`if (document.getElementById('...'))`) before accessing properties (`.innerText`, `.classList`, `.style`) to prevent uncaught `TypeError` crashes during `buildNavbar()` or view switches.
2. **Account Recovery & Auth**: Ensure password reset tokens and PIN verification flows follow strict input validation and display actionable toast feedback.
3. **High-Contrast Developer Exception Diagnostics**: Maintain the high-contrast developer error overlay for uncaught runtime exceptions, with functional Export Log (`.txt`), Copy Trace, and Database Seed Reset buttons.

---

## 🗄️ Data Layer & API Rules
1. **SQL PDO Property Normalization**: The PHP MySQL backend returns snake_case columns and numeric flags (`id`, `is_active` [0/1], `is_online` [0/1]). Always normalize user and job properties with robust fallbacks:
   ```javascript
   const userId = user.id ?? user._id;
   const isActive = user.is_active !== undefined ? Number(user.is_active) === 1 : (user.isActive !== false);
   const isOnline = user.is_online !== undefined ? Number(user.is_online) === 1 : Boolean(user.isOnline);
   ```
2. **Defensive Array Guarding**: Always ensure arrays are valid before invoking `.map()`, `.filter()`, or `.sort()` (e.g. `const safeJobs = Array.isArray(allJobs) ? allJobs : [];`).
3. **Prepared Statements**: Every SQL query must use parameterized prepared statements to prevent SQL injection vulnerabilities.

---

## 📊 UI & Analytics Guidelines
1. **Analytics Table Integrity**: Ensure `#table-analytics-body` is properly populated with record log entries when date ranges or SA/Status filters change.
2. **Chart Rendering**: Always verify `typeof Chart !== 'undefined'` before initializing Chart.js canvases to prevent script execution blockages in offline environments.

---

## 🌿 Development & Git Workflow
1. **Terminal Development Standard**: Developers run local operations using `npm.cmd run dev` (which launches `php -S 0.0.0.0:8000 router.php`) and test via `npm.cmd test`.
2. **Active Branch Discipline**: Ensure work is committed and pushed to the current working branch (e.g. `prototype_process` or `branch2-Security-Account-Recovery`).
3. **Main Branch Protection**: Preserve `main` as the stable client backup.
