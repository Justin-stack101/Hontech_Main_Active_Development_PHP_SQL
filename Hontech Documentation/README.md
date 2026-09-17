# 📚 HonTech AutoCenter Operations System — Master Documentation Hub

**Document Version:** `v3.1.0-Organized-Structure`  
**Classification:** Master Architectural & Operational Documentation Hub  
**Active Working Branch:** `prototype_process`  
**Target Repository:** `Justin-stack101/Hontech_Main_Active_Development_PHP_SQL`  
**Lead Developers & Architects:** Justin Nolasco J., Catherine Ramos G., Mary Dayne Villas T.  
**Advisory Oversight:** Mr. Ar-Jay C. Agbayani *(Faculty Capstone Adviser)*  
**Client Partner:** HonTech AutoCenter Operations Team  

---

## 🧭 Executive Documentation Map

All engineering specifications, staff handbooks, and QA matrices are systematically organized into **7 clean, numbered directories** under `Hontech Documentation/Technical/`:

```
Hontech Documentation/
├── README.md                                  # You are here (Master Hub)
├── HONTECH_QA_TEST_CHECKLIST.csv              # Active spreadsheet checklist for human QA
├── HONTECH_QA_MANUAL_TESTING_MATRIX.html      # Interactive presentation test matrix
├── Revisions checklist.csv                    # Task ID traceability (REV-001 to current)
├── TERMS_AND_CONDITIONS.md                    # Operational terms and system liability
└── Technical/
    ├── 01_Staff_Foundations_and_Operations/   # SA, Floor Staff, Executive & Handover SOPs
    ├── 02_Architecture_and_Engineering/       # Master blueprints, DFDs, and code audit rules
    ├── 03_Quality_Assurance_and_Testing/      # Automated test catalogs and SLA delay diagnostics
    ├── 04_Deployment_and_Infrastructure/      # Local intranet (₱0), mDNS domain & runbooks
    ├── 05_Client_Proposals_and_Defense/       # Client pitches, retainer plans & roadmap
    ├── 06_Project_Logs_and_Checkpoints/       # Project trajectory, conversation history & archives
    └── 07_Career_and_Portfolio/               # Developer portfolio & external setup guides
```

---

## 📁 Directory 1: 🚗 `01_Staff_Foundations_and_Operations`
*Mandatory operational workflows governing daily vehicle intake, workshop floor monitoring, and customer lifecycle management.*

| Document | Role / Domain | Operational Purpose |
| :--- | :--- | :--- |
| ⭐ [**Staff Operational Workflow & Subsystem Foundations**](Technical/01_Staff_Foundations_and_Operations/HONTECH_STAFF_PROGRESS_WORKFLOW_AND_FOUNDATIONS.md) | **Service Advisor (SA) & Floor Staff** | **The Single Source of Truth**: 2025 RO Excel Studio, 1-Button Unified Registration, removal of redundant intake forms, and the complete 10-field alignment matrix across Studio, Monitoring, and Customer Lookup. |
| ⭐ [**Customer History & Back-Job Module Evolution Log**](Technical/01_Staff_Foundations_and_Operations/CUSTOMER_LOOKUP_AND_BACKJOB_MODULE_EVOLUTION_LOG.md) | **Service Advisor & Front Desk** | Returning customer visit tracking, multi-factor search (Name, Engine No, Plate), customer dossier card, and warranty back-job intake workflow. |
| 👑 [**Executive System Guide & Tutorial**](Technical/01_Staff_Foundations_and_Operations/HONTECH_EXECUTIVE_SYSTEM_GUIDE_AND_TUTORIAL.md) | **Owner & Administrator** | Executive reporting, Turn-Around Time (TAT) SLA compliance, revenue analysis, and audit log inspection. |
| 🔄 [**Session Handover & Team Revisions Guide**](Technical/01_Staff_Foundations_and_Operations/SESSION_HANDOVER_AND_TEAM_REVISIONS_GUIDE.md) | **Cross-Functional Team** | Shift handover protocol, role testing scripts, report data matrix, and daily workstation synchronization. |
| ⚡ [**Startup Operation Manual**](Technical/01_Staff_Foundations_and_Operations/StartupOperation.md) | **Operations Team** | Daily system startup procedures, XAMPP check, port binding, and TV monitor activation. |
| 👥 [**Solo IT Leadership & Enterprise Operations Handbook**](Technical/01_Staff_Foundations_and_Operations/HONTECH_SOLO_IT_LEADERSHIP_AND_ENTERPRISE_HANDBOOK.md) | **Technical Lead** | Standard operating procedures for solo IT leads managing enterprise deployments, developer guardrails, and client operations. |

---

## 📁 Directory 2: 🏛️ `02_Architecture_and_Engineering`
*Canonical blueprints defining software architecture, database integrity, and subsystem communication.*

| Document | Domain | Technical Purpose |
| :--- | :--- | :--- |
| 🏛️ [**System Architecture & User Journey Map**](Technical/02_Architecture_and_Engineering/HONTECH_SYSTEM_ARCHITECTURE_AND_USER_JOURNEY_MAP.md) | **Master Architecture** | The supreme architectural blueprint: 4-role RBAC authority matrix, 8-stage vehicle lifecycle, zero-regressions policy, and 6-stage AI lifecycle. |
| 📊 [**System Data Flow Diagrams**](Technical/02_Architecture_and_Engineering/hontech_data_flow_diagrams.md) | **Systems Engineering** | Visual Mermaid DFDs tracking client authentication, daily intake job creation, bay status transitions, and real-time TV telemetry. |
| 🔍 [**Codebase Architectural Audit & Guardrails**](Technical/02_Architecture_and_Engineering/HonTech_Codebase_Architectural_Audit.md) | **Code Quality** | Engineering rules: SQL PDO parameter binding, soft-delete filtering (`is_deleted = 0`), defensive DOM operations, and cache-busting standards. |
| 🏗️ [**Master Development Blueprint**](Technical/02_Architecture_and_Engineering/Master_Development_Blueprint.md) | **Software Design** | PHP router endpoint directory, folder hierarchy, separation of concerns, and API response normalization. |
| 🛡️ [**Security & Account Recovery Master Architecture**](Technical/02_Architecture_and_Engineering/HONTECH_SECURITY_AND_ACCOUNT_RECOVERY_MASTER.md) | **Security Engineering** | JWT HTTP-only cookie authentication, 2-step OTP password resets, TOTP multi-factor security, and developer exception diagnostics. |
| ☁️ [**Cloud Security & Google Auth Executive Guide**](Technical/02_Architecture_and_Engineering/HONTECH_CLOUD_SECURITY_AND_GOOGLE_AUTH_EXECUTIVE_GUIDE.md) | **Cloud & Auth** | Google OAuth security, token lifecycle, and enterprise credential sandboxing. |
| 🔌 [**Developer Dual-Repo Adapter Pattern Guide**](Technical/02_Architecture_and_Engineering/HONTECH_DEVELOPER_DUAL_REPO_ADAPTER_PATTERN_AND_TESTING_GUIDE.md) | **Repo Architecture** | Multi-repo sync patterns and branch harmonization rules. |
| 🌐 [**Local Domain & Google API Master Plan**](Technical/02_Architecture_and_Engineering/HONTECH_LOCAL_DOMAIN_AND_GOOGLE_API_MASTER_PLAN.md) | **API Architecture** | Integration specifications for local mDNS resolution and cloud APIs. |

---

## 📁 Directory 3: 🧪 `03_Quality_Assurance_and_Testing`
*Testing playbooks and audit tools for human QA testers (Catherine & Mary Dayne) and automated test suites.*

| Document | Format | Verification Scope |
| :--- | :--- | :--- |
| 📋 [**HONTECH QA Test Checklist**](HONTECH_QA_TEST_CHECKLIST.csv) | **CSV Spreadsheet** | Active testing matrix for Catherine & Mary Dayne with explicit Test IDs (`AUTH-XX`, `SA-XX`, `AST-XX`, `OWN-XX`, `TV-XX`, `SEC-XX`), Risk Tiers, and Target Roles. |
| 🧪 [**Interactive Manual QA Testing Matrix**](HONTECH_QA_MANUAL_TESTING_MATRIX.html) | **Interactive HTML** | Presentation-grade interactive QA dashboard for Capstone panel review, verifying 100% of test suites across all 4 roles. |
| 🤖 [**Automated Script Test Catalog**](Technical/03_Quality_Assurance_and_Testing/HONTECH_AUTOMATED_SCRIPT_TEST_CATALOG.md) | **Test Documentation** | Catalog of unit and integration test assertions in `tests/` executed via `npm.cmd test`. |
| ⏱️ [**Express SLA & Delay Root Cause Analysis Plan**](Technical/03_Quality_Assurance_and_Testing/HONTECH_EXPRESS_SLA_AND_DELAY_ROOT_CAUSE_PLAN.md) | **Performance QA** | SLA tracking methodology for Express PMS ($\le$ 60 mins), overrun alarms, and delay categorization. |
| 📘 [**Master Requirements & Unit Testing Playbook**](Technical/03_Quality_Assurance_and_Testing/HONTECH_MASTER_REQUIREMENTS_AND_UNIT_TESTING_PLAYBOOK.md) | **Requirements Matrix** | Full software requirements specification mapped to automated test cases and verification criteria. |
| 👥 [**QA & Unit Testing Group Guide**](Technical/03_Quality_Assurance_and_Testing/HONTECH_QA_AND_UNIT_TESTING_GROUP_GUIDE.md) | **Team Testing SOP** | Guidelines for coordinating team QA efforts between manual testers and developer scripts. |
| 🛡️ [**Operational Revisions & SLA Audit Guard Plan**](Technical/03_Quality_Assurance_and_Testing/HONTECH_OPERATIONAL_REVISIONS_EXPRESS_SLA_AND_AUDIT_GUARD_PLAN.md) | **Audit Guard** | Defensive operational controls to prevent regressions during live revisions. |
| 🔬 [**Developer vs. Client Reviews Testing Standard**](Technical/03_Quality_Assurance_and_Testing/HONTECH_DEVELOPER_VS_CLIENT_SYSTEM_AND_REVIEWS_TESTING_STANDARD.md) | **Review Standards** | Comparison of developer validation criteria against real-world client review checkpoints. |

---

## 📁 Directory 4: 🚀 `04_Deployment_and_Infrastructure`
*Zero-cost on-premises server configuration, local domain resolution, and cloud strategies.*

| Document | Category | Operational Scope |
| :--- | :--- | :--- |
| 🌐 [**Official Domain Implementation & Maintenance Manual**](Technical/04_Deployment_and_Infrastructure/HONTECH_OFFICIAL_DOMAIN_IMPLEMENTATION_TESTING_AND_MAINTENANCE_MANUAL.md) | **mDNS & DNS** | Comprehensive master manual on Local Domain operations, mDNS zero-config (`hontech-marikina.local`), router DNS mapping, and firewall rules. |
| 📘 [**Enterprise Deployment & Operations Manual**](Technical/04_Deployment_and_Infrastructure/HONTECH_ENTERPRISE_DEPLOYMENT_AND_OPERATIONS_MANUAL.md) | **Production Runbook** | Step-by-step master playbook covering Local Wi-Fi Server setup (`192.168.x.x`), Google OAuth credentials, Live Gmail SMTP OTP, and TV Kiosk installation. |
| 🌐 [**Local Intranet, Server Hosting & Remote Access Manual**](Technical/04_Deployment_and_Infrastructure/LOCAL_INTRANET_DEPLOYMENT_GUIDE.md) | **Networking Manual** | ₱0 local server hosting (`0.0.0.0:8000`), zero-config `.local` resolution, and remote tunneling via Cloudflare and Localtunnel. |
| 🗺️ [**Stage-Gated Production Delivery & Sandboxing Standard**](Technical/04_Deployment_and_Infrastructure/HONTECH_STAGE_GATE_PRODUCTION_ROADMAP_AND_SANDBOXING_STANDARD.md) | **Delivery Schedule** | The official 5-phase delivery lifecycle: Core Freeze $\rightarrow$ Hardening $\rightarrow$ Google OAuth Sandbox $\rightarrow$ Production Strip $\rightarrow$ Final Handover. |
| ☁️ [**Hosting Infrastructure & Cloud Strategy Guide**](Technical/04_Deployment_and_Infrastructure/HONTECH_HOSTING_INFRASTRUCTURE_AND_CLOUD_STRATEGY_GUIDE.md) | **Cloud Strategy** | Comparative trade-off analysis of Local Server (XAMPP/LAN), AWS (EC2/Lightsail), Vercel, and Supabase with client-driven cost matrices. |
| 🧪 [**Sandbox PoC: Vercel & Supabase Free-Tier Setup**](Technical/04_Deployment_and_Infrastructure/HONTECH_SANDBOX_POC_VERCEL_SUPABASE_SETUP_GUIDE.md) | **Cloud Sandbox** | 15-minute quickstart guide for building an isolated, ₱0 free-tier prototype to test live Realtime WebSockets before client demonstration. |
| 💻 [**Git and GitHub Team Workflow Guide**](Technical/04_Deployment_and_Infrastructure/Git_and_GitHub_Guide.md) | **Version Control** | Atomic feature delivery, semantic commit conventions, feature branching, and remote sync standards. |
| 📅 [**Progressive Deployment Timeline & Milestones**](Technical/04_Deployment_and_Infrastructure/HONTECH_PROGRESSIVE_DEPLOYMENT_TIMELINE_AND_MILESTONES.md) | **Timeline** | Progressive deployment milestones from local testing to multi-branch readiness. |
| 🔍 [**Local Hosting Feasibility & Zero-Risk Setup**](Technical/04_Deployment_and_Infrastructure/HONTECH_LOCAL_HOSTING_TECHNICAL_FEASIBILITY_AND_ZERO_RISK_SETUP_GUIDE.md) | **Feasibility** | Hardware evaluation and stability proof for running on client shop PC. |
| 🖥️ [**Hardware Readiness & System Requirements Checklist**](Technical/04_Deployment_and_Infrastructure/HONTECH_WEBSITE_SYSTEM_REQUIREMENTS_AND_HARDWARE_READINESS_CHECKLIST.md) | **Hardware Checklist**| Shop PC specs, Wi-Fi router requirements, TV display resolution, and barcode scanner checks. |

---

## 📁 Directory 5: 👔 `05_Client_Proposals_and_Defense`
*Commercial and academic materials for client presentations and Capstone panel defense.*

| Document | Target Audience | Purpose |
| :--- | :--- | :--- |
| 📄 [**Client Proposal & Deployment Strategy**](Technical/05_Client_Proposals_and_Defense/HONTECH_SEPTEMBER_2026_CLIENT_PROPOSAL_AND_DEPLOYMENT_STRATEGY.md) | **HonTech Management** | Formal proposal detailing on-site ₱0 local server hardware requirements, cost comparison (Local vs. Cloud), and system deliverables. |
| 🖥️ [**Interactive Client Proposal & Strategy Dashboard**](Technical/05_Client_Proposals_and_Defense/HonTech_Client_Proposal_and_Deployment_Strategy.html) | **Capstone Panel & Client** | Presentation-ready visual HTML dashboard designed for client executive pitches and Capstone panel defenses. |
| 🎯 [**Client Interview Cheatsheet & Talking Points**](Technical/05_Client_Proposals_and_Defense/CLIENT_INTERVIEW_CHEATSHEET_AND_TALKING_POINTS.md) | **Presentation Team** | Quick-reference interview sheet for demonstrating digital queue benefits, repair bay efficiency, and customer satisfaction metrics. |
| 💼 [**Managed IT Department & Service Retainer Proposal**](Technical/05_Client_Proposals_and_Defense/HONTECH_MANAGED_IT_DEPARTMENT_PROPOSAL.md) | **Client Executives** | Retainer proposal presenting the capstone team as HonTech's ongoing external IT department, covering maintenance and network uptime. |
| 📊 [**Executive Reporting & Decision-Making Plan**](Technical/05_Client_Proposals_and_Defense/HONTECH_EXECUTIVE_REPORTING_AND_DECISION_MAKING_PLAN.md) | **Shop Executives** | Guide for shop executives on utilizing daily turnover metrics, revenue charts, and delay flags to optimize floor profitability. |
| 🚀 [**HonTech Future Roadmap & Long-Term Vision**](Technical/05_Client_Proposals_and_Defense/HONTECH_FUTURE_ROADMAP_AND_PROGRESS.md) | **Faculty & Client** | Multi-branch synchronization, customer mobile client portal, automated SMS notifications, and AI predictive maintenance plans. |
| 🤝 [**Client & Team Deployment Alignment Guide**](Technical/05_Client_Proposals_and_Defense/Client_and_Team_Deployment_Guide.md) | **Team & Client** | Alignment on zero monthly fees and dual-port staging operations. |
| 📘 [**Master Client Proposal & Deployment Guide**](Technical/05_Client_Proposals_and_Defense/Master_Client_Proposal_And_Deployment_Guide.md) | **Proposal Document** | Comprehensive client briefing document. |

---

## 📁 Directory 6: 🗃️ `06_Project_Logs_and_Checkpoints`
*Historical logs, commit tracking, and disaster recovery procedures.*

| Document | Location | Purpose |
| :--- | :--- | :--- |
| 📜 [**Revisions Checklist (Master Task Tracking)**](Revisions%20checklist.csv) | `Hontech Documentation/` | Complete chronological task list (`REV-001` to current) with Task ID, Date, Role, Short Commit Hash, and Description. |
| 📋 [**Revisions Log (Detailed Engineering Changelog)**](../REVISIONS_LOG.md) | Root Workspace | Comprehensive engineering changelog detailing modified files, tables affected, and version upgrades per revision. |
| 🛡️ [**Project Checkpoints & Historical Trajectory Log**](Technical/06_Project_Logs_and_Checkpoints/PROJECT_CHECKPOINTS_AND_CONVERSATION_HISTORY.md) | `Technical/06_Project_Logs_and_Checkpoints/` | Chronological record of conversation checkpoints, feature revisions, commit hashes, and 1-minute disaster recovery steps. |
| 📁 [**Archived Sprint Plans**](Technical/06_Project_Logs_and_Checkpoints/Archived_Plans/) | `Technical/06_Project_Logs_and_Checkpoints/Archived_Plans/` | Historical sprint specifications and preliminary draft plans safely archived for reference. |
| 📁 [**Changelogs and Testing Archives**](Technical/06_Project_Logs_and_Checkpoints/Changelogs_and_Testing/) | `Technical/06_Project_Logs_and_Checkpoints/Changelogs_and_Testing/` | Testing logs and early prototype revisions. |

---

## 📁 Directory 7: 💼 `07_Career_and_Portfolio`
*Student career branding, portfolio development, and external setup guides.*

| Document | Purpose |
| :--- | :--- |
| 💼 [**Student Portfolio, LinkedIn & GitHub Career Branding Master Guide**](Technical/07_Career_and_Portfolio/STUDENT_PORTFOLIO_LINKEDIN_AND_GITHUB_BRANDING_GUIDE.md) | Complete branding blueprint: T-Shaped developer positioning, LinkedIn headlines/bios, GitHub profile pinning, and interview talking points. |
| 🤖 [**OpenCode AI Setup Guide**](Technical/07_Career_and_Portfolio/OpenCode_AI_Setup_Guide.html) | Guide for setting up OpenCode AI assistant workflows. |

---

## ⚡ Quick Operational Cheat Sheet for Daily Work

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              DAILY DEVELOPMENT CHEAT SHEET                             │
├───────────────────────┬────────────────────────────────────────────────────────────────┤
│ 🚀 Launch Dev Server  │ npm.cmd run dev (Launches PHP on http://localhost:8000)        │
│ 🧪 Run All Tests      │ npm.cmd test (Executes full automated test suites)             │
│ 🚗 Open SA Studio     │ Navigate to #section-form13 in browser                         │
│ 🔍 Open Lookup Module │ Navigate to #section-lookup in browser                         │
│ 📺 Open TV Monitor    │ Open http://localhost:8000/frontend/tv.html                    │
│ 📋 Append Human QA    │ Add row to Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv │
│ 📝 Log Task ID        │ Add row to Hontech Documentation/Revisions checklist.csv       │
│ 🌿 Commit Standard    │ git commit -m "<type>(REV-XXX): <description>"                 │
└───────────────────────┴────────────────────────────────────────────────────────────────┘
```
