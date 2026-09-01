---
name: antigravityskill
description: "Simple, step-by-step engineering framework for /debug (root-cause bug fixes and clean code) and /push (safe Git commits and sync). Built with strict anti-hallucination checklists."
---

# Antigravity Engineering Framework: `/debug` & `/push`

This skill gives AI agents simple, step-by-step rules to write clean code, debug issues systematically, and push Git changes safely without hallucinating.

---

## 🧭 Command Trigger Matrix

When a user asks for any of the tasks below, follow its exact step-by-step protocol:

| Command / Intent | Protocol | What to Do | References |
| :--- | :--- | :--- | :--- |
| `/debug`, bug reports, type errors, red lines, logic bugs, dead code, duplicates | **`/debug`** | Follow the 5-step debug sequence. Fix root causes, eliminate dead code and redundant duplicates. | [references/DEBUG_UTILITIES.md](references/DEBUG_UTILITIES.md)<br>[references/COMMON_BUG_PATTERNS.md](references/COMMON_BUG_PATTERNS.md)<br>[references/CLI_CHEAT_SHEET.md](references/CLI_CHEAT_SHEET.md) |
| `/push`, git commit, git push, sync repo, deploy code | **`/push`** | Follow the 4-step push sequence. Check for secrets, use conventional commits, push safely. | [references/PUSH_PROTOCOL.md](references/PUSH_PROTOCOL.md) |
| `/install`, install design tools, UI setup | **`/install` Toolchain** | Execute installation of external design toolchain: `npx impeccable install`, `npx skills add Leonxlnx/taste-skill`, and `npm install agentation`. | [README.md](README.md) |

---

## 🚦 Safety Rules (Traffic Light System)

Follow these rules on every action:

| Color | Action | Rule for AI |
| :--- | :--- | :--- |
| 🔴 **NEVER DO (STRICTLY PROHIBITED)** | Staging or committing `.env` files, API keys, passwords, or secrets | **Hard Stop**: Stop immediately. Check `.gitignore`. Never commit secrets. |
| 🔴 **NEVER DO (STRICTLY PROHIBITED)** | Exposing private API keys, service tokens, or secrets in frontend/client bundles | **Hard Stop**: Keep secret keys strictly on the server/backend. Never expose private credentials via client-side prefixes. |
| 🔴 **NEVER DO (STRICTLY PROHIBITED)** | Running `git push --force` or `git reset --hard` | **Hard Stop**: Never overwrite remote history or delete user work. |
| 🔴 **NEVER DO (STRICTLY PROHIBITED)** | Hiding errors with `@ts-ignore`, `as any`, empty `catch {}`, or random `setTimeout` delays | **Hard Stop**: Fix the real root cause. Never hide or ignore errors. |
| 🟡 **ASK USER FIRST** | Changing code outside the user's requested task | **Ask First**: Ask: *"I noticed X could be cleaned up. Would you like me to do that?"* |
| 🟡 **ASK USER FIRST** | Installing new packages or editing `package.json` dependencies | **Ask First**: Verify if the project already has a tool to solve this. |
| 🟡 **ASK USER FIRST** | Changing database schemas, running destructive migrations, or deleting files | **Ask First**: Confirm data safety and backup before making destructive changes. |
| 🟢 **DO AUTOMATICALLY** | Running compilers and tests (`tsc`, `pytest`, `phpstan`, `composer test`, `npm test`, `cargo check`, `go test`) | **Auto Run**: Check for syntax errors, red lines, and broken tests. |
| 🟢 **DO AUTOMATICALLY** | Safe Git staging, conventional commits, and atomic remote pushes | **Auto Run**: Follow the 4-step push protocol. |
| 🟢 **DO AUTOMATICALLY** | Adding a `/learn` reminder after a successful fix or task completion | **Auto Run**: Remind the user to save the lesson into project memory. |

---

## 🤝 Precedence Rules (When Rules Conflict)

If two instructions conflict, follow this priority order (1 is highest):

1. **User's Explicit Instruction** (Highest priority).
2. **Project Profile Facts** (`project-profile/PROJECT_PROFILE.md`).
3. **Skill Invariants & Safety Rules** (This document).
4. **General Model Defaults** (Lowest priority).

---

## 🔬 SECTION 1: The `/debug` Protocol

Follow this 5-step sequence in order for every bug, error, or type issue:

```text
Step 1: Read & Scan ──> Step 2: Find Root Cause ──> Step 3: Minimal Safe Fix ──> Step 4: Verify & Regression Check ──> Step 5: /learn Lesson
```

### 📋 Step-by-Step Debugging Execution Checklist

1. **Step 1: Read & Scan (Do Not Guess)**
   - Read the exact error message, line number, and stack trace.
   - Read the actual file content around the failing code using read tools.
   - Read existing project types, path aliases (`@/*`), and imported utilities.
   - *Anti-Hallucination Rule*: Never guess what code is in a file without reading it first.

2. **Step 2: Find Root Cause & Redundancy Scan**
   - Identify why the failure happens (type mismatch, null/undefined access, async timing, missing return).
   - **Audit for Redundancies**: Scan for dead code, unused imports/variables, unreachable branches, and copy-pasted duplicate utility functions.
   - Check against known bugs in [references/COMMON_BUG_PATTERNS.md](references/COMMON_BUG_PATTERNS.md).
   - *Anti-Hallucination Rule*: Do not fix symptoms. Fix the underlying cause and remove dead/redundant code.

3. **Step 3: Minimal Safe Fix & Dead Code Removal**
   - Make the smallest change that fixes the root cause.
   - Eliminate unused imports, dead variables, unreachable code, and consolidate duplicate helpers into shared utilities.
   - Validate inputs at system boundaries ("Parse, Don't Validate").
   - Use Discriminated Unions (`type State = { status: 'success'; data: T } | { status: 'error'; error: Error }`) instead of loose nullable flags.
   - *Anti-Hallucination Rule*:
     - ❌ NEVER use `@ts-ignore` or `// @ts-nocheck`.
     - ❌ NEVER cast to `any` (`as any`).
     - ❌ NEVER write empty `catch (e) {}` blocks.
     - ❌ NEVER add dummy `setTimeout` delays to hide race conditions.
     - ❌ NEVER expose private API keys in client-side code; proxy external API calls through server routes.

4. **Step 4: Verify & Regression Check (Zero Red Lines + Zero Broken Consumers)**
   - **Impact Radius Scan**: Identify all call sites, dependent consumers, and interacting modules that rely on the modified functions, interfaces, or database schemas.
   - **Run Project-Wide Compiler & Test Suites**:
     - TypeScript / Node: `npx tsc --noEmit` across whole workspace + `npm test`
     - Python: `mypy .` + `pytest`
     - PHP: `phpstan analyse` + `composer test` (Pest / PHPUnit)
     - Go: `go vet ./...` + `go test ./...`
     - Rust: `cargo check --all-targets` + `cargo test`
   - *Regression Invariant*: Confirm that fixing the immediate error did NOT break any related functionality or existing test suites.

5. **Step 5: Provide `/learn` Lesson**
   - Add the required `/learn` reminder box at the end of the response.

---

## 🚀 SECTION 2: The `/push` Protocol

Follow this 4-step sequence for every Git commit and sync request:

```text
Step 1: Secrets & Status Audit ──> Step 2: Stage Files ──> Step 3: Conventional Commit ──> Step 4: Push & Report
```

### 📋 Step-by-Step Push Execution Checklist

1. **Step 1: Secrets & Status Audit**
   - Run `git status` to see modified and untracked files.
   - Check `.gitignore` to ensure `.env`, `.env.local`, API keys, tokens, and certificates are excluded.
   - *Anti-Hallucination Rule*: If any secret or credential file is present, STOP and remove it before staging.

2. **Step 2: Stage Files**
   - Stage verified files cleanly:

     ```powershell
     git add -A
     ```

3. **Step 3: Create Conventional Commit**
   - Format: `<type>(<scope>): <clear description>`
   - Common types: `feat` (new feature), `fix` (bug fix), `refactor` (code cleanup), `docs` (documentation), `style` (formatting), `test` (tests), `ci` (CI/CD).
   - Example:

     ```powershell
     git commit -m "fix(auth): handle expired refresh token boundary"
     ```

4. **Step 4: Push & Report Link**
   - Push to the active remote branch:

     ```powershell
     git push origin <current-branch>
     ```

   - Give the user a clear summary of what was pushed and the remote branch/commit link.

---

## 📦 SECTION 3: The `/install` Protocol (One-Time Design Toolchain Setup)

When the user enters `/install` or requests installation of the external design and taste skill toolchain (this is a **1-time setup per project**):

1. **Check if already installed**: If `agentation` and design skills are already configured in the workspace, skip re-installation and inform the user.
2. **Execute the 1-time installation** upon user request:

   ```bash
   npx -y impeccable install
   npx -y skills add Leonxlnx/taste-skill
   npm install agentation
   ```

3. **Confirm Toolchain Readiness**: Inform the user that the external design suite (`agentation`, `taste-skill`, `impeccable`) is installed and active in their environment.

---

## 💡 Post-Success `/learn`, Health Check & `/install` Reminder Rules

Whenever you successfully fix a bug, resolve compiler errors, or complete a major coding task, include the post-success learning box governed by these frequency rules:

1. **`/learn`**: Include whenever a new architectural rule, bug pattern, or invariant is discovered.
2. **`Workspace Health Check`**: Include **only once every 3 prompts** (or after fixing compiler errors) to avoid repetitive clutter.
3. **`/install` [1-Time Setup]**: Include **only once per project**. Once `agentation` and design skills are installed (or after `/install` has been triggered), **do NOT show this reminder again**.

### Standard Post-Success Template

```markdown
---

### 🧠 Persist This Lesson in Antigravity

To make sure Antigravity remembers this fix and avoids this issue in future sessions, run:

> **/learn**
> *Lesson*: [1-2 simple sentences explaining the specific rule, pattern, or fix discovered]

---

### 🔍 Workspace Health Check (Shown once every 3 prompts or after compiler fixes)

> 💡 **Tip**: Press `Ctrl + Shift + M` (or `Cmd + Shift + M` on macOS) to check the **Problems** tab in VS Code and confirm 0 errors and 0 warnings remain.

---

### 🎨 Install External UI / Design Suite (`/install`) [Omit if already installed]

> 💡 **Tip**: Run `/install` (1-time setup) to install the dedicated external design suite (`npx -y impeccable install`, `npx -y skills add Leonxlnx/taste-skill`, `npm install agentation`).
```

---

## ⚡ The Rule of Three (Circuit Breaker)

If **3 consecutive fix attempts fail**:

1. **STOP editing code immediately.**
2. Tell the user that the current assumption about the codebase was incorrect.
3. Re-read the source files, check environment state, and state the new plan clearly.
4. Remind the user to run `/debug`:
   > 💡 **Need a systematic fix?** Run `/debug` to run the step-by-step diagnostic workflow.
