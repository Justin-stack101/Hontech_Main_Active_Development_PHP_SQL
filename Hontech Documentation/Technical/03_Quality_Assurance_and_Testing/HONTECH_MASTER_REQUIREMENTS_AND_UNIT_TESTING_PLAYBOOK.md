# HonTech Master Requirements, Unit Testing & Capstone Readiness Playbook

**Project:** HonTech AutoCenter — Web-Based Vehicle Intake & Queue Monitoring System  
**Classification:** Quality Assurance, Test Scenarios & Defense Readiness Standard  
**Target Rollout:** September 2026  
**Document Reference:** `HONTECH-QA-PLAYBOOK-2026-V1`  

---

## 📋 Executive Overview & Purpose

This playbook provides a **complete, step-by-step testing and verification matrix** covering every feature, user role, and edge case in the system. By completing and verifying these tests, you can guarantee that the software is **100% stable, crash-free, and defense-ready** for both your client (HonTech) and your academic capstone panel.

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🎯 9 CORE MODULES TO TEST & VERIFY:                                    │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Authentication, Google OAuth & Role-Based Access Control (RBAC)     │
│ 2. Vehicle Intake & Online/Walk-In Booking Workflow                    │
│ 3. Master Queue, Status Transitions & Bay Floor Management             │
│ 4. 2-Hour Express PMS SLA Turnaround & Delay Reporting                 │
│ 5. Record Protection, Edit Reason Audit Guard & History Timeline       │
│ 6. Customer Waiting Lounge TV Display & Audio Announcement Chime       │
│ 7. Owner Analytics, Back-Job Intelligence & Excel Reporting            │
│ 8. Offline Resilience, Error Diagnostics & Network Fallbacks           │
│ 9. Revisions Checklist, Defect Traceability Matrix & Regressions       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Module 1: Authentication, Google OAuth & RBAC (Role-Based Access)

| Test ID | Test Scenario | Steps to Execute | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :---: |
| **AUTH-01** | **Global Owner Login** | Login using `owner@hontech.com` / `owner123` | Lands on Global Multi-Branch Dashboard; sees Executive Analytics; cannot edit bay capacity (View-Only). | [ ] |
| **AUTH-02** | **Main Branch Admin Login** | Login using `admin@hontech.com` / `admin123` | Lands on Branch 1; full access to settings, user management, and max bay ceiling configuration. | [ ] |
| **AUTH-03** | **Service Advisor (SA) Login** | Login using `sa@hontech.com` / `sa123` | Can claim jobs, update repair status, and assign bays; cannot access Owner analytics. | [ ] |
| **AUTH-04** | **Front Desk Assistant Login** | Login using `staff@hontech.com` / `staff123` | Can create intakes and view queue; cannot change bay ceilings or delete records. | [ ] |
| **AUTH-05** | **Google OAuth Sign-In** | Click "Google Auth" button | Prompts Google login window; creates or links user session upon authorization. | [ ] |
| **AUTH-06** | **Session Timeout & Inactivity** | Leave session idle for 30 minutes | Auto-logs out with modal alert: *"You have been logged out after 30 minutes of inactivity."* | [ ] |
| **AUTH-07** | **Password Recovery / PIN Reset** | Trigger forgot password flow | Generates valid reset token/PIN with clear toast notification. | [ ] |

---

## 🧪 Module 2: Vehicle Intake & Online/Walk-In Booking

| Test ID | Test Scenario | Steps to Execute | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :---: |
| **INTK-01** | **Fast Intake Walk-In** | Enter Plate `ABC-1234`, Model `Toyota Vios`, Customer `Juan Dela Cruz`, Category `PMS` $\to$ Submit | Vehicle appears at the top of the Daily Intakes table with status `Waiting`. | [ ] |
| **INTK-02** | **Online Booking Slot Assignment**| Select a time slot chip (`09:30 AM`) $\to$ fill online customer details $\to$ Submit | Saves booking with specified appointment time and tags as `Source: Online`. | [ ] |
| **INTK-03** | **Service Category Custom Input** | Select `OTHERS` in Service Category | Unhides custom service description textbox (e.g. *"Alternator Overhaul"*); saves correctly. | [ ] |
| **INTK-04** | **Back-Job Return Intake** | In Customer Lookup, click "Back-Job Return Intake" | Opens `#modal-backjob-reason` prompting for return complaint, odometer, and reason before dispatch. | [ ] |
| **INTK-05** | **Input Validation Guard** | Attempt submission with empty Plate or Name | Form blocks submission with inline red highlights and toast: *"Please complete all required fields."* | [ ] |

---

## 🧪 Module 3: Master Queue, Status Transitions & Bay Floor

| Test ID | Test Scenario | Steps to Execute | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :---: |
| **BAY-01** | **Waiting Bay Lock** | View a vehicle with status `Waiting` | Location dropdown is locked to `Waiting Area` with locked badge; bay selection disabled. | [ ] |
| **BAY-02** | **Monitoring Bay Allocation** | Change status from `Waiting` to `Monitoring` | Location dropdown unlocks; selecting `Bay 2` updates both table and workshop floor card to `Bay 2 (Occupied)`. | [ ] |
| **BAY-03** | **Rollback to Waiting** | Change status back from `Monitoring` to `Waiting` | System auto-resets assigned bay back to `Waiting Area` and frees up the physical bay card. | [ ] |
| **BAY-04** | **Unassign Bay from Floor Card** | On the Workshop Floor Grid, click "Unassign" on an occupied bay card | Clears bay assignment, reverts car to `Waiting Area`, and updates the floor card to `Vacant`. | [ ] |
| **BAY-05** | **Floor Capacity Scaling (Admin)** | Admin changes active bays from 6 to 12 | Workshop grid immediately renders 12 bay cards without page reload. | [ ] |

---

## 🧪 Module 4: 2-Hour Express PMS SLA Turnaround

| Test ID | Test Scenario | Steps to Execute | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :---: |
| **SLA-01** | **Normal Express PMS (< 2 Hours)** | Create Express job with arrival time 30 mins ago | Shows green duration badge (e.g. `⏱️ 30m`) with no delay warnings. | [ ] |
| **SLA-02** | **Express Overdue Alert ($\ge$ 2 Hours)**| Set arrival time to 2h 15m ago (or click Dev Simulate Overdue) | Row displays amber warning badge `⏱️ Express: 2h 15m` and unhides the `📄 Report Reason` button. | [ ] |
| **SLA-03** | **Submit Delay Report** | Click `Report Reason` $\to$ select *"Parts Delay / Not in Stock"* $\to$ Submit | Row updates instantly with badge `Note: Parts Delay / Not in Stock`; logs record to `express_lane_issues`. | [ ] |
| **SLA-04** | **Management Report Sync** | Open Reports $\to$ Express Lane Intelligence Tab | Delay report appears in the analytics chart and downloadable CSV/Excel export table. | [ ] |

---

## 🧪 Module 5: Edit Reason Audit Guard & History Timeline

| Test ID | Test Scenario | Steps to Execute | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :---: |
| **AUD-01** | **Edit Interception Prompt** | Change an existing vehicle's Diagnosis or Plate | System intercepts edit and displays `#modal-edit-reason-prompt` showing Old Value vs New Value. | [ ] |
| **AUD-02** | **Mandatory Justification Note** | Select Reason Preset *"Data Entry Correction"* and provide notes $\to$ Confirm | Saves modification and records entry to immutable `job_audit_logs` table. | [ ] |
| **AUD-03** | **View History Timeline** | Click the History Clock icon (`<i data-lucide="history"></i>`) on any vehicle row | Opens `#modal-job-audit-history` showing complete chronological timeline of who changed what, when, and why. | [ ] |
| **AUD-04** | **Central Audit Logs & Handovers Hub** | Open Analytics tab as Owner/Admin $\to$ Click "Audit Logs & Handovers" | Displays live table of all SA handovers/edits with action filter, search bar, and CSV export. | [ ] |

---

## 🧪 Module 6: Waiting Lounge TV Display & Audio Chime

| Test ID | Test Scenario | Steps to Execute | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :---: |
| **TV-01** | **TV View Rendering** | Switch to Waiting Lounge TV View | Clean, high-contrast public display with large text, no admin buttons, and zero clutter. | [ ] |
| **TV-02** | **Real-Time Queue Push** | Update a job status on a staff laptop | TV screen updates instantly (~50ms) to reflect the new bay / status. | [ ] |
| **TV-03** | **Voice Chime Announcement** | Move vehicle to `Ready to Release` | Plays two-tone airport chime and announces: *"Attention: Customer [Name], your vehicle [Plate] is now ready."* | [ ] |

---

## 🧪 Module 7: Owner Analytics & Reporting

| Test ID | Test Scenario | Steps to Execute | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :---: |
| **REP-01** | **Daily Intake Fulfillment Chart** | Open Analytics tab as Owner | Renders Chart.js intake fulfillment bar chart with breakdown of actual vs planned cars. | [ ] |
| **REP-02** | **Back-Job Return Rate Metrics** | Open Customer Back-Job Intelligence | Displays total return percentage, repeat repair counts, and primary mechanical root causes. | [ ] |
| **REP-03** | **CSV / Excel Data Export** | Click "Export to CSV" on Analytics Table | Browser downloads clean `.csv` file with date-stamped filename. | [ ] |

---

## 🧪 Module 8: Network Resilience & Error Diagnostics

| Test ID | Test Scenario | Steps to Execute | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :---: |
| **NET-01** | **Offline Detection Screen** | Disconnect Wi-Fi (or click Dev Lost Conn) | Screen instantly displays `#offline-network-screen` with friendly message and retry button. | [ ] |
| **NET-02** | **Developer Crash Overlay** | Click "Test Crash" on dev tools | Renders high-contrast error overlay with error stack trace, Export Log (`.txt`), and Reset DB buttons. | [ ] |

---

## 🔄 Module 9: Revisions Checklist & Defect Traceability Matrix

All client modifications, UI refinements, and feature changes must be logged in [`Revisions checklist.csv`](../../Revisions%20checklist.csv) to maintain full traceability and prevent regressions.

| Revision ID Range | Module Target | Focus Area | Verification Standard |
| :--- | :--- | :--- | :--- |
| **REV-001 – REV-007** | Assistant & SA Intake | Sidebar order, Customer lookup, Back-Job reason modals | Modal triggers on reason prompt; clean navigation without UI cutoffs. |
| **REV-008 – REV-013** | Workshop Bays & RBAC | Bay capacity scaling (2 to 50), SA single-owner claims, Owner View-Only | Strict role isolation; Owner cannot edit bay capacity; Admin sets ceilings. |
| **REV-014 – REV-016** | Analytics & Bay State | Back-job intelligence tab, Bay lock when Waiting, live bay status badges | Bay assignment unlocks ONLY on Monitoring; auto-resets on status rollback. |
| **REV-017 – REV-019** | Ceilings, Audio & Audit Hub | Admin ceiling, Web Speech audio chime, Centralized Audit Logs & Handovers Hub | Clean public TV header; Central Audit Hub with real-time filters and 1-click CSV export. |
| **REV-020** | Reports & Express Delays | 4 Core Categories (PMS, GRS, PMS & GRS, Others), Express Delays Direct Insights Draft | Strictly 4 categories without target/variance numbers; 4 cards & peak hour removed; clean express delay direct insight deck. |

---

## 🎯 Capstone Pre-Defense Checklist

Before entering your defense room or client meeting, check off these 6 final items:
- [ ] **1. Clean Database Seed:** Run `php backend/seed.php` so all demo accounts and sample repair orders are fresh.
- [ ] **2. 4 Role Logins Verified:** Test 1-click login for Owner, Admin, Service Advisor, and Assistant.
- [ ] **3. Revisions Traceability Verified:** Run `REV-001` through `REV-020` against [`Revisions checklist.csv`](../../Revisions%20checklist.csv) to confirm 0 regressions.
- [ ] **4. TV Display & Audio Verified:** Ensure TV layout and sound chime work on your test monitor/browser.
- [ ] **5. Documentation Printed / PDF Ready:** Export [`HonTech_Client_Proposal_and_Deployment_Strategy.html`](HonTech_Client_Proposal_and_Deployment_Strategy.html) to PDF.
- [ ] **6. Git Branch Synced:** Ensure all latest commits are pushed to `origin branch2-Security-Account-Recovery`.

