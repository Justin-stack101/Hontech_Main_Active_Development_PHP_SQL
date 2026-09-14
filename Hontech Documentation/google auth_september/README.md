# 📁 Google Auth & 2-Step Verification Documentation (September 2026)

Welcome to the **Google Authentication & 2-Step Verification** technical repository for **HonTech AutoCenter Inc.**

---

### 📑 Documentation Index

1. [🛡️ Google Auth Security & Account Recovery (September 4, 2026)](./GOOGLE_AUTH_SECURITY_AND_ACCOUNT_RECOVERY_2026_09_04.md)
   - Comprehensive breakdown of Google services, OAuth 2.0 GIS token lifecycle, and Google SMTP relay
   - Executive vs. Staff role-based password governance and security whitelisting
   - Multi-channel account recovery and dynamic single-use 6-digit email OTPs
   - Chat-by-chat GitHub commit mapping and key architectural lessons

2. [📜 Google Authentication Evolution & Chronological Git History](./CHRONOLOGICAL_EVOLUTION_AND_LESSONS_LEARNED.md)
   - Chronological table of all Git commits from inception to production
   - Engineering insights on OAuth tokens, SSO security, and SMTP relays

3. [🏛️ Google Auth Progression & Architecture](./GOOGLE_AUTH_PROGRESSION_AND_ARCHITECTURE.md)
   - End-to-end system sequence diagrams
   - 5 Key problems diagnosed and resolved
   - Whitelist verification and Google Sub-ID mapping

4. [🛡️ 2-Step Verification (MFA) Specification](./MFA_SECURITY_SPECIFICATION.md)
   - The 4 verification pillars (TOTP, Dynamic OTP, Phone Prompt, Backup Codes)
   - Threat defense, remote kill-switch, and password policy

5. [📬 Gmail SMTP & Google App Password Setup Guide](./GMAIL_SMTP_SETUP_GUIDE.md)
   - How to configure Google App Passwords for live Gmail delivery
   - PHPMailer integration in `EmailUtils.php`

6. [🧪 Testing & QA Verification Log](./TESTING_AND_VERIFICATION_LOG.md)
   - 19/19 Automated Security Test suite results
   - 52/52 Role and permissions unit test results
   - Manual QA step-by-step verification checklist

7. [🚀 Production Migration & Workflow Strategy Guide](./PRODUCTION_MIGRATION_AND_WORKFLOW_STRATEGY.md)
   - Master blueprint for transferring Google Auth, MFA, and Gmail SMTP to the original repository
   - 5-Phase modular layering rollout checklist and file inventory
   - Git cherry-pick and multi-remote strategy guide


