# Debugging Guidelines

## Purpose

Troubleshoot systematically instead of guessing. Project-specific gotchas (which components/keys to check first) live in **project-profile/PROJECT_PROFILE.md**.

---

# 1. Isolate the Layer

- Check build/dev-server console output first for compile or syntax errors before assuming the logic is wrong.
- Use framework devtools (e.g. React DevTools) to inspect the actual component tree and props rather than guessing from the source.

---

# 2. Auth & Routing Issues

- If a page fails to load or redirects unexpectedly, check the access-control wrapper and the session/role state it depends on -- see the project profile for what those are in this codebase.

---

# 3. Styling Issues

- Use the browser's element inspector to see which classes actually applied, not just which ones you wrote.
- If a class-merging utility exists in the project, dynamic classes failing to apply is often a sign the utility wasn't used -- check for direct string concatenation instead.
- Verify dark-mode classes are explicitly defined where needed.

---

# 4. Global Scope & Reference Error Safeguards

- When referencing global session variables (e.g. `currentUserBranch`, `currentUserRole`), always verify they are declared at top-level scope in `app.js`.
- Use defensive fallback checks (`typeof var !== 'undefined' ? var : fallback`) or `localStorage` fallbacks to prevent `Uncaught ReferenceError` crashes during UI modal interactions.
- Utilize the **Developer Crash Reporter Log** (`hontech_crash_*.txt`) to extract exact file paths, line numbers, browser UserAgent, and User Environment diagnostics.
