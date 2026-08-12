# HonTech Project Agent Directives & Behavioral Guidelines

## Overview
This document defines project-specific guidelines, architectural rules, and quality standards for the **HonTech AutoCenter Management System (Branch 2: Security & Account Recovery)**.

## Security & Authentication Rules
1. **Defensive DOM Operations**: Always verify element existence (`if (document.getElementById('...'))`) before accessing properties (`.innerText`, `.classList`, `.style`) to prevent uncaught `TypeError` crashes during `buildNavbar()` or view switches.
2. **Account Recovery & Auth**: Ensure password reset tokens and PIN verification flows follow strict input validation and display actionable toast feedback.
3. **High-Contrast Developer Exception Diagnostics**: Maintain the high-contrast developer error overlay for uncaught runtime exceptions, with functional Export Log (`.txt`), Copy Trace, and Database Seed Reset buttons.

## UI & Analytics Guidelines
1. **Analytics Table Integrity**: Ensure `#table-analytics-body` is properly populated with record log entries when date ranges or SA/Status filters change.
2. **Chart Rendering**: Always verify `typeof Chart !== 'undefined'` before initializing Chart.js canvases to prevent script execution blockages in offline environments.

## Development & Git Workflow
1. **Active Exploration Branch**: Maintain all feature development, diagnostics, and security updates on `branch2-Security-Account-Recovery`.
2. **Main Branch Protection**: Preserve `main` as the stable client backup.
