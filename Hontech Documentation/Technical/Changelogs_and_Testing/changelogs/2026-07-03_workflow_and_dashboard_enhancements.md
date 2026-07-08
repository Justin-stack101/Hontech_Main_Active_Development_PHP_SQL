# Changelog Specification: Workflow & Dashboard Enhancements

- **Date**: July 3, 2026
- **Version**: `v1.1.0`
- **Release Type**: Enhancement
- **Target Branch**: `developer`
- **Author**: Antigravity Developer System

---

## 📋 Context & Summary
This update resolves critical time calculation bugs caused by 12-hour format string parsing, establishes clear roles/form boundaries for Assistant and SA roles, refactors Carry-Over modalities, and introduces Slide 3 (Workshop Lanes) to the TV monitoring screen.

---

## 🛠️ File Changes

### 1. `frontend/index.html`
- **Time Fixes**:
  - Implemented `convertTimeTo24Hour(timeStr)` to strip AM/PM and parse raw values cleanly.
  - Replaced manual `.split(':')` on metric cards and exports with `parseTimeToMinutes(convertTimeTo24Hour(...))`.
- **UI Customizations**:
  - Added `#delete-confirm-modal` for beautiful, branding-aligned warning confirmations.
  - Removed "Specific Concerns" from SA Walk-in intake.
  - Disabled all interactive inputs for the Assistant Booking list, leaving only static text rendering, **Confirm Active** time-stamp button, and the styled **Delete** action.
- **Master Intake Table**:
  - Changed title to `Daily Intakes - Marikina`.
  - Cleared Branch and Action columns from the static placeholder headers.
  - Excluded `Released` and `Completed` status jobs from TV slides.
- **Carry-Over Updates**:
  - Excluded "Parts" column from layout.
  - Standardized all labels to "Reasons".
- **TV monitor**:
  - Created Slide 3 displaying Express Lane, Flexible Lane, and Specialty Lane populated dynamically from the active jobs.

### 2nd Revision Updates (July 3, 2026)
- **Time Selector**: Prevented clipping of hour/minute dropdown selections by adding `shrink-0 min-w-[56px]` Tailwind classes.
- **Custom Release Dialog**: Implemented custom modal `#release-confirm-modal` to completely replace the standard browser `confirm()` dialogue. This eliminates white screen rendering/freezing during release actions.
- **Colum Cleanups**: Removed "GRS Recommendation" and "Reasons" columns from Daily Intakes table; removed "Reasons" column from Carry-Over table.
- **Status Select**: Removed `In Progress` status and reordered options to: `Waiting`, `Monitoring`, `Carry Over`, `Ready to Release`, `Released`.
- **Advanced Filtering**: Added a filter bar above Daily Intakes containing Source filter (All, Online, Walk-in), Sort By filter (Claim Stub, Arrival Time), and Time filter (prototype). Focus state is automatically persisted during search input typing.

---

## 🧪 Verification Verification Result
All local servers have been restarted and checked. Real-time actions for Confirm Active, status changes, and SLA calculation toggle tests have passed QA inspection criteria.
