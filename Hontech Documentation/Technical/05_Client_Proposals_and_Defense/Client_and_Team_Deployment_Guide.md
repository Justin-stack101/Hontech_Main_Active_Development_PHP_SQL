# 🗣️ Client Presentation & Development Team Deployment Guide
## HONTECH AutoCenter Operations & Queue Management System

> [!NOTE]
> Use this guide when presenting the system deployment strategy to your **Client** and aligning workflow responsibilities with your **Development Team / Groupmates**.

---

## 👔 PART 1: Presentation Script for the CLIENT

> **Goal**: Reassure the client that the system requires **₱0 monthly fees**, zero paperwork, and works 100% reliably inside their shop.

### 📢 Client Presentation Script:

> *"Mr. Client, we have designed the HonTech System to give you maximum operational power with zero financial burden or administrative paperwork.*
>
> *We offer **2 deployment paths** depending on your business preference:*
>
> #### 1. On-Site Local Shop Server (Recommended Launch Option — ₱0 Monthly Fees)
> - **How it works**: The system runs directly on a computer inside your physical shop, connected to your local shop Wi-Fi network.
> - **Who uses it**: Your Front Desk Staff, Service Advisors (on tablets/phones), and Waiting Room TV Monitors all connect seamlessly over your local shop Wi-Fi.
> - **Monthly Cost**: **₱0 (100% FREE)**. No monthly subscriptions, no domain registration fees, and zero internet paperwork required.
> - **Offline Reliability**: Even if the shop loses internet connection, the system remains **100% operational** over your local Wi-Fi.
> - **Hardware**: Uses hardware you already own in the shop.
>
> #### 2. International Public Cloud Website (Optional Future Upgrade)
> - **How it works**: If you ever decide in the future that you want customers outside the shop to access the website 24/7 on a custom `.com` or `.ph` domain (e.g., `hontech.ph`).
> - **Monthly Cost**: You only pay the domain registration (~₱500/year) and cloud host (~₱300/month) if you choose to upgrade later.
>
> *For our launch and Capstone presentation, we recommend starting with **Option 1 (₱0 Local Shop Server)** so you get full digital operations with zero recurring expenses!"*

---

## 💻 PART 2: Technical Alignment Guide for your DEVELOPMENT TEAM / GROUPMATES

> **Goal**: Explain how local hosting, database isolation, ports, and git branches work to your team so everyone is on the same page.

### 🛠️ Key Technical Principles for Teammates:

1. **How Local Dual-Hosting Works**:
   - Our laptop acts as a **dual local web server host**:
     - **Port `8001` (`http://127.0.0.1:8001`)**: Runs the **Client Review Baseline (`main`)**.
     - **Port `8000` (`http://127.0.0.1:8000`)**: Runs the **Active Exploration Branch (`branch2`)**.
   - This allows us to compare the baseline against new features side-by-side in real time!

2. **Database Isolation in XAMPP MariaDB**:
   - **Port 8001 (`main`)** connects to database **`hontech_main`**.
   - **Port 8000 (`branch2`)** connects to database **`hontech`**.
   - **Why this matters**: Testing new features or resetting test data on `branch2` will **NEVER corrupt or pollute** the client's baseline data on `main`!

3. **Git Branching Strategy (`main` Protection)**:
   - **`main`** is frozen as the stable client review baseline. We do **NOT** push to `main` until the client reviews and officially approves.
   - All active exploration, Capstone features, and UI enhancements are committed exclusively to feature branches (`branch2-Security-Account-Recovery`).

4. **Why a Paid Domain is NOT Required for Development**:
   - Classmates often assume you must buy a `.com` domain immediately. Clarify to the team that **local PHP dev servers (`php -S 127.0.0.1:8000`) and LAN IP routing (`http://192.168.x.x:8000`)** provide 100% of the functionality needed for shop operations and Capstone defense for **₱0**.
