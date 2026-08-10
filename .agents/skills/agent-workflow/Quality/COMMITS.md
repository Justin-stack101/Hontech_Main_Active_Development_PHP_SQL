# Mandatory Git Save & Push Protocol

After completing any task, fix, refactor, or feature verification, the agent MUST automatically save progress to GitHub and ensure GitHub Contribution Heatmap credit:

1. **Stage Changes**: Run `git add -u` (or `git add .` for new files).
2. **Descriptive Commit**: Craft a clear conventional commit message (`feat:`, `fix:`, `docs:`, `refactor:`, `style:`) describing *what* changed and *why*.
3. **Push to Active Branch & Sync Main**: 
   - Execute `git push origin <active-branch>` to back up active development branch.
   - Execute `git checkout main ; git merge <active-branch> --no-edit ; git push origin main ; git checkout <active-branch>` so **EVERY SINGLE COMMIT** immediately lights up on the developer's public **GitHub Contribution Graph** (green squares)!
4. **Verify Clean Tree**: Confirm `git status` reports `nothing to commit, working tree clean`. Never leave uncommitted or unpushed work at the end of a turn.

---

# Commit Message Best Practices

- Use clear conventional prefixes (`feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`).
- Describe the exact operational impact or bug fix, not just file names.
- Keep commits atomic and logical.

---

# Branching & Push Guidelines

- Maintain active feature branches synced with the `main` branch.
- Push directly to active development branch and sync `main` automatically so all developer contributions are publicly credited on the GitHub profile heatmap.
- Automatically verify remote push status after executing `git push`.
