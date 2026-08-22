# HonTech AutoCenter Operations System — Terms and Conditions (User Agreement)

**Effective Date:** August 2026  
**System Version:** HonTech v1.0.0-beta (Branch 2: Security & Account Recovery)  
**Entities Covered:** HonTech AutoCenter Inc. (Client/Shop Management), Authorized Workshop Personnel (Users), and STI College Marikina BSIT Capstone Research Group (Developers).

---

## 1. Acceptance of Terms & Scope of Agreement
By accessing, logging into, or utilizing the **HonTech AutoCenter Operations System** (hereinafter referred to as the "System"), all authorized personnel acknowledge and agree to comply with these Terms and Conditions. 

This System is an **internal operations and queue management platform** deployed exclusively on the local premises and authorized networks of HonTech AutoCenter. Access by unauthorized third parties is strictly prohibited.

---

## 2. Role-Based Access Control (RBAC) & User Responsibilities

### 2.1. Account Credentials & Security
* Every user is provisioned with a designated role (**Owner**, **Admin**, **Service Advisor**, **Front Desk Assistant**, or **Technician**).
* **Non-Transferability**: Staff members must not share their login credentials, passwords, or Multi-Factor Authentication (MFA) codes with other employees.
* **Inactivity Timeout**: Accounts will automatically lock or log out after 30 minutes of continuous inactivity to safeguard data integrity on shared shop floor devices.

### 2.2. Operational Integrity & Role Permissions
* **Service Advisors (SAs)** are solely responsible for verifying customer intake details, vehicle symptoms, and assigning repair lifts/bays accurately.
* **Technicians** must update bay task statuses promptly upon physical completion of service.
* **Admins and Owners** maintain supervisory and reporting access and are prohibited from modifying live, active workshop queue logs to preserve audit trail integrity.

---

## 3. Data Privacy & Customer Information Handling (RA 10173 Compliance)

In compliance with the **Philippine Data Privacy Act of 2012 (Republic Act No. 10173)**:

1. **Collected Data**: The System records customer names, contact numbers, vehicle models, plate numbers, and service histories.
2. **Permitted Purpose**: Customer and vehicle data encoded into the System shall be used **strictly and solely for automotive service intake, claim stub verification, queue status tracking, and workshop operational reporting**.
3. **Confidentiality**: Personnel are strictly prohibited from exporting, photographing, copying, or disclosing customer personal information to unauthorized external third parties.

---

## 4. Operational Boundaries & Software Limitations

To prevent operational misunderstandings, all users and shop managers recognize the following system boundaries:

1. **No Automated Payment / POS**: The System is **not a Point-of-Sale (POS)** or payment gateway. All financial settlements, invoices, and payment collections remain conducted over-the-counter outside this System.
2. **Promised Completion Dates**: Departure times and claim stub completion timestamps are operational estimates subject to parts availability, unexpected mechanical findings, and customer approvals (WCA).
3. **No Direct OBD Integration**: Diagnostic evaluations must be inspected and entered manually by qualified workshop technicians.
4. **No Direct Customer Portal**: The System does not provide an external public portal for customers to modify their bookings; status viewing is limited to on-site waiting room TV monitors.

---

## 5. Local Intranet & Infrastructure Terms
* The System operates on an **On-Premises Local Server (LAN / Wi-Fi Intranet)** located within the physical auto shop.
* The auto shop management is responsible for maintaining the physical hardware (host computer, local Wi-Fi router, and power backups) to prevent accidental data corruption during power interruptions.

---

## 6. Intellectual Property & Academic Capstone Disclosure
* The HonTech AutoCenter Operations System was engineered by BSIT Students of **STI College Marikina** as an official Capstone Project in collaboration with **HonTech AutoCenter Inc.**
* System source code, architectural designs, algorithms, and technical documentation are proprietary assets created for the sole operational use of HonTech AutoCenter.

---

## 7. Account Revocation & Disciplinary Action
HonTech AutoCenter Management reserves the right to immediately suspend, deactivate, or reassign any user account found in violation of these terms, including unauthorized data tampering, credential sharing, or negligence during vehicle queue encoding.

---

### ✍️ Acknowledgment & Consent Form Template

```
I have read, understood, and agree to abide by the Terms and Conditions of the 
HonTech AutoCenter Operations System.

Employee Full Name : ____________________________________________
Assigned Role      : [ ] Owner  [ ] Admin  [ ] SA  [ ] Tech  [ ] Staff
Branch Assignment  : ____________________________________________
Signature          : ____________________________________________
Date Signed        : ____________________________________________
```
