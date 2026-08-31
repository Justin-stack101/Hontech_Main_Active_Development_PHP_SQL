# ☁️ HonTech Hosting Infrastructure & Cloud Strategy Guide
**Document Version:** `1.0.0`  
**Project:** HonTech AutoCenter Operations System  
**Branch:** `branch2-Security-Account-Recovery`  
**Classification:** Technical Architecture & Decision-Making Framework  

---

## 1. 📌 Executive Summary & Philosophy

In professional software engineering, **technology stack selection is strictly driven by client operational needs, budget constraints, and risk management**.

This document provides a clear, side-by-side architectural and financial comparison of four hosting options:
1. **Local On-Premises & LAN Server (XAMPP + LocalTunnel)**
2. **Amazon Web Services (AWS - EC2 / Lightsail)**
3. **Vercel (Serverless Edge Frontend Platform)**
4. **Supabase (Managed PostgreSQL & Realtime Backend)**

---

## 2. 📊 Comprehensive Technology Comparison Matrix

| Feature / Dimension | 🏢 Local Server (XAMPP) | ☁️ AWS (Lightsail / EC2) | ⚡ Vercel | 🗄️ Supabase |
| :--- | :--- | :--- | :--- | :--- |
| **Hosting Classification** | On-Premises / Local Area Network | Cloud Infrastructure (IaaS / PaaS) | Serverless Frontend (PaaS) | Serverless Database (BaaS) |
| **Underlying Engine** | Apache HTTP + MariaDB | Linux VM + Pre-installed LAMP | AWS Lambda + Global Edge CDN | Managed Cloud PostgreSQL |
| **PHP & MySQL Support** | 🟢 **100% Native Match** | 🟢 **100% Native Match** | 🔴 **No Native PHP Support** | 🔴 **PostgreSQL (Not MySQL)** |
| **Real-Time TV Telemetry** | 🟡 Polling / Local WebSockets | 🟡 Custom Node / WS Daemon | 🟡 Serverless Edge Functions | 🟢 **Native Realtime WebSockets** |
| **Offline Capability** | 🟢 **100% Offline Resilient** | 🔴 Requires Internet | 🔴 Requires Internet | 🔴 Requires Internet |
| **Monthly Operating Cost** | 🟢 **₱0.00 / month** | 🟡 ₱200 – ₱1,500 / month | 🟢 **₱0.00 (Hobby Free Tier)** | 🟢 **₱0.00 (500MB Free Tier)** |
| **Configuration Setup** | 🟢 Very Low (1-Click Run) | 🔴 High (VPC, Security Groups) | 🟢 Zero-Config (Git Push Deploy) | 🟢 Instant Web Console |
| **Current Codebase Fit** | 🟢 **Immediate (Tested & Ready)**| 🟢 **Immediate (Tested & Ready)**| 🟡 Requires JavaScript Refactor | 🟡 Requires API & Schema Refactor |

---

## 3. 🔍 Deep Dive: The 4 Hosting Options

### 🏢 3.1. Local On-Premises & LAN Server *(Current Primary Stack)*

* **Technical Architecture:**  
  Apache HTTP Server + PHP 8.x + MySQL (PDO) running directly on a shop laptop or desktop at the Marikina branch.
* **Network Connectivity:**  
  - **Inside the Workshop:** Staff devices connect to `http://192.168.x.x/Hontech` over local Wi-Fi.
  - **Remote Panelists / Client Access:** Instant public HTTPS link via `node tunnel.js` (LocalTunnel).
* **Key Advantages:**  
  - **₱0.00 Cost:** Zero cloud subscription or database fees.
  - **100% Offline Resilient:** Front desk staff can encode work orders and technicians can work even if the internet goes down.
  - **Zero Deployment Risk:** 100% tested with current codebase.
* **Limitations:**  
  - Host computer must remain powered on during operating hours.

---

### ☁️ 3.2. Amazon Web Services *(AWS - EC2 & Lightsail)*

* **Technical Architecture:**  
  Virtual private cloud servers hosted in AWS global data centers (e.g. Singapore region).
* **Scope & Considerations:**  
  - Standard AWS (EC2, VPC, RDS, IAM, Route53) has over 200+ services and high setup complexity.
  - **AWS Lightsail** is the simplified alternative: provides a pre-configured **LAMP Stack** (Linux + Apache + MySQL + PHP) for a flat ~$3.50/month fee.
* **Key Advantages:**  
  - Runs your exact PHP + MySQL code without rewriting a single line.
  - 99.99% enterprise cloud uptime and automatic snapshot backups.
* **Limitations:**  
  - Requires recurring cloud budget.
  - Requires internet access for all workshop operations.

---

### ⚡ 3.3. Vercel *(Modern Serverless Edge Platform)*

* **Technical Architecture:**  
  Global Edge Content Delivery Network (CDN) optimized for modern frontend web applications.
* **Relationship with AWS:**  
  - Vercel actually runs on top of AWS infrastructure (AWS Lambda, S3, CloudFront) with a streamlined user interface.
* **Key Advantages:**  
  - **Permanent Free Tier:** $0/month with automated SSL certificates and custom domains.
  - **Git-Triggered Deployments:** Pushing to GitHub automatically updates the live website in ~30 seconds.
* **Limitations for HonTech:**  
  - Vercel is designed for Node.js / React / Next.js / Static assets. Traditional PHP Apache servers are not natively supported.

---

### 🗄️ 3.4. Supabase *(Open-Source Cloud PostgreSQL & Realtime Backend)*

* **Technical Architecture:**  
  Managed Cloud PostgreSQL database with auto-generated REST APIs, Auth, and Realtime WebSockets.
* **Key Advantages:**  
  - **Generous Free Tier:** 500MB database storage, 50,000 active users for $0/month.
  - **Native WebSockets:** Instant millisecond TV Bay screen updates when a vehicle status changes.
  - Built-in SQL Editor, Row-Level Security (RLS), and automated daily backups.
* **Limitations for HonTech:**  
  - Uses **PostgreSQL**, whereas HonTech currently uses **MySQL PDO**.
  - Requires refactoring PHP backend endpoints into direct Supabase JavaScript SDK calls.

---

## 4. 🧭 Adaptive Engineering Decision Matrix

```
                      CLIENT REQUIREMENTS & DISCOVERY
                                     │
            ┌────────────────────────┴────────────────────────┐
            ▼                                                 ▼
[ CLIENT CHOOSES LOCAL HOSTING ]                  [ CLIENT CHOOSES CLOUD HOSTING ]
────────────────────────────────                  ────────────────────────────────
• Single-branch workshop focus                    • Multi-branch cloud access needed
• ₱0.00 / month operating budget                  • ₱0.00 / month (Free Tier Target)
• Stack: Local XAMPP (PHP + MySQL)                • Stack: Vercel + Supabase (Postgres)
• Status: 100% Tested & Ready Today               • Status: Execute Disciplined Migration
```

---

## 5. 🛡️ 5-Stage Migration Roadmap *(If Cloud Stack is Selected)*

If the client explicitly approves the cloud migration, the team executes the following disciplined engineering workflow:

1. **Stage 1: Safety & Branch Protection**  
   Preserve `branch2-Security-Account-Recovery` as the stable backup and spawn a dedicated feature branch:
   ```bash
   git checkout -b feature/vercel-supabase-migration
   ```
2. **Stage 2: Database Schema Translation**  
   Convert MySQL schema (`database.sql`) to PostgreSQL standards (`BIGSERIAL`, `BOOLEAN`, `UUID`).
3. **Stage 3: Data Access Layer Refactoring**  
   Replace PHP `apiRequest('/api/jobs')` endpoints with direct Supabase JS Client calls (`supabase.from('jobs').select('*')`).
4. **Stage 4: Automated & Role-Based QA Testing**  
   Run full end-to-end verification across all 4 roles (**Owner**, **Admin**, **Service Advisor**, **Assistant Desk**) plus the **TV Bay Queue Screen**.
5. **Stage 5: Production Deployment & Monitoring**  
   Connect GitHub repository to Vercel and configure secure environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).

---

## 6. 📋 Document Approval & Metadata

| Attribute | Specification |
| :--- | :--- |
| **Authors** | Lead Software Engineering & Practicum Team |
| **Institution** | STI College Marikina (BSIT Capstone Practicum) |
| **Industry Partner** | HonTech AutoCenter Management |
| **Repository** | `Hontech_Main_Active_Development_PHP_SQL` |
| **Active Branch** | `branch2-Security-Account-Recovery` |
| **Status** | Approved Technical Architecture Reference |
