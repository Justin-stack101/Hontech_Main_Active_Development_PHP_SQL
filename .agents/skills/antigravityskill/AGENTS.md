# ⚡ Antigravity Engineering Framework Agent Instructions

This repository is governed by the rules in **[`SKILL.md`](./SKILL.md)**.

## 🧭 Slash Command Routing & Step-by-Step Execution

When the user enters any of the following slash commands or intents, execute the step-by-step workflow from [`SKILL.md`](./SKILL.md):

1. **`/debug`**:
   - Follow the 5-step sequence: 1. Read & Scan ➔ 2. Find Root Cause & Redundancy Scan ➔ 3. Minimal Safe Fix & Dead Code Removal ➔ 4. Verify & Regression Check (0 Errors & 0 Broken Dependents) ➔ 5. `/learn`, Problems Tab & `/install` Reminder.
   - Never guess file contents. Never hide errors with `@ts-ignore`, `as any`, or empty `catch` blocks. Eliminate dead code and redundant logic.
2. **`/push`**:
   - Follow the 4-step sequence: 1. Secrets & Status Audit ➔ 2. Stage Files ➔ 3. Conventional Commit ➔ 4. Push & Report Link.
   - Never commit `.env` files or secrets. Never expose private API keys in frontend bundles. Never force push.
3. **`/install`**:
   - Follow the Section 3 workflow: Inform user and execute 1-time installation of the external design suite (`npx impeccable install`, `npx skills add Leonxlnx/taste-skill`, `npm install agentation`) to handle bespoke UI styling. If already installed, skip reinstallation.
