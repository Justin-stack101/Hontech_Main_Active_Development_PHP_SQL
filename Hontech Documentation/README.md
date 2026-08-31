# 📚 HonTech AutoCenter Operations System — Master Documentation Hub
**Document Version**: `v2.5.0-Consolidated`  
**Classification**: Master Documentation & Knowledge Repository  
**Active Working Branch**: `branch2-Security-Account-Recovery`  

Welcome to the central documentation and engineering knowledge hub for the **HonTech AutoCenter Operations System**. All architectural specifications, client presentation decks, QA testing matrices, production roadmaps, and career development guides are systematically organized below.

---

## ⚡ Quick Navigation Index
[🏗️ Architecture & Data Models](#1-🏗️-core-system-architecture--data-models) | [👔 Client Proposals & Executive Guides](#2-👔-client-proposals-executive-guides--pitches) | [🚀 Deployment & Production Roadmaps](#3-🚀-deployment-infrastructure--production-roadmaps) | [🛡️ Security, RBAC & QA](#4-🛡️-security-multi-role-rbac--quality-assurance-qa) | [💼 Career Branding & Game Dev](#5-💼-career-branding-linkedin-github--game-development) | [🧠 Personal Growth & CS Studies](#6-🧠-personal-developer-growth--cs-studies)

---

## 1. 🏗️ Core System Architecture & Data Models

| Document | Category | Description |
| :--- | :--- | :--- |
| 🗄️ [**Database Schema & Entity Relationship Model**](Technical/database_schema_and_erd.md) | Relational Database | Complete data dictionary for MySQL/MariaDB (`users`, `jobs`, `security_logs`, `simulated_emails`, `branches`), field constraints, and Mermaid ERD. |
| 📊 [**System Data Flow & Request Lifecycle Diagrams**](Technical/hontech_data_flow_diagrams.md) | Systems Engineering | Visual Mermaid DFDs tracking client authentication, daily intake job creation, bay status transitions, and real-time TV telemetry. |
| 🏛️ [**Master Development Blueprint**](Technical/Master_Development_Blueprint.md) | Software Architecture | Core system architectural structure, folder layout, PHP router endpoints, and separation of concerns. |
| 🔍 [**Codebase Architectural Audit & Directives**](Technical/HonTech_Codebase_Architectural_Audit.md) | Quality & Code Health | Engineering standards, SQL PDO property normalization, defensive DOM handling, and cache-busting requirements. |
| 📈 [**Analytics & Operational Calculation Logic**](Technical/Analytics_Calculation_Logic.md) | Business Intelligence | Formulaic breakdown of turn-around time (TAT), PMS vs. GRS completion rates, service advisor daily performance, and financial revenue metrics. |
| 📜 [**Customer Lookup & Backjob Evolution Log**](Technical/CUSTOMER_LOOKUP_AND_BACKJOB_MODULE_EVOLUTION_LOG.md) | Feature Architecture | Complete historical log of the Customer Directory, automated claim stub autofill, backjob tracking, and search indexing. |

---

## 2. 👔 Client Proposals, Executive Guides & Pitches

| Document | Category | Description |
| :--- | :--- | :--- |
| 📄 [**Master Client Proposal & Deployment Guide**](Technical/Master_Client_Proposal_And_Deployment_Guide.md) | Executive Proposal | Formal proposal for HonTech management detailing on-site ₱0 local server hardware requirements, cost comparison (Local vs. Cloud), and deliverables. |
| 🖥️ [**Interactive Client Proposal & Strategy Dashboard**](Technical/HonTech_Client_Proposal_and_Deployment_Strategy.html) | Interactive Presentation | Presentation-ready visual HTML dashboard designed for client executive pitches and Capstone panel defenses. |
| 📖 [**Executive System Guide & Tutorial**](Technical/HONTECH_EXECUTIVE_SYSTEM_GUIDE_AND_TUTORIAL.md) | User Manual | Comprehensive, user-friendly system manual and tutorial for the Shop Owner, Service Advisors, and Workshop Staff. |
| 📊 [**Executive Reporting & Decision-Making Plan**](Technical/HONTECH_EXECUTIVE_REPORTING_AND_DECISION_MAKING_PLAN.md) | Management Insights | Guide for shop executives on utilizing daily turnover metrics, revenue charts, and delay flags to optimize floor profitability. |
| 🎯 [**Client Interview Cheatsheet & Talking Points**](Technical/CLIENT_INTERVIEW_CHEATSHEET_AND_TALKING_POINTS.md) | Pitch & Defense Prep | Quick-reference interview sheet for demonstrating digital queue benefits, repair bay efficiency, and customer satisfaction metrics. |
| 💼 [**Managed IT Department & Service Retainer Proposal**](Technical/HONTECH_MANAGED_IT_DEPARTMENT_PROPOSAL.md) | Commercial Retainer | Retainer proposal presenting your team as HonTech's external IT department, covering maintenance, network uptime, and future upgrades. |
| 🗣️ [**Client & Development Team Alignment Guide**](Technical/Client_and_Team_Deployment_Guide.md) | Team Alignment | Reassurances for clients on ₱0 monthly cloud fees, alongside team alignment guidelines for dual-port local server hosting (`Port 8000` vs `Port 8001`). |

---

## 3. 🚀 Deployment, Infrastructure & Production Roadmaps

| Document | Category | Description |
| :--- | :--- | :--- |
| 🗺️ [**Stage-Gated Production Delivery & Sandboxing Standard**](Technical/HONTECH_STAGE_GATE_PRODUCTION_ROADMAP_AND_SANDBOXING_STANDARD.md) | **Production Roadmap** | **The official 5-phase delivery lifecycle: Core Freeze $\rightarrow$ Hardening $\rightarrow$ Google OAuth Sandbox $\rightarrow$ Production Strip $\rightarrow$ Final Handover.** |
| 🌐 [**Official Domain Implementation & Maintenance Manual**](Technical/HONTECH_OFFICIAL_DOMAIN_IMPLEMENTATION_TESTING_AND_MAINTENANCE_MANUAL.md) | Local Domain & DNS | Comprehensive master manual on Local Domain operations, mDNS zero-config (`hontech-marikina.local`), Router DNS mapping, and Windows Firewall setup. |
| 📘 [**Enterprise Deployment & Operations Manual**](Technical/HONTECH_ENTERPRISE_DEPLOYMENT_AND_OPERATIONS_MANUAL.md) | Production Runbook | Step-by-step master playbook covering Local Wi-Fi Server setup (`192.168.x.x`), Google OAuth credentials, Live Gmail SMTP OTP, and TV Display Kiosk installation. |
| 🌐 [**Local Intranet, Server Hosting & Remote Access Manual**](Technical/LOCAL_INTRANET_DEPLOYMENT_GUIDE.md) | Networking Manual | ₱0 local server hosting (`0.0.0.0:8000`), zero-config `.local` resolution, and remote tunneling via Cloudflare and Localtunnel. |
| 📅 [**Progressive Deployment Timeline & Next-Month Action Plan**](Technical/HONTECH_PROGRESSIVE_DEPLOYMENT_TIMELINE_AND_MILESTONES.md) | Project Schedule | Official 6-stage pilot-to-production schedule: Codebase revisions, classmate local hosting testing, Google API integration, and physical multi-branch setup. |
| ⏱️ [**Launch Timeline & Emergency Response Manual**](Technical/LaunchTimelineAndEmergencyManual.md) | Incident Response | Deployment milestones, dry-run checklist, failover procedures, and emergency crash diagnostics. |
| ☁️ [**Hosting Infrastructure & Cloud Strategy Guide**](Technical/HONTECH_HOSTING_INFRASTRUCTURE_AND_CLOUD_STRATEGY_GUIDE.md) | Cloud & Hosting Architecture | In-depth comparative analysis of Local Server (XAMPP/LAN), AWS (EC2/Lightsail), Vercel, and Supabase with client-driven decision matrices and refactoring roadmaps. |
| 🧪 [**Sandbox PoC: Vercel & Supabase Free-Tier Setup**](Technical/HONTECH_SANDBOX_POC_VERCEL_SUPABASE_SETUP_GUIDE.md) | Cloud Sandbox & PoC | 15-minute quickstart guide for building an isolated, ₱0 free-tier prototype to test live Realtime WebSockets before client demonstration. |
| 🚀 [**HonTech Future Roadmap & Long-Term Vision**](Technical/HONTECH_FUTURE_ROADMAP_AND_PROGRESS.md) | Future Scope | Multi-branch synchronization, mobile client portal, customer SMS alerts, and AI predictive maintenance plans. |

---

## 4. 🛡️ Security, Multi-Role RBAC & Quality Assurance (QA)

| Document | Category | Description |
| :--- | :--- | :--- |
| 🛡️ [**Security, Account Recovery & Google API Master Architecture**](Technical/HONTECH_SECURITY_AND_ACCOUNT_RECOVERY_MASTER.md) | Security Blueprint | Unified security blueprint covering JWT HTTP-Only cookies, 2-step OTP password resets, TOTP Multi-Factor Authentication, and 15-minute inactivity timeouts. |
| 🧪 [**Interactive Manual QA Testing Matrix (HTML Dashboard)**](HONTECH_QA_MANUAL_TESTING_MATRIX.html) | QA Testing Dashboard | Interactive test matrix covering 100% of test suites across all 4 roles (**Owner**, **Admin**, **SA**, **Assistant**). |
| 📋 [**QA Testing Checklist (Spreadsheet CSV)**](HONTECH_QA_TEST_CHECKLIST.csv) | Spreadsheet Audit | Standardized CSV checklist formatted for spreadsheet verification, audit signoffs, and defense evidence. |
| 🔬 [**Comprehensive Handover & Team Revisions Guide**](Technical/SESSION_HANDOVER_AND_TEAM_REVISIONS_GUIDE.md) | Defense Review | Teammate and defense review guide summarizing recent features, role testing scripts, Report Data matrix, and automated batch scripts. |
| ⏱️ [**Express SLA & Delay Root Cause Analysis Plan**](Technical/HONTECH_EXPRESS_SLA_AND_DELAY_ROOT_CAUSE_PLAN.md) | Delay Diagnostics | Diagnostic procedures for tracking Express PMS $\le$ 60m SLA compliance and recording delay root-cause categories. |
| 👥 [**Solo IT Leadership & Enterprise Operations Handbook**](Technical/HONTECH_SOLO_IT_LEADERSHIP_AND_ENTERPRISE_HANDBOOK.md) | Leadership SOP | Standard operating procedures for solo developers managing multi-role stakeholder environments and IT operations. |

---

## 5. 💼 Career Branding, LinkedIn, GitHub & Game Development

| Document | Category | Description |
| :--- | :--- | :--- |
| 💼 [**Student Portfolio, LinkedIn & GitHub Career Branding Master Guide**](Technical/STUDENT_PORTFOLIO_LINKEDIN_AND_GITHUB_BRANDING_GUIDE.md) | **Career & OJT** | **Complete branding blueprint: T-Shaped developer positioning, LinkedIn headlines/bios, GitHub profile pinning, and interview talking points.** |
| 🎮 [**Psychological Games Master Plan (Concept 1: Count The Rice)**](../PSYCHOLOGICAL_GAMES_MASTER_PLAN.md) | Game Development | Master game design document for *Count The Rice*—exploring focus enforcers, 2D physics, psychological comedy, and procedural certificates. |
| 🛡️ [**GitHub Security, Secret Isolation & Public Portfolio Guide**](Personal_Learning/GITHUB_SECURITY_AND_ENVIRONMENT_ISOLATION_GUIDE.md) | Portfolio Security | How environment isolation (`.env` vs `.env.example`) protects real client data while keeping your GitHub repository and green squares 100% public. |
| 💻 [**Git and GitHub Team Workflow Guide**](Technical/Git_and_GitHub_Guide.md) | Version Control | Guide to atomic feature delivery, commit hygiene, feature branching, and branch protection strategies. |

---

## 6. 🧠 Personal Developer Growth & CS Studies

| Document | Location | Description |
| :--- | :--- | :--- |
| 🧩 [**Career-Changing OOP & DSA Mastery Guide**](Personal_Learning/Career_Changing_OOP_DSA_Guide.md) | `Personal_Learning/` | Object-Oriented Design patterns, Data Structures & Algorithms, and technical problem-solving fundamentals. |
| 📈 [**Developer Growth & Learning Strategy**](Personal_Learning/Developer_Growth_and_Learning_Strategy.md) | `Personal_Learning/` | Long-term roadmap for transitioning from student programmer to senior software engineer. |
| 📚 [**Developer Learning Curriculum**](Personal_Learning/Developer_Learning_Curriculum.md) | `Personal_Learning/` | Structured self-study curriculum covering Web Architecture, Cloud, Databases, and Security. |
| 🛡️ [**Security Vulnerabilities Explainer**](Personal_Learning/SecurityVulnerabilities.md) | `Personal_Learning/` | Practical breakdowns of common vulnerabilities (SQLi, XSS, CSRF, IDOR) and defensive coding patterns. |
| 🌐 [**Local Network Sharing & Socket Binding Guide**](Personal_Learning/NetworkingLocalSharingGuide.md) | `Personal_Learning/` | Clear tutorial on `localhost` loopbacks, network IP routing, subnets, and bypassing firewall blocks. |
| 🌿 [**Multi-Branch Implementation Learnings**](Personal_Learning/MultiBranch_Implementation_Learnings.md) | `Personal_Learning/` | Architectural reflections and lessons learned while implementing multi-tenant branch partitioning. |

---

## 7. 🗃️ Historical Trajectory & Recovery Logs

* 🛡️ [**Project Checkpoints & Historical Trajectory Log**](Technical/PROJECT_CHECKPOINTS_AND_CONVERSATION_HISTORY.md) — Chronological record of conversation checkpoints, feature revisions, commit hashes, and 1-minute disaster recovery steps.
* 📁 **Consolidated Archives**: Located in [`Technical/Archived_Plans/`](Technical/Archived_Plans/) and [`Technical/Changelogs_and_Testing/`](Technical/Changelogs_and_Testing/). Contains legacy sprint drafts and historical notes consolidated into the master documents.
