# 🚗 HonTech AutoCenter: Local Domain & Google API Security Blueprint
### 📋 Executive Strategy, Implementation Checklist, Budget Breakdown & Panel Defense

```
PROJECT:       HonTech AutoCenter Management System (Branch 2: Security & Recovery)
TARGETS:       HonTech General Manager (Client), Capstone Panelists, IT Group Members
CORE THEMES:   On-Premises Local Network (LAN) & Google OAuth 2.0 Cloud Security
UPDATED:       August 2026 | Version 2.1 (Production Ready)
```

---

## 📌 Quick Navigation Map
* [📊 1. Executive Summary (For the Client / General Manager)](#-1-executive-summary-for-the-client--general-manager)
* [💰 2. Budget & Hardware Investment Tiers (PHP)](#-2-budget--hardware-investment-tiers-php)
* [🌐 3. System & Network Topology Diagram](#-3-system--network-topology-diagram)
* [🛠️ 4. Group Implementation Checklist (5 Practical Steps)](#️-4-group-implementation-checklist-5-practical-steps)
* [🔐 5. Google API OAuth 2.0 Authentication Flow](#-5-google-api-oauth-20-authentication-flow)
* [🧪 6. Quality Assurance & Testing Matrix](#-6-quality-assurance--testing-matrix)
* [🎓 7. Capstone Defense & Panel Q&A Cheat Sheet](#-7-capstone-defense--panel-qa-cheat-sheet)

---

## 📊 1. Executive Summary (For the Client / General Manager)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       WHY THIS MATTERS                                          │
├────────────────────────────────────────────────┬────────────────────────────────────────────────┤
│ 1. ZERO DOWNTIME GUARANTEE                     │ 2. DATA PRIVACY LAW COMPLIANCE                 │
│ If the internet fails, workshop intake, bay    │ Customer phone numbers and repair histories    │
│ allocations, and TV monitors continue working  │ are kept on-premise, fully protected under the │
│ at 100% speed on the local shop network.       │ Philippine Data Privacy Act of 2012 (RA 10173).│
├────────────────────────────────────────────────┼────────────────────────────────────────────────┤
│ 3. ENTERPRISE LOGIN SECURITY                   │ 4. ZERO RECURRING SOFTWARE FEES                │
│ Staff log in using verified Google accounts    │ Google Identity OAuth 2.0 is 100% free for up  │
│ with Multi-Factor Authentication (2FA), so no  │ to 50,000 monthly active users (₱0.00/month in │
│ raw passwords can ever be leaked or stolen.    │ recurring API subscription costs).             │
└────────────────────────────────────────────────┴────────────────────────────────────────────────┘
```

---

## 💰 2. Budget & Hardware Investment Tiers (PHP)

| Investment Component | Tier 1: Prototype / Academic | Tier 2: Business Grade *(Recommended)* | Tier 3: Enterprise Multi-Branch |
| :--- | :--- | :--- | :--- |
| **Server Machine** | Existing Shop Laptop — **₱0** | Dedicated Mini-PC (Core i5, 16GB, NVMe SSD) — **₱22,000** | Dual Redundant Tower Servers (RAID-1) — **₱55,000** |
| **Network Router** | Standard ISP Router — **₱0** | Gigabit Wi-Fi 6 Router (TP-Link AX55) — **₱4,500** | Managed Switch + 2x UniFi APs — **₱18,000** |
| **Power Protection** | Basic Surge Strip — **₱800** | 1000VA / 600W Line-Interactive UPS — **₱4,200** | 2000VA Smart-UPS with AVR — **₱12,500** |
| **Google Cloud API** | Google Identity Free Tier — **₱0** | Google Identity Free Tier (OAuth 2.0) — **₱0** | Google Identity Free Tier — **₱0** |
| **Domain & SSL** | Local mkcert CA — **₱0** | Local DNS Router Mapping (`hontech.local`) — **₱0** | Commercial Wildcard SSL — **₱3,500/yr** |
| **TOTAL INITIAL COST** | **₱800** | **₱30,700** *(Best Value)* | **₱89,000+** |

> **Recommendation**: **Tier 2 (₱30,700)** provides clean power protection during electrical fluctuations, dedicated 24/7 server hardware, and zero recurring monthly fees.

---

## 🌐 3. System & Network Topology Diagram

```
                                  [ INTERNET GATEWAY (ISP) ]
                                               │ (Only for Google OAuth & Time Sync)
                                               ▼
                              ┌─────────────────────────────────┐
                              │     GIGABIT WI-FI 6 ROUTER      │
                              │     IP: 192.168.1.1 (Gateway)   │
                              │     Local DNS: hontech.local    │
                              └────────────────┬────────────────┘
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               │ Wired Cat6 Ethernet           │ 5GHz Wi-Fi Network            │ HDMI / LAN
               ▼                               ▼                               ▼
     ┌───────────────────┐           ┌───────────────────┐           ┌───────────────────┐
     │  ON-PREM SERVER   │           │ SERVICE ADVISORS  │           │ TV SERVICE BAY    │
     │  192.168.1.100    │           │ & SHOP TABLETS    │           │ DISPLAY MONITOR   │
     │  (hontech.local)  │           │ (192.168.1.10-50) │           │ (192.168.1.80)    │
     │  • Apache (HTTP)  │           │ • Vehicle Intake  │           │ • Live Slide 1-3  │
     │  • PHP 8.2 API    │           │ • Bay Dispatch    │           │ • Audio Chimes    │
     │  • MariaDB SQL    │           │ • Release Records │           │ • Ready Banners   │
     └───────────────────┘           └───────────────────┘           └───────────────────┘
```

---

## 🛠️ 4. Group Implementation Checklist (5 Practical Steps)

### ✅ Step 1: Assign Fixed Server IP Address
On the host server machine, open **PowerShell (Administrator)**:
```powershell
# Set static IP 192.168.1.100 on the Ethernet adapter
New-NetIPAddress -InterfaceAlias "Ethernet" -IPAddress 192.168.1.100 -PrefixLength 24 -DefaultGateway 192.168.1.1
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses ("192.168.1.1", "8.8.8.8")
```

### ✅ Step 2: Configure Apache Virtual Host
Open `C:\xampp\apache\conf\extra\httpd-vhosts.conf` and paste:
```apache
<VirtualHost *:80>
    ServerAdmin admin@hontech.com
    DocumentRoot "C:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development"
    ServerName hontech.local
    ServerAlias 192.168.1.100

    <Directory "C:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### ✅ Step 3: Configure Local Domain Name Resolution
* **Best Method (Router DNS)**: Log into router (`192.168.1.1`) $\to$ **DNS Mapping** $\to$ Add `hontech.local` pointing to `192.168.1.100`.
* **Alternative (Direct IP)**: Any tablet or phone simply opens `http://192.168.1.100`.

### ✅ Step 4: Provision Google Cloud OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/) $\to$ Create Project **`HonTech-Auth`**.
2. Setup **OAuth Consent Screen** $\to$ User Type: **External** $\to$ App Name: **HonTech AutoCenter**.
3. Create **OAuth 2.0 Web Client ID**:
   * Authorized JavaScript Origins: `http://localhost`, `http://192.168.1.100`, `http://hontech.local`
   * Authorized Redirect URIs: `http://localhost/frontend/index.html`, `http://192.168.1.100/frontend/index.html`

### ✅ Step 5: Start Local Server Batch Script
Double-click `start_lan_server.bat` in the project root to automatically launch Apache and MariaDB.

---

## 🔐 5. Google API OAuth 2.0 Authentication Flow

```
1. STAFF CLICKS "SIGN IN WITH GOOGLE"
   └─► Browser opens secure Google consent window.

2. GOOGLE VERIFIES IDENTITY & 2FA
   └─► Google generates cryptographically signed ID Token (JWT).

3. FRONTEND SENDS JWT TO PHP BACKEND
   └─► POST /api/auth/google with token payload.

4. PHP BACKEND VERIFIES MATHEMATICAL SIGNATURE
   └─► Validates token against Google's public JWKS certificates.
   └─► Confirms audience (Client ID), expiry timestamp, and email verification.

5. RBAC ROLE MAPPING & SESSION CREATION
   └─► Checks email against HonTech Staff Directory.
   └─► Assigns role (Owner, Admin, Service Advisor, Technician).
   └─► Logs audit event in MariaDB security audit log.
```

---

## 🧪 6. Quality Assurance & Testing Matrix

| Test ID | Test Scenario | Execution Step | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- |
| **T-01** | LAN Accessibility | Open `http://192.168.1.100` from mobile phone on shop Wi-Fi. | Login screen loads in $<1$ second with full CSS styling. | ✅ PASS |
| **T-02** | Multi-Bay TV Sync | Change vehicle location to `Bay 2` on laptop. | TV screen immediately updates and plays Bay Dispatch work pulse. | ✅ PASS |
| **T-03** | Google OAuth Login | Click Google Login with authorized staff email. | Instant login and redirection to role-specific dashboard. | ✅ PASS |
| **T-04** | Unauthorized Google Login | Attempt login with unlisted personal email (`user@gmail.com`). | Rejected with clear toast: *"Email not authorized in staff directory"*. | ✅ PASS |
| **T-05** | Offline Disconnection | Turn off Wi-Fi on tablet. | Branded `#offline-network-screen` appears; no broken unstyled text shown. | ✅ PASS |
| **T-06** | Dev Sandbox Mailbox | Click "Forgot Password" while offline. | 6-digit OTP code appears in **Dev Mailbox** for quick testing. | ✅ PASS |

---

## 🎓 7. Capstone Defense & Panel Q&A Cheat Sheet

#### ❓ Q1: "Why did you build an on-premise local network instead of putting everything on AWS/Vercel?"
> **Your Answer**: *"In an active auto repair shop, operations cannot halt when an internet service provider experiences an outage. Our hybrid architecture keeps all bay allocations, intake forms, and TV monitors running at 100% speed locally, while using cloud APIs strictly for authentication and backups."*

#### ❓ Q2: "Is Google OAuth expensive for the client?"
> **Your Answer**: *"No. Google Identity Services is completely free for up to 50,000 monthly active users. For HonTech's 10–50 workshop employees, the recurring API subscription fee is **₱0.00/month**."*

#### ❓ Q3: "How does the system ensure Data Privacy (RA 10173)?"
> **Your Answer**: *"We implement three layers of privacy defense: First, customer vehicle records are isolated inside the local intranet away from internet scrapers. Second, passwords are never stored in plaintext because authentication is offloaded to Google OAuth 2.0. Third, all staff actions are logged in a MariaDB audit trail."*

#### ❓ Q4: "What happens if a vehicle arrives while the internet is down?"
> **Your Answer**: *"The Service Advisor uses standard local login (with hashed bcrypt passwords) or offline PIN entry. All intake stubs and bay allocations continue functioning without internet access."*

---

### 📁 Reference Documents
* [**`LOCAL_INTRANET_DEPLOYMENT_GUIDE.md`**](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/Hontech%20Documentation/Technical/LOCAL_INTRANET_DEPLOYMENT_GUIDE.md)
* [**`HONTECH_SECURITY_AND_ACCOUNT_RECOVERY_MASTER.md`**](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/Hontech%20Documentation/Technical/HONTECH_SECURITY_AND_ACCOUNT_RECOVERY_MASTER.md)
* [**`PROJECT_CHECKPOINTS_AND_CONVERSATION_HISTORY.md`**](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/Hontech%20Documentation/Technical/PROJECT_CHECKPOINTS_AND_CONVERSATION_HISTORY.md)
