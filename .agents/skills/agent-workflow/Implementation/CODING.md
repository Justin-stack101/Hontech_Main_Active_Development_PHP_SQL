# Coding Guidelines

## Purpose

Implement approved plans while producing maintainable, production-quality code.

---

# Implementation

After approval:

- Follow the approved plan.
- Stay within scope.
- Preserve existing functionality.
- Follow project conventions.
- Avoid feature creep.
- Avoid unnecessary optimization.

When more than one valid way to implement something exists, or you're tempted to touch something outside the plan, see **Implementation/DECISIONS.md**. For refactoring specifically, see **Implementation/REFACTORING.md** -- don't refactor unrelated code without checking it first.

---

# Code Quality

Adjectives like "readable" or "maintainable" aren't actionable on their own -- here's what they mean concretely.

## Readability

- A function or component should be understandable without needing to open other files, most of the time.
- Prefer early returns over deeply nested conditionals.
- If you can't summarize what a function/component does in one sentence, it's probably doing too much.

## Single Responsibility

- Each function does one thing; each component renders one coherent piece of UI.
- If a function's name needs "and" to describe it (e.g. `validateAndSave`), it's probably two functions.

## DRY -- Without Overdoing It

- Extract a shared abstraction once the same logic appears three or more times, not on the first duplication -- premature abstraction adds its own complexity. See **Implementation/DECISIONS.md**.

## Type Safety (TypeScript)

- Avoid `any`; use `unknown` with narrowing, or a real type/interface, instead.
- Let types be inferred where it's obvious; annotate explicitly at function boundaries (parameters, return types) where it isn't.
- Model state that can only be in one shape at a time with a discriminated union rather than several optional fields that can drift out of sync -- e.g. `{ status: 'loading' } | { status: 'error'; message: string } | { status: 'success'; data: T }` instead of separate `isLoading` / `error` / `data` fields that could all be set at once.

## Consistency

- Match the formatting the project's linter/formatter already enforces -- don't introduce a second style.
- Match existing patterns in neighboring files (import order, file structure) rather than inventing a new convention for one file.

---

# Naming

- Names should describe intent, not just type (`activeUsers` over `userList`, `handleSubmit` over `onClick`).
- Booleans read as questions: `isLoading`, `hasError`, `canEdit` -- not `loading`, `error`, `edit`.
- Match the vocabulary already used in the codebase/domain -- don't introduce a new term for a concept that already has a name (see project profile for this project's domain terms).

Avoid:

- tmp, data1, test2, foo, bar
- Abbreviations that aren't already an established convention in this codebase.

---

# Error Handling

Handle errors gracefully.

Provide meaningful error messages.

Never silently ignore exceptions.

---

# Performance & Security

These get their own dedicated files -- read them instead of relying on this section alone:

- **Implementation/PERFORMANCE.md** for rendering, animation, and bundle-size guidance.
- **Implementation/SECURITY.md** for access control, auth, and input-handling guidance.

As a baseline while coding: prefer efficient algorithms over premature optimization, and never introduce SQL injection, XSS, unsafe secrets, or insecure authentication -- validate all user input.

---

# Verification

Before finishing:

- Verify requirements are met.
- Ensure existing functionality still works.
- Verify project conventions.
- Check that only intended files changed.
- See **Quality/TESTING.md** for how to verify this concretely.
- See **Implementation/DOCUMENTATION.md** if the change touches a public API, component, hook, or README-level step.
- See **Quality/COMMITS.md** if you're committing on the user's behalf.
