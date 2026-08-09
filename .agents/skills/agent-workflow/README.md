# 🚀 Antigravity Workspace Agent Skill Set — HonTech Edition

Welcome to the **Antigravity Workspace Agent Skill Set**. This directory contains an advanced behavioral and architectural framework designed to direct AI coding agents to produce clean, maintainable, SOLID-compliant, and secure production code.

---

## 🌟 Executive Summary

AI coding assistants can sometimes write sloppy code, make wrong assumptions about database ports, or rewrite entire files unnecessarily. 

This skill set acts as a **permanent engineering playbook** built directly into your workspace (`.Agents/skills/agent-workflow/`). Whenever an AI agent works on this codebase, it automatically reads these guidelines to enforce senior-level development standards.

---

## 💡 What Problem Does This Skill Set Solve?

| Common AI Coding Problem | How This Skill Set Solves It | Key File Responsible |
| :--- | :--- | :--- |
| ❌ **Hasty, unreviewed code changes** | Mandates a 7-step workflow (**Understand ➔ Research ➔ Plan ➔ Approve ➔ Code ➔ Verify**). | [`SKILL.md`](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/.Agents/skills/agent-workflow/SKILL.md) |
| ❌ **Monolithic & bloated classes** | Enforces **SOLID Principles** (SRP, OCP, LSP, ISP, DIP) on all backend controllers and modules. | [`ARCHITECTURE.md`](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/.Agents/skills/agent-workflow/Implementation/ARCHITECTURE.md) |
| ❌ **Messy, unorganized code** | Mandates object-oriented **Design Patterns** (Repository, Singleton, Strategy, Facade, Builder). | [`DESIGN_PATTERNS.md`](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/.Agents/skills/agent-workflow/Implementation/DESIGN_PATTERNS.md) |
| ❌ **Wrong port or stack assumptions** | Defines all facts about HonTech (MariaDB port `3307`, soft delete flags `is_deleted = 0`, JWT headers). | [`PROJECT_PROFILE.md`](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/.Agents/skills/agent-workflow/project-profile/PROJECT_PROFILE.md) |
| ❌ **Vulnerabilities & SQL Injections** | Enforces strict parameter binding, JWT HTTP-only cookies, and XSS sanitization checklists. | [`SECURITY.md`](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/.Agents/skills/agent-workflow/Implementation/SECURITY.md) |
| ❌ **Unverified & broken code** | Mandates running syntax checks and checking the **Manual QA Test Matrix** before completing tasks. | [`TESTING.md`](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development_Branch2-Security-Account-Recovery/CapstoneOfficial2_Development_Part-2-Hontech_Main_Active_Development/.Agents/skills/agent-workflow/Quality/TESTING.md) |

---

## 📂 Detailed Directory & Skill Routing Table

```text
.Agents/skills/agent-workflow/
├── SKILL.md                          # Root Router & Core Principles (Plan-first workflow, Reasoning mindset)
├── project-profile/
│   └── PROJECT_PROFILE.md            # HonTech Technical Profile (PHP 8.x, MariaDB 3307, HSL styling)
├── Implementation/
│   ├── ARCHITECTURE.md               # SOLID Principles (Single Responsibility, Dependency Inversion, etc.)
│   ├── DESIGN_PATTERNS.md            # Structural Patterns (Singleton, Repository, Strategy, Facade, Adapter)
│   ├── CODING.md                     # Clean Code, Early Returns, Readability, and Error Handling
│   ├── SECURITY.md                   # Auth, Access Control, SQL Injection & XSS Guardrails
│   ├── PERFORMANCE.md                # Execution speed, asset loading, and SQL query efficiency
│   └── DECISIONS.md / REFACTORING.md # Rules on when (and when NOT) to rewrite or refactor code
├── ui/
│   └── UI_BUILDING.md                # HSL Dark Glassmorphic Design System, Accessibility, Responsiveness
└── Quality/
    ├── TESTING.md                    # QA Matrix Verification Protocols
    ├── DEBUGGING.md                  # Diagnostic Stack Trace Extraction Rules
    └── COMMITS.md                    # Git Commit Hygiene Standards
```

---

## 🔄 Agent Execution Workflow

```text
User Request
     │
     ▼
Understand Request ➔ Research Codebase ➔ Create Plan ➔ Seek Approval
                                                             │
                                                             ▼
                                                    Implementation Phase
                                                    ├── Coding Style       → Implementation/CODING.md
                                                    ├── Architecture      → Implementation/ARCHITECTURE.md
                                                    ├── Design Patterns   → Implementation/DESIGN_PATTERNS.md
                                                    ├── Security Rules     → Implementation/SECURITY.md
                                                    └── UI Design Tokens   → ui/UI_BUILDING.md
                                                             │
                                                             ▼
                                                    Quality & Verification
                                                    ├── Testing & QA Matrix → Quality/TESTING.md
                                                    └── Diagnostics          → Quality/DEBUGGING.md
                                                             │
                                                             ▼
                                                    Done (Commit & Push)
```

---

## 🔑 Key Features for Readers

1. **SOLID Architecture Integration**:
   Every PHP class created by the agent must adhere to **Single Responsibility** (splitting large controllers into focused classes like `StaffController` and `PasswordResetController`) and **Dependency Inversion** (injecting repositories rather than writing inline queries).

2. **Standardized Design Patterns**:
   Guarantees the application uses industry design patterns (**Repository Pattern**, **Singleton Pattern**, **Strategy Pattern**, and **Facade Pattern**).

3. **Repeatable QA Verification**:
   Links directly to `Hontech Documentation/Technical/Testing_and_QA_Protocol.md`, enabling developers and agents to run through a formal QA test matrix before shipping updates.

4. **Zero-Setup Maintenance**:
   Since it resides inside `.Agents/skills/agent-workflow/`, any AI assistant opening this project will automatically discover and enforce these guidelines with no extra prompt setup needed.
