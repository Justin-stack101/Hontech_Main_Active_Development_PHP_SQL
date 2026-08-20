# System Deployment and Security Architecture

This document outlines the deployment strategy and security safeguards for the Hontech AutoCenter Queue and Operations Management System, focusing on safeguarding customer data, finance data, and parts inventory.

## 1. On-Premises Local Area Network (LAN) Deployment (Current Stage)

For the initial launch and Capstone presentation, the system is deployed purely as an **On-Premises Intranet System**.

```
[ Advisor PC ] <----\ (Private Local Wi-Fi / Ethernet)
                     \
[ Assistant PC ] <----> [ On-Site Host Server PC ]
                     /
[ TV Monitor ] <----/
```

### Key Security Advantages:
* **No Public Internet Exposure:** The server port (`5000` for API / `27017` for MongoDB) is only exposed to the local router. Attackers on the public internet cannot see, scan, or attempt connection handshakes.
* **Offline Reliability:** Since all database traffic is routed through the local router, the queue dashboard and TV monitor will continue to function seamlessly even if the building loses internet connection.
* **Zero Monthly Hosting Fees:** Leveraging existing shop hardware avoids cloud subscription expenses.

### Local Deployment Steps:
1. Identify a designated Host PC onsite to run the server.
2. In the terminal of the Host PC, run the server:
   ```bash
   npm start
   ```
3. Open command prompt and run `ipconfig` to find the IPv4 Address (e.g. `192.168.1.105`).
4. On other onsite devices connected to the same Wi-Fi, open the browser and navigate to:
   ```
   http://192.168.1.105:5000
   ```

---

## 2. Multi-Branch Scaling & Future Cloud Security

When Hontech expands to multiple physical branches (e.g. Branch A, Branch B) or needs remote administrative access, the system can scale using one of these secure designs:

### Option A: Cloud Hosting with Static IP Whitelisting (Recommended)
* **Design:** Host the Node/Express server and MongoDB in a secure cloud VPC (e.g., AWS, Render, MongoDB Atlas).
* **Security Control:** Configure the cloud firewall rules to **only allow traffic originating from the static IP addresses of the physical shops**.
* **Result:** Restricts access purely to physical employees onsite, blocking all general public internet users.

### Option B: Site-to-Site VPN
* **Design:** The server remains on a physical machine in Branch A. 
* **Security Control:** Secure IPsec or SD-WAN tunnels are established between the routers of Branch A, Branch B, and Branch C.
* **Result:** Inter-branch traffic travels over an encrypted private tunnel, keeping the application completely hidden from the public internet.

---

## 3. Data Protection Controls

* **Schema Sanitization:** The backend uses **Mongoose Schema definitions** to sanitize inputs, rendering NoSQL injection attacks ineffective.
* **Password Hashing:** All employee credentials are encrypted using **bcrypt** before database insertion.
* **Role-Based Access Control (RBAC):** Access to finance reports, user management, and exports are locked at the API level to specific roles (`owner` / `admin`).
* **Mock Data Integrity:** In development/testing, only fictional customer profiles (`0917-555-6666`) are used to completely eliminate any data leak liability.

---

## 4. Hosting Options Comparison: Cloud vs. Onsite (Client Decision Guide)

This guide helps the client decide between hosting on a public cloud server versus running a local physical server onsite at the workshop.

### Comparison Table

| Feature | Option A: Cloud Server (e.g., AWS, Render) | Option B: On-Premises Server (Local PC at Shop) |
| :--- | :--- | :--- |
| **HTTPS Security** | **Automated & Built-in**. SSL/TLS certificates are issued and renewed automatically, securing passwords and customer data. | **Manual Configuration**. Requires generating self-signed certificates or configuring local DNS. |
| **Internet Outage Impact** | **High Dependency**. If the shop loses internet connection, staff cannot access the system. | **Zero Dependency**. The system remains 100% operational over local Wi-Fi even during internet outages. |
| **Remote Monitoring** | **Enabled Out-of-the-box**. The owner can securely check analytics and shop status from home or on a phone. | **Restricted**. Requires setting up a VPN tunnel or configuring port forwarding on the router. |
| **Hardware & Power Management** | **Managed by Provider**. Cloud hosts guarantee 99.9% uptime, data backups, and redundancy. | **Client Responsibility**. The shop must manage a dedicated PC running 24/7, plus backup power (UPS). |
| **Connection Speed** | Fast (depends on internet bandwidth). | **Instantaneous** (operates at Local Area Network gigabit speeds). |

### Security Practice Recommendation
Regardless of the option chosen, **enforcing HTTPS (encryption)** is critical for the production launch to:
1. Protect employee passwords from interception on the shop's Wi-Fi network.
2. Encrypt sensitive customer details (names, contact numbers, vehicle license plates) in transit.
3. Prevent modern web browsers from marking the operations panel as "Not Secure".

---

## 5. Cost & Investment Analysis (Zero License Fee Model)

To keep the financial impact as low as possible for the client, the system's architecture leverages zero-licensing-fee technologies.

### Cost Breakdown

1. **Software & Licensing: ₱0 (FREE)**
   - The entire system is built using open-source frameworks (**Node.js, Express, MongoDB, Vanilla HTML/CSS/JS**).
   - There are **no monthly user license seat fees** or software purchase costs.

2. **On-Premises Local Hosting Cost: ~₱2,500 - ₱5,000 (One-time)**
   - **Hardware:** Leverages a standard computer already owned by the shop.
   - **Recurring Fees:** ₱0 per month.
   - **Recommended Investment:** A basic Uninterruptible Power Supply (UPS) for the host PC to prevent database corruption during local power interruptions.

3. **Cloud Hosting Cost: ~₱400 - ₱900 / month ($7 - $15 USD)**
   - **Infrastructure:** Host Node.js on Render/Heroku and MongoDB on MongoDB Atlas.
   - **Benefits:** Automatic daily backups, 99.9% uptime, and zero physical maintenance required by the shop.

---

## 6. Implementation & Launch Roadmap (What Needs to Be Done)

To transition this system successfully into the shop, use this checklist for pre-launch setup, emergency contingency planning, and staff training.

### Phase 1: Infrastructure Choice & Setup
- [ ] **Align on Hosting Option:** Get the client's decision on **Cloud** vs. **On-Premises** hosting.
- [ ] **Prepare the Server Environment:**
  - *If On-Premises:* Set up a dedicated, clean computer at the shop, install Node.js and MongoDB, and plug it into a UPS battery backup.
  - *If Cloud:* Set up accounts on Render/Heroku and MongoDB Atlas, configure environment variables, and verify connection.
- [ ] **Configure Security (HTTPS):** 
  - Install SSL certificates on the chosen environment to encrypt network data.

### Phase 2: Business Continuity & Backup Setup
- [ ] **Configure Automatic Backups:**
  - Schedule database exports to run daily (e.g., at 9:00 PM close of business) and copy them to a secondary drive or cloud folder (Google Drive/Dropbox).
- [ ] **Create Network Redundancy Plan:**
  - *If using Cloud:* Set up a backup mobile Wi-Fi hotspot at the shop in case the primary fiber internet fails.
- [ ] **Develop an Emergency Manual Process:**
  - Keep paper-based check-in forms and claim stubs ready as a fallback if the power goes out or the local server fails.

### Phase 3: Staff Training & Parallel Run (Launch Week)
- [ ] **Conduct Staff Training Sessions:**
  - **Front Desk:** Train on vehicle check-in and claim stub generation.
  - **Service Advisors (SAs):** Train on claiming jobs, assigning lift bays, updating parts, and marking jobs complete.
  - **TV Lounges:** Verify the TV screen displays the live monitor correctly.
- [ ] **Launch a 3-Day Parallel Run:**
  - Use the system along with paper logs for three days. This ensures staff builds muscle memory and helps catch any local Wi-Fi or device connection issues without disrupting actual shop workflows.
- [ ] **Go 100% Digital:**
  - Stop using paper logs once the staff is comfortable and the network is stable.
