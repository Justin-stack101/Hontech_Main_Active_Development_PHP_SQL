# Step-by-Step 15-Minute Vercel + Supabase Setup & Deployment Playbook

**Project:** HonTech AutoCenter — Web-Based Vehicle Intake & Queue Monitoring System  
**Document Series:** Cloud Architecture & Serverless Engineering  
**Version:** 1.0.0 (September 2026 Rollout)  

---

## 1. ⏱️ 15-Minute Deployment Roadmap

```
  [ STEP 1: Accounts ] ➔ [ STEP 2: Database ] ➔ [ STEP 3: Deploy Frontend ] ➔ [ STEP 4: Live TV Sync ]
    (GitHub Sign-in)        (Supabase SQL)          (Vercel Git Import)          (WebSockets Ready!)
```

---

## 2. 🚀 Step 1: Create Free Cloud Accounts (1 Minute)

1. **Supabase:** Go to [supabase.com](https://supabase.com) $\to$ Click **"Start your project"** $\to$ Sign in using your **GitHub Account**.
2. **Vercel:** Go to [vercel.com](https://vercel.com) $\to$ Click **"Sign Up"** $\to$ Select **"Continue with GitHub"** and authorize the connection.

---

## 3. 🗄️ Step 2: Create Your Cloud Database on Supabase (3 Minutes)

1. In Supabase, click **"New Project"**.
   * **Organization:** Select your default personal organization.
   * **Name:** `hontech-autocenter-cloud`
   * **Database Password:** Enter a secure password (e.g. `HonTech2026Secure!`).
   * **Region:** Select **Southeast Asia (Singapore)** for the lowest latency in the Philippines (< 35ms).
2. Click **"Create new project"** (Provisioning takes ~60 seconds).
3. In the left sidebar, click **"SQL Editor"** $\to$ **"New Query"**, paste this SQL script, and click **"Run"**:

```sql
-- 1. Create Jobs Queue Table
CREATE TABLE IF NOT EXISTS public.jobs (
    id BIGSERIAL PRIMARY KEY,
    job_id TEXT NOT NULL UNIQUE,
    plate TEXT NOT NULL,
    name TEXT NOT NULL,
    vehicle TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'PMS',
    lane_type TEXT NOT NULL DEFAULT 'Flexible',
    status TEXT NOT NULL DEFAULT 'Waiting',
    location TEXT NOT NULL DEFAULT 'Waiting Area',
    bay_assigned INT NULL,
    sa_name TEXT NOT NULL DEFAULT 'Unassigned',
    date_received DATE NOT NULL DEFAULT CURRENT_DATE,
    arrival_time TIME NOT NULL DEFAULT CURRENT_TIME,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Realtime Broadcasting on the Jobs Table
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
```

4. Go to **Project Settings $\to$ API** and copy:
   * **Project URL:** `https://your-project-id.supabase.co`
   * **Anon (Public) Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6...`

---

## 4. 🌐 Step 3: Deploy Frontend on Vercel (2 Minutes)

1. In your Vercel Dashboard, click **"Add New..." $\to$ "Project"**.
2. Under "Import Git Repository", find your GitHub repository and click **"Import"**.
3. **Configure Project:**
   * **Project Name:** `hontech-autocenter-queue`
   * **Root Directory:** If your HTML is inside the `frontend` folder, click **Edit** and set `frontend`.
4. Click the blue **"Deploy"** button.
5. In **20 to 40 seconds**, Vercel will complete the build and display your **Live Free HTTPS URL**:
   `https://hontech-autocenter-queue.vercel.app`

---

## 5. ⚡ Step 4: Connect Realtime WebSockets in Frontend JS

Include the official Supabase JS library in your HTML:

```html
<!-- Supabase Realtime Client Library -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
    // 1. Initialize Supabase Client
    const supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co';
    const supabaseKey = 'YOUR_ANON_PUBLIC_KEY';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // 2. Listen for Real-Time Queue Updates (For Waiting Lounge TV)
    supabase
        .channel('public:jobs')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, payload => {
            console.log('Real-Time Queue Event Received:', payload);
            // Instantly re-render TV queue without page refresh!
            if (typeof renderTvQueueDisplay === 'function') {
                renderTvQueueDisplay();
            }
        })
        .subscribe();
</script>
```

---

## 6. 🎉 Verification & Multi-Device Testing

1. Open `https://hontech-autocenter-queue.vercel.app` on your smartphone and laptop simultaneously.
2. Update a vehicle status on the laptop $\to$ Watch your phone screen update in **real-time (~50 milliseconds)**!
