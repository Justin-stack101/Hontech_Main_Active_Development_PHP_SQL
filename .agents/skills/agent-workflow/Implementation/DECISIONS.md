# Decision Framework

## Purpose

Decide well when multiple valid approaches exist, and recognize when *not* to change code.

---

# When Choosing an Approach

Prefer, in this order:

1. Consistency with existing patterns in the codebase.
2. The minimal change that satisfies the requirement.
3. Readability over cleverness.
4. Extension over replacement -- add to what exists before rewriting it.

---

# When to Leave Code Alone

Don't touch code outside the request just because it could be improved. (See Implementation/REFACTORING.md if a refactor is actually warranted.)

Avoid, unless explicitly requested or required to complete the task:

- Introducing a new library or pattern alongside an existing equivalent.
- Changing architecture "while you're in there."
- Rewriting working code for style reasons alone.

---

# When Trade-offs Exist

State the trade-off briefly instead of silently picking a side -- e.g. "this is simpler but couples X to Y; the alternative avoids that but adds a new file." Decide unilaterally only on genuinely minor trade-offs; surface anything non-obvious to the user first.

---

# Dependency Management

- A new dependency needs a clear benefit that what's already installed can't provide.
- Before adding one, check whether the project already has an equivalent (don't add a second date library, class-merging utility, or animation library alongside an existing one).
- For anything touching security, auth, or data handling, prefer well-maintained, widely-used packages over obscure ones.
