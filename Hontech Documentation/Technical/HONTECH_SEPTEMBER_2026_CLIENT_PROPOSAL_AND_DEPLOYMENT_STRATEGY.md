# HONTECH AUTOCENTER
## Operations Management System
### Client Proposal & September 2026 Strategic Architecture Blueprint
#### (Local Intranet Server vs. Modern Cloud Vercel + Supabase)

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
**Document Version:** 12.0 (Unified Master Document with Embedded Technical Blueprints)

---

## Table of Contents
1. [Executive Summary & Academic Grant Terms](#1-executive-summary--academic-grant-terms)
2. [Core System Features & Operational Capabilities](#2-core-system-features--operational-capabilities)
3. [Executive Strategic Brainstorming: Local vs. Cloud](#3-executive-strategic-brainstorming-local-vs-cloud)
   - [Strategic Architecture Decision Matrix](#-strategic-architecture-decision-matrix)
   - [IT Maintenance & Developer Support Profile](#-it-maintenance--developer-support-profile-who-manages-what)
   - [The Financial Lifecycle: Upfront Cost vs. Compounding Subscriptions](#-1-the-financial-lifecycle-upfront-cost-vs-long-term-compounding)
   - [Account Suspension & Data Lockout Risks](#-2-account-suspension--data-lockout-risks-cloud-vs-local)
   - [The 2026 PC Parts Inflation Reality](#-3-the-2026-pc-parts-price-inflation-reality)
   - [Auto Shop Environmental Hazards & Hardware Longevity](#-4-auto-shop-environmental-hazards--hardware-longevity)
   - [Internet Outage Safeguards & The ₱999 Safety Net](#-5-the-999-internet-safety-net-for-cloud)
   - [Detailed Pros & Cons Breakdown](#-side-by-side-pros--cons-for-ownership)
   - [Recommended Hybrid Phased Strategy](#-recommended-hybrid-phased-strategy-for-hontech)
4. [Comprehensive Risk Assessment & Mitigation Plan](#4-comprehensive-risk-assessment--mitigation-plan)
   - [Risk 1: Local Hosting Multi-Branch & Wi-Fi Network Traps](#️-risk-1-local-hosting-multi-branch--wi-fi-network-traps)
   - [Risk 2: Hardware Budget Depletion Strategy (The Staff PC First Rule)](#️-risk-2-hardware-budget-depletion-strategy-the-staff-pc-first-rule)
   - [Risk 3: Shop Environment & Electrical Power Spikes](#️-risk-3-shop-environment--electrical-power-spikes)
   - [Risk 4: External Internet Outages on Cloud](#️-risk-4-external-internet-outages-on-cloud)
5. [Hardware Sourcing & Facility Preparation](#5-hardware-sourcing--facility-preparation)
6. [Dual Detailed Weekly Execution Roadmaps](#6-dual-detailed-weekly-execution-roadmaps)
   - [Track A: Local Intranet Hosting Plan](#-track-a-detailed-roadmap-for-local-intranet-hosting)
   - [Track B: Modern Cloud Deployment Plan](#-track-b-detailed-roadmap-for-modern-cloud-deployment-vercel--supabase)
7. [Training, Simulation & Dry-Run Protocols](#7-training-simulation--dry-run-protocols)
8. [Security, Audit Governance & Emergency Protocols](#8-security-audit-governance--emergency-protocols)
9. [Handover Deliverables Package & Post-Warranty Retainer Options](#9-handover-deliverables-package--post-warranty-retainer-options)
10. [Official Client Sign-Off](#10-official-client-sign-off)
11. [APPENDIX A: Complete Local Intranet Feasibility & Zero-Risk Setup Blueprint](#-appendix-a-complete-local-intranet-feasibility--zero-risk-setup-blueprint)
12. [APPENDIX B: Complete Cloud Sandbox PoC Setup Blueprint (Vercel + Supabase)](#-appendix-b-complete-cloud-sandbox-poc-setup-blueprint-vercel--supabase)

---

## 1. Executive Summary & Academic Grant Terms

Running a high-throughput auto service center requires speed, coordination, and customer transparency. Today, HonTech AutoCenter handles customer intake, job routing, and status updates through paper claim stubs and verbal communication. While familiar, this manual flow creates three critical operational bottlenecks:

1. **Information Gaps Between Front Desk & Bays:** Service Advisors (SAs) cannot view technician progress in real time without physically walking to the repair bays.
2. **Customer Lounge Uncertainty:** Waiting customers frequently approach the front desk asking for updates, interrupting intake staff.
3. **Express Service Turnaround Bottlenecks:** When Express Lane PMS services exceed target limits, there is no standardized tracking to identify parts delays or workload imbalances.

### 🎓 Academic Capstone Grant Terms (Zero Software Cost)
* **100% Free Software Grant:** Because this is an official academic capstone development project, **the software, source code, licensing, on-site setup, and staff training are provided to HonTech AutoCenter at ₱0 (FREE of charge).**
* **Client Hardware Ownership:** The only investment required from HonTech AutoCenter is the physical hardware equipment (*if choosing Option A: Server PC, Ethernet cables; if choosing Option B: ₱0 new hardware*), which remains 100% the property of the client.
* **1–2 Months Complimentary Warranty & Support:** The development team provides 1–2 months of free post-launch monitoring, bug fixes, and operational assistance.

---

## 2. Core System Features & Operational Capabilities

* **Real-Time Bay & Queue Tracking:** Live visibility of all vehicles, bay locations, assigned technicians, and service categories (*PMS, GRS, Express*).
* **Automated Express Lane 2-Hour SLA Alerts:** Continuous duration counter displaying `⚠️ Express 2H Limit Exceeded` when turnaround exceeds 120 minutes, with structured delay root-cause reporting (*Parts delay, deep diagnostic, customer approval, technician bottleneck*).
* **Customer Waiting Lounge TV Broadcast:** Real-time, non-interactive status board displaying vehicle progress (*Waiting, In Progress, Ready for Release*) to keep waiting customers informed.
* **Tamper-Proof Audit Guard:** System-wide reason-required logging for every record modification (*departure times, diagnoses, categories*) with old/new value comparison and editor logging.
* **Customer Lookup & History:** Instant recall of repeat customer contact numbers and historical service visits.

---

## 3. Executive Strategic Brainstorming: Local vs. Cloud

To give HonTech management a comprehensive, business-minded evaluation, we analyze both solutions across **Financial Lifecycles (CapEx vs. OpEx)**, **Multi-Branch Network Topology**, **Hardware Market Inflation**, **Account Lockout Risks**, and **Disaster Recovery**.

### 📊 Strategic Architecture Decision Matrix

| Evaluation Pillar | Option A: Local Intranet Server *(Recommended for 1 Shop)* | Option B: Modern Cloud *(Vercel + Supabase)* |
| :--- | :--- | :--- |
| **Financial Model (CapEx vs OpEx)** | **High Upfront / Cheap Long-Term**<br>• Pay ~₱22,000 once for PC<br>• ₱0/yr ongoing software fees | **Zero Upfront / Compounding Cost**<br>• ₱0 upfront hardware cost<br>• ~₱12,000–₱16,800/yr ongoing fees |
| **Multi-Branch Cross-Building Sync** | **Complex Hardware VPN Required**<br>• Branch B cannot reach Branch A without static public IP or VPN routers | **Native Multi-Branch Syncing**<br>• Branch A, B, and C connect to unified cloud instantly from any internet |
| **Unpaid Provider / Lockout Risk** | **Zero Risk (100% Sovereign)**<br>• Nobody can ever lock you out of your shop's physical computer | **Account Suspension Risk**<br>• If credit card or monthly bill fails, cloud provider freezes database |
| **IT & Developer Maintenance** | **On-Call Hardware Technician**<br>• Dust cleaning & local USB backup checks | **Cloud Administrator / Web Dev**<br>• Quota, API key, & domain renewal management |
| **Upfront Hardware Investment** | ₱16,500 – ₱25,000+ *(Server PC + Cabling)* | **₱0** *(Runs on existing office PCs/tablets)* |
| **Monthly Software Hosting** | **₱0 / month (Free forever)** | ₱0 – ₱1,400 / month *(scales with traffic)* |
| **Electricity Cost (Meralco)** | ~₱350–₱600 / month *(PC running 24/7)* | **₱0** *(Cloud data center hosts compute)* |
| **Internet Outage Resilience** | **100% Immune** *(Continues running offline)* | Requires backup 4G/5G Wi-Fi SIM (~₱999) |
| **Remote Owner Visibility** | None *(Accessible inside shop network only)* | **Full Access** via smartphone / laptop anywhere |
| **Auto Shop Environmental Hazards** | Vulnerable to shop dust, grease, & power spikes | **100% Protected** in climate-controlled AWS data centers |
| **Disaster Recovery** | Manual USB backup drive needed weekly | Automated daily point-in-time cloud backups |

---

## 4. Comprehensive Risk Assessment & Mitigation Plan

Deploying a mission-critical operations system across service bays requires anticipating technical, physical, and financial failure points. Below are the 4 primary risks and their exact mitigation strategies:

### ⚠️ Risk 1: Local Hosting Multi-Branch & Wi-Fi Network Traps
* **The Problem:** 
  * If HonTech runs on a Local Server PC in Branch A, **Branch B (located across town) cannot access Branch A's server** without purchasing expensive static public IP addresses and setting up complex Site-to-Site VPN routers between buildings.
  * Within the shop, if staff tablets connect to a guest Wi-Fi extender or a different router subnet (e.g. `192.168.2.x` instead of `192.168.1.x`), the system will display a network connection error.
* **The Mitigation:**
  * **For Local Hosting (Option A):** We configure a single unified shop Wi-Fi SSID, assign a fixed static IP (`192.168.1.100`), and wire primary front desk terminals directly via Cat6 Ethernet cable.
  * **For Multi-Branch Chains:** If HonTech wants multiple physical branch locations synchronized under one master dashboard, **we strongly recommend Option B (Cloud Vercel + Supabase)**, which eliminates all networking headaches.

---

### ⚠️ Risk 2: Hardware Budget Depletion Strategy (The "Staff PC First" Rule)
* **The Problem:** 
  * If HonTech has a limited hardware budget and prioritizes purchasing reliable computers/tablets for the Service Advisors and Front Desk, **there may be no remaining budget left to purchase a dedicated ₱22,000 Server PC.**
* **The Mitigation (The Budget Pivot Rule):**
  * **Step 1:** The team and client canvass equipment prices in Gilmore. The client buys the necessary Service Advisor/front desk terminals first.
  * **Step 2 (The Decision Fork):**
    * *If budget is still open:* The client purchases the Server PC $\rightarrow$ Deploy **Track A (Local Hosting)**.
    * *If budget is depleted:* The client skips the Server PC entirely $\rightarrow$ Deploy **Track B (Cloud Vercel + Supabase)** with **₱0 server hardware cost**!

---

### ⚠️ Risk 3: Shop Environment & Electrical Power Spikes
* **The Problem:** Auto repair centers generate heavy electrical voltage surges when air compressors and hydraulic lifts turn on, risking motherboard burnout on an unprotected on-premise server PC.
* **The Mitigation:** For Local Hosting, a dedicated **Uninterruptible Power Supply (UPS with AVR / Surge Protection ~₱1,800)** must be installed between the wall outlet and the server PC to ensure clean, continuous power.

---

### ⚠️ Risk 4: External Internet Outages on Cloud
* **The Problem:** If HonTech chooses Cloud and the primary fiber line (PLDT/Globe) is accidentally cut down the street, staff cannot update records.
* **The Mitigation:** A backup **₱999 prepaid 4G/5G Wi-Fi router (Smart Bro / Globe At Home)** with a budget reloadable data SIM stays in the front office. Staff switch Wi-Fi in 5 seconds with zero interruption.

---

### ⚖️ Side-by-Side Pros & Cons for Ownership

#### 🟢 Option A: Local Intranet Hosting (On-Premise Server)
| Pros (Advantages) | Cons (Trade-Offs) |
| :--- | :--- |
| ✅ **₱0 Monthly Cloud Subscriptions:** No recurring software fees; pays for itself completely over 5 years. | ❌ **High Upfront Capital Cost:** Requires spending ₱18,000–₱25,000+ immediately on new computer parts. |
| ✅ **Zero Risk of Data Lockout:** No third-party provider can freeze or suspend your shop records. | ❌ **Cross-Branch Barrier:** Branch B cannot connect to Branch A without expensive VPN hardware. |
| ✅ **Zero Internet Dependency:** Operates 100% normally even during severe fiber cable outages. | ❌ **Zero Remote Visibility:** Owner cannot check bay queues or revenue from home or phone. |
| ✅ **100% Data Sovereignty:** Customer phone numbers and repair histories stay physically inside the building. | ❌ **Physical Hardware Breakdown Risk:** Susceptible to shop dust, heat, power surges, and drive failure. |
| ✅ **Instant 20ms LAN Speed:** Ultra-fast page loads through local Ethernet cabling. | ❌ **Manual Backup Burden:** Requires staff to remember to plug in backup USB drives weekly. |

---

#### 🔵 Option B: Modern Cloud Solutions (Vercel + Supabase)
| Pros (Advantages) | Cons (Trade-Offs) |
| :--- | :--- |
| ✅ **₱0 Upfront Hardware Cost:** Launches instantly on existing office PCs, tablets, and phones with zero upfront cash out-of-pocket. | ❌ **Compounding Long-Term Expense:** Recurring monthly fees (~₱1,000–₱1,400/mo) never end, totaling ₱60,000–₱85,000+ over 5 years. |
| ✅ **Effortless Multi-Branch Syncing:** Branch A, B, and C instantly share one synchronized master database from anywhere. | ❌ **Account Suspension / Lockout Risk:** If credit card billing fails or is delayed, cloud providers can freeze database access. |
| ✅ **Real-Time Remote Management:** Owner/Managers can track live bays and customer volume from anywhere in the world on a smartphone. | ❌ **Internet Dependent:** Requires active broadband or a backup 4G/5G prepaid Wi-Fi SIM. |
| ✅ **Zero Physical Maintenance:** No computer fans to clean, no power supplies to replace, zero Meralco server electric bill. | ❌ **Third-Party Cloud Storage:** Data resides in encrypted Tier-4 AWS data centers (Singapore region). |
| ✅ **Automated Daily Backups:** Point-in-time disaster recovery with zero manual staff effort. | ❌ **Cloud Admin Support Needed:** Requires someone to manage monthly database quotas, API keys, and domain renewals. |

---

## 5. Hardware Sourcing & Facility Preparation

### 🖥️ Option A: Central Server PC (If Choosing Local Hosting)
* **Recommended Specs:** Intel Core i3 (10th Gen+) / AMD Ryzen 3, 8GB–16GB RAM, 256GB SSD, Windows 10/11.
* **Joint Canvassing & Buying Trip:**
  * Team and client canvass online prices (*Lazada, Shopee, DynaQuest, EasyPC, PC Express*).
  * Team and client go together to **Gilmore Computer Center** to negotiate bulk discounts and verify physical shop warranties.
  * *Estimated Cost:* ₱16,500 – ₱22,000 *(or ₱0 if repurposing an existing functional office desktop)*.

### 📺 Customer Waiting Lounge TV (Both Options)
* **Current Status:** HonTech AutoCenter **already owns a functional Smart TV** in the customer lounge.
* **Week 2 Inspection:** Team will test the built-in browser with the TV URL (`?mode=tv`), inspect Wi-Fi stability, and only recommend an HDMI streaming stick (*Google Chromecast / Fire Stick ~₱1,800*) if the TV browser is slow.

---

## 6. Dual Detailed Weekly Execution Roadmaps

---

### 🟢 TRACK A: Detailed Roadmap for Local Intranet Hosting

* **Week 1 (Sept 1–5):** Timeline review, features review (Express 2H SLA, Audit Guard), online hardware price canvassing, Gilmore trip scheduling.
* **Week 2 (Sept 8–12):** Joint Gilmore purchase trip, Apache/MariaDB installation, static IP (`192.168.1.100`) setup, Lounge TV testing, LAN multi-device validation.
* **Week 3 (Sept 15–19):** Hands-on SA training, 2–3 day live customer "Shadow Mode" (dual paper + digital entry), documentation delivery, and system handover.
* **Week 4 (Sept 22–30):** 100% digital cutover (retire paper stubs), buffer stabilization, and kickoff of 1–2 months free warranty support.

---

### 🔵 TRACK B: Detailed Roadmap for Modern Cloud Deployment (Vercel + Supabase)

* **Week 1 (Sept 1–5):** Timeline review, features review, cloud account registration (Vercel + Supabase), domain setup.
* **Week 2 (Sept 8–12):** Supabase database migration, Row-Level Security setup, real-time WebSocket syncing, Lounge TV cloud test, backup 4G/5G Wi-Fi validation.
* **Week 3 (Sept 15–19):** SA training, remote owner mobile dashboard training, 2–3 day live customer "Shadow Mode" dry run, cloud admin documentation handover.
* **Week 4 (Sept 22–30):** 100% digital cutover, latency fine-tuning, buffer stabilization, and kickoff of 1–2 months free warranty support.

---

## 7. Staff Training & "Shadow Mode" Dry Run Protocol

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

## 8. Security, Audit Governance & Emergency Protocols

* **Data Sovereignty & Physical Privacy:** All customer contact numbers, vehicle diagnostic notes, and shop revenue data remain physically inside the HonTech shop building (Option A) or encrypted in AWS Tier-4 Singapore Cloud (Option B).
* **Immutable Audit Trail (`job_audit_logs`):** Every edit to departure time, status, or vehicle diagnosis is logged with old value, new value, editor identity, role, and mandatory justification.
* **Role-Based Access Control (RBAC):**
  * **Owner:** Full system control, financial analytics, staff creation, database backups.
  * **Admin:** System configuration, audit trail inspection, job monitoring.
  * **Service Advisor (SA):** Job intake, claim stub printing, repair status updates, express delay reporting.
  * **Assistant:** View-only queue inspection and bay support.
* **Emergency Fallback Protocol:** In the event of a power outage or hardware failure, staff temporarily issue backup paper claim stubs until power/server recovery.

---

## 9. Handover Deliverables Package & Post-Warranty Retainer Options

Upon project completion, HonTech AutoCenter management will receive:
1. **Configured Working System:** Active on the chosen platform (*Local Server or Cloud*).
2. **Staff Quick-Start User Manual (PDF):** Visual, screenshot-heavy guide for Front Desk & Service Advisors.
3. **Administrator & Security Guide (PDF):** Manual for Owner/Admin covering user roles, audit histories, and password resets.
4. **Emergency Fallback Protocol (PDF):** Clear contingency steps for power outages and hardware recovery.
5. **Source Code & Database Archive:** Full system code and initial database snapshot.
6. **Complimentary 1–2 Months Maintenance:** Free bug fixes, performance monitoring, and staff support during the transition.
7. **Optional Post-Warranty IT Retainer:** After the complimentary 2-month warranty, HonTech may opt into an affordable on-call IT retainer (or on-demand per visit) covering periodic dust cleaning, manual/cloud backups, and future system enhancements.

---

### ✍️ Client Acknowledgment & Authorization

\
**Client Representative / Owner:** ___________________________  
**HonTech AutoCenter**  
**Date:** ___________________________

\
**Lead System Architect & Designer:** ___________________________  
**Mary Dayne Villas T.**  
**Date:** September 2, 2026

\
**Lead Systems Developer:** ___________________________  
**Justin Nolasco J.**  
**Date:** September 2, 2026

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
