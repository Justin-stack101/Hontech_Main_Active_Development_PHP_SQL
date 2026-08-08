# Testing Guidelines

## Purpose

Ensure changes are actually verified before being marked done. Project-specific details -- which commands to run, whether an automated framework exists -- live in **project-profile/PROJECT_PROFILE.md**.

---

# 1. Automated Checks

Before finishing, run whatever automated checks the project has (type-checking, lint, unit tests). Check the project profile for the actual commands -- don't assume a framework exists, and don't assume one doesn't.

---

# 2. Manual Verification

Where no automated test covers the change, verify manually:

- Exercise the actual user flow, not just the code path you touched.
- Check both success and failure/edge cases.
- If the project supports multiple themes or viewports (e.g. light/dark mode, mobile/desktop), check the change in each.

---

# 3. Regression Check

Confirm existing functionality adjacent to your change still works -- don't just verify the new behavior in isolation.
