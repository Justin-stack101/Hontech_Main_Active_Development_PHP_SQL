# 📄 Document 03: Google Cloud Console Setup & Environment Configuration

```
PROJECT:       HonTech AutoCenter Management System
MODULE:        Cloud Console, API Credentials & Environment Variables
AUDIENCE:      DevOps Engineers, System Administrators, IT Group
```

---

## 1. Google Cloud Console Setup (Step-by-Step)

### Step 1: Create a Project
1. Navigate to [Google Cloud Console](https://console.cloud.google.com).
2. Click the Project Dropdown → **New Project**.
3. Name: `HonTech-AutoCenter-Production`.

### Step 2: Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**.
2. Select User Type: **External** → Click **Create**.
3. Fill in:
   * **App name**: `HonTech AutoCenter Management System`
   * **User support email**: Your Gmail / Owner email
   * **Developer contact email**: Your developer email
4. **Scopes**: Add `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
5. Under **Test Users**, add your active development emails (e.g., `justine03k@gmail.com`).

### Step 3: Create OAuth 2.0 Client Credentials
1. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth Client ID**.
2. Application type: **Web application**.
3. Name: `HonTech Web Client`.
4. **Authorized JavaScript origins**:
   * `http://localhost:8000`
   * `http://localhost`
   * `http://127.0.0.1:8000`
   * *(Your cloud domain / IP)*
5. **Authorized redirect URIs**:
   * `http://localhost:8000/api/auth/google/callback`
6. Click **Create** and copy your **Client ID** and **Client Secret**.

---

## 2. Environment Configuration (`.env`)

Copy `.env.example` to `.env` in the project root:

```ini
# ============================================================
# HonTech AutoCenter — Production Configuration
# ============================================================
APP_ENV=production
PORT=8000

# Database Configuration (MySQL / MariaDB)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=hontech
DB_USER=root
DB_PASS=

# JWT Secret Token (Minimum 32 random characters)
JWT_SECRET=hontech_super_secure_jwt_token_key_2026_x89f_32chars!

# Google Cloud OAuth API
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

# SMTP Mail Relay (For OTP Codes & Password Recovery)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_16_digit_google_app_password
SMTP_FROM_EMAIL=no-reply@hontech-autocenter.com
```

---

## 3. Database Schema Verification

Ensure the `users` table has the following schema:

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) NULL AFTER email,
ADD COLUMN IF NOT EXISTS auth_provider ENUM('local', 'google') DEFAULT 'local' AFTER google_id,
ADD COLUMN IF NOT EXISTS mfa_enabled TINYINT(1) DEFAULT 0 AFTER role,
ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(255) NULL AFTER mfa_enabled,
ADD COLUMN IF NOT EXISTS backup_codes TEXT NULL AFTER mfa_secret;
```
