# HONTECH AUTOCENTER
## Operations Management System
### Client Proposal & September 2026 Strategic Architecture Blueprint
### 🌟 Primary Recommendation: Modern Cloud Solutions (Vercel + Supabase)
#### *(Secondary Alternative: On-Premise Local Intranet XAMPP Server)*

---

**Prepared for:**  
**HonTech AutoCenter — Management & Ownership**

**Prepared by — HonTech Systems Development Team:**
- **Mary Dayne Villas T.** — *Lead System Architect & System Designer*  
  *(Responsible for overall system design, technical architecture, workflow modeling, and UI/UX interface design)*
- **Justin Nolasco J.** — *Lead Systems Developer & Implementation Engineer*  
  *(Responsible for full-stack programming, building and engineering the system according to the architectural blueprints, database implementation, and deployment)*
- **Catherine Ramos G.** — *Technical Documentation & QA Lead*  
  *(Responsible for quality assurance testing, user manuals, emergency SOPs, and project documentation)*

**Project Adviser:**  
**Mr. Ar-Jay C. Agbayani** — *Capstone Project Adviser*

**Date:** September 2, 2026  
**Document Version:** 14.0 (Unified Master Document — Cloud Strategy Recommended)

---

## Table of Contents
1. [Executive Summary & Project Purpose](#1-executive-summary--project-purpose)
2. [Technical Evaluation: Local On-Premise vs. Modern Cloud Operations](#2-technical-evaluation-local-on-premise-vs-modern-cloud-operations)
   - [Option A: Local On-Premise Intranet Hosting](#️-option-a-local-on-premise-intranet-hosting-in-shop-server-pc)
   - [Option B: Modern Cloud Solutions (Recommended)](#️-option-b-modern-cloud-solutions-vercel--supabase--recommended)
   - [Operational Feature & Cost Comparison Table](#-operational-feature--cost-comparison-table)
3. [Comprehensive Risk Assessment & Mitigation Plan](#3-comprehensive-risk-assessment--mitigation-plan)
   - [Risk 1: Local Hosting Multi-Branch & Wi-Fi Network Traps](#️-risk-1-local-hosting-multi-branch--wi-fi-network-traps)
   - [Risk 2: Hardware Budget Depletion Strategy (The Staff PC First Rule)](#️-risk-2-hardware-budget-depletion-strategy-the-staff-pc-first-rule)
   - [Risk 3: Shop Environment & Electrical Power Spikes](#️-risk-3-shop-environment--electrical-power-spikes)
   - [Risk 4: External Internet Outages on Cloud](#️-risk-4-external-internet-outages-on-cloud)
4. [Hardware Sourcing, Spec Classifications & Realistic 2-Branch Scalability](#4-hardware-sourcing-spec-classifications--realistic-2-branch-scalability)
5. [Dual Detailed Weekly Execution Roadmaps](#5-dual-detailed-weekly-execution-roadmaps)
   - [Track A: Local Intranet Hosting Plan](#-track-a-detailed-roadmap-for-local-intranet-hosting)
   - [Track B: Modern Cloud Deployment Plan](#-track-b-detailed-roadmap-for-modern-cloud-deployment-vercel--supabase)
6. [Staff Training & "Shadow Mode" Dry-Run Protocol](#6-staff-training--shadow-mode-dry-run-protocol)
7. [Security Governance, Internal & External Cyber Defense Protocols](#7-security-governance-internal--external-cyber-defense-protocols)
8. [Handover Deliverables Package & Project Authorization](#8-handover-deliverables-package--project-authorization)
9. [APPENDIX A: Complete Local Intranet Feasibility & Zero-Risk Setup Blueprint](#-appendix-a-complete-local-intranet-feasibility--zero-risk-setup-blueprint)
10. [APPENDIX B: Complete Cloud Sandbox PoC Setup Blueprint (Vercel + Supabase)](#-appendix-b-complete-cloud-sandbox-poc-setup-blueprint-vercel--supabase)
11. [APPENDIX C: Developer Dual-Repository Workflow, Adapter Pattern & Testing Protocol](#-appendix-c-developer-dual-repository-workflow-adapter-pattern--testing-protocol)

---

## 1. Executive Summary & Project Purpose

The **HonTech Operations Management System** is a project designed to eliminate operational bottlenecks, modernize service bay tracking, automate Express PMS turnaround monitoring, and provide customer lounge transparency for HonTech AutoCenter.

### 🌐 The Core Technological Requirement: Web Delivery & Database Storage
To operate seamlessly across front desk terminals, Service Advisor tablets, and the Customer Waiting Lounge TV, the system requires two foundational technological components:
1. **Web Delivery & Domain Platform:** The platform that serves the visual interface to staff tablets, computers, and lounge displays.
2. **Central Database Storage:** The secure repository that stores vehicle repair orders, customer histories, Express PMS 2-hour SLA turnaround timers, and tamper-proof audit trails.

This document provides HonTech AutoCenter ownership with a clear, business-minded evaluation of the two viable hosting pathways—**Option A: Local On-Premise Intranet Server** vs. **Option B: Modern Cloud Solutions**—to help management select the ideal operational model for the workshop.

### 🎓 Academic Software Grant Terms (Zero Software Cost)
* **100% Free Software Grant:** Because this is an official academic capstone development project, **the software, source code, licensing, on-site setup, and staff training are provided to HonTech AutoCenter at ₱0 (FREE of charge).**
* **Client Hardware Ownership:** The only investment required from HonTech AutoCenter is any physical hardware equipment (*if choosing Option A: Server PC, Ethernet cables; if choosing Recommended Option B: ₱0 new hardware*), which remains 100% the property of the client.
* **1–2 Months Complimentary Warranty & Support:** The development team provides 1–2 months of free post-launch monitoring, bug fixes, and operational assistance.

---

## 2. Technical Evaluation: Local On-Premise vs. Modern Cloud Operations

To connect all service bay devices into one synchronized system, HonTech can choose between two operational architectures:

### 🖥️ Option A: Local On-Premise Intranet Hosting (In-Shop Server PC)
* **How it Works:** A dedicated computer physically set up inside HonTech's office acts as the central server (running Apache and MySQL via XAMPP). All staff tablets, desktop computers, and the Waiting Lounge TV connect directly to this local PC through the shop's private Wi-Fi router.
* **How it Solves the Problem:** Keeps all data physically inside the building on internal copper cables and local Wi-Fi. It continues operating normally even if municipal fiber internet goes down, but it requires purchasing a dedicated desktop PC (~₱18,500–₱23,000) and cannot connect multiple physical branches together without complex networking hardware.

### ☁️ Option B: Modern Cloud Solutions (Vercel + Supabase) — RECOMMENDED
* **How it Works:** The web system interface is hosted on a high-speed global web delivery network (Vercel), and the central database is hosted in enterprise cloud data centers (Supabase on AWS). Staff access the system securely through a web browser on any internet-connected device (laptops, tablets, smartphones).
* **How it Solves the Problem:** Requires **₱0 upfront server hardware cost** (runs on existing office devices), eliminates shop floor clutter, connects multiple branch locations into one master dashboard automatically, and enables remote management from anywhere. It requires an active internet connection (or a ₱999 backup 4G/5G SIM router).

---

### 📊 Operational Feature & Cost Comparison Table

| Evaluation Feature | 🌟 Option B: Modern Cloud *(RECOMMENDED)* | Option A: Local Intranet Server *(Alternative)* |
| :--- | :--- | :--- |
| **Recommendation Status** | **🌟 PRIMARY RECOMMENDATION (Best Value)** | Secondary Supported Alternative |
| **Upfront Hardware Cost** | **₱0** *(Runs on existing office PCs, tablets, & phones)* | ₱14,500 – ₱23,000 *(Requires dedicated Server PC)* |
| **Monthly Software Hosting** | **₱0 / month (Permanent Free Tier)** | **₱0 / month (Free software license)** |
| **Electricity Bill (Meralco)** | **₱0** *(Cloud data centers host the compute)* | ~₱350–₱600 / month *(PC running 24/7 in shop)* |
| **Physical Space & Shop Clutter** | **Zero Physical Space (100% Clutter-Free)**<br>• No server boxes, towers, or cables on desks | **Requires Dedicated Desk / Shelf Space**<br>• Needs space for PC tower, monitor, UPS, and cables |
| **Multi-Branch Synchronization** | **Native Multi-Branch Syncing**<br>• Branch A, B, and future branches connect instantly | **Complex Hardware VPN Required**<br>• Branch B cannot reach Branch A without static IP / VPN |
| **Remote Owner Visibility** | **Full Access** via smartphone / laptop anywhere | None *(Accessible inside shop Wi-Fi only)* |
| **Internal Shop Security** | **Automatic Staff Roles & Branch Isolation**<br>• Staff only see what their role allows<br>• Mandatory reason logs for all record changes | **Private Shop Network Defense**<br>• Kept 100% inside the shop Wi-Fi<br>• Mandatory reason logs for all record changes |
| **External Internet Security** | **Bank-Grade Cloud Protection**<br>• Built-in SSL HTTPS encryption & anti-hacker shield<br>• Data stored securely in AWS Tier-4 centers | **Completely Hidden from Web Hackers**<br>• Offline server is invisible on the internet<br>• Cannot be targeted by online attacks |
| **Internet Outage Resilience** | Requires backup 4G/5G Wi-Fi SIM (~₱999) | **100% Immune** *(Continues running offline)* |
| **Disaster Recovery & Backups** | Automated daily cloud backups | Manual USB backup drive needed weekly |
| **Shop Environmental Hazards** | **100% Protected** in climate-controlled AWS centers | Vulnerable to shop dust, grease, & power surges |
| **Long-Term Quota / Lockout Risk** | **100% Free Forever (No Credit Card Required)**<br>• Free tier supports 500,000+ repair records (~45 yrs) | **Zero Risk (100% Sovereign)**<br>• Physical computer stays inside the shop |

---

## 3. Comprehensive Risk Assessment & Mitigation Plan

Deploying a mission-critical operations system across service bays requires anticipating technical, physical, and financial failure points. Below are the 4 primary risks and their exact mitigation strategies:

### ⚠️ Risk 1: Local Hosting Multi-Branch & Wi-Fi Network Traps
* **The Problem:** 
  * If HonTech runs on a Local Server PC in Branch A, **Branch B (located across town) cannot access Branch A's server** without purchasing expensive static public IP addresses and setting up complex Site-to-Site VPN routers between buildings.
  * Within the shop, if staff tablets connect to a guest Wi-Fi extender or a different router subnet (e.g. `192.168.2.x` instead of `192.168.1.x`), the system will display a network connection error.
* **The Mitigation:**
  * **For Local Hosting (Option A):** We configure a single unified shop Wi-Fi SSID, assign a fixed static IP (`192.168.1.100`), and wire primary front desk terminals directly via Cat6 Ethernet cable.
  * **For Multi-Branch Chains:** If HonTech wants multiple physical branch locations synchronized under one master dashboard, **we strongly recommend Option B (Cloud Vercel + Supabase)**, which eliminates all networking headaches.

---

### ⚠️ Risk 2: Hardware Budget Constraints (The "Staff Terminals First" Rule)
* **The Problem:** 
  * If HonTech has an allocated hardware budget and prioritizes purchasing tablets and laptops for the Service Advisors and front desk first, **there may not be enough budget remaining to purchase a dedicated ₱18,500–₱23,000 Local Server PC.**
* **The Mitigation (The Smart Decision Flow):**
  * **Step 1:** The development team and client canvass equipment prices together in Gilmore, purchasing the necessary staff intake tablets and front desk terminals first.
  * **Step 2 (The Strategic Decision):**
    * **If remaining budget permits:** The client purchases the dedicated Server PC → Proceed with **Track A (Local On-Premise Hosting)**.
    * **If budget is fully utilized:** The client skips the Server PC completely → Seamlessly launch **Track B (Modern Cloud Solutions)** at **₱0.00 additional server hardware cost**!

---

### ⚠️ Risk 3: Shop Environment & Electrical Power Spikes
* **The Problem:** Auto repair centers generate heavy electrical voltage surges when air compressors and hydraulic lifts turn on, risking motherboard burnout on an unprotected on-premise server PC.
* **The Mitigation:** 
  * **For Option B (Cloud Solutions — Recommended):** **100% Protected.** All server compute and database engines run in Amazon's Tier-4 climate-controlled data centers. Workshop electrical surges in Marikina have **zero impact** on system data.
  * **For Option A (Local Hosting — Alternative):** A dedicated **Uninterruptible Power Supply (UPS with AVR / Surge Protection ~₱1,800)** must be installed between the wall outlet and the local server PC to ensure clean, continuous power.

---

### ⚠️ Risk 4: External Internet Outages on Cloud
* **The Problem:** If HonTech chooses Cloud and the primary fiber line (PLDT/Globe) is accidentally cut down the street, staff cannot update records.
* **The Mitigation:** A backup **₱999 prepaid 4G/5G Wi-Fi router (Smart Bro / Globe At Home)** with a budget reloadable data SIM stays in the front office. Staff switch Wi-Fi in 5 seconds with zero interruption.

---

## 4. Hardware & Device Requirements: Cloud vs. Local Sourcing

This section outlines the exact device and hardware requirements for both operational pathways so HonTech management can clearly budget and plan equipment:

---

### ☁️ 4.1 Track B: Modern Cloud Device Requirements (RECOMMENDED — ₱0 Server Cost)

Because Cloud computing is hosted remotely, **HonTech does NOT need to purchase a dedicated server PC**. The system runs on existing shop devices:

| Shop Location / Role | Device Required | Minimum Specification | Est. Hardware Cost |
| :--- | :--- | :--- | :--- |
| **Front Desk / Cashier** | Existing Office PC or Laptop | Any Windows 10/11 desktop or laptop with Google Chrome / Edge | **₱0.00** *(Use existing)* |
| **Service Advisors (Bays)** | Mobile Tablets or Phones | Any Android Tablet / iPad / Smartphone with modern browser | **₱0.00** *(Use existing)* |
| **Customer Waiting Lounge** | Wall Display TV | Smart TV with built-in browser *(or ₱1,800 Fire Stick)* | **₱0.00** *(Shop already owns TV)* |
| **Central Server Unit** | **None Needed** *(Cloud-Hosted)* | Amazon AWS Tier-4 Data Center (Managed by Provider) | **₱0.00** |
| **TOTAL UPFRONT INVESTMENT**| | | **₱0.00** |

---

### 🖥️ 4.2 Track A: Local Server PC Sourcing & Spec Tiers (ALTERNATIVE)

If HonTech chooses **Local On-Premise Hosting**, a dedicated Server PC must be purchased and kept running 24/7 in the front office. Sized for HonTech's **3 to 5 staff users per branch (6–10 users across 2 branches)**:

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                      HARDWARE SPECIFICATION & SIZING TIERS (3–5 STAFF/BRANCH)                     │
├──────────────────────────┬─────────────────────────────┬──────────────────────────┬───────────────┤
│ TIER / CLASSIFICATION    │ TECHNICAL SPECIFICATIONS    │ OPERATIONAL CAPACITY     │ EST. COST     │
├──────────────────────────┼─────────────────────────────┼──────────────────────────┼───────────────┤
│ 🥉 Standard Criteria     │ Core i3 (10th Gen+) / R3    │ **Branch 1 (Marikina)**  │ ₱14,500 –     │
│    (Single Shop Baseline)│ 8GB RAM, 256GB NVMe SSD     │ 3–5 Staff + 1 Lounge TV  │ ₱17,500       │
│                          │ Windows 10/11 Home/Pro      │ (~15–25 cars/day)        │ *(or ₱0 old)* │
├──────────────────────────┼─────────────────────────────┼──────────────────────────┼───────────────┤
│ 🥈 Work-Grade Class      │ Core i5 (11th/12th Gen) / R5│ **Both Branches 1 & 2**  │ ₱18,500 –     │
│    (Recommended Standard)│ 16GB RAM, 512GB NVMe SSD    │ 6–10 Staff + 2 Lounge TVs│ ₱23,000       │
│                          │ 80+ Bronze Power Supply     │ (~30–50 cars/day)        │               │
├──────────────────────────┼─────────────────────────────┼──────────────────────────┼───────────────┤
│ 🥇 Mid-Range Premium     │ Core i7 / Ryzen 7           │ **3–4 Future Branches**  │ ₱26,000 –     │
│    Class (Expansion)     │ 32GB RAM, 1TB NVMe SSD      │ 15–20 Staff + 4 TVs      │ ₱32,000       │
│                          │ UPS + Heavy AVR Protection  │ 4+ Years Peak Longevity  │               │
└──────────────────────────┴─────────────────────────────┴──────────────────────────┴───────────────┘
```

---

### 🏢 4.3 Realistic Operational Scenario: "2 Branches with 3–5 Staff Over 4 Years"

Here is how the hardware specifications directly affect HonTech's daily workflow across its 3–5 staff members per location:

* **Branch 1 (Marikina Main — 3 to 5 Users):**
  * 2 Service Advisors intake vehicles and log PMS status updates on tablets.
  * 1 Cashier generates invoices and prints claim stubs.
  * 1 Waiting Lounge TV runs continuously displaying the customer queue.
  * *Daily Volume:* ~15 to 25 repair orders/day.

* **Branch 2 (Expansion Branch — 3 to 5 Users):**
  * 2 Service Advisors, 1 Cashier, and 1 Waiting Lounge TV.
  * *Daily Volume:* ~15 to 25 repair orders/day.

* **4-Year Cumulative Data Load:**
  * After 4 years of daily operations, the central database will store **~45,000 vehicle repair histories, customer contact profiles, Express 2H delay logs, and audit trails**.

#### 💥 Why Cheap / Consumer Celeron (4GB RAM) PCs Struggle Even with 3–5 Users:
* When 3 Service Advisors click *"Save Job"* at the exact same second while the Lounge TV is auto-refreshing, a 4GB RAM PC runs out of memory buffers.
* Staff experience annoying 3–5 second input freezes, and consumer power supplies overheat from running 24/7 in hot auto shop bays.

#### 🛡️ Why Work-Grade Class (16GB RAM + NVMe SSD) Runs Flawlessly:
* **Instant 15ms Response Times:** With 16GB RAM, the entire 45,000-vehicle database stays cached in active memory. Even during peak morning intake rushes, queries return instantly.
* **4+ Years 24/7 Durability:** High-grade cooling and an 80+ Bronze certified power supply prevent hardware crashes, giving HonTech total operational peace of mind for years without replacement.


---

### 🛒 4.4 Joint Gilmore Sourcing & Inspection Plan (If Option A is Chosen)
* **Online Canvassing:** Team and client canvass real-time pricing from *Lazada, Shopee, EasyPC, PC Express, and DynaQuest*.
* **On-Site Gilmore Buying Trip:** Team and client visit **Gilmore Computer Center** together to inspect physical parts, verify 1–3 year manufacturer warranties, and negotiate store bundle discounts.
* *Alternative Option:* Repurpose an existing functional Core i3/i5 office desktop at **₱0.00 hardware cost**.

---

### 📺 4.5 Customer Waiting Lounge TV (Both Options)
* **Current Status:** HonTech AutoCenter **already owns a functional Smart TV** in the customer lounge.
* **Week 2 Inspection:** Team will test the built-in browser with the TV URL (`?mode=tv`), inspect Wi-Fi stability, and only recommend an HDMI streaming stick (*Google Chromecast / Fire Stick ~₱1,800*) if the TV browser is slow.


---

## 5. Dual Detailed Weekly Execution Roadmaps (September 2026 Rollout)

To ensure a smooth, zero-downtime transition for HonTech AutoCenter, we have structured comprehensive 4-week execution schedules for both deployment tracks. Each week defines clear technical objectives, on-site activities, client touchpoints, and tangible milestone deliverables.

---

### 🌟 TRACK B: Modern Cloud Deployment Roadmap (RECOMMENDED)
*Fastest deployment path, ₱0 upfront server hardware cost, and instant multi-device synchronization.*

| Week / Period | Phase & Objectives | Key Engineering & On-Site Activities | Client & Staff Touchpoint | Weekly Milestone Deliverable |
| :--- | :--- | :--- | :--- | :--- |
| **Week 1**<br>*(Sept 1–5)* | **Cloud Infrastructure & Account Provisioning** | • Provision production accounts on Vercel and Supabase<br>• Deploy database schema and initial test seed data<br>• Configure SSL security certificates & custom web domain<br>• Verify sub-100ms API response times | • Kickoff alignment meeting with management<br>• Confirm staff role accounts *(Owner, Admin, 2 SAs, 1 Cashier)* | ✅ **Live Cloud System URL Active & Accessible** |
| **Week 2**<br>*(Sept 8–12)* | **Multi-Device Sync & Workshop Validation** | • Connect front desk office PCs & SA tablets to cloud domain<br>• Configure Customer Lounge Smart TV display (`?mode=tv`)<br>• Validate real-time WebSocket live updates across repair bays<br>• Test ₱999 backup 4G/5G mobile router failover | • On-site inspection of shop Wi-Fi signal in bays & lounge<br>• Verify TV screen visibility and auto-refresh in lounge | ✅ **All Shop Devices Connected & Verified** |
| **Week 3**<br>*(Sept 15–19)* | **Staff Training & "Shadow Mode" Dry-Run** | • Conduct 60-min hands-on training for Service Advisors & Cashier<br>• Demonstrate Express 2-Hour SLA delay logging & claim stub printing<br>• Train Owner/Manager on remote mobile phone dashboard<br>• Execute 2–3 day live customer "Shadow Mode" *(dual entry)* | • SAs use digital system alongside existing paper stubs<br>• Team gathers daily workflow feedback from staff | ✅ **100% Staff Certified & Confident** |
| **Week 4**<br>*(Sept 22–30)* | **Full Digital Go-Live & Formal Handover** | • Official retirement of paper claim stubs (100% digital cutover)<br>• Final latency fine-tuning and security verification<br>• Delivery of PDF User Manuals, Admin Guides, & Fallback Runbooks<br>• Kickoff of 1–2 months complimentary warranty & support | • Owner signs Project Handover Authorization<br>• System fully adopted as standard daily operating procedure | ✅ **Production Go-Live & Warranty Active** |

---

### 🖥️ TRACK A: Local On-Premise Intranet Roadmap (ALTERNATIVE)
*Complete physical data sovereignty inside the building; requires dedicated PC purchase and on-site network cabling.*

| Week / Period | Phase & Objectives | Key Engineering & On-Site Activities | Client & Staff Touchpoint | Weekly Milestone Deliverable |
| :--- | :--- | :--- | :--- | :--- |
| **Week 1**<br>*(Sept 1–5)* | **Hardware Canvassing & Shop LAN Audit** | • Finalize bill of materials for Work-Grade Server PC<br>• Audit Gilmore Computer Center real-time parts pricing<br>• Inspect shop router, Cat6 cabling, and front desk power outlets<br>• Schedule joint Gilmore buying trip | • Management approves hardware budget (~₱18.5k–₱23k)<br>• Schedule date for Gilmore visit | ✅ **Final Gilmore Purchasing Checklist Ready** |
| **Week 2**<br>*(Sept 8–12)* | **Hardware Procurement, Assembly & Network Setup** | • Joint Gilmore parts purchase & warranty verification<br>• Assemble Work-Grade PC, install Windows OS, XAMPP, & MySQL<br>• Assign static local IP (`192.168.1.100`) & configure shop Wi-Fi<br>• Wire primary server directly via Cat6 Ethernet cable<br>• Install UPS battery backup & configure automated local backups | • Client purchases hardware in Gilmore<br>• Server PC physically positioned in front office | ✅ **Server PC Assembled, Configured & Running 24/7** |
| **Week 3**<br>*(Sept 15–19)* | **Local Multi-Device Validation & "Shadow Mode"** | • Connect SA tablets & Lounge Smart TV to local server IP<br>• Conduct 60-min staff training on job intake & claim stubs<br>• Execute 2–3 day live customer "Shadow Mode" *(dual entry)*<br>• Test local database automatic backup batch scripts to USB | • Staff practice on local shop network<br>• Management reviews daily entry speed and feedback | ✅ **Shop Devices Synced & Staff Trained** |
| **Week 4**<br>*(Sept 22–30)* | **Full Digital Go-Live & Formal Handover** | • Official retirement of paper claim stubs (100% digital cutover)<br>• Delivery of printed & PDF User Manuals, Admin Guides, and Emergency Fallback Runbook<br>• Kickoff of 1–2 months complimentary warranty & support | • Owner signs Project Handover Authorization<br>• System operational as primary shop workflow | ✅ **Production Go-Live & Warranty Active** |

---

## 6. Staff Training & "Shadow Mode" Dry Run Protocol

```
[ Step 1: Guided Staff Workshop (60 Mins) ]
  • Front desk walk-in & booking workflow
  • Express 2-Hour SLA delay logging
  • 80mm / PDF Claim Stub printing
              │
              ▼
[ Step 2: "Shadow Mode" Dry Run (2–3 Days) ]
  • Staff use paper stubs + digital system simultaneously
  • Zero risk to actual shop operations
  • Identifies UI/UX questions in real time
              │
              ▼
[ Step 3: Full Go-Live Cutover ]
  • Paper stubs retired
  • 100% synchronized digital workflow
```

---

## 7. Security Governance, Internal & External Cyber Defense Protocols

To safeguard customer privacy, financial data, and shop operational integrity, the system implements a multi-layered security model addressing both **Internal Workshop Defense** and **External Cyber Exposure**:

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           INTERNAL VS. EXTERNAL SECURITY COMPARISON                               │
├──────────────────────────┬────────────────────────────────────┬───────────────────────────────────┤
│ SECURITY LAYER           │ OPTION A: LOCAL INTRANET SERVER    │ 🌟 OPTION B: MODERN CLOUD (RECOMM)│
├──────────────────────────┼────────────────────────────────────┼───────────────────────────────────┤
│ 🔒 Inside the Shop       │ • Private internal shop Wi-Fi      │ • Automatic role permissions      │
│    (Staff & Workflow)    │ • Server PC password protection    │ • SAs cannot view owner finances  │
│                          │ • Strict 4-role staff permissions  │ • Branch data completely isolated │
│                          │ • Reason-Required change logs      │ • Reason-Required change logs     │
├──────────────────────────┼────────────────────────────────────┼───────────────────────────────────┤
│ 🌐 Outside the Shop      │ • **Hidden from Online Hackers**   │ • **Bank-Grade Cloud Protection** │
│    (Internet & Remote)   │ • Invisible to public internet     │ • Automatic SSL Padlock (HTTPS)   │
│                          │ • Immune to online attacks         │ • Stored in Tier-4 data centers   │
│                          │ • No open router ports needed      │ • Automatic password brute-force  │
│                          │                                    │   rate-limiting                   │
└──────────────────────────┴────────────────────────────────────┴───────────────────────────────────┘
```

---

### 🔒 7.1 Internal Security Architecture (Workshop Floor & LAN Defense)

Internal security prevents unauthorized access or accidental data tampering by staff, technicians, or visitors inside the shop:

* **Role-Based Access Control (RBAC):**
  * **Owner:** Complete system control, global multi-branch analytics, staff creation, database reset, and backup exports.
  * **Admin:** System configuration, branch audit trail inspection, and repair monitoring.
  * **Service Advisor (SA):** Job intake, claim stub printing, status updates, and Express 2H delay reporting. *Strictly restricted from viewing financial revenue reports or deleting records.*
  * **Assistant:** View-only queue inspection and bay progress updates.
* **Tamper-Proof Reason-Required Audit Trail (`job_audit_logs`):**
  * Any modification to departure times, service categories, lane types, or vehicle diagnoses **requires a mandatory operational justification** (*e.g., "Customer requested additional brake pad replacement"*).
  * The system records the old value, new value, editor's full name, role, and exact timestamp into an immutable audit table.
* **Local LAN Network Segmentation (Option A):**
  * The server runs on a dedicated **Staff Wi-Fi network (`HonTech_Staff`)** with WPA3 encryption, completely separated from customer lounge guest Wi-Fi.
  * Windows Server PC is locked with a dedicated Administrator password, and public database consoles (PHPMyAdmin) are disabled on external network interfaces.

---

### 🌐 7.2 External Security Architecture (Cyber Attack Exposure & Cloud Defense)

External security protects HonTech's business data from outside internet hackers, malware, and unauthorized remote access:

* **Option A: Physical Air-Gap Protection (Maximum Peace of Mind):**
  * Because the Local Server operates purely on internal copper cables and shop Wi-Fi, **it has 0 open ports to the outside world**.
  * Automated internet web crawlers, ransomware bots, and foreign cyber attackers cannot scan or reach the server because it is not connected to a public IP address.
  * *Remote Multi-Branch Access:* If Branch B needs to connect, we use a **Zero-Trust Cloudflare Tunnel (`cloudflared`)**, which authenticates connections over encrypted outbound tunnels without opening risky inbound firewall ports.
* **Option B: Enterprise Cloud Defense (Tier-4 Infrastructure):**
  * **DDoS & Bot Mitigation:** Hosted behind Cloudflare’s global Anycast edge network, automatically filtering malicious traffic spikes.
  * **Data Encryption in Transit & at Rest:** All data exchanged between staff devices and the cloud is encrypted with **SSL/TLS 1.3** and stored under **AES-256 hardware encryption**.
  * **Brute-Force Login Protection:** Authentication endpoints utilize **Bcrypt password hashing (Cost Factor 10)** with automated rate-limiting to prevent password-guessing attacks.

---

### ⚡ 7.3 Emergency Power Outage & Fallback Protocol

* In the event of a total municipal power failure (Meralco blackout):
  1. The server UPS maintains power for 15–20 minutes to permit a clean database shutdown.
  2. Staff temporarily issue backup paper claim stubs.
  3. Upon power restoration, the system restarts automatically via Windows Startup scripts, and paper stubs are digitized in under 5 minutes.


---

## 8. Handover Deliverables Package & Project Authorization

Upon project completion and sign-off, HonTech AutoCenter management will receive:
1. **Configured Working System:** Fully operational and active on the chosen platform (*Recommended Cloud or Local Server*).
2. **Staff Quick-Start User Manual (PDF):** Visual, screenshot-heavy guide for Front Desk & Service Advisors.
3. **Administrator & Security Guide (PDF):** Manual for Owner/Admin covering user accounts, roles, audit histories, and password resets.
4. **Emergency Fallback Protocol (PDF):** Clear contingency steps for power outages and database recovery.
5. **Source Code & Database Architecture Archive:** Full system code and initial database snapshot.
6. **Complimentary 1–2 Months Maintenance & Warranty:** Free bug fixes, performance monitoring, and staff support during the operational transition.
7. **Optional Post-Warranty Support:** After the complimentary 2-month warranty, HonTech may opt into an affordable on-call IT retainer (or on-demand per visit) covering periodic checkups, manual/cloud backups, and future enhancements.

---

### ✍️ Formal Project Review, Endorsement & Authorization

#### Part I: Prepared & Submitted by the Development Team
\
**Lead System Architect & Designer:** ___________________________  
**Mary Dayne Villas T.**  
*Signature over Printed Name* | **Date:** September 2, 2026

\
**Lead Systems Developer & Implementation Engineer:** ___________________________  
**Justin Nolasco J.**  
*Signature over Printed Name* | **Date:** September 2, 2026

\
**Technical Documentation & QA Lead:** ___________________________  
**Catherine Ramos G.**  
*Signature over Printed Name* | **Date:** September 2, 2026

---

#### Part II: Academic Faculty Review & Verification
\
**Capstone Project Adviser:** ___________________________  
**Mr. Ar-Jay C. Agbayani**  
*Faculty Capstone Project Adviser | Department of Information Technology*

**Date Reviewed & Verified:** ___________________________  
**Adviser Review Status:** `[  ] Endorsed for Client Presentation & Execution` &nbsp;&nbsp;&nbsp; `[  ] Endorsed with Minor Revisions`  
**Adviser Notes / Remarks:** __________________________________________________________________

---

#### Part III: Client Acceptance & Authorization (HonTech AutoCenter)
\
**Client Representative / Business Owner:** ___________________________  
**HonTech AutoCenter Management**  
*Signature over Printed Name*

**Date Approved:** ___________________________  
**Selected Deployment Architecture:**  
`[  ] Option B: Modern Cloud Solutions (Vercel + Supabase) — RECOMMENDED`  
`[  ] Option A: Local Intranet Hosting (On-Premise Server PC)`

---
---

# 📖 APPENDIX A: Complete Local Intranet Feasibility & Zero-Risk Setup Blueprint

*This section provides the full, unabridged engineering guide for Local Intranet Hosting.*

### A.1. Executive Feasibility Statement: "Does Local Hosting Really Work?"
**The Direct Answer: YES, 100% YES.**
Local intranet hosting is **not experimental**. It is the standard architecture used by thousands of automotive workshops, dental clinics, point-of-sale (POS) systems, pharmacies, and hardware stores across the Philippines.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         HOW LOCAL HOSTING ACTUALLY WORKS                         │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   [ SHOP ROUTER / WI-FI ] (e.g., PLDT / Globe / TP-Link Router)                  │
│         │                                                                        │
│         ├── (Cat6 Cable) ──► [ LOCAL SERVER PC (XAMPP / PHP / MySQL) ]           │
│         │                    Static IP: 192.168.1.100                            │
│         │                                                                        │
│         ├── (Wi-Fi) ────────► [ Front Desk PC / Tablet ] (SA Intake & Billing)   │
│         ├── (Wi-Fi) ────────► [ Service Advisor Tablets ] (Bay Status Updates)   │
│         └── (Wi-Fi / HDMI) ─► [ Waiting Lounge Smart TV ] (Customer Queue Board) │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Why You Can Be Confident It Will Not Fail:
1. **Zero External Internet Needed:** The entire database, API, and user interface run directly inside the shop's local network. If an internet cable gets cut outside on the street, **your system continues running at full speed**.
2. **Instant Response Times:** Pages load in **15–30 milliseconds** because data travels over local copper cables and shop Wi-Fi rather than round-tripping across international cloud servers.
3. **No Expensive Server Needed:** HonTech **does NOT need an expensive ₱50,000 enterprise server**. A standard budget desktop, a refurbished mini-PC (₱6,000–₱9,000), or even an existing functional office laptop is more than powerful enough to handle 50+ simultaneous shop devices.

### A.2. Preventing Financial Waste: Hardware Budget Options
To protect the client from spending too much money, here are the **3 real-world hardware paths** ranked by budget:

| Path | Hardware Choice | Estimated Cost | Feasibility & Verdict |
| :--- | :--- | :--- | :--- |
| **Option 1 (Best Value)** | **Repurpose Existing Shop PC or Laptop** | **₱0.00** | **100% Feasible.** If HonTech has a spare office desktop or laptop (Core i3 / 8GB RAM), install XAMPP and make it the server. Zero money spent! |
| **Option 2 (Recommended Budget)** | **Refurbished Mini-PC (Dell OptiPlex / HP ProDesk)** | **₱6,500 – ₱9,500** | **100% Feasible & Ultra-Durable.** Tiny footprint, low power consumption (~35W), runs 24/7 quietly in the office. Available at Gilmore or online. |
| **Option 3 (Brand New Build)** | **New Entry-Level Desktop (Ryzen 3 / Core i3)** | **₱16,500 – ₱22,000** | **100% Feasible.** Good if the client wants brand-new parts with 1–3 year manufacturer warranties. |

### A.3. Solving the Wi-Fi & Network Reliability Problem
The biggest worry with local hosting is: *"What if the staff tablets can't connect to the Wi-Fi or can't find the server?"*

Here are the **4 engineering rules** to ensure 100% connection reliability:
1. **Rule 1 (Always Wire the Server PC via Cat6 Ethernet):** Connect the Server PC directly to the main router LAN port using a Cat6 cable. Physical cables give the server an unbreakable 1,000 Mbps connection.
2. **Rule 2 (Set a Permanent Static IP Address):** Set the Server PC's IPv4 address permanently to `192.168.1.100` (Subnet: `255.255.255.0`, Gateway: `192.168.1.1`). Even if the router restarts during a brownout, DHCP will never change the IP address.
3. **Rule 3 (Single Unified Shop Wi-Fi SSID):** Ensure all tablets and laptops connect to the primary shop Wi-Fi network (e.g., `HonTech_Staff`). Avoid connecting staff devices to Guest Wi-Fi or isolated range extenders.
4. **Rule 4 (Windows Firewall Inbound Rule for Port 80 & 3306):** In Windows Defender Firewall $\rightarrow$ Inbound Rules, add an Allow Rule for TCP Port 80 (Apache) and TCP Port 3306 (MySQL).

### A.4. Multi-Branch Connection on Local Hosting (Cloudflare Tunnel)
If HonTech opens Branch B across town while keeping the local server in Branch A:
* Install the official free `cloudflared` utility on the Branch A Server PC.
* Cloudflare creates a secure, encrypted tunnel to the internet without needing a static public IP or risky router port forwarding.
* **Result:** Branch B and the shop Owner on their smartphone can access `https://hub.hontechautocenter.com` securely for **₱0/month**, while all data remains stored on the local Branch A PC!

### A.5. Zero-Risk Testing Checklist (Test Today on Your Laptop!)
* [ ] **Step 1:** Connect your laptop and your smartphone to the same home/shop Wi-Fi network.
* [ ] **Step 2:** Open Command Prompt (`cmd`) on your laptop and type `ipconfig`. Note your IPv4 Address (e.g., `192.168.1.15`).
* [ ] **Step 3:** Start Apache and MySQL in XAMPP.
* [ ] **Step 4:** Open the browser on your smartphone and type `http://192.168.1.15/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/frontend/index.html`.
* [ ] **Step 5:** Log in as Service Advisor or Owner on your phone.
* [ ] **Step 6:** Open the Waiting Lounge TV view on another screen (`?mode=tv`).
* [ ] **Result:** Create a new vehicle job on your phone $\rightarrow$ watch it immediately appear on your laptop and TV screen.

---
---

# 📖 APPENDIX B: Complete Cloud Sandbox PoC Setup Blueprint (Vercel + Supabase)

*This section provides the full, unabridged engineering guide for Cloud Sandbox Testing.*

### B.1. Overview & Free Sandbox Strategy
Creating a **separate Proof of Concept (PoC) repository** to test **Vercel + Supabase Free Tiers** is the industry standard for risk-free software evaluation:

```
┌────────────────────────────────────────────────────────┐
│ 🛡️ PRIMARY PRODUCTION REPO (HonTech PHP/MySQL)         │
│ • Branch: `branch2-Security-Account-Recovery`          │
│ • 100% Stable, Protected, and Working Locally          │
└────────────────────────────────────────────────────────┘
                           ▲
                           │ Isolated (Zero Risk)
                           ▼
┌────────────────────────────────────────────────────────┐
│ 🧪 SANDBOX POC REPO (e.g. `hontech-cloud-poc`)         │
│ • Vercel Frontend + Supabase PostgreSQL Realtime       │
│ • Free Tier Sandbox for Client Demonstration           │
└────────────────────────────────────────────────────────┘
```

### B.2. What the 100% Free Tiers Include (₱0.00 / No Credit Card Needed)

| Service | Free Tier Allowance | What You Get |
| :--- | :--- | :--- |
| **Vercel** (Hobby Plan) | **$0 / month forever** | • Unlimited preview deployments<br>• Automated HTTPS/SSL certificates<br>• Custom domains (e.g. `hontech-demo.vercel.app`)<br>• Fast Global Edge CDN |
| **Supabase** (Free Tier) | **$0 / month forever** | • 500 MB PostgreSQL Database Storage<br>• Up to 2 Free Cloud Projects<br>• 50,000 Monthly Active Users<br>• **Native Realtime WebSockets** (instant TV queue pushes)<br>• Web-based Table Editor & SQL Console |

### B.3. Step-by-Step 15-Minute Sandbox Setup Guide

#### Step 1: Create Free Cloud Accounts
1. **Supabase:** Go to [supabase.com](https://supabase.com) $\to$ Sign in with your **GitHub Account**. Click **"New Project"** (e.g. `hontech-poc-marikina`).
2. **Vercel:** Go to [vercel.com](https://vercel.com) $\to$ Sign up with your **GitHub Account**.

#### Step 2: Create a Minimal Sandbox Table in Supabase
In your Supabase project dashboard, open the **SQL Editor** and run this simple script to create a sample job queue table with Realtime enabled:

```sql
-- 1. Create a minimal Jobs table
CREATE TABLE poc_jobs (
    id BIGSERIAL PRIMARY KEY,
    plate_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    service_type TEXT NOT NULL DEFAULT 'PMS',
    bay_number TEXT NOT NULL DEFAULT 'Bay 1',
    status TEXT NOT NULL DEFAULT 'In Progress',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Supabase Realtime Broadcasting
ALTER PUBLICATION supabase_realtime ADD TABLE poc_jobs;

-- 3. Insert initial test vehicle
INSERT INTO poc_jobs (plate_number, customer_name, service_type, bay_number, status)
VALUES ('ABC 1234', 'Juan Dela Cruz', 'PMS (Periodic Maintenance)', 'Bay 1', 'In Progress');
```

#### Step 3: Minimal 1-File Working PoC (`index.html`)
Create a standalone file `index.html` with this complete working demonstration code:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HonTech Cloud PoC (Vercel + Supabase Realtime)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Official Supabase Client CDN -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-6">
    <div class="max-w-4xl mx-auto space-y-6">
        
        <!-- Header -->
        <div class="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex items-center justify-between">
            <div>
                <h1 class="text-xl font-black uppercase text-white tracking-wide">HonTech Cloud Queue PoC</h1>
                <p class="text-xs text-slate-400">Live Realtime Sync via Supabase WebSockets & Vercel</p>
            </div>
            <span class="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full animate-pulse">
                ⚡ Realtime Connected
            </span>
        </div>

        <!-- Add Vehicle Form -->
        <div class="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
            <h2 class="text-sm font-bold uppercase text-slate-300">Fast Vehicle Dispatch Demo</h2>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input id="poc-plate" type="text" placeholder="Plate (e.g. NBD 9988)" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white outline-none focus:border-cyan-400">
                <input id="poc-name" type="text" placeholder="Customer Name" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-cyan-400">
                <button onclick="addPocJob()" class="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase text-xs rounded-lg py-2 transition shadow-md cursor-pointer">
                    + Dispatch to Queue
                </button>
            </div>
        </div>

        <!-- Live Realtime TV Queue Cards -->
        <div class="space-y-3">
            <h2 class="text-sm font-bold uppercase text-slate-300">Live Workshop Bay Queue</h2>
            <div id="poc-queue-list" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- Cards will render dynamically -->
            </div>
        </div>

    </div>

    <script>
        // 1. Initialize Supabase Client (Paste your keys from Supabase Dashboard -> Settings -> API)
        const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
        const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // 2. Fetch and render initial jobs
        async function fetchJobs() {
            const { data, error } = await supabase.from('poc_jobs').select('*').order('id', { ascending: false });
            if (error) return console.error(error);
            renderQueue(data);
        }

        // 3. Render Queue Cards
        function renderQueue(jobs) {
            const container = document.getElementById('poc-queue-list');
            if (!jobs || jobs.length === 0) {
                container.innerHTML = `<p class="text-xs text-slate-500 italic">No vehicles in queue.</p>`;
                return;
            }
            container.innerHTML = jobs.map(j => `
                <div class="bg-slate-800/90 border border-slate-700 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div>
                        <span class="font-mono font-black text-cyan-400 text-sm tracking-wider">${j.plate_number}</span>
                        <p class="text-xs font-bold text-white">${j.customer_name}</p>
                        <p class="text-[11px] text-slate-400">${j.service_type} • <span class="text-amber-400 font-semibold">${j.bay_number}</span></p>
                    </div>
                    <span class="px-2.5 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-bold uppercase rounded-lg">
                        ${j.status}
                    </span>
                </div>
            `).join('');
        }

        // 4. Dispatch new vehicle
        async function addPocJob() {
            const plate = document.getElementById('poc-plate').value.trim();
            const name = document.getElementById('poc-name').value.trim();
            if (!plate || !name) return alert('Please enter plate number and name');

            const { error } = await supabase.from('poc_jobs').insert([{
                plate_number: plate,
                customer_name: name,
                service_type: 'PMS Express (10,000 KM)',
                bay_number: 'Bay 2',
                status: 'In Progress'
            }]);

            if (error) alert('Error: ' + error.message);
            document.getElementById('poc-plate').value = '';
            document.getElementById('poc-name').value = '';
        }

        // 5. Subscribe to Realtime WebSocket Updates
        supabase.channel('custom-all-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'poc_jobs' }, () => {
                fetchJobs(); // Auto re-fetches when any device adds/updates a vehicle!
            })
            .subscribe();

        // Initial Load
        fetchJobs();
    </script>
</body>
</html>
```

#### Step 4: Deploy to Vercel in 60 Seconds
1. Create a new GitHub repository named `hontech-cloud-poc` and push `index.html`.
2. Go to [vercel.com](https://vercel.com) $\to$ Click **"Add New..."** $\to$ **"Project"** $\to$ Select `hontech-cloud-poc`.
3. Click **"Deploy"**.
4. In ~20 seconds, Vercel gives you a live global link (e.g. `https://hontech-cloud-poc.vercel.app`).
5. Open the link on your phone and on a laptop $\rightarrow$ Add a vehicle on your phone $\rightarrow$ **Watch it instantly pop up on your laptop screen in under 100 milliseconds via WebSockets!**

---
---

# 📖 APPENDIX C: DEVELOPER DUAL-REPOSITORY WORKFLOW, ADAPTER PATTERN & TESTING PROTOCOL

*This section defines the exact developer workflow, repository isolation rules, 3-step cloud adapter transition, and comprehensive unit testing protocols for Justin Nolasco J. (Lead Systems Developer).*

### C.1. Dual-Repository Sandboxing Architecture

```
                                 [ JUSTIN NOLASCO J. ]
                               (Lead Systems Developer)
                                          │
            ┌─────────────────────────────┴─────────────────────────────┐
            ▼                                                           ▼
┌──────────────────────────────────────────┐ ┌──────────────────────────────────────────┐
│ 🛡️ REPOSITORY 1: PRODUCTION SYSTEM       │ │ 🧪 REPOSITORY 2: CLOUD SOLUTIONS ENGINE  │
│ `Hontech_Main_Active_Development_PHP_SQL`│ │ `hontech-cloud-vercel-supabase`          │
├──────────────────────────────────────────┤ ├──────────────────────────────────────────┤
│ • Full Stack: PHP PDO + MySQL + JS       │ │ • Serverless: Vercel CDN + Supabase DB   │
│ • Express 2H SLA + Audit History Modal   │ │ • Live Realtime WebSocket broadcast      │
│ • Local Intranet XAMPP (192.168.1.100)   │ │ • Live HTTPS URL: `hontech.vercel.app`   │
│ • OR Standard Cloud VPS (0 code refactor)│ │ • ₱0.00 / Month Permanent Free Tier      │
│ • Git: `branch2-Security-Account-Recovery│ │ • Git: `main` (Isolated cloud repo)      │
└──────────────────────────────────────────┘ └──────────────────────────────────────────┘
```

---

### C.2. Repository 1: Primary Production Engine (`Hontech_Main_Active_Development_PHP_SQL`)

* **Primary Purpose:** Official capstone production codebase containing the complete business logic, RBAC, 2-Hour Express PMS SLA alerts, audit trails, and claim stub printing.
* **Dual Deployment Capability (No Code Refactoring Needed):**
  * **Local Intranet Mode:** Placed on the shop's local Windows Server PC inside `C:\xampp\htdocs\...`. Accessed at `http://192.168.1.100/frontend/index.html`.
  * **Standard Cloud Mode:** Uploaded directly to any PHP/MySQL cloud host (e.g. Railway, Render, DigitalOcean, Hostinger). Runs on standard HTTPS (`https://app.hontechautocenter.com`) with **0 code changes**.
* **Branch Strategy:**
  * Active development: `branch2-Security-Account-Recovery`
  * Stable client release: `main`

---

### C.3. Repository 2: Cloud Solutions Engine (`hontech-cloud-vercel-supabase`)

* **Primary Purpose:** An isolated, dedicated cloud repository used to run the serverless cloud version on Vercel + Supabase without touching or risking the primary PHP/MySQL production code.
* **Tech Stack:**
  * Frontend: Static HTML5, Tailwind CSS, Vanilla JavaScript.
  * Backend: Supabase PostgreSQL Realtime (`@supabase/supabase-js`).
  * Hosting: Vercel Global Edge Network.
* **Cost:** ₱0.00 forever (No credit card required).

---

### C.4. The 3-Step Simple Code Transition Process (The Adapter Pattern)

If the client chooses Cloud Solutions, the code transition is straightforward because our frontend and backend are completely decoupled:

```
[ STEP 1: Initialize New Cloud Repository ]
  • Create `hontech-cloud-vercel-supabase` on GitHub.
  • Copy over 100% of the Frontend UI (`index.html`, CSS, icons, modals, and tables).
  • Zero local hosting code is deleted or removed from Repo 1.
              │
              ▼
[ STEP 2: Swap the Data Layer Only (Adapter Pattern) ]
  • Keep 100% of the UI design, Express SLA overdue badges, and modal popups.
  • Paste Supabase Project URL & Anon Key in the client configuration.
  • Replace PHP `fetch('api/jobs.php')` calls with `supabase.from('jobs').select()` or Realtime WebSockets.
              │
              ▼
[ STEP 3: Execute Formal Unit Testing Suite & Deploy 🧪 ]
  • Run comprehensive unit tests to verify all 4 roles and real-time syncing.
  • Connect repo to Vercel for 30-second automated worldwide deployment.
```

---

### C.5. Formal Unit Testing & Functionality Verification Matrix

Before client handover or capstone defense, the developer executes the following 4 verification test cases:

| Test Case | Target Feature | Procedure | Expected Pass Criteria |
| :--- | :--- | :--- | :--- |
| **Test 1: Realtime Push** | Waiting Lounge TV | Add vehicle on smartphone as SA | Vehicle appears on TV in **$\le 100\text{ ms}$** without refreshing page. |
| **Test 2: Express 2H SLA** | Express Overdue Badge | Run test vehicle with arrival > 120m ago | Dynamic `⚠️ Express 2H Limit Exceeded` badge renders; Delay Report modal saves reason. |
| **Test 3: RBAC Isolation** | 4-Role Permissions | Log in as SA, Admin, Assistant, Owner | SAs restricted to intake; Admins restricted to branch; Owner has global rollup. |
| **Test 4: Claim Stub Print** | Receipt Generation | Click "Print Claim Stub" on active job | Generates 80mm thermal receipt & formatted printable PDF with vehicle barcode. |

---

### C.6. Developer Hardware Decision & Deployment Flowchart

```
                 [ STEP 1: CLIENT HARDWARE PROCUREMENT IN GILMORE ]
                                          │
                                          ▼
                      [ Did client buy Front Desk & SA Screens? ]
                                          │
                                          ▼
                      [ Is there budget left for a Server PC? ]
                                          │
                       ┌──────────────────┴──────────────────┐
                       ▼ YES                                 ▼ NO
      [ OPTION A: LOCAL INTRANET ]               [ OPTION B: CLOUD HOSTING ]
      • Install XAMPP on Server PC               • Launch Repo 2 on Vercel/Supabase
      • Deploy Repo 1 (PHP + MySQL)              • OR Deploy Repo 1 on Cloud PHP host
      • Set Static IP 192.168.1.100              • ₱0 Server Hardware Needed
      • Connect via Shop Wi-Fi & LAN             • Live worldwide via HTTPS in 15 mins
```

---

### C.7. Developer Best Practices & Quality Checklist

1. **Defensive DOM Operations:** Always verify element existence (`if (document.getElementById('...'))`) before accessing properties to prevent uncaught runtime errors during role switching.
2. **Cache Busting Rule:** Always increment the script query version in `frontend/index.html` (e.g., `js/app.js?v=4.39`) when updating JavaScript logic.
3. **Repository Isolation:** Never mix Supabase sandbox experimental files into the primary PHP/MySQL repository; keep them in their separate GitHub repository (`hontech-cloud-vercel-supabase`) for clean version control.


