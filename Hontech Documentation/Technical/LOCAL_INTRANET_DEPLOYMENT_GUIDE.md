# HonTech Local Intranet & Multi-Device Deployment Manual

## 1. Executive Summary & Core Concept
The HonTech Operations System is architected as an **On-Premises Local Intranet Application**. Rather than requiring recurring subscriptions for public cloud instances and domain registrars, the system runs locally within the auto shop's physical premises.

```
                  ┌────────────────────────────────────────┐
                  │       HONTECH ON-PREMISES SERVER       │
                  │   Host Laptop running PHP 8 + MariaDB  │
                  │        IP: 192.168.1.X / Port: 8000     │
                  └───────────────────┬────────────────────┘
                                      │ (Local Wi-Fi / LAN)
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
           ▼                          ▼                          ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│  WAITING ROOM TV    │    │  SERVICE ADVISOR    │    │    BAY MECHANIC     │
│ Public Queue Board  │    │  Intakes & Lifts    │    │ Tasks & Checklists  │
│ (No login required) │    │  (Tablet / Mobile)  │    │  (Smartphone / PWA) │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

---

## 2. Financial & Resource Justification (₱0.00 / $0.00)

| Cost Category | Cloud SaaS Model | HonTech On-Premises Model |
| :--- | :--- | :--- |
| **Server Hosting** | ₱2,500 – ₱6,000 / month | **₱0.00** (Runs on shop laptop) |
| **Domain Registration** | ₱800 – ₱1,500 / year | **₱0.00** (Local `.local` mDNS / LAN IP) |
| **Per-User Licensing** | ₱500 / staff / month | **₱0.00** (Unlimited local users) |
| **Offline Downtime Risk** | Complete shutdown during ISP loss | **Zero downtime** (Local database stays active) |
| **Bandwidth Quota** | Consumes high internet data | **0 KB internet data** for local LAN queries |

---

## 3. Network Addressing & Local Domain Resolution

### 3.1. Zero-Configuration Local Domain (`.local` mDNS)
Modern mobile and desktop operating systems (iOS Safari, Android Chrome, Windows 10/11, macOS) include **Multicast DNS (mDNS)** support:
* **Host Laptop Computer Name**: Set to `hontech-marikina`
* **Local Domain Link**: `http://hontech-marikina.local:8000`
* Any mobile device or tablet connected to the shop's Wi-Fi network can navigate to `http://hontech-marikina.local:8000` without manual IP configuration.

### 3.2. Router Static DNS Mapping (Optional)
On office routers (TP-Link, Asus, D-Link, MikroTik):
1. Navigate to **DHCP Static Lease / Local DNS**.
2. Map hostname `hontech.marikina` to the host laptop's static LAN IP (e.g. `192.168.1.100`).
3. Devices on the shop Wi-Fi navigate to `http://hontech.marikina:8000`.

### 3.3. Standard Port 80 Web Binding
To eliminate `:8000` from the browser address bar:
```powershell
# Run PowerShell as Administrator:
php -S 0.0.0.0:80 router.php
```
Result: Address becomes clean `http://hontech-marikina.local` or `http://hontech.marikina`.

---

## 4. Multi-Role Testing Protocol

### 4.1. Fast-Track Authentication (1-Click Roles)
To expedite team testing and client presentations, the login interface includes instant 1-click access triggers:
* 👑 **Owner**: Global analytics, cross-branch metrics, and PDF/Word reporting.
* 👔 **Admin**: Staff account management and branch operational monitoring.
* 🛠️ **Service Advisor (SA)**: Walk-in logging, lift assignment (Lifts 1–4), and claim stub generation.
* 🔧 **Technician**: Bay queue inspections and marking repairs as Completed.

### 4.2. On-Screen Mobile QR Pairing
Clicking **"Connect Phone"** on the login screen renders a dynamic QR code (`window.location.origin`). Staff can point their smartphone cameras directly at the screen to load the application instantly.

---

## 5. Startup & Operations Commands

### Automated Startup
Double-click [`start_lan_server.bat`](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/start_lan_server.bat) in the project root folder.

### Manual CLI Startup
```powershell
# In the project directory:
php -S 0.0.0.0:8000 router.php
```

### Windows Firewall Permission (Port 8000)
```powershell
New-NetFirewallRule -DisplayName "HonTech Local Server" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```
