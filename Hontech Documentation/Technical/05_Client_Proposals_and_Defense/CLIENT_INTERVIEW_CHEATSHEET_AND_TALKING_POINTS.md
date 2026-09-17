# 🗣️ Client Interview Cheat Sheet & Talking Points
## HonTech AutoCenter Operations System — Executive Meeting Guide

> [!IMPORTANT]
> Use this cheat sheet during your meeting with **HonTech AutoCenter Management & Ownership**. It provides exact answers and explanations for questions regarding domain names, hosting costs, local network access, and system security.

---

## 🎯 1. DOMAIN NAME & NETWORK ADDRESSING (The #1 Discussion Topic)

### Client Question: *"Do my staff and waiting lounge TV have to type numbers like `192.168.1.105` to open the system?"*

#### 💡 Your Answer / Talking Point:
> *"No, Mr. Client! While the server runs locally inside your shop for **₱0 monthly fees**, we configure a **Clean Local Domain Name** (such as `http://hontech.ph` or `http://hontech.local`) on your shop's Wi-Fi network.*
>
> *Any staff phone, tablet, computer, or waiting room Smart TV connected to your shop Wi-Fi simply types **`http://hontech.ph`** and the system opens immediately. It costs ₱0, requires zero paperwork, and works 100% offline."*

---

### Client Question: *"What is the difference between `.com` vs `.ph` vs Local IP?"*

#### 💡 Comparison Breakdown for Client:

| Address Type | Address Example | Monthly Cost | Internet Needed? | Best Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Local Wi-Fi Domain (Recommended)** | `http://hontech.ph` or `http://hontech.local` | **₱0 / FREE** | **NO** (Works offline) | **Shop Floor, Front Desk, Lounge TV** |
| **Public Philippine Domain** | `https://hontech.ph` | **~₱100/mo** (₱1,200/yr) | **YES** | **Public Online Customer Booking** |
| **Public Global Domain** | `https://hontech.com` | **~₱50/mo** (₱600/yr) | **YES** | **International Commercial Website** |

---

### Client Question: *"What if I want to check shop analytics from home or on my phone outside the shop?"*

#### 💡 Your Answer / Talking Point:
> *"We have **2 free solutions** for you:*
> 1. **FREE Secure Remote Access Link**: During testing and initial operations, we can generate a **secure encrypted remote link** (`ngrok` / Cloudflare Tunnel) for ₱0 so you can check live shop analytics from home.
> 2. **Optional Cloud Expansion**: If in the future you want 24/7 global public access on `hontech.ph`, we can easily connect a cloud host. But you are **never locked in** and can stay on ₱0 local hosting as long as you wish."*

---

## 💰 2. FINANCIAL ANALYSIS & HARDWARE TALKING POINTS

### Client Question: *"Why is local deployment better for my shop financially?"*

#### 💡 Your Answer / Talking Point:
> *"Cloud servers charge monthly subscription fees per user and data volume fees that increase every year ($15-$30/month = ₱10,000–₱20,000+ per year).*
>
> *With our Local Intranet Architecture, you make a **one-time hardware purchase** of a small host PC (or repurpose a desktop you already own in the shop). Over 5 years, this saves HonTech between **₱58,000 and ₱143,000** in recurring hosting fees!"*

---

## 🛡️ 3. SECURITY & ACCOUNT RECOVERY TALKING POINTS

### Key Items to Highlight to Management:
1. **Data Sovereignty & Privacy**: Customer names, phone numbers, and vehicle repair logs stay physically inside the HonTech building on your local server PC.
2. **15-Minute Automatic Idle Lockout**: Protects staff terminals if left unattended on the shop floor.
3. **Multi-Factor Authentication (MFA)**: Protects Owner/Admin accounts using Google Authenticator 2FA.
4. **Self-Service 6-Digit OTP Recovery**: Staff can recover forgotten passwords using a secure 6-digit OTP code.

---

## 📑 4. MEETING CHECKLIST (What to Agree On During the Interview)

- [ ] **Confirm Server Machine**: Will HonTech purchase a mini-PC (₱16,500–₱22,000) or repurpose an existing shop desktop?
- [ ] **Confirm Lounge TV**: Smart TV screen size (40"+ recommended) or streaming stick (Chromecast/FireStick).
- [ ] **Local Wi-Fi Network Name**: Agree on the shop Wi-Fi network SSID and local domain name (`http://hontech.ph`).
- [ ] **Schedule Dry Run Date**: Pick a slow business day (e.g., Tuesday) for the 1-day parallel trial run.
