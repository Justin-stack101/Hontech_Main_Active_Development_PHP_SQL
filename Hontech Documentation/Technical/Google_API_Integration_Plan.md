# Google API Integration Plan - HonTech AutoCenter Operations System

This document outlines the planned integrations for Google APIs and self-service account recovery.

---

## 1. Authentication & Security (Google Identity Services)
- **Current Process**: Users log in via password + TOTP (Google Authenticator) or use a simulated Google Sign-in sandbox.
- **Planned Integration**:
  - Integrate **Google Identity Services (GIS)** client-side SDK.
  - Enable secure sign-in with real Google accounts.
  - Add option to Link/Unlink Google accounts in the User Profile settings.
  - Fall back to the local developer sandbox if no `GOOGLE_CLIENT_ID` is configured.

## 2. Security Alerts & Password Recovery (Gmail API)
- **Current Process**: Transactional security emails (OTPs, password recovery tokens) are generated locally and routed to a simulated developer mailbox file.
- **Planned Integration**:
  - Integrate **Gmail API (OAuth2)** or Google Secure SMTP relay.
  - Route all security login notifications, MFA OTP codes, and password recovery codes securely through the company's official Workspace / Gmail account.

## 3. Customer Bookings & Appointment Scheduling (Google Calendar API)
- **Current Process**: Service advisors and front desk assistants manage appointments locally inside the operational dashboard.
- **Planned Integration Flow**:
  1. **Intake / Scheduling**: An assistant schedules or confirms an appointment request (e.g., Toyota Vios PMS on Friday at 09:00 AM) and inputs the customer's email.
  2. **API Event Creation**: The HonTech server makes an API request to **Google Calendar** using a Service Account or OAuth credential.
  3. **Master Shop Calendar Sync**: The event is immediately registered on the shop's master Google Calendar (`master.calendar@hontech.com`).
  4. **Customer Invitation**: The customer is added as an attendee on the event. Google Calendar automatically handles sending a visual invite to the customer, allowing them to add the appointment to their phone's calendar with a single tap.

---

## 🛠️ Phased Implementation Roadmap

### Phase 1: Account Recovery & Sandbox Verification (Immediate)
- **Backend (`AuthController.php`)**:
  - Implement `/api/auth/forgot-password` to generate a 6-digit OTP code, save it to the DB with a 15-minute expiration, and route it to the simulated mailbox.
  - Implement `/api/auth/reset-password` to verify the OTP and hash/update the password in the database.
- **Testing**: Confirm that the user can reset passwords using the simulator.

### Phase 2: Google Identity & Gmail Integration
- **Backend (`index.php` & `AuthController.php`)**:
  - Add `/api/auth/google/config` to check if `GOOGLE_CLIENT_ID` is set.
- **Frontend (`app.js`)**:
  - If a Client ID is configured, load the real Google Identity Services button client-side; otherwise, use the Sandbox Modal.
