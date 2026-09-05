# Free-Tier Economics, Storage Limits & Network Bandwidth Guide

**Project:** HonTech AutoCenter — Web-Based Vehicle Intake & Queue Monitoring System  
**Document Series:** Cloud Architecture & Serverless Engineering  
**Version:** 1.0.0 (September 2026 Rollout)  

---

## 1. 💾 Understanding the Limits: "Database Storage" vs. "Network Bandwidth"

A common misunderstanding among junior developers is confusing **Database Disk Storage** with **Internet Bandwidth**:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 💾 1. DATABASE DISK STORAGE (500 MB in Supabase)                       │
│ • Equivalent to: Hard Drive / Memory Card in a laptop.                 │
│ • How it increases: ONLY when permanent data is saved to SQL tables.   │
│ • What DOES NOT affect it: People browsing, searching, or staying      │
│   on the website!                                                      │
│ • Capacity: 1 text repair record = ~0.5 KB (0.0005 MB).                │
│ • 500 MB can store over 1,000,000 vehicle repair records!              │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ 🌐 2. NETWORK BANDWIDTH (100 GB / month in Vercel)                     │
│ • Equivalent to: Monthly Mobile Data Internet Allowance (e.g. Smart).  │
│ • How it is used: When visitors download HTML/CSS/JS and make clicks.  │
│ • Capacity: 1 page load = ~0.5 MB.                                     │
│ • 100 GB easily supports 100,000 to 200,000 visits per month for ₱0!   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 📊 HonTech AutoCenter Monthly Resource Consumption Math

Let's calculate the real-world resource consumption for **HonTech AutoCenter (15 Staff, 40 Cars/Day, 2 TV Displays)**:

| Resource Metric | Free Monthly Allowance | HonTech Daily & Monthly Usage | % of Free Quota Used | Total Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Database Storage** | **500 Megabytes** | ~0.6 MB per month (~7 MB per year) | **1.4%** | **₱0.00** |
| **Monthly Active Users** | **50,000 users** | ~15 to 30 active staff members | **0.06%** | **₱0.00** |
| **Realtime WebSockets** | **200 concurrent screens** | ~6 computers + 2 lounge TVs = **8 screens** | **4.0%** | **₱0.00** |
| **Bandwidth (Data In/Out)** | **100 Gigabytes** | ~1.5 GB per month | **1.5%** | **₱0.00** |

> **Conclusion:** Because HonTech AutoCenter is an **internal operations system**, its daily volume uses **less than 2% of the free tier limits**.

---

## 3. 🚨 What ACTUALLY Makes the 500 MB Database Limit Rise?

| Cause | Risk Level | What Happens | Professional Engineering Solution |
| :--- | :--- | :--- | :--- |
| **Raw 12MP Smartphone Camera Photos** | 🔴 **High** | Uploading 5MB raw vehicle inspection photos directly into database BLOB columns fills 500MB in just 100 photos. | Compress photos on browser down to **100 KB** or upload to Cloudinary/Google Drive and store only the URL in Supabase. |
| **Heavy PDF Manuals / Binaries** | 🟠 **Medium** | Storing scanned 50-page PDF repair manuals in table columns. | Save PDF files to Google Drive or AWS S3 and save the link. |
| **Infinite Unpruned Debug Logs** | 🟡 **Low** | Scripts recording second-by-second mouse moves or TV heartbeat pings without an automated 60-day cleanup. | Store clean audit logs only (e.g. "User X edited Plate Y") and run annual Excel archive exports. |
| **Accumulated Text Over 10+ Years** | 🟢 **Very Low** | Storing 500,000+ text records over a decade. | Click "Export & Archive to Excel" once per year to purge historical completed jobs. |

---

## 4. 📺 Why Watching Videos Uses 0 MB of Database Storage

When embedding promotional or car maintenance videos into the Waiting Lounge TV or website via **YouTube (`<iframe>`)**:
1. **Google Streams 100% of the Video:** All gigabytes of video playback come directly from Google's global video servers.
2. **Your Database Stores Only the Link:** Supabase only stores the short text URL (`https://youtu.be/abc123xyz`), which is just **30 bytes (0.00003 MB)**.
3. **Zero Financial Impact:** Even if thousands of customers watch videos in the lounge all day, your Supabase storage and Vercel bandwidth remain at **0% data consumption**.

---

## 5. 🚀 The "Pay-As-You-Grow" Freemium Model

* **Small to Medium Operations (1–3 Branches):** 100% Free under standard quotas with zero credit card required.
* **Massive Multi-Branch Expansion (10+ Branches nationwide):** When HonTech grows into a nationwide enterprise generating substantial revenue, they can optionally upgrade to Pro ($25/mo) for unlimited scaling.
