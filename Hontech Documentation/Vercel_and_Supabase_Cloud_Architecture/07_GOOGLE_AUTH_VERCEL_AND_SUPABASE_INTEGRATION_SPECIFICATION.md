# 07: Google Auth, Vercel & Supabase Cloud Integration Specification

**Project:** HonTech AutoCenter — Web-Based Vehicle Intake & Queue Monitoring System  
**Document Series:** Cloud Architecture & Serverless Engineering (Part 7)  
**Source Baseline:** [`CapstoneOfficial2_Part3_Hontech_Cloud_GoogleAuth_Production`](https://github.com/Justin-stack101/CapstoneOfficial2_Part3_Hontech_Cloud_GoogleAuth_Production.git)  
**Target Platform:** Vercel (Edge CDN) + Supabase (PostgreSQL BaaS) + Google Cloud OAuth  

---

## 📌 1. Architectural Evolution: Part 3 (PHP/MySQL) ➔ Cloud (Vercel/Supabase)

In **Part 3** (`CapstoneOfficial2_Part3_Hontech_Cloud_GoogleAuth_Production`), Justin implemented an enterprise-grade Google SSO and Multi-Factor Authentication pipeline:
- Authentic Google login popup (`frontend/google_oauth_popup.html`)
- Rejection of unregistered Google accounts (403 Forbidden)
- 4-Option 2-Step Verification (Email 6-digit OTP, Google Authenticator TOTP, Device Push Prompt, Emergency Backup Code)
- Real Google SMTP relay via PHPMailer (`smtp.gmail.com:587`) with high-contrast email templates.

Below is how this proven architecture maps into **Vercel + Supabase Cloud**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PART 3 (LOCAL INTRANET ENGINE)                                                         │
│ Browser ➔ Google Popup ➔ PHP AuthController ➔ MySQL (3307) ➔ PHPMailer SMTP           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                           ▼ (Cloud Porting)                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ CLOUD PRODUCTION ENGINE (VERCEL + SUPABASE)                                            │
│ Vercel Edge Frontend ➔ Supabase Google OAuth Provider ➔ Supabase Postgres + RLS        │
│                                                       ➔ Supabase Auth / Resend SMTP    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 2. Google Cloud Console Configuration (OAuth 2.0 Credentials)

To connect Google Sign-In with your Vercel frontend and Supabase backend, configure **Google Cloud Console**:

### Step 1: Create OAuth 2.0 Client ID
1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create project: **HonTech AutoCenter Cloud**.
3. Configure **OAuth Consent Screen**:
   - **User Type:** External (or Internal if using Google Workspace).
   - **App Name:** `HonTech AutoCenter Management System`.
   - **Developer Contact:** Your student/developer email.
   - **Scopes:** `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
4. Go to **Credentials ➔ Create Credentials ➔ OAuth client ID**:
   - **Application Type:** Web application.
   - **Name:** `HonTech Cloud Auth Client`.

### Step 2: Set Authorized URIs (The Bridge Between Vercel & Supabase)
| Setting | What to Enter | Purpose |
| :--- | :--- | :--- |
| **Authorized JavaScript Origins** | `https://your-app.vercel.app`<br>`http://localhost:8000` | Allows your Vercel website and local testing to trigger Google Login. |
| **Authorized Redirect URIs** | `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback` | Allows Supabase to receive the Google OAuth code and authenticate the user. |

---

## ⚡ 3. Supabase Dashboard Configuration (1-Click Google Provider)

Instead of managing manual OAuth token exchanges, Supabase has native Google authentication:

1. In the Supabase Dashboard, navigate to **Authentication ➔ Providers**.
2. Click **Google** and toggle it to **Enabled**.
3. Paste the credentials from Google Cloud Console:
   - **Client ID:** `xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com`
   - **Client Secret:** `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx`
4. Copy the **Callback URL** provided by Supabase and ensure it matches the Redirect URI in Google Cloud Console.
5. Click **Save**.

---

## 💻 4. Client-Side Code: Triggering Google Login in Vercel Frontend

In your new cloud repo (`vercel_supabase`), initiating Google Login requires only a single method call:

```javascript
// Trigger official Google SSO
async function handleGoogleLogin() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin, // Returns user back to Vercel app
                queryParams: {
                    access_type: 'offline',
                    prompt: 'select_account'
                }
            }
        });

        if (error) throw error;
    } catch (err) {
        showToast('Google Sign-In Failed: ' + err.message, 'error');
    }
}
```

---

## 🛡️ 5. Preserving Part 3's "Unregistered Account Rejection" Security Rule

In Part 3, Justin instituted **Problem 1 Defense**: If a random person signs in with an unauthorized personal Gmail, they must **NOT** be given access to HonTech.

In Supabase, we enforce this with a PostgreSQL **Trigger + Function** on the `auth.users` table:

```sql
-- Security Policy: Reject any Google sign-in whose email does not exist in public.users!
CREATE OR REPLACE FUNCTION public.check_google_user_whitelisted()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email AND is_active = true) THEN
        RAISE EXCEPTION 'Access Denied: % is not an authorized HonTech personnel account.', NEW.email;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger runs before account creation
CREATE TRIGGER enforce_google_email_whitelist
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.check_google_user_whitelisted();
```

> [!IMPORTANT]
> **Zero Unvetted Access**: Even if a stranger clicks "Sign in with Google", Supabase rejects the session instantly if their email is not pre-registered in the HonTech personnel table.

---

## 📬 6. SMTP & Real Email Delivery: PHPMailer vs Supabase Custom SMTP

In Part 3, real email OTP delivery was achieved via `backend/utils/EmailUtils.php` and `PHPMailer` over `smtp.gmail.com:587`.

In Supabase, you configure this directly in the dashboard without writing PHP:
1. Go to **Supabase Dashboard ➔ Project Settings ➔ Authentication ➔ SMTP Settings**.
2. Toggle **Enable Custom SMTP**.
3. Enter your Gmail App Password credentials:
   - **Sender Email:** `your-email@gmail.com`
   - **Sender Name:** `HonTech AutoCenter Security`
   - **Host:** `smtp.gmail.com`
   - **Port:** `587`
   - **Username:** `your-email@gmail.com`
   - **Password:** `16-digit Google App Password`
4. Now, all password reset links, OTPs, and security notices are delivered directly to real inboxes automatically!

---

## 📋 7. Summary Comparison Matrix

| Security Feature | Part 3 Implementation (PHP / Local) | Cloud Implementation (Vercel + Supabase) |
| :--- | :--- | :--- |
| **OAuth Protocol** | Google Identity Services (`gapi` / popup) | Supabase Auth (`supabase.auth.signInWithOAuth`) |
| **User Whitelisting** | Checked in `AuthController.php` (`SELECT FROM users`) | Checked in PostgreSQL Trigger (`check_google_user_whitelisted`) |
| **Session State** | PHP Session + JWT Cookie | Supabase Client Session (`localStorage`) + JWT |
| **2-Step Verification** | Custom 4-Option Modal in `app.js` | Supabase MFA (`supabase.auth.mfa`) + Custom UI |
| **Email Dispatch** | PHPMailer via `smtp.gmail.com:587` | Supabase Custom SMTP Relay (`smtp.gmail.com:587`) |
| **Hosting** | Local Apache / XAMPP (`router.php`) | Vercel Global Edge CDN (`https://*.vercel.app`) |

---

## 📂 Referenced Documentation from Part 3
All detailed September logs, testing matrices, and lessons learned copied from Part 3 are available in:
- [`Hontech Documentation/google auth_september/GOOGLE_AUTH_PROGRESSION_AND_ARCHITECTURE.md`](../google%20auth_september/GOOGLE_AUTH_PROGRESSION_AND_ARCHITECTURE.md)
- [`Hontech Documentation/google auth_september/GOOGLE_AUTH_SECURITY_AND_ACCOUNT_RECOVERY_2026_09_04.md`](../google%20auth_september/GOOGLE_AUTH_SECURITY_AND_ACCOUNT_RECOVERY_2026_09_04.md)
- [`Hontech Documentation/google auth_september/GMAIL_SMTP_SETUP_GUIDE.md`](../google%20auth_september/GMAIL_SMTP_SETUP_GUIDE.md)
- [`Hontech Documentation/google auth_september/PRODUCTION_MIGRATION_AND_WORKFLOW_STRATEGY.md`](../google%20auth_september/PRODUCTION_MIGRATION_AND_WORKFLOW_STRATEGY.md)
