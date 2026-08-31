# HonTech Capstone Revisions Log

This log documents all feature revisions, bugs resolved, and system updates completed for the HonTech Queue Monitoring System.

---

## 📅 August 31, 2026 (UI Ergonomics Upgrade & Cloud Infrastructure Strategy)

### 🎨 Vehicle Intake & Online Booking Form Modernization (v4.26)
* **Wide 2-Column Executive Dashboard Layout**: Replaced the tall, single-column vertical form with a balanced, space-efficient 2-column layout (`max-w-6xl`) that eliminates vertical page scrolling.
  - **Left Card**: Customer & Vehicle Dossier (Date, Plate Number, Vehicle Model, Customer Full Name, Mobile Number) + Service Scope & Workshop Lane Allocation with zero label line-wrapping.
  - **Right Card**: Timing & Queue Dispatch Center + Integrated Submission Action Button.
* **Modern Time Pickers & Quick Slot Grid**:
  - Replaced outdated dropdown selects with native `<input type="time">` digital pickers for both Service Advisor and Assistant Desk.
  - Added a 2×3 interactive slot chip grid (`08:00 AM`, `09:30 AM`, `11:00 AM`, `01:30 PM`, `03:00 PM`, `04:30 PM`) for 1-click booking assignment.
  - Added a **"⚡ Set to Current Time"** button for Service Advisor walk-in reception.
* **Executive Monochrome Styling**: Stripped distracting vibrant gradient badges and converted all form borders, input fills, and buttons into executive slate/neutral tones.
* **Cache Busting**: Incremented script cache-buster tag in `frontend/index.html` to `js/app.js?v=4.26`.

### ☁️ Cloud Hosting, Sandbox PoC & Architecture Documentation
* **Master Hosting Infrastructure Guide**: Authored [`HONTECH_HOSTING_INFRASTRUCTURE_AND_CLOUD_STRATEGY_GUIDE.md`](Hontech%20Documentation/Technical/HONTECH_HOSTING_INFRASTRUCTURE_AND_CLOUD_STRATEGY_GUIDE.md) providing an architectural and financial breakdown of **Local XAMPP/LAN**, **AWS (EC2/Lightsail)**, **Vercel**, and **Supabase**.
* **Free-Tier Gotchas & Risk Analysis**: Documented real-world operational constraints including Supabase's **7-day inactivity database pausing rule**, **500MB DB cap vs photo uploads**, **Row-Level Security (RLS) enforcement**, and **Vercel serverless function execution limits**.
* **Isolated Sandbox PoC Playbook**: Authored [`HONTECH_SANDBOX_POC_VERCEL_SUPABASE_SETUP_GUIDE.md`](Hontech%20Documentation/Technical/HONTECH_SANDBOX_POC_VERCEL_SUPABASE_SETUP_GUIDE.md) featuring a complete 1-file working demo with live Supabase Realtime WebSockets for client demonstrations.
* **Adaptive Client-Driven Strategy**: Formalized the dual-path decision tree (Local-first deployment vs. Cloud migration refactoring).

---

## 📅 August 22, 2026 (Local Intranet Deployment & Multi-Device Testing)

### 🌐 Local Network Hosting & Multi-Device Synchronization
* **All-Interfaces Server Binding**: Configured PHP 8.0 server to bind to `0.0.0.0:8000`, enabling cross-device communication across the shop's local Wi-Fi / mobile hotspot.
* **1-Click Direct Role Logins**: Integrated instant role authentication triggers (`👑 Owner`, `👔 Admin`, `🛠️ SA`, `🔧 Tech`) on the login screen to streamline live multi-role testing without manual password typing.
* **Mobile QR Code Pairing**: Added `openMobileConnectModal()` with on-screen dynamic QR code generation, allowing technicians and advisors to scan and open the system on smartphones in seconds.
* **Automated LAN Launcher**: Created `start_lan_server.bat` in the project root to automatically detect the host's active LAN IPv4 address and launch the server with one click.
* **Online Booking Lane Types**: Updated Assistant Online Booking form and pending bookings table with all 4 lane selections: **Express Lane**, **Flexible Lane**, **Special Lane**, and **Priority Lane**, including dynamic Chart.js lane share visualization updates.
* **Online Booking Module Access (Assistant Staff Controls; SA/Admin/Owner View-Only)**: Service Advisors, Administrators, and Owners have visibility into the Online Booking Module (`#container-online-queue`) with strict read-only permissions, preserving operational editing, confirmation, and deletion authority exclusively for **Assistant Staff**.
* **Workshop Bay Capacity Configuration (4–10 Bays)**: Empowered Administrators and Owners to configure the active workshop bay capacity dynamically (4 to 10 bays) via Account Settings, automatically scaling Service Advisor bay allocation dropdowns, occupancy validations, and the real-time TV Bay Monitor layout (with adaptive 2-to-5 column grid responsiveness).
* **Dedicated Workshop Bays Navigation Module (`#section-bays`)**: Created a dedicated primary navigation tab and module on the left sidebar & top navigation for **Owner**, **Admin**, **SA**, and **Assistant**. Features a live workshop floor plan grid (`BAY-01` to `BAY-10`), real-time utilization stats (Total, In Service, Free, Utilization %), quick capacity scaling presets (4, 6, 8, 10 bays), and 1-click allocation of unassigned waiting vehicles directly into empty bays.
* **Express Lane Performance & Unsuccessful Root Cause Analytics**: Integrated a dedicated Analytics card for **Owner** and **Admin** evaluating Express Lane SLA compliance ($\le 60\text{ min}$ turnaround) alongside categorized root cause distributions for Unsuccessful/Delayed express services (Parts Delay, Customer Add-on Approval, Lift Congestion, Complex Repair, Extended QC).
* **Operational Report Data Module (Plan vs. Pumasok & Daily Intake Volume)**: Integrated a dedicated 3rd tab (`📊 Report Data`) for **Owner** and **Admin** featuring:
  - **Plan vs. Pumasok Inflow Matrix**: Tracks planned/scheduled targets against actual intake arrivals across **Carry-Over**, **GRS (General Repair)**, **PMS (Preventive Maintenance)**, **Express Lane**, and **Check-ups** with fulfillment rate percentages and variance indicators.
  - **Daily Intake Volume Breakdown**: Day-by-day chronological report aggregating total intakes, walk-in vs. online split, category distribution, shop capacity load %, and peak intake windows with 1-click CSV export and print-ready summary generation.
* **Intranet Architecture Documentation**: Documented local-only `.local` mDNS resolution (`hontech-marikina.local`), zero-cost on-premises resilience, and client presentation guides in `Hontech Documentation/Technical/LOCAL_INTRANET_DEPLOYMENT_GUIDE.md`.

---

## 📅 August 12, 2026 (Security & Account Recovery Branch Updates)

### 🛡️ Security, Exception Diagnostics & System Stability
* **Defensive DOM Operations**: Added strict null-checks for `buildNavbar` elements (`#header-actions` and `#sidebar-user-role`), preventing uncaught `TypeError` crashes on login.
* **Period Log Records Table**: Restored missing responsive Period Record Log Table HTML component (`#table-analytics-body`, `#analytic-table-count`, SA, Status, Goal filters, and Search inputs).
* **Developer Crash Reporter Overlay**: Refactored `showCrashOverlay` to safely pass multi-line diagnostic payloads into `window.currentCrashLogData`, making **Export Log (.txt)**, **Copy Trace**, and **Reset & Seed DB** fully functional.
* **Workspace Customizations**: Created project `.agents/AGENTS.md` rules and `.agents/skills/hontech-security-recovery/SKILL.md` workflow documentation.

---

## 📅 July 5, 2026 (System-Wide Revision Cycle)

### ⚙️ General System & Core Logic
* **24-Hour Time Engine**: Time calculations (arrival, departure, and service duration) now run on a 24-hour base with overnight adjustments. *(Note: The 12h/24h toggle selector is not yet added).*
* **Claim Stub System**: Fully functional, generating clean, unique stub numbers automatically.
* **Zebra Table Styling**: Improved contrast on all data tables. Headers are now light gray (`bg-gray-200`) with darker text, and rows have alternating light gray stripes without breaking custom status backgrounds.
* **Intake Header Design**: The intake form header now has a distinct grey card background (`bg-gray-50`) with borders for a more polished look.

### 👥 Assistant (Staff) Module
* **Form Rename & Subtitle**: Re-labeled to **Online Booking Form** with the description: *"Log online inquiries to Booking Module."*
* **Simplified Booking Forms**:
  * **"Parts" Column Removed**: Completely removed the parts input fields from both the online booking form and the booking table.
  * **"Lane Type" Removed**: Removed the lane type selection from the intake forms to simplify data entry.
* **Editable Booking Table**: The Assistant can now edit **Lane Type**, **Appointment Date/Time**, and the **Confirmed Checkbox** directly inside the booking table.
* **Confirm Active & Timestamp Flow**:
  * Replaced the "Push Active" button with **Confirm Active**.
  * Once clicked, the system automatically logs the current time as the vehicle's arrival timestamp and updates it in the daily intakes list.
* **UI Cleanups**:
  * The daily intakes list in the Assistant view now shows all entries (Walk-in & Online) without filters.
  * Improved the delete/remove entry button with a clean confirmation modal.

### 🛠️ Service Advisor (SA) Module
* **Form Rename & Subtitle**: Re-labeled to **Walk-In Form** with the description: *"Encode physical walk-in paperwork & assign Stub."*
* **Simplified Intake Form**: Removed the "Specific Problems" text area to keep walk-in registrations fast and simple.
* **Intakes Table Improvements**:
  * **Actions Column Removed**: Removed the "Actions" column to make the table cleaner.
  * **In-Line Editing**: The SA can now change the category (PMS, GRS, PMS & GRS, or Others) and lane types (Flexible, Express, Special) directly in the table row.
  * **Carry-Over Integration**: Added read-only columns for **Promised Date** and **C.O. Status** (reasons) to the intakes table.
  * **Carry-Over Visuals**: Added a dynamic orange `[Carry-Over]` badge below the plate number.
  * **Return Carry-Over Option**: The status dropdown now dynamically displays **Return Carry Over** instead of "Carry Over" if the vehicle came from the carry-over list.
* **Carry-Over Table & Modal**:
  * **Data Preservation**: Opening the Carry-Over modal now preloads and preserves the last-saved promised date and reason instead of overriding them.
  * **New Reason**: Added **WCA** (Waiting Customer Approval) to the carry-over status selections.

### 📺 TV Monitoring Module
* **Lanes Monitoring (Slide 3)**:
  * Fully functional and layout bugs fixed (Slide 3 no longer hides under Slide 2).
  * **Vibrant Redesign**: Upgraded Slide 3 columns with solid color headers (**Red** for Express, **Blue** for Flexible, **Purple** for Specialty) and matching light background tints for the columns to match the premium design of Slide 1.

### 👑 Owner Dashboard (Analytics)
* **Periodic Table Tab**:
  * Created a dedicated **Periodic Table** tab at the top of the owner's dashboard.
  * Extracted the Period Log Records table from the Analytics tab and placed it inside the new tab.
  * Made the date/scope and branch selectors **shared** so they sit above both the Analytics and Periodic Table tabs, allowing easy historical searches.
* **Operational Metrics Refinements**:
  * **Released Today**: Counts jobs by their actual completion date (`dateCompleted`), ensuring carry-overs released today are counted. Shows `(X Ready to Release)` subtext.
  * **In Bays (Working)**: Excludes completed/released jobs from the active bay count. Shows `(X Monitoring)` subtext.
  * **Branch Separation**: Removed the Branch column from table rows and moved it to the main top filters for better structure.

---

## 📅 July 20, 2026 (Backend Architecture & SOLID Refactoring Cycle)

### 🏗️ Architectural Layering & SOLID Principles
* **Data Access Repositories**: Extracted database query execution out of controllers into dedicated repository classes:
  * `App\Repositories\BranchRepository`: Encapsulates branch queries, creation, soft-deletion, and restoration.
  * `App\Repositories\UserRepository`: Encapsulates user lookups, staff roster queries, and credential management.
  * `App\Repositories\JobRepository`: Encapsulates job record filtering, claim stub sequence generation, and analytics queries.
* **Standardized Response Helper (`App\Utils\ApiResponse`)**: Introduced unified API response handling (`success`, `error`, `unauthorized`, `forbidden`, `notFound`, `serverError`) to eliminate duplicate header setting and `http_response_code` boilerplate.
* **Encapsulated Auth Context**: Removed direct controller reliance on `$GLOBALS['user']` in favor of static `Auth::getCurrentUser()` / `Auth::setCurrentUser()`.
* **File Concurrency Safety**: Applied `LOCK_EX` to file writing operations in `EmailUtils.php` and `JobController.php` to prevent temporary cache file corruption.

### 🌐 Router & Dev Server Adjustments
* **Asset Route Resolution**: Updated `router.php` to serve static assets (CSS, JS, fonts, images) directly from the `frontend/` directory with proper MIME `Content-Type` headers (`text/css`, `application/javascript`, etc.).
* **API Prefix Compatibility**: Updated `router.php` to handle `/backend/index.php/api/` request prefixes cleanly, preventing API requests from falling back to HTML documents.
* **Database Service**: Verified MariaDB/MySQL service on port 3307 and executed database migrations and seeders (`php backend/seed.php`).

---

## 📅 August 8, 2026 (Developer Version & Diagnostics Enhancements)

### ⚙️ Global Exception Handling & Developer Tools
* **Global Error Overlay (Crash Reporter)**: Integrated window-level exception and promise rejection listeners. If any javascript runtime crash triggers, it captures the error name, triggered source file name, line number, and full stack trace in a premium red-themed overlay.
* **Session & Environment Diagnostics Panel**: Added an expandable dashboard directly inside the crash overlay to inspect user state details (`currentUserRole`, `currentUserName`, `currentUserEmail`, active branch, and request URL) at the exact moment of crash.
* **Instant Database Re-Seeding Trigger**: Included a **Reset & Seed DB** trigger that sends a secure request to a newly implemented developer route (`POST /api/auth/developer/reset-seed`) to cleanly truncate tables and re-execute mock seed data. Output logs are printed live inside the overlay.
* **Diagnostic Crash Log Export**: Added a one-click **Export Log File** action that downloads a detailed report `.txt` file containing trace details, environment state, and localStorage details.

### 👑 Owner Dashboard (Analytics Fixes)
* **Auth Session Credentials**: Fixed a bug where credentials were not attached to same-origin fetch calls, preventing `/api/jobs/analytics` from verifying JWT tokens. Added `credentials: 'include'` to `apiRequest()`.
* **Date Parsing & Range Query Fixes**: Fixed date conversions in `loadAnalyticsData` that caused timezone offsets. Enhanced `getAnalyticsData()` database query to check both `date_received` and `date_completed` to correctly capture vehicles within selected periods.

---

## 📅 August 16, 2026 (Architectural Review, Diagnostic Audit & QA Protocols)

### 🔬 Root Cause & Architectural Audit
* **SQL PDO Property Mapping**: Documented the critical schema boundary between backend MySQL PDO snake_case attributes (`id`, `is_active` [0/1], `is_online` [0/1]) and frontend JavaScript camelCase conventions. Enforced standard fallback normalization (`user.id ?? user._id`, `Number(user.is_active) === 1`).
* **Defensive Array State Guarding**: Mandated `Array.isArray()` fallbacks (`const safeJobs = Array.isArray(allJobs) ? allJobs : [];`) across all table rendering and analytical filtering functions to prevent unhandled `TypeError` exceptions.
* **Browser Cache Busting**: Established mandatory script version bumping (`<script src="js/app.js?v=X.Y"></script>`) in `frontend/index.html` to eliminate stale script execution during development.

### 🧪 Standard 4-Step QA & Manual Testing Protocol
When developing or revising features, developers and teammates must follow this verified cycle:

```
[1. Baseline Health Check] ➔ [2. Build Isolated Feature] ➔ [3. 4-Role Manual Unit Test] ➔ [4. Git Checkpoint Commit]
```

1. **Step 1: Baseline Health Check**: Verify existing core views (Login, Queues, Analytics) load without console errors before editing.
2. **Step 2: Build Isolated Feature**: Implement only one specific requirement at a time without mixing concerns.
3. **Step 3: 4-Role Manual Unit Test**: Test the change across all 4 operational roles:
   - **Owner (`owner@hontech.com`)**: Verify Analytics KPIs, charts, period records, and staff roster.
   - **Admin (`admin@hontech.com`)**: Verify administration capabilities and operational records.
   - **Service Advisor (`sa@hontech.com`)**: Verify Walk-In Intake encoding, Claim Stub generation, and Daily Intakes lift board.
   - **Assistant Staff (`staff@hontech.com`)**: Verify Online Booking form, Booking Module queue, and Confirm Active conversion.
4. **Step 4: Commit & Checkpoint**: Commit to Git with a clear descriptive message (`feat(...)` or `fix(...)`) only after all 4 roles pass clean with zero console errors.

---

## 🏛️ Enterprise System Architecture Audit & Full-Stack Hardening Roadmap

### 🌟 Active Commercial-Grade Industry Standards Implemented
1. **Security & RBAC Layer**:
   - HTTP-Only JWT Cookie Authentication with BCrypt password hashing (`cost = 10`).
   - Server-side RBAC middleware enforcing strict 403 Forbidden on unauthorized endpoint access.
   - Dynamic 30-second user presence heartbeat (`/api/auth/ping`) and configurable idle session timeouts.
   - Dual-mode account recovery (4-digit security PIN verification + Developer Mailbox fallback).
2. **Resilience & Developer Crash Diagnostics**:
   - Global error interceptors (`window.onerror` and `window.onunhandledrejection`) with high-contrast diagnostic overlay.
   - Stack trace clipboard capture, `.txt` crash log export, and one-click database re-seeding endpoint (`/api/auth/developer/reset-seed`).
3. **Data Layer Defensive Engineering**:
   - MySQL PDO prepared statements eliminating SQL injection vulnerabilities.
   - Explicit snake_case / camelCase data normalization fallbacks (`id ?? _id`, `Number(is_active) === 1`).
   - Systematic `Array.isArray()` guarding across all collection filters, maps, and Chart.js aggregations.
4. **DevOps & QA Protocol**:
   - **3-Tier Risk Architecture** (Tier 1: Visual/Cosmetic ~5s, Tier 2: Single-Role ~30s, Tier 3: Shared Core ~2m).
   - Interactive standalone HTML test dashboard (`HONTECH_QA_MANUAL_TESTING_MATRIX.html`) with dynamic custom test generation, local storage persistence, and CSV export.

---

### 🔮 Future Enterprise Hardening Roadmap (Planned Enhancements)
The following four items represent advanced enterprise optimizations documented for future release sprints:
1. **🛡️ Client-Side XSS Escaping Helper**: Add a global `escapeHtml(string)` utility to sanitize all user-submitted text interpolations (`remarks`, `customer name`, `evaluation`) before DOM injection.
2. **⏱️ Brute-Force Rate Limiting**: Implement Redis/session-based rate-limiting on `/api/auth/login` to lock login attempts for 60 seconds after 5 consecutive failures.
3. **🌐 Offline Network State Detection**: Implement `window.addEventListener('offline' / 'online')` listeners to display a non-intrusive connectivity badge when working with intermittent local Wi-Fi.
4. **🗄️ Uniform Soft-Deletion Architecture**: Standardize `is_deleted = 1` flag across all tables (`jobs`, `users`, `branches`) to guarantee full audit trail compliance for executive analytics.
5. **🔔 Live TV Display Sound Chime System**: Integrate Web Audio API chime sounds (`playChime()`) triggered when vehicles transition to "Ready to Release" or upon carousel slide transition on the TV monitor.

---

## 🎯 Strategic Project Roadmap & Client Presentation Protocol

### 🏆 The Executive Verdict & 3-Phase Execution Strategy
* **🎯 Current Priority (Sprint 1)**: Polish, freeze, and verify all client-approved revisions using the **3-Tier QA Manual Testing Matrix**. Do not add unrequested complex features before client acceptance.
* **👑 Tomorrow (Client Milestone)**: Deliver the **ArchiMate Socio-Technical Architecture Presentation** and 2-minute live system demonstration to the **Company President**.
* **🚀 Post-Approval (Sprint 2 & 3)**:
  1. **Phase 2 (Security Hardening)**: Google OAuth / API Security integration, 2-Factor Authentication (PIN / Email), and enhanced Account Recovery.
  2. **Phase 3 (Deployment & Training)**: Configure workshop PC as on-premise local server, link waiting-area TV monitors via local network, and conduct hands-on staff training for Service Advisors and Assistant Staff.

---

### 🗺️ ArchiMate Poster Printing & Physical Assembly Guide
To present the comprehensive system architecture map in high-resolution format to the President:
1. **Export Resolution**: Export the ArchiMate model as **Vector PDF** or **High-Resolution PNG (300 DPI / 4K)** from the modeling tool.
2. **Multi-Sheet Poster Tiling (2×2 Grid / 4 Pages)**:
   - **Using Adobe Acrobat Reader**: Open PDF ➔ `Ctrl + P` ➔ Select **"Poster"** under *Page Sizing & Handling* ➔ Set Tile Scale to `150%-200%` with `0.1 in` overlap ➔ Print.
   - **Using BlockPosters / Web Tool**: Upload image ➔ Select *2 pages wide (A4 / Letter)* ➔ Download sliced 4-page PDF ➔ Print.
3. **Assembly**: Trim the overlapping margins on the inner edges, align the connector lines across sheets, and secure the back with clear tape to create a unified ~A2 executive table poster.

---

### 💡 Problem-Driven Feature Policy (YAGNI & Client Alignment)
* **Principle**: Only implement new components (e.g., custom Activity Logs, Audit Trail tables) when explicitly requested by the client to solve an active business pain point.
* **Benefit**: Eliminates wasted development hours, prevents user confusion, and ensures 100% stakeholder buy-in for every new database table and feature added.



