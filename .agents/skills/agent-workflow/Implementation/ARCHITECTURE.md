# Architectural Patterns

## Purpose

Keep code organized so structure stays predictable as the codebase grows. The concrete names of this project's specific wrapper components, routing layout, and utilities live in **project-profile/PROJECT_PROFILE.md** -- read that alongside this file.

---

# 1. Component Composition

- Keep components small and focused on a single responsibility.
- Push cross-cutting concerns (auth checks, feature gating, permission checks) into dedicated wrapper components rather than repeating the check inline in every page. Check the project profile for this codebase's actual wrapper component names.

---

# 2. Routing Hierarchy

- Follow whatever routing convention the project already uses -- don't introduce a second pattern alongside an existing one.
- Group related routes under a shared path base rather than scattering them.

---

# 3. Styling Utilities

- If the project has a class-merging utility (e.g. `clsx` + `tailwind-merge`), always use it when combining static and dynamic classes rather than concatenating class strings by hand -- this avoids silent conflicts between classes (e.g. `px-2` vs `px-4`).
