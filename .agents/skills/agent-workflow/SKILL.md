---
name: agent-workflow
description: "Core operating workflow for a coding agent: understand the request, research the codebase, plan, get user approval, implement, verify. Routes to specialized guides for planning, coding, architecture, performance, security, UI/accessibility/responsiveness, testing, debugging, and model selection. Consult this on any implementation task -- use it to decide which specialized file(s) below apply before writing or changing any code."
---

# Agent Behavior Guidelines

This document defines the agent's overall workflow and routes to specialized guides. It's written to be portable across projects. Anything specific to *this* codebase (component names, auth mechanism, build tooling, whether a test framework exists) lives in **project-profile/PROJECT_PROFILE.md** -- read that file for concrete details, and replace it entirely when adapting this skill set to a different repo.

## Principles

- Understand before implementing.
- Research before planning.
- Plan before coding.
- Get user approval before significant changes.
- Deliver production-quality work.
- Communicate clearly.
- Stay within the requested scope.

## Reasoning Mindset

These apply on every task, not just complex ones -- they shape *how* to think, not just what to check:

- Question assumptions rather than filling gaps silently.
- Look for existing patterns before inventing a new one.
- Prefer extension over replacement -- add to what exists before rewriting it.
- Never duplicate functionality that already exists elsewhere in the codebase.
- Reduce complexity where possible; don't add it to look thorough.
- State trade-offs explicitly rather than silently picking a side on anything non-obvious.

## Conflict Resolution

When guidance from different files conflicts, resolve in this order:

1. The user's explicit instruction in this conversation.
2. Facts in `project-profile/PROJECT_PROFILE.md` (they describe what's actually true of this codebase).
3. Security/correctness concerns (Implementation/SECURITY.md).
4. Existing conventions already in the codebase.
5. General style guidance in the other files.

If two *generic* files seem to conflict, that's usually a sign the guidance needs tightening -- flag it rather than picking silently.

---

## Workflow

For every non-trivial task, follow this workflow:

1. Understand the request.
2. Research the codebase.
3. Create an implementation plan.
4. Resolve unknowns (ask, don't guess).
5. Wait for explicit approval.
6. Implement.
7. Verify.

**Trivial** (skip straight to implementation): single-line fixes, typo corrections, copy edits, renaming a local variable, adding a comment.

**Non-trivial** (always plan first): adds/removes a file, touches auth/permissions/data handling, changes a public API or component contract, or would take more than ~10 minutes to implement.

If genuinely unsure which bucket a task falls into, treat it as non-trivial -- an unnecessary plan costs far less than an unreviewed change to the wrong thing.

## Execution Flow

```text
User
   │
   ▼
Understand → Research → Plan → Approval
   │
   ▼
Implementation
   ├── Coding        → Implementation/CODING.md
   ├── Architecture   → Implementation/ARCHITECTURE.md
   ├── Performance    → Implementation/PERFORMANCE.md
   └── Security       → Implementation/SECURITY.md
   │
   ├── UI, layout, responsiveness, accessibility → ui/UI_BUILDING.md
   │
   ▼
Quality
   ├── Testing    → Quality/TESTING.md
   └── Debugging  → Quality/DEBUGGING.md
   │
   ▼
Done
```

---

## Skill Routing

Every file in this repo is reachable from here -- read the ones relevant to the current task.

### Planning
Read **Planning/PLANNING.md** whenever: implementing a new feature, modifying existing functionality, creating an implementation plan, or gathering requirements.

### Research
Read **Planning/RESEARCH.md** whenever: exploring the codebase before writing a plan -- it gives a search order and a stopping rule so research doesn't run long or repeat itself.

### Coding
Read **Implementation/CODING.md** whenever: writing code, modifying code, or implementing an approved plan.

### Architecture
Read **Implementation/ARCHITECTURE.md** whenever: deciding where new code should live, introducing a new component/module boundary, or touching routing/composition patterns.

### Decisions
Read **Implementation/DECISIONS.md** whenever: more than one valid implementation approach exists, or you're tempted to change something outside the requested scope.

### Refactoring
Read **Implementation/REFACTORING.md** whenever: refactoring is requested, or you notice code that could be cleaner while doing something else.

### Documentation
Read **Implementation/DOCUMENTATION.md** whenever: adding or changing a public API, component, hook, or README-level setup step.

### Performance
Read **Implementation/PERFORMANCE.md** whenever: a change could affect render performance, bundle size, or animation smoothness.

### Security
Read **Implementation/SECURITY.md** whenever: touching authentication, authorization, user input, or anything that renders untrusted content.

### UI Development
Read **ui/UI_BUILDING.md** whenever: building pages, modifying layouts, creating components, changing styling, or improving responsiveness/accessibility. (This single file covers general UI principles, responsive layout, and accessibility together -- they used to be three separate files that duplicated and could drift from each other.)

### Testing
Read **Quality/TESTING.md** whenever: finishing an implementation, before marking a task done, or when asked to add/update tests.

### Debugging
Read **Quality/DEBUGGING.md** whenever: something is broken and the cause isn't immediately obvious.

### Commits
Read **Quality/COMMITS.md** whenever: committing or pushing changes on the user's behalf.

### Model Selection
Read **Models/MODEL_SELECTION.md** whenever recommending which model tier to use for a task.

### Project Profile
Read **project-profile/PROJECT_PROFILE.md** for the concrete, codebase-specific facts (component names, auth mechanism, tooling) that every file above deliberately leaves generic. This is the one file to replace when reusing this skill set in a different codebase.

---

## General Reminders

- Never silently choose a major design decision -- ask.
- Avoid unnecessary changes and unrelated refactors.
- If a plan changes mid-implementation, get re-approval before continuing.
