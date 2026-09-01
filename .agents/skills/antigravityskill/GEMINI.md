# ⚡ Antigravity Engineering Framework Workspace Rules

This repository is governed by the rules in **[`SKILL.md`](./SKILL.md)**.

## 🧭 Slash Command Triggers & Protocols

Follow these step-by-step rules whenever a slash command or intent is triggered:

* **`/debug` (or Compiler Red Lines / Bug Reports)**:
  * **Step 1**: Read the exact error and file content first. Do not guess.
  * **Step 2**: Identify the true root cause and scan for dead code / duplicate logic.
  * **Step 3**: Apply a minimal, type-safe fix and remove unused/redundant code. Never silence errors with `@ts-ignore`, `as any`, empty catches, or dummy delays.
  * **Step 4**: Run compiler/test checks to verify zero red lines and zero regressions in related functionality.
  * **Step 5**: End with a smart post-success reminder (/learn lesson, VS Code Problems tab check once per 3 prompts, and /install 1-time setup reminder).

* **`/push` (or Git Commits / Sync Requests)**:
  * **Step 1**: Run `git status` and verify `.env`, secret tokens, and frontend code are free of private API keys.
  * **Step 2**: Stage files with `git add -A`.
  * **Step 3**: Write a clear conventional commit message (`feat(...)`, `fix(...)`).
  * **Step 4**: Push to the active remote branch and share the sync link.

* **`/install` (or UI Design Toolchain Setup - 1-Time Setup)**:
  * **Step 1**: Check if design extensions are already present. If so, skip setup.
  * **Step 2**: Inform the user and trigger 1-time installation of `npx impeccable install`, `npx skills add Leonxlnx/taste-skill`, and `npm install agentation`.
  * **Step 3**: Follow installed design skills to generate elegant UI components.
