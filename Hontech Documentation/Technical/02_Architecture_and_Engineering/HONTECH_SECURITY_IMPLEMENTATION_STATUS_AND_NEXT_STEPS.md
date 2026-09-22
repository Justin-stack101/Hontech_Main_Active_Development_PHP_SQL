# HonTech Security & Account Recovery — Implementation Status & Next Steps
**Document Purpose**: Ground-truth tracker of what is actually implemented in code today, versus what the other security docs describe as the target design.
**Last Verified**: 2026-09-22, against `backend/` and `frontend/` in this repo (`prototype_process` branch).
**How to use this doc**: Check the status column before trusting a claim in `HONTECH_SECURITY_AND_ACCOUNT_RECOVERY_MASTER.md`, the `google auth_september/` set, or the `Vercel_and_Supabase_Cloud_Architecture/` set — those describe intent, not all of them match the code yet. Update this file's status column whenever a security item ships or changes.

> [!NOTE]
> Earlier docs (`HONTECH_SECURITY_AND_ACCOUNT_RECOVERY_MASTER.md`, the September Google Auth set) describe a fuller security design than what has been built in this prototype repo. This document is the correction layer: it tells you which of those claims are real right now.

---

## 1. Status Legend

| Symbol | Meaning |
| :---: | :--- |
| ✅ | Implemented and verified in this repo |
| 🟡 | Partially implemented, or implemented but not verified end-to-end |
| ❌ | Not implemented — described in other docs as a target, not yet built |
| 🔒 | Fixed this session (2026-09-22) — previously a critical hole |

---

## 2. Account Recovery (Forgot / Reset Password)

| Item | Status | Notes |
| :--- | :---: | :--- |
| `POST /api/auth/forgot-password` sends a 6-digit code by email only | 🔒 | Previously returned the code/token directly in the API response — anyone who knew a staff email could take over that account. Fixed in `backend/controllers/PasswordResetController.php`. |
| Reset requires email + code together | 🔒 | Previously a bare OTP could reset any account (`findByResetOtp`). Removed. Reset now looks the user up by email first. |
| Code stored as a hash, not plaintext | 🔒 | `SecurityUtils::hashOneTimeCode()` — HMAC-SHA256 keyed with `JWT_SECRET`, bound to the account email. Only the hash is in the `users.reset_otp` column. |
| Code expiry | ✅ | 15 minutes (`CODE_TTL_SECONDS = 900`). |
| Code is single-use | ✅ | Cleared after a successful reset (`updatePasswordAndClearResetCode`). |
| Guess limiting | ✅ | 5 wrong attempts burns the code; a new one must be requested. |
| Resend cooldown | ✅ | 60 seconds between codes for the same account. |
| Constant-time code comparison | ✅ | `hash_equals()` in `PasswordResetController::resetPassword()`. |
| Response doesn't reveal whether an email is registered | ✅ | Same generic message either way. |
| Cryptographically secure code generation | ✅ | `random_int()` via `SecurityUtils::generateNumericCode()`, not `mt_rand()`. |
| Password strength policy on reset | ✅ | Min 10 chars, needs a letter + a number, rejects email-derived and common passwords (`SecurityUtils::validatePasswordStrength()`). |
| Same password policy on **all** password paths (change password, admin reset, staff creation) | ❌ | Only `resetPassword()` enforces it today. `updatePassword()`, `resetStaffPassword()`, `createStaff()` still accept any non-empty string. |
| "Password changed" notification email | ✅ | `EmailUtils::sendPasswordChangedNotice()`. |
| Real email delivery (SMTP) | ❌ | Codes only land in the dev sandbox inbox (`/api/auth/developer/emails`) — see §5. No code sends real email yet. |
| Self-service reset restricted by role | ❌ | September docs describe SA/Assistant being blocked from self-service reset (admin-assisted only). Not implemented — every role can self-reset today. **Needs your decision**, see §7. |
| Database columns for the above exist | ✅ | Added to `database.sql` and `backend/migration.php`: `reset_otp` (64-char hash), `reset_token_expires_at`, `reset_attempts`. Run the migration on any environment that predates 2026-09-22. |

---

## 3. Google Sign-In

| Item | Status | Notes |
| :--- | :---: | :--- |
| Google button renders / dev sandbox modal fallback | ✅ | `frontend/google_oauth_popup.html` |
| Server verifies the Google ID token (signature, audience, issuer, expiry) | ❌ | `AuthController::googleLogin()` currently trusts a client-submitted `googleEmail` field with no cryptographic check. Anyone can POST any email, including `owner@hontech.com`, and be logged in as that account (blocked only if that account has MFA enabled). |
| Whitelist: reject Google accounts with no matching staff record | 🟡 | Code does reject if no user row matches, but since the email itself isn't verified, this check protects nothing yet. |
| Match on Google's stable `sub` ID rather than email | ❌ | Not implemented. |
| `postMessage` origin restricted (popup → opener) | ❌ | Currently `postMessage(payload, '*')` in `google_oauth_popup.html`. |

**Bottom line:** Google Sign-In is not production-safe. Treat it as a UI prototype only until the ID token is verified server-side.

---

## 4. MFA (TOTP)

| Item | Status | Notes |
| :--- | :---: | :--- |
| TOTP enrollment (QR + secret) | ✅ | `AuthController::setupMfa()` |
| TOTP verification | ✅ | `SecurityUtils::verifyTOTP()`, ±30s clock skew |
| 8 single-use backup codes | ✅ | `AuthController::enableMfa()` |
| MFA verify requires the password step first | ❌ | `POST /api/auth/verify-mfa` accepts a bare `userId` — no password or signed intermediate token. Someone who knows a `userId` can attempt MFA codes without ever authenticating with a password. |
| MFA attempt throttling | ❌ | No limit on guesses against `/api/auth/verify-mfa`. |
| QR code rendered via a third-party service | 🟡 | `api.qrserver.com` receives the TOTP secret in the URL to render the QR image. Works, but leaks the secret to a third party in transit. Should be rendered client-side instead. |
| 4-option MFA (email OTP / TOTP / push / backup code) described in Sept docs | ❌ | Only TOTP + backup codes exist in this repo. |

---

## 5. Session & Transport Security

| Item | Status | Notes |
| :--- | :---: | :--- |
| JWT in HttpOnly, SameSite=Strict cookie | ✅ | `backend/middleware/Auth.php` |
| `Secure` cookie flag in production | ✅ | Conditioned on `APP_ENV=production` |
| `JWT_SECRET` has no insecure fallback | ❌ | `Auth.php` still falls back to `'supersecretjwtkey12345!'` if `.env` is missing the key. `.env` itself is set correctly; the risk is only if `.env` is ever missing in a deployment. |
| Session revocation on logout / password change | ❌ | JWTs remain valid until natural expiry (24h) even after logout or a password reset elsewhere. No `token_version` / denylist. |
| Login rate limiting / lockout | ❌ | No throttling on `/api/auth/login`. |
| CORS | ❌ | `Access-Control-Allow-Origin: *` combined with `Access-Control-Allow-Credentials: true` (`backend/index.php`). Should be an explicit allowlist. |
| Developer sandbox routes blocked outside development | 🔒 | `/api/auth/developer/*` (emailed codes viewer, DB reset/seed, audit log clear) now 404s unless `APP_ENV=development`. Previously reachable in any environment. |
| Password hashing | ✅ | bcrypt, cost 10–12, via `password_hash()` everywhere. |
| SQL injection protection | ✅ | 100% PDO prepared statements (verified by `tests/security/security.test.js` static audit). |
| Exception details hidden from API responses outside dev | ❌ | Several controllers still `echo $e->getMessage()` regardless of environment. |

---

## 6. Secrets Hygiene

| Item | Status | Notes |
| :--- | :---: | :--- |
| Gmail app password removed from tracked docs | 🔒 | Was committed in plaintext in 4 files under `Hontech Documentation/google auth_september/` (commit `a1641b8`). Replaced with `YOUR_16_CHAR_GOOGLE_APP_PASSWORD` placeholder in this session. |
| Leaked password revoked at the Google account | ❌ | **Action required from you** — see §7. Removing it from the docs does not invalidate it; it's still in git history and pushed to `origin/prototype_process`. |
| `.env` excluded from git | ✅ | Confirmed in `.gitignore`. |
| Regression test guarding against future secret leaks | ✅ | `tests/security/recovery_and_secrets.test.js` — fails the build if an SMTP app password or a real Google client secret is committed anywhere in the repo. |

---

## 7. Decisions Needed From You

Nothing below is blocked on code — these are policy calls I can't make for you.

1. **Self-service reset scope**: should Service Advisors and Assistant Staff be blocked from self-service password reset (admin-assisted only, per the September docs), or should everyone keep self-service like today?
2. **Revoke the leaked Gmail app password**: go to `myaccount.google.com/apppasswords`, revoke `ktnwiapbjozkfuqy`-style entry tied to the SMTP account, and generate a new one. Needed before real SMTP email (§2, §5) can be wired up safely.
3. **Google Sign-In posture for this prototype**: is verifying the real Google ID token in scope for this prototype repo, or does that wait for the Vercel/Supabase cloud repo (where Supabase Auth would replace this code entirely per `Vercel_and_Supabase_Cloud_Architecture/07_...md`)?

---

## 8. Suggested Order of Remaining Work

Carried over from the security plan discussed 2026-09-22, adjusted for what's now done:

| # | Item | Depends on |
| :-- | :--- | :--- |
| 1 | ~~Fix password reset takeover~~ | Done, this session |
| 2 | ~~Remove leaked secret from docs~~ | Done, this session (revocation still pending — §7.2) |
| 3 | Verify Google ID token server-side; drop client-trusted email | §7.3 decision |
| 4 | Require password step before MFA verify (signed intermediate token) | — |
| 5 | Login / MFA / reset throttling + lockout | — |
| 6 | Remove `JWT_SECRET` fallback; add session revocation (`token_version`) | — |
| 7 | CORS allowlist; hide exception details outside dev | — |
| 8 | Apply password policy to all password-set paths, not just reset | — |
| 9 | Real SMTP email delivery | §7.2 (new app password) |
| 10 | Role-scoped self-service recovery (if §7.1 says restrict it) | §7.1 decision |
| 11 | Supabase Auth foundation in the separate cloud repo | Phase 3 of the original cloud migration docs |

---

## 9. Files Touched This Session (2026-09-22)

- `backend/controllers/PasswordResetController.php` — rewritten
- `backend/repositories/UserRepository.php` — reset methods replaced
- `backend/utils/SecurityUtils.php` — added `generateNumericCode`, `hashOneTimeCode`, `validatePasswordStrength`
- `backend/utils/EmailUtils.php` — added `sendPasswordResetEmail`, `sendPasswordChangedNotice`
- `backend/index.php` — developer routes gated to dev environment
- `backend/migration.php`, `database.sql` — new reset columns
- `frontend/js/app.js`, `frontend/index.html` — removed dev auto-fill of reset code, updated password field hint
- `tests/security/recovery_and_secrets.test.js` — new regression suite (6 tests, all passing as of last run)
- 4 files under `Hontech Documentation/google auth_september/` — leaked password replaced with placeholder

**Not yet run**: `backend/migration.php` against the live database (MySQL was down after a laptop crash this session). Run it before relying on password reset in this environment.
