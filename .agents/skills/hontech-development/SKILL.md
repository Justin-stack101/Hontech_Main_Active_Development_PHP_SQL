---
name: hontech-development
description: Guidelines and specifications for developing the HonTech AutoCenter Operations System, including backend SOLID structure, DB credentials, frontend UI standards, and verification guidelines.
---

# HonTech Development Standards Skill

This skill provides the core context, architectural constraints, and house rules for the HonTech Queue Monitoring and Operations System.

---

## 🏗️ Backend System Architecture

- **Language**: PHP 8.x
- **Framework**: Custom lightweight SOLID layered architecture (No Laravel/Symfony).
- **Layers**:
  - **Controllers**: Handle HTTP input and dispatch to repositories. Located in `backend/controllers/`.
  - **Repositories**: Encapsulate DB operations. Located in `backend/repositories/`.
  - **Models/Entities**: Optional object mappers.
- **Unified Response Standard**: Always return responses using `App\Utils\ApiResponse`. Avoid manual header manipulation or unformatted `json_encode`.
- **Authentication**: JWT cookie-based auth managed via `App\Middleware\Auth`.

---

## 🗄️ Database Specifications

- **Server**: MariaDB / MySQL
- **Port**: `3307` (or configured via `.env`)
- **Tables**:
  - `users`: Stores admin, owner, and advisor accounts.
  - `jobs`: Stores intake records, active states, and completion statuses.
- **Deletions**: Soft deletions are configured. Always filter queries using `is_deleted = 0`.
- **Prepared Statements**: Parameterized PDO binding is mandatory on all queries.

---

## 🎨 Frontend UI Standards

- **Core**: Single Page Application (SPA) driven by `frontend/js/app.js` and `frontend/index.html`.
- **CSS**: Vanilla CSS with styling tokens. Tailored HSL colors, smooth transitions, and premium dark glassmorphism effects.
- **Defensive DOM Operations**: Always wrap DOM element property access in `if (document.getElementById('...'))`.
- **Cache Busting**: Always increment `js/app.js?v=X.XX` in `frontend/index.html` after modifying client scripts.

---

## 🚗 Service Advisor (SA) 2025 RO Excel Studio Standards

- **Strict 4 Worksheets**: `Job_Order`, `Quotation_No`, `Billing_No`, and `CheckList_Result`. Never re-introduce non-SA tabs.
- **Top Sticky Tab Bar**: `#form-top-tab-bar` positioned at the head of `#section-form13` with carets (`▾`) and blue active highlight.
- **Official PDF Format Preview Sidebars**: Embedded iframe PDF viewers in the right column using official templates:
  - `Job_Order`: `assets/form13_template.pdf`
  - `Quotation_No`: `assets/Current_2025 BLANK RO UPDATED.xlsx - Quotation_No.pdf`
  - `Billing_No`: `assets/Current_2025 BLANK RO UPDATED.xlsx - Billing_No.pdf`
  - `CheckList_Result`: `assets/Current_2025 BLANK RO UPDATED.xlsx - CheckList_Result.pdf`
  - Toolbar actions: Full PDF (`target="_blank"`), Download PDF (`download`), and Export Official `.xlsx`.
- **Zero-Lag Reactive Auto-Fill**:
  - No heavy keystroke canvas redraw loops.
  - Typing in `Job_Order` auto-populates input fields across `Quotation_No`, `Billing_No`, and `CheckList_Result` with zero typing delay.
  - Auto-saves offline drafts directly to `localStorage`.
- **Official Template Multi-Sheet Export**:
  - Populates `Current_2025 BLANK RO UPDATED.xlsx` across sheets 1–7 using JSZip.
  - Preserves 100% sheet formatting and original workbook structure.

---

## 🧪 Terminal Workflow & Dual-Track Testing

- **Local Server Launch**: Run via terminal:
  ```bash
  npm.cmd run dev
  ```
  *(Launches `php -S 0.0.0.0:8000 router.php`)*
- **Automated Test Suite**: Run via terminal:
  ```bash
  npm.cmd test
  ```
  *(Executes `test:frontend`, `test:backend`, and `test:security`)*
- **Whole-System Regression Rule**: After any code changes, `npm.cmd test` must pass. If any test fails, self-debug immediately before finishing.
- **Manual QA Synchronization**: For every feature or UI adjustment, add a test scenario row to `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv` and append to `REVISIONS_LOG.md` and `Revisions checklist.csv`.
- **Reset Seeding API**: Access `POST /api/auth/developer/reset-seed` in development mode to wipe records and run seeder scripts instantly.
