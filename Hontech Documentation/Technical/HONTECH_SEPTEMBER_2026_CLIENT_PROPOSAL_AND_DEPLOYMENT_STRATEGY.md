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
**Document Version:** 9.0 (Accurate Team Architecture & Roles Edition)

---

## Table of Contents
1. [Executive Summary & Academic Grant Terms](#1-executive-summary--academic-grant-terms)
2. [Core System Features & Operational Capabilities](#2-core-system-features--operational-capabilities)
3. [Executive Strategic Brainstorming: Local vs. Cloud](#3-executive-strategic-brainstorming-local-vs-cloud)
   - [IT Maintenance & Developer Support Profile](#-it-maintenance--developer-support-profile-who-manages-what)
   - [The Financial Lifecycle: Upfront Cost vs. Compounding Subscriptions](#-1-the-financial-lifecycle-upfront-cost-vs-long-term-compounding)
   - [Account Suspension & Data Lockout Risks](#-2-account-suspension--data-lockout-risks-cloud-vs-local)
   - [The 2026 PC Parts Inflation Reality](#-3-the-2026-pc-parts-price-inflation-reality)
   - [Auto Shop Environmental Hazards & Hardware Longevity](#-4-auto-shop-environmental-hazards--hardware-longevity)
   - [Internet Outage Safeguards & The ₱999 Safety Net](#-5-the-999-internet-safety-net-for-cloud)
   - [Detailed Pros & Cons Breakdown](#-side-by-side-pros--cons-for-ownership)
   - [Recommended Hybrid Phased Strategy](#-recommended-hybrid-phased-strategy-for-hontech)
4. [Hardware Sourcing & Facility Preparation](#4-hardware-sourcing--facility-preparation)
5. [Dual Detailed Weekly Execution Roadmaps](#5-dual-detailed-weekly-execution-roadmaps)
   - [Track A: Local Intranet Hosting Plan](#-track-a-detailed-roadmap-for-local-intranet-hosting)
   - [Track B: Modern Cloud Deployment Plan](#-track-b-detailed-roadmap-for-modern-cloud-deployment-vercel--supabase)
6. [Training, Simulation & Dry-Run Protocols](#6-training-simulation--dry-run-protocols)
7. [Security, Audit Governance & Emergency Protocols](#7-security-audit-governance--emergency-protocols)
8. [Handover Deliverables Package & Post-Warranty Retainer Options](#8-handover-deliverables-package--post-warranty-retainer-options)
9. [Official Client Sign-Off](#9-official-client-sign-off)

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

To give HonTech management a comprehensive, business-minded evaluation, we analyze both solutions across **Financial Lifecycles (CapEx vs. OpEx)**, **IT Maintenance & Developer Support Needs**, **Hardware Market Inflation**, **Account Lockout Risks**, and **Disaster Recovery**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        COMPREHENSIVE STRATEGIC DECISION MATRIX                         │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ EVALUATION PILLAR        │ OPTION A: LOCAL INTRANET    │ OPTION B: CLOUD (VERCEL+SUPA) │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Financial Model          │ **High Upfront / Cheap Long**│ **Cheap Start / Compounding** │
│ (CapEx vs. OpEx)         │ ₱22,000 once $\rightarrow$ ₱0/yr ongoing│ ₱0 start $\rightarrow$ ₱16,800/yr forever│
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ IT / Developer Support   │ **On-Call Hardware/DB Tech**│ **Cloud Admin / Web Dev**     │
│ Requirement              │ (For physical dust/backups) │ (For quota/API/DNS management)│
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Upfront Hardware Capital │ ₱16,500 – ₱25,000+          │ ₱0 (Runs on existing devices) │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Unpaid Provider Risk     │ **Zero Risk (Cannot be locked│ **Account Suspension & Lock** │
│ (Billing / Credit Card)  │ out of physical computer)** │ (Data frozen if card fails)   │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Monthly Software Cost    │ ₱0 / month                  │ ₱0 – ₱1,400 / month           │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Electricity (Meralco)    │ ~₱350–₱600 / mo (PC 24/7)   │ ₱0 (Cloud hosts compute)      │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Internet Outage Safety   │ 100% Immune (Runs offline)  │ Requires backup 4G/5G SIM     │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Remote Owner Visibility  │ None (In-shop only)         │ Full smartphone / home access │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Auto Shop Physical Wear  │ Vulnerable to grease, dust, │ 100% Protected in climate-    │
│ (Vibration / Power Surge)│ humidity, compressor surges │ controlled Tier-4 data center │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Multi-Branch Scaling     │ Local to 1 location         │ Instant sync for Branch B & C │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Disaster Recovery        │ Manual USB backup needed    │ Automated daily cloud backups │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

---

### 🛠️ IT Maintenance & Developer Support Profile (Who Manages What?)

A key question for management is: *"Does HonTech need a developer or IT specialist to maintain this system?"*

* **During Daily Shop Operations (Both Options):**
  * **Zero Developer Needed Daily:** The system is designed for non-technical staff. Service Advisors and Admins simply turn on their screens, log in, and use the graphical dashboard.
* **Post-Launch Maintenance Requirements by Architecture:**

#### 🟢 Option A (Local Intranet Server):
* **Type of IT Support Needed:** **Hardware & Local Network Maintenance**
* **Tasks Involved:**
  * Cleaning dust and grease from the server PC fans every 6 months to prevent overheating.
  * Checking that scheduled USB database backups are running properly.
  * Assisting if Windows encounters an OS update crash or power surge issue.
* **Recommended Setup:** HonTech can engage an **On-Call IT Technician / Developer** on an as-needed basis or under a modest quarterly retainer.

#### 🔵 Option B (Cloud Vercel + Supabase):
* **Type of IT Support Needed:** **Cloud Account & Web Administration**
* **Tasks Involved:**
  * Monitoring monthly database read/write quotas to ensure the shop doesn't hit tier limits.
  * Renewing custom domain names (`hontech.com`) and managing SSL certificates annually.
  * Updating cloud environment variables, API keys, and deploying software patches.
* **Recommended Setup:** HonTech can engage a **Freelance Web Developer / Cloud Admin** on a light monthly retainer or on-demand retainer.

---

### 💡 Fresh Insights & Business Brainstorming

#### 📈 1. The Financial Lifecycle: Upfront Cost vs. Long-Term Compounding
* **Option A (Local Hosting — Capital Asset / CapEx):**
  * *The Dynamic:* **Pay more upfront, save huge long-term.**
  * HonTech purchases the server PC upfront (~₱22,000). While painful on Day 1, there are **₱0 monthly software bills for Year 2, Year 3, Year 4, and Year 5**. The longer HonTech uses the system, the cheaper it becomes per month over its lifetime.
* **Option B (Cloud Hosting — Operational Subscription / OpEx):**
  * *The Dynamic:* **Cheap to start today, but compounding costs forever.**
  * HonTech launches with ₱0 upfront capital, which is great for short-term cash flow. However, cloud usage fees (~₱1,000–₱1,400/month) continue indefinitely and compound over time (reaching **₱60,000–₱85,000+ over 5 years**).

---

#### 🔒 2. Account Suspension & Data Lockout Risks (Cloud vs. Local)
* **What Happens if Cloud Bills Aren't Paid (Option B Risk):**
  * In modern cloud services (Supabase/AWS/Vercel), if a monthly payment fails, an expired credit card is rejected, or management forgets to renew:
  * **The cloud provider will automatically suspend project access, lock database queries, or put the system in read-only freeze until payment is settled.** In severe overdue cases (60–90 days), cloud providers can permanently delete unmaintained databases.
* **The Local Sovereignty Advantage (Option A Peace of Mind):**
  * With a Local Intranet Server, **nobody on Earth can ever lock HonTech out of its own system**. The data sits on physical SSDs inside the building. Even if internet or third-party companies go bankrupt, HonTech maintains 100% operational continuity.

---

#### 💰 3. The 2026 PC Parts Price Inflation Reality
* Desktop PC components (processors, RAM, SSDs, power supply units) have experienced noticeable price inflation. Buying a new dedicated server rig today requires an immediate cash outlay of **₱18,000–₱25,000+** from HonTech before the system even goes live.
* The Cloud option completely **eliminates this upfront ₱25,000 hardware barrier** for immediate launch.

---

#### 🏭 4. Auto Shop Environmental Hazards & Hardware Longevity
* Auto centers have heavy airborne tire dust, oil vapors, high ambient humidity, and electrical voltage spikes whenever heavy hydraulic lifts and air compressors kick in.
* **Option A:** Requires a dedicated UPS (Uninterruptible Power Supply), periodic dust cleaning, and runs the risk of motherboard or power supply burnout over a 2–3 year lifespan.
* **Option B:** The server engine lives in an enterprise-grade, climate-controlled AWS data center with 99.99% uptime and automatic hardware replacement.

---

#### 📡 5. The ₱999 Internet Safety Net for Cloud
* If HonTech chooses Cloud, a simple **₱999 prepaid backup Wi-Fi router (Smart Bro / Globe At Home)** with a budget data SIM in the front office guarantees that staff can switch over in 5 seconds if main fiber internet drops.

---

### ⚖️ Side-by-Side Pros & Cons for Ownership

#### 🟢 Option A: Local Intranet Hosting (On-Premise Server)
| Pros (Advantages) | Cons (Trade-Offs) |
| :--- | :--- |
| ✅ **₱0 Monthly Cloud Subscriptions:** No recurring software fees; pays for itself completely over 5 years. | ❌ **High Upfront Capital Cost:** Requires spending ₱18,000–₱25,000+ immediately on new computer parts. |
| ✅ **Zero Risk of Data Lockout:** No third-party provider can freeze or suspend your shop records. | ❌ **Zero Remote Visibility:** Owner cannot check bay queues or revenue from home or phone. |
| ✅ **Zero Internet Dependency:** Operates 100% normally even during severe fiber cable outages. | ❌ **Physical Hardware Breakdown Risk:** Susceptible to shop dust, heat, power surges, and drive failure. |
| ✅ **100% Data Sovereignty:** Customer phone numbers and repair histories stay physically inside the building. | ❌ **Manual Backup Burden:** Requires staff to remember to plug in backup USB drives weekly. |
| ✅ **Instant 20ms LAN Speed:** Ultra-fast page loads through local Ethernet cabling. | ❌ **On-Premise IT Maintenance:** Requires periodic local PC dust cleaning and physical hardware oversight. |

---

#### 🔵 Option B: Modern Cloud Solutions (Vercel + Supabase)
| Pros (Advantages) | Cons (Trade-Offs) |
| :--- | :--- |
| ✅ **₱0 Upfront Hardware Cost:** Launches instantly on existing office PCs, tablets, and phones with zero upfront cash out-of-pocket. | ❌ **Compounding Long-Term Expense:** Recurring monthly fees (~₱1,000–₱1,400/mo) never end, totaling ₱60,000–₱85,000+ over 5 years. |
| ✅ **Real-Time Remote Management:** Owner/Managers can track live bays and customer volume from anywhere in the world on a smartphone. | ❌ **Account Suspension / Lockout Risk:** If credit card billing fails or is delayed, cloud providers can freeze database access. |
| ✅ **Zero Physical Maintenance:** No computer fans to clean, no power supplies to replace, zero Meralco server electric bill. | ❌ **Internet Dependent:** Requires active broadband or a backup 4G/5G prepaid Wi-Fi SIM. |
| ✅ **Multi-Branch Ready (Branch B & C):** Connects future branch locations into one synchronized company dashboard. | ❌ **Third-Party Cloud Storage:** Data resides in encrypted Tier-4 AWS data centers (Singapore region). |
| ✅ **Automated Daily Backups:** Point-in-time disaster recovery with zero manual staff effort. | ❌ **Cloud Admin Support Needed:** Requires someone to manage monthly database quotas, API keys, and domain renewals. |

---

### 🚀 Recommended "Hybrid Phased" Strategy for HonTech
If management is undecided, we recommend the **Hybrid Phased Rollout**:
1. **Phase 1 (Launch on Cloud — ₱0 Upfront):** Launch with Vercel + Supabase in September. This allows HonTech to start immediately with **₱0 hardware expense** and test remote mobile access.
2. **Phase 2 (Optional Local Migration Later):** If HonTech ever decides they prefer a local server in the future to eliminate monthly fees, our codebase is 100% modular and can be transferred to a local PC with 1 click!

---

## 4. Hardware Sourcing & Facility Preparation

### 🖥️ 4.1 Option A: Central Server PC (If Choosing Local Hosting)
* **Recommended Specs:** Intel Core i3 (10th Gen+) / AMD Ryzen 3, 8GB–16GB RAM, 256GB SSD, Windows 10/11.
* **Joint Canvassing & Buying Trip:**
  * Team and client canvass online prices (*Lazada, Shopee, DynaQuest, EasyPC, PC Express*).
  * Team and client go together to **Gilmore Computer Center** to negotiate bulk discounts and verify physical shop warranties.
  * *Estimated Cost:* ₱16,500 – ₱22,000 *(or ₱0 if repurposing an existing functional office desktop)*.

### 📺 4.2 Customer Waiting Lounge TV (Both Options)
* **Current Status:** HonTech AutoCenter **already owns a functional Smart TV** in the customer lounge.
* **Week 2 Inspection:** Team will test the built-in browser with the TV URL (`?mode=tv`), inspect Wi-Fi stability, and only recommend an HDMI streaming stick (*Google Chromecast / Fire Stick ~₱1,800*) if the TV browser is slow.

### 🌐 4.3 Network Infrastructure
* **Cabling:** Cat6 RJ45 Ethernet cable to wire the central server PC directly into the shop's main router.
* **Terminals:** Existing front desk desktop computers, laptops, or tablets (*iPads / Android tablets*).

---

## 5. Dual Detailed Weekly Execution Roadmaps

---

### 🟢 TRACK A: Detailed Roadmap for Local Intranet Hosting

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HOW LOCAL INTRANET HOSTING OPERATES                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Server PC sits in office, wired via Cat6 to the main shop router.       │
│  2. Acts as local database brain broadcasting to `http://192.168.1.100`.   │
│  3. Front desk PCs, tablets, and Lounge TV connect via shop LAN/Wi-Fi.      │
│  4. 100% functional during external ISP fiber cuts.                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

* **Week 1 (Sept 1–5):** Timeline review, features review (Express 2H SLA, Audit Guard), online hardware price canvassing, Gilmore trip scheduling.
* **Week 2 (Sept 8–12):** Joint Gilmore purchase trip, Apache/MariaDB installation, static IP (`192.168.1.100`) setup, Lounge TV testing, LAN multi-device validation.
* **Week 3 (Sept 15–19):** Hands-on SA training, 2–3 day live customer "Shadow Mode" (dual paper + digital entry), documentation delivery, and system handover.
* **Week 4 (Sept 22–30):** 100% digital cutover (retire paper stubs), buffer stabilization, and kickoff of 1–2 months free warranty support.

---

### 🔵 TRACK B: Detailed Roadmap for Modern Cloud Deployment (Vercel + Supabase)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HOW CLOUD ARCHITECTURE OPERATES                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Web app hosted on Vercel Global Edge; DB on Supabase PostgreSQL.       │
│  2. ₱0 new server hardware needed—runs on existing office PCs & tablets.   │
│  3. Owner tracks live bays and daily volume on smartphone from home.        │
│  4. Multi-branch ready for future expansion to Branch B and Branch C.      │
└─────────────────────────────────────────────────────────────────────────────┘
```

* **Week 1 (Sept 1–5):** Timeline review, features review, cloud account registration (Vercel + Supabase), domain setup.
* **Week 2 (Sept 8–12):** Supabase database migration, Row-Level Security setup, real-time WebSocket syncing, Lounge TV cloud test, backup 4G/5G Wi-Fi validation.
* **Week 3 (Sept 15–19):** SA training, remote owner mobile dashboard training, 2–3 day live customer "Shadow Mode" dry run, cloud admin documentation handover.
* **Week 4 (Sept 22–30):** 100% digital cutover, latency fine-tuning, buffer stabilization, and kickoff of 1–2 months free warranty support.

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

## 7. Security, Audit Governance & Emergency Protocols

* **Data Sovereignty & Physical Privacy:** All customer contact numbers, vehicle diagnostic notes, and shop revenue data remain physically inside the HonTech shop building (Option A) or encrypted in AWS Tier-4 Singapore Cloud (Option B).
* **Immutable Audit Trail (`job_audit_logs`):** Every edit to departure time, status, or vehicle diagnosis is logged with old value, new value, editor identity, role, and mandatory justification.
* **Role-Based Access Control (RBAC):**
  * **Owner:** Full system control, financial analytics, staff creation, database backups.
  * **Admin:** System configuration, audit trail inspection, job monitoring.
  * **Service Advisor (SA):** Job intake, claim stub printing, repair status updates, express delay reporting.
  * **Assistant:** View-only queue inspection and bay support.
* **Emergency Fallback Protocol:** In the event of a power outage or hardware failure, staff temporarily issue backup paper claim stubs until power/server recovery.

---

## 8. Handover Deliverables Package & Post-Warranty Retainer Options

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
**Lead Systems Developer:** ___________________________  
**Justin Nolasco J.**  
**Date:** September 2, 2026
