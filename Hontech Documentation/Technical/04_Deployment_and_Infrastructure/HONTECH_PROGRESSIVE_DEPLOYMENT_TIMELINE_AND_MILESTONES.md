# 🚀 HonTech AutoCenter: Progressive Deployment Timeline & Next-Month Action Plan
## Official Pilot-to-Production Rollout Strategy (Student Master Plan)

```text
========================================================================================================
PROJECT:               HonTech AutoCenter Operations & Management System
DOCUMENT TYPE:         Official Next-Month Implementation Timeline & Progressive Rollout Plan
TARGET AUDIENCE:       Development Team, Capstone Panel, Client Management (Owner & General Manager)
DATE COMPILED:         August 2026
CLASSIFICATION:        Standard Operating Procedure (SOP) & Milestone Plan
========================================================================================================
```

---

## 📌 Executive Summary & Core Implementation Strategy
This document represents our **official month-by-month progressive deployment plan**. Our strategy follows a practical, low-risk, phased methodology:

1. First, **finalize and polish the system modules** based on HonTech's actual workflow until it is completely bug-free.
2. Second, **test the local hosting on a small scale with classmates** to prove multi-device Wi-Fi reachability.
3. Third, **integrate Google API & 2FA security** to complete the 3 technological pillars.
4. Fourth, **formally propose the working system to the client** for hardware budget approval or PC procurement.
5. Fifth, **physically set up the server and 4 Advisor PCs** in the designated rooms across the 2 branches.
6. Sixth, **conduct staff practice dry-runs**, transition safely to live customer handling, and continuously refine based on staff feedback while the shop runs smoothly.

---

## 🗓️ Master 6-Stage Timeline Breakdown

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                            HONTECH 6-STAGE PROGRESSIVE DEPLOYMENT TIMELINE                       │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 💻 STAGE 1: Codebase Revisions & Polishing (Finalizing Core Workflow Modules)                    │
│ 🧪 STAGE 2: Small-Scale Local Hosting & Classmate Multi-Device Testing (Proof of Concept)        │
│ 🔐 STAGE 3: Google API Integration & The 3 Technological Pillars Complete                        │
│ 💼 STAGE 4: Formal Client Proposal & Hardware Budget Procurement Decision                        │
│ 🏢 STAGE 5: Physical On-Site Installation & Multi-Branch Room Setup (2 Branches & 4 PCs)         │
│ 🚗 STAGE 6: Staff Practice Dry-Runs, Live Customer Pilot & Continuous Improvement                │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 💻 Stage 1: Codebase Polishing & Finalizing Revisions
* **Core Objective:** Build, refine, and polish all system features based on HonTech's actual repair shop workflow until we achieve the final, stable, and production-ready design.
* **Key Action Items:**
  * Complete all pending UI/UX adjustments and layout refinements.
  * Verify role-based permissions across all 4 roles: **Owner**, **Admin**, **Service Advisor (SA)**, and **Assistant**.
  * Ensure the Waiting Lounge TV monitor rotates slides cleanly and acoustic bay chimes trigger upon vehicle completion.
* **Deliverable:** 100% bug-free, fully tested local codebase.

---

### 🧪 Stage 2: Small-Scale Local Domain & Classmate Multi-Device Testing
* **Core Objective:** Explore how the local domain operates and prove that multi-device local hosting is fast, stable, and reachable before deploying to the client's shop.
* **Key Action Items:**
  * Launch `start_lan_server.bat` on the primary development laptop.
  * Have classmates connect their smartphones and laptops to the same Wi-Fi network.
  * Test multi-device operations:
    * Classmate 1 & 2 act as Service Advisors creating vehicle intakes and printing claim stubs.
    * Classmate 3 monitors the Waiting Lounge TV screen to verify live bay updates.
    * Test mobile phone connection using the on-screen QR Code.
* **Success Criteria:** Zero connection drops, instant sub-second bay status synchronization, and reliable mDNS (`http://hontech.local:8000`) reachability.

---

### 🔐 Stage 3: Google API Integration & The "3 Core Pillars" Milestone
* **Core Objective:** Complete the Google Identity API integration and ensure all three foundation pillars are 100% working together.
* **The 3 Core Foundation Pillars Checklist:**
  1. ✅ **System Modules:** Complete vehicle intake, bay dispatching (Bays 1–10), claim stub generator, cashier billing, and TV monitor.
  2. ✅ **Local Hosting:** Fast, zero-cost, offline-capable LAN network on `http://hontech.local:8000`.
  3. ✅ **Google API & Security:** Google OAuth 2.0 logins, 6-digit OTP email recovery, Bcrypt password hashing, and HTTP-Only JWT cookies.
* **Milestone Result:** The complete integrated package is ready for academic defense and client presentation.

---

### 💼 Stage 4: Formal Client Proposal & Hardware Procurement Decision
* **Core Objective:** Present the working prototype, documentation, timeline, and expenses to the HonTech General Manager / Owner to secure the hardware decision.
* **Key Action Items:**
  * Conduct a live, multi-device demonstration (using laptop, tablet, and smartphone).
  * Present the **₱0.00 monthly software guarantee** and complete data sovereignty under **RA 10173** (zero 3rd-party cloud database bills).
  * Present hardware options:
    * *Option A (₱0.00 Software/Hardware):* Run on existing shop PCs and laptops.
    * *Option B (Client-Budgeted Procurement):* Client provides budget or buys the designated set of computers (1 Central Server PC + 4 Service Advisor PCs + 1 UPS battery).

---

### 🏢 Stage 5: Physical On-Site Installation & Multi-Branch Room Setup
* **Core Objective:** Install, wire, and configure the computers in the designated office rooms across both branches.
* **Key Action Items:**
  * **Main Branch (Branch 1: Marikina):**
    * Install the Central Server PC in the designated server/office area; plug into Cat6 Ethernet and 1000VA UPS battery.
    * Set up Advisor PC 1 and PC 2 at the front intake reception counter.
    * Mount and connect the Waiting Lounge TV screen.
  * **Secondary Branch (Branch 2: Makati):**
    * Set up Advisor PC 3 and PC 4 in the Makati service counter.
    * Connect to the Central Server using the free 256-bit encrypted tunnel (`https://portal.hontech-autocenter.com`).
    * Mount and connect the Makati Waiting Lounge TV screen.

---

### 🚗 Stage 6: Staff Practice Dry-Runs, Live Customer Pilot & Continuous Improvement
* **Core Objective:** Train employees safely in a practice environment, transition into live customer handling, and continuously refine the system based on staff feedback.
* **The 3-Phase Safe Rollout:**
  1. **Phase 6A: Staff Training & Sandbox Dry-Run (Days 1–3):**
     * Teach the 4 Service Advisors, Front Desk Assistants, and Cashiers using sample test vehicles in the sandbox environment.
     * Practice morning opening (`start_lan_server.bat`) and evening 60-second backup (`backup_database.bat`).
  2. **Phase 6B: Live Customer Shadow Pilot (Weeks 1–2):**
     * Slowly introduce the system to live, real-world customer intake and vehicle repair handling.
     * Service Advisors print real claim stubs and assign mechanics to live workshop bays.
  3. **Phase 6C: Staff Assessment & Continuous Refinement:**
     * Conduct post-pilot staff assessment: listen to staff feedback on what was easy, what was slow, and what bottlenecks occurred.
     * Implement minor software refinements and optimizations while the company continues running smoothly!

---

## 🎯 Summary Matrix: Next-Month Action Plan

| Stage | Activity | Key Deliverable | Target Timeline |
| :--- | :--- | :--- | :--- |
| **Stage 1** | Codebase Revisions & Polishing | 100% bug-free core workflow | Week 1 |
| **Stage 2** | Local Hosting & Classmate Testing | Multi-device Wi-Fi proof of concept | Week 2 |
| **Stage 3** | Google API & Security Integration | All 3 Core Pillars 100% working | Week 2–3 |
| **Stage 4** | Formal Client Proposal & Hardware | Client hardware budget / approval | Week 3 |
| **Stage 5** | Physical Multi-Branch Setup | 1 Server + 4 PCs installed in rooms | Week 4 |
| **Stage 6** | Staff Dry-Run $\to$ Live Customer Pilot | Trained staff & smooth live rollout | Week 4+ |

---

*Compiled by the HonTech System Development Team (Branch 2: Security & Account Recovery)*
