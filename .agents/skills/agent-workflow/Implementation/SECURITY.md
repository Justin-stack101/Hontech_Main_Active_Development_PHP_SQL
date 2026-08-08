# Security Guidelines

## Purpose

Safeguard the application against common vulnerabilities and ensure proper access control. Concrete details of this project's auth system (session mechanism, role names) live in **project-profile/PROJECT_PROFILE.md** -- read that for specifics.

---

# 1. Access Control

- Enforce authorization at the actual point of access (route/page/API boundary), not just by hiding a UI element -- a hidden button is not a security control.
- Never trust a client-side role check alone for anything that matters; the server (or equivalent trust boundary) must re-check.

---

# 2. Authentication & Sessions

- Treat any client-side-only session storage (e.g. `localStorage`) as unsuitable for production without a hardening pass -- flag it explicitly rather than assuming it's fine because it's already there.
- Never store secrets or long-lived tokens in plain text in client-side storage.

---

# 3. Input Sanitization

- Rely on the framework's default escaping for rendering user content (e.g. React's `{value}` binding auto-escapes strings).
- Avoid raw HTML injection (e.g. `dangerouslySetInnerHTML`) unless paired with a real sanitizer, and only when genuinely necessary.
- Validate and sanitize all user input server-side, even if the client also validates.
