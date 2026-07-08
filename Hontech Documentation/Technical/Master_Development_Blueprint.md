# Master Development Blueprint & Roadmap

This document consolidates all previous roadmaps and outlines the strategic path to take the HonTech AutoCenter Operations System from its current prototype state to a fully structured, production-ready enterprise application.

---

## 🎯 Phase 1: Prototype Validation (Completed & Stable)

*Strategy: Keep everything in the simple HTML/JS stack for now to allow rapid iteration. Do not migrate to frameworks until testers finalize all requirements.*

**Completed Developments:**

- [x] **Developer Mailbox Simulator:** Built a local UI modal to intercept and view system emails (like OTPs) without needing a real Gmail account connected.
- [x] **Role & UI Polish:** Deprecated the standalone Technician role, merging all status updates, lift assignments, evaluations, and goal status triggers into the Service Advisor workflow. Added segregated SA tables (My Active Jobs vs Unassigned / Other Advisor Jobs) with dynamic claiming.
- [x] **Owner Dashboard Enhancements:** Added PMS Goal Success calculations, Success/Failure counters, and record log filter controls.
- [x] **Strict Formats & Role Restrictions:** Enforced 24-hour time formatting universally. Restricted Periodic Record Logs to Owner/Admin roles. Formatted contact numbers dynamically (09XX-XXX-XXXX). Revamped Assistant workflow for online bookings (Action remarks handling).

**Remaining Immediate To-Dos:**

- [ ] **Multi-Branch Implementation:** Ensure the vanilla prototype fully supports Branch segregation. Users (Service Advisors/Assistants) must only see and manage their branch's jobs/TV queues, while the Owner/Admin dashboard has access to a branch toggle to switch views or see aggregated metrics.
- [ ] **Mobile & Tablet Responsiveness Polish:** Audit and clean up layouts for mobile phone and tablet views since staff will access the system on the shop floor.
- [ ] **Client Presentation & Feedback Alignment (The "Lock-In"):** Present the working vanilla prototype to HonTech AutoCenter management and staff. Secure final approval on the workflows and UI layout to prevent future scope creep.
- [ ] **Frontend Modularization (Post-Approval Refactor):** *After* the client approves the prototype, safely split the massive `index.html` file into dedicated JS modules (`api.js`, `tv.js`, `dashboard.js`) and separate the CSS to make the codebase manageable for Phase 2.
- [] **Group QA Testing:** Verified core layouts and workflows locally.

---

## 🔒 Phase 2: Security & Backend Hardening

*Strategy: Before going public, we must secure the robust backend we have built.*

**Tasks to Complete:**

- [ ] **Input Validation & Sanitization:** Install `express-validator` to sanitize inputs, strip malicious tags, and prevent NoSQL injection.
- [ ] **Rate Limiting:** Configure `express-rate-limit` on authentication endpoints (Login, Forgot Password, OTP request) to prevent brute-force attacks.
- [ ] **Secure Session Cookies:** Ensure the JWT authentication cookie uses `httpOnly: true`, `secure: true` (HTTPS-only in production), and `sameSite: 'strict'` to mitigate XSS and CSRF risks.
- [ ] **CORS Origin Whitelisting:** Configure CORS middleware to only accept requests from trusted domains (e.g. localhost during dev, production domain when live).
- [ ] **Centralized Error Handling:** Write a global Express error handler middleware to clean up repetitive `try/catch` blocks in controllers and prevent database error dumps from leaking details to the client.
- [ ] **Automated Testing:** Install `Jest` and `Supertest` to mathematically prove the authentication and role limitations work.
- [ ] **Content Security Policy (CSP):** Configure Helmet to whitelist approved CDNs.
- [ ] **Fix OTP Leaks:** Remove OTP tokens from JSON responses (they must only be sent via email simulator).

---

## ☁️ Phase 3: Infrastructure & Deployment (Vanilla Production)

*Strategy: Move the stable vanilla HTML/JS/Node application from `localhost` to the internet using modern Cloud PaaS.*

- [ ] **Containerization (Docker Setup):** Create a `Dockerfile` for the backend and a `docker-compose.yml` to orchestrate Node.js + MongoDB. This guarantees environment consistency and network-level database isolation.
- [x] **Git Repository Sync:** Create the official GitHub repository and sync the source code.
- [ ] **Cloud Database:** Migrate local MongoDB to MongoDB Atlas (Free Tier) or run a persistent database container.
- [ ] **Backend Hosting:** Deploy the Node.js server to Render.com or Railway.app (directly via the Dockerfile).
- [ ] **Environment Secrets:** Configure `.env` variables securely in the cloud dashboard.
- [ ] **Real Email Integration:** Connect Resend, Brevo, or SendGrid for official OTP delivery.
- [ ] **Domain & SSL:** Purchase `hontech-autocenter.com` and ensure HTTPS is active.
- [ ] **Group Staging Testing:** Have the team log in to the staging link on mobile devices to test and verify the flows under load.
- [ ] **Staff Dry Run Simulation:** Conduct a 30-minute simulated business day for staff training and final client validation.

---

## 🏢 Phase 4: Version 2.0 & Expansion (Framework Migration & SQL)

*Strategy: Once the vanilla system is successfully deployed, tested by clients, and requires enterprise-scale expansion (like complex financial ledgers).*

- [ ] **Initialize Framework:** Keep the backend untouched. Create a new React application (via Vite or Next.js) to replace `frontend/index.html`.
- [ ] **Component Architecture:** Break the UI into SOLID React components (e.g., `<TVMonitor />`, `<WalkInForm />`, `<DailyIntakes />`).
- [ ] **Global State Management:** Implement Context API or Redux for handling the `allJobs` state cleanly.
- [ ] **SQL Migration:** Plan a transition from MongoDB to PostgreSQL for complex financial ledger transactions and inventory.
