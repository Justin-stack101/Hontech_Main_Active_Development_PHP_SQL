# HonTech Capstone Collaboration Guide

This document outlines the step-by-step instructions for adding a Tester to the GitHub repository, setting up their environment, and working together using a simple Git workflow.

---

## 🛠️ Step 1: Add the Tester to GitHub (For Repository Owner)

1. Open your repository on **GitHub.com**.
2. Click **Settings** (gear icon in the top tabs).
3. Select **Collaborators** from the left sidebar.
4. Click **Add people**.
5. Enter the Tester's GitHub username or email, select them, and click **Add to this repository**.
6. **Important:** The Tester must open their email (associated with GitHub) and click the **Accept Invitation** link.

---

## 💻 Step 2: Tool Setup (For Tester)

The Tester needs to install the following free software packages in order:

1. **Git** (Version Control): [git-scm.com/downloads](https://git-scm.com/downloads)
2. **Node.js** (LTS version): [nodejs.org](https://nodejs.org)
3. **VS Code** (Text Editor): [code.visualstudio.com](https://code.visualstudio.com)
4. **MongoDB Community Server** (Local Database): [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community) *(Also check the box to install MongoDB Compass during setup).*

---

## 📦 Step 3: Local Project Setup (For Tester)

After installing the tools, the Tester should follow these steps to download and run the project:

### 1. Clone the Code
1. Open **VS Code**.
2. Open a new terminal inside VS Code: Press `` Ctrl + ` `` (control + backtick) or select **Terminal -> New Terminal** from the top menu.
3. In the terminal, navigate to a folder where you want to save the project (e.g. your Documents folder), then run:
   ```bash
   git clone https://github.com/Justin-stack101/CapstoneOfficial2_Development.git
   ```
4. In VS Code, go to **File -> Open Folder...** and open the cloned folder:
   `CapstoneOfficial2_Development/DeveloperVersion`

### 2. Install Packages
In the VS Code terminal, run:
```bash
npm install
```

### 3. Setup Configuration
1. In the file explorer on the left, locate `.env.example`.
2. Duplicate this file and rename the new copy to `.env`.
3. Open the new `.env` file and make sure the parameters are correct:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/hontech
   JWT_SECRET=supersecretjwtkey12345!
   NODE_ENV=development

   # Default User Passwords for Seeding
   OWNER_PASSWORD=owner123
   ADMIN_PASSWORD=admin123
   STAFF_PASSWORD=staff123
   SA_PASSWORD=sa123
   TECH_PASSWORD=tech123
   ```
4. Save the file.

### 4. Create Test Accounts & Start Server
Run the database seed script to set up default roles and sample data:
```bash
npm run seed
```
Then, start the server:
```bash
npm run dev
```
Open your browser and visit: `http://localhost:5000`

---

## 🔄 Step 4: Simple Git Testing Workflow

Because the Tester is only checking features and **not writing code**, this is a simple one-way download flow:

```
[ Developer Computer ] ──(git push)──> [ GitHub ] ──(git pull)──> [ Tester Computer ]
```

### 1. Developer pushes updates:
Whenever you (the Developer) finish a feature and want the tester to verify it, run:
```bash
git add .
git commit -m "feat: description of feature"
git push origin Hontech_Main_Active_Development
```

### 2. Tester downloads updates:
The Tester opens their VS Code terminal and runs:
```bash
git pull origin Hontech_Main_Active_Development
```
Then they restart the server (`npm run dev`) and test the updates.

### ⚠️ What if the Tester accidentally modifies files and Git blocks the pull?
If they get an error trying to pull, they can reset their local code to match yours perfectly by running:
```bash
git reset --hard origin/Hontech_Main_Active_Development
```
This cleans their environment and lets them download your latest version.

---

## 📝 Git Command Quick Reference (Cheat Sheet)

### 1. The Gather Command
```bash
git add .
```
**In summary:**  
You are telling Git: *"Gather all my new files, deletions, and edits from my folder and prepare them to be part of my next save point."*

---

### 2. The Save Point Command
```bash
git commit -m "style: updated TV slide 3 colors"
```
**In summary:**  
You are telling Git: *"Create a local Save Point on my computer, label it 'style: updated TV slide 3 colors', and save it in my project's history."*

---

### 3. The Send Command
```bash
git push origin Hontech_Main_Active_Development
```
**In summary:**  
You are telling Git: *"Upload all the local Save Points I have created on my computer up to the cloud on GitHub under the branch 'Hontech_Main_Active_Development'."*

---

### 4. The Tester's Download Command
```bash
git pull origin Hontech_Main_Active_Development
```
**In summary:**  
You are telling Git: *"Download and merge the latest Save Points from the cloud on GitHub directly into my local computer folder."*

