# 🎯 Universal Project Profile (Codebase Facts & Rules)

> 💡 **Purpose**: This document contains the single source of truth for repository facts, tools, coding standards, and safety rules for AI agents.

---

## 1. 🛠️ Tech Stack & Language Versions

Use these versions to ensure compatibility:

* **Languages & Runtimes**:
  * **TypeScript**: `5.5+` (Strict mode enabled, `strictNullChecks: true`)
  * **Node.js**: `20 LTS+`
  * **Python**: `3.12+` (`mypy`, `pytest`, `ruff`)
  * **Go**: `1.22+` (`go vet`, `go test`)
  * **Rust**: `2021 Edition / 1.78+` (`cargo check`, `cargo test`)
  * **PHP**: `8.2+` / `8.3+` (Strict types `declare(strict_types=1);`, `phpstan`, `pest`, `phpunit`)
* **Package Managers**:
  * Node.js: `npm`, `pnpm`
  * Python: `uv`, `pip`
  * Rust: `cargo`
  * Go: `go mod`
  * PHP: `composer` (`composer.json`, `composer.lock`)
* **Core Frameworks & UI**:
  * Next.js `15` / React `19`
  * Tailwind CSS `v3.4+` / `v4`
  * Radix UI / Lucide Icons (`lucide-react`)
* **Databases & State**:
  * PostgreSQL `16+` / SQLite
  * Prisma / Drizzle ORM
  * Zustand / TanStack Query
* **Dedicated UI Design Toolchain (`/install`)**:
  * `npx impeccable install`
  * `npx skills add Leonxlnx/taste-skill`
  * `npm install agentation`

---

## 2. 🚦 Tool Safety Rules (Traffic Lights)

| Category | Action | AI Behavior |
| :--- | :--- | :--- |
| 🔴 **NEVER DO (STRICTLY PROHIBITED)** | Committing `.env` secrets, API keys, tokens, or private keys | **Hard Stop**: Stop immediately. Check `.gitignore`. Never commit secrets. |
| 🔴 **NEVER DO (STRICTLY PROHIBITED)** | Exposing private API keys or service credentials in frontend bundles | **Hard Stop**: Keep secret keys strictly on the server; never expose via client prefixes. |
| 🔴 **NEVER DO (STRICTLY PROHIBITED)** | Force pushing (`git push --force`) or destructive resets (`git reset --hard`) | **Hard Stop**: Never overwrite remote history or delete user work. |
| 🔴 **NEVER DO (STRICTLY PROHIBITED)** | Suppressing errors with `@ts-ignore`, `as any`, empty catches, or fake delays | **Hard Stop**: Identify and fix the real root-cause bug. |
| 🟡 **ASK USER FIRST** | Changing code outside the requested task | **Ask First**: Ask: *"I noticed X could be cleaned up. Would you like me to do that?"* |
| 🟡 **ASK USER FIRST** | Installing new packages or changing `package.json` | **Ask First**: Check if an existing package already solves the problem. |
| 🟡 **ASK USER FIRST** | Modifying database schemas, running destructive migrations, or deleting files | **Ask First**: Confirm data safety and backup before making destructive changes. |
| 🟢 **DO AUTOMATICALLY** | Running compilers and tests (`tsc`, `pytest`, `phpstan`, `composer test`, `npm test`) | **Auto Run**: Check for syntax errors, red lines, and broken tests. |
| 🟢 **DO AUTOMATICALLY** | Staging, committing, and pushing safe Git changes | **Auto Run**: Follow the 4-step push protocol. |
| 🟢 **DO AUTOMATICALLY** | Adding `/learn` reminders after successful fixes | **Auto Run**: Remind the user to save the lesson into Antigravity memory. |

---

## 3. 🏗️ Core Anti-Hallucination & Quality Rules

1. **Read Files First**: Always inspect existing types, schemas, and utils before writing code. Never guess.
2. **Validate at Boundaries**: Convert unknown external inputs into validated TypeScript types immediately.
3. **Use Discriminated Unions**: Use tagged variants (`status: 'success' | 'error'`) instead of loose optional fields.
4. **No Placeholders or TODOs**: Every generated function, component, and test must be 100% complete and working.
5. **No Hallucinated Packages**: Verify `package.json` before importing libraries.
6. **Hide API Keys from Frontend**: Never hardcode or leak private API keys in client bundles. Always proxy through backend API routes.
