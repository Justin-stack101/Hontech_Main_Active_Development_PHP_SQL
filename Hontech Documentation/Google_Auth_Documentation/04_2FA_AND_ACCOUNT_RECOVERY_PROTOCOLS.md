# 📄 Document 04: 2-Factor Authentication & Account Recovery Protocols

```
PROJECT:       HonTech AutoCenter Management System
MODULE:        2-Step Verification, Dynamic OTP Dispatch & Account Recovery
AUDIENCE:      Security Engineers, Quality Assurance, Developers
```

---

## 1. 2-Step Verification (2FA) Protocol

For administrative accounts (**Owner** and **Admin**), password authentication is only the first step. HonTech enforces a secondary challenge to prevent account takeover.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as System Owner / Admin
    participant System as HonTech Auth Subsystem
    participant Mailer as PHPMailer (Google SMTP Relay)
    participant Gmail as Admin Inbox (Gmail)

    Admin->>System: Completes Step 1 (Google SSO / Password)
    System->>System: Detects mfa_enabled = 1
    System->>System: Generates Cryptographic 6-Digit OTP (10 min expiry)
    System->>Mailer: Dispatches OTP via secure TLS 587
    Mailer->>Gmail: Delivers OTP Email to Admin
    System-->>Admin: Displays 2-Step Verification Modal
    Admin->>System: Enters 6-Digit Code
    alt Code Matches & Not Expired
        System-->>Admin: Grants Full Access to Executive Dashboard
    else Invalid Code / Expired
        System-->>Admin: Displays Error & Logs Attempt
    end
```

---

## 2. Dynamic 6-Digit OTP Dispatch Mechanism

* **Generation**: Generated using `random_int(100000, 999999)` to guarantee cryptographic entropy.
* **Storage**: Stored in cache / database session with a strict **10-minute time-to-live (TTL)**.
* **Rate Limiting**: Maximum 3 resend attempts every 5 minutes to prevent spamming.
* **Transport**: Dispatched over TLS encrypted SMTP using PHPMailer connected to `smtp.gmail.com:587`.

---

## 3. Emergency Account Recovery Protocols

If an Owner loses their phone or email access:

1. **8-Digit Emergency Backup Codes**:
   * During initial security setup, 5 single-use emergency codes are generated and hashed in the database.
   * Entering a valid emergency code grants immediate one-time recovery access and invalidates that specific code.
2. **Device Kill-Switch**:
   * The Owner can click *"Revoke All Other Sessions"* from the Security Settings panel.
   * This updates the user's `token_version` or session timestamp, instantly invalidating all tokens on compromised devices.
