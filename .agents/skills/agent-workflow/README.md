# 🚀 Antigravity Agent Skills & Guidelines

A modular suite of agent guidelines for the Antigravity coding assistant, split into two parts:

- **Portable core** (`SKILL.md`, `Implementation/`, `Planning/`, `Quality/`, `ui/`, `Models/`) -- generic engineering practice, safe to reuse in any project.
- **Project profile** (`project-profile/PROJECT_PROFILE.md`) -- the concrete facts specific to *this* codebase (component names, auth mechanism, tooling). Replace this one file when adapting the skill set elsewhere.

Earlier versions of this repo mixed the two together, which meant reusing it in a different project would make the agent confidently reference components and files (`ProtectedRoute`, `cn()`, `practicum_session`) that don't exist there. That's fixed now -- everything project-specific lives in one clearly labeled place.

---

## 📂 Directory Structure

```
Antigravityskill/
├── SKILL.md                       # Root routing table + always-on principles, reasoning mindset, conflict resolution
├── Implementation/
│   ├── ARCHITECTURE.md            # Component/routing/utility conventions (generic)
│   ├── CODING.md                  # Clean code, scope discipline, verification
│   ├── DECISIONS.md               # How to choose between valid approaches; when not to change code
│   ├── DOCUMENTATION.md           # When docs/comments need updating
│   ├── PERFORMANCE.md             # Rendering, animation, bundle-size guidance
│   ├── REFACTORING.md             # When refactoring is (and isn't) warranted
│   └── SECURITY.md                # Access control, auth, input handling (generic)
├── Planning/
│   ├── PLANNING.md                # Understand -> plan -> approval workflow
│   └── RESEARCH.md                # Search order + stopping rule for codebase research
├── Quality/
│   ├── COMMITS.md                 # Commit + branching hygiene, if the agent acts on the user's behalf
│   ├── DEBUGGING.md               # Systematic troubleshooting (generic)
│   └── TESTING.md                 # Verification before marking work done (generic)
├── ui/
│   └── UI_BUILDING.md             # Visual design, page/dashboard composition, responsiveness, accessibility, interaction states, forms, motion
├── Models/
│   └── MODEL_SELECTION.md         # Capability-tier based model routing
└── project-profile/
    └── PROJECT_PROFILE.md         # Everything specific to this codebase -- replace when reusing elsewhere
```

Notes on structure:
- `ui/RESPONSIVE.md` and `ui/ACCESSIBILITY.md` from an earlier version were merged into `ui/UI_BUILDING.md` -- they duplicated most of its content and risked drifting out of sync as three separate files.
- Reasoning/mindset guidance ("question assumptions," "prefer extension over replacement," etc.) lives directly in `SKILL.md` rather than a separate file, since it needs to be active on every task rather than conditionally loaded.
- Cross-file conflicts are resolved by a short precedence rule in `SKILL.md` (user instruction > project-profile facts > security > existing conventions > general style), rather than a rigid ranking across all ten files -- most of them govern different concerns and rarely actually compete.

---

## 🛠️ Category Breakdown

### 1. ⚙️ Implementation (`/Implementation`)
Clean, scalable, secure code: component boundaries, performance guardrails, security baselines, when to refactor, when to document, and how to choose between multiple valid approaches. Framework-specific tips (e.g. React/Vite) are flagged as assumptions, not treated as universal.

### 2. 📝 Planning (`/Planning`)
The "understand → research → plan → approval" workflow, including a defined trivial/non-trivial threshold (see `SKILL.md`) and a dedicated research search-order/stopping-rule, so the agent doesn't over- or under-invoke planning or research.

### 3. 🧪 Quality (`/Quality`)
Verification, troubleshooting, and commit hygiene, generalized so they apply regardless of whether the project has an automated test framework.

### 4. 🎨 UI (`/ui`)
A single consolidated guide for visual design, responsive layout, and accessibility.

### 5. 🧠 Models (`/Models`)
Model selection framed around capability tiers (deep reasoning / balanced / fast) rather than hardcoded model names, so it doesn't go stale when model lineups change.

### 6. 📋 Project Profile (`/project-profile`)
The one non-portable file. Contains this project's actual stack, auth mechanism, component names, and testing setup.

---

## 📖 How to Load this Skill in Antigravity

1. Copy this folder into your project's customization root at `.agents/skills/agent/`.
2. The Antigravity IDE agent will automatically discover and load `SKILL.md`.
3. **Before reusing this in a different project:** rewrite or delete `project-profile/PROJECT_PROFILE.md` so the agent doesn't reference component names and mechanisms that don't exist in the new codebase.
