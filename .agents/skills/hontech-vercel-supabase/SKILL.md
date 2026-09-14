---
name: hontech-vercel-supabase
description: Architectural rules, security guidelines, and step-by-step workflow for migrating and developing the HonTech AutoCenter Operations System on Vercel and Supabase cloud infrastructure.
---

# HonTech Vercel & Supabase Cloud Migration Skill

This skill defines the technical standards, security directives, and workflow rules for deploying the HonTech Queue Monitoring System to **Vercel** (Global Edge Frontend) and **Supabase** (Serverless PostgreSQL + Realtime WebSockets).

---

## 🏗️ 1. Architecture & Repository Separation

- **Primary Local Prototype**: Stays in `CapstoneOfficial2_Development_Part-2-Hontech_Prototype_Process` powered by PHP 8.0 and MySQL (`3307`). **NEVER** delete or break the local PHP backend.
- **Target Cloud Deployment**: Developed in an isolated dedicated repository (`vercel_supabase` or `hontech-vercel-supabase`).
- **Data Flow in Cloud**:
  ```
  Browser (Vanilla JS) ➔ Supabase JS SDK (@supabase/supabase-js) ➔ Supabase Cloud PostgreSQL
                                    ▲
                      Realtime WebSockets (~50ms push)
  ```

---

## 🔒 2. Ironclad Security & API Key Directives

1. **Key Separation**:
   - **`SUPABASE_ANON_KEY`**: Public client key. Safe for browser JavaScript. Bound by Row-Level Security (RLS).
   - **`SUPABASE_SERVICE_ROLE_KEY`**: **STRICTLY PROHIBITED** in any client file, frontend JavaScript, or public repository. Bypasses all security.
2. **Stealth Search Engine Shield**:
   - Every public deployment MUST include `<meta name="robots" content="noindex, nofollow">` in `<head>`.
   - Must include a `robots.txt` in the root with:
     ```txt
     User-agent: *
     Disallow: /
     ```
   - Must configure `vercel.json` with `X-Robots-Tag: noindex, nofollow, noarchive`.
3. **Repository Visibility**: Always keep both the prototype and cloud repositories set to **PRIVATE** on GitHub.

---

## 🗄️ 3. Database & Row-Level Security (RLS) Rules

- **Schema Location**: Always reference `Hontech Documentation/Vercel_and_Supabase_Cloud_Architecture/supabase_schema.sql`.
- **Row-Level Security**:
  - RLS must remain `ENABLED` on all public tables (`jobs`, `users`, `job_audit_logs`, `express_lane_issues`).
  - **No Hard Deletes**: The `jobs` table must NOT have a public `DELETE` policy. All removals must be soft deletes (`is_deleted = true`).
- **Realtime WebSockets**:
  - Must explicitly enable publication: `ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;`.
  - Always clean up channel subscriptions (`supabase.removeChannel(channel)`) when navigating or reinitializing.

---

## 💻 4. Frontend Data Adapter Pattern

When refactoring data calls in `frontend/js/app.js`:
- Wrap data calls in an adapter or conditional switch (`window.HONTECH_MODE = 'SUPABASE' | 'LOCAL_PHP'`).
- **Fetch Jobs**:
  ```javascript
  const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
  ```
- **Insert Intake**:
  ```javascript
  const { data, error } = await supabase
      .from('jobs')
      .insert([newJobData]);
  ```
- **Update Bay / Status**:
  ```javascript
  const { data, error } = await supabase
      .from('jobs')
      .update(patchData)
      .eq('id', jobId);
  ```

---

## 🧪 5. Testing & Verification Standard

Before approving any cloud deployment:
1. **Multi-Device Test**: Open Waiting Lounge TV on a desktop and submit a vehicle intake on a mobile device; verify update reflects in `< 100ms`.
2. **Offline Fallback**: Verify that setting `HONTECH_MODE = 'LOCAL_PHP'` allows the app to run completely offline on local XAMPP/PHP.
3. **Robots Check**: Verify visiting `/robots.txt` returns `Disallow: /`.
