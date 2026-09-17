# HonTech Automated Script Testing Catalog & Execution Matrix

## Overview
This catalog documents the **automated script testing suite** executed via terminal (`npm.cmd test`). 
Unlike manual QA checklists (which human testers execute via web browsers), this catalog defines deterministic, programmatic assertions that run inside Node.js and PHP CLI in under 5 seconds to verify backend syntax, database connectivity, frontend algorithms, SLA math, and security/RBAC guardrails before any code is committed.

---

## ⚡ Quick Execution Commands
```powershell
# Run the entire test suite (All 27 assertions)
npm.cmd test

# Run only Frontend SLA & Calculation tests
npm.cmd run test:frontend

# Run only Backend & API tests
npm.cmd run test:backend

# Run only Security & RBAC tests
npm.cmd run test:security
```

---

## 📋 Comprehensive Automated Script Test Inventory (27 Passing Assertions)

### Suite 1: Frontend Logic & SLA Calculation (`tests/frontend/sla_and_logic.test.js`)
*Scope: Client-side mathematical engines, XSS defense, field mapping, validation regexes, and 4-role UI capabilities.*

| Test ID | Sub-Category | Assertion / Test Case Description | Verified Logic / Expected Outcome |
| :--- | :--- | :--- | :--- |
| **AUT-FRONT-01** | HTML Sanitization | Escape dangerous characters to prevent XSS injection | Converts `<`, `>`, `&`, `"`, `'` into HTML entities via `escapeHtml()`. |
| **AUT-FRONT-02** | HTML Sanitization | Handle null and undefined inputs safely without throwing | Returns empty string `""` when input is `null` or `undefined`. |
| **AUT-FRONT-03** | Field Label Mapping | Map raw database snake_case keys to human-readable audit labels | Translates `customer_name` ➔ "Customer Name", `bay_number` ➔ "Service Bay", etc. |
| **AUT-FRONT-04** | SLA Math | Compute standard turnaround minutes correctly (< 2 hours) | Calculates exact elapsed minutes between intake timestamp and promise timestamp. |
| **AUT-FRONT-05** | SLA Math | Flag SLA Overdue when turnaround reaches or exceeds 120 minutes | Sets `isOverdue = true` and triggers critical warning when elapsed time $\ge$ 120 min. |
| **AUT-FRONT-06** | SLA Math | Handle overnight / midnight time rollovers gracefully | Accurately calculates elapsed time when intake spans across 23:59 to 00:01. |
| **AUT-FRONT-07** | Format Validation | Validate standard Claim Stub format `MMDDYY-XXX` | Regex verification for valid claim stub format (e.g., `091726-001`). Rejects malformed strings. |
| **AUT-FRONT-08** | Format Validation | Validate Philippine License Plate numbers | Validates standard 3-letter + 4-number (e.g., `ABC 1234`) and classic 3-letter + 3-number (`ABC 123`). |
| **AUT-FRONT-09** | RBAC UI Matrix | Owner should be restricted from changing bay ceiling (View Only) | Owner capability flags confirm view-only restriction on physical workshop bay ceilings. |
| **AUT-FRONT-10** | RBAC UI Matrix | Admin should have unrestricted bay ceiling and staff management | Admin capability flags allow modifying bay count, system settings, and user accounts. |
| **AUT-FRONT-11** | RBAC UI Matrix | Service Advisor should be able to allocate bays but cannot view executive analytics | Service Advisor can assign bays/jobs but is locked out from Owner financial analytics tab. |
| **AUT-FRONT-12** | RBAC UI Matrix | Assistant should be able to encode bookings but locked out from bay operations | Assistant can encode intakes/bookings but cannot change bays or release vehicles. |

---

### Suite 2: Backend Engine & API Integration (`tests/backend/api.test.js`)
*Scope: PHP syntax linting, MariaDB PDO connectivity, routing logic, and authentication endpoints.*

| Test ID | Sub-Category | Assertion / Test Case Description | Verified Logic / Expected Outcome |
| :--- | :--- | :--- | :--- |
| **AUT-BACK-01** | PHP Linting | Pass syntax linting for `router.php` (`php -l`) | Verifies zero fatal parse or syntax errors in top-level development router. |
| **AUT-BACK-02** | PHP Linting | Pass syntax linting for `backend/index.php` (`php -l`) | Verifies zero syntax errors in core API gateway and dispatch handler. |
| **AUT-BACK-03** | PHP Linting | Pass syntax linting for `backend/test_db.php` (`php -l`) | Verifies zero syntax errors in database diagnostic script. |
| **AUT-BACK-04** | PHP Linting | Pass syntax linting for `backend/migration.php` (`php -l`) | Verifies zero syntax errors in automated schema migration script. |
| **AUT-BACK-05** | PHP Linting | Pass syntax linting for `backend/seed.php` (`php -l`) | Verifies zero syntax errors in database seeding script. |
| **AUT-BACK-06** | DB Connectivity | Connect to MariaDB/MySQL successfully via PDO | Validates active PDO connection against port 3307 or 3306 with graceful fallback. |
| **AUT-BACK-07** | HTTP Endpoints | Verify live HTTP router responses if local server is active | Tests HTTP `GET /api/status` or `GET /` when server is running via `npm.cmd run dev`. |
| **AUT-BACK-08** | Authentication | Reject invalid login credentials with proper error response | Ensures incorrect email/password combinations return HTTP 401 with JSON error message. |

---

### Suite 3: Security, RBAC & Data Integrity (`tests/security/security.test.js`)
*Scope: SQL Injection defense, parameterized queries, route authorization boundaries, and PIN security.*

| Test ID | Sub-Category | Assertion / Test Case Description | Verified Logic / Expected Outcome |
| :--- | :--- | :--- | :--- |
| **AUT-SEC-01** | SQL Static Audit | Verify all SQL queries in backend repositories use PDO parameter binding | Scans all backend repository files; fails if any dynamic string concatenation (`$query = "SELECT ... " . $val`) is detected. |
| **AUT-SEC-02** | Input Sanitization | Safely escape common SQL injection payloads in input sanitizers | Validates that injection strings like `' OR '1'='1`, `1; DROP TABLE users;--` are neutralized. |
| **AUT-SEC-03** | RBAC Boundaries | Strictly deny Assistant role access to Admin/Owner capabilities | Verifies assistant token cannot access `/api/admin/*` or `/api/system/settings`. |
| **AUT-SEC-04** | RBAC Boundaries | Strictly deny Service Advisor access to Owner Executive Analytics | Verifies advisor token receives 403 Forbidden on `/api/analytics/financial`. |
| **AUT-SEC-05** | Auth Enforcement | Require 401 Unauthorized for unauthenticated protected API requests | Verifies requests lacking `Authorization: Bearer <token>` are immediately rejected. |
| **AUT-SEC-06** | PIN Validation | Strictly validate that security recovery PIN is exactly 4 numeric digits | Validates recovery PIN format against `/^\d{4}$/` regex. Rejects letters, symbols, or lengths $\ne 4$. |
| **AUT-SEC-07** | Password Security | Enforce minimum password strength requirements | Requires passwords to meet minimum 6-character length and complexity checks. |

---

## 🔄 How the AI Uses This Script Testing List During Development

Whenever the AI makes changes to the system:
1. **Runs Existing Suite First:** AI executes `npm.cmd test` to verify no existing functionality is broken.
2. **Adds New Assertions for New Features:** When a new feature or fix is added (e.g. 90-minute delay alert), the AI adds a new test case (e.g. `AUT-FRONT-13`) in `tests/frontend/sla_and_logic.test.js`.
3. **Appends to This Catalog:** The AI adds the new test row to this table.
4. **Zero-Fail Guarantee:** If any test in this catalog fails, the AI will not commit or push until it has diagnosed and resolved the issue.
