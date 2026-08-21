# 📚 HonTech AutoCenter Operations System — Documentation Hub
## Master Technical Architecture, Operational Playbooks & Quality Assurance Index

Welcome to the central documentation hub for the **HonTech AutoCenter Operations System (Branch 2: Security & Account Recovery)**. All specifications, architecture models, deployment guides, QA matrices, and developer roadmaps are organized here into focused, authoritative categories.

---

## 🗂️ Master Documentation Directory

### 1. 📘 Core Technical Architecture & Operational Playbooks
* 📘 [**Enterprise Deployment & Operations Manual**](Technical/HONTECH_ENTERPRISE_DEPLOYMENT_AND_OPERATIONS_MANUAL.md)  
  *The authoritative, step-by-step master playbook covering Local Wi-Fi Server setup (`192.168.x.x`), Google Cloud OAuth credentials, Live Gmail/SMTP OTP configuration, Google Calendar integration, Google Drive automated MySQL backups, and TV Display Kiosk installation.*
* 🛡️ [**Security, Account Recovery & Google API Master Architecture**](Technical/HONTECH_SECURITY_AND_ACCOUNT_RECOVERY_MASTER.md)  
  *Unified security blueprint covering JWT HTTP-Only cookies, 2-step OTP password resets (with sequence diagrams), TOTP Multi-Factor Authentication (Google Authenticator), and 15-minute inactivity auto-logout protection.*
* 🗄️ [**Database Schema & Entity Relationship Model**](Technical/database_schema_and_erd.md)  
  *Complete relational database dictionary for MySQL/MariaDB (`users`, `jobs`, `security_logs`, `simulated_emails`, `branches`), field constraints, and Mermaid ERD.*
* 📊 [**System Data Flow & Request Lifecycle Diagrams**](Technical/hontech_data_flow_diagrams.md)  
  *Visual Mermaid DFDs tracking client authentication, daily intake job creation, bay status transitions, and real-time TV telemetry.*
* 📈 [**Analytics & Operational Calculation Logic**](Technical/Analytics_Calculation_Logic.md)  
  *Formulaic breakdown of turn-around time (TAT), PMS vs. GRS completion rates, service advisor daily performance, and financial revenue aggregations.*
* 🏛️ [**Codebase Architectural Audit & Directives**](Technical/HonTech_Codebase_Architectural_Audit.md)  
  *Engineering standards, SQL PDO property normalization, defensive DOM handling, and cache-busting requirements.*

---

### 2. 👔 Client Proposals, Pitch Scripts & Presentation Assets
* 📄 [**Master Client Proposal & Deployment Guide**](Technical/Master_Client_Proposal_And_Deployment_Guide.md)  
  *Formal executive proposal for HonTech management detailing on-site ₱0 local server hardware requirements, financial cost comparison (Local vs. Cloud), and project deliverables.*
* 🖥️ [**Interactive Client Proposal & Deployment Strategy (HTML Presentation)**](Technical/HonTech_Client_Proposal_and_Deployment_Strategy.html)  
  *Presentation-ready, interactive visual dashboard designed for client executive pitches and Capstone panel defenses.*
* 🗣️ [**Client & Development Team Alignment Guide**](Technical/Client_and_Team_Deployment_Guide.md)  
  *Talking points and pitch scripts for clients reassuring ₱0 monthly fees, alongside team alignment guidelines for dual-port local server hosting (`Port 8000` vs `Port 8001`).*
* 🎯 [**Client Interview Cheatsheet & Talking Points**](Technical/CLIENT_INTERVIEW_CHEATSHEET_AND_TALKING_POINTS.md)  
  *Quick reference interview sheet for presenting digital queue benefits, repair bay efficiency, and privacy compliance.*
* 💼 [**Managed IT Department & Service Retainer Proposal**](Technical/HONTECH_MANAGED_IT_DEPARTMENT_PROPOSAL.md)  
  *Commercial retainer proposal presenting your team as HonTech's dedicated external IT department, covering ongoing software maintenance, network uptime, cloud backups, and Phase 2/3 development.*

---

### 3. 🧪 Quality Assurance, Testing & Launch Protocol
* 🧪 [**Interactive Manual QA Testing Matrix (HTML Dashboard)**](HONTECH_QA_MANUAL_TESTING_MATRIX.html)  
  *Comprehensive interactive QA dashboard covering 100% of test suites across all 4 roles (Owner, Admin, SA, Assistant).*
* 📋 [**QA Testing Checklist (CSV Export)**](HONTECH_QA_TEST_CHECKLIST.csv)  
  *Standardized test checklist formatted for spreadsheet verification and audit tracking.*
* 🔬 [**Testing & QA Protocol**](Technical/Testing_and_QA_Protocol.md)  
  *Step-by-step test execution procedure, regression testing rules, and automated unit test workflows.*
* ⏱️ [**Launch Timeline & Emergency Response Manual**](Technical/LaunchTimelineAndEmergencyManual.md)  
  *Deployment milestones, dry-run checklist, failover procedures, and emergency crash diagnostics.*

---

### 4. 🧠 Developer Learning & Educational Guides
* 🌐 [**Local Network Sharing & Socket Binding Guide**](Personal_Learning/NetworkingLocalSharingGuide.md)  
  *Student-friendly tutorial on `localhost` loopbacks, network IP routing, and bypassing firewall blocks.*
* 🛡️ [**Security Vulnerabilities Explainer**](Personal_Learning/SecurityVulnerabilities.md)  
  *Educational audit log explaining common web vulnerabilities (OTP leakage, CSRF, IDOR) and their code-level remediations.*
* 🌿 [**Multi-Branch Implementation Learnings**](Personal_Learning/MultiBranch_Implementation_Learnings.md)  
  *Reflections and architectural insights on implementing multi-tenant branch partitioning in PHP/SQL.*
* 💻 [**Git and GitHub Team Workflow Guide**](Technical/Git_and_GitHub_Guide.md)  
  *Guide to atomic feature delivery, commit hygiene, and branch protection strategies.*

---

### 5. 🗃️ Historical Archives
* 📁 **Legacy Drafts & Feature Implementations**: Located in [`Technical/Archived_Plans/`](Technical/Archived_Plans/). Contains superseded individual feature drafts, early multi-branch sprint notes, and legacy drafts consolidated into the master documents.
