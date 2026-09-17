# Project Profile - HonTech AutoCenter Operations System

> **This is the codebase-specific context document.** It captures concrete facts about the HonTech project that general workflow guides leave out. Read this to understand the tech stack, access controls, database schema, and test configurations of the current application.

---

## 🏗️ Technology Stack

- **Frontend**: Single Page Application (SPA) using vanilla HTML5, Javascript (`frontend/js/app.js`), and Tailwind CSS.
- **Backend**: SOLID layered PHP backend (Controllers in `backend/controllers/`, Repositories in `backend/repositories/`).
- **Routing**: `router.php` forwards all client requests to `/api/*` to the PHP backend, otherwise serving static files or falling back to `index.html`.

---

## 👥 Access Control & Roles

- **Roles**:
  - `owner`: System Owner (full access to analytics, staff roster, and system logs).
  - `admin`: Branch Administrator (manages staff and branches).
  - `sa` (Service Advisor): Encodes walk-in intake tickets, operates the 2025 RO Excel Studio, and updates job cards.
  - `assistant` (Front Desk): Manages online bookings, active status updates, and daily intake sheets.
- **Gating**: Handled dynamically on the client via `handleLogin(role)` and route guards. The backend enforces role-level security in Controller constructors.

---

## 🚗 Service Advisor (SA) 2025 RO Excel Studio Foundation

- **Worksheet Scope**: Strictly 4 operational worksheets (`Job_Order`, `Quotation_No`, `Billing_No`, `CheckList_Result`). Purged non-SA tabs are permanently deprecated.
- **Top Sticky Tab Bar**: Head of `#section-form13` anchored with Google Sheets styled tabs, carets (`▾`), and active blue highlighting.
- **Official PDF Format Preview Sidebars**: Embedded iframe viewers in the right preview pane with Full PDF, Download PDF, and Export `.xlsx` actions for each worksheet.
- **Zero-Lag Reactive Auto-Fill**: Keystrokes in `Job_Order` auto-populate input fields on other sheets (`syncJobOrderFieldsToQuote`, `syncJobOrderFieldsToBilling`, `syncJobOrderFieldsToChecklist`) with zero typing delay and auto-save to `localStorage`.
- **Export Engine**: Injects data into `Current_2025 BLANK RO UPDATED.xlsx` across sheets 1 through 7 without modifying workbook visibility.

---

## 🔑 Authentication & API Requests

- **Mechanism**: JWT tokens saved as secure HTTP-only cookies.
- **API Helper**: All fetch requests go through the `apiRequest(url, options)` utility in `app.js`.
- **Credentials**: Requests MUST include `credentials: 'include'` to pass JWT auth cookies successfully to backend endpoints.

---

## 🗄️ Database & Schema

- **Database**: MariaDB / MySQL on port `3307`.
- **Deletion Model**: Soft deletion model. Always append `is_deleted = 0` to database select queries.
- **Mock Data**: Seeding logic is defined in `backend/seed.php`.

---

## 🧪 Testing & Debugging Environment

- **Local Runner**: Starts built-in server via `php -S 127.0.0.1:8000 router.php`.
- **Developer Database Reset**: In development environments (`APP_ENV=development`), calling `POST /api/auth/developer/reset-seed` truncates tables and runs `seed.php` automatically.
- **Global Error Overlay**: Intercepts unhandled javascript exceptions, displaying trace coordinates and stack trace details with controls to download a diagnostic log or reset the database state.
