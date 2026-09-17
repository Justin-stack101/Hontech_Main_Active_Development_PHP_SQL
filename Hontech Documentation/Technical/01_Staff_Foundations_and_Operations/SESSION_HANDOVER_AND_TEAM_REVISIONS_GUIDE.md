# 📘 HonTech Capstone — Comprehensive Handover & Team Revisions Guide

> **Project Version**: HonTech AutoCenter Operations System (Branch 2: Security & Account Recovery)  
> **Target Audience**: Student Developers, Project Leader, Team Members & Defense Evaluators  
> **Last Updated**: August 22, 2026  
> **Current Git Branch**: `branch2-Security-Account-Recovery`

---

## 📌 1. Executive Summary & What Was Built

This handover guide provides a complete, clear, and structured reference of all recently implemented features, security boundaries, role permissions, and server operations so that you and your classmates can easily conduct testing, demonstrate the project to clients, and defend the capstone presentation with confidence.

---

## 🌟 2. Key Features & Revisions Index

### A. 📊 Operational Report Data Module (`Owner` & `Admin`)
* **Placement**: Located inside the Dashboard as a dedicated 3rd tab: `[ Live Operations Monitor ] [ Analytics & Reports Center ] [ 📊 Report Data (Intake & Flow) ]`.
* **Plan vs. Pumasok Inflow Matrix**:
  * Tracks scheduled/planned targets vs. actual arrived vehicle intakes (**Pumasok**) for:
    1. **🔄 Carry-Over**: Vehicles unfinished from previous work sessions.
    2. **🔧 GRS (General Repair Service)**: Engine overhauls, underchassis, aircon, electrical repairs.
    3. **🛠️ PMS (Preventive Maintenance Service)**: Oil change, fluid checks, filter replacements.
    4. **⚡ Express Lane**: Fast maintenance turnaround ($\le 60\text{ minutes}$).
    5. **🔍 Complimentary Inspection**: Multi-point vehicle checkups.
  * Calculates: `Planned Target`, `Pumasok (Actual Arrived)`, `In Bay (Active Working)`, `Completed & Released`, `Variance (+/-)`, and `Fulfillment Rate (%)`.
* **Day-by-Day Daily Intake Breakdown ("No. of Intake Per Day")**:
  * Chronological daily log table displaying Date, Day of Week, Walk-in vs. Online booking counts, Total Pumasok, PMS/GRS/Carry-over/Express distribution, Shop Capacity Load %, and Peak Intake Window.
  * **1-Click Actions**: Timeframe filters (`Today`, `Yesterday`, `Past 7 Days`, `This Month`, `Custom`), CSV spreadsheet export, and clean print-ready report generation.

---

### B. 🛡️ Role-Based Access Control (RBAC) Matrix

| Feature / Module | 👑 Owner | 👔 Admin | 🛠️ Service Advisor | 👩‍💼 Assistant Staff | 🔧 Technician |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Live Floor Monitor & TV Kiosk** | Full Access | Full Access | Full Access | Full Access | View Only |
| **Executive Analytics & Delays** | Full Access | Full Access | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| **Report Data (Plan vs Pumasok)** | Full Access | Full Access | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| **Workshop Bay Floor (`#section-bays`)**| Full Access | Full Access | Full Access | Full Access | View Only |
| **Bay Capacity Scaling (4–10 Bays)**| ✅ Configurable | ✅ Configurable | 🔒 Uses Config | 🔒 Uses Config | 🔒 Uses Config |
| **Online Booking Module (`#container-online-queue`)**| 👁️ Read-Only | 👁️ Read-Only | 👁️ Read-Only | ✅ **Full Control** | ❌ Hidden |
| **Walk-in Vehicle Registration** | Full Access | Full Access | ✅ **Full Control** | ✅ **Full Control** | ❌ Hidden |
| **Bay Task Progress & Milestones** | Full Access | Full Access | Full Access | Full Access | ✅ **Full Control** |

---

### C. ⏱️ Express Lane 60-Minute SLA & Delay Cause Analytics
* **Enforced SLA Rule**: Any job assigned to the Express Lane with turnaround time $\le 60\text{ min}$ is marked as **Successful (On-Time)**; $> 60\text{ min}$ is marked as **Failed (Delayed)**.
* **Root Cause Diagnostics**: For delayed express jobs, the system tracks and visualizes the top delay reasons on the Admin/Owner dashboard:
  1. *Parts Availability Delay* (Awaiting parts requisition)
  2. *Customer Add-on Approval* (Awaiting client confirmation for additional repair scope)
  3. *Lift / Bay Congestion* (All lifts currently occupied)
  4. *Complex Repair Discovery* (Unforeseen hidden defect requiring extra labor)
  5. *Extended Quality Control* (Additional road testing or diagnostic scan)

---

### D. 🏢 Dynamic Workshop Bay Capacity Scaling (4 to 10 Bays)
* **Configuration**: In **Account Settings**, Owners and Admins can scale the shop's physical capacity from **4 up to 10 bays** (`BAY-01` to `BAY-10`).
* **Adaptive Grid**: The Workshop Bays module (`#section-bays`) and public TV Bay Monitor automatically reorganize their layouts (2 to 5 responsive columns), adjust utilization percentage bars, and update Service Advisor allocation dropdowns dynamically.

---

### E. 🧰 Professional Developer Credentials & Testing Toolbox
* Clean, minimalist monochrome layout located below the main login form.
* **Instant 1-Click Role Logins**:
  * `Owner` (`owner@hontech.com` / `owner123`)
  * `Admin` (`admin@hontech.com` / `admin123`)
  * `Service Advisor` (`sa@hontech.com` / `sa123`)
  * `Technician` (`tech@hontech.com` / `tech123`)
* **Mobile Connect**: Generates on-screen QR code for instant smartphone camera scanning.
* **Utilities**: Google Auth simulated trigger, Simulated Dev Mailbox (`toggleDevMailbox()`), and Test Exception Crash Overlay trigger.

---

## 🌐 3. Server Operations & Networking Guide

### A. Local In-Shop Server (LAN / Wi-Fi / Hotspot)
1. Double-click [`start_lan_server.bat`](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/start_lan_server.bat) in the project root.
2. The batch script automatically detects your laptop's current network IP and starts the server on `0.0.0.0:8000`.
3. **Local URLs**:
   * On your laptop: `http://localhost:8000`
   * On phones/tablets connected to the same Wi-Fi/Hotspot: `http://<HOST_IP>:8000` (e.g. `http://10.239.104.46:8000`)
   * Zero-config mDNS name: `http://hontech-marikina.local:8000`

### B. Remote Nationwide Access (Anywhere in the Philippines - ₱0.00)
If client evaluators or teammates want to test the site remotely from their homes or over mobile data (Globe/Smart/PLDT/DITO):
* **Option 1: Instant Localtunnel (Zero Install)**
  ```bash
  npx localtunnel --port 8000
  ```
  Share the generated `https://xxxx.loca.lt` link with your classmates or client.
* **Option 2: Cloudflare Quick Tunnels**
  ```powershell
  cloudflared tunnel --url http://localhost:8000
  ```
  Generates an official HTTPS link with DDoS protection that bypasses router CGNAT.

---

## 🧪 4. Step-by-Step Presentation & Testing Script

1. **Step 1: Start the Local Server**
   * Double-click `start_lan_server.bat`. Confirm that port 8000 is listening.
2. **Step 2: Login Interface & Mobile Pairing**
   * Open `http://localhost:8000`.
   * Click **Developer Credentials & Testing** to show the 1-click logins and QR code.
   * Scan the QR code with a smartphone to show real-time mobile responsive view.
3. **Step 3: Test Assistant Staff Authority (Online Booking Module)**
   * Log in as **Assistant Staff** (`staff@hontech.com`).
   * Show that the Assistant can edit Lane Types, Appointment Date/Time, Diagnosis, Confirm bookings, and Delete inquiries.
4. **Step 4: Test Service Advisor (Intake & View-Only Online Queue)**
   * Log in as **Service Advisor** (`sa@hontech.com`).
   * Show that the SA can view the online queue but all fields are **Read-Only** (`View Only` indicator).
   * Show that the SA can register walk-in vehicles and assign them to workshop bays.
5. **Step 5: Test Workshop Bays Floor Plan**
   * Click **Workshop Bays** on the left menu (`#section-bays`).
   * Show the live floor plan with unassigned waiting queue and 1-click bay allocation.
6. **Step 6: Test Admin & Owner Analytics & Report Data**
   * Log in as **Owner** (`owner@hontech.com`).
   * Navigate to **Analytics Overview** -> **Report Data (Intake & Flow)**.
   * Demonstrate the **Category Inflow Matrix** (Plan vs Pumasok) and the **Daily Intake History Log** with 1-click CSV export and print preview!

---

## 📂 5. Key File Index

| File Path | Description |
| :--- | :--- |
| [`frontend/index.html`](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/frontend/index.html) | Single Page Application (SPA) DOM structure, modal dialogs, and navigation views. |
| [`frontend/js/app.js`](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/frontend/js/app.js) | Core client logic, state management, RBAC enforcement, analytics computations, and Report Data rendering. |
| [`router.php`](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/router.php) | PHP built-in server router handling API routing and static asset dispatching. |
| [`start_lan_server.bat`](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/start_lan_server.bat) | Automated LAN server launcher script for Windows. |
| [`Hontech Documentation/Technical/LOCAL_INTRANET_DEPLOYMENT_GUIDE.md`](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/Hontech%20Documentation/Technical/LOCAL_INTRANET_DEPLOYMENT_GUIDE.md) | In-depth networking, mDNS, firewall, and tunneling manual. |
| [`Hontech Documentation/Technical/WORKSHOP_BAYS_AND_RBAC_SPECIFICATION.md`](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/Hontech%20Documentation/Technical/WORKSHOP_BAYS_AND_RBAC_SPECIFICATION.md) | Bay scaling logic, floor architecture, and RBAC matrix. |
| [`REVISIONS_LOG.md`](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/REVISIONS_LOG.md) | Historical changelog of all completed revisions and commits. |
