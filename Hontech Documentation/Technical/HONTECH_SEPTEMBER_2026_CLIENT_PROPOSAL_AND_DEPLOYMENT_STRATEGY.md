# HONTECH AUTOCENTER
## Operations Management & Service Bay Queue System
### Technical Architecture Evaluation, Deployment Strategy & Implementation Roadmap

---

**Client Organization:** HonTech AutoCenter (Management & Operations)  
**Project Initiative:** Enterprise Bay Management & Queue Monitoring Platform  
**Prepared by — HonTech Development Team:**  
• **Mary Dayne Villas T.** — *System Architect & System Designer*  
• **Justin Nolasco J.** — *Lead Systems Developer & Technical Implementation*  
• **Catherine Ramos G.** — *Technical Documentation & QA Lead*  
**Capstone Project Adviser:** **Mr. Ar-Jay C. Agbayani** *(Faculty Adviser | Department of Information Technology)*  
**Target Deployment Period:** September 2026 Rollout  
**Document Classification:** Official Client Proposal & Strategic Deployment Blueprint (Version 14.0)  

---

## Table of Contents
1. [Executive Summary & Project Purpose](#1-executive-summary--project-purpose)
2. [Technical Evaluation: Local On-Premise vs. Modern Cloud Operations](#2-technical-evaluation-local-on-premise-vs-modern-cloud-operations)
   - [Option A: Local On-Premise Intranet Hosting](#️-option-a-local-on-premise-intranet-hosting-in-shop-server-pc)
   - [Option B: Modern Cloud Solutions (Recommended)](#️-option-b-modern-cloud-solutions-vercel--supabase--recommended)
   - [Operational Feature & Cost Comparison Table](#-operational-feature--cost-comparison-table)
3. [Comprehensive Risk Assessment & Mitigation Plan](#3-comprehensive-risk-assessment--mitigation-plan)
   - [Risk 1: Local Hosting Multi-Branch & Wi-Fi Network Traps](#️-risk-1-local-hosting-multi-branch--in-shop-wi-fi-subnet-traps)
   - [Risk 2: Hardware Budget Constraints (The "Staff Terminals First" Rule)](#️-risk-2-hardware-budget-constraints-the-staff-terminals-first-rule)
   - [Risk 3: Shop Environment & Electrical Power Spikes](#️-risk-3-shop-environment--electrical-power-spikes)
   - [Risk 4: External Internet Outages on Cloud](#️-risk-4-external-internet-outages-on-cloud)
4. [Hardware Sourcing, Spec Classifications & Realistic 2-Branch Scalability](#4-hardware-sourcing-spec-classifications--realistic-2-branch-scalability)
   - [4.1 Track B: Cloud Deployment Device Requirements](#-41-track-b-cloud-deployment-device-requirements-recommended)
   - [4.2 Track A: Local Server PC Sourcing & Spec Tiers](#-42-track-a-local-server-pc-sourcing--spec-tiers-alternative)
   - [4.3 Operational Scenario: 2 Branches Over 4 Years](#-43-realistic-operational-scenario-2-branches-with-35-staff-over-4-years)
   - [4.4 Joint Gilmore Sourcing & Inspection Plan](#-44-joint-gilmore-sourcing--inspection-plan-for-local-on-premise-hosting)
   - [4.5 Customer Waiting Lounge TV](#-45-customer-waiting-lounge-tv-both-options)
5. [Dual Detailed Weekly Execution Roadmaps (September 2026 Rollout)](#5-dual-detailed-weekly-execution-roadmaps-september-2026-rollout)
   - [Track B: Modern Cloud Deployment Plan (Recommended)](#-track-b-modern-cloud-deployment-roadmap-recommended)
   - [Track A: Local Intranet Hosting Plan (Alternative)](#-track-a-local-on-premise-intranet-roadmap-alternative)
6. [Staff Training & "Shadow Mode" Dry-Run Protocol (Draft Framework)](#6-staff-training--shadow-mode-dry-run-protocol)
   - [6.1 Role-by-Role Training Matrix](#-61-role-by-role-training-matrix-draft-framework)
   - [6.2 4-Stage "Shadow Mode" Operational Protocol](#-62-the-4-stage-shadow-mode-operational-protocol-draft-framework)
   - [6.3 Staff Competency & Go-Live Checklist](#-63-staff-competency--go-live-checklist-draft-framework)
7. [Security Governance, Internal & External Cyber Defense Protocols](#7-security-governance-internal--external-cyber-defense-protocols)
8. [Handover Deliverables Package & Project Authorization](#8-handover-deliverables-package--project-authorization)
   - [Comprehensive Deliverables Breakdown](#-comprehensive-deliverables-breakdown-cloud-vs-local)
   - [Formal Project Signatures & Acceptance](#-formal-project-review-endorsement--authorization)

---

## 1. Executive Summary & Project Purpose

The **HonTech Operations Management System** is engineered specifically to **solve the operational limitations and bottlenecks of traditional manual workshop whiteboards**, modernize service bay tracking, automate Express PMS 2-Hour turnaround monitoring, and provide transparent waiting lounge queue displays for HonTech AutoCenter.

### 📋 The Core Workshop Problem: The Limitations of Manual Whiteboards
For years, auto service centers have relied on manual dry-erase whiteboards and paper clipboards to manage daily vehicle queues. However, as customer volume increases, manual whiteboards introduce critical operational bottlenecks:
1. **Accidental Erasures & Lost Data:** Handwriting gets smudged or erased, leaving no permanent audit trail or searchable history once the board is wiped clean at the end of the day.
2. **Unmonitored Turnaround Times:** Manual boards cannot track live elapsed minutes or trigger automated alerts when Express PMS vehicles approach the 2-hour SLA deadline.
3. **Zero Remote Visibility:** Shop owners and general managers cannot check bay status or daily revenue without physically standing in front of the workshop whiteboard.
4. **Customer Waiting Lounge Anxiety:** Customers cannot see their repair progress from the lounge, forcing them to repeatedly approach the counter to ask staff for updates.

### 🌐 The Technological Solution: Web Delivery & Central Database
To replace the vulnerable manual whiteboard and connect front desk terminals, Service Advisor computers, and the Customer Waiting Lounge TV into one synchronized real-time platform, the system requires two foundational technological components:
1. **Web Delivery & Domain Platform:** The platform that serves the real-time visual interface to staff desktop PCs, laptops, and lounge displays without requiring manual whiteboard markers.
2. **Central Database Storage:** The secure, permanent digital repository that preserves vehicle repair orders, customer histories, Express PMS 2-hour SLA turnaround timers, and tamper-proof audit trails for years.

This document provides HonTech AutoCenter ownership with a clear, business-minded evaluation of the two viable hosting pathways—**Option A: Local On-Premise Intranet Server** vs. **Option B: Modern Cloud Solutions**—to help management select the ideal operational model for the workshop.

### 🎓 Academic Software Grant Terms (Zero Software Cost)
* **100% Free Software Grant:** Because this is an official academic capstone development project, **the software, source code, licensing, on-site setup, and staff training are provided to HonTech AutoCenter at ₱0 (FREE of charge).**
* **Client Hardware Ownership:** The only investment required from HonTech AutoCenter is any physical hardware equipment (*if choosing Option A: Server PC, Ethernet cables; if choosing Recommended Option B: ₱0 new hardware*), which remains 100% the property of the client.
* **1–2 Months Complimentary Warranty & Support:** The development team provides 1–2 months of free post-launch monitoring, bug fixes, and operational assistance.

---

## 2. Technical Evaluation: Local On-Premise vs. Modern Cloud Operations

To connect all service bay devices into one synchronized system, HonTech can choose between two operational architectures:

### 🖥️ Option A: Local On-Premise Intranet Hosting (In-Shop Server PC)
* **How it Works:** A dedicated computer physically set up inside HonTech's office acts as the central server (running Apache and MySQL via XAMPP). All staff desktop computers, laptops, and the Waiting Lounge TV connect directly to this local PC through the shop's private Wi-Fi router.
* **How it Solves the Problem:** Keeps all data physically inside the building on internal copper cables and local Wi-Fi. It continues operating normally even if municipal fiber internet goes down, but it requires purchasing a dedicated desktop PC (~₱18,500–₱23,000) and cannot connect multiple physical branches together without complex networking hardware.

### ☁️ Option B: Modern Cloud Solutions (Vercel + Supabase) — RECOMMENDED
* **How it Works:** The web system interface is hosted on a high-speed global web delivery network (Vercel), and the central database is hosted in enterprise cloud data centers (Supabase on AWS). Staff access the system securely through a web browser on any internet-connected device (desktop PCs, laptops, or smartphones).
* **How it Solves the Problem:** Requires **₱0 upfront server hardware cost** (runs on existing office devices), eliminates shop floor clutter, connects multiple branch locations into one master dashboard automatically, and enables remote management from anywhere. It requires an active internet connection (or a ₱999 backup 4G/5G SIM router).

---

### 📊 Operational Feature & Cost Comparison Table

| Evaluation Feature | 🌟 Option B: Modern Cloud *(RECOMMENDED)* | Option A: Local Intranet Server *(Alternative)* |
| :--- | :--- | :--- |
| **Recommendation Status** | **🌟 PRIMARY RECOMMENDATION (Best Value)** | Secondary Supported Alternative |
| **Upfront Hardware Cost** | **₱0** *(Runs on existing office desktop PCs, laptops, & phones)* | ₱14,500 – ₱23,000 *(Requires dedicated Server PC)* |
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
| **Long-Term Quotas & Data Retention Policy** | **100% Free Tier (500,000+ Records / ~45 Years)**<br>• Zero credit card required to operate.<br>• Free 500MB DB stores 500k+ repair orders.<br>• *If ever upgraded to paid and payment lapses:* Cloud providers provide a 30-day grace period; data is never immediately deleted, and a full `.sql` database backup can be downloaded anytime.<br>• *Alternative at 500k records:* Archive older records to CSV at ₱0 cost! | **Zero Provider Risk (100% Sovereign)**<br>• Physical computer stays inside the shop.<br>• No third party can freeze or suspend your records.<br>• Limited only by physical hard drive capacity. |

---

## 3. Comprehensive Risk Assessment & Mitigation Plan

Deploying a mission-critical operations system across service bays requires anticipating technical, physical, and financial failure points. Below are the 4 primary risks and their exact mitigation strategies:

### ⚠️ Risk 1: Local Hosting Multi-Branch & In-Shop Wi-Fi Subnet Traps
* **The Problem (Two Specific Network Failures on Local Servers):** 
  1. **The Multi-Branch Barrier:** If HonTech runs a Local Server PC inside Branch A (Marikina), **Branch B (located across town) cannot access Branch A's server over the standard internet** without purchasing expensive static public IP addresses from PLDT/Globe and installing complex Site-to-Site VPN routers in both buildings.
  2. **In-Shop Wi-Fi Subnet Disconnections:** Within the shop, if a staff desktop PC or laptop connects to a secondary guest Wi-Fi extender or a different router subnet (e.g. `192.168.2.x` instead of the main server router `192.168.1.x`), the computer will lose connection and display a *"Server Not Found"* error even though the staff member is physically inside the building.
* **The Mitigation:**
  * **For Local Hosting (Option A):** We configure a single unified shop Wi-Fi SSID, assign a fixed static IP (`192.168.1.100`), and wire primary front desk terminals directly via Cat6 Ethernet cable.
  * **For Multi-Branch Chains:** If HonTech wants multiple physical branch locations synchronized under one master dashboard, **we strongly recommend Option B (Cloud Vercel + Supabase)**, which connects all branches instantly over any internet with zero network configuration.

---

### ⚠️ Risk 2: Hardware Budget Constraints (The "Staff Terminals First" Rule)
* **The Problem:** 
  * If HonTech has an allocated hardware budget and prioritizes purchasing desktop PCs and laptops for the Service Advisors and front desk first, **there may not be enough budget remaining to purchase a dedicated ₱18,500–₱23,000 Local Server PC.**
* **The Mitigation (The Smart Decision Flow):**
  * **Step 1:** The development team and client canvass equipment prices together in Gilmore, purchasing the necessary staff desktop computers and front desk terminals first.
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

## 4. Hardware Sourcing, Spec Classifications & Realistic 2-Branch Scalability

This section outlines the exact device and hardware requirements for both operational pathways so HonTech management can clearly budget and plan equipment:

---

### ☁️ 4.1 Track B: Modern Cloud Device Requirements (RECOMMENDED — ₱0 Server Cost)

Because Cloud computing is hosted remotely, **HonTech does NOT need to purchase a dedicated server PC**. The system runs on existing shop devices across both branches:

| Shop Location / Role | Equipment Required (2 Branches) | Minimum Client Hardware / Operating Spec | Est. Hardware Cost |
| :--- | :--- | :--- | :--- |
| **Service Advisors (SAs)** | **4 Dedicated SA Personal Computers**<br>• Branch 1 (Main): 2 SA Computers<br>• Branch 2: 2 SA Computers | • Windows 10/11 desktop PC or laptop<br>• Google Chrome / Microsoft Edge browser<br>• 4GB–8GB RAM, 1080p display, Wi-Fi/LAN | **₱0.00** *(Use existing staff PCs)* |
| **Front Desk / Service Assistant** | **2 Front Desk Computers**<br>• Branch 1: 1 Front Desk PC<br>• Branch 2: 1 Front Desk PC | • Windows 10/11 PC/laptop for online booking intakes, customer registration & digital invoicing | **₱0.00** *(Use existing office PCs)* |
| **Customer Waiting Lounge** | **2 Wall Display Smart TVs**<br>• Branch 1: 1 Smart TV<br>• Branch 2: 1 Smart TV | • **On-Site Assessment Required:**<br>  1. Inspect built-in TV browser vs. **Google Chromecast / Fire Stick (~₱1,800)**.<br>  2. **Test TV Integrated Sound System** for queue chimes (Bay Dispatch & Vehicle Ready). | **₱0.00** *(Shop already owns TVs; ₱1,800 stick only if TV browser is slow)* |
| **Central Server Unit** | **None Needed** *(Cloud-Hosted)* | • Amazon AWS Tier-4 Data Centers (Managed by Supabase & Vercel) | **₱0.00** |
| **TOTAL UPFRONT INVESTMENT**| **Total: 6 Staff PCs + 2 Smart TVs** | | **₱0.00** |

---

### 🖥️ 4.2 Track A: Local Server PC Sourcing & Spec Tiers (ALTERNATIVE)

If HonTech chooses **Local On-Premise Hosting**, a dedicated Server PC must be purchased and kept running 24/7 in the front office. Sized for HonTech's **3 to 5 staff users per branch (6–10 users across 2 branches)**:

| Hardware Tier / Classification | Technical Specifications | Operational Capacity (3–5 Staff/Branch) | Estimated Hardware Cost |
| :--- | :--- | :--- | :--- |
| **🥉 Standard Criteria**<br>*(Single Shop Baseline)* | • Core i3 (10th Gen+) / Ryzen 3<br>• 8GB RAM, 256GB NVMe SSD<br>• Windows 10/11 Home/Pro | **Branch 1 (Marikina Main)**<br>• 3–5 Staff + 1 Lounge TV<br>• ~15–25 cars / day | **₱14,500 – ₱17,500**<br>*(or ₱0 if repurposing existing PC)* |
| **🥈 Work-Grade Class**<br>*(Recommended Standard)* | • Core i5 (11th/12th Gen) / Ryzen 5<br>• 16GB RAM, 512GB NVMe SSD<br>• 80+ Bronze Power Supply | **Both Branches 1 & 2**<br>• 6–10 Staff + 2 Lounge TVs<br>• ~30–50 cars / day | **₱18,500 – ₱23,000** |
| **🥇 Mid-Range Premium**<br>*(Multi-Branch Expansion)* | • Core i7 / Ryzen 7<br>• 32GB RAM, 1TB NVMe SSD<br>• UPS + Heavy AVR Protection | **3–4 Future Branches**<br>• 15–20 Staff + 4 Lounge TVs<br>• 4+ Years Peak Longevity | **₱26,000 – ₱32,000** |

---

### 💰 4.3 Client Future Hardware Investment & Costing Draft (For Management Review)

To help HonTech management budget for future hardware procurement or upgrades across both branches, below is an itemized cost estimate draft:

| Procurement Item / Option | Unit Cost (Est. Range) | Qty Needed (2 Branches) | Total Estimated Cost | Notes / Strategic Value |
| :--- | :--- | :---: | :--- | :--- |
| **Option 1: Using Existing Shop Computers** | ₱0.00 | 6 PCs | **₱0.00** | **Immediate Launch:** Use shop's current desktop PCs and laptops with zero new hardware spending. |
| **Option 2: Refurbished Work-Grade Office PCs**<br>*(Core i5 8th–10th Gen, 8GB/16GB, SSD)* | ₱7,500 – ₱9,500 / unit | 6 PCs (4 SAs + 2 Front Desk) | **₱45,000 – ₱57,000** | Cost-effective expansion option for durable dedicated counter terminals across both branches. |
| **Option 3: Brand New Work-Grade Desktop PCs**<br>*(Core i5 12th Gen, 16GB RAM, 512GB NVMe SSD)* | ₱16,500 – ₱21,000 / unit | 6 PCs (4 SAs + 2 Front Desk) | **₱99,000 – ₱126,000** | Maximum 4+ year longevity, high-speed multitasking for peak morning intake rushes. |
| **Lounge TV Google Chromecast / HDMI Stick**<br>*(If built-in TV browser requires upgrade)* | ₱1,800 / unit | 2 Units (1 per branch) | **₱3,600** | Evaluated during Week 2 audit if TV native browser has buffering or sluggish rendering. |
| **Backup 4G/5G SIM Wi-Fi Failover Router**<br>*(Prepaid Smart / Globe router)* | ₱999 / unit | 2 Units (1 per branch) | **₱1,998** | Essential failover for Track B (Cloud) during municipal fiber cable cuts. |
| **Dedicated Local Server PC + UPS Battery**<br>*(Required ONLY if choosing Track A: Local)* | ₱22,500 – ₱27,000 | 1 Server Unit | **₱22,500 – ₱27,000** | **₱0 if choosing Track B (Cloud)**. Only needed for on-premise local server hosting. |

---

### 🏢 4.4 Realistic Operational Scenario: "2 Branches with 3–5 Staff Over 4 Years"

Here is how the hardware specifications directly affect HonTech's daily workflow across its 3–5 staff members per location:

* **Branch 1 (Marikina Main — 3 to 5 Users):**
  * 2 Service Advisors intake vehicles and log PMS status updates on 2 dedicated personal computers.
  * 1 Front Desk / Service Assistant handles online booking intakes, customer registration, and billing.
  * 1 Waiting Lounge TV runs continuously displaying the customer queue with audio chimes.
  * *Daily Volume:* ~15 to 25 repair orders/day.

* **Branch 2 (Second Branch Expansion — 3 to 5 Users):**
  * 2 Service Advisors intake vehicles on 2 dedicated personal computers.
  * 1 Front Desk / Service Assistant handles online booking check-in and billing.
  * 1 Waiting Lounge TV shows branch customer queues.
  * *Combined Multi-Branch Load:* 4 SA personal computers + 2 Front Desk PCs + 2 TVs (~30 to 50 active repair orders/day across both branches).

#### 🛡️ Why Work-Grade Class (16GB RAM + NVMe SSD) Runs Flawlessly:
* **Instant 15ms Response Times:** With 16GB RAM, the entire 45,000-vehicle database stays cached in active memory. Even during peak morning intake rushes, queries return instantly.
* **4+ Years 24/7 Durability:** High-grade cooling and an 80+ Bronze certified power supply prevent hardware crashes, giving HonTech total operational peace of mind for years without replacement.

---

### 🛒 4.5 Joint Gilmore Sourcing & Inspection Plan (For Local On-Premise Hosting)
* **Online Canvassing:** Team and client canvass real-time pricing from *Lazada, Shopee, EasyPC, PC Express, and DynaQuest*.
* **On-Site Gilmore Buying Trip:** Team and client visit **Gilmore Computer Center** together to inspect physical parts, verify 1–3 year manufacturer warranties, and negotiate store bundle discounts.
* *Alternative Option:* Repurpose an existing functional Core i3/i5 office desktop at **₱0.00 hardware cost**.

---

### 📺 4.6 Customer Waiting Lounge TV & Audio Chime System (Both Options)
* **Current Status:** HonTech AutoCenter **already owns a functional Smart TV** in the customer lounge.
* **Audio Notification Capability:** The Smart TV (or connected HDMI stick) **must have functional stereo speakers enabled** to produce clear audible notification chimes when vehicle statuses update (e.g. Bay Dispatch sound, Vehicle Ready chime, SLA timers) so waiting customers hear alerts immediately without needing to look at the screen constantly.
* **Week 2 Inspection:** Team will test the built-in browser with the TV URL (`?mode=tv`), test Web Audio API chime playback volume, inspect Wi-Fi stability, and assess if an HDMI streaming stick (*Google Chromecast / Fire Stick ~₱1,800*) is needed.

---

### 📋 4.7 Multi-Branch Website & Hardware Readiness Checklist (Pre-Flight Audit Standard)
To guarantee 100% operational readiness before live customer intake, the Developing Team and HonTech Management will conduct an on-site physical walk-through during **Week 2 (September 8–12, 2026)** using the following formal checklist:

| Category | Required Equipment / Target | Evaluation Criteria & Operating Standard | Audit Target |
| :--- | :--- | :--- | :---: |
| **Dedicated SA PCs** | **4 Dedicated Computers**<br>• 2 PCs in Branch 1 (Main)<br>• 2 PCs in Branch 2 | • Windows 10/11 64-bit, 4GB–8GB RAM, 1080p Full HD<br>• Google Chrome (v110+) / Edge with unblocked LocalStorage<br>• Dedicated USB keyboard/mouse, clean intake counter placement | [ ] PASS<br>[ ] FAIL |
| **Front Desk / Service Assistant** | **2 Front Desk PCs**<br>• 1 PC in Branch 1<br>• 1 PC in Branch 2 | • Windows 10/11 desktop/laptop for online booking arrivals & customer registration<br>• Digital invoicing & repair order status management | [ ] PASS<br>[ ] FAIL |
| **Lounge Smart TVs with Audio** | **2 Wall Displays with Sound**<br>• 1 TV in Branch 1<br>• 1 TV in Branch 2 | • **Browser Assessment:** Assess built-in TV browser speed vs. Google Chromecast / Fire Stick (`?mode=tv`).<br>• **Audio Sound Output:** Integrated speakers verified for queue chimes (Bay Dispatch & Vehicle Ready notifications).<br>• Zero buffering, auto-refresh customer queue, customer privacy enabled. | [ ] PASS<br>[ ] FAIL |
| **Network & Failover** | **Dual Internet Infrastructure** | • Primary fiber line (15–25 Mbps) with ≥ -65 dBm Wi-Fi across Bays 1–6<br>• Backup ₱999 prepaid 4G/5G Wi-Fi hotspot tested for 5-second switch | [ ] PASS<br>[ ] FAIL |
| **Security & Accounts** | **Role-Based Access Governance** | • 4 SA Accounts, 2 Service Assistant Accounts, Owner & Admin Accounts configured<br>• 6-Digit PIN recovery & automated audit logging verified | [ ] PASS<br>[ ] FAIL |

---

## 5. Dual Detailed Weekly Execution Roadmaps (September 2026 Rollout)

---

### 🌟 TRACK B: Modern Cloud Deployment Roadmap (RECOMMENDED)
*Fastest deployment path, ₱0 upfront server hardware cost, and instant multi-device synchronization.*

| Week / Period | Phase & Objectives | Developing Team Activity & Responsibilities | Client & Adviser Touchpoint | Weekly Milestone Deliverable |
| :--- | :--- | :--- | :--- | :--- |
| **Week 1** | **Adviser Review, Client Decision & Core Polish** | • **Developing Team:** Complete final auth/security revisions (Google Auth / Recovery PINs), execute unit testing, and initialize a dedicated sandbox repository (`hontech-cloud-poc`) to explore cloud deployment safely without touching master code.<br>• **System Designer:** Assist the developer in handling the system flow, bay tracking layout, and proper UI/UX design.<br>• **QA & Documentation:** Create hardware/cloud expense documentation and conduct extensive QA & unit testing verification. | • Present proposal document to **Mr. Ar-Jay C. Agbayani** for review and endorsement.<br>• Present comparison to **HonTech Management** for hosting pathway sign-off. | ✅ **Proposal Signed & Cloud Sandbox Initialized** |
| **Week 2** | **System Unit Testing & Website Requirements Checklist Sign-Off** | • **Developing Team:** Complete 100% passing unit tests; execute the formal **Website System Requirements & Hardware Readiness Checklist** across all shop equipment (4 dedicated SA personal computers [2 in Branch 1, 2 in Branch 2], 2 Front Desk Service Assistant PCs, 2 Waiting Lounge Smart TVs, and network failover).<br>• **TV Browser & Audio Audit:** Assess built-in TV browser speed vs. Google Chromecast stick and test stereo speakers for audio chimes.<br>• **Designer & Documentation:** Finalize Staff Quick-Start User Manual (PDF), daily operations guidelines, and training presentation material. | • On-site joint physical audit of shop Wi-Fi coverage across Bays 1–6 and lounge.<br>• Client formal sign-off on **Hardware & Website Readiness Checklist**. | ✅ **Unit Testing Passed & Readiness Checklist Signed** |
| **Week 3** | **Staff Training & Live Customer "Shadow Mode"** | • Conduct 60-min guided workshop for Service Advisors & Service Assistants.<br>• Launch **2–3 Day Live Customer "Shadow Mode"** *(dual entry: staff write on traditional whiteboard stubs AND enter records on dedicated SA computers simultaneously)*.<br>• **On-Site Floor Guarding:** The development team members will personally stay on-site to guard shop floor operations, support staff in real time, document any friction points, and apply immediate revisions and bug fixes. | • SAs and Assistants use digital system on live walk-in cars with zero risk.<br>• Owner tests remote mobile monitoring dashboard. | ✅ **100% Staff Certified & Confident** |
| **Week 4** | **Buffer, Final Polish & 100% Digital Go-Live** | • Dedicated buffer period for final edge-case polish, latency fine-tuning, and security verification.<br>• Official retirement of traditional whiteboard queue tracking (100% digital cutover).<br>• Kickoff of **1–2 months complimentary warranty & support**. | • Formal sign-off on Project Handover Package.<br>• System operational as primary daily standard. | ✅ **Production Go-Live & Warranty Active** |

---

### 🖥️ TRACK A: Local On-Premise Intranet Roadmap (ALTERNATIVE)
*Complete physical data sovereignty inside the building; requires dedicated PC purchase and on-site network cabling.*

| Week / Period | Phase & Objectives | Developing Team & On-Site Activities | Client & Staff Touchpoint | Weekly Milestone Deliverable |
| :--- | :--- | :--- | :--- | :--- |
| **Week 1** | **Hardware Canvassing & Shop LAN Audit** | • Finalize bill of materials for Work-Grade Server PC<br>• Audit Gilmore Computer Center real-time parts pricing<br>• Inspect shop router, Cat6 cabling, and front desk power outlets<br>• Schedule joint Gilmore buying trip | • Management approves hardware budget (~₱18.5k–₱23k)<br>• Schedule date for Gilmore visit | ✅ **Final Gilmore Purchasing Checklist Ready** |
| **Week 2** | **Hardware Procurement, Assembly & Network Setup** | • Joint Gilmore parts purchase & warranty verification<br>• Assemble Work-Grade PC, install Windows OS, XAMPP, & MySQL<br>• Assign static local IP (`192.168.1.100`) & configure shop Wi-Fi<br>• Wire primary server directly via Cat6 Ethernet cable<br>• Install UPS battery backup & execute formal **Hardware & Website Readiness Checklist** (including TV sound and browser audit) | • Client purchases hardware in Gilmore<br>• Server PC physically positioned in front office<br>• Client sign-off on hardware checklist | ✅ **Server PC Assembled & Readiness Checklist Signed** |
| **Week 3** | **Local Multi-Device Validation & "Shadow Mode"** | • Connect all 4 dedicated SA personal computers (2 per branch), 2 Front Desk Service Assistant PCs, and Lounge Smart TVs to the local server IP (`192.168.1.100`)<br>• Conduct 60-min staff training on job intake & daily operations guidelines<br>• Execute 2–3 day live customer "Shadow Mode" *(dual whiteboard + digital entry)*<br>• **On-Site Floor Guarding:** Development team stays on-site during shop hours to guard local operations and test USB automated backup scripts. | • Staff practice on local shop network across dedicated computers<br>• Management reviews daily entry speed and feedback | ✅ **Shop Devices Synced & Staff Trained** |
| **Week 4** | **Full Digital Go-Live & Formal Handover** | • Official retirement of traditional whiteboard queue tracking (100% digital cutover)<br>• Delivery of printed & PDF User Manuals, Admin Guides, and Emergency Fallback Runbook<br>• Kickoff of 1–2 months complimentary warranty & support | • Owner signs Project Handover Authorization<br>• System operational as primary shop workflow | ✅ **Production Go-Live & Warranty Active** |

---

## 6. Staff Training & "Shadow Mode" Dry-Run Protocol

### 👥 6.1 Role-by-Role Training Matrix (Draft Framework)

| Staff Role | Target Devices | Training Curriculum & Focus Areas | Duration |
| :--- | :--- | :--- | :--- |
| **Service Advisors (SAs)** | Dedicated SA Desktop Console / PC | • 30-second vehicle intake & plate number lookup<br>• Express 2-Hour PMS SLA timer tracking<br>• Logging delay reasons & parts waiting flags<br>• Real-time bay status updates *(Intake → Bay → Done)* | 45 Mins |
| **Front Desk / Service Assistant** | Desktop PC / Laptop | • Online booking intake arrivals & customer registration<br>• Digital repair order tracking & checkout status<br>• Customer phone SMS / call notification triggers | 30 Mins |
| **Owner / General Manager** | Smartphone / Laptop | • Real-time bay throughput & daily revenue analytics<br>• Inspecting tamper-proof audit trails (`job_audit_logs`)<br>• Multi-branch management & staff account administration | 30 Mins |
| **Lounge Display Operator** | Waiting Lounge TV | • Launching full-screen Waiting Lounge TV URL (`?mode=tv`)<br>• Verifying real-time auto-refresh queue & privacy mode<br>• Testing TV speaker volume for audible queue chimes | 15 Mins |

---

### 🔄 6.2 The 4-Stage "Shadow Mode" Operational Protocol (Draft Framework)

1. **Stage 1: Guided Staff Simulation Workshop (60 Minutes)**  
   Before handling live customer cars, the development team conducts an interactive dry-run workshop in the shop office. Service Advisors and Service Assistants practice creating 5 simulated repair orders, tracking Express 2-Hour PMS timers, logging parts delay reasons, and updating customer status to become fully comfortable with the interface.

2. **Stage 2: Live "Shadow Mode" with On-Site Floor Guarding (2 to 3 Days)**  
   During regular shop business hours, staff continue writing repair orders on their traditional workshop whiteboard as their primary fail-safe, while simultaneously recording every vehicle digitally on their dedicated SA computers. The development team remains physically present on the workshop floor to guard operations, guide staff during live customer walk-ins, and provide immediate assistance with zero impact on customer waiting times.

3. **Stage 3: End-of-Day Data Reconciliation & Issue Resolution**  
   At the close of each business day, the development team and shop management cross-reference the digital records against the whiteboard entries to verify 100% data accuracy. Any questions, Wi-Fi signal dead spots, or workflow bottlenecks identified by staff are documented immediately, allowing the team to apply overnight refinements and software bug fixes.

4. **Stage 4: 100% Digital Cutover & Official Go-Live**  
   Once Service Advisors achieve consistent sub-60-second vehicle intakes and management verifies complete data integrity, manual whiteboard queue tracking is retired. The HonTech Operations Management System becomes the primary daily standard across all service bays, backed by our complimentary 1–2 months warranty and support.

---

### ✅ 6.3 Staff Competency & Go-Live Checklist (Draft Framework)

Before retiring traditional whiteboard tracking, the team and HonTech management verify the following 5 criteria:
- [ ] **Fast Vehicle Intake:** Service Advisors can intake a walk-in vehicle and assign a service bay in under 60 seconds on their dedicated computer.
- [ ] **Express 2H Delay Logging:** SAs understand how to log parts/labor delay reasons when Express PMS exceeds target SLA.
- [ ] **Online Booking & Intake Verification:** Service Assistant can process online booking arrivals and register walk-in customers quickly.
- [ ] **Lounge TV Real-Time Sync & Audio:** Customer lounge display updates automatically with clear audible chimes when a car finishes servicing.
- [ ] **Remote Owner Visibility:** Business owner can log into the live dashboard and view shop bay queues on a smartphone.

---

## 7. Security Governance, Internal & External Cyber Defense Protocols

---

### 🔒 7.1 Internal Workshop Floor Security (Staff & LAN Governance)

| Security Feature | 🌟 Option B: Modern Cloud *(RECOMMENDED)* | Option A: Local Intranet Server *(Alternative)* |
| :--- | :--- | :--- |
| **Role-Based Access Control (RBAC)** | • 4 distinct roles: Owner, Admin, SA, Assistant<br>• SAs restricted from viewing revenue reports<br>• Assistants restricted from deleting records | • 4 distinct roles: Owner, Admin, SA, Assistant<br>• SAs restricted from viewing revenue reports<br>• Assistants restricted from deleting records |
| **Tamper-Proof Audit Logging** | • Mandatory written justification for record changes<br>• Immutable `job_audit_logs` record editor name, timestamp, old value, & new value | • Mandatory written justification for record changes<br>• Immutable `job_audit_logs` record editor name, timestamp, old value, & new value |
| **Multi-Branch Data Isolation** | • Branch A staff cannot view or modify Branch B records<br>• Central Owner account views aggregated multi-branch analytics | • Physical isolation per shop building<br>• Cross-branch viewing requires dedicated VPN hardware |
| **Physical Workshop Network** | • Secured via WPA3 shop Wi-Fi password<br>• Accessible from authorized staff devices | • Dedicated `HonTech_Staff` LAN subnet<br>• Customer lounge Wi-Fi separated from server LAN |

---

### 🌐 7.2 External Cyber Defense (Internet & Remote Security)

| Defense Layer | 🌟 Option B: Modern Cloud *(RECOMMENDED)* | Option A: Local Intranet Server *(Alternative)* |
| :--- | :--- | :--- |
| **Public Internet Exposure** | **Bank-Grade Cloud Defense**<br>• Protected behind Cloudflare edge network<br>• Automated bot & DDoS attack filtering | **Complete Air-Gap Invisibility**<br>• Server PC is invisible on the public internet<br>• 0 open inbound firewall ports |
| **Data Encryption (In Transit & At Rest)** | • **SSL/TLS 1.3** bank-grade encryption in transit<br>• **AES-256** enterprise hardware encryption at rest | • Local LAN unencrypted HTTP (or self-signed SSL)<br>• Data stored on local Windows NTFS drive |
| **Brute-Force & Credential Security** | • Bcrypt password hashing (Cost Factor 10)<br>• Automated rate-limiting on failed login attempts | • Bcrypt password hashing (Cost Factor 10)<br>• Windows PC password protection |
| **Remote Access Method** | Native HTTPS web URL from any browser worldwide | Zero-Trust Cloudflare Tunnel (`cloudflared`) required |

---

### ⚡ 7.3 Emergency Outage & Disaster Recovery Comparison

| Failure Scenario | 🌟 Option B: Modern Cloud *(RECOMMENDED)* | Option A: Local Intranet Server *(Alternative)* |
| :--- | :--- | :--- |
| **Meralco Power Outage (Blackout)** | **100% Unaffected in Cloud**<br>• Cloud database runs continuously in AWS<br>• Staff can continue using cellular tablets/phones | **Requires UPS Battery Backup**<br>• UPS powers PC for 15–20 mins for safe shutdown<br>• Temporary paper fallback until power restores |
| **Municipal Fiber Internet Outage** | **5-Second Backup Wi-Fi Switchover**<br>• Front desk switches to ₱999 4G/5G prepaid SIM router | **100% Immune to Internet Outages**<br>• System runs locally over shop Wi-Fi without internet |
| **Hardware Crash / Drive Failure** | **Zero Data Loss**<br>• Point-in-time automated daily cloud backups | **Requires Manual USB Backups**<br>• Restore from weekly manual USB drive backup |

---

## 8. Handover Deliverables Package & Project Authorization

---

### 📦 Comprehensive Deliverables Breakdown: Cloud vs. Local

| Deliverable Item | 🌟 Option B: Modern Cloud Package *(RECOMMENDED)* | Option A: Local Intranet Server Package *(Alternative)* |
| :--- | :--- | :--- |
| **1. Live Operational System** | • Production Web URL & SSL Domain<br>• Full ownership of Supabase Cloud DB project<br>• Active Vercel CDN deployment | • Assembled Work-Grade Server PC in office<br>• Configured Apache/MySQL on static IP (`192.168.1.100`)<br>• Windows background startup services configured |
| **2. Staff Quick-Start Manual (PDF)** | • Visual guide for desktop PCs, laptops, & smartphones<br>• Browser bookmarks for staff instant access | • Visual guide for front desk PC & local LAN computers<br>• Local IP desktop shortcuts (`HonTech_Intranet.lnk`) |
| **3. Administrator & Security Guide (PDF)** | • Supabase database backup & export instructions<br>• Staff account creation, role changes, & password resets<br>• Cloud quota monitoring guide | • Windows XAMPP start/stop procedures<br>• MySQL automated USB backup batch script manual<br>• Local static IP troubleshooting guide |
| **4. Emergency Fallback Runbook (PDF)** | • 4G/5G mobile backup Wi-Fi switchover protocol<br>• Temporary paper intake procedure | • UPS battery backup shutdown & restart protocol<br>• Database restoration from USB flash drive |
| **5. Source Code & Architecture Archive** | • Complete GitHub repository source code<br>• Database schema SQL scripts & seed definitions | • USB Flash Drive containing full system source code, XAMPP installer, & master `.sql` schema backup |
| **6. Complimentary 1–2 Months Warranty** | • **₱0 Free Support:** Remote uptime monitoring, query optimization, bug fixes, & staff guidance | • **₱0 Free Support:** On-site hardware checkups, LAN performance tuning, bug fixes, & staff guidance |
| **7. Optional Post-Warranty Support** | • **Cloud Admin Retainer:** Remote monthly database checkups, quota monitoring, & feature updates | • **On-Call Hardware Support:** On-site hardware cleaning, physical drive maintenance, & network repairs |

---

### ✍️ Formal Project Review, Endorsement & Authorization

#### Part I: Prepared & Submitted by the Development Team

**System Architect & System Designer:** ___________________________  
**Mary Dayne Villas T.**  
*Signature over Printed Name* | **Date:** September 2, 2026

**System Developer & Technical Implementation:** ___________________________  
**Justin Nolasco J.**  
*Signature over Printed Name* | **Date:** September 2, 2026

**Technical Documentation & QA Tester:** ___________________________  
**Catherine Ramos G.**  
*Signature over Printed Name* | **Date:** September 2, 2026

---

#### Part II: Academic Faculty Review & Verification

**Capstone Project Adviser:** ___________________________  
**Mr. Ar-Jay C. Agbayani**  
*Faculty Capstone Project Adviser | Department of Information Technology*

**Date Reviewed & Verified:** ___________________________  
**Adviser Notes / Remarks:** __________________________________________________________________

---

#### Part III: Client Acceptance & Authorization (HonTech AutoCenter)

**Company President & Business Owner:** ___________________________  
**HonTech AutoCenter Management & Ownership**  
*Signature over Printed Name* | **Title / Designation:** Company President & General Manager  

**Date Approved & Signed:** ___________________________  
**Selected Deployment Architecture Pathway:**  
`[  ] Option B: Modern Cloud Solutions (Vercel + Supabase) — RECOMMENDED`  
`[  ] Option A: Local Intranet Hosting (On-Premise Server PC)`


