# HonTech Security Vulnerabilities & Remediation Log

This document records the security audit findings for the **HonTech AutoCenter Operations System**, detailing identified vulnerabilities, sensitive data exposure, and specific action items to secure the system for future production deployment.

---

## 1. Critical Vulnerabilities

### 🚨 Password Reset OTP Leaked in API Response
* **Location:** [`forgotPassword` (backend/controllers/authController.js:L131-160)](file:///c:/Users/justi/Downloads/School%20Files/MainProjectCollection/ComprogStudies/ProjectsWebDev/Capstone%20Things/DeveloperVersion/backend/controllers/authController.js#L131-L160)
* **Vulnerability Description:** When a user requests a password reset code, the server generates a 6-digit OTP code and returns it directly inside the HTTP response payload to the client.
* **Risk Level:** **Critical** (Allows account takeover)
* **Exploit Scenario:** Anyone who knows a registered email address (e.g. `owner@hontech.com`) can hit the forgot password endpoint, read the OTP code from the JSON response, and immediately call `resetPassword` to set a new password and log in.
* **Remediation Action Items:**
  - [ ] Remove the `token: otp` property from the JSON response object in [`authController.js`](file:///c:/Users/justi/Downloads/School%20Files/MainProjectCollection/ComprogStudies/ProjectsWebDev/Capstone%20Things/DeveloperVersion/backend/controllers/authController.js).
  - [ ] Connect a mailer transport (e.g. `nodemailer` using Gmail, SendGrid, or AWS SES) to send the OTP privately to the requested email.
  - [ ] Return a generic success message (e.g., *"If this email exists in our records, a reset code has been sent"*).

---

### 🚨 Arbitrary Job Field Updates (Mass Assignment / Prototype Pollution)
* **Location:** [`updateJobField` (backend/controllers/jobController.js:L89-112)](file:///c:/Users/justi/Downloads/School%20Files/MainProjectCollection/ComprogStudies/ProjectsWebDev/Capstone%20Things/DeveloperVersion/backend/controllers/jobController.js#L89-L112)
* **Vulnerability Description:** The PATCH endpoint allows direct object property assignment using unvalidated dynamic keys passed in the request body:
  ```javascript
  job[field] = value;
  ```
* **Risk Level:** **High** (Integrity compromise & potential Remote Code Execution/Denial of Service)
* **Exploit Scenario:** A user could pass a restricted field name (e.g. `id`, `claimStub`, or internal Mongoose attributes) to overwrite system identifiers. Overwriting properties like `__proto__` can lead to **Prototype Pollution**, crashing the server or introducing runtime exploits.
* **Remediation Action Items:**
  - [ ] Implement a strict whitelist of fields allowed to be dynamically updated:
    ```javascript
    const ALLOWED_FIELDS = ['remarks', 'partsAvailable', 'evaluation', 'promisedDate'];
    if (!ALLOWED_FIELDS.includes(field)) {
      return res.status(400).json({ message: 'Invalid or restricted field update.' });
    }
    ```

---

## 2. Hardcoded Secrets & Weak Defaults

### 🔑 Hardcoded Cryptographic Fallback Keys
* **Locations:**
  * [`authController.js` (JWT secret fallback)](file:///c:/Users/justi/Downloads/School%20Files/MainProjectCollection/ComprogStudies/ProjectsWebDev/Capstone%20Things/DeveloperVersion/backend/controllers/authController.js#L7)
  * [`auth.js` (JWT secret verify fallback)](file:///c:/Users/justi/Downloads/School%20Files/MainProjectCollection/ComprogStudies/ProjectsWebDev/Capstone%20Things/DeveloperVersion/backend/middleware/auth.js#L12)
  * [`db.js` (Database URI fallback)](file:///c:/Users/justi/Downloads/School%20Files/MainProjectCollection/ComprogStudies/ProjectsWebDev/Capstone%20Things/DeveloperVersion/backend/config/db.js#L5)
* **Vulnerability Description:** If environment variables are missing, the system defaults to fallback strings such as `'supersecretjwtkey12345!'` or `'mongodb://127.0.0.1:27017/hontech'`.
* **Risk Level:** **Medium** (Vulnerable to credential leak if code is made public)
* **Exploit Scenario:** Pushing the source code to a public repository leaks the secret keys. If production runs without correctly loading the environment variables, the system will use the public fallback keys, allowing attackers to sign valid administrative JSON Web Tokens.
* **Remediation Action Items:**
  - [ ] Require environmental variables on startup. Throw a fatal error and exit if they are not defined:
    ```javascript
    if (!process.env.JWT_SECRET) {
      console.error('FATAL ERROR: JWT_SECRET environment variable is missing.');
      process.exit(1);
    }
    ```

### 👤 Weak Seeding Credentials
* **Location:** [`seedDatabase` (backend/server.js:L32-116)](file:///c:/Users/justi/Downloads/School%20Files/MainProjectCollection/ComprogStudies/ProjectsWebDev/Capstone%20Things/DeveloperVersion/backend/server.js#L32-L116)
* **Vulnerability Description:** The database seeding function creates administrative and staff accounts automatically with weak, guessable passwords like `owner123`, `staff123`, `sa123`, and `tech123`.
* **Risk Level:** **Medium** (Brute-force risk)
* **Remediation Action Items:**
  - [ ] Disable seeding in production environments (e.g., restrict database seeding to `process.env.NODE_ENV === 'development'`).
  - [ ] Force users to change their password upon their first login.

---

## 3. Denial of Service & API Rate Limiting

### 📂 Large Payload Limit & In-Memory Staging
* **Locations:**
  * [`server.js` JSON body parser](file:///c:/Users/justi/Downloads/School%20Files/MainProjectCollection/ComprogStudies/ProjectsWebDev/Capstone%20Things/DeveloperVersion/backend/server.js#L133-L134)
  * [`uploadTempFile` in jobController.js](file:///c:/Users/justi/Downloads/School%20Files/MainProjectCollection/ComprogStudies/ProjectsWebDev/Capstone%20Things/DeveloperVersion/backend/controllers/jobController.js#L184-L204)
* **Vulnerability Description:** The JSON request size limit is configured at `50mb`. Uploaded temporary files are held in-memory in a JavaScript object (`tempFiles`).
* **Risk Level:** **Medium** (Denial of Service via memory exhaustion)
* **Exploit Scenario:** An attacker could repeatedly upload huge base64 file payloads to the server, exhausting the available system RAM and causing Node.js to crash with an Out of Memory error.
* **Remediation Action Items:**
  - [ ] Reduce the default body parser size limit to a safer ceiling (e.g., `1mb` or `2mb`).
  - [ ] Use file upload middleware (like `multer`) to stream incoming files directly to local disk or a cloud storage provider (like Amazon S3 or Cloudinary) rather than staging them in RAM.

### ⏳ Missing Rate Limiter on Account Recovery
* **Location:** [`server.js:L138-L143`](file:///c:/Users/justi/Downloads/School%20Files/MainProjectCollection/ComprogStudies/ProjectsWebDev/Capstone%20Things/DeveloperVersion/backend/server.js#L138-L143)
* **Vulnerability Description:** The rate limiter is applied only to the login endpoint. The `/api/auth/forgot-password` and `/api/auth/reset-password` endpoints have no rate limits.
* **Risk Level:** **Low/Medium** (Email spamming / token brute-forcing)
* **Remediation Action Items:**
  - [ ] Apply the Express rate limiter middleware to `/api/auth/forgot-password` and `/api/auth/reset-password`.
