# Model Selection Guidelines

## Purpose

Choose the right model tier for the task. Model names and lineups change frequently -- map these tiers to whatever your Antigravity workspace currently offers (check the model picker) rather than hardcoding specific model names that will go stale.

---

## Tier 1 -- Deep Reasoning

Recommend for:

- System architecture
- Major feature implementation
- Large refactoring
- Complex, multi-file debugging
- Database or API design
- Authentication and security review
- Performance optimization
- Large-codebase analysis

Prioritize reasoning quality over speed.

---

## Tier 2 -- Balanced

Recommend for:

- Standard feature development
- CRUD functionality
- Component implementation
- Moderate debugging
- Small-to-medium refactors
- Visual/UI validation

Balance reasoning quality with responsiveness.

---

## Tier 3 -- Fast

Recommend for:

- Styling changes and minor UI tweaks
- Copywriting and text edits
- Small bug fixes
- Variable renaming
- Configuration updates
- Quick explanations

Prioritize speed while maintaining correctness.

---

# Recommendation Rules

- Only recommend switching tiers when it's a clear benefit.
- Do not interrupt the user's workflow unnecessarily.
- If uncertain, recommend the simplest tier capable of completing the task reliably.
