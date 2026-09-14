# 🛡️ HonTech AutoCenter — 2-Step Verification (MFA) Technical Specification

## 1. Overview
Two-Factor Authentication (2FA) in HonTech AutoCenter protects high-privilege operations (`owner` and `admin` roles). This document outlines the 4 verification pillars, fallback algorithms, and security guarantees.

---

## 2. The Four Verification Pillars

### Pillar 1: Time-Based One-Time Password (TOTP)
- **Standard**: RFC 6238 Base32 Secret Encoding.
- **Cycle**: 30-second rolling window with $\pm 1$ step drift compensation.
- **Client Support**: Google Authenticator, Microsoft Authenticator, Authy.
- **Developer Test Code**: `123456` (available in non-production environments).

### Pillar 2: Live Dynamic Email OTP
- **Algorithm**: Cryptographically secure 6-digit numeric generation (`random_int(100000, 999999)`).
- **Storage**: Column `reset_otp` in table `users` with a 10-minute expiration (`reset_token_expires_at = NOW() + 600s`).
- **Single-Use Policy**: OTP is immediately cleared (`reset_otp = NULL`) upon successful validation to prevent replay attacks.
- **Delivery**: Dispatched via authenticated Gmail SMTP relay directly to user's registered inbox.

### Pillar 3: Device Push Prompt ("Tap Yes on Phone")
- **UX Flow**: Simulates Google Device Prompt verification.
- **Visual Match Code**: Generates a 2-digit confirmation token (e.g. `#74`).
- **Trigger**: Client invokes `/api/auth/verify-mfa` with payload `{ mfaCode: "TAP_YES_PROMPT" }`.
- **Speed**: Allows zero-friction 1-click verification for privileged executives.

### Pillar 4: Emergency Backup Recovery Codes
- **Format**: 8-character uppercase alphanumeric tokens (e.g. `HT-OWNER1`, `6E23807C`).
- **Storage**: JSON-encoded array of Bcrypt-hashed strings (`password_hash($code, PASSWORD_BCRYPT)`).
- **Consumption**: When a backup code is matched via `password_verify()`, it is permanently removed from the user's `backup_codes` JSON array in the database.
- **Replay Protection**: Consumed codes cannot be reused.

---

## 3. Threat Defense & Session Controls

1. **Remote Kill-Switch**:
   - Every active login registers an active session entry (`device_fingerprint`, `ip_address`, `last_active`).
   - The System Owner can revoke all active sessions across all devices with 1 click in Settings.
2. **First-Login Mandatory Password Policy**:
   - New personnel provisioned by Owner/Admin receive a temporary access PIN (`HT-XXXX`).
   - The `must_change_password = 1` flag prevents normal navigation until a private permanent password is set.
3. **Zero Frontline Self-Reset Protocol**:
   - Front desk staff, service advisors, and technicians cannot trigger self-service password resets. They must obtain an administrator-generated temporary PIN to recover credentials.
