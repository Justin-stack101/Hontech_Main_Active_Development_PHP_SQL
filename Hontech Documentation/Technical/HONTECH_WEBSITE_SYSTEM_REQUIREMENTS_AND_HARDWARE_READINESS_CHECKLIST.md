# HONTECH AUTOCENTER
## Operations Management & Service Bay Queue System
### Official Website System Requirements & Hardware Readiness Checklist

---

```
Document Type: Technical Standard & Pre-Deployment Audit Checklist
Document Reference: HONTECH-SRS-CHK-2026-V1
Target Deployment Date: September 2026
Prepared by — HonTech Development Team:
  • Mary Dayne Villas T. — System Architect & System Designer
  • Justin Nolasco J. — Lead Systems Developer & Technical Implementation
  • Catherine Ramos G. — Technical Documentation & QA Lead
Capstone Project Adviser: Mr. Ar-Jay C. Agbayani (Faculty Adviser | Department of IT)
Client Entity: HonTech AutoCenter (Company President & General Manager)
Target Scope: Multi-Branch Readiness (Branch 1: Marikina Main & Branch 2: Expansion Branch)
```

---

## 1. Executive Summary & Purpose of Checklist

This audit document establishes the **official pre-flight hardware and software requirements checklist** for the **HonTech AutoCenter Operations Management & Service Bay Queue Web System**. 

Prior to initiating the **Week 3 Live Customer "Shadow Mode"**, the Developing Team and HonTech Management will conduct an on-site physical walk-through during **Week 2 (September 8–12, 2026)** to verify that all 6 staff computers, 2 lounge display TVs, networking gear, and web browser environments meet these operational criteria.

---

## 2. Multi-Branch Hardware & Equipment Inventory Checklist

### 📋 Category A: Workstation & Display Equipment (2 Branches)

| Item # | Equipment Category | Target Location | Quantity | Minimum Hardware Specifications | Audit Status |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **A.1** | **Dedicated Service Advisor (SA) Personal Computers** | **Branch 1 (Marikina Main)** | **2 PCs** | • Intel Core i3 (8th Gen+) / AMD Ryzen 3<br>• 4GB–8GB DDR4 RAM, 128GB+ SSD<br>• 1080p Full HD Display (1920x1080)<br>• Windows 10/11 64-bit OS<br>• Dedicated USB Keyboard & Mouse | [ ] PASS<br>[ ] FAIL |
| **A.2** | **Dedicated Service Advisor (SA) Personal Computers** | **Branch 2 (Expansion)** | **2 PCs** | • Intel Core i3 (8th Gen+) / AMD Ryzen 3<br>• 4GB–8GB DDR4 RAM, 128GB+ SSD<br>• 1080p Full HD Display (1920x1080)<br>• Windows 10/11 64-bit OS<br>• Dedicated USB Keyboard & Mouse | [ ] PASS<br>[ ] FAIL |
| **A.3** | **Front Desk / Cashier Billing Computers** | **Branch 1 (Marikina Main)** | **1 PC** | • Windows 10/11 Desktop or Laptop<br>• 4GB+ RAM, Thermal Printer USB/LAN Driver<br>• 1080p or 1366x768 Display | [ ] PASS<br>[ ] FAIL |
| **A.4** | **Front Desk / Cashier Billing Computers** | **Branch 2 (Expansion)** | **1 PC** | • Windows 10/11 Desktop or Laptop<br>• 4GB+ RAM, Thermal Printer USB/LAN Driver<br>• 1080p or 1366x768 Display | [ ] PASS<br>[ ] FAIL |
| **A.5** | **Customer Waiting Lounge Queue Display with Audio** | **Branch 1 (Marikina Main)** | **1 Smart TV** | • 32" to 55" Smart TV with Built-in Web Browser *(or HDMI 1080p Fire Stick / Chromecast)*<br>• **Integrated Sound / Stereo Speakers:** Must be capable of clear audible chime playback above ambient shop lounge noise for queue notifications (Bay Dispatch, Vehicle Ready, SLA alerts)<br>• Full-screen kiosk mode support (`?mode=tv`) | [ ] PASS<br>[ ] FAIL |
| **A.6** | **Customer Waiting Lounge Queue Display with Audio** | **Branch 2 (Expansion)** | **1 Smart TV** | • 32" to 55" Smart TV with Built-in Web Browser *(or HDMI 1080p Fire Stick / Chromecast)*<br>• **Integrated Sound / Stereo Speakers:** Must be capable of clear audible chime playback above ambient shop lounge noise for queue notifications (Bay Dispatch, Vehicle Ready, SLA alerts)<br>• Full-screen kiosk mode support (`?mode=tv`) | [ ] PASS<br>[ ] FAIL |
| **A.7** | **Thermal Receipt & Claim Stub Printers** | **Both Branches (1 & 2)** | **2 Printers** | • 80mm or 58mm POS Thermal Receipt Printer<br>• ESC/POS or System Print Dialog Compatible | [ ] PASS<br>[ ] FAIL |
| **A.8** | **Uninterruptible Power Supply (UPS / AVR)** | **Front Desk & Cashier** | **2 Units** | • 650VA–1000VA UPS with built-in surge suppressor to protect against power sags | [ ] PASS<br>[ ] FAIL |

---

## 3. Web Browser & Software Client Environment Checklist

### 🌐 Category B: Software & Client Compatibility

| Item # | Software Requirement | Evaluation Criteria | Recommended Setting | Audit Status |
| :---: | :--- | :--- | :--- | :---: |
| **B.1** | **Primary Web Browser** | Google Chrome (Version 110.0+) or Microsoft Edge (Chromium) | Up-to-date modern Chromium engine | [ ] PASS<br>[ ] FAIL |
| **B.2** | **Secondary / Fallback Browser** | Mozilla Firefox (Version 115.0+ ESR) | Verified for responsive layout rendering | [ ] PASS<br>[ ] FAIL |
| **B.3** | **JavaScript & DOM APIs** | JavaScript must be enabled in browser settings | Required for SLA timers & queue reactivity | [ ] PASS<br>[ ] FAIL |
| **B.4** | **HTML5 & Web Audio API (Sound Output)** | Browser audio auto-play unblocked / enabled on `?mode=tv` and staff consoles | Synthesized chime playback (`playBayDispatchSound()`, `playReleaseConfirmSound()`, `playAutomotiveChime()`) functional with audio unmute toggled | [ ] PASS<br>[ ] FAIL |
| **B.5** | **Client Storage Access** | LocalStorage & SessionStorage unblocked (Third-party cookie blocks must not disable local storage) | Required for active session persistence | [ ] PASS<br>[ ] FAIL |
| **B.6** | **Display Scaling & Resolution** | Minimum 1366x768 resolution (Optimal: 1920x1080 Full HD at 100% Windows scaling) | Crisp table display without layout wrapping | [ ] PASS<br>[ ] FAIL |
| **B.7** | **PDF / Print Capability** | Native browser print preview enabled with background graphics checkbox turned ON | Required for customer invoice & claim stub printing | [ ] PASS<br>[ ] FAIL |
| **B.8** | **Browser Cache Versioning** | Browser set to load latest CSS/JS version tags (`v=2.x`) without stale caching | Verified across all 6 workstations | [ ] PASS<br>[ ] FAIL |

---

## 4. Network, Bandwidth & Electrical Failover Checklist

### 📡 Category C: Network Infrastructure & Power Stability

| Item # | Infrastructure Component | Requirement & Testing Method | Minimum Threshold | Audit Status |
| :---: | :--- | :--- | :--- | :---: |
| **C.1** | **Primary Internet Bandwidth** | Fiber Broadband line (PLDT / Globe) tested at cashier and bay consoles | Minimum 15–25 Mbps Download / 10 Mbps Upload per branch | [ ] PASS<br>[ ] FAIL |
| **C.2** | **Wi-Fi Signal in Service Bays** | Wi-Fi signal level measured at Service Bays 1 through 6 using smartphone/laptop | Minimum -65 dBm (Strong 3–4 Wi-Fi bars) | [ ] PASS<br>[ ] FAIL |
| **C.3** | **Wi-Fi Signal in Customer Lounge** | Wi-Fi signal level measured at the Smart TV wall mount | Minimum -60 dBm (Zero buffering on queue display) | [ ] PASS<br>[ ] FAIL |
| **C.4** | **Backup Internet Failover** | Prepaid 4G/5G Wi-Fi Router (Smart Bro / Globe At Home) with active data SIM | Tested 5-second manual network failover | [ ] PASS<br>[ ] FAIL |
| **C.5** | **Local Network Subnet (Option A only)** | Static IP assigned to Server PC (`192.168.1.100`) and pingable from all 4 SA PCs | Latency < 2ms over shop LAN | [ ] PASS<br>[ ] FAIL |
| **C.6** | **Electrical Outlets & Surge Protection** | Dedicated 220V power strip with circuit breaker at each SA desk | No loose sockets or daisy-chained heavy tool loads | [ ] PASS<br>[ ] FAIL |

---

## 5. User Account & Security Authorization Checklist

### 🔐 Category D: System Access & Role Governance

| Item # | User Role / Module | Configured Accounts | Verification Test | Audit Status |
| :---: | :--- | :--- | :--- | :---: |
| **D.1** | **Business Owner / General Manager** | 1 Master Account per branch | Access to revenue analytics, full audit trails, and staff account management | [ ] PASS<br>[ ] FAIL |
| **D.2** | **Shop Administrator** | 1 Admin Account per branch | Access to technician assignments, inventory, and bay settings | [ ] PASS<br>[ ] FAIL |
| **D.3** | **Service Advisors (SAs)** | 4 Dedicated SA Accounts (2 per branch) | Access to vehicle intake, SLA timer pause/resume, and job completion | [ ] PASS<br>[ ] FAIL |
| **D.4** | **Assistant / Cashier** | 2 Cashier Accounts (1 per branch) | Access to invoice billing, payment logging, and thermal printouts | [ ] PASS<br>[ ] FAIL |
| **D.5** | **Emergency Password Recovery** | Configured for all administrative accounts | 6-Digit PIN recovery and reset token flow verified | [ ] PASS<br>[ ] FAIL |
| **D.6** | **Audit Trail Logging** | Automated trigger on every job status transition | Verified in `job_audit_logs` table | [ ] PASS<br>[ ] FAIL |

---

## 6. Physical Station Ergonomics & Facility Readiness

### 🛠️ Category E: Shop Floor & Customer Lounge Setup

| Item # | Facility Checklist Item | Target Location | Verification Details | Audit Status |
| :---: | :--- | :--- | :--- | :---: |
| **E.1** | **SA Workstation Desk Placement** | Service Bay Intake Counter | Clean desk space with no motor oil splash risk, cables neatly bundled | [ ] PASS<br>[ ] FAIL |
| **E.2** | **Lounge TV Wall Mount & Cable Concealment** | Customer Lounge Front Wall | TV securely mounted at eye level, power & HDMI cables securely routed | [ ] PASS<br>[ ] FAIL |
| **E.3** | **Thermal Paper Roll Inventory** | Cashier & Front Desk | Minimum 5 backup rolls of 80mm thermal paper on hand | [ ] PASS<br>[ ] FAIL |
| **E.4** | **Physical Whiteboard Standby** | Shop Main Floor | Existing dry-erase whiteboard cleaned and markers ready for dual "Shadow Mode" | [ ] PASS<br>[ ] FAIL |
| **E.5** | **Printed Quick-Start User Guides** | Placed beside all 4 SA computers | 2-page laminated Quick Reference Card for instant staff lookup | [ ] PASS<br>[ ] FAIL |

---

## 7. Timeline Integration & Audit Sign-Off Protocol

### 📅 Execution in Rollout Timeline:
* **Week 2:** Developing Team and HonTech Management conduct the physical walk-through audit using this checklist.
* **Pre-requisite Gate:** All items under Categories A, B, C, and D must achieve a **PASS** rating before authorizing **Week 3 Live Customer "Shadow Mode"**.

---

## 8. Formal Pre-Deployment Verification Sign-Off

### Part I: Developing Team Audit Verification
We hereby certify that the hardware, client workstation environments, web browser compatibility, and network bandwidth parameters have been rigorously inspected and meet all technical standards required to operate the HonTech Operations Management System.

```
__________________________________          __________________________________          __________________________________
Mary Dayne Villas T.                         Justin Nolasco J.                            Catherine Ramos G.
System Architect & Designer                 Lead Systems Developer                       Documentation & QA Lead
Date: ________________________              Date: ________________________               Date: ________________________
```

---

### Part II: Capstone Project Adviser Endorsement
I have reviewed this Technical Requirements & Readiness Checklist and confirm that it aligns with academic software engineering best practices and capstone deployment standards.

```
____________________________________________________
Mr. Ar-Jay C. Agbayani
Faculty Capstone Project Adviser | Department of IT
Date Endorsed: _____________________________________
```

---

### Part III: Client Facility & Hardware Readiness Acceptance
HonTech AutoCenter confirms that the physical workstation computers, network infrastructure, and display equipment specified in this checklist are verified and ready for live operational deployment.

```
____________________________________________________
Company President / Business Owner
HonTech AutoCenter Management & Ownership
Title / Designation: Company President & General Manager
Date Approved: _____________________________________
```
