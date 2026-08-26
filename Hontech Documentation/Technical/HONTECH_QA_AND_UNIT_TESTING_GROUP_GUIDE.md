# 🧪 HonTech QA & Unit Testing Guide: GitHub Collaboration Manual
## Step-by-Step Quality Assurance (QA) & Testing Protocol for Capstone Groupmates

```text
========================================================================================================
PROJECT:               HonTech AutoCenter Management System
ACTIVE BRANCH:         branch2-Security-Account-Recovery
GITHUB REPO:           https://github.com/Justin-stack101/Hontech_Main_Active_Development_PHP_SQL.git
TARGET AUDIENCE:       QA Testers, Groupmates, System Evaluators (No Coding Required!)
PURPOSE:               Standardized QA Testing, GitHub Issue Tracking, & Role-Based Verification
========================================================================================================
```

---

## 📌 1. Overview: What is Your Role as a QA Tester?

As a **Quality Assurance (QA) / Unit Tester** in our Capstone team, your responsibility is to **validate the system from a real user's perspective** before our live client presentation and thesis defense:

1. **Pull the Latest Code:** Ensure your local copy has the newest updates from GitHub.
2. **Execute Test Scenarios:** Follow the step-by-step role checklists below.
3. **Identify Edge Cases:** Test weird inputs (e.g. blank fields, duplicate plate numbers, offline mode, fast double clicks).
4. **Report Bugs on GitHub:** Document any crashes, misalignments, or calculation errors on GitHub Issues so the lead programmer can fix them immediately.

---

## 🛠️ 2. Getting the Latest Code from GitHub (30 Seconds)

Every time testing starts, open **Command Prompt / PowerShell** in your project folder and run:

```bash
# 1. Pull latest updates from GitHub
git pull origin branch2-Security-Account-Recovery

# 2. If git gives an error because of local edits, run this clean reset:
git reset --hard origin/branch2-Security-Account-Recovery
git pull origin branch2-Security-Account-Recovery
```

---

## 🚀 3. Starting the Test Server

1. Double-click [**`start_lan_server.bat`**](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/start_lan_server.bat).
2. Open Google Chrome $\to$ **`http://localhost:8000`** (or your Wi-Fi LAN IP address).

### 🔑 Test Accounts by Role:
| Role | Email | Password | Primary Responsibility |
| :--- | :--- | :--- | :--- |
| **Owner** | `owner@hontech.com` | `owner123` | Master Analytics, Financial Audits, User Security |
| **Administrator** | `admin.marikina@hontech.com` | `admin123` | Staff Management, Bay Config, Report Exports |
| **Service Advisor 1** | `sa.marikina1@hontech.com` | `sa123` | Customer Intake, Back-Job Routing, Bay Dispatch |
| **Service Advisor 2** | `sa.marikina2@hontech.com` | `sa123` | Multi-Advisor Queue Handling, Status Updates |
| **Assistant Staff** | `assistant.marikina@hontech.com` | `assistant123` | Online Booking Inquiries, Customer Search Menu |

---

## 🧪 4. Role-Based Unit Test Scenarios (Step-by-Step)

---

### 📋 Scenario A: Service Advisor (SA) Testing
**Goal:** Verify vehicle intake, customer history lookup, regular return visits, and warranty back-jobs.

| Test ID | Action to Perform | Expected Output | Status |
| :--- | :--- | :--- | :--- |
| **SA-01** | Log in as `sa.marikina1@hontech.com`. Click **Vehicle Intake**. | Form loads with date, plate, name, phone, vehicle, category dropdown, and arrival time. | `[ ] PASS / FAIL` |
| **SA-02** | Submit an intake with **blank plate or name**. | Red toast appears: *"Plate and Name are required."* (No crash). | `[ ] PASS / FAIL` |
| **SA-03** | Submit a valid intake (`ABC 1234`, `Juan Dela Cruz`, `Honda Civic`, `PMS`). | Green toast appears: *"ABC 1234 added successfully."* Vehicle appears in Daily Intakes table. | `[ ] PASS / FAIL` |
| **SA-04** | Try to submit the **exact same plate (`ABC 1234`) again immediately**. | System displays: *"⚠️ DUPLICATE INTAKE DETECTED!"* alert prompt. | `[ ] PASS / FAIL` |
| **SA-05** | Open **Customer Lookup** tab. Type `Juan` or `ABC 1234`. | Customer record appears with `⭐ Returning Regular` badge, lifetime visits count, and historical timeline. | `[ ] PASS / FAIL` |
| **SA-06** | Click **`[ 🚗 Regular Visit (PMS) ]`**. | Redirects to Intake Form with Name, Plate, Phone, and Model **pre-filled**. Category defaults to `PMS`. | `[ ] PASS / FAIL` |
| **SA-07** | Click **`[ 🔁 Back-Job (Warranty) ]`**. | Redirects to Intake Form with data pre-filled, category set to `Back-Job / Warranty Return`, and previous Job ID attached. | `[ ] PASS / FAIL` |

---

### 📋 Scenario B: Assistant Staff Testing
**Goal:** Verify online booking queue and the fast popup search menu.

| Test ID | Action to Perform | Expected Output | Status |
| :--- | :--- | :--- | :--- |
| **AS-01** | Log in as `assistant.marikina@hontech.com`. | Dashboard loads with **Pending Online Inquiries** table. | `[ ] PASS / FAIL` |
| **AS-02** | On Daily Intakes header, click **`[ 🔍 Search Customer / Back-Job ]`**. | Popup search menu appears (`#modal-customer-search-menu`). | `[ ] PASS / FAIL` |
| **AS-03** | Type a customer name. Select the customer from autocomplete. | Detail card appears with question: *"Back-Job (Warranty Return) ba ito?"*. | `[ ] PASS / FAIL` |
| **AS-04** | Click **`[ ❌ NO (Stay Here) ]`**. | System remains on the search popup without altering records. | `[ ] PASS / FAIL` |
| **AS-05** | Click **`[ ✅ YES (Daily Intakes) ]`**. | Modal closes and switches to Intake with Back-Job data pre-filled! | `[ ] PASS / FAIL` |

---

### 📋 Scenario C: Administrator & Owner Testing
**Goal:** Verify multi-branch data isolation, financial report exports, and security controls.

| Test ID | Action to Perform | Expected Output | Status |
| :--- | :--- | :--- | :--- |
| **ADM-01** | Log in as `admin.marikina@hontech.com`. Open **Analytics & Reports**. | Revenue charts, completed job logs, and SA breakdown render cleanly. | `[ ] PASS / FAIL` |
| **ADM-02** | Click **`Export Official PDF Report`**. | PDF opens in print preview with HonTech logo, timestamp, and metadata. | `[ ] PASS / FAIL` |
| **ADM-03** | Open **Staff Accounts Management**. Click **Add Staff**. | Creates new staff member and displays generated credentials. | `[ ] PASS / FAIL` |
| **ADM-04** | Switch between branch filters (**Marikina** vs **Quezon City**). | Table updates to only show vehicles belonging to that specific branch site. | `[ ] PASS / FAIL` |

---

### 📋 Scenario D: Offline LAN Resilience Testing (Crucial!)
**Goal:** Ensure the system never crashes when the internet drops.

| Test ID | Action to Perform | Expected Output | Status |
| :--- | :--- | :--- | :--- |
| **OFF-01** | Disconnect your laptop from Wi-Fi/Internet completely (Airplane Mode). | Entire workshop continues running locally on `http://localhost:8000`. | `[ ] PASS / FAIL` |
| **OFF-02** | Refresh the browser (`F5` or `Ctrl+R`) while disconnected. | Page reloads cleanly with all styling intact—**ZERO unstyled raw text leaks**! | `[ ] PASS / FAIL` |

---

## 🐛 5. How to Report a Bug on GitHub (Step-by-Step)

If you find something broken or visual glitch during testing, log it on GitHub so the lead developer can fix it:

### Step 1: Open GitHub Issues
Go to: [`https://github.com/Justin-stack101/Hontech_Main_Active_Development_PHP_SQL/issues`](https://github.com/Justin-stack101/Hontech_Main_Active_Development_PHP_SQL/issues)  
Click **`New Issue`**.

### Step 2: Fill out the Standard Bug Report Template:

```markdown
### 🐛 Bug Summary
[Short 1-sentence description of the issue]

### 👤 Role & Screen
- Role Tested: [Owner / Admin / Service Advisor / Assistant]
- Screen / Module: [e.g. Customer Lookup / Daily Intakes / Bay Allocation]

### 🔁 Steps to Reproduce
1. Log in as `sa.marikina1@hontech.com`.
2. Click on "Customer Lookup".
3. Search for "ABC 1234".
4. Click on [Action Button].

### ❌ What Happened (Actual Behavior)
[Describe what went wrong or attach screenshot]

### ✅ What Should Happen (Expected Behavior)
[Describe what you expected to see]
```

---

## 🛡️ 6. What to Do If a Developer Exception Appears
If an unhandled JavaScript error occurs, HonTech displays the high-contrast **Developer Exception Diagnostic Overlay**:
1. Click **`[ Copy Diagnostic Trace ]`** or **`[ Export Crash Log (.txt) ]`**.
2. Paste the trace into your GitHub Issue report.
3. The lead programmer will have the exact line number and variable name to fix it in minutes!
