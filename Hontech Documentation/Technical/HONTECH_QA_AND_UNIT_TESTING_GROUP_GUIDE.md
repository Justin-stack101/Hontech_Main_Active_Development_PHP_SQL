# 📋 HonTech Master Implementation & Team Testing Plan
## Official Step-by-Step QA Testing & Collaboration Guide for Justin and His 2 Groupmates

```text
========================================================================================================
PROJECT:               HonTech AutoCenter Operations & Management System
BRANCH:                branch2-Security-Account-Recovery
GITHUB:                https://github.com/Justin-stack101/Hontech_Main_Active_Development_PHP_SQL.git
TEAM SETUP:            Justin (Lead Developer) + 2 Groupmates (QA & Usability Testers)
PRIMARY OBJECTIVE:     Complete End-to-End System Testing & Verification prior to Capstone Thesis Defense
========================================================================================================
```

---

## 🎯 1. Executive Summary & Team Roles

### 👥 Division of Responsibilities:
* **👨‍💻 Justin (Lead Developer - Laptop 1):** Runs `start_lan_server.bat`, codes backend/frontend in Antigravity, pushes to GitHub, and fixes reported bugs.
* **👩‍💻 Groupmate A (Desktop QA Tester - Laptop 2):** Connects on Wi-Fi or GitHub clone, logs in as **Service Advisor** (`sa.marikina1@hontech.com` / `sa123`), tests Customer History, 40-Day Regulars, and Bay Allocation.
* **👩‍💻 Groupmate B (Mobile & Usability QA Tester - Phone / School Lab PC):** Connects on phone/school PC, logs in as **Assistant Staff** (`assistant.marikina@hontech.com` / `assistant123`), tests mobile layouts, and logs defect reports.

---

# 📶 2. STEP-BY-STEP FOR CLOSE TESTING GROUP (Same Room / School Lab / Local Wi-Fi)

*When testing together in the same room or school computer lab, ZERO INSTALLATION is required on groupmate devices!*

```
                       LOCAL WI-FI / SCHOOL LAB TESTING SETUP
                       
      [ JUSTIN: Laptop 1 ]                        [ GROUPMATE A: Laptop 2 ]
   • Runs `start_lan_server.bat`               • Opens Chrome ➔ http://192.168.x.x:8000
   • IP lumalabas: 192.168.x.x:8000            • Login as Service Advisor (`sa123`)
   • Login as Owner (`owner123`)               • Tests Intakes & Back-Jobs
                 │                                           │
                 └───────────────────┬───────────────────────┘
                                     │ (Connected sa iisang Wi-Fi / Hotspot)
                                     ▼
                          [ GROUPMATE B: Phone / School PC ]
                       • Opens Chrome / Safari ➔ http://192.168.x.x:8000
                       • Login as Assistant (`assistant123`)
                       • Tests Mobile Inquiries & Logs Bugs sa GitHub!
```

### 📋 Close Testing Steps:
1. **Step 2.1 (Connect Network):** Connect Justin's Laptop, Groupmate A's Laptop, and Groupmate B's Phone/PC to the **same Wi-Fi** or **Phone Hotspot**.
2. **Step 2.2 (Start Server):** Justin double-clicks `start_lan_server.bat` on his laptop $\to$ Note the local IP address (e.g. `http://192.168.1.50:8000`).
3. **Step 2.3 (Groupmate A Login):** Groupmate A opens Chrome on Laptop 2 $\to$ navigates to `http://192.168.1.50:8000` $\to$ logs in as **Service Advisor** (`sa.marikina1@hontech.com` / `sa123`).
4. **Step 2.4 (Groupmate B Login):** Groupmate B opens browser on Phone or School PC $\to$ navigates to `http://192.168.1.50:8000` $\to$ logs in as **Assistant Staff** (`assistant.marikina@hontech.com` / `assistant123`).
5. **Step 2.5 (Live Execution):** Both groupmates execute the **22-Step Verification Checklist** simultaneously!

---

# 🌐 3. STEP-BY-STEP FOR FAR AWAY TESTING GROUP (At Home / Remote over Internet)

*When group members are at their own houses, choose either Method A or Method B:*

---

### 🌟 METHOD A: Instant Free Online Link (Easiest - Works on Phones & Laptops!)
1. **Step 3A.1 (Justin Starts Server):** Justin runs `start_lan_server.bat` on his laptop at home.
2. **Step 3A.2 (Justin Generates Tunnel):** In a second terminal, Justin runs:
   ```bash
   npx localtunnel --port 8000
   ```
   *Outputs a live HTTPS link, e.g.* `https://hontech-demo.loca.lt`.
3. **Step 3A.3 (Justin Shares Link):** Justin pastes the link in the team Messenger/Discord group chat.
4. **Step 3A.4 (Groupmates Open & Log In):** Groupmates click the link from their phones or laptops at home $\to$ Log into their assigned accounts and test!
5. **Step 3A.5 (Log on GitHub):** Groupmates log any defects on **GitHub Issues** for Justin to fix immediately.

---

### 💻 METHOD B: Independent Local Testing via GitHub (For Groupmate A with Laptop)
1. **Step 3B.1 (Justin Pushes Code):** Justin finishes a feature and pushes to GitHub:
   ```bash
   git push origin branch2-Security-Account-Recovery
   ```
2. **Step 3B.2 (Groupmate A Pulls Code):** At her house, Groupmate A runs:
   ```bash
   git pull origin branch2-Security-Account-Recovery
   ```
3. **Step 3B.3 (Groupmate A Runs Server):** Groupmate A starts XAMPP MySQL and double-clicks `start_lan_server.bat` on her own laptop.
4. **Step 3B.4 (Groupmate A Tests):** Tests independently on `http://localhost:8000`.
5. **Step 3B.5 (Report on GitHub):** Submits GitHub Issue $\to$ Justin fixes at his house $\to$ Groupmate A pulls update!

---

## 🔄 4. The 4-Step Developer-to-QA Testing Loop

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        THE PERFECT DEVELOPER-TO-QA TESTING LOOP                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  1. 🌐 JUSTIN SHARES SECURE LINK / COMMITS TO GITHUB                                   │
│  2. 🧪 GROUPMATES TEST & LOG ON GITHUB ISSUES / EXCEL CHECKLIST                         │
│  3. 🛠️ JUSTIN REVIEWS & APPLIES CODE FIXES IN ANTIGRAVITY                              │
│  4. 🚀 GROUPMATES RE-TEST, MARK PASS, & MOVE TO NEXT FEATURE                           │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 5. The 22-Step Master Verification & Checking List

---

### 🔑 SUITE 1: Role-Based Authentication & Navigation (4 Roles)
- [ ] **Step 1.1 (Owner):** Log in as `owner@hontech.com` (`owner123`) $\to$ Full Master Analytics and Security tabs visible.
- [ ] **Step 1.2 (Admin):** Log in as `admin.marikina@hontech.com` (`admin123`) $\to$ Staff Accounts and Bay Config accessible.
- [ ] **Step 1.3 (Service Advisor):** Log in as `sa.marikina1@hontech.com` (`sa123`) $\to$ Focused intake, lookup, and bay dashboard.
- [ ] **Step 1.4 (Assistant):** Log in as `assistant.marikina@hontech.com` (`assistant123`) $\to$ Online booking queue and search menu.

---

### 👤 SUITE 2: Header & Sidebar User Profile Badges
- [ ] **Step 2.1 (Top Header):** User Name (`Justin`), Role Pill (`[ OWNER ]`), and green pulse dot clearly visible.
- [ ] **Step 2.2 (Bottom Sidebar):** Sleek single-row profile pill with zero text clipping and gear icon `[ ⚙️ ]`.
- [ ] **Step 2.3 (Dropdown Menu):** Clicking profile opens Account Settings and Sign Out popup.

---

### 🚗 SUITE 3: Vehicle Intake & Duplicate Protection Guard
- [ ] **Step 3.1 (Blank Validation):** Submitting empty form shows red toast: *"Plate and Name are required."*
- [ ] **Step 3.2 (Normal Intake):** Submitting plate `ABC 1234` adds row to Daily Intakes table.
- [ ] **Step 3.3 (Duplicate Alert):** Submitting plate `ABC 1234` a second time triggers: *"⚠️ DUPLICATE INTAKE DETECTED!"* modal.
- [ ] **Step 3.4 (Cancel Guard):** Clicking Cancel prevents duplicate intake.

---

### ⭐ SUITE 4: Customer History Lookup & Loyalty Badges
- [ ] **Step 4.1 (Search):** Search by `Juan` or `ABC 1234` displays customer record.
- [ ] **Step 4.2 (Loyalty Badge):** Shows emerald **`⭐ Returning Regular (X Visits)`** badge and total visits count.
- [ ] **Step 4.3 (History Timeline):** Visual cards show past repair orders, mechanics, and diagnostic resolutions.

---

### 🔁 SUITE 5: 40-Day Regular Visit vs. Warranty Back-Jobs
- [ ] **Step 5.1 (40-Day Regular Visit):** Clicking **`[ 🚗 Regular Visit (PMS) ]`** auto-prefills customer data with `PMS` category.
- [ ] **Step 5.2 (Warranty Back-Job):** Clicking **`[ 🔁 Back-Job (Warranty) ]`** pre-fills data with `Back-Job` and links previous Job ID.
- [ ] **Step 5.3 (Specific Order Back-Job):** Clicking **`[ Create Back-Job for This Order ]`** attaches exact reference order.

---

### 🔍 SUITE 6: Assistant Staff Fast Popup Search Menu
- [ ] **Step 6.1 (Open Popup):** Clicking **`[ 🔍 Search Customer / Back-Job ]`** on Daily Intakes opens search modal.
- [ ] **Step 6.2 (Select Customer):** Selecting customer displays prompt: *"Back-Job (Warranty Return) ba ito?"*.
- [ ] **Step 6.3 (NO Button):** Clicking **`[ ❌ NO (Stay Here) ]`** keeps popup open.
- [ ] **Step 6.4 (YES Button):** Clicking **`[ ✅ YES (Daily Intakes) ]`** switches to Intake Form with back-job data pre-filled.

---

### 🔧 SUITE 7: Bay Allocation & Workshop Board
- [ ] **Step 7.1 (Dispatch Modal):** Dispatching vehicle on Bay 1 opens modal.
- [ ] **Step 7.2 (Assign Technician):** Assigning car `ABC 1234` turns Bay 1 blue with status **Occupied**.

---

### 📊 SUITE 8: Analytics & PDF Export
- [ ] **Step 8.1 (Charts):** Revenue and Service Advisor performance charts render cleanly.
- [ ] **Step 8.2 (PDF Report):** Clicking Export PDF generates official HonTech report with logo and timestamp.

---

### ✈️ SUITE 9: 100% Offline Air-Gapped Immunity
- [ ] **Step 9.1 (Airplane Mode):** Disconnecting Wi-Fi keeps server running on `http://localhost:8000`.
- [ ] **Step 9.2 (Hard Refresh):** Hard refreshing (`Ctrl + F5`) while offline reloads full styling with zero raw text leaks.

---

## 🐛 6. Quick Copy-Paste GitHub Bug Template

```markdown
### 📌 Verification Step ID: [e.g. Step 5.2 - Customer Lookup]
### 👤 Role Tested: [Service Advisor / Assistant / Admin]
### ❌ What Happened (Actual): [Describe what broke]
### 💡 Expected Behavior: [What should have happened]
### 📸 Screenshot: [Attach screenshot]
```

---

## 🎭 7. 5-Minute Practical Roleplay Script

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        5-MINUTE TEAM ROLEPLAY SIMULATION                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. GROUPMATE B (Phone/Assistant):                                                      │
│    "Justin & Groupmate A, customer Juan Dela Cruz (ABC 1234) booked online for PMS!"  │
│    ➔ (Submits via Assistant Booking Form)                                              │
│                                                                                        │
│ 2. GROUPMATE A (Laptop/Service Advisor):                                               │
│    "Found it on Daily Intakes! Juan arrived at the shop. Dispatched to Bay 1!"         │
│    ➔ (Clicks Customer Lookup ➔ Bay Dispatch)                                          │
│                                                                                        │
│ 3. JUSTIN (Lead Developer/Admin):                                                      │
│    "Confirmed! Revenue chart and TV Workshop Monitor updated in real time! 100% PASS!" │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
