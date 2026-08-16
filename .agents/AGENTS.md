# HonTech Project Agent Directives & Behavioral Guidelines

## Overview
This document defines project-specific guidelines, architectural rules, and quality standards for the **HonTech AutoCenter Management System (Branch 2: Security & Account Recovery)**.

## Security & Authentication Rules
1. **Defensive DOM Operations**: Always verify element existence (`if (document.getElementById('...'))`) before accessing properties (`.innerText`, `.classList`, `.style`) to prevent uncaught `TypeError` crashes during `buildNavbar()` or view switches.
2. **Account Recovery & Auth**: Ensure password reset tokens and PIN verification flows follow strict input validation and display actionable toast feedback.
3. **High-Contrast Developer Exception Diagnostics**: Maintain the high-contrast developer error overlay for uncaught runtime exceptions, with functional Export Log (`.txt`), Copy Trace, and Database Seed Reset buttons.

## Data Layer & API Rules
1. **SQL PDO Property Normalization**: The PHP MySQL backend returns snake_case columns and numeric flags (`id`, `is_active` [0/1], `is_online` [0/1]). Always normalize user and job properties with robust fallbacks:
   ```javascript
   const userId = user.id ?? user._id;
   const isActive = user.is_active !== undefined ? Number(user.is_active) === 1 : (user.isActive !== false);
   const isOnline = user.is_online !== undefined ? Number(user.is_online) === 1 : Boolean(user.isOnline);
   ```
2. **Defensive Array Guarding**: Always ensure arrays are valid before invoking `.map()`, `.filter()`, or `.sort()` (e.g. `const safeJobs = Array.isArray(allJobs) ? allJobs : [];`).

## UI & Analytics Guidelines
1. **Analytics Table Integrity**: Ensure `#table-analytics-body` is properly populated with record log entries when date ranges or SA/Status filters change.
2. **Chart Rendering**: Always verify `typeof Chart !== 'undefined'` before initializing Chart.js canvases to prevent script execution blockages in offline environments.

## Development & Git Workflow
1. **Atomic Feature Delivery**: Implement and test one feature at a time. Verify all 4 roles (**Owner**, **Admin**, **SA**, **Assistant**) before committing.
2. **Cache Busting**: Always increment the query parameter version in `frontend/index.html` (e.g. `js/app.js?v=2.x`) when modifying client script logic to prevent stale browser caching.
3. **Active Exploration Branch**: Maintain all feature development, diagnostics, and security updates on `branch2-Security-Account-Recovery`.
4. **Main Branch Protection**: Preserve `main` as the stable client backup.
