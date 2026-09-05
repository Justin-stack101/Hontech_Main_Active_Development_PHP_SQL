# 📄 Document 05: Panelist Defense & Q&A Cheat Sheet

```
PROJECT:       HonTech AutoCenter Management System
MODULE:        Capstone Defense & Evaluation Preparation
AUDIENCE:      Capstone Presenters & Developers
```

---

## 1. Top 5 Panelist Defense Questions & Confident Answers

### Q1: *"Why did you use Google Auth instead of just saving passwords in your database?"*
> **Answer**: *"Building custom authentication for a cloud-hosted system exposes us to credential stuffing and brute-force attacks. Delegating identity to Google OAuth 2.0 adheres to OWASP industry best practices: we store zero password hashes for Google users, eliminate database credential leaks, and leverage Google's global bot-blocking defense."*

---

### Q2: *"What happens if an unauthorized person tries to log in with their personal Google account?"*
> **Answer**: *"Our system implements a strict Role Whitelist in the backend. Even though Google authenticates their identity, our PHP backend checks if their email exists in our pre-authorized `users` table. If it is not on the list, access is immediately blocked with an HTTP 403 Forbidden alert."*

---

### Q3: *"What happens if the internet goes down in the local shop?"*
> **Answer**: *"We designed a Hybrid Architecture. Service Advisors and Technicians on the shop floor can use local PIN/password credentials that run 100% offline on the local network (LAN), ensuring that daily vehicle intake and bay dispatching never experience downtime."*

---

### Q4: *"Why do you have 2-Step Verification if Google is already secure?"*
> **Answer**: *"2-Step Verification implements the Defense-in-Depth principle. For high-level roles managing financial analytics and staff permissions, requiring a dynamic 6-digit OTP ensures that even if an owner leaves their laptop unlocked at a counter, unauthorized users cannot execute administrative changes."*

---

### Q5: *"How much does Google OAuth cost HonTech to run every month?"*
> **Answer**: *"It is 100% free. Google Cloud provides up to 50,000 monthly active users on the free tier for OAuth 2.0 authentication, meaning zero monthly recurring software fees for the client."*

---

## 2. 4-Step Live Demonstration Script for Panel Presentation

1. **Step 1: The Login Portal**
   * *Show*: The login modal with standard staff credentials and the Google Sign-In button.
   * *Say*: *"Notice the hybrid design: fast local access for shop workers, and enterprise Google SSO for executives."*
2. **Step 2: Google Authentication Popup**
   * *Show*: Click the Google button and select the authorized Owner account.
   * *Say*: *"The handshake happens over secure HTTPS directly with Google's Identity servers."*
3. **Step 3: 2-Step Verification Challenge**
   * *Show*: The 6-digit OTP prompt received in email.
   * *Say*: *"The backend dispatches a cryptographically secure 6-digit OTP code to verify physical ownership."*
4. **Step 4: Role-Governed Dashboard Landing**
   * *Show*: The Owner dashboard unlocking with full executive analytics.
   * *Say*: *"The system immediately loads role-based permissions without exposing administrative panels to regular staff."*
