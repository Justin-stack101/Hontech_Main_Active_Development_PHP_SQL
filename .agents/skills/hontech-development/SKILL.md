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
- **Port**: `3307`
- **Tables**:
  - `users`: Stores admin, owner, and advisor accounts.
  - `jobs`: Stores intake records, active states, and completion statuses.
- **Deletions**: Soft deletions are configured. Always filter queries using `is_deleted = 0`.

---

## 🎨 Frontend UI Standards

- **Core**: Single Page Application (SPA) driven by `frontend/js/app.js` and `frontend/index.html`.
- **CSS**: Vanilla CSS with styling tokens. Tailored HSL colors, smooth transitions, and premium dark glassmorphism effects.
- **Error Boundaries**: A global exception modal captures console crashes, runtime errors, and unhandled rejections, displaying them with file coordinates and stack traces.

---

## 🧪 Developer Sandbox & Testing

- **Local Server**: Run locally via `php -S 127.0.0.1:8000 router.php`.
- **Reset Seeding API**: Access `POST /api/auth/developer/reset-seed` in development mode to wipe records and run seeder scripts instantly.
- **Developer Sandbox Mailbox**: Syncs and reads simulated verification code emails from the backend.
