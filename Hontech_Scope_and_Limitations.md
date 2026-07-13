# HonTech AutoCenter Operations System — Scope and Limitations

## 1. Project Scope

### 1.1. Staff and Workshop Interfaces (Assistant, Service Advisor, and Technician)
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
