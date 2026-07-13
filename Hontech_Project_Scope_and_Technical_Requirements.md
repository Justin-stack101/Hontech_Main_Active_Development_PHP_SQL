# HonTech AutoCenter Operations System — Project Scope & Technical Requirements Specification

This document consolidates the Project Scope, Boundaries, Limitations, and Specific Requirements (Functional & Non-Functional) for the HonTech AutoCenter Operations System.

---

## 1. Project Scope & System Boundaries

### 1.1. Staff and Workshop Interfaces (Assistant, Service Advisor, Technician)
Optimized for workshop operations, these interfaces allow front-line and technical staff to manage daily vehicle intakes and service statuses.
*   **1.1.1. Authentication Module**: Secure login requiring an email and password to ensure data accountability and proper Role-Based Access Control (RBAC) assignment.
*   **1.1.2. Appointment and Walk-In Logging Module**: A digital form that captures customer data, vehicle details, and online bookings via Facebook Messenger alongside walk-in clients, generating claim stubs and preventing redundant workloads.
*   **1.1.3. Real-Time Queue Monitoring Module**: A unified, digital view of vehicle service statuses across the shop floor, allowing staff to coordinate queue priorities and seamless transitions between service stages.
*   **1.1.4. Carry-Over Vehicle Tracking Module**: A dedicated tracking feature for units that require extended service stays due to major repairs or parts unavailability, mitigating the accumulation of unclaimed units.
*   **1.1.5. Job Order Management**: Allows Service Advisors and Technicians to update parts availability, input diagnostic evaluations, and toggle job statuses to "Released" or "Completed".
*   **1.1.6. Logout Module**: Securely terminates the session to prevent unauthorized access on shared workshop devices.

### 1.2. Admin/Management Dashboard (Owner/Administrator)
A centralized command center for business owners and supervisors to oversee daily operations, review performance metrics, and manage user roles.
*   **1.2.1. Authentication Module**: Secure admin-level login with credential validation to protect sensitive operational data.
*   **1.2.2. Operational Reporting and Monitoring (View-Only)**: An analytics dashboard that automatically consolidates service data to monitor daily intake totals, completed jobs, and active carry-overs. To ensure data integrity, the Owner and Admin roles have view-only access on active workshop logs and cannot modify job statuses.
*   **1.2.3. Service Category Analytics**: Automatically categorizes transactions, distinguishing between Preventive Maintenance Services (PMS), General Repairs (GR), and complimentary checkups.
*   **1.2.4. Staff Account Management Module (Branch-Scoped)**: Allows the Administrator to add personnel, configure system roles (Front Desk, Service Advisor, Technician), and reset passwords. Admin permissions are strictly partitioned to their assigned branch, while the Owner retains global oversight.
*   **1.2.5. Exportable Reports Module**: Enables the generation and downloading of daily and monthly vehicle intake summaries in PDF and Word formats. High-fidelity Chart.js graphs are compiled directly client-side and embedded into the exported files.
*   **1.2.6. Logout Module**: Ends the admin session securely to maintain system integrity.

### 1.3. Database & Infrastructure
*   **1.3.1. Centralized Database Synchronization**: A real-time database that bridges the front desk, workshop floor, and management, ensuring data consistency across all users.
*   **1.3.2. Role-Based Access Control (RBAC)**: A security layer ensuring that specific modules are restricted to their designated roles (e.g., Assistants cannot access Admin reports, Owners/Admins have view-only access to active workshop queue logs, and only SAs can make operational updates).
*   **1.3.3. Live TV Monitor Display Engine**: A passive public display infrastructure that queries active queue data to show waiting customers their vehicle's status without allowing interaction.
*   **1.3.4. Multi-Branch Data Partitioning**: The system natively supports multi-branch scaling, partitioning database schedules, rosters, and operational queues based on branch assignments.

---

## 2. Project Limitations

To ensure the project remains focused and achievable within the capstone timeframe, the researchers have established the following boundaries:

1.  **No Customer Interface or Portal**: The system is exclusively an internal management tool. Customers will not have accounts, login access, or a web portal to check their vehicle status independently.
2.  **No Automated Notification or SMS Module**: The system will not include automated SMS alerts or outbound notification features. All customer communication regarding vehicle completion or service reminders will remain handled manually by shop staff.
3.  **No Point-of-Sale (POS) or Payment Gateway**: The system will not compute billing, process financial transactions, or handle online payments. All financial settlements remain over-the-counter.
4.  **No Inventory Management**: The tracking of automotive parts availability, tool stocks, and supplies is outside the system's scope. Staff will still manually determine if parts are unavailable, which triggers a carry-over status in the system.
5.  **No Automated Vehicle Diagnostics (OBD Integration)**: The system functions purely as a queue and intake monitoring tool. It will not integrate with automotive diagnostic scanners to read vehicle fault codes automatically.
6.  **Internet Dependency**: As a web-based application, continuous and stable internet connectivity is required for real-time queue synchronization and saving records.
7.  **Cross-Branch Access Restrictions**: Staff members and branch managers (Admins) are strictly restricted from accessing, modifying, or transferring records of other branches. Cross-branch management and consolidated analytics viewing remain restricted solely to the global System Owner role.

---

## 3. Specific Functional Requirements

### 3.1.1. Manage Intakes & Vehicles
*   **REQ001**: The system shall allow the Assistant or Service Advisor to create a new vehicle intake record (job) by entering client details, vehicle model, plate number, service category, and primary client concerns.
*   **REQ002**: The system shall dynamically generate a unique date-relative Claim Stub number for each new vehicle intake (e.g., `MMDDYY-001`).
*   **REQ003**: The system shall allow the Service Advisor to modify active job details, service categories, parts status, and remarks.
*   **REQ004**: The system shall restrict the Owner and Admin to view-only access, permitting only the Assistant to delete pending bookings to preserve database integrity.

### 3.1.2. Workshop Queue & Lift Assignment
*   **REQ005**: The system shall display a real-time board of all active jobs partitioned by their operational status (e.g., Waiting Area, In Progress, Ready, Carry-Over).
*   **REQ006**: The system shall allow the Service Advisor to assign a vehicle to an active bay or lift (Lifts 1 to 4).
*   **REQ007**: The system shall prevent a user from assigning a vehicle to an occupied lift and show an alert indicating which vehicle is currently occupying it.
*   **REQ008**: The Technician shall be able to view tasks assigned to their specific bay and update the progress status to completion.

### 3.1.3. Produce Analytics & Export Reports
*   **REQ009**: The system shall display real-time dashboard analytics, including job volume trends (intakes vs. completions), service category breakdowns, booking channels, and branch-specific performance shares.
*   **REQ010**: The Owner and Admin shall be able to filter report periods (Daily, Weekly, Monthly, Yearly).
*   **REQ011**: The system shall support exporting reports to **PDF format**, capturing active Chart.js visual graphs directly from the browser's DOM canvas and embedding them on a dedicated analytics page.
*   **REQ012**: The system shall support exporting reports to **Word format (.doc)**, embedding the visual graphs as high-fidelity base64 images along with styled structured metrics tables.
*   **REQ013**: The system shall process document exports entirely client-side using browser Blobs to avoid server-level pathing and file system writing restrictions.

### 3.1.4. Authenticate User & Session Management
*   **REQ014**: All users (Owner, Admin, Service Advisor, Assistant, Technician) shall log in by providing their registered email address and secure password.
*   **REQ015**: The system shall verify credentials using PHP's cryptographically secure bcrypt hashing standard.
*   **REQ016**: The system shall require Multi-Factor Authentication (MFA) verification (One-Time Password) upon login if MFA is enabled on the user's profile.
*   **REQ017**: The system shall terminate the active session and redirect the user to the login screen if there is inactivity for a pre-configured timeout period.
*   **REQ018**: The system shall restrict the Admin role's staff management, database queries, and dashboard view privileges strictly to their assigned branch, while the Owner role maintains global cross-branch access.

### 3.1.5. Account Recovery
*   **REQ019**: A user shall be able to initiate a password recovery request by providing their registered email.
*   **REQ020**: The system shall generate a secure, 6-digit hex reset token with a 15-minute expiration period.
*   **REQ021**: The user shall be allowed to reset their password only upon submitting the valid, unexpired 6-digit verification code.

---

## 4. Non-Functional Requirements

### 4.1. Operational & Portability Requirements
*   **REQ022**: The system backend shall operate locally on Windows Operating System platforms running XAMPP (Apache web server and MariaDB/MySQL).
*   **REQ023**: The system shall not require external URL routing configurations or mod_rewrite dependencies, routing API endpoints directly through `backend/index.php`.
*   **REQ024**: The system shall load successfully in Microsoft Edge, Google Chrome, and standard WebKit-based modern browsers.

### 4.2. Performance Requirements
*   **REQ025**: The system shall fetch and render the daily schedule queue list in less than one (1) second.
*   **REQ026**: The system shall generate and trigger the download of PDF and Word reports client-side within two (2) seconds of clicking the export button.
*   **REQ027**: Database queries executing user authentication checks shall complete in less than 200 milliseconds.

### 4.3. Security Requirements
*   **REQ028**: User passwords stored in the database must be encrypted using `PASSWORD_BCRYPT` with a processing cost factor of 10.
*   **REQ029**: Access tokens (JWT) must expire within a set timeframe, and the system must reject requests containing expired tokens.
*   **REQ030**: The backend must enforce role-based access checks on every API request, returning a `403 Forbidden` if a user attempts an action outside their role's permissions.
*   **REQ031**: Local email verification codes (OTPs) and password recovery tokens must be routed to a secure local database sandbox for developer/administrator testing.

### 4.4. Cultural and Language Requirements
*   **REQ032**: The system user interface, generated reports, and documentation shall use the English language.
