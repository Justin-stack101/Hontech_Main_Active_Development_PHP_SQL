# Research Guidelines

## Purpose

Understand the existing implementation before planning -- without over-researching.

---

# Search Order

1. Routes / entry points
2. Components / UI layer
3. APIs / services
4. Database / data models
5. Config
6. Existing similar patterns elsewhere in the codebase

---

# Stopping Rule

Stop once there's enough evidence to write a reliable plan. Signs research is sufficient:

- Every file the change will touch is identified.
- The existing pattern is understood well enough to follow it (or deliberately deviate, with a stated reason).
- The current behavior could be explained accurately to someone else.

---

# Avoid

- Re-opening the same file more than once without a new reason to.
- Re-running an equivalent search with slightly different wording.
- Reading unrelated files "just in case."
