# 📘 HONTECH AutoCenter — Enterprise Operations & Future Deployment Playbook
## Comprehensive Technical Manual: Local Domain, Google Cloud Security, Account Recovery & Workshop TV

> [!IMPORTANT]
> **Purpose of this Document**: This authoritative playbook provides step-by-step operational instructions, configurations, and future roadmap procedures for the **HonTech AutoCenter Management System**. Use this guide during client handover, technical maintenance, Capstone panel defense, and live production scaling.

---

## 📑 Table of Contents
1. [Chapter 1: Local Domain & Shop Wi-Fi Server Deployment](#chapter-1-local-domain--shop-wi-fi-server-deployment)
2. [Chapter 2: Google Cloud Security & Live Google API Setup](#chapter-2-google-cloud-security--live-google-api-setup)
3. [Chapter 3: Self-Service Account Recovery & MFA Operations](#chapter-3-self-service-account-recovery--mfa-operations)
4. [Chapter 4: Workshop TV Display Monitor & Audio Chime Kiosk Setup](#chapter-4-workshop-tv-display-monitor--audio-chime-kiosk-setup)
5. [Chapter 5: Disaster Recovery, Database Backups & Branch Partitioning](#chapter-5-disaster-recovery-database-backups--branch-partitioning)
6. [Chapter 6: Troubleshooting & Diagnostic Quick-Reference](#chapter-6-troubleshooting--diagnostic-quick-reference)

---

## Chapter 1: Local Domain & Shop Wi-Fi Server Deployment

### 1.1 Overview & ₱0 Zero-Cost Architecture
The HonTech system is designed to run natively as an **On-Premises Local Shop Server** using hardware already owned by the shop, requiring **₱0 in monthly cloud subscriptions or domain registry fees**.

```
                           ┌──────────────────────────────┐
                           │   Shop Wi-Fi Router / LAN    │
                           │   (Subnet: 192.168.1.0/24)   │
                           └──────────────┬───────────────┘
                                          │
        ┌─────────────────────────────────┼────────────────────────────────┐
        │                                 │                                │
        ▼                                 ▼                                ▼
┌──────────────┐                  ┌──────────────┐                 ┌──────────────┐
│ Host Server  │                  │ Service Tab/ │                 │ TV Monitor   │
│ PC (XAMPP /  │                  │ Mobile Phone │                 │ (Chromium /  │
│ PHP + MySQL) │                  │ (Advisors)   │                 │ Smart TV)    │
│ 192.168.1.100│                  │ 192.168.1.105│                 │ 192.168.1.110│
└──────────────┘                  └──────────────┘                 └──────────────┘
```

### 1.2 Step-by-Step Server Setup on the Host PC

#### Step 1: Assign a Static Local IP to the Host Server PC
1. On the Windows Host PC (running XAMPP Apache & MySQL):
   - Open **Settings** $\rightarrow$ **Network & Internet** $\rightarrow$ **Wi-Fi / Ethernet** $\rightarrow$ **IP Assignment**.
   - Change from **Automatic (DHCP)** to **Manual (Static)**:
     - **IP Address**: `192.168.1.100` (or chosen static address)
     - **Subnet Mask**: `255.255.255.0`
     - **Default Gateway**: `192.168.1.1` (your shop router IP)
     - **DNS**: `8.8.8.8` / `1.1.1.1`

#### Step 2: Configure Windows Firewall Inbound Rules
To allow tablets, phones, and TVs on the shop Wi-Fi to access the host:
1. Open **Windows Defender Firewall with Advanced Security**.
2. Click **Inbound Rules** $\rightarrow$ **New Rule...**
3. Select **Port** $\rightarrow$ **TCP** $\rightarrow$ Specific local ports: `80, 443, 8000, 8001, 3306`.
4. Select **Allow the connection** $\rightarrow$ Check **Domain, Private** (Uncheck Public for security).
5. Name the rule: `HonTech Local Shop Server`.

#### Step 3: Configure Local Domain Name (`http://hontech.local` or `http://hontech.lan`)
Instead of typing IP addresses on every shop tablet:
1. **Method A: Router Local DNS (Recommended for entire shop)**:
   - Access shop router admin panel (`http://192.168.1.1`).
   - Navigate to **DNS Settings** / **Static Host List**.
   - Map `hontech.local` $\rightarrow$ `192.168.1.100`.
   - Now **any device** connected to the shop Wi-Fi can navigate directly to:
     `http://hontech.local/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/frontend/index.html`
2. **Method B: Client Hosts File (For individual testing laptops)**:
   - Edit `C:\Windows\System32\drivers\etc\hosts` as Administrator:
     ```text
     192.168.1.100 hontech.local
     ```

---

## Chapter 2: Google Cloud Security & Live Google API Setup

### 2.1 Overview & Dynamic Fallback System
The application includes a **Dynamic Provider Architecture**:
- **Offline / Sandbox Mode (Default)**: Automatically runs when no API keys are present. Routes security emails to the built-in Developer Mailbox and uses the Sandbox Google Login modal.
- **Production Mode**: Activates automatically as soon as `.env` variables (`GOOGLE_CLIENT_ID`, `GMAIL_CLIENT_ID`, etc.) are configured.

### 2.2 Step-by-Step Google Cloud Console Setup

#### Step 1: Create a Google Cloud Project
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Create Project** $\rightarrow$ Project Name: `HonTech-AutoCenter-Operations`.
3. Configure the **OAuth Consent Screen**:
   - User Type: **External** (or **Internal** if using Google Workspace).
   - App Name: `HonTech AutoCenter`.
   - User Support Email: `admin@hontech.com` (or your authorized email).
   - Authorized Domains: `hontech.com` (and `localhost` for testing).
   - Developer Contact: Your technical team email.

#### Step 2: Generate OAuth 2.0 Client Credentials (for Google SSO & GIS)
1. Go to **APIs & Services** $\rightarrow$ **Credentials** $\rightarrow$ **Create Credentials** $\rightarrow$ **OAuth client ID**.
2. Application type: **Web application**.
3. Name: `HonTech Web Client`.
4. **Authorized JavaScript origins**:
   - `http://localhost`
   - `http://127.0.0.1:8000`
   - `http://192.168.1.100`
   - `http://hontech.local`
5. **Authorized redirect URIs**:
   - `http://localhost/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/backend/index.php/api/auth/google/callback`
6. Copy the **Client ID** and **Client Secret**.
7. Update `backend/.env`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

#### Step 3: Enable Gmail API for Live Security Emails (OTP & Alerts)
1. In Google Cloud Console, go to **APIs & Services** $\rightarrow$ **Library**.
2. Search for **Gmail API** and click **Enable**.
3. Enable Scopes: `https://www.googleapis.com/auth/gmail.send`.
4. Configure SMTP Relay (Alternative simpler method using Google App Password):
   - In Google Account Security: Enable **2-Step Verification**.
   - Navigate to **App passwords** $\rightarrow$ Generate password for `HonTech System`.
   - Update `backend/.env`:
     ```env
     MAIL_DRIVER=smtp
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_USER=security.alerts@hontech.com
     SMTP_PASS=your_16_digit_app_password
     SMTP_FROM=security.alerts@hontech.com
     SMTP_FROM_NAME="HonTech Security Services"
     ```

#### Step 4: Enable Google Calendar API for Customer Appointment Sync
1. In API Library, search for **Google Calendar API** and click **Enable**.
2. Scopes: `https://www.googleapis.com/auth/calendar.events`.
3. When front-desk staff confirms an intake booking, the system creates a calendar event on the master shop calendar (`master.calendar@hontech.com`) and automatically sends an invitation to the customer's email.

#### Step 5: Enable Google Drive API v3 for Cloud Database Backups
1. In API Library, search for **Google Drive API** and click **Enable**.
2. Scopes: `https://www.googleapis.com/auth/drive.file`.
3. Set the target backup folder ID in `backend/.env`:
   ```env
   GOOGLE_DRIVE_BACKUP_FOLDER_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz123456
   ```

---

## Chapter 3: Self-Service Account Recovery & MFA Operations

### 3.1 Self-Service 6-Digit OTP Password Recovery Flow
The recovery flow provides enterprise-grade credential recovery with zero administrator intervention required:

```
[ User clicks "Forgot Password" ]
             │
             ▼
[ User Enters Registered Email ]
             │
             ▼
[ Backend generates 6-Digit Cryptographic OTP + 15-Min Expiry ]
             │
             ▼
[ OTP Dispatched via Gmail API / Developer Sandbox ]
             │
             ▼
[ User Enters 6-Digit OTP + New Bcrypt Password ]
             │
             ▼
[ Database verifies Hash & Expiration -> Updates Password -> Success Toast ]
```

### 3.2 Multi-Factor Authentication (MFA / 2FA) Protocol
1. **Enrollment**:
   - User navigates to **Security Portal** (`#section-profile`).
   - Clicks **Enable 2FA** $\rightarrow$ Generates standard TOTP Secret Key (`32-character base32`).
   - Scans QR Code using **Google Authenticator**, **Microsoft Authenticator**, or **Authy**.
   - Enters 6-digit confirmation code to verify time synchronization.
2. **Emergency Backup Codes**:
   - System generates **8 single-use alphanumeric backup codes** (e.g. `HNT-9481-2041`).
   - User downloads/prints backup codes for device-loss emergency recovery.
3. **Administrator Emergency Password Override**:
   - If an employee forgets credentials and loses their 2FA device:
   - System Owner navigates to **Staff Management** (`#section-staff`).
   - Clicks **Reset Password** on the user row $\rightarrow$ Sets temporary password and optionally resets 2FA enrollment.

---

## Chapter 4: Workshop TV Display Monitor & Audio Chime Kiosk Setup

### 4.1 TV Monitor Hardware & Auto-Boot Configuration
1. **Hardware Setup**:
   - Connect a Smart TV, Raspberry Pi, or mini-PC to the shop Wi-Fi / Ethernet.
   - Point browser to:
     `http://192.168.1.100/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/frontend/index.html?mode=tv`
2. **Full-Screen Kiosk Mode (Chrome / Edge)**:
   - Launch browser with Kiosk flag:
     ```cmd
     chrome.exe --kiosk --disable-infobars --autoplay-policy=no-user-gesture-required "http://192.168.1.100/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/frontend/index.html?mode=tv"
     ```
   - Press **`F11`** for standard full-screen viewing.

### 4.2 TV 3-Slide Carousel Breakdown
- 📺 **Slide 1 (Bay Monitoring)**:
  - Displays **`BAY-01`**, **`BAY-02`**, **`BAY-03`**, **`BAY-04`**.
  - Populates in real-time when Service Advisors assign bays in the daily intake table.
  - Vacates dynamically when vehicles transition to Waiting Area or Ready to Release.
- 📋 **Slide 2 (Queue & Release Status)**:
  - **Service Queue (Left)**: Active incoming vehicles with category tags.
  - **Ready for Release (Right)**: Completed vehicles ready for customer pickup.
  - **Carry-Over Vehicles (Bottom)**: Multi-day repair jobs.
- 🚗 **Slide 3 (Workshop Lanes Monitoring)**:
  - Real-time column metrics for **Express Lane**, **Flexible Lane**, and **Special Lane**.
- ⏱️ **Auto-Cycle**: Slides automatically rotate every **12 seconds** continuously. Top-right dots are clickable for manual jump.

### 4.3 Automotive Harmonic Audio Chime
- **Acoustic Synthesizer**: Uses Web Audio API dual-tone frequency synthesis ($D_5 \rightarrow A_5 \rightarrow D_6$).
- **Trigger Events**:
  - When Service Advisor marks status as **Ready to Release** / **Released**.
  - When Finalizing Vehicle Release in the modal.
  - When a newly completed vehicle appears on Slide 2 of the TV monitor.
- **Mute Control**: Click **Chime ON / OFF** on the top toolbar to toggle audio.

---

## Chapter 5: Disaster Recovery, Database Backups & Branch Partitioning

### 5.1 Automated MySQL Database Backup Protocol
1. **Windows Task Scheduler Automated Backup Script (`backup_db.bat`)**:
   ```bat
   @echo off
   set BACKUP_DIR=C:\xampp\htdocs\backups
   set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%
   C:\xampp\mysql\bin\mysqldump.exe -u root hontech > %BACKUP_DIR%\hontech_backup_%TIMESTAMP%.sql
   ```
2. **Google Drive Sync**:
   - Uploads encrypted database archives to the designated Google Drive Backup folder every 24 hours.

### 5.2 Branch Data Partitioning & Isolation
- The database supports **Multi-Branch Operations** (`Branch A`, `Branch B`, `Marikina Branch`, etc.).
- **Data Scoping Rules**:
  - **Owner**: Full cross-branch global analytics and switchboard view.
  - **Admin / SA / Assistant**: Scoped exclusively to their assigned branch (`WHERE branch = ?`).
  - **TV Display Monitor**: Real-time aggregate workshop status.

---

## Chapter 6: Troubleshooting & Diagnostic Quick-Reference

| Symptom / Issue | Root Cause | Solution Step |
| :--- | :--- | :--- |
| **TV Monitor shows empty bays** | Background polling failed or stale browser cache | Hard-refresh TV tab (`Ctrl + F5`). Ensure `public static function normalizeJob` is active in `JobController.php`. |
| **Audio chime not sounding** | Browser autoplay policy blocked audio context | Click anywhere on the TV screen to unlock `AudioContext`, or toggle the `Chime ON/OFF` button in toolbar. |
| **Cannot connect from tablet/phone** | Windows Firewall blocking inbound port 80/8000 | Add Inbound Port Rule for TCP `80, 8000` in Windows Defender Firewall on Host PC. |
| **Forgot password email not sending** | `.env` credentials empty or invalid SMTP pass | Check Developer Mailbox (`/api/auth/developer/emails`) for local sandbox testing or configure valid Gmail App Password in `.env`. |
| **Database collision when assigning bay** | Previous vehicle occupied target bay | The system auto-vacates prior occupant to `Waiting Area`. If manually editing DB, clear `bay_assigned = NULL`. |

---

> [!TIP]
> **Document Verification**: This manual was audited and verified against Branch 2 codebase (`branch2-Security-Account-Recovery`) on August 20, 2026.
