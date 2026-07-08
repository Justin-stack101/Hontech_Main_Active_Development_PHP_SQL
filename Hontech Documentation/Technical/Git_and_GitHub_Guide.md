# Git and GitHub Developer Guide

This document serves as a reference for Git operations, configuration steps, daily developer workflows, and why version control is essential for full-stack developers.

---

## 1. What We Did (Initial Setup)

To link your local folder to GitHub and upload the initial code base, we executed these commands in the terminal:

1. **`git init`**
   * *What it did:* Initialized a new, empty local Git repository. It created the hidden `.git` folder in your project root to track changes.
2. **`git remote add origin https://github.com/Justin-stack101/CapstoneOfficial2_Development.git`**
   * *What it did:* Pointed your local repository to your remote GitHub repository.
3. **`git branch -M main`**
   * *What it did:* Renamed your primary local branch to `main` (matching GitHub's default branch name).
4. **`git add .`**
   * *What it did:* Selected all modified and new files (excluding those listed in your `.gitignore` like `node_modules/`) for staging.
5. **`git commit -m "Initial commit of local files"`**
   * *What it did:* Saved the staged files locally as a historical checkpoint.
6. **`git pull origin main --allow-unrelated-histories --no-edit`**
   * *What it did:* Pulled existing online repository files (like `.env`) and merged them cleanly with your local project without prompt interruptions.
7. **`git push -u origin main`**
   * *What it did:* Pushed your merged local history to GitHub and set up upstream tracking so future pushes are simplified.

---

## 2. Daily Workflow: How to Save & Push Changes

When you are developing, follow this simple process to back up and sync your work:

### Option A: The One-Line Command (Fastest)
Whenever you finish working, run this combined command in your project terminal:
```bash
git add . && git commit -m "Describe your changes here" && git push
```

### Option B: Step-by-Step Commands
If you prefer running commands one by one to verify your progress:

1. **Check what has changed:**
   ```bash
   git status
   ```
2. **Stage your changes:**
   ```bash
   git add .
   ```
3. **Commit your changes locally:**
   ```bash
   git commit -m "Brief description of what you did"
   ```
4. **Push your changes to GitHub:**
   ```bash
   git push
   ```

---

## 3. Why GitHub is Critical for Full-Stack Developers

* **Version Control (Time Machine):** If a new database query or component layout breaks your application, you can compare changes or roll back your codebase to any prior commit instantly.
* **Safe Collaboration:** Multiple developers can work on frontend styling, backend API logic, or database scripts concurrently. Git automatically merges changes and flags conflicts if two people edit the exact same line.
* **Continuous Integration & Deployment (CI/CD):** Production and hosting platforms (e.g., Render, Vercel, AWS) sync directly with GitHub. Pushing changes to your main branch can trigger automated builds and deploy updates to users in seconds.
* **Your Professional Portfolio:** A developer's GitHub is their living resume. Recruiters and clients check commit history, code structure, readability, and documentation (like this guide) to assess technical capabilities.
