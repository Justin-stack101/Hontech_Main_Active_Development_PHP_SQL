# HonTech Local Intranet, Server Hosting & Remote Access Manual

## 1. Executive Summary & Core Concept
The HonTech Operations System is architected as an **On-Premises Local Server Application** that can operate both **locally within the workshop (LAN)** and **remotely nationwide (across the Philippines)** directly from this host laptop without recurring cloud subscription fees (₱0.00 / $0.00).

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      YOUR HOST LAPTOP (Running Server)                 │
 │                           php -S 0.0.0.0:8000                          │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌─────────────────────────────────┐         ┌─────────────────────────────────┐
│     LOCAL SHOP ACCESS (LAN)     │         │   NATIONWIDE ACCESS (INTERNET)  │
│  Same Wi-Fi / Router / Hotspot  │         │   Anywhere in the Philippines   │
│                                 │         │   (Mobile Data, Home, Branches) │
│ • http://10.239.104.46:8000     │         │ • Free Cloudflare Tunnel        │
│ • http://hontech-marikina.local │         │ • Instant Localtunnel HTTPS     │
└─────────────────────────────────┘         └─────────────────────────────────┘
```

---

## 2. Financial & Resource Justification (₱0.00 / $0.00)

| Cost Category | Cloud SaaS Model | HonTech On-Premises Model |
| :--- | :--- | :--- |
| **Server Hosting** | ₱2,500 – ₱6,000 / month | **₱0.00** (Runs locally on shop laptop) |
| **Domain Registration** | ₱800 – ₱1,500 / year | **₱0.00** (Local `.local` mDNS / Free Secure Tunnel) |
| **Per-User Licensing** | ₱500 / staff / month | **₱0.00** (Unlimited local & remote staff accounts) |
| **Offline Downtime Risk** | Complete shutdown during ISP loss | **Zero downtime** (Local MySQL database remains active) |
| **Bandwidth Quota** | Consumes high internet data | **0 KB internet data** for internal workshop floor queries |

---

## 3. Local In-Shop Network Addressing

### 3.1. Zero-Configuration Local Domain (`.local` mDNS)
Modern mobile and desktop operating systems (iOS Safari, Android Chrome, Windows 10/11, macOS) support **Multicast DNS (mDNS)**:
* **Host Laptop Computer Name**: Set to `hontech-marikina`
* **Local Domain Link**: `http://hontech-marikina.local:8000`
* Any smartphone, tablet, or PC connected to the shop's Wi-Fi can navigate to `http://hontech-marikina.local:8000` without typing numeric IP addresses.

### 3.2. Router Static DNS Mapping (Optional)
On office/shop routers (TP-Link, Asus, D-Link, MikroTik):
1. Navigate to **DHCP Static Lease / Local DNS**.
2. Map hostname `hontech.marikina` to the host laptop's static LAN IP (e.g. `192.168.1.100` or `10.239.104.46`).
3. Devices on the shop Wi-Fi navigate to `http://hontech.marikina:8000`.

### 3.3. Standard Port 80 Web Binding
To eliminate `:8000` from the browser address bar:
```powershell
# Run PowerShell as Administrator:
php -S 0.0.0.0:80 router.php
```
Result: Address becomes a clean `http://hontech-marikina.local` or `http://hontech.marikina`.

---

## 4. Nationwide Remote Access (Anywhere in the Philippines)

If the client or evaluator is at home, in another branch, or on mobile data (4G/5G), the host laptop can serve the application across the internet using secure, zero-cost reverse tunneling.

### 4.1. Option A: Instant Public Link via LocalTunnel (Zero Install)
Requires Node.js (already installed with `npx`):
```bash
# In your terminal:
npx localtunnel --port 8000
```
**Output Example**:
```text
your url is: https://hontech-demo.loca.lt
```
* Anyone in the Philippines can open this link on their smartphone or PC over Globe, Smart, PLDT, or DITO.

### 4.2. Option B: Cloudflare Quick Tunnels (`cloudflared`) — Recommended for Capstone & Enterprise
Cloudflare provides free DDoS-protected tunnels with official SSL certificates (`https://`):
1. Download `cloudflared.exe` from Cloudflare.
2. Run:
```powershell
cloudflared tunnel --url http://localhost:8000
```
3. Cloudflare generates a persistent HTTPS URL (e.g. `https://hontech-marikina-live.trycloudflare.com`).
4. **Benefits**: Bypasses ISP firewall restrictions (CGNAT), works seamlessly through mobile hotspots, and requires zero router port forwarding.

---

## 5. Startup & Automated Launcher Scripts

### 5.1. 1-Click Automated Batch Launcher ([`start_lan_server.bat`](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/start_lan_server.bat))
Located in the project root folder. Double-clicking this script:
1. Automatically queries the Windows routing table to detect the machine's active Wi-Fi / Hotspot IPv4 address.
2. Prints a formatted banner displaying both the **Local URL** (`http://localhost:8000`) and the **Mobile Device LAN URL** (`http://<HOST_IP>:8000`).
3. Launches the PHP 8.0 server listening on `0.0.0.0:8000`.

### 5.2. Manual CLI Startup
```powershell
# From the project root:
php -S 0.0.0.0:8000 router.php
```

### 5.3. Windows Firewall Inbound Port Rule (Port 8000)
Run once in PowerShell as Administrator if external devices cannot connect:
```powershell
New-NetFirewallRule -DisplayName "HonTech Local Server" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

---

## 6. Multi-Role Testing Protocol

### 6.1. Instant Role Logins
The login interface includes 1-click access buttons inside the collapsible **Developer Credentials & Testing** card:
* **Owner**: Global cross-branch telemetry, executive reports, and account control.
* **Admin**: Branch-level staff management and analytics monitoring.
* **Service Advisor (SA)**: Walk-in vehicle logging, workshop bay allocation (Bays 1–10), claim stub generation, and view-only online booking oversight.
* **Technician**: Workshop bay task tracking and marking service milestones.
* **Assistant Staff**: Exclusive operational authority over online appointment confirmations and customer inquiries.

### 6.2. Mobile QR Code Pairing
Clicking **"Mobile Connect"** on the login screen renders a dynamic QR code (`window.location.origin`). Staff can point their phone camera at the screen to open the app on mobile instantly.
