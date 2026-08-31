# 🧪 HonTech Sandbox PoC: Vercel + Supabase Free-Tier Setup Guide
**Document Version:** `1.0.0`  
**Project:** HonTech AutoCenter Operations System  
**Branch:** `branch2-Security-Account-Recovery`  
**Classification:** Proof of Concept (PoC) & Sandbox Testing Playbook  

---

## 1. 📌 Overview & Sandbox Strategy

Creating a **separate Proof of Concept (PoC) repository** to test **Vercel + Supabase Free Tiers** is the industry gold standard for **risk-free software evaluation**.

```
┌────────────────────────────────────────────────────────┐
│ 🛡️ PRIMARY PRODUCTION REPO (HonTech PHP/MySQL)         │
│ • Branch: `branch2-Security-Account-Recovery`          │
│ • 100% Stable, Protected, and Working Locally          │
└────────────────────────────────────────────────────────┘
                           ▲
                           │ Isolated (Zero Risk)
                           ▼
┌────────────────────────────────────────────────────────┐
│ 🧪 SANDBOX POC REPO (e.g. `hontech-cloud-poc`)         │
│ • Vercel Frontend + Supabase PostgreSQL Realtime       │
│ • Free Tier Sandbox for Client Demonstration           │
└────────────────────────────────────────────────────────┘
```

---

## 2. 🎁 What the 100% Free Tiers Include (₱0.00 / No Credit Card Needed)

Both Vercel and Supabase provide **true permanent free tiers** that require **NO credit card**:

| Service | Free Tier Allowance | What You Get |
| :--- | :--- | :--- |
| **Vercel** (Hobby Plan) | **$0 / month forever** | • Unlimited preview deployments<br>• Automated HTTPS/SSL certificates<br>• Custom domains (e.g. `hontech-demo.vercel.app`)<br>• Fast Global Edge CDN |
| **Supabase** (Free Tier) | **$0 / month forever** | • 500 MB PostgreSQL Database Storage<br>• Up to 2 Free Cloud Projects<br>• 50,000 Monthly Active Users<br>• **Native Realtime WebSockets** (instant TV queue pushes)<br>• Web-based Table Editor & SQL Console |

---

## 3. 🚀 Step-by-Step 15-Minute Sandbox Setup Guide

### Step 1: Create Free Cloud Accounts
1. **Supabase:** Go to [supabase.com](https://supabase.com) $\to$ Sign in with your **GitHub Account**. Click **"New Project"** (e.g. `hontech-poc-marikina`).
2. **Vercel:** Go to [vercel.com](https://vercel.com) $\to$ Sign up with your **GitHub Account**.

---

### Step 2: Create a Minimal Sandbox Table in Supabase
In your Supabase project dashboard, open the **SQL Editor** and run this simple script to create a sample job queue table with Realtime enabled:

```sql
-- 1. Create a minimal Jobs table
CREATE TABLE poc_jobs (
    id BIGSERIAL PRIMARY KEY,
    plate_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    service_type TEXT NOT NULL DEFAULT 'PMS',
    bay_number TEXT NOT NULL DEFAULT 'Bay 1',
    status TEXT NOT NULL DEFAULT 'In Progress',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Supabase Realtime Broadcasting
ALTER PUBLICATION supabase_realtime ADD TABLE poc_jobs;

-- 3. Insert initial test vehicle
INSERT INTO poc_jobs (plate_number, customer_name, service_type, bay_number, status)
VALUES ('ABC 1234', 'Juan Dela Cruz', 'PMS (Periodic Maintenance)', 'Bay 1', 'In Progress');
```

---

### Step 3: Minimal 1-File Working PoC (`index.html`)

Create a new standalone folder on your computer (e.g., `C:\xampp\htdocs\hontech-cloud-poc\index.html`) with this minimal test code:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HonTech Cloud PoC (Vercel + Supabase Realtime)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Official Supabase Client CDN -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-6">
    <div class="max-w-4xl mx-auto space-y-6">
        
        <!-- Header -->
        <div class="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex items-center justify-between">
            <div>
                <h1 class="text-xl font-black uppercase text-white tracking-wide">HonTech Cloud Queue PoC</h1>
                <p class="text-xs text-slate-400">Live Realtime Sync via Supabase WebSockets & Vercel</p>
            </div>
            <span class="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full animate-pulse">
                ⚡ Realtime Connected
            </span>
        </div>

        <!-- Add Vehicle Form -->
        <div class="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
            <h2 class="text-sm font-bold uppercase text-slate-300">Fast Vehicle Dispatch Demo</h2>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input id="poc-plate" type="text" placeholder="Plate (e.g. NBD 9988)" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white outline-none focus:border-cyan-400">
                <input id="poc-name" type="text" placeholder="Customer Name" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-cyan-400">
                <button onclick="addPocJob()" class="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase text-xs rounded-lg py-2 transition shadow-md cursor-pointer">
                    + Dispatch to Queue
                </button>
            </div>
        </div>

        <!-- Live Realtime TV Queue Cards -->
        <div class="space-y-3">
            <h2 class="text-sm font-bold uppercase text-slate-300">Live Workshop Bay Queue</h2>
            <div id="poc-queue-list" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- Cards will render dynamically -->
            </div>
        </div>

    </div>

    <script>
        // 1. Initialize Supabase Client (Paste your keys from Supabase Dashboard -> Settings -> API)
        const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
        const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // 2. Fetch and render initial jobs
        async function fetchJobs() {
            const { data, error } = await supabase.from('poc_jobs').select('*').order('id', { ascending: false });
            if (error) return console.error(error);
            renderQueue(data);
        }

        // 3. Render Queue Cards
        function renderQueue(jobs) {
            const container = document.getElementById('poc-queue-list');
            if (!jobs || jobs.length === 0) {
                container.innerHTML = `<p class="text-xs text-slate-500 italic">No vehicles in queue.</p>`;
                return;
            }
            container.innerHTML = jobs.map(j => `
                <div class="bg-slate-800/90 border border-slate-700 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div>
                        <span class="font-mono font-black text-cyan-400 text-sm tracking-wider">${j.plate_number}</span>
                        <p class="text-xs font-bold text-white">${j.customer_name}</p>
                        <p class="text-[10px] text-slate-400">${j.service_type} • ${j.bay_number}</p>
                    </div>
                    <span class="text-[10px] font-bold uppercase px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ${j.status}
                    </span>
                </div>
            `).join('');
        }

        // 4. Add new job
        async function addPocJob() {
            const plate = document.getElementById('poc-plate').value.trim();
            const name = document.getElementById('poc-name').value.trim();
            if (!plate || !name) return alert('Please enter plate and name');

            const { error } = await supabase.from('poc_jobs').insert([{ plate_number: plate, customer_name: name }]);
            if (error) alert(error.message);
            document.getElementById('poc-plate').value = '';
            document.getElementById('poc-name').value = '';
        }

        // 5. SUPABASE REALTIME WEBSOCKET LISTENER (The Magic!)
        supabase.channel('custom-all-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'poc_jobs' }, (payload) => {
                console.log('Realtime push received:', payload);
                fetchJobs(); // Instantly update UI without page reload!
            })
            .subscribe();

        // Initial Load
        fetchJobs();
    </script>
</body>
</html>
```

---

## 4. 📱 How to Demonstrate the Live Demo to Your Client

1. Push your `hontech-cloud-poc` repository to GitHub.
2. In Vercel, click **"Add New Project"** $\to$ Select `hontech-cloud-poc` $\to$ Click **Deploy**.
3. In **30 seconds**, Vercel gives you a live public link (e.g. `https://hontech-cloud-poc.vercel.app`).
4. **The "Wow" Client Presentation Test:**
   - Open the Vercel link on your **laptop** (acting as the TV Bay screen).
   - Open the same Vercel link on your **phone** (acting as the Service Advisor).
   - Tap **"Dispatch to Queue"** on your phone.
   - Watch the vehicle **instantly appear on the laptop screen in milliseconds** without refreshing!

---

## 5. 🎯 Decision Outcome

- **If Client is Impressed & Chooses Cloud:** You can proceed with migrating HonTech features onto this tested foundation.
- **If Client Prefers Local XAMPP:** You close the sandbox and deploy your existing 100% complete PHP/MySQL codebase on `branch2-Security-Account-Recovery` with zero lost time!
