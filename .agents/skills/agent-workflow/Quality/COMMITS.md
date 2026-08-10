# Mandatory Git Save & Push Protocol

After completing any task, fix, refactor, or feature verification, the agent MUST automatically save progress to GitHub:

1. **Stage Changes**: Run `git add -u` (or `git add .` for new files).
2. **Descriptive Commit**: Craft a clear conventional commit message (`feat:`, `fix:`, `docs:`, `refactor:`, `style:`) describing *what* changed and *why*.
3. **Push Exclusively to Active Feature Branch**: 
   - Execute `git push origin <active-branch>` (e.g. `branch2-Security-Account-Recovery`).
   - **DO NOT push or auto-merge to `main`**. The `main` branch is reserved strictly as the stable, final production baseline.
4. **Verify Clean Tree**: Confirm `git status` reports `nothing to commit, working tree clean`. Never leave uncommitted or unpushed work at the end of a turn.

---

# Commit Message Best Practices

- Use clear conventional prefixes (`feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`).
- Describe the exact operational impact or bug fix, not just file names.
- Keep commits atomic and logical.

---

# Branching & Push Guidelines

- Maintain active feature branches for ongoing capstone development and client feature additions.
- Push exclusively to active development branch (`branch2-Security-Account-Recovery`).
- Keep `main` protected as the stable final milestone.
- Automatically verify remote push status after executing `git push`.
