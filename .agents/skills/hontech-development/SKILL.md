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
