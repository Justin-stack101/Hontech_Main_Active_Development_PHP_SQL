# 🛠️ Antigravity AI Engineering Skill (`/debug`, `/push`, `/install`)

[![CI Quality Gate](https://github.com/s5condlast-cmd/Antigravityskill/actions/workflows/quality-gate.yml/badge.svg)](https://github.com/s5condlast-cmd/Antigravityskill/actions/workflows/quality-gate.yml)
[![Node.js](https://img.shields.io/badge/node-20%2B-blue.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.5%2B-blue.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/python-3.12%2B-blue.svg)](https://www.python.org/)
[![Go](https://img.shields.io/badge/go-1.22%2B-blue.svg)](https://go.dev/)
[![Rust](https://img.shields.io/badge/rust-2021%20edition-orange.svg)](https://www.rust-lang.org/)
[![PHP](https://img.shields.io/badge/php-8.2%2B-blue.svg)](https://www.php.net/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A lightweight, production-grade **Antigravity Slash Skill Suite** that equips AI agents with strict type-safety rules, systematic root-cause debugging workflows (`/debug`), safe Git delivery (`/push`), and 1-time design suite setup (`/install`).

---

## ✨ Features at a Glance

| Feature | Slash Command | Description |
| :--- | :--- | :--- |
| 🔬 **Systematic Debugging** | `/debug` | 5-Phase diagnostic workflow that eliminates compiler red lines and runs project-wide regression tests across TS, Python, Go, Rust, and PHP without lazy hacks (`@ts-ignore`, empty catches). |
| 🎯 **Pristine Code Invariants** | `/debug` | The 5 Laws: context ingestion first, boundary parsing, unrepresentable illegal states, zero placeholder TODOs, and regression prevention. |
| 🚀 **Safe Git Delivery** | `/push` | Streamlined 3-step Git staging, secret prevention audit, conventional commit formatting, and atomic remote syncing. |
| 📦 **Design Toolchain Setup** | `/install` | On-demand installation of dedicated design packages (`npx impeccable install`, `npx skills add Leonxlnx/taste-skill`, `npm install agentation`) for bespoke UI components. |
| 🧠 **Continuous Learning** | `/learn` | Post-success reminder prompting you to persist discovered invariants or architectural conventions into project memory. |
| 🚦 **Safety Guardrails** | Automatic | Strict traffic-light boundaries preventing secrets leaks, destructive resets, or out-of-scope edits. |

---

## 🚀 Quick Start & Installation

Run this single command in your terminal:

```bash
npx antigravityskill
```

This automatically sets up the skill in your current project (`.gemini/skills/antigravityskill`) and registers it globally for all your AI coding sessions.

### Alternative: Git Clone

* **Windows (PowerShell)**:

  ```powershell
  git clone https://github.com/s5condlast-cmd/Antigravityskill.git "$env:USERPROFILE\.gemini\antigravity\skills\antigravityskill"
  ```

* **macOS / Linux**:

  ```bash
  git clone https://github.com/s5condlast-cmd/Antigravityskill.git ~/.gemini/antigravity/skills/antigravityskill
  ```

---

## 💡 How to Use

### 1. The `/debug` Command (Code Quality & Root-Cause Fixes)

* **Fix compiler red lines**:
  > *"/debug fix the TypeScript type mismatches in `src/components/Navbar.tsx`"*
* **Investigate subtle runtime bugs**:
  > *"/debug investigate why session tokens are prematurely expiring on page refresh"*
* **Enforce clean code invariants**:
  > *"/debug refactor this auth controller to use Discriminated Unions and safe boundary parsing"*

### 2. The `/push` Command (Safe & Fast Git Delivery)

* **Stage, commit, and push**:
  > *"/push sync my verified changes to GitHub with a conventional commit message"*
* **Push feature branches safely**:
  > *"/push push this new auth module to origin"*

### 3. The `/install` Command (One-Time UI Toolchain Setup)

* When you enter `/install` or ask to install the UI design toolchain (this is a **1-time setup** per project), Antigravity triggers the installation of the specialized external design suite:

  ```bash
  npx impeccable install
  npx skills add Leonxlnx/taste-skill
  npm install agentation
  ```

* Once installed, Antigravity leverages taste-driven components and modern design tokens for your frontend without requiring reinstallations.

---

## 🔬 The 6 Laws of Pristine Code (`/debug`)

1. **Context Ingestion First**: Inspect existing project types, schemas, and utils before writing code.
2. **"Parse, Don't Validate"**: Convert external input into validated domain types at system boundaries.
3. **Make Illegal States Unrepresentable**: Use Discriminated Unions / Tagged Variants instead of loose nullable flags.
4. **No Placeholders or TODOs**: Always generate complete, fully implemented, type-checked logic.
5. **Dead Code & Duplication Elimination**: Ruthlessly remove unused imports, dead unreachable code, and duplicate logic.
6. **Zero-Regression Verification**: Run full test suites and consumer checks to guarantee fixes never break related features.

---

## 📚 Included Reference Guides

All reference manuals are organized inside the `references/` folder:

| Document | What's Inside |
| :--- | :--- |
| **[references/PUSH_PROTOCOL.md](references/PUSH_PROTOCOL.md)** | Fast & safe Git delivery: pre-flight secrets audit, conventional commit standard, and atomic push commands. |
| **[references/DEBUG_UTILITIES.md](references/DEBUG_UTILITIES.md)** | Type-safe `Result<T, E>` types, type guards, boundary parsers, and anti-hallucination helpers. |
| **[references/COMMON_BUG_PATTERNS.md](references/COMMON_BUG_PATTERNS.md)** | Catalog of recurring AI anti-patterns, frontend secrets protection, and surgical fixes. |
| **[references/CLI_CHEAT_SHEET.md](references/CLI_CHEAT_SHEET.md)** | Fast terminal cheat sheet for `tsc`, `mypy`, `pytest`, `go vet`, `cargo check`, `phpstan`, and `pest`/`phpunit`. |
| **[references/UI_TOOLCHAIN.md](references/UI_TOOLCHAIN.md)** | Integration guide and code recipes for `<Agentation />`, taste-skill tokens, and impeccable design systems. |

---

## 📂 Repository Layout

```text
Antigravityskill/
├── .github/
│   ├── workflows/quality-gate.yml         # Polyglot CI workflow (Node, Python, Go, Rust, Meta)
│   └── pull_request_template.md           # Pull request quality template
├── bin/
│   └── cli.js                             # Standalone executable CLI (npx antigravityskill)
├── commands/
│   ├── debug.md                           # /debug command definition
│   ├── install.md                         # /install 1-time setup definition
│   └── push.md                            # /push command definition
├── project-profile/
│   └── PROJECT_PROFILE.md                 # Project facts, standards, and invariants
├── references/
│   ├── PUSH_PROTOCOL.md                   # Fast & safe Git delivery protocol
│   ├── DEBUG_UTILITIES.md                 # Type guards & Result types
│   ├── COMMON_BUG_PATTERNS.md             # Common AI bug patterns & fixes
│   ├── CLI_CHEAT_SHEET.md                 # Diagnostic CLI cheat sheet
│   └── UI_TOOLCHAIN.md                    # Agentation, taste-skill & impeccable recipes
├── SKILL.md                               # Master skill definition & trigger matrix
├── GEMINI.md                              # Always-on Antigravity workspace rules bridge
├── AGENTS.md                              # Multi-agent standard instructions bridge
├── README.md                              # Comprehensive documentation
├── package.json                           # NPM package manifest
├── LICENSE                                # MIT License
└── .gitignore                             # Ignored files (.env, node_modules)
```

---

## 🚦 Safety Guardrails

| Status | Action | Behavior |
| :--- | :--- | :--- |
| 🔴 **STRICTLY PROHIBITED** | Committing `.env` secrets or API credentials | Hard blocked; keeps secrets uncommitted. |
| 🔴 **STRICTLY PROHIBITED** | Exposing private API keys in client/frontend code | Hard blocked; forces server-side API proxying. |
| 🔴 **STRICTLY PROHIBITED** | Force pushing (`git push --force`) or destructive reset | Hard blocked; protects user history. |
| 🔴 **STRICTLY PROHIBITED** | Suppressing errors (`@ts-ignore`, `any`, empty catch) | Hard blocked; root-cause fix required. |
| 🟡 **ASK FIRST** | Refactoring outside requested task scope | Pauses and asks for user confirmation. |
| 🟡 **ASK FIRST** | Installing new third-party packages | Checks if standard library / existing tools suffice. |
| 🟢 **AUTOMATIC** | Running compiler & test commands (`tsc`, `npm test`) | Runs static checks automatically. |
| 🟢 **AUTOMATIC** | Safe Git staging, conventional commits, and atomic pushes | Executes the 3-step push protocol automatically. |

---

## 🧠 Continuous Learning (`/learn`) & Circuit Breaker

### 💡 Post-Success Reminder Rules (`/learn`, Health Check & `/install`)

Whenever Antigravity **successfully resolves a bug, clears compiler errors, or implements a feature**, it provides a clean post-success reminder governed by smart frequency rules:

1. **`/learn`**: Included whenever an architectural invariant or bug fix pattern is discovered.
2. **`Workspace Health Check`**: Included **only once every 3 prompts** (or after fixing compiler errors) to keep chat clean.
3. **`/install` [1-Time Setup]**: Included **only once per project until installed**; omitted once `agentation` and design skills are configured.

```markdown
---

### 🧠 Persist This Lesson in Antigravity

To ensure Antigravity remembers this invariant and avoids this issue in future sessions, run:

> **/learn**
> *Lesson*: [1-2 sentences summarizing the specific invariant, pattern, or gotcha discovered]

---

### 🔍 Workspace Health Check (Shown once every 3 prompts or after compiler fixes)

> 💡 **Tip**: Press `Ctrl + Shift + M` (or `Cmd + Shift + M` on macOS) to check the **Problems** tab in VS Code and confirm 0 errors and 0 warnings remain.

---

### 🎨 Install External UI / Design Suite (`/install`) [Omit once installed]

> 💡 **Tip**: Run `/install` (1-time setup) to install the dedicated design toolchain (`npx -y impeccable install`, `npx -y skills add Leonxlnx/taste-skill`, `npm install agentation`).
```

### ⚡ The "Rule of Three" Circuit Breaker & `/debug` Reminder

If **3 consecutive edit attempts fail** or if the agent is stuck / having a hard time:

1. **STOP modifying code immediately.**
2. Acknowledge that current assumptions about the codebase are flawed.
3. Re-examine interface contracts, verify environment configuration, and formulate a new hypothesis.
4. Report findings to the user and remind them:
   > 💡 **Stuck on a tricky bug?** Run `/debug` to engage the full 5-phase systematic root-cause diagnostic engine.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
