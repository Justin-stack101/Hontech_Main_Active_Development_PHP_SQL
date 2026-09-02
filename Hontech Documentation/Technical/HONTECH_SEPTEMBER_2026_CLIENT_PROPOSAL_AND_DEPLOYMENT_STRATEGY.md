# HONTECH AUTOCENTER
## Operations Management System
### Client Proposal & September 2026 Strategic Architecture Blueprint
#### (Local Intranet Server vs. Modern Cloud Vercel + Supabase)

---

**Prepared for:**  
**HonTech AutoCenter — Management & Ownership**

**Prepared by:**  
**HonTech Systems Development Team**
- **Justin Nolasco J.** — *Lead Systems Developer*
- **Mary Dayne Villas T.** — *UI/UX & Frontend Designer*
- **Catherine Ramos G.** — *Technical Documentation & QA Lead*

**Project Adviser:**  
**Mr. Ar-Jay C. Agbayani** — *Capstone Project Adviser*

**Date:** September 2, 2026  
**Document Version:** 6.0 (Comprehensive Executive Brainstorming & Financial TCO Edition)

---

## Table of Contents
1. [Executive Summary & Academic Grant Terms](#1-executive-summary--academic-grant-terms)
2. [Core System Features & Operational Capabilities](#2-core-system-features--operational-capabilities)
3. [Executive Strategic Brainstorming: Local vs. Cloud](#3-executive-strategic-brainstorming-local-vs-cloud)
   - [The 2026 PC Parts Inflation Reality](#-1-the-2026-pc-parts-price-inflation-reality)
   - [Auto Shop Environmental Hazards & Wear](#-2-auto-shop-environmental-hazards--hardware-longevity)
   - [Hidden Electricity & Meralco TCO Analysis](#-3-the-hidden-cost-of-electricity-tco-analysis)
   - [Internet Outage Safeguards & The ₱999 Safety Net](#-4-the-internet-outage-myth--the-999-safety-net-for-cloud)
   - [Detailed Pros & Cons Breakdown](#-side-by-side-pros--cons-for-ownership)
   - [Recommended Hybrid Phased Strategy](#-recommended-hybrid-phased-strategy-for-hontech)
4. [Hardware Sourcing & Facility Preparation](#4-hardware-sourcing--facility-preparation)
5. [Dual Detailed Weekly Execution Roadmaps](#5-dual-detailed-weekly-execution-roadmaps)
   - [Track A: Local Intranet Hosting Plan](#-track-a-detailed-roadmap-for-local-intranet-hosting)
   - [Track B: Modern Cloud Deployment Plan](#-track-b-detailed-roadmap-for-modern-cloud-deployment-vercel--supabase)
6. [Training, Simulation & Dry-Run Protocols](#6-training-simulation--dry-run-protocols)
7. [Security, Audit Governance & Emergency Protocols](#7-security-audit-governance--emergency-protocols)
8. [Handover Deliverables Package](#8-handover-deliverables-package)
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

To give HonTech management a comprehensive, business-minded evaluation, we analyze both solutions across **Current Hardware Market Inflation**, **Auto Shop Physical Hazards**, **Electricity & Hidden Costs**, **Internet Outage Safeguards**, and **Disaster Recovery**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        COMPREHENSIVE STRATEGIC DECISION MATRIX                         │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ EVALUATION PILLAR        │ OPTION A: LOCAL INTRANET    │ OPTION B: CLOUD (VERCEL+SUPA) │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Upfront Hardware Capital │ ₱16,500 – ₱25,000+          │ ₱0 (Runs on existing devices) │
│ (Current PC Parts Cost)  │ (High upfront capital risk) │ (Zero upfront hardware risk)  │
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

### 💡 Fresh Insights & Business Brainstorming

#### 💰 1. The 2026 PC Parts Price Inflation Reality
* **The Problem with Local Hardware Today:** Desktop PC components (processors, RAM, SSDs, power supply units) have experienced noticeable price inflation. Buying a new dedicated server rig today requires an immediate cash outlay of **₱18,000–₱25,000+** from HonTech before the system even goes live.
* **Why Cloud (Vercel + Supabase) Solves This:** The Cloud option completely **eliminates the upfront ₱25,000 hardware barrier**. HonTech can launch immediately using their existing front desk computer, laptops, tablets, or smartphones without spending a single peso on new computer parts.

#### 🏭 2. Auto Shop Environmental Hazards & Hardware Longevity
* **Auto Center Workshop Realities:** Auto centers have heavy airborne tire dust, oil vapors, high ambient humidity, and electrical voltage spikes whenever heavy hydraulic lifts and air compressors kick in.
* **Option A Risk:** A physical server desktop sitting in the shop requires a dedicated Uninterruptible Power Supply (UPS), periodic internal dust cleaning, and runs the risk of motherboard or power supply burnout over a 2–3 year lifespan.
* **Option B Advantage:** The server engine lives in an enterprise-grade, climate-controlled AWS data center with 99.99% uptime guarantees and automatic hardware replacement handled by cloud providers.

#### 🔌 3. The Hidden Cost of Electricity (TCO Analysis)
* A local server desktop PC running continuously during shop hours consumes electricity, adding approximately **₱350–₱600/month** to the shop’s Meralco bill (~₱4,200–₱7,200/year).
* With the Cloud solution, that electrical cost is ₱0 because computation happens on external cloud servers, making the actual cost difference between Local and Cloud virtually identical over 2 years!

#### 📡 4. The Internet Outage Myth & The ₱999 Safety Net for Cloud
* **The Main Concern with Cloud:** "What happens if PLDT or Globe fiber cuts out?"
* **The Modern Solution:** A simple **₱999 prepaid backup Wi-Fi router (Smart Bro / Globe At Home)** with a budget data SIM sitting in the front office. If the main shop fiber ever goes down, staff connect to the backup Wi-Fi in 5 seconds and operations continue uninterrupted!

---

### ⚖️ Side-by-Side Pros & Cons for Ownership

#### 🟢 Option A: Local Intranet Hosting (On-Premise Server)
| Pros (Advantages) | Cons (Trade-Offs) |
| :--- | :--- |
| ✅ **₱0 Monthly Cloud Subscriptions:** No recurring software fees or database billing. | ❌ **High Upfront Capital Cost:** Requires spending ₱18,000–₱25,000+ immediately on new computer parts. |
| ✅ **Zero Internet Dependency:** Operates 100% normally even during severe fiber cable outages. | ❌ **Zero Remote Visibility:** Owner cannot check bay queues or revenue from home or phone. |
| ✅ **100% Data Sovereignty:** Customer phone numbers and repair histories stay physically inside the building. | ❌ **Physical Hardware Breakdown Risk:** Susceptible to shop dust, heat, power surges, and drive failure. |
| ✅ **Instant 20ms LAN Speed:** Ultra-fast page loads through local Ethernet cabling. | ❌ **Manual Backup Burden:** Requires staff to remember to plug in backup USB drives weekly. |

---

#### 🔵 Option B: Modern Cloud Solutions (Vercel + Supabase)
| Pros (Advantages) | Cons (Trade-Offs) |
| :--- | :--- |
| ✅ **₱0 Upfront Hardware Cost:** Launches instantly on existing office PCs, tablets, and phones. | ❌ **Internet Dependent:** Requires active broadband or a backup 4G/5G prepaid Wi-Fi SIM. |
| ✅ **Real-Time Remote Management:** Owner/Managers can track live bays and customer volume from anywhere in the world. | ❌ **Modest Monthly Usage Fees:** Incurs ₱800–₱1,400/month after free database tier limits are scaled. |
| ✅ **Zero Physical Maintenance:** No computer fans to clean, no power supplies to replace, zero Meralco server electric bill. | ❌ **Third-Party Cloud Storage:** Data resides in encrypted Tier-4 AWS data centers (Singapore region). |
| ✅ **Multi-Branch Ready (Branch B & C):** Connects future branch locations into one synchronized company dashboard. | |
| ✅ **Automated Daily Backups:** Point-in-time disaster recovery with zero manual staff effort. | |

---

### 🚀 Recommended "Hybrid Phased" Strategy for HonTech
If management is undecided, we recommend the **Hybrid Phased Rollout**:
1. **Phase 1 (Launch on Cloud — ₱0 Upfront):** Launch with Vercel + Supabase in September. This allows HonTech to start immediately with **₱0 hardware expense** and test remote mobile access.
2. **Phase 2 (Optional Local Migration Later):** If HonTech ever decides they prefer a local server in the future, our codebase is 100% modular and can be transferred to a local PC with 1 click!

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

## 6. Training, Simulation & Dry-Run Protocols

```
[ Step 1: Interactive Guided Sandbox (60 Mins) ]
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

## 8. Handover Deliverables Package

Upon project completion, HonTech AutoCenter management will receive:
1. **Configured Working System:** Active on the chosen platform (*Local Server or Cloud*).
2. **Staff Quick-Start User Manual (PDF):** Visual, screenshot-heavy guide for Front Desk & Service Advisors.
3. **Administrator & Security Guide (PDF):** Manual for Owner/Admin covering user roles, audit histories, and password resets.
4. **Emergency Fallback Protocol (PDF):** Clear contingency steps for power outages and hardware recovery.
5. **Source Code & Database Archive:** Full system code and initial database snapshot.

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
