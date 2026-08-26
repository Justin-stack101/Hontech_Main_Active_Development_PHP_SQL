# 🧪 HonTech All-in-One QA & Unit Testing Master Guide
## The Single Official Testing, Roleplay & Verification Guide for Justin and His 2 Groupmates

```text
========================================================================================================
PROJECT:               HonTech AutoCenter Management System
BRANCH:                branch2-Security-Account-Recovery
GITHUB:                https://github.com/Justin-stack101/Hontech_Main_Active_Development_PHP_SQL.git
TEAM SETUP:            Justin (Sole Developer) + 2 Groupmates (QA & Usability Testers)
CLASSIFICATION:        Official Single Team Testing Document
========================================================================================================
```

---

## 👥 1. Sino ang Gagawa ng Ano? (Our 3-Person Team Roles)

*Huwag mag-alala kung wala kayong background sa coding—ang mahalagang role ninyo ay maging mga staff ng HonTech at mag-test!*

| Member | Hardware na Gagamitin | Role sa System | Pang-araw-araw na Trabaho |
| :--- | :--- | :--- | :--- |
| **1. Justin (Lead Developer)** | Laptop #1 | **Owner / Admin** | Nagpapatakbo ng server via `start_lan_server.bat`, nag-aayos ng code sa Antigravity, at nag-uupload sa GitHub. |
| **2. Classmate A (Laptop Tester)** | Active Laptop #2 | **Service Advisor 1 & 2** | Nagtetest ng Customer Lookup, Walk-in Intake, Back-Job Warranty, at Bay Allocation sa laptop. |
| **3. Classmate B (Phone / Lab Tester)** | Smartphone o School Lab PC | **Assistant Staff & QA Logger** | Nagtetest gamit ang cellphone (Mobile View) o school lab PC, at naglilista ng mga nakitang mali sa GitHub. |

---

# 📶 2. STEP-BY-STEP PARA SA CLOSE TESTING (Nasa School Lab, Bahay, o Coffee Shop)

*Kapag magkakasama kayo sa iisang kwarto o school lab, ZERO INSTALLATION ang kailangan para sa mga kagrupo!*

```
                       LOCAL WI-FI / SCHOOL LAB TESTING SETUP
                       
      [ JUSTIN: Laptop 1 ]                        [ CLASSMATE A: Laptop 2 ]
   • Runs `start_lan_server.bat`               • Opens Chrome ➔ http://192.168.x.x:8000
   • IP lumalabas: 192.168.x.x:8000            • Login as Service Advisor (`sa123`)
   • Login as Owner (`owner123`)               • Tests Intakes & Back-Jobs
                 │                                           │
                 └───────────────────┬───────────────────────┘
                                     │ (Connected sa iisang Wi-Fi / Hotspot)
                                     ▼
                          [ CLASSMATE B: Phone / School PC ]
                       • Opens Chrome / Safari ➔ http://192.168.x.x:8000
                       • Login as Assistant (`assistant123`)
                       • Tests Mobile Inquiries & Logs Bugs sa GitHub!
```

### 📋 Mga Hakbang Para sa Close Testing:
1. **Hakbang 2.1 (Connect Wi-Fi):** Ikonekta ang Laptop ni Justin, Laptop ni Classmate A, at Phone/PC ni Classmate B sa **iisang Wi-Fi** o **Phone Hotspot**.
2. **Hakbang 2.2 (Start Server):** I-double click ni Justin ang `start_lan_server.bat` sa kanyang laptop $\to$ Tignan ang lalabas na IP (halimbawa: `http://192.168.1.50:8000`).
3. **Hakbang 2.3 (Classmate A Login):** Buksan ni Classmate A ang Chrome sa kanyang laptop $\to$ I-type ang `http://192.168.1.50:8000` $\to$ Mag-login bilang **Service Advisor** (`sa.marikina1@hontech.com` / `sa123`).
4. **Hakbang 2.4 (Classmate B Login):** Buksan ni Classmate B ang Chrome sa kanyang Phone o School Lab PC $\to$ I-type ang `http://192.168.1.50:8000` $\to$ Mag-login bilang **Assistant Staff** (`assistant.marikina@hontech.com` / `assistant123`).
5. **Hakbang 2.5 (Simultaneous Testing):** Mag-test nang sabay-sabay gamit ang **22-Step Verification Checklist** sa ibaba!

---

# 🌐 3. STEP-BY-STEP PARA SA FAR AWAY TESTING (Nasa Kani-kaniyang Bahay / Remote)

*Kapag nasa magkaibang bahay kayo, may DALAWANG simpleng paraan para makapag-test:*

---

### 🌟 PARAAN A: Instant Free Online Link (Easiest - Para sa Cellphone at Laptop!)
1. **Hakbang 3A.1 (Justin):** I-run ni Justin ang `start_lan_server.bat` sa kanyang laptop.
2. **Hakbang 3A.2 (Justin):** Sa terminal, i-type ni Justin ang:
   ```bash
   npx localtunnel --port 8000
   ```
   *Maglalabas ito ng live public link, halimbawa:* `https://hontech-demo.loca.lt`.
3. **Hakbang 3A.3 (Send Link):** I-send ni Justin ang link sa group chat (Messenger/Discord).
4. **Hakbang 3A.4 (Classmates Open & Login):** Bubuksan nina Classmate A at B ang link sa kanilang laptop o cellphone sa kani-kanilang bahay $\to$ Mag-login sa kanilang accounts at mag-test!
5. **Hakbang 3A.5 (Log on GitHub):** Kapag may nakitang error, magpo-post sila agad sa **GitHub Issues** para makita at maayos ni Justin!

---

### 💻 PARAAN B: Independent Local Testing Gamit ang GitHub (Para kay Classmate A na may Laptop)
1. **Hakbang 3B.1 (Justin Pushes Code):** Matapos mag-code ni Justin, mag-commit at push sa GitHub:
   ```bash
   git push origin branch2-Security-Account-Recovery
   ```
2. **Hakbang 3B.2 (Classmate A Pulls Code):** Sa bahay ni Classmate A, buksan ang terminal o GitHub Desktop sa kanyang laptop at i-type:
   ```bash
   git pull origin branch2-Security-Account-Recovery
   ```
3. **Hakbang 3B.3 (Classmate A Runs Locally):** Sisimulan ni Classmate A ang XAMPP MySQL at i-double click ang `start_lan_server.bat` sa kanyang sariling laptop.
4. **Hakbang 3B.4 (Classmate A Tests):** Bubuksan niya ang `http://localhost:8000` sa kanyang sariling bahay.
5. **Hakbang 3B.5 (Report on GitHub):** Mag-log ng issues sa GitHub $\to$ Aayusin ni Justin sa kanyang bahay $\to$ I-pupull ulit ni Classmate A ang update!

---

## 🔄 4. The 4-Step Developer-to-QA Testing Loop

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        THE PERFECT DEVELOPER-TO-QA TESTING LOOP                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  1. 🌐 JUSTIN SHARES SECURE LINK / COMMITS TO GITHUB                                   │
│  2. 🧪 GROUPMATES TEST & LOG ON GITHUB ISSUES / EXCEL CHECKLIST                         │
│  3. 🛠️ JUSTIN REVIEWS & APPLIES CODE FIXES IN ANTIGRAVITY                              │
│  4. 🚀 GROUPMATES RE-TEST, MARK PASS, & MOVE TO NEXT FEATURE                           │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 5. Ang 22-Step Master Verification & Checking List (Pass / Fail)

---

### 🔑 SUITE 1: Role-Based Authentication & Navigation (4 Roles)
- [ ] **Step 1.1 (Owner):** Mag-login bilang `owner@hontech.com` (`owner123`) $\to$ Lalabas ang Master Analytics at Security tabs.
- [ ] **Step 1.2 (Admin):** Mag-login bilang `admin.marikina@hontech.com` (`admin123`) $\to$ May access sa Staff Accounts at Bay Config.
- [ ] **Step 1.3 (Service Advisor):** Mag-login bilang `sa.marikina1@hontech.com` (`sa123`) $\to$ Nakatutok sa Intake, Customer Lookup, at Bays.
- [ ] **Step 1.4 (Assistant):** Mag-login bilang `assistant.marikina@hontech.com` (`assistant123`) $\to$ Nakatutok sa Online Booking Queue at Search Menu.

---

### 👤 SUITE 2: Header at Sidebar Profile Badges
- [ ] **Step 2.1 (Top Header):** Kitang-kita sa itaas ang Pangalan (`Justin`), Role Pill (`[ OWNER ]`), at umiilaw na berdeng online dot.
- [ ] **Step 2.2 (Bottom Sidebar):** Maayos ang profile pill sa ibaba—walang lumalagpas o tabinging text, at may gear icon `[ ⚙️ ]`.
- [ ] **Step 2.3 (Dropdown Menu):** Pag clinic ang profile pill, may lumalabas na **Account Settings** at **Sign Out** buttons.

---

### 🚗 SUITE 3: Vehicle Intake at Duplicate Prevention Guard
- [ ] **Step 3.1 (Blank Validation):** Iwanang blangko ang Plate/Name at i-submit $\to$ May lalabas na pulang babala: *"Plate and Name are required."*
- [ ] **Step 3.2 (Normal Intake):** Mag-input ng plate `ABC 1234`, name `Juan Dela Cruz`, at i-submit $\to$ Papasok sa Daily Intakes table.
- [ ] **Step 3.3 (Duplicate Alert):** Subukang i-submit ulit ang parehong plate `ABC 1234` $\to$ Lalabas ang alert prompt: *"⚠️ DUPLICATE INTAKE DETECTED!"*
- [ ] **Step 3.4 (Cancel Guard):** I-click ang **Cancel** $\to$ Mapipigilan ang duplicate entry.

---

### ⭐ SUITE 4: Customer History Lookup at Loyalty Badges
- [ ] **Step 4.1 (Search):** Pumunta sa **Customer Lookup** tab $\to$ I-type ang `Juan` o `ABC 1234`.
- [ ] **Step 4.2 (Loyalty Badge):** Piliin ang customer $\to$ Lalabas ang berdeng **`⭐ Returning Regular (X Visits)`** badge at total spend.
- [ ] **Step 4.3 (History Timeline):** May mga cards na nagpapakita ng dating repair orders, mekaniko, concern, at resolution.

---

### 🔁 SUITE 5: 40-Day Regular Visit vs. Warranty Back-Jobs
- [ ] **Step 5.1 (40-Day Regular Visit):** I-click ang **`[ 🚗 Regular Visit (PMS) ]`** $\to$ Kusang mapupunan ang Name, Plate, at Phone sa Intake form na may category na `PMS`.
- [ ] **Step 5.2 (Warranty Back-Job):** I-click ang **`[ 🔁 Back-Job (Warranty) ]`** $\to$ Mapupunan ang form na may category na `Back-Job / Warranty Return` at nakadikit ang dating Job ID.
- [ ] **Step 5.3 (Specific Order Back-Job):** Sa ilalim ng isang dating repair card, i-click ang **`[ Create Back-Job for This Order ]`** $\to$ Makakabit ang eksaktong reference number at date.

---

### 🔍 SUITE 6: Assistant Staff Fast Popup Search Menu
- [ ] **Step 6.1 (Open Popup):** Sa Daily Intakes header, i-click ang **`[ 🔍 Search Customer / Back-Job ]`** $\to$ Bubukas ang popup search dialog.
- [ ] **Step 6.2 (Select Customer):** Pumili ng customer $\to$ May lalabas na tanong: *"Back-Job (Warranty Return) ba ito?"*.
- [ ] **Step 6.3 (NO Button):** I-click ang **`[ ❌ NO (Stay Here) ]`** $\to$ Mananatili sa popup para makita ang info.
- [ ] **Step 6.4 (YES Button):** I-click ang **`[ ✅ YES (Daily Intakes) ]`** $\to$ Lilipat sa Intake form na may pre-filled back-job data!

---

### 🔧 SUITE 7: Bay Allocation at Workshop Board
- [ ] **Step 7.1 (Dispatch Modal):** Pumunta sa **Workshop Bays** $\to$ I-click ang **Dispatch Vehicle** sa Bay 1.
- [ ] **Step 7.2 (Assign Technician):** Piliin ang kotse `ABC 1234` at mekaniko $\to$ Magiging kulay asul ang Bay 1 na may status na **Occupied**.

---

### 📊 SUITE 8: Analytics at PDF Export
- [ ] **Step 8.1 (Charts):** Mag-login bilang Admin $\to$ Makikita ang revenue charts at breakdown per Service Advisor.
- [ ] **Step 8.2 (PDF Report):** I-click ang **Export Official PDF Report** $\to$ Magge-generate ng print-ready PDF na may HonTech logo at timestamp.

---

### ✈️ SUITE 9: 100% Offline Air-Gapped Resilience (Walang Internet)
- [ ] **Step 9.1 (Airplane Mode):** I-off ang Wi-Fi o mag-Airplane Mode sa laptop.
- [ ] **Step 9.2 (Hard Refresh):** Pindutin ang **`Ctrl + F5`** sa Chrome habang offline $\to$ **100% buo ang design, kulay, at icons—WALANG sirang layout o raw text leaks!**

---

## 🐛 6. Paano Mag-Report ng Nakitang Mali sa GitHub (1-Minutong Paraan)

Kapag may nakita kayong mali habang nagte-test:
1. Pumunta sa: [**https://github.com/Justin-stack101/Hontech_Main_Active_Development_PHP_SQL/issues**](https://github.com/Justin-stack101/Hontech_Main_Active_Development_PHP_SQL/issues).
2. I-click ang **`New Issue`** $\to$ I-type lang ito:

```markdown
### 📌 Saan Nakita ang Mali (Verification Step #):
- **Step ID:** [Halimbawa: Step 5.2 - Customer Lookup]
- **Device na Gamit:** [Laptop / Cellphone]

### ❌ Ano ang Nangyari (Ang Problema):
[Halimbawa: "Hindi kusa napili ang Back-Job sa dropdown, nanatiling PMS."]

### 💡 Ano ang Inaasahan (Expected):
[Halimbawa: "Dapat maging Back-Job / Warranty Return agad ang category."]
```

3. I-click ang **`Submit new issue`** $\to$ Aayusin agad ni Justin sa loob ng 2 minuto!

---

## 🎭 7. Limang-Minutong Roleplay Script Bago ang Thesis Defense

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        5-MINUTE TEAM ROLEPLAY SIMULATION                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. CLASSMATE B (Phone/Assistant):                                                      │
│    "Justin & Classmate A, may customer inquiry si Juan Dela Cruz (ABC 1234),           │
│    nag-book ng PMS mamayang 2:00 PM." ➔ (I-submit sa Assistant Inquiries Form)         │
│                                                                                        │
│ 2. CLASSMATE A (Laptop/Service Advisor):                                               │
│    "Nakita ko sa Daily Intakes! Dumating na si Juan Dela Cruz sa shop.                 │
│    I-lookup ko ang history at i-dispatch ko sa Bay 1." ➔ (I-click Bay Dispatch)        │
│                                                                                        │
│ 3. JUSTIN (Lead Developer/Admin):                                                      │
│    "Pumasok ang order sa master revenue chart at TV workshop monitor! 100% PASSED!"    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
