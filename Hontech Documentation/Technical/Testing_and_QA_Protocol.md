# HonTech Manual QA Testing Protocol & Bug Report Matrix

This document provides a repeatable, structured QA Test Matrix to preserve system functionality, verify backend SOLID refactoring changes, and log runtime issues systematically.

---

## 🧪 System QA Test Matrix

### 1. Core Authentication & Session Security

| Test ID | Feature Area | Test Scenario | Expected Behavior | Status |
| :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | User Login | Enter valid credentials (`owner@hontech.com` / `owner123`). | Returns JWT cookie, logs user in, and renders Owner Dashboard. | 🟢 PASS |
| **AUTH-02** | Invalid Login | Enter incorrect password. | Displays error toast: *"Invalid credentials"* (401 status). | 🟢 PASS |
| **AUTH-03** | MFA Verification | Log in with an account having `mfa_enabled = 1`. | Prompts for 6-digit MFA code before issuing session cookie. | 🟢 PASS |
| **AUTH-04** | Session Auto-Sync | Refresh browser tab while logged in. | Calls `/api/auth/me` with `credentials: 'include'` and stays logged in. | 🟢 PASS |
| **AUTH-05** | User Logout | Click **Sign Out** from settings menu. | Clears token cookie, destroys active session, and redirects to Login. | 🟢 PASS |

---

### 2. Staff Roster Management (`StaffController.php`)

| Test ID | Feature Area | Test Scenario | Expected Behavior | Status |
| :--- | :--- | :--- | :--- | :--- |
| **STAF-01** | Fetch Roster | Navigate to Staff Access tab as Owner/Admin. | Returns JSON array of active staff accounts. | 🟢 PASS |
| **STAF-02** | Create Staff | Click **Add Staff**, enter details, select role (`sa`), submit. | Creates user account, hashes password, and updates roster table. | 🟢 PASS |
| **STAF-03** | Update Details | Edit staff name, email, or assigned branch. | Updates `users` table record successfully. | 🟢 PASS |
| **STAF-04** | Toggle Active | Click toggle switch to deactivate a staff account. | Updates `is_active = 0`. Deactivated accounts cannot log in. | 🟢 PASS |
| **STAF-05** | Protect Owner | Admin attempts to edit or deactivate an Owner account. | Returns 403 Forbidden (*"Owner role is protected"*). | 🟢 PASS |

---

### 3. Password Recovery & Developer Sandbox (`DeveloperController.php`)

| Test ID | Feature Area | Test Scenario | Expected Behavior | Status |
| :--- | :--- | :--- | :--- | :--- |
| **RECO-01** | Forgot Password | Submit email on **Forgot Password** form. | Generates reset token & 6-digit OTP, dispatching to simulated mailbox. | 🟢 PASS |
| **RECO-02** | Dev Mailbox | Open **Dev Mailbox Drawer** from top navbar or login page. | Displays incoming simulated verification emails with 1-click OTP copy. | 🟢 PASS |
| **RECO-03** | Reset Password | Enter 6-digit OTP and new password. | Replaces password hash and enables login with new credentials. | 🟢 PASS |
| **RECO-04** | Seed Reset API | Click **Reset & Seed DB** inside developer crash overlay. | Triggers `POST /api/auth/developer/reset-seed`, truncating tables and running seeder. | 🟢 PASS |

---

### 4. System Exceptions & Error Diagnostics

| Test ID | Feature Area | Test Scenario | Expected Behavior | Status |
| :--- | :--- | :--- | :--- | :--- |
| **DIAG-01** | Crash Reporter | Evaluate `throw new Error('Test Crash')` in console. | Injects dark red overlay modal capturing filename, line number, and stack trace. | 🟢 PASS |
| **DIAG-02** | Session Panel | Click **Session & Environment Diagnostics** in overlay. | Expands panel showing active username, role, email, branch, and URL. | 🟢 PASS |
| **DIAG-03** | Export Log | Click **Export Log File** inside crash overlay. | Downloads `.txt` file containing full crash report. | 🟢 PASS |

---

## 🐛 Bug Report Template

If you encounter a runtime issue or unexpected behavior during manual QA testing, copy and paste the following template into a new issue or report file:

```markdown
### 🐛 Bug Report: [Short Description of Issue]

- **Date Observed**: YYYY-MM-DD
- **Test ID**: [e.g. AUTH-01 or STAF-03]
- **Environment**: Local / Staging / Production
- **User Role**: Owner / Admin / Service Advisor / Assistant

#### 📝 Steps to Reproduce
1. Log in as [Role].
2. Navigate to [Page / Tab].
3. Click on [Button / Action].
4. Observe error.

#### ❌ Expected vs Actual Behavior
- **Expected**: [What should have happened]
- **Actual**: [What actually happened]

#### 🔍 Diagnostic Screenshots / Error Overlay Output
```
[Paste Error Stack Trace or attach screenshot]
```
```
