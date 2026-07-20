# HonTech Capstone Revisions Log

This log documents all feature revisions, bugs resolved, and system updates completed for the HonTech Queue Monitoring System.

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

