# HONTECH AUTOCENTER
## Operations Management System
### Client Proposal & September 2026 Dual Implementation Plan
#### (Local Intranet Server vs. Cloud Vercel + Supabase)

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
**Document Version:** 5.0 (Client Insights, Pros/Cons & Dual-Track Blueprint)

---

## Table of Contents
1. [Executive Summary & Academic Grant Terms](#1-executive-summary--academic-grant-terms)
2. [Core System Features & Recent Enhancements](#2-core-system-features--recent-enhancements)
3. [Architecture Comparison: Local Intranet vs. Cloud Solutions](#3-architecture-comparison-local-intranet-vs-cloud-solutions)
   - [Pros & Cons: Option A (Local Intranet)](#-option-a-local-intranet-hosting-on-premise-server)
   - [Pros & Cons: Option B (Modern Cloud)](#-option-b-modern-cloud-solutions-vercel--supabase--aws)
4. [Hardware Sourcing & Facility Preparation](#4-hardware-sourcing--facility-preparation)
5. [Dual Detailed Weekly Execution Roadmaps](#5-dual-detailed-weekly-execution-roadmaps)
   - [Track A: Local Intranet Hosting Plan & Fresh Insights](#-track-a-detailed-roadmap-for-local-intranet-hosting-recommended)
   - [Track B: Modern Cloud Deployment Plan & Fresh Insights](#-track-b-detailed-roadmap-for-modern-cloud-deployment-vercel--supabase)
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
* **Client Hardware Ownership:** The only investment required from HonTech AutoCenter is the physical hardware equipment (*Server PC, Ethernet cables, streaming adapter if needed*), which remains 100% the property of the client.
* **1–2 Months Complimentary Warranty & Support:** The development team provides 1–2 months of free post-launch monitoring, bug fixes, and operational assistance.

---

## 2. Core System Features & Recent Enhancements

* **Real-Time Bay & Queue Tracking:** Live visibility of all vehicles, bay locations, assigned technicians, and service categories (*PMS, GRS, Express*).
* **Automated Express Lane 2-Hour SLA Alerts:** Continuous duration counter displaying `⚠️ Express 2H Limit Exceeded` when turnaround exceeds 120 minutes, with structured delay root-cause reporting (*Parts delay, deep diagnostic, customer approval, technician bottleneck*).
* **Customer Waiting Lounge TV Broadcast:** Real-time, non-interactive status board displaying vehicle progress (*Waiting, In Progress, Ready for Release*) to keep waiting customers informed.
* **Tamper-Proof Audit Guard:** System-wide reason-required logging for every record modification (*departure times, diagnoses, categories*) with old/new value comparison and editor logging.
* **Customer Lookup & History:** Instant recall of repeat customer contact numbers and historical service visits.

---

## 3. Architecture Comparison: Local Intranet vs. Cloud Solutions

To give HonTech management complete clarity and strategic decision-making power, we provide a side-by-side comparison including detailed **Pros & Cons** and operational trade-offs:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          ARCHITECTURE DECISION MATRIX                                  │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ CRITERIA                 │ OPTION A: LOCAL INTRANET    │ OPTION B: CLOUD (VERCEL+SUPA) │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Monthly Hosting Fee      │ ₱0 / month (Free forever)   │ ₱0 – ₱1,400 / month           │
│ Internet Dependency      │ 100% Offline Resilience     │ Mandatory Internet Uplink     │
│                          │ (Works during fiber cuts)   │ (Halts if ISP drops)          │
│ Remote / Off-Site Access │ Local Shop Network Only     │ Anywhere via Mobile/Home PC   │
│ Multi-Branch Syncing     │ Local Branch Network        │ Central Cloud Database Sync   │
│ Data Privacy             │ 100% Inside Shop Building   │ Cloud Server (Singapore AWS)  │
│ Hardware Needed          │ Central Server PC           │ Any Standard Office PC/Tablet │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

---

### ⚖️ Detailed Pros & Cons Breakdown for Management

#### 🟢 Option A: Local Intranet Hosting (On-Premise Server)
| Pros (Advantages) | Cons (Trade-Offs) |
| :--- | :--- |
| ✅ **Zero Monthly Bills (₱0):** No recurring monthly cloud server bills, no domain renewals, and no database bandwidth charges. | ❌ **No Remote Access:** Management cannot view the dashboard from home or smartphone when outside the shop. |
| ✅ **100% Internet Immunity:** If PLDT, Globe, or Converge fiber goes down, the entire shop, front desk, and Lounge TV keep working with zero interruption. | ❌ **Hardware Responsibility:** HonTech must keep the local server PC running during business hours and replace parts if the PC breaks years later. |
| ✅ **Absolute Data Privacy:** Customer names, contact numbers, and repair billing never leave the physical shop building. | ❌ **Single-Branch Localized:** If HonTech opens a second branch in another city, data does not sync automatically without an internet bridge. |
| ✅ **Blazing Fast Local Speed:** Instant load times (under 20ms) because data travels through direct Ethernet cable and local Wi-Fi. | |

---

#### 🔵 Option B: Modern Cloud Solutions (Vercel + Supabase / AWS)
| Pros (Advantages) | Cons (Trade-Offs) |
| :--- | :--- |
| ✅ **Anywhere, Anytime Remote Access:** The Owner and Managers can monitor live bay operations, daily revenue, and customer queues from their smartphone or laptop at home. | ❌ **Strict Internet Dependency:** If the shop’s broadband connection drops, staff cannot load or update records unless a backup mobile hotspot is switched on. |
| ✅ **Zero Server Hardware Hassle:** No need to buy or maintain a dedicated server desktop in the shop—runs on any PC, tablet, or mobile browser. | ❌ **Recurring Cloud Costs:** After free tiers are exceeded, cloud databases (Supabase/AWS) incur modest monthly usage fees (₱800–₱1,400/month). |
| ✅ **Effortless Multi-Branch Scaling:** When HonTech opens Branch B and Branch C in the future, all branches share one unified master database in real time. | ❌ **External Data Hosting:** Customer records and database logs are stored in secure cloud data centers (e.g., AWS Singapore) rather than on-site. |
| ✅ **Automated Cloud Backups:** Database snapshots and disaster recovery are automated daily in the cloud. | |

---

## 4. Hardware Sourcing & Facility Preparation

### 🖥️ 4.1 Central Server PC (For Option A: Local Intranet)
* **Form Factor:** Desktop PC or Mini-PC (*Avoid laptops due to battery swelling under 24/7 continuous operation*).
* **Recommended Specs:** Intel Core i3 (10th Gen+) / AMD Ryzen 3, 8GB–16GB RAM, 256GB SSD, Windows 10/11 64-bit.
* **Sourcing Strategy (Joint Canvassing):**
  * The capstone development team will canvass online prices (*Lazada, Shopee, DynaQuest, EasyPC, PC Express*).
  * **Joint Buying Trip:** The development team and the client will go together to **Gilmore Computer Center / known computer distributor hubs** to inspect units, verify physical warranties, and secure the best discounted prices.
  * *Estimated Cost:* ₱16,500 – ₱22,000 *(or ₱0 if repurposing an existing functional office desktop)*.

### 📺 4.2 Customer Waiting Lounge TV
* **Current Status:** HonTech AutoCenter **already owns a functional Smart TV** in the customer lounge.
* **Testing & Inspection:** During Week 2, the development team will inspect and test the existing TV:
  * Test the built-in Smart TV browser with the dedicated TV Monitoring URL (`http://192.168.x.x/frontend/?mode=tv`).
  * Check HDMI ports and Wi-Fi stability.
  * If the TV browser is slow or outdated, a budget streaming stick (*Google Chromecast with Google TV / Amazon Fire Stick ~₱1,800*) will be plugged into HDMI for seamless auto-refreshing broadcast.

### 🌐 4.3 Network Infrastructure
* **Cabling:** Cat6 RJ45 Ethernet cable to wire the central server PC directly into the shop's main router.
* **Terminals:** Existing front desk desktop computers, laptops, or tablets (*iPads / Android tablets*).

---

## 5. Dual Detailed Weekly Execution Roadmaps

---

### 🟢 TRACK A: Detailed Roadmap for Local Intranet Hosting (Recommended)

#### 💡 Fresh Insights: How Local Hosting Works on the Shop Floor
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HOW LOCAL INTRANET HOSTING OPERATES                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. The Server PC sits safely in the front office, connected by Cat6 cable  │
│     to the main shop Wi-Fi router.                                          │
│  2. It acts as the "Brain" of the shop, hosting the database locally.       │
│  3. Every front desk PC, Service Advisor tablet, and the Waiting Lounge TV   │
│     connects using the shop's local Wi-Fi or LAN (e.g. 192.168.1.100).      │
│  4. ✨ KEY BENEFIT: Even if PLDT/Globe fiber is totally down, the entire     │
│     shop continues operating at 100% speed with zero downtime!              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 📅 Week 1 (Sept 1 – 5): Client Alignment & Hardware Planning
* Present the 4-week September deployment timeline to HonTech management.
* Demonstrate latest feature revisions (*Express 2H SLA, Audit Trail, Customer Lookup*).
* Canvass online hardware prices and schedule the joint Gilmore shopping trip.
* Finalize decision to proceed with Local Intranet hosting.

#### 📅 Week 2 (Sept 8 – 12): Procurement, Server Setup & On-Site Network Installation
* **Joint Hardware Shopping:** Team and client visit Gilmore to purchase the Server PC, Ethernet cables, and accessories.
* **Server Staging:** Install Windows environment, Apache web server, and MariaDB/MySQL database engine.
* **On-Site Installation & Network Configuration:**
  * Connect server PC via wired Cat6 Ethernet to the shop router.
  * Assign a permanent static IP address (e.g., `192.168.1.100`).
  * Configure local firewall rules to allow local devices to connect.
* **Lounge TV & Terminal Testing:**
  * Test and inspect the existing customer lounge TV display.
  * Verify multi-device LAN connectivity from Front Desk PCs, SA tablets, and Admin laptops.
  * Test branch data partitioning and local database backup scripts.

#### 📅 Week 3 (Sept 15 – 19): Staff Training, "Shadow Mode" Dry Run & Official Handover
* **Hands-On Staff Training (60 mins):** Interactive roleplay training with Service Advisors (walk-ins, appointments, PMS/GRS lane assignments, 2-hour delay reporting, claim stub printing).
* **Live "Shadow Mode" Parallel Dry Run (2–3 Days):**
  * Staff continue issuing paper claim stubs for safety while simultaneously entering data into the digital system.
  * Test real-time bay updates and lounge TV responsiveness with actual daily customer traffic.
* **Rapid Refinements:** Apply immediate UX/workflow tweaks based on SA feedback.
* **Official Handover:** Deliver physical/PDF User Manuals, Admin Guides, Emergency Fallback Guides, and complete source code archives.

#### 📅 Week 4 (Sept 22 – 30): 100% Digital Cutover & Free Support Kickoff
* **100% Paperless Cutover:** Officially retire paper claim stubs.
* **Operational Buffer:** Extra dedicated buffer days to assist staff during morning rush hours.
* **Free Maintenance Kickoff:** Begin the 1–2 months complimentary warranty and support period.

---

### 🔵 TRACK B: Detailed Roadmap for Modern Cloud Deployment (Vercel + Supabase)

#### 💡 Fresh Insights: How Cloud Solutions Work for Modern Auto Centers
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HOW CLOUD ARCHITECTURE OPERATES                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. The application lives on Vercel's global edge network, and the database │
│     is hosted on Supabase (PostgreSQL with real-time WebSockets).          │
│  2. No server PC needed in the shop—any device with an internet connection  │
│     can access the system instantly.                                        │
│  3. ✨ KEY BENEFIT: Management can view live shop metrics, daily intake     │
│     totals, and technician status from their smartphone from home or        │
│     while traveling!                                                        │
│  4. 🚀 MULTI-BRANCH READY: Connects multiple branch locations into one      │
│     centralized dashboard without complex VPN networking.                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 📅 Week 1 (Sept 1 – 5): Client Alignment & Cloud Subscription Setup
* Present the 4-week September deployment timeline and remote cloud advantages to management.
* Review completed features (*Express 2H SLA, Audit Trail, Customer Lookup*).
* Assist client in registering cloud accounts (*Vercel hosting + Supabase PostgreSQL database*).
* Discuss domain options (*custom domain `hontechautocenter.com` vs. free secure Vercel subdomain*).

#### 📅 Week 2 (Sept 8 – 12): Cloud Database Migration, Security & On-Site Terminal Setup
* **Cloud Infrastructure Setup:** Deploy frontend to Vercel Global Edge Network and migrate database schema to Supabase PostgreSQL.
* **Row-Level Security (RLS) & Multi-Branch Setup:**
  * Configure cloud authentication and multi-branch data synchronization.
  * Test real-time WebSockets so changes sync instantly between remote devices and shop terminals.
* **On-Site Terminal & Lounge TV Integration:**
  * Test and inspect the existing customer lounge TV connection to the cloud TV URL (`https://hontech.vercel.app/?mode=tv`).
  * Verify shop broadband bandwidth and test automatic offline caching.

#### 📅 Week 3 (Sept 15 – 19): Staff Training, Remote Owner Access & Parallel Dry Run
* **Staff & Owner Training:**
  * Train Service Advisors on daily customer intake and Express delay logging.
  * Train Owner/Management on accessing live shop analytics remotely from home or mobile smartphones.
* **Live "Shadow Mode" Dry Run (2–3 Days):** Dual paper and cloud data entry with live customer traffic.
* **Official Handover:** Deliver Cloud Admin Documentation, Supabase Console Guide, Emergency Internet Loss Protocol, and repository access.

#### 📅 Week 4 (Sept 22 – 30): 100% Digital Cutover & Cloud Monitoring
* **100% Paperless Cutover:** Officially retire paper claim stubs.
* **Buffer & Latency Optimization:** Monitor cloud database latency and fine-tune real-time subscriptions.
* **Free Maintenance Kickoff:** Active 1–2 months complimentary monitoring.

---

## 6. Training, Simulation & Dry-Run Protocols

To guarantee 100% adoption without slowing down busy morning operations, we follow a structured 3-tier training methodology:

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

* **Data Sovereignty & Physical Privacy:** All customer contact numbers, vehicle diagnostic notes, and shop revenue data remain physically inside the HonTech shop building.
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
2. **Staff User Manual (PDF):** Visual, step-by-step guide with screenshots for Service Advisors.
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
