# HONTECH AUTOCENTER
## Developer Engineering Manual: Dual-Repository Workflow, Adapter Pattern & Testing Protocol
### Architecture Isolation, Data Layer Abstraction, Testing Suite & Deployment Decision Tree

---

**Prepared for:** HonTech AutoCenter Systems Development Team  
**Author:** Justin Nolasco J. *(Lead Systems Developer & Technical Implementation)*  
**Architect:** Mary Dayne Villas T. *(Lead System Architect & Designer)*  
**QA & Documentation:** Catherine Ramos G. *(Technical Documentation & QA Lead)*  
**Capstone Adviser:** Mr. Ar-Jay C. Agbayani  
**Date:** September 2, 2026  
**Document Version:** 1.0 (Internal Engineering Standard)

---

## 1. Dual-Repository Sandboxing Architecture

To ensure zero risk to existing production code while exploring cloud capabilities, the development workflow strictly separates the core production system from the cloud prototype:

```
                                 [ JUSTIN NOLASCO J. ]
                               (Lead Systems Developer)
                                          │
            ┌─────────────────────────────┴─────────────────────────────┐
            ▼                                                           ▼
┌──────────────────────────────────────────┐ ┌──────────────────────────────────────────┐
│ 🛡️ REPOSITORY 1: PRODUCTION SYSTEM       │ │ 🧪 REPOSITORY 2: CLOUD SOLUTIONS ENGINE  │
│ `Hontech_Main_Active_Development_PHP_SQL`│ │ `hontech-cloud-vercel-supabase`          │
├──────────────────────────────────────────┤ ├──────────────────────────────────────────┤
│ • Full Stack: PHP PDO + MySQL + JS       │ │ • Serverless: Vercel CDN + Supabase DB   │
│ • Express 2H SLA + Audit History Modal   │ │ • Live Realtime WebSocket broadcast      │
│ • Local Intranet XAMPP (192.168.1.100)   │ │ • Live HTTPS URL: `hontech.vercel.app`   │
│ • OR Standard Cloud VPS (0 code refactor)│ │ • ₱0.00 / Month Permanent Free Tier      │
│ • Git: `branch2-Security-Account-Recovery│ │ • Git: `main` (Isolated cloud repo)      │
└──────────────────────────────────────────┘ └──────────────────────────────────────────┘
```

---

## 2. Repository 1: Primary Production Engine (`Hontech_Main_Active_Development_PHP_SQL`)

* **Primary Purpose:** Official capstone production codebase containing the complete business logic, RBAC, 2-Hour Express PMS SLA alerts, audit trails, and claim stub printing.
* **Dual Deployment Capability (No Code Refactoring Needed):**
  * **Local Intranet Mode:** Placed on the shop's local Windows Server PC inside `C:\xampp\htdocs\...`. Accessed at `http://192.168.1.100/frontend/index.html`.
  * **Standard Cloud Mode:** Uploaded directly to any PHP/MySQL cloud host (e.g. Railway, Render, DigitalOcean, Hostinger). Runs on standard HTTPS (`https://app.hontechautocenter.com`) with **0 code changes**.
* **Branch Strategy:**
  * Active development: `branch2-Security-Account-Recovery`
  * Stable client release: `main`

---

## 3. Repository 2: Cloud Solutions Engine (`hontech-cloud-vercel-supabase`)

* **Primary Purpose:** An isolated, dedicated cloud repository used to run the serverless cloud version on Vercel + Supabase without touching or risking the primary PHP/MySQL production code.
* **Tech Stack:**
  * Frontend: Static HTML5, Tailwind CSS, Vanilla JavaScript.
  * Backend: Supabase PostgreSQL Realtime (`@supabase/supabase-js`).
  * Hosting: Vercel Global Edge Network.
* **Cost:** ₱0.00 forever (No credit card required).

---

## 4. The 3-Step Simple Code Transition Process (The Adapter Pattern)

If the client chooses Cloud Solutions, the code transition is straightforward because the frontend and backend are completely decoupled:

```
[ STEP 1: Initialize New Cloud Repository ]
  • Create `hontech-cloud-vercel-supabase` on GitHub.
  • Copy over 100% of the Frontend UI (`index.html`, CSS, icons, modals, and tables).
  • Zero local hosting code is deleted or removed from Repo 1.
              │
              ▼
[ STEP 2: Swap the Data Layer Only (Adapter Pattern) ]
  • Keep 100% of the UI design, Express SLA overdue badges, and modal popups.
  • Paste Supabase Project URL & Anon Key in the client configuration.
  • Replace PHP `fetch('api/jobs.php')` calls with `supabase.from('jobs').select()` or Realtime WebSockets.
              │
              ▼
[ STEP 3: Execute Formal Unit Testing Suite & Deploy 🧪 ]
  • Run comprehensive unit tests to verify all 4 roles and real-time syncing.
  • Connect repo to Vercel for 30-second automated worldwide deployment.
```

---

## 5. Formal Unit Testing & Functionality Verification Matrix

Before client handover or capstone defense, the developer executes the following 4 verification test cases:

| Test Case | Target Feature | Procedure | Expected Pass Criteria |
| :--- | :--- | :--- | :--- |
| **Test 1: Realtime Push** | Waiting Lounge TV | Add vehicle on smartphone as SA | Vehicle appears on TV in **$\le 100\text{ ms}$** without refreshing page. |
| **Test 2: Express 2H SLA** | Express Overdue Badge | Run test vehicle with arrival > 120m ago | Dynamic `⚠️ Express 2H Limit Exceeded` badge renders; Delay Report modal saves reason. |
| **Test 3: RBAC Isolation** | 4-Role Permissions | Log in as SA, Admin, Assistant, Owner | SAs restricted to intake; Admins restricted to branch; Owner has global rollup. |
| **Test 4: Claim Stub Print** | Receipt Generation | Click "Print Claim Stub" on active job | Generates 80mm thermal receipt & formatted printable PDF with vehicle barcode. |

---

## 6. Developer Hardware Decision & Deployment Flowchart

```
                 [ STEP 1: CLIENT HARDWARE PROCUREMENT IN GILMORE ]
                                          │
                                          ▼
                      [ Did client buy Front Desk & SA Screens? ]
                                          │
                                          ▼
                      [ Is there budget left for a Server PC? ]
                                          │
                       ┌──────────────────┴──────────────────┐
                       ▼ YES                                 ▼ NO
      [ OPTION A: LOCAL INTRANET ]               [ OPTION B: CLOUD HOSTING ]
      • Install XAMPP on Server PC               • Launch Repo 2 on Vercel/Supabase
      • Deploy Repo 1 (PHP + MySQL)              • OR Deploy Repo 1 on Cloud PHP host
      • Set Static IP 192.168.1.100              • ₱0 Server Hardware Needed
      • Connect via Shop Wi-Fi & LAN             • Live worldwide via HTTPS in 15 mins
```

---

## 7. Developer Best Practices & Quality Checklist

1. **Defensive DOM Operations:** Always verify element existence (`if (document.getElementById('...'))`) before accessing properties to prevent uncaught runtime errors during role switching.
2. **Cache Busting Rule:** Always increment the script query version in `frontend/index.html` (e.g., `js/app.js?v=4.39`) when updating JavaScript logic.
3. **Repository Isolation:** Never mix Supabase sandbox experimental files into the primary PHP/MySQL repository; keep them in their separate GitHub repository (`hontech-cloud-vercel-supabase`) for clean version control.
