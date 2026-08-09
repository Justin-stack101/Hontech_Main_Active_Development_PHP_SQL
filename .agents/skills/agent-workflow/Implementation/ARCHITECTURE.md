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

---

# 4. SOLID Architecture Principles

Always design and modify code adhering strictly to SOLID principles:
- **Single Responsibility (SRP)**: Keep classes, controllers, and components small and focused. For example, database queries belong in Repositories, email dispatching belongs in Mail Utilities, and request routing/validation belongs in middleware/controllers.
- **Open/Closed (OCP)**: Code should be open for extension but closed for modification. Write classes and systems that can adapt via parameters, configurations, or polymorphism rather than hardcoding business logic that requires constant modification.
- **Liskov Substitution (LSP)**: Derived classes or controllers must be completely interchangeable with their parent classes or abstractions without breaking the application.
- **Interface Segregation (ISP)**: Avoid bloated interfaces. Create small, focused interfaces so classes are not forced to implement methods they do not need.
- **Dependency Inversion (DIP)**: Depend on abstractions rather than concrete classes. Inject dependencies (like database connections or service utilities) instead of instantiating them directly inside classes.

---

# 5. Core Design Patterns

Enforce these structural design patterns across the codebase:
- **Repository Pattern**: Never query databases directly from Controllers. Use Repository classes (e.g. `UserRepository`, `JobRepository`, `BranchRepository`) to run database queries, keeping data access separated from business logic.
- **Model-View-Controller (MVC) Separation**: Keep business logic out of HTML templates. PHP API endpoints must return structured JSON format responses, and client-side scripts (`app.js`) must query these endpoints and render dynamic components on the frontend.
- **Dependency Injection**: Pass database connections, environment variables, or config abstractions to class constructors rather than hardcoding global instantiations inside classes.
- **Singleton Pattern**: Core services (like Database connection pools) should utilize Singletons to avoid duplicate connection attempts.
