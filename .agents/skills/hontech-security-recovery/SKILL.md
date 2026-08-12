---
name: hontech-security-recovery
description: Standard operating procedures and diagnostic workflows for HonTech authentication, RBAC, password recovery, and developer crash reporting.
---

# HonTech Security & Account Recovery Workflow Skill

## Purpose
Provides standardized procedures for managing security, role-based access control (RBAC), account recovery workflows, and system exception diagnostics within the HonTech codebase.

## Key Diagnostic & Security Workflows

### 1. Defensive DOM & RBAC Navigation (`buildNavbar`)
When modifying user navigation, role badges, or security settings visibility:
- Always check element presence before dereferencing:
  ```javascript
  if (document.getElementById('sidebar-user-role')) {
      document.getElementById('sidebar-user-role').innerText = roleLabel;
  }
  if (document.getElementById('header-actions')) {
      document.getElementById('header-actions').classList.remove('hidden');
  }
  ```

### 2. Developer Exception Diagnostics Portal
When enhancing the crash overlay UI or handling unhandled runtime rejections:
- Store the active crash payload in `window.currentCrashLogData`:
  ```javascript
  window.currentCrashLogData = { errorMsg, source, lineno, colno, stack };
  ```
- Ensure Export Log (`downloadCrashLogFile`) generates a clean, UTF-8 text file download (`hontech_crash_<timestamp>.txt`).
- Ensure `triggerDeveloperResetSeed(btnEl)` calls `/api/auth/developer/reset-seed` and updates `#dev-reset-log`.

### 3. Password Reset & Security Updates
- Validate inputs before sending payloads to `/api/auth/forgot-password` and `/api/auth/reset-password`.
- Display actionable system toasts using `showSystemToast(message, type, title)`.
