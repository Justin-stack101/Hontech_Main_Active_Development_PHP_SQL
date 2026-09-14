# 📬 HonTech AutoCenter — Gmail SMTP & Google App Password Configuration Guide

## 1. Why SMTP Relay is Required
Sending unauthenticated emails from a local machine (`localhost` on XAMPP) will fail when sending to public domains (`gmail.com`, `yahoo.com`, `outlook.com`) because public mail servers reject unverified residential IP addresses.

To deliver 2FA security codes and password reset emails to real user inboxes, HonTech uses **Google's Authenticated SMTP Relay**.

---

## 2. Generating a Google App Password (Step-by-Step)

1. **Log into Google Account Security**:
   - Navigate to [https://myaccount.google.com/security](https://myaccount.google.com/security).
2. **Ensure 2-Step Verification is Active**:
   - Under *"How you sign in to Google"*, confirm **2-Step Verification** is turned **ON**.
3. **Open App Passwords**:
   - Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
4. **Create a Dedicated Token**:
   - App Name: `HonTech AutoCenter`
   - Click **Create**.
5. **Copy the 16-Character Token**:
   - Google will display a 16-character string (e.g. `ktnw iapb jozk fuqy`).

---

## 3. Configuring HonTech Backend (`.env`)

In the project root directory, update your `.env` configuration file:

```ini
# ============================================================
# Google SMTP Relay Configuration
# ============================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=jakenolasco.jn5@gmail.com
SMTP_PASS=ktnwiapbjozkfuqy
SMTP_FROM_EMAIL=jakenolasco.jn5@gmail.com
```

> [!NOTE]
> Spaces in the 16-character token are automatically sanitized by `EmailUtils.php`.

---

## 4. How PHPMailer Dispatches Outgoing Emails

In `backend/utils/EmailUtils.php`:
```php
$mail = new \PHPMailer\PHPMailer\PHPMailer(true);
$mail->isSMTP();
$mail->Host       = 'smtp.gmail.com';
$mail->SMTPAuth   = true;
$mail->Username   = 'jakenolasco.jn5@gmail.com';
$mail->Password   = 'ktnwiapbjozkfuqy';
$mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
$mail->Port       = 587;

$mail->setFrom('jakenolasco.jn5@gmail.com', 'HonTech AutoCenter Security');
$mail->addAddress($to);
$mail->isHTML(true);
$mail->Subject = $subject;
$mail->Body    = $html;
$mail->send();
```

---

## 5. Built-in Local Dev Mailbox Fallback
If SMTP is offline or credentials are not yet configured, the system automatically falls back to storing all dispatched emails in the local JSON queue (`sys_get_temp_dir() . '/hontech_simulated_emails.json'`), viewable on screen by clicking **Dev Mailbox** in the bottom developer bar on `index.html`.
