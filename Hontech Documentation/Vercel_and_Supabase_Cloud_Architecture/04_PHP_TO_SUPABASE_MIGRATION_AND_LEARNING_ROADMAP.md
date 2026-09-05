# PHP/MySQL to Supabase Serverless: Transition & Learning Roadmap

**Project:** HonTech AutoCenter — Web-Based Vehicle Intake & Queue Monitoring System  
**Document Series:** Cloud Architecture & Serverless Engineering  
**Version:** 1.0.0 (September 2026 Rollout)  

---

## 1. 🔍 Current State vs. Target Cloud State

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🏠 CURRENT ARCHITECTURE (PHP PDO + MySQL)                              │
│ Browser (Vanilla JS) ➔ HTTP Fetch ➔ PHP API Router ➔ MySQL Database    │
├────────────────────────────────────────────────────────────────────────┤
│ • Best for: Local Intranet in-shop hosting (Option A in Proposal).     │
│ • Strength: 100% offline-ready, complete business logic implemented.   │
│ • Requirement for Cloud: Needs a PHP/MySQL server (Render, Railway).   │
└────────────────────────────────────────────────────────────────────────┘

                                   ▼ (Transition)

┌────────────────────────────────────────────────────────────────────────┐
│ ⚡ TARGET SERVERLESS ARCHITECTURE (Vercel + Supabase)                  │
│ Browser (Vanilla JS) ➔ Supabase JS SDK ➔ Supabase Cloud PostgreSQL    │
├────────────────────────────────────────────────────────────────────────┤
│ • Best for: Modern Serverless Cloud hosting (Option B in Proposal).    │
│ • Strength: ₱0 server cost, instant live TV WebSockets, zero server OS.│
│ • Requirement: Transition data queries from PHP endpoints to JS SDK.   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 💻 Side-by-Side Code Learning Guide

Here is how common database actions translate from **PHP API Endpoints** to **Supabase JavaScript SDK**:

### A. Fetching Active Vehicle Intakes
* **Current PHP/MySQL Approach:**
  ```javascript
  const res = await apiRequest('/api/jobs');
  const jobs = res.data || res;
  ```
* **Supabase Serverless Approach:**
  ```javascript
  const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
  ```

---

### B. Creating a New Vehicle Intake
* **Current PHP/MySQL Approach:**
  ```javascript
  const newJob = await apiRequest('/api/jobs', {
      method: 'POST',
      body: { plate: 'NBD-1234', name: 'Juan Dela Cruz', category: 'PMS' }
  });
  ```
* **Supabase Serverless Approach:**
  ```javascript
  const { data, error } = await supabase
      .from('jobs')
      .insert([{
          job_id: 'WLK-' + Date.now().toString().slice(-4),
          plate: 'NBD-1234',
          name: 'Juan Dela Cruz',
          category: 'PMS',
          status: 'Waiting'
      }]);
  ```

---

### C. Updating Service Bay Allocation
* **Current PHP/MySQL Approach:**
  ```javascript
  await apiRequest(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      body: { status: 'Monitoring', bay_assigned: 1, location: 'Bay 1' }
  });
  ```
* **Supabase Serverless Approach:**
  ```javascript
  const { data, error } = await supabase
      .from('jobs')
      .update({ status: 'Monitoring', bay_assigned: 1, location: 'Bay 1' })
      .eq('id', jobId);
  ```

---

### D. Real-Time Waiting Lounge TV Broadcast
* **Current PHP/MySQL Approach:**
  * Requires continuous background long-polling or polling intervals (`setInterval(loadData, 5000)`).
* **Supabase Serverless Approach:**
  * Instant event-driven WebSocket push (~50ms latency):
  ```javascript
  supabase
      .channel('tv-queue-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, payload => {
          console.log('Live vehicle change detected:', payload);
          renderTvQueueDisplay(); // Re-renders the TV immediately!
      })
      .subscribe();
  ```

---

## 3. 🛡️ The 3-Stage Safe Transition Strategy

To ensure zero risk to your existing, working PHP/MySQL capstone codebase, follow this professional 3-stage strategy:

```
  ┌────────────────────────────────────────────────────────┐
  │ STAGE 1: Isolated 1-Page Sandbox Prototype             │
  │ • Build a simple `sandbox.html` connected to Supabase. │
  │ • Test live phone-to-TV syncing with zero risk.        │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │ STAGE 2: Adapter Pattern in `app.js`                   │
  │ • Create a data adapter: `if (USE_SUPABASE) ...`       │
  │ • Allows switching between PHP (Local) and Supabase.   │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │ STAGE 3: Final Production Rollout                      │
  │ • Full deployment on Vercel (`hontech.vercel.app`)     │
  │ • Ready for official client acceptance & defense!      │
  └────────────────────────────────────────────────────────┘
```

---

## 4. 🔑 Security Governance & Row-Level Security (RLS)

In Supabase, security rules are enforced at the database layer via **Row-Level Security (RLS)** policies:
1. **Public/Lounge TV Policy:** `SELECT` access only (Waiting Lounge TVs can view the queue but cannot edit/delete jobs).
2. **Service Advisor Policy:** `INSERT` and `UPDATE` access on active repair orders.
3. **Owner/Admin Policy:** Full administrative access, audit log exports, and performance reports.
