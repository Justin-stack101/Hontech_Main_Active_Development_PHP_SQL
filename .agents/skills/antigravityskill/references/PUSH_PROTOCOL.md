# 🚀 Fast & Safe Git `/push` Protocol

A lightweight, streamlined Git delivery workflow for staging, committing, and pushing code cleanly to remote repositories without broken builds or accidental secrets leaks.

---

## 🧭 The 3-Step `/push` Workflow

```text
┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│ 1. PRE-FLIGHT AUDIT       │ ───> │ 2. CONVENTIONAL COMMIT    │ ───> │ 3. ATOMIC PUSH & SYNC     │
│  - Audit git status       │      │  - Craft clear 'feat/fix' │      │  - Push to active branch  │
│  - Verify no secret leaks │      │  - Reference issue/ticket │      │  - Provide remote URL     │
│  - Check compiler health  │      │  - Stage verified files   │      │  - Trigger /learn check   │
└───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘
```

---

## 🛡️ Step 1: Pre-Flight Safety Audit

Before staging any files:

1. **Check Git Status**: Inspect untracked and modified files (`git status`).
2. **Secrets & Frontend Key Audit**: Verify that `.env`, `.env.local`, API keys, and certificates are in `.gitignore`, and ensure no private API keys are embedded in client-side code.
3. **Verify Build Health**: Ensure no broken syntax or red lines exist before pushing.

---

## 💬 Step 2: Conventional Commit Message Standards

All commits must follow the **Conventional Commits** standard:

$$\text{Format: } \langle\text{type}\rangle(\langle\text{scope}\rangle): \langle\text{description}\rangle$$

| Type | Purpose | Example |
| :--- | :--- | :--- |
| `feat` | New user-facing feature or module | `feat(auth): add rate limiting middleware` |
| `fix` | Bug fix or compiler error resolution | `fix(auth): handle null token in refresh interceptor` |
| `refactor` | Code change that neither fixes a bug nor adds a feature | `refactor(utils): simplify date formatting helper` |
| `docs` | Documentation updates | `docs(readme): add /push quick start guide` |
| `style` | Formatting, missing semi-colons, whitespace | `style(nav): align header icon padding` |
| `test` | Adding or updating tests | `test(button): add keyboard navigation spec` |
| `ci` | Changes to CI workflows or scripts | `ci(gate): add meta documentation validation` |

---

## 📦 Step 3: Fast Atomic Push

Execute atomic Git commands in sequence:

```powershell
# 1. Stage modified & new files safely
git add -A

# 2. Commit with conventional message
git commit -m "feat(scope): descriptive summary of changes"

# 3. Push to active remote branch
git push origin <current-branch>
```

---

## 🚦 Safety Rules

* 🔴 **NEVER** force push (`git push --force`) to shared branches (`main`, `master`, `staging`).
* 🔴 **NEVER** commit files containing `API_KEY`, `SECRET`, `PASSWORD`, or private certificates.
* 🟢 **ALWAYS** summarize pushed commits and provide a direct link to the remote repository.
