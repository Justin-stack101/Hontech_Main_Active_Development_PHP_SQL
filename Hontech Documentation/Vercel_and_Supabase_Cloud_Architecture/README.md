# HonTech Cloud Architecture & Serverless Engineering Hub

Welcome to the **Vercel & Supabase Cloud Documentation Hub** for the **HonTech AutoCenter Web-Based Vehicle Intake & Queue Monitoring System**.

> [!IMPORTANT]
> **Status as of 2026-09-22: Not started.** The `vercel_supabase` / `hontech-vercel-supabase` repo described below has not been created yet. Current priority is hardening the local PHP/MySQL prototype's authentication and account recovery — tracked in [`../Technical/02_Architecture_and_Engineering/HONTECH_SECURITY_IMPLEMENTATION_STATUS_AND_NEXT_STEPS.md`](../Technical/02_Architecture_and_Engineering/HONTECH_SECURITY_IMPLEMENTATION_STATUS_AND_NEXT_STEPS.md). This whole document series stays accurate as a **plan to execute later** ("someday," per project owner) — start from [`06_FUTURE_STEP_BY_STEP_ACTION_PLAN.md`](./06_FUTURE_STEP_BY_STEP_ACTION_PLAN.md) when that day comes.

---

## 📚 Complete Document Series Index

| Document | Title | Core Purpose |
| :--- | :--- | :--- |
| [`01_VERCEL_AND_SUPABASE_ARCHITECTURE_OVERVIEW.md`](./01_VERCEL_AND_SUPABASE_ARCHITECTURE_OVERVIEW.md) | **Architecture Overview** | Deep technical breakdown of Zero-Config Serverless vs Traditional AWS EC2, Edge CDN, and Realtime WebSockets. |
| [`02_FREE_TIER_LIMITS_BANDWIDTH_AND_STORAGE_ECONOMICS.md`](./02_FREE_TIER_LIMITS_BANDWIDTH_AND_STORAGE_ECONOMICS.md) | **Free-Tier Economics & Limits** | Explains 500 MB DB disk storage vs 100 GB bandwidth, why YouTube embeds use 0 MB, and why HonTech uses < 2% of quotas. |
| [`03_STEP_BY_STEP_SETUP_AND_DEPLOYMENT_PLAYBOOK.md`](./03_STEP_BY_STEP_SETUP_AND_DEPLOYMENT_PLAYBOOK.md) | **15-Minute Setup Playbook** | Step-by-step instructions from creating free cloud accounts to deploying a live HTTPS website with real-time TV WebSockets. |
| [`04_PHP_TO_SUPABASE_MIGRATION_AND_LEARNING_ROADMAP.md`](./04_PHP_TO_SUPABASE_MIGRATION_AND_LEARNING_ROADMAP.md) | **PHP to Supabase Transition Roadmap** | Side-by-side code comparison, transition roadmap, and 3-stage safe migration strategy. |
| [`05_SECURITY_AND_RISK_PREVENTION_TECHNICAL_GUIDE.md`](./05_SECURITY_AND_RISK_PREVENTION_TECHNICAL_GUIDE.md) | **Security, Zero-Risk Architecture & Cloud Safety** | Key separation (`anon` vs `service_role`), 2-minute stealth crawler shield (`noindex`, `robots.txt`), and RLS data lockdown. |
| [`06_FUTURE_STEP_BY_STEP_ACTION_PLAN.md`](./06_FUTURE_STEP_BY_STEP_ACTION_PLAN.md) | **Future Action Plan & Step-by-Step Execution** | Complete execution guide for creating the dedicated `vercel_supabase` private repo, connecting Supabase, and deploying safely. |
| [`07_GOOGLE_AUTH_VERCEL_AND_SUPABASE_INTEGRATION_SPECIFICATION.md`](./07_GOOGLE_AUTH_VERCEL_AND_SUPABASE_INTEGRATION_SPECIFICATION.md) | **Google Auth, Vercel & Supabase Cloud Integration** | Direct technical mapping from Part 3 (`google auth_september`) to Vercel and Supabase cloud OAuth, email whitelisting trigger, and SMTP relay. |
| [`supabase_schema.sql`](./supabase_schema.sql) | **Production-Ready PostgreSQL Schema** | Copy-paste SQL script containing tables (`jobs`, `users`, `audit_logs`, `express_issues`), indexes, RLS policies, seeds, and Realtime. |

---

## 🎯 Key Takeaways for Developers & Stakeholders
1. **₱0.00 Monthly Software & Server Cost:** Zero credit card required; permanent free tier covers all daily shop operations.
2. **Sub-Second Global Performance:** Vercel Global Edge CDN serves pages in milliseconds.
3. **Live Waiting Lounge Synchronization:** Built-in Supabase WebSockets push new vehicle statuses to lounge TVs in ~50ms without page refreshing.
4. **Enterprise Google Authentication:** Native Google OAuth provider backed by PostgreSQL triggers to ensure only authorized personnel can log in.
5. **100% Isolated Safety:** Prototype progress in the local PHP/MySQL repository remains untouched while exploring cloud capabilities in a separate private repository.
