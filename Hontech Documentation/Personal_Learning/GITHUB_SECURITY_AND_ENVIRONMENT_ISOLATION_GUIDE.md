# 🛡️ GitHub Security, Environment Isolation & Repository Management Guide

> **Author**: Justin Nolasco (HonTech AutoCenter Capstone Lead)  
> **Topic**: Secret Management, Public vs. Private Repositories, Database Storage Isolation, and Git Portfolio Strategies  
> **Target Audience**: Student Developers, Software Engineers, and Capstone Project Teams

---

## 📌 1. Executive Summary: Why Your Code is Safe on GitHub

A common concern for software developers is:  
*"If my repository is public on GitHub, will people be able to access my database, see my passwords, or steal customer information?"*

**The Answer: NO, as long as industry-standard environment isolation is followed.**

In modern web development, there is a strict separation between:
1. **The Codebase (Logic & Blueprint)**: HTML, CSS, JavaScript, PHP classes, routes, and layout templates. This is what lives on GitHub.
2. **The Secrets (Credentials & Keys)**: Database passwords, JWT secret keys, and API tokens. These live **only** in your local `.env` file on your computer and are blocked from Git.
3. **The Data (Records & Tables)**: Customer records, job history, and user passwords. These live **only** inside your local MySQL server on your computer hard drive (`C:\xampp\mysql\data\`).

---

## 🏗️ 2. Where Sensitive Code & Data Actually Live

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      YOUR LOCAL COMPUTER (PHYSICAL DISK)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  📁 C:\xampp\mysql\data\hontech\         📁 .env (LOCAL CONFIG)             │
│  • Actual customer accounts               • DB_USER=root                    │
│  • Real password hashes                   • DB_PASS=secret123               │
│  • Real intake transactions               • JWT_SECRET=random_key           │
│  (NEVER TOUCHES GITHUB)                   (BLOCKED BY .gitignore)           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                    ❌ .gitignore BLOCKS SENSITIVE FILES
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   PUBLIC GITHUB REPOSITORY (CODE ONLY)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  📄 frontend/js/app.js                   📄 backend/seed.php                │
│  • TV Monitor slide logic                • Mock test names ("Carlos Yulo")  │
│  • Workshop Bay grid math                • Zero real customer PII           │
│                                                                             │
│  📄 .env.example                         📄 database.sql                    │
│  • Empty template placeholders           • Empty table structures (DDL)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Breakdown by Component:

| Component | Location | Pushed to GitHub? | Why It Is Safe |
| :--- | :--- | :---: | :--- |
| **Real Database Data** | `C:\xampp\mysql\data\` | ❌ **NEVER** | MySQL binary data files live entirely inside your XAMPP folder. Git cannot see or upload them. |
| **Local Passwords & Keys** | Local `.env` file | ❌ **NEVER** | The `.gitignore` file explicitly instructs Git to ignore `.env`. |
| **Database Schema (`database.sql`)** | Project root | ✅ **YES** | Only contains table definitions (`CREATE TABLE`). It contains zero customer data. |
| **Sample Data (`backend/seed.php`)** | `backend/seed.php` | ✅ **YES** | Only contains fictional test records (*"Carlos Yulo"*, *"Maria Clara"*, *"Bob Jones"*) for demonstration. |
| **Environment Template (`.env.example`)** | Project root | ✅ **YES** | Contains only blank variable names so other developers know what keys are needed without seeing your actual passwords. |

---

## 🔒 3. Public vs. Private Repository Strategy

### Option A: Keeping the Repository **PUBLIC** (Recommended for School & Portfolio)
* **Best For**: Capstone defense, grading by professors, technical interviews, and resume building.
* **Why It Works**: Evaluators can browse your code, read the documentation manuals, and verify your software architecture directly.
* **Security Status**: **100% Safe**. Because `.env` is ignored and mock seed data is used, you can leave it public without exposing any private data.

---

### Option B: Setting the Repository to **PRIVATE** (For Commercial Client Delivery)
* **Best For**: Deploying the system to the real business owner for live daily operations.
* **How to Keep Your Green Activity Squares Active**:
  1. Go to your public profile: 👉 `https://github.com/Justin-stack101`
  2. Click **"Contribution settings"** (above the green activity graph).
  3. Check the box: **"Include private contributions"**.
* **What Visitors See**: Visitors see that you made active contributions (e.g. *"50 contributions on Aug 23"*), but GitHub hides the private repository name and code.

---

## 🛠️ 4. Development Sandbox vs. Client Production Version

### Why We Maintain Two Separate Branches:

```
[branch2-Security-Account-Recovery] ──► Active Developer Sandbox (Testing, Mock Auth, Quick Login)
               │
               ▼ (Approved, Tested & Merged)
[main] ───────────────────────────────► Stable Client Release (Hardened, Production-Ready)
```

1. **`branch2-Security-Account-Recovery` (Sandbox)**:
   * Contains the collapsible **Developer Toolbox**, 1-Click test logins, and simulated dev mailboxes.
   * Allows rapid testing of new features (like TV slide scaling and Marikina Main Branch branding) without risking the production code.
2. **`main` (Production Client Release)**:
   * Holds the clean, stable, battle-tested version.
   * When deployed for the client, `APP_ENV=production` hides all testing tools and developer helper drawers.

---

## 🔑 5. Mock Google OAuth vs. Real Google Cloud API

| Feature | 🛠️ Local Development / Testing Mode | 🏢 Client Production Mode |
| :--- | :--- | :--- |
| **Environment** | Localhost / LAN (`192.168.1.5:8000`) | Live Domain (`https://portal.hontech-autocenter.com`) |
| **Google Sign-In** | **Simulated Mock OAuth**: 1-click test button that simulates Google login instantly without requiring Google Cloud keys. | **Real Google Cloud OAuth API**: Connects to Google servers using official `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. |
| **Password Reset** | **Simulated Dev Mailbox**: Reset tokens appear in a slide-out drawer on screen for instant testing. | **Real SMTP Mailer**: Sends live emails via Google Workspace or SendGrid to real customer inboxes. |

---

## 🆘 6. Quick Recovery & Re-Seeding Cheatsheet

If you ever need to reset or restore your local environment:

```powershell
# 1. Reset code to latest verified GitHub checkpoint:
git fetch origin branch2-Security-Account-Recovery
git reset --hard origin/branch2-Security-Account-Recovery

# 2. Re-seed local MySQL database with clean Marikina Main Branch test data:
php backend/seed.php

# 3. Start local PHP server on LAN for Wi-Fi testing:
.\start_lan_server.bat
# (OR run: php -S 0.0.0.0:8000 router.php)
```

---

## 📑 7. Summary of Key Learnings

1. **Code is Public, Secrets are Local**: Never push `.env` to Git; always push `.env.example`.
2. **Database Data Stays on Disk**: MySQL tables inside XAMPP never upload to GitHub.
3. **Green Squares are Always Preserved**: Whether your repo is public or private (with private contributions enabled), all your hard work is permanently recorded and credited to your GitHub profile! 🚀
