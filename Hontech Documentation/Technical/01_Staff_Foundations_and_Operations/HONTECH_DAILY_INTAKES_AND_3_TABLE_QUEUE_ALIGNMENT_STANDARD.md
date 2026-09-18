# HONTECH OPERATIONAL SPECIFICATION: DAILY INTAKES & 3-TABLE QUEUE ALIGNMENT STANDARD

## 1. Overview & Context
In the HonTech AutoCenter vehicle workflow, the **Daily Intakes / Master Queue** view (`#section-queue`) serves as the central operational hub for Service Advisors, Front Desk Assistants, and Shop Floor Management.

The view is composed of three synchronized operational tables:
1. **Booking Module Table** (`#container-online-queue`): Displays pending online appointments and inquiries awaiting physical arrival.
2. **Daily Intakes / Master Workshop Queue** (`#container-daily-intakes`): Displays active vehicles currently on the shop floor or in service bays for the selected intake date.
3. **Carry-Over Data Table** (`#container-carry-over`): Displays vehicles requiring extended stays (e.g. awaiting backordered parts, extended mechanical diagnostics, or owner approval).

Prior to REV-082, these three tables suffered from inconsistent vertical margins (conflicting `space-y-3` and `mt-3`), disjointed filter toolbars, missing index alignment, and horizontal table overflow that clipped Action buttons (`RETURN AC...`) on standard 1366×768 and 1080p laptop displays.

---

## 2. Layout & Design System Architecture

### 2.1 Section Container (`#section-queue`)
* **Display**: `flex flex-col gap-5 w-full min-w-0 max-w-full overflow-hidden pb-8`
* **Spacing Standard**: Exactly `gap-5` (`1.25rem` / `20px`) between cards. All child margin overrides (`mt-*`, `mb-*`) are strictly disallowed to prevent layout collapse.

### 2.2 Standardized Card Container Structure
Each card container implements a 4px top accent border and unified padding:
* **Common Classes**: `bg-white border border-slate-200/90 border-t-4 p-4 md:p-5 rounded-2xl shadow-xs flex flex-col w-full max-w-full overflow-hidden`
* **Card Theming**:
  | Module | Accent Border | Icon Badge Accent | Status Pill Badge |
  | :--- | :--- | :--- | :--- |
  | **Booking Module** | `border-t-blue-600` | `bg-blue-50 text-blue-600 border-blue-100` | `Online Queue` (Blue) |
  | **Daily Intakes** | `border-t-red-600` | `bg-red-50 text-red-600 border-red-100` | `Today (YYYY-MM-DD) • X Intakes` (Slate/Pulse) |
  | **Carry-Over Data** | `border-t-amber-500` | `bg-amber-50 text-amber-600 border-amber-100` | `Extended Stays` (Amber) |

---

## 3. Command Deck & Filter Design
The Daily Intakes controls are consolidated into a single unified deck (`bg-slate-50/80 border border-slate-200 rounded-xl p-3 space-y-2.5 shadow-2xs`):
* **Tier 1 (Date Control & Calendar Scope)**:
  - Intake Calendar label with date input.
  - Day stepper (`‹ Today ›`).
  - "Show All Dates" / "Filtered by Date" toggle.
  - "Include Carry-Overs" toggle switch.
* **Tier 2 (Search & Filtering Toolbar)**:
  - Search input (`w-64` with search icon).
  - Advisor Filter dropdown.
  - Source Filter dropdown (All, Online, Walk-in).
  - Time Filter dropdown (All Day, Morning, Afternoon).
  - Sort Order dropdown (Claim Stub Desc/Asc, Arrival Time).

---

## 4. Table Header & Cell Alignment Matrix
All 3 tables share identical typography, sticky position, and backdrop blur:
* **Header Tag**: `<thead class="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs">`
* **Header Row**: `<tr class="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">`
* **Standard Cell Padding**: `py-2.5 px-3` (and `px-2.5 py-2.5` for index/stub columns).
* **Column 1 Standard**: All tables start with `#` row index (`w-10 text-center text-slate-400 font-bold`).

### 4.1 Carry-Over Overflow Prevention Standards
To prevent horizontal truncation of Action buttons:
1. **Date Column**: Rendered as a compact 2-line stack:
   - `Recv: YYYY-MM-DD` (`text-slate-500`)
   - `Prom: YYYY-MM-DD` (`text-amber-600` with dashed underline for SA click-to-edit).
2. **Parts Available**: Compact toggle pill (`px-2 py-0.5 text-[10.5px] font-black uppercase`).
3. **Carry-Over Status**: Truncated dropdown pill with max width `w-[145px]`.
4. **Action Buttons**: Compact inline flex buttons with icons (`Return Active` and `Remove`) at `px-2.5 py-1 text-xs`.

---

## 5. Verification & Quality Assurance
* **Automated Unit Tests**: Suite 13 (`AUT-FRONT-40`, `AUT-FRONT-41`, `AUT-FRONT-42`) in `tests/frontend/sla_and_logic.test.js`.
* **Execution**: Passed 57/57 tests with 0 failures across 22 suites.
* **Browser Cache Buster**: `v=2.41` in `frontend/index.html`.
