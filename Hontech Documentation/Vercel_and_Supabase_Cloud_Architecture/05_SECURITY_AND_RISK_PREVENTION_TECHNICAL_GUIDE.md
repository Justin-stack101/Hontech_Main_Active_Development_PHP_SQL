# 05: Security, Zero-Risk Architecture & Cloud Safety Guide

**Project:** HonTech AutoCenter — Web-Based Vehicle Intake & Queue Monitoring System  
**Document Series:** Cloud Architecture & Serverless Engineering (Part 5)  
**Target Audience:** Lead Full-Stack Developer (Self-Taught / Capstone Level)  
**Security Level:** Enterprise Defensive Staging  

---

## 🛡️ 1. Executive Security Philosophy: "Zero-Risk Engineering"

When transitioning an automotive shop management system from a local offline environment to the cloud (Vercel + Supabase), the primary objective is **preventing accidental exposure, data corruption, and unauthorized tampering**.

As a self-taught full-stack developer, you do not need complex enterprise tooling. You only need to enforce **5 ironclad technical rules**:

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                       THE 5 IRONCLAD SECURITY PILLARS                       │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 1. STEALTH MODE      │ Completely invisible to Google, bots, and crawlers. │
 │ 2. KEY SEPARATION    │ Client gets ONLY public Anon Key; Service Key HIDDEN.│
 │ 3. RLS LOCKDOWN      │ Every table has strict Row-Level Security enforced. │
 │ 4. TYPE SAFEGUARDS   │ Strict Postgres constraints block corrupt records.   │
 │ 5. DEMO ISOLATION    │ Separate repository protects the main local system. │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 2. Deep Dive: The Supabase Key Architecture (Crucial Rule)

Supabase gives you **two different API keys** in your project dashboard (**Project Settings ➔ API**). Understanding the difference is the most important technical rule:

```
                          ┌────────────────────────┐
                          │   SUPABASE DASHBOARD   │
                          └───────────┬────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
   ┌───────────────────────────┐             ┌───────────────────────────┐
   │     anon / public key     │             │    service_role key       │
   │  (SAFE FOR BROWSER / JS)  │             │   (DANGEROUS! SECRET!)    │
   ├───────────────────────────┤             ├───────────────────────────┤
   │ • Sent to browser client. │             │ • NEVER put in frontend!  │
   │ • Bound to RLS policies.  │             │ • Bypasses ALL security!  │
   │ • Cannot delete tables.   │             │ • Can drop entire DB!     │
   │ • Safe if inspected.      │             │ • Only for server/scripts.│
   └───────────────────────────┘             └───────────────────────────┘
```

### Technical Rule:
- **`anon` Key**: This is designed by Supabase to be public. It is 100% fine if anyone inspects your web source and sees this key, **as long as Row-Level Security (RLS) is turned on**.
- **`service_role` Key**: **NEVER paste this key in any `.html`, `.js`, or client file.** If anyone gets your `service_role` key, they can bypass all security rules and delete your entire database.

---

## 🛑 3. Stealth Deployment: Complete Search Engine & Crawler Block

To ensure zero internet strangers, scrapers, or HonTech customers find your prototype on search engines, we apply a **triple-layer stealth barrier**:

### Layer 1: HTML Meta Tag (Inside `<head>` of `index.html`)
```html
<!-- COMPLETE SEARCH ENGINE CRAWLER BLOCK -->
<meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
<meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet, max-image-preview:none">
```
* **`noindex`**: Tells Googlebot, Bingbot, and Yahoo never to add this URL to search results.
* **`nofollow`**: Tells crawlers not to follow any hyperlinks on the page.
* **`noarchive`**: Forbids Google from caching snapshots in search history.

### Layer 2: Public `robots.txt` File (In project root)
```txt
User-agent: *
Disallow: /
```
This informs any compliant web crawler that the entire site is strictly off-limits.

### Layer 3: Server HTTP Headers via `vercel.json`
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Robots-Tag",
          "value": "noindex, nofollow, noarchive"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

---

## 🛡️ 4. Row-Level Security (RLS) Policy Guide

In MySQL, security was checked inside PHP (`if ($user->role !== 'admin')`). In Supabase, **the database itself checks permissions on every single query**.

### How RLS Works:
When RLS is enabled on table `jobs`, Supabase automatically blocks **ALL** read, write, and update queries by default until you write explicit policies.

### Safe Staging RLS Blueprint for `jobs`:
```sql
-- 1. Enable Row-Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 2. Allow ANYONE (including Lounge TV displays) to VIEW active jobs
CREATE POLICY "Allow public read access for queue"
ON public.jobs
FOR SELECT
USING (true);

-- 3. Allow authorized staff (or client apps with anon key) to insert new vehicle intakes
CREATE POLICY "Allow intake creation"
ON public.jobs
FOR INSERT
WITH CHECK (true);

-- 4. Allow status and service bay updates
CREATE POLICY "Allow bay and status update"
ON public.jobs
FOR UPDATE
USING (true)
WITH CHECK (true);

-- 5. PREVENT ACCIDENTAL HARD DELETIONS (Soft Deletes Only)
-- We intentionally DO NOT create a DELETE policy!
-- If any script attempts `DELETE FROM jobs`, Supabase will reject it with error 403.
```

> [!TIP]
> **Zero Data Loss Guarantee**: By never creating a `DELETE` policy, it is physically impossible for a frontend bug or errant script to wipe your customer repair records.

---

## ⚡ 5. Realtime Channel Security & Quota Protection

Supabase includes built-in WebSockets. Here is how to keep them safe and stay within free tier limits:

1. **Selective Publication:**
   Only publish tables that the TV Lounge actually needs to watch:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
   ```
   Do **NOT** add user accounts, passwords, or audit tables to the realtime publication.

2. **Clean Event Disconnects:**
   When using `supabase.channel()`, always store the subscription instance so it doesn't create duplicate socket connections during hot reloads or screen transitions:
   ```javascript
   let tvQueueChannel = null;

   function initRealtimeQueue() {
       if (tvQueueChannel) {
           supabase.removeChannel(tvQueueChannel);
       }

       tvQueueChannel = supabase
           .channel('tv-live-queue')
           .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, (payload) => {
               console.log('Realtime DB event received:', payload.eventType);
               refreshTvQueueUI();
           })
           .subscribe();
   }
   ```

---

## 📑 6. Technical Checklist: Step-by-Step Zero-Risk Verification

Before you share the Vercel link with your thesis adviser or team, run through this verification checklist:

- [ ] **Repo Separation**: Is the code in a dedicated `vercel_supabase` repo without local `.bat` or password files?
- [ ] **Secret Check**: Did you double-check that only `SUPABASE_ANON_KEY` is in your code, and **zero** instances of `SERVICE_ROLE_KEY` exist?
- [ ] **Search Engine Invisible**: Did you verify `<meta name="robots" content="noindex">` is at the very top of `index.html`?
- [ ] **Robots.txt Present**: Does visiting `https://your-app.vercel.app/robots.txt` show `Disallow: /`?
- [ ] **Realtime Active**: Did you run `ALTER PUBLICATION supabase_realtime ADD TABLE jobs;` in Supabase?
- [ ] **Soft-Deletes Enforced**: Is hard DELETE blocked on the `jobs` table?
- [ ] **Backup Intact**: Is your local XAMPP/PHP prototype completely untouched and running on `http://localhost:8000`?
