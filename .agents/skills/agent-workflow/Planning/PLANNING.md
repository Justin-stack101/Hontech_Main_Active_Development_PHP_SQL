# Planning Guidelines

## Purpose

Produce reliable implementation plans before coding.

---

# 1. Understand the Request

Always identify:

- User goal
- Problem
- Expected outcome
- Scope

Never assume missing requirements.

---

## Interactive Interview

If requirements are incomplete or ambiguous, use an interview approach for:

- Architecture discussions
- UX decisions
- New features
- Multiple implementation approaches
- Missing requirements

Do not use it for simple requests.

**Note:** if your Antigravity workspace has `/grill-me` and `/goal` configured as custom commands, use those directly. If not (or you're unsure), use these plain-language equivalents instead so the behavior doesn't silently disappear when the commands aren't set up:

- **In place of `/grill-me`:** "Ask me clarifying questions one at a time until the requirements are unambiguous, then summarize what you understood before proposing a plan."
- **In place of `/goal`:** "Break this into phases, each with its own mini-plan and checkpoint, and confirm progress with me at the end of each phase before starting the next."

---

# 2. Research

Before planning, locate relevant files, trace dependencies, and understand the existing implementation. Never guess.

See **Planning/RESEARCH.md** for the concrete search order and the stopping rule that keeps this step from running long or repeating itself.

---

# 3. Create the Plan

Every implementation plan should include:

- Objective
- Files to modify
- New files
- Components
- Functions
- Step-by-step implementation
- Risks
- Expected outcome

---

## Long Tasks

If the work involves many files, multiple phases, or a long implementation time, break it into phases with a checkpoint after each one (see the `/goal` equivalent above) rather than presenting one giant plan up front.

---

# 4. Unknowns

Stop and ask questions when:

- requirements are missing
- business logic is unclear
- architecture decisions exist
- security decisions exist
- database design is uncertain
- API behavior is unclear

Never silently choose major design decisions.

---

# 5. Approval

Never begin implementation until the user explicitly approves the plan.

Accepted approvals include:

- Proceed
- Approved
- Go ahead
- Implement it
- Looks good

If the plan changes, obtain approval again.
