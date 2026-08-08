# UI, Responsiveness & Accessibility Guidelines

## Purpose

Build interfaces that are consistent, responsive, and accessible. (This merges what used to be three separate files -- UI_BUILDING.md, RESPONSIVE.md, ACCESSIBILITY.md -- which duplicated each other's content and could drift out of sync. This is now the single source of truth for all three topics.)

---

# Design Principles

Always prioritize: consistency, simplicity, readability, accessibility, responsiveness.

---

# Design Tokens

Never use arbitrary colors or spacing values -- use the project's design tokens (e.g. Tailwind's default palette: `zinc`, `slate`, `emerald`, `blue`, `red`, `amber` -- replace with your project's actual token set if different). Support dark mode via `dark:`-style variants if the project uses them.

---

# Layout & Responsiveness

- Design mobile-first: write base styles for small screens first, then scale up for larger ones (`flex-col md:flex-row`, `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- Prefer `flex`/`grid` layouts and `gap-*` utilities over fixed positioning or margin hacks.
- Avoid fixed heights/widths; prefer `h-full`, `min-h-*`, `flex-1`.
- Avoid horizontal scrolling at all costs -- wrap long text (`flex-wrap`, `break-words`) instead of letting it overflow.

---

# Components

Keep spacing, border radius, shadows, typography, and color usage consistent across components.

---

# Whitespace & Composition

- Whitespace is a design tool, not empty space to fill -- generous, consistent spacing usually reads as more polished than tightly packed content.
- Build a spacing rhythm (e.g. a consistent scale like 4/8/12/16/24/32px or the project's token equivalents) and stick to it rather than eyeballing one-off values.
- Compose complex components from smaller, well-defined pieces rather than one large component with many conditional branches.

---

# Page & Dashboard Composition

- Give every page a clear primary action and entry point -- don't make the user hunt for what to do first.
- For dashboards and list-heavy views: lead with the most important summary information (key metrics, status), then supporting detail, then bulk/table data -- most-important-first, not alphabetical-first.
- Group related controls and data with consistent card/section boundaries rather than scattering related info across the page.
- Keep a consistent page shell (header, nav, content region) across pages -- don't let each page reinvent layout structure.
- For multi-step flows (wizards, multi-page forms), show progress and allow going back without losing entered data.

---

# Interaction & State

Every interactive element needs visible states for:

- Hover
- Focus (keyboard-visible, not just mouse hover)
- Active/pressed
- Disabled

And every data-driven view needs explicit handling for:

- **Loading** -- a skeleton or spinner, not a blank screen.
- **Empty** -- a real empty state (message + likely next action), not just nothing rendered.
- **Error** -- a clear message and, where possible, a way to retry.

---

# Forms

- Label every field; never rely on placeholder text as the only label.
- Validate inline, near the field, not only on submit.
- Disable submit while a request is in flight, and show that it's in flight.
- Preserve entered values on validation error -- never clear the form.

---

# Motion

- Use animation to clarify a state change (something appearing, reordering, or being removed), not as decoration on its own.
- Keep durations short (roughly 150-300ms for UI transitions); longer feels sluggish.
- Respect `prefers-reduced-motion` where the platform supports it.

---

# Accessibility

- Use semantic HTML (`<button>`, `<nav>`, `<article>`, `<section>`, `<aside>`) instead of `<div>` for interactive or structural elements -- this gives focus states and keyboard support for free.
- Give standalone icon buttons an accessible label (`aria-label` or `title`), not just a visual icon -- especially for icon-only actions like delete/edit.
- Support keyboard navigation and visible focus states everywhere.
- Check contrast in both light and dark mode, not just one.
- Never rely on color alone to convey meaning or hierarchy -- pair it with spacing, weight, or a label/icon.

---

# Visual Hierarchy

Build hierarchy through spacing, typography, size, and weight -- not color alone.
