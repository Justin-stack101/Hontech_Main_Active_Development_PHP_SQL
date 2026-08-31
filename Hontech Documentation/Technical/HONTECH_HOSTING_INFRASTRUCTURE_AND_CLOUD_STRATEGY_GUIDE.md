# HonTech Hosting Infrastructure & Cloud Strategy Guide
**Document Version:** 1.0.0  
**Project:** HonTech AutoCenter Management System  
**Branch:** `branch2-Security-Account-Recovery`  
**Classification:** Technical Architecture & Decision-Making Framework  

---

## 1. Executive Summary & Philosophy

In modern software engineering, **technology stack selection is strictly driven by client operational needs, budget constraints, and risk management**.

This document outlines the comparative architectural analysis, cost models, and deployment roadmaps for four hosting models:
1. **Local On-Premises & LAN Server (XAMPP + LocalTunnel)**
2. **Amazon Web Services (AWS - EC2 / Lightsail)**
3. **Vercel (Serverless Edge Frontend Platform)**
4. **Supabase (Open-Source PostgreSQL & Realtime Backend)**

---

## 2. Comprehensive Technology Comparison Matrix

```
┌────────────────────────────┬─────────────────────────┬─────────────────────────┬─────────────────────────┬─────────────────────────┐
│ Feature / Dimension        │ Local Server (XAMPP)    │ AWS (Lightsail / EC2)   │ Vercel                  │ Supabase                │
├────────────────────────────┼─────────────────────────┼─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ **Classification**         │ On-Premises / LAN       │ Cloud IaaS / PaaS       │ Serverless Frontend PaaS│ Serverless BaaS (DB)    │
│ **Underlying Engine**      │ Apache + MariaDB        │ Linux VM + LAMP Stack   │ AWS Lambda / Edge CDN   │ Managed PostgreSQL      │
│ **PHP / MySQL Support**    │ 🟢 Native (100% Match)  │ 🟢 Native (100% Match)  │ 🔴 No Native PHP Runtime│ 🔴 PostgreSQL (Not MySQL)│
│ **Real-Time WebSockets**   │ 🟡 Polling / Local WS   │ 🟡 Custom Node/WS Daemon│ 🟡 Serverless Functions │ 🟢 Native Realtime WS   │
│ **Offline Operation**      │ 🟢 100% Offline Capable │ 🔴 Requires Internet    │ 🔴 Requires Internet    │ 🔴 Requires Internet    │
│ **Monthly Cost**           │ 🟢 ₱0.00 / month        │ 🟡 ₱200 - ₱1,500 / mo   │ 🟢 ₱0.00 (Hobby Free)   │ 🟢 ₱0.00 (500MB Free)   │
│ **Setup Complexity**       │ 🟢 Very Low (1-Click)   │ 🔴 High (VPC/Firewalls) │ 🟢 Zero Config (Git Push│ 🟢 Instant Web Console  │
│ **Current Code Fit**       │ 🟢 Immediate / Tested   │ 🟢 Immediate / Tested   │ 🟡 Requires JS Refactor │ 🟡 Requires API Refactor│
└────────────────────────────┴─────────────────────────┴─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

---

## 3. Deep Dive into Each Option

### 🏢 3.1. Local On-Premises & LAN Server (Current Primary Stack)

* **Architecture:** Apache HTTP Server + PHP 8.x + MySQL / MariaDB running locally on a dedicated shop computer or laptop.
* **Network Connectivity:**
  - Local Workshop Access: `http://192.168.x.x/Hontech` over local Wi-Fi.
  - Remote Panel / Client Access: Secure HTTPS tunnel via `node tunnel.js` or `ngrok`.
* **Advantages:**
  - **Zero Cost:** No recurring monthly hosting or database bills.
  - **Zero Downtime from ISP Outages:** Receptionists can still check in vehicles and technicians can still work even if the internet goes down.
  - **100% Code Compatibility:** Zero risk of deployment regressions.
* **Limitations:**
  - Physical machine must remain powered on during business hours.
  - Branch-to-branch data sharing requires centralized database replication.

---

### ☁️ 3.2. Amazon Web Services (AWS - EC2 & Lightsail)

* **Architecture:** Virtual private cloud servers hosted in AWS global data centers (Singapore / AP-Southeast-1).
* **AWS Broad Scope & Complexity:**
  - Standard AWS (EC2, VPC, RDS, IAM, Route53, Security Groups) is massive (200+ services) and steep for small business maintenance.
  - **AWS Lightsail** is the simplified alternative: provides a pre-packaged **LAMP stack instance** for a flat fee (~$3.50 to $5.00/month).
* **Advantages:**
  - Runs your exact PHP + MySQL PDO codebase without modifying a single line of backend logic.
  - 99.99% cloud uptime and automatic snapshot backups.
* **Limitations:**
  - Requires recurring cloud budget.
  - Unmanaged EC2 instances require OS security patches and firewall maintenance.

---

### ⚡ 3.3. Vercel (Modern Frontend & Edge Platform)

* **Architecture:** Global Edge Content Delivery Network (CDN) optimized for modern JavaScript/TypeScript web applications.
* **Underlying Relationship with AWS:**
  - Vercel operates on top of AWS infrastructure (using AWS Lambda, S3, and CloudFront under the hood) with a developer-friendly continuous deployment layer.
* **Advantages:**
  - **Permanent Free Tier:** Free hosting with automated HTTPS/SSL.
  - **Git-Triggered Deployments:** Pushing to GitHub branch automatically updates the live website in ~30 seconds.
  - Blazing fast performance across global edge nodes.
* **Limitations for HonTech:**
  - Vercel is designed for Node.js / Next.js / Static web assets. Traditional PHP Apache scripts are not supported natively.
  - Adopting Vercel requires converting the PHP backend into serverless API functions or connecting directly to a cloud database.

---

### 🗄️ 3.4. Supabase (The Open-Source Firebase / PostgreSQL Alternative)

* **Architecture:** Managed Cloud PostgreSQL database with auto-generated REST APIs, Realtime WebSockets, and Authentication.
* **Advantages:**
  - **Generous Free Tier:** 500MB database storage, 50,000 monthly active users at $0 cost.
  - **Native Realtime Subscriptions:** When a Service Advisor registers a vehicle, the TV Bay Screen (`tv.html`) receives an instant WebSocket push without polling overhead.
  - Built-in SQL Editor, Row-Level Security (RLS), and automated daily backups.
* **Limitations for HonTech:**
  - Supabase uses **PostgreSQL**, whereas HonTech currently uses **MySQL PDO**.
  - Moving to Supabase requires migrating table structures and updating client data queries from PHP endpoints to the Supabase JS Client SDK.

---

## 4. Adaptive Engineering Strategy: Client-Driven Decision Framework

```
                          CLIENT DISCOVERY & DECISION TREE
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     [ CLIENT CHOOSES LOCAL HOSTING ]                [ CLIENT CHOOSES CLOUD (VERCEL+SUPABASE) ]
     ────────────────────────────────                ─────────────────────────────────────────
     • Target: Single branch workshop                • Target: Multi-branch cloud accessible
     • Budget: ₱0.00 / month                         • Budget: ₱0.00 / month (Free Tiers)
     • Stack: Local XAMPP (PHP + MySQL)              • Stack: Vercel (Frontend) + Supabase (Postgres)
     • Status: 100% Ready & Tested                   • Status: Execute Disciplined Migration Plan
```

---

## 5. Migration & Refactoring Roadmap (If Cloud Stack is Selected)

If the client selects the Vercel + Supabase cloud deployment, the development team follows a **disciplined 5-stage migration**:

1. **Stage 1: Branch Isolation & Safety**
   - Preserve `branch2-Security-Account-Recovery` as the permanent stable local release.
   - Spawn a dedicated feature branch: `git checkout -b feature/vercel-supabase-migration`.
2. **Stage 2: Database Schema Mapping (MySQL -> PostgreSQL)**
   - Translate `database.sql` MySQL syntax (`AUTO_INCREMENT`, `TINYINT(1)`) to PostgreSQL standards (`BIGSERIAL`, `BOOLEAN`, `UUID`).
3. **Stage 3: Data Access Layer Refactor**
   - Replace PHP `apiRequest('/api/jobs', ...)` with Supabase JavaScript client queries (`supabase.from('jobs').select('*')`).
   - Implement Supabase Realtime channel listeners for the TV Bay Screen (`tv.html`).
4. **Stage 4: Automated & Unit Testing Matrix**
   - Execute QA role testing across all 4 personas: **Owner**, **Admin**, **Service Advisor**, **Assistant Desk**.
   - Verify bay capacity clamping (Admin bay limit vs SA dropdown options).
5. **Stage 5: Continuous Deployment & Custom Domain**
   - Connect GitHub repository to Vercel.
   - Configure environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) securely in the Vercel dashboard.

---

## 6. Document Metadata & Approval

| Attribute | Details |
| :--- | :--- |
| **Author** | HonTech Lead Software Engineering & Capstone Practicum Team |
| **Institution** | STI College Marikina (BSIT Practicum & Capstone Defense) |
| **Target Client** | HonTech AutoCenter Management |
| **Status** | Active Technical Reference |
