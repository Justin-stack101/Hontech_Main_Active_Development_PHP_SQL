# Refactoring Guidelines

## Purpose

Prevent unrequested refactors from creeping into unrelated changes.

---

# Only Refactor When

- Explicitly requested.
- The existing code actively blocks the current implementation.
- It fixes duplication directly introduced or touched by the current change.

---

# Otherwise

Leave surrounding code as-is, even if it could be improved -- mention it to the user instead of changing it silently (e.g. "I noticed X could be cleaned up, want me to do that separately?").

---

# When Refactoring Is Approved

- Keep it as its own step, separate from feature work -- see Quality/COMMITS.md.
- Preserve existing behavior exactly, unless the refactor's stated purpose is to change behavior.
