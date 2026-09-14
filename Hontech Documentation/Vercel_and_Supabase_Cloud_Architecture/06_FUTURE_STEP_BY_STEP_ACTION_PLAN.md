# 06: Future Action Plan & Step-by-Step Developer Execution Guide

**Project:** HonTech AutoCenter — Web-Based Vehicle Intake & Queue Monitoring System  
**Document Series:** Cloud Architecture & Serverless Engineering (Part 6)  
**Target Audience:** Justin (Lead Systems Developer)  
**Core Goal:** Step-by-step roadmap for executing the Vercel + Supabase cloud migration safely without risking the active PHP/MySQL prototype.

---

## 🧭 Master Roadmap Overview

```
 ┌───────────────────────────────────────────────────────────────────────────┐
 │                       YOUR 3-STAGE MASTER ROADMAP                         │
 ├───────────────────────────────────────────────────────────────────────────┤
 │ STAGE 1: FINISH LOCAL CLIENT REVISIONS (CURRENT REPO)                     │
 │ • Keep using PHP 8.0 + MySQL (Port 3307) on localhost:8000.              │
 │ • Complete all client feature requests, bugfixes, and checklist items.    │
 │ • Current repo stays 100% PRIVATE and STABLE.                             │
 ├───────────────────────────────────────────────────────────────────────────┤
 │                                     ▼                                     │
 │ STAGE 2: CREATE SEPARATE CLOUD REPO (`vercel_supabase`)                   │
 │ • Create new PRIVATE GitHub repo `vercel_supabase`.                       │
 │ • Copy only frontend static files (HTML, CSS, JS, Assets).                │
 │ • Add 30-second stealth shield (`robots.txt` + `noindex`).                │
 ├───────────────────────────────────────────────────────────────────────────┤
 │                                     ▼                                     │
 │ STAGE 3: CONNECT SUPABASE & VERCEL (EASY 15-MINUTE CLOUD LAUNCH)          │
 │ • Paste `supabase_schema.sql` into Supabase SQL Editor -> Click Run.      │
 │ • Add Supabase JS client and Data Adapter.                                │
 │ • Import repo into Vercel and deploy live preview.                        │
 └───────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Step-by-Step Future Execution Guide

When you are ready to execute the cloud migration, follow these exact steps:

### STEP 1: Supabase Cloud Database Setup (~10 minutes)
1. Go to [supabase.com](https://supabase.com) and sign in using your GitHub account.
2. Click **"New Project"**:
   - **Name:** `hontech-autocenter`
   - **Database Password:** *(Choose a strong password and save it in your notes)*
   - **Region:** Select `Singapore (ap-southeast-1)` (lowest latency for the Philippines).
   - **Pricing Plan:** Free Tier ($0).
3. Once the database initializes, click the **SQL Editor** tab (icon with `>_` on the left sidebar).
4. Click **"New Query"**, open [`supabase_schema.sql`](./supabase_schema.sql), copy its **entire contents**, paste into the editor, and click **"Run"**.
   - *Result:* Creates `jobs`, `users`, `express_lane_issues`, `job_audit_logs`, applies security RLS policies, seeds 4 accounts, and activates Realtime WebSockets!
5. Go to **Project Settings** (gear icon) ➔ **API**:
   - Copy **Project URL** (e.g. `https://xyzabcdef.supabase.co`).
   - Copy **`anon` `public` key** (starts with `eyJhbGci...`).
   - ⚠️ **DO NOT copy or touch the `service_role` key.**

---

### STEP 2: Initialize the New Dedicated Repository (~10 minutes)
1. On GitHub, click **New Repository**:
   - **Name:** `hontech-vercel-supabase` (or `vercel_supabase`).
   - **Visibility:** Select **PRIVATE**.
   - Initialize with a `README.md`.
2. Clone the repository to your computer (e.g. in `c:\xampp\htdocs\hontech-vercel-supabase`).
3. Copy the frontend files from the prototype into the new repo:
   ```text
   vercel_supabase/
   ├── index.html              <-- Copied from frontend/index.html
   ├── favicon.png             <-- Copied from frontend/favicon.png
   ├── css/                    <-- Copied from frontend/css/
   ├── js/                     <-- Copied from frontend/js/
   └── assets/                 <-- Copied from frontend/assets/
   ```

---

### STEP 3: Apply the 2-Minute Stealth & Security Shield
In the new repository, add these exact files to keep Google and search engine crawlers out:

#### 1. In `index.html` (inside `<head>`):
```html
<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">
```

#### 2. Create `robots.txt` in the root:
```txt
User-agent: *
Disallow: /
```

#### 3. Create `vercel.json` in the root:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Robots-Tag", "value": "noindex, nofollow, noarchive" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

---

### STEP 4: Connect the Supabase Client in JavaScript
1. At the bottom of `index.html` (just before `js/app.js`), add the Supabase library:
   ```html
   <!-- Official Supabase Client SDK -->
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="js/supabaseConfig.js"></script>
   ```

2. Create `js/supabaseConfig.js`:
   ```javascript
   const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';

   const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
   ```

3. Replace or adapt the data calls in `app.js`:
   - **Load Jobs:**
     ```javascript
     async function loadCloudJobs() {
         const { data, error } = await supabase
             .from('jobs')
             .select('*')
             .eq('is_deleted', false)
             .order('created_at', { ascending: false });
         if (!error && data) {
             allJobs = data;
             renderStaffTables();
         }
     }
     ```
   - **Live Realtime TV Listener:**
     ```javascript
     supabase
         .channel('live-tv-queue')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
             loadCloudJobs(); // Instant TV refresh on vehicle status change!
         })
         .subscribe();
     ```

---

### STEP 5: Deploy to Vercel (~3 minutes)
1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **"Add New Project"** ➔ Select your **`hontech-vercel-supabase`** private repo.
3. Click **"Deploy"**.
4. Within 45 seconds, Vercel will give you a live production link: `https://hontech-vercel-supabase.vercel.app`.
5. Test the link on your mobile phone and laptop simultaneously to see live synchronization!

---

## 🛟 The "Safety Net": What if Something Goes Wrong?

If you ever run into a problem or hit a deadline crunch during the exploration:
- **Nothing is lost.**
- Your local PHP prototype in `CapstoneOfficial2_Development_Part-2-Hontech_Prototype_Process` is completely untouched and always works offline on:
  ```powershell
  php -S 0.0.0.0:8000 router.php
  ```
- You can simply switch back to presenting your local system with 100% confidence.

---

## 📂 Quick Reference to Related Documentation
- [`05_SECURITY_AND_RISK_PREVENTION_TECHNICAL_GUIDE.md`](./05_SECURITY_AND_RISK_PREVENTION_TECHNICAL_GUIDE.md) — Security rules & key protection.
- [`supabase_schema.sql`](./supabase_schema.sql) — Ready-to-run PostgreSQL database schema.
- [`04_PHP_TO_SUPABASE_MIGRATION_AND_LEARNING_ROADMAP.md`](./04_PHP_TO_SUPABASE_MIGRATION_AND_LEARNING_ROADMAP.md) — Side-by-side PHP vs Supabase code examples.
- [`02_FREE_TIER_LIMITS_BANDWIDTH_AND_STORAGE_ECONOMICS.md`](./02_FREE_TIER_LIMITS_BANDWIDTH_AND_STORAGE_ECONOMICS.md) — Free tier quotas and usage calculations.
