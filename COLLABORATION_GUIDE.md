# 🤝 HonTech Team Collaboration Guide: GitHub & Antigravity IDE Workflow
## Simple Step-by-Step Team Guide for Lead Programmer, QA & Groupmates

```text
========================================================================================================
PROJECT:               HonTech AutoCenter Operations & Management System
ACTIVE BRANCH:         branch2-Security-Account-Recovery
TOOLS:                 GitHub, Google Antigravity IDE / VS Code, XAMPP (PHP 8 + MySQL)
TARGET AUDIENCE:       Lead Developer (Justin), QA Testers, Non-Coder Groupmates
CLASSIFICATION:        Team Standard Operating Procedure (SOP)
========================================================================================================
```

---

## 📌 Overview: How Our Team Works Together
* **Lead Programmer (You):** Builds features, solves backend routing (`router.php`), writes SQL PDO queries, and pushes tested code to GitHub.
* **QA / Groupmates:** Pulls the latest code, tests assigned user roles (**Admin, Service Advisor, Assistant, Cashier**), verifies multi-device local Wi-Fi pairing on phones/laptops, and reports bugs.

---

## 🛠️ Step 1: Initial Setup for Groupmates (One-Time Setup)

Every groupmate needs only **2 free tools** on their laptop:
1. **Git for Windows:** Download from [git-scm.com/downloads](https://git-scm.com/downloads) (Click Next $\to$ Next $\to$ Finish).
2. **XAMPP (PHP 8.2 + MySQL):** Download from [apachefriends.org](https://www.apachefriends.org).

### Groupmate Clone Step:
Open **Command Prompt / PowerShell** and run:
```bash
# 1. Navigate to XAMPP htdocs folder
cd C:\xampp\htdocs

# 2. Clone the official active development branch
git clone -b branch2-Security-Account-Recovery https://github.com/Justin-stack101/CapstoneOfficial2_Development.git
```

---

## 🚀 Step 2: The Daily 3-Step Work Loop (Super Simple!)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             DAILY GITHUB & ANTIGRAVITY WORKFLOW                                  │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. 📥 MORNING: Groupmates pull latest updates (`git pull origin branch2-...`)                    │
│ 2. 💻 DAYTIME: Programmer codes in Antigravity; Groupmates run & test roles on Wi-Fi             │
│ 3. 📤 EVENING: Programmer commits & pushes (`git commit -m "..." && git push`)                   │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 👨‍💻 For the Lead Programmer (Using Antigravity IDE):
1. Open your project folder in **Antigravity IDE**.
2. Make your code improvements or revisions.
3. When ready to share with the team, open the Antigravity Terminal and run:
   ```bash
   git add .
   git commit -m "feat: completed service advisor bay allocation and claim stub printing"
   git push origin branch2-Security-Account-Recovery
   ```

### 👩‍💻 For QA / Groupmates (Testing on Their Laptops):
1. Open Terminal / Command Prompt and run:
   ```bash
   git pull origin branch2-Security-Account-Recovery
   ```
2. Double-click [`start_lan_server.bat`](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/start_lan_server.bat).
3. Open Google Chrome $\to$ `http://localhost:8000`.
4. Log into your assigned test account:
   * **Owner:** `owner@hontech.com` / `owner123`
   * **Admin:** `admin.marikina@hontech.com` / `admin123`
   * **Assistant:** `assistant.marikina@hontech.com` / `assistant123`
   * **Service Advisor 1:** `sa.marikina1@hontech.com` / `sa123`
   * **Service Advisor 2:** `sa.marikina2@hontech.com` / `sa123`

---

## 🧪 Step 3: Multi-Device Wi-Fi Testing Procedure

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               MULTI-DEVICE WI-FI TESTING WORKFLOW                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Lead Programmer starts server: `start_lan_server.bat` (Displays IP, e.g., 192.168.1.100).     │
│ 2. Groupmate 1 (Laptop): Opens `http://192.168.1.100:8000` as Service Advisor 1.                 │
│ 3. Groupmate 2 (Laptop): Opens `http://192.168.1.100:8000` as Service Advisor 2.                 │
│ 4. Groupmate 3 (Phone): Scans QR Code on screen $\to$ acts as Reception Assistant.              │
│ 5. Groupmate 4 (TV Monitor / External Screen): Opens `http://192.168.1.100:8000` in F11 mode.   │
│ 6. Action: SAs submit intakes simultaneously $\to$ Verify TV updates instantly!                 │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Step 4: What if Someone Encounters a Git Conflict?

If a groupmate accidentally modified a local file and `git pull` shows an error, run this 1-line reset:
```bash
git reset --hard origin/branch2-Security-Account-Recovery
git pull origin branch2-Security-Account-Recovery
```
*This instantly restores their computer to match the clean master version without breaking anything!*

---

*Maintained by the HonTech Development Team*
