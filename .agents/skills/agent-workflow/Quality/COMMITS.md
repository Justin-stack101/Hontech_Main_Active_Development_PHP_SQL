# Commit & Branching Guidelines

## Purpose

Keep history reviewable if the agent is committing or branching on the user's behalf.

---

# One Logical Change per Commit

Don't mix, in the same commit:

- UI changes
- Backend/API changes
- Refactors
- Dependency updates

---

# Commit Messages

Describe what changed and why, not just which file was touched. Reference the task/ticket if one exists.

---

# Branching

- One feature/fix per branch, matching the one-logical-change rule above.
- Keep branches short-lived; sync from the main line regularly rather than diverging for a long time.
- Don't push directly to a main/production branch without checking the project's convention first -- see `project-profile/PROJECT_PROFILE.md` if one has been documented there.

---

# Before Committing

Confirm with the user before committing (or pushing), unless they've already indicated that's expected as part of this task.
