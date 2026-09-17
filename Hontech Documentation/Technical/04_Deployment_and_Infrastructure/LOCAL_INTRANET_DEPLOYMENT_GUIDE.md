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

---

## 7. Professional Public Domain Naming & Security Architecture

When publishing the HonTech system on the public internet for evaluators, external staff, or customers, the URLs should follow an enterprise naming structure with full **HTTPS SSL encryption (Green Padlock 🔒)**.

### 7.1. Enterprise Domain Scheme
```
┌──────────────────────────────────────────────────────────────────────────┐
│              HONTECH AUTOCENTER PUBLIC DOMAIN ARCHITECTURE               │
├───────────────────────────────────┬──────────────────────────────────────┤
│ URL / Subdomain                   │ Target Audience & Purpose            │
├───────────────────────────────────┼──────────────────────────────────────┤
│ `https://portal.hontech-autocenter.com` │ Staff, Service Advisors & Management │
│ `https://booking.hontech-autocenter.com`│ Customer Online Appointment Booking  │
│ `https://tv.hontech-autocenter.com`    │ Waiting Lounge Public Display Kiosk  │
│ `https://hontech-marikina.com`    │ Main Business Landing & Info Portal  │
└───────────────────────────────────┴──────────────────────────────────────┘
```

### 7.2. Public Security & Data Isolation
* **The Public Link is Only the Front Door**: Exposing the URL does NOT expose internal shop records or databases.
* **Cryptographic Guarding (`backend/middleware/Auth.php`)**:
  * Unauthenticated requests are rejected immediately with `401 Unauthorized`.
  * All sensitive endpoints (`/api/analytics`, `/api/jobs`, `/api/auth/staff`) require a valid HTTP-Only JWT signature.
  * Role boundaries prevent customers or unauthorized users from viewing financials or changing workshop bays.

---

## 8. Step-by-Step Implementation: From Local Dev to Public Production

### Phase 1: Local Development & Intranet Testing (Current State)
1. Launch the server via `start_lan_server.bat` or `php -S 0.0.0.0:8000 router.php`.
2. Access locally on laptop via `http://localhost:8000`.
3. Connect phones and tablets on the same shop Wi-Fi via `http://192.168.1.5:8000` or `http://hontech-marikina.local:8000`.

### Phase 2: Instant Named Public Prototype (Zero-Cost / ₱0.00)
1. Ensure the PHP server is running on port 8000.
2. Open a new Command Prompt terminal and run:
   ```bash
   npx localtunnel --port 8000 --subdomain hontech-marikina
   ```
3. Share the generated public link: **`https://hontech-marikina.loca.lt`** with classmates, panel members, or clients anywhere in the Philippines.

### Phase 3: Cloudflare Zero-Trust Tunnel with Custom Domain (Production Ready)
1. Purchase or link a domain (e.g. `hontech-autocenter.com` or `hontech.ph`).
2. Add the domain to a free Cloudflare account.
3. In Cloudflare Zero Trust ➡️ Access ➡️ Tunnels, create a new tunnel named `hontech-primary`.
4. Run the Cloudflare connector agent on the shop laptop / server:
   ```bash
   cloudflared tunnel run --token <YOUR_CLOUDFLARE_TUNNEL_TOKEN>
   ```
5. Route `portal.hontech-autocenter.com` to `http://localhost:8000`.
6. **Result**: Free enterprise 256-bit SSL, DDoS protection, and zero router port forwarding.

### Phase 4: Standalone Cloud Web Hosting / VPS (24/7 Always-On Deployment)
1. If HonTech prefers not to run a dedicated laptop overnight, provision standard PHP/MySQL hosting (e.g. Hostinger, Render, or DigitalOcean VPS).
2. Export the local MySQL database: `mysqldump -u root -p hontech_db > hontech_backup.sql`.
3. Import the database onto the production MySQL instance.
4. Upload `/backend` and `/frontend` files to the web root (`public_html` or `/var/www/html`).
5. Set `APP_ENV=production` in `.env`.
6. Map DNS A records for `hontech-autocenter.com` to the server IP.

---

## 9. Professional GitHub Showcase & Contribution Verification

### 9.1. Repository Naming Best Practice
* Change verbose development repository titles (`Hontech_Main_Active_Development_PHP_SQL`) to clean, enterprise names:
  👉 **`https://github.com/Justin-stack101/hontech-autocenter`**
* Set the default branch to the primary active branch on GitHub Settings (`Settings` ➡️ `Branches` ➡️ `Default branch`).

### 9.2. Capstone Defense Contribution Proof
* Evaluators review your **GitHub Contribution Heatmap** (`https://github.com/Justin-stack101?tab=overview`) to verify daily commits, milestone tags (`checkpoint-1` to `checkpoint-10`), and code authorship.
* Include the clean repository link in your thesis documentation and defense slides.

