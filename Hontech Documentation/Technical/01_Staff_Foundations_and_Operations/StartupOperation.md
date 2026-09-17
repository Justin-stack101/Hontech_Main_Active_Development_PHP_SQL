# HonTech AutoCenter — Official Terminal & Development Guide

## 🚀 1. How to Launch the Local Website

### Option A: Standard Terminal Command (Recommended)
Open your terminal in the project root and run:
```bash
npm.cmd run dev
```
> *(Runs `php -S 0.0.0.0:8000 router.php`)*  
> Open in your browser: **`http://localhost:8000`**

### Option B: Local LAN Server Launcher (Multi-Device / Phone Testing)
Double-click:
```text
start_lan_server.bat
```
*(Auto-detects your local Wi-Fi IP e.g. `http://192.168.1.50:8000` for phone/tablet testing)*

---

## 🧪 2. How to Run Automated Script Tests (Developer Testing)

Whenever you or the AI makes changes to the system, run:

### Run All 27 Automated Tests:
```bash
npm.cmd test
```

### Run Specific Test Suites:
- **Frontend Logic & SLA Math:**
  ```bash
  npm.cmd run test:frontend
  ```
- **Backend PHP & Database Checks:**
  ```bash
  npm.cmd run test:backend
  ```
- **Security, RBAC & SQL Injection:**
  ```bash
  npm.cmd run test:security
  ```

---

## 📋 3. Team Division of Testing Roles
* **Justin (Lead Developer):** Runs `npm.cmd test` in the terminal to verify backend APIs, SLA logic, and security barriers in 3 seconds.
* **Catherine & Mary Dayne (QA Team):** Run manual browser test scenarios documented in `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv` on laptops and mobile phones.