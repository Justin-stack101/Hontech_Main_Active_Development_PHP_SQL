# Performance Guidelines

## Purpose

Keep the app responsive and efficient. These tips assume a React + Vite stack (check `project-profile/PROJECT_PROFILE.md` or the project's `package.json` if unsure) -- skip anything that doesn't apply to your stack.

---

# 1. Rendering Optimization

- Watch for unnecessary re-renders in deeply nested component trees.
- Use `useMemo`/`useCallback` when passing complex objects or functions to deeply nested child components that re-render often.
- Don't reach for memoization by default -- only where obvious re-render churn or profiling justifies it.

---

# 2. Animations

- When using an animation library (e.g. Framer Motion / `motion/react`), stick to simple entrance/exit animations (`opacity`, transform-based movement).
- Avoid animating properties that trigger layout recalculation (`width`, `height`, `margin`, `top`/`left`).

---

# 3. Build & Import Efficiency

- Keep imports clean and direct so the bundler (e.g. Vite/esbuild) can do its job.
- Avoid importing an entire library when only a single utility is needed.
- A new dependency should earn its place -- prefer what's already in the project.
