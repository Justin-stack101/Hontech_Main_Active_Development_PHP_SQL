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
1. [Executive Summary & Strategic Recommendation](#1-executive-summary--academic-grant-terms)
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
5. [Hardware Sourcing, Spec Classifications & Realistic 2-Branch Scalability](#5-hardware-sourcing-spec-classifications--realistic-2-branch-scalability)
6. [Dual Detailed Weekly Execution Roadmaps](#6-dual-detailed-weekly-execution-roadmaps)
   - [Track A: Local Intranet Hosting Plan](#-track-a-detailed-roadmap-for-local-intranet-hosting)
   - [Track B: Modern Cloud Deployment Plan](#-track-b-detailed-roadmap-for-modern-cloud-deployment-vercel--supabase)
7. [Training, Simulation & Dry-Run Protocols](#7-training-simulation--dry-run-protocols)
8. [Security Governance, Internal & External Cyber Defense Protocols](#8-security-governance-internal--external-cyber-defense-protocols)
9. [Handover Deliverables Package & Post-Warranty Retainer Options](#9-handover-deliverables-package--post-warranty-retainer-options)
10. [Official Client Sign-Off](#10-official-client-sign-off)
11. [APPENDIX A: Complete Local Intranet Feasibility & Zero-Risk Setup Blueprint](#-appendix-a-complete-local-intranet-feasibility--zero-risk-setup-blueprint)
12. [APPENDIX B: Complete Cloud Sandbox PoC Setup Blueprint (Vercel + Supabase)](#-appendix-b-complete-cloud-sandbox-poc-setup-blueprint-vercel--supabase)
13. [APPENDIX C: Developer Dual-Repository Workflow, Adapter Pattern & Testing Protocol](#-appendix-c-developer-dual-repository-workflow-adapter-pattern--testing-protocol)

---

## 1. Executive Summary & Academic Grant Terms

Running a high-throughput auto service center requires speed, coordination, and customer transparency. Today, HonTech AutoCenter handles customer intake, job routing, and status updates through paper claim stubs and verbal communication. While familiar, this manual flow creates three critical operational bottlenecks:

1. **Information Gaps Between Front Desk & Bays:** Service Advisors (SAs) cannot view technician progress in real time without physically walking to the repair bays.
2. **Customer Lounge Uncertainty:** Waiting customers frequently approach the front desk asking for updates, interrupting intake staff.
3. **Express Service Turnaround Bottlenecks:** When Express Lane PMS services exceed target limits, there is no standardized tracking to identify parts delays or workload imbalances.

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                        🏆 DEVELOPMENT TEAM & ARCHITECT RECOMMENDATION                             │
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ The Development Team and System Architect STRONGLY RECOMMEND Option B (Modern Cloud Solutions):   │
│                                                                                                   │
│ 1. 💰 Saves ₱18,500–₱23,000 Upfront: Zero server hardware needed in Gilmore.                      │
│ 2. 💸 ₱0.00 Monthly Cost: Vercel CDN and Supabase DB free tiers handle 100% of shop workload.    │
│ 3. 📱 24/7 Remote Owner Access: Monitor bay queues and daily volume from anywhere on smartphone.  │
│ 4. 🏢 Effortless Multi-Branch Syncing: Branch A & Branch B share live data with zero setup.       │
│ 5. ⚡ Sub-100ms Live Sync: Instant WebSocket updates for the Waiting Lounge TV and SA tablets.    │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 🎓 Academic Capstone Grant Terms (Zero Software Cost)
* **100% Free Software Grant:** Because this is an official academic capstone development project, **the software, source code, licensing, on-site setup, and staff training are provided to HonTech AutoCenter at ₱0 (FREE of charge).**
* **Client Hardware Ownership:** The only investment required from HonTech AutoCenter is any physical hardware equipment (*if choosing Option A: Server PC, Ethernet cables; if choosing Recommended Option B: ₱0 new hardware*), which remains 100% the property of the client.
* **1–2 Months Complimentary Warranty & Support:** The development team provides 1–2 months of free post-launch monitoring, bug fixes, and operational assistance.

---

## 2. Executive Strategic Brainstorming: Local vs. Cloud

To give HonTech management a comprehensive, business-minded evaluation, we analyze both solutions across **Financial Lifecycles (CapEx vs. OpEx)**, **Multi-Branch Network Topology**, **Hardware Market Inflation**, **Account Lockout Risks**, and **Disaster Recovery**.

### 📊 Strategic Architecture Decision Matrix

| Evaluation Pillar | 🌟 Option B: Modern Cloud *(RECOMMENDED)* | Option A: Local Intranet Server *(Alternative)* |
| :--- | :--- | :--- |
| **Recommendation Status** | **🌟 PRIMARY RECOMMENDATION (Best Value)** | Secondary Supported Alternative |
| **Financial Model (CapEx vs OpEx)** | **Zero Upfront / Free Long-Term**<br>• **₱0 upfront hardware cost**<br>• **₱0/yr** on permanent free tier | **High Upfront / Cheap Long-Term**<br>• Pay ~₱18.5k–₱23k once for PC<br>• ₱0/yr ongoing software fees |
| **Internal Security (Inside the Shop)** | **Automatic Data Isolation & Staff Roles**<br>• Staff only see what they are allowed to see<br>• Branch A staff cannot view Branch B records<br>• Mandatory reason logs for all record changes | **Private Shop Network Defense**<br>• Kept 100% inside the shop Wi-Fi<br>• Strict staff roles & password protection<br>• Mandatory reason logs for all record changes |
| **External Security (Internet & Hackers)**| **Bank-Grade Online Protection**<br>• Built-in protection against online hackers<br>• Automatic security certificate (HTTPS Padlock)<br>• Data stored securely in AWS cloud centers | **Completely Hidden from Web Hackers**<br>• Offline server is invisible on the internet<br>• Cannot be targeted by online attacks |
| **Multi-Branch Cross-Building Sync** | **Native Multi-Branch Syncing**<br>• Branch A, B, and C connect to unified cloud instantly from any internet | **Complex Hardware VPN Required**<br>• Branch B cannot reach Branch A without static public IP or VPN routers |
| **Unpaid Provider / Lockout Risk** | **100% Free Forever (No Card Required)**<br>• Generous free tier supports 500,000+ repair records (~45 years of shop data!) | **Zero Risk (100% Sovereign)**<br>• Nobody can ever lock you out of your shop's physical computer |
| **IT & Developer Maintenance** | **Cloud Administrator / Web Dev**<br>• Quota, API key, & domain renewal management | **On-Call Hardware Technician**<br>• Dust cleaning & local USB backup checks |
| **Upfront Hardware Investment** | **₱0** *(Runs on existing office PCs/tablets)* | ₱14,500 – ₱23,000 *(Work-Grade PC)* |
| **Monthly Software Hosting** | **₱0 / month (Permanent Free Tier)** | **₱0 / month (Free forever)** |
| **Electricity Cost (Meralco)** | **₱0** *(Cloud data center hosts compute)* | ~₱350–₱600 / month *(PC running 24/7)* |
| **Internet Outage Resilience** | Requires backup 4G/5G Wi-Fi SIM (~₱999) | **100% Immune** *(Continues running offline)* |
| **Remote Owner Visibility** | **Full Access** via smartphone / laptop anywhere | None *(Accessible inside shop network only)* |
| **Physical Space & Shop Clutter** | **Zero Physical Space (100% Clutter-Free)**<br>• No bulky PC towers, monitor desks, or tangled cables in the shop | **Requires Dedicated Desk / Shelf Space**<br>• Needs space for PC tower, monitor, keyboard, UPS battery backup, and power cables |
| **Auto Shop Environmental Hazards** | **100% Protected** in climate-controlled AWS data centers | Vulnerable to shop dust, grease, & power spikes |
| **Disaster Recovery** | Automated daily point-in-time cloud backups | Manual USB backup drive needed weekly |

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

#### 🌟 Option B: Modern Cloud Solutions (Vercel + Supabase) — RECOMMENDED
| Pros (Advantages) | Cons (Trade-Offs) |
| :--- | :--- |
| ✅ **₱0 Upfront Hardware Cost:** Launches instantly on existing office PCs, tablets, and phones with zero upfront cash out-of-pocket. | ❌ **Internet Dependent:** Requires active broadband or a backup 4G/5G prepaid Wi-Fi SIM. |
| ✅ **Zero Physical Shop Space Needed:** 100% clutter-free front office; no bulky PC towers, monitor desks, or tangled wires. | ❌ **Cloud Admin Support Needed:** Requires someone to manage database quotas, API keys, and domain settings. |
| ✅ **Effortless Multi-Branch Syncing:** Branch A, B, and C instantly share one synchronized master database from anywhere. | ❌ **Third-Party Cloud Storage:** Data resides in encrypted Tier-4 AWS data centers (Singapore region). |
| ✅ **Real-Time Remote Management:** Owner/Managers can track live bays and customer volume from anywhere in the world on a smartphone. | |
| ✅ **Zero Physical Maintenance:** No computer fans to clean, no power supplies to replace, zero Meralco server electric bill. | |
| ✅ **Automated Daily Backups:** Point-in-time disaster recovery with zero manual staff effort. | |

---

#### 🟢 Option A: Local Intranet Hosting (On-Premise Server) — ALTERNATIVE
| Pros (Advantages) | Cons (Trade-Offs) |
| :--- | :--- |
| ✅ **₱0 Monthly Cloud Subscriptions:** No recurring software fees; pays for itself completely over 5 years. | ❌ **High Upfront Capital Cost:** Requires spending ₱18,500–₱23,000+ immediately on new computer parts. |
| ✅ **Zero Risk of Data Lockout:** No third-party provider can freeze or suspend your shop records. | ❌ **Consumes Physical Office Space:** Requires dedicated desk/shelf space for the PC tower, monitor, UPS battery, and cables. |
| ✅ **Zero Internet Dependency:** Operates 100% normally even during severe fiber cable outages. | ❌ **Cross-Branch Barrier:** Branch B cannot connect to Branch A without expensive VPN hardware. |
| ✅ **100% Data Sovereignty:** Customer phone numbers and repair histories stay physically inside the building. | ❌ **Zero Remote Visibility:** Owner cannot check bay queues or revenue from home or phone. |
| ✅ **Instant 15ms LAN Speed:** Ultra-fast page loads through local Ethernet cabling. | ❌ **Physical Hardware Breakdown Risk:** Susceptible to shop dust, heat, power surges, and drive failure. |
| | ❌ **Manual Backup Burden:** Requires staff to remember to plug in backup USB drives weekly. |

---

## 4. Hardware Sourcing, Spec Classifications & Realistic 2-Branch Scalability

### 🖥️ 4.1 Hardware Spec Tiers Calibrated to HonTech's Team Size (3–5 Staff / Branch)

HonTech's operational team profile is **3 to 5 active users per branch** *(1 Admin/Owner, 2 Service Advisors, 1 Cashier/Assistant + 1 Lounge TV)*. Across 2 branches, this represents **6 to 10 simultaneous staff users**. 

Because HonTech has a focused, agile team, **there is no need to overspend on expensive enterprise servers**. Below are the calibrated tiers:

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

### 🏢 4.2 Realistic Operational Scenario: "2 Branches with 3–5 Staff Over 4 Years"

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

### 🛒 4.3 Joint Gilmore Sourcing & Inspection Plan
* **Online Canvassing:** Team and client canvass real-time pricing from *Lazada, Shopee, EasyPC, PC Express, and DynaQuest*.
* **On-Site Gilmore Buying Trip:** Team and client visit **Gilmore Computer Center** together to inspect physical parts, verify 1–3 year manufacturer warranties, and negotiate store bundle discounts.
* *Alternative Option:* Repurpose an existing functional Core i3/i5 office desktop at **₱0.00 hardware cost**.

---

### 📺 4.4 Customer Waiting Lounge TV (Both Options)
* **Current Status:** HonTech AutoCenter **already owns a functional Smart TV** in the customer lounge.
* **Week 2 Inspection:** Team will test the built-in browser with the TV URL (`?mode=tv`), inspect Wi-Fi stability, and only recommend an HDMI streaming stick (*Google Chromecast / Fire Stick ~₱1,800*) if the TV browser is slow.


---

## 5. Dual Detailed Weekly Execution Roadmaps

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

## 8. Handover Deliverables, Post-Turnover Developer Strategy & Project Authorization

### 📦 8.1 Handover Deliverables Package
Upon project completion and sign-off, HonTech AutoCenter management will receive:
1. **Configured Working Production System:** Fully operational on the chosen platform (*Recommended Cloud or Local Server*).
2. **Staff Quick-Start User Manual (PDF):** Visual, screenshot-heavy step-by-step guide for Front Desk staff & Service Advisors.
3. **Administrator & Security Operations Guide (PDF):** Complete manual for Owner/Admin covering user creation, RBAC permissions, audit log review, and PIN/password resets.
4. **Emergency Fallback Protocol & Disaster Recovery Runbook (PDF):** Clear contingency steps for power blackouts, internet drops, and database restoration.
5. **Full Source Code Repository & Database Architecture Archive:** Complete, uncompiled source code, SQL schema migrations, and initial seed snapshots.
6. **Built-in Diagnostic Tools:** High-contrast developer error reporting overlay with one-click log export (`.txt`) for instant troubleshooting.

---

### 🛠️ 8.2 Post-Turnover Developer & Maintenance Strategy ("Who Will Handle the System?")

A common and important question from business ownership is: *"After the capstone development phase is completed, who will maintain and manage the system?"*

To ensure HonTech AutoCenter never faces operational downtime or developer dependency, the project incorporates a **3-tier sustainability framework**:

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           POST-TURNOVER SYSTEM SUSTAINABILITY FRAMEWORK                           │
├───────────────────────────────────┬───────────────────────────────────────────────────────────────┤
│ 1. Zero-Code Daily Operations     │ • All day-to-day tasks (adding staff, changing rates, bay    │
│    (Self-Sustaining Admin Panel)  │   queues, backups) are done via buttons in the user interface. │
│                                   │ • Shop managers NEVER need to write code or touch databases.  │
├───────────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ 2. Clean, Standard Architecture   │ • Built on industry-standard HTML/CSS/JS and SQL.             │
│    (No Vendor Lock-In)            │ • No obscure proprietary coding languages. Any junior web     │
│                                   │   developer or IT student can understand the code in 30 mins. │
├───────────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ 3. Tiered Post-Launch Support     │ • Phase 1: 1–2 Months 100% Free Developer Warranty Support.   │
│                                   │ • Phase 2: Affordable on-call / per-visit retainer option.    │
│                                   │ • Phase 3: Academic department internship pipeline for future │
│                                   │   feature expansions.                                         │
└───────────────────────────────────┴───────────────────────────────────────────────────────────────┘
```

1. **Self-Sustaining Admin Controls (No Daily Developer Needed):**
   * The system is engineered so that HonTech does **not** need a full-time programmer on payroll. The Owner and Admin can create accounts, toggle active/inactive staff, change branch assignments, view audit histories, and export backups directly through intuitive visual screens.
2. **Phase 1: 1–2 Months Complimentary Developer Warranty (₱0.00):**
   * The development team provides 1–2 months of free post-launch monitoring, immediate bug fixes, and on-site/remote assistance while staff become 100% comfortable with the workflow.
3. **Phase 2: Affordable On-Call IT Retainer (Optional):**
   * After the free 2-month warranty, HonTech can engage the lead developer or an on-call IT specialist on an affordable, on-demand basis (*e.g., per scheduled quarterly checkup or per custom feature request*) rather than paying an expensive monthly IT salary.
4. **Phase 3: Academic Collaboration & Student Internship Pipeline:**
   * HonTech can maintain an active partnership with the college/university IT department, allowing future graduating capstone batches or student interns to build future add-on modules (*such as customer mobile apps or loyalty programs*) at zero software cost.

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


