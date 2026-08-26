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

## 🔄 2. Step-by-Step: Paano Tayo Magtutulungan Araw-Araw? (The Developer-to-Tester Cycle)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      ANG ARAW-ARAW NA TIKET NG ATING PAGTUTULUNGAN                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. 📢 ANNOUNCEMENT: Justin builds a feature ➔ pushes to GitHub ➔ notifies team.        │
│ 2. 🧪 TESTING: Classmates open Chrome on Wi-Fi ➔ test assigned roles & checklist.      │
│ 3. 📝 REPORTING: Classmates spot a bug ➔ log on GitHub Issues with Step #.             │
│ 4. 🛠️ FIXING: Justin modifies code in Antigravity in 2 mins ➔ pushes update.          │
│ 5. ✅ SIGN-OFF: Classmates refresh browser ➔ verify fix ➔ mark [PASS]!                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 🔹 HAKBANG 1: Pag-anunsyo ng Bagong Feature (Kay Justin Ito)
* Matapos mag-code ni Justin ng bagong feature (halimbawa: *Customer History at Back-Jobs*), i-pupush niya ito sa GitHub.
* Sasabihin ni Justin sa GC:  
  💬 *"Team, live na ang bagong update! Pakitest ang Customer Lookup at 40-Day Regulars gamit ang inyong laptop at phone."*

### 🔹 HAKBANG 2: Pagsisimula ng Test Session (Kay Classmate A at B Ito)
* Kokonekta ang lahat sa iisang Wi-Fi / Hotspot.
* Bubuksan ni Classmate A ang kanyang laptop $\to$ mag-login bilang **Service Advisor**.
* Bubuksan ni Classmate B ang kanyang phone o school PC $\to$ mag-login bilang **Assistant Staff**.
* Susundan nila ang **22-Step Verification Checklist** sa ibaba.

### 🔹 HAKBANG 3: Pag-Report ng Nakitang Mali o Bug (Kay Classmate A at B Ito)
* Kapag may napansing tabingi, maling kulay, o button na hindi pumindot:
* Bubuksan ni Classmate B o A ang GitHub Issues link sa phone/laptop at magpo-post ng simpleng report:  
  *Halimbawa: "Step 5.2 - Hindi lumabas ang dating Job ID sa Back-Job form."*

### 🔹 HAKBANG 4: Pag-aayos ng Code (Kay Justin Ito)
* Babasahin ni Justin ang report sa GitHub.
* Bubuksan ni Justin ang code sa Antigravity IDE, aayusin ang error sa loob ng 2 minuto, at magko-commit:  
  `git commit -m "fix: resolved backjob ID binding" && git push`
* Sasabihin ni Justin sa GC: 💬 *"Naayos na po! Paki-refresh (F5) ang inyong browser."*

### 🔹 HAKBANG 5: Re-Testing at Final Sign-Off (Buong Grupo)
* I-re-refresh nina Classmate A at B ang kanilang browser.
* Kapag maayos na ang takbo, mamarkahan ang checklist ng **`[x] PASS`** at icloclose ang issue sa GitHub!

---

## 📶 3. Paano Mag-Connect at Mag-Login (Step-by-Step)

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

### 🔑 Listahan ng Test Accounts:
| Role | Email | Password |
| :--- | :--- | :--- |
| **Owner** | `owner@hontech.com` | `owner123` |
| **Administrator** | `admin.marikina@hontech.com` | `admin123` |
| **Service Advisor 1** | `sa.marikina1@hontech.com` | `sa123` |
| **Assistant Staff** | `assistant.marikina@hontech.com` | `assistant123` |

---

## 📋 4. Ang 22-Step Master Verification & Checking List (Pass / Fail)

---

### 🔑 SUITE 1: Role-Based Authentication & Navigation (4 Roles)
- [ ] **Step 1.1 (Owner):** Mag-login bilang `owner@hontech.com` $\to$ Lalabas ang Master Analytics at Security tabs.
- [ ] **Step 1.2 (Admin):** Mag-login bilang `admin.marikina@hontech.com` $\to$ May access sa Staff Accounts at Bay Config.
- [ ] **Step 1.3 (Service Advisor):** Mag-login bilang `sa.marikina1@hontech.com` $\to$ Nakatutok sa Intake, Customer Lookup, at Bays.
- [ ] **Step 1.4 (Assistant):** Mag-login bilang `assistant.marikina@hontech.com` $\to$ Nakatutok sa Online Booking Queue at Search Menu.

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

## 🐛 5. Paano Mag-Report ng Nakitang Mali sa GitHub (1-Minutong Paraan)

Kapag may nakita kayong mali habang nagte-test:
1. Pumunta sa: [**https://github.com/Justin-stack101/Hontech_Main_Active_Development_PHP_SQL/issues**](https://github.com/Justin-stack101/Hontech_Main_Active_Development_PHP_SQL/issues).
2. I-click ang **`New Issue`**.
3. I-type lang ito:

```markdown
### 📌 Saan Nakita ang Mali (Verification Step #):
- **Step ID:** [Halimbawa: Step 5.2 - Customer Lookup]
- **Device na Gamit:** [Laptop / Cellphone]

### ❌ Ano ang Nangyari (Ang Problema):
[Halimbawa: "Hindi kusa napili ang Back-Job sa dropdown, nanatiling PMS."]

### 💡 Ano ang Inaasahan (Expected):
[Halimbawa: "Dapat maging Back-Job / Warranty Return agad ang category."]
```

4. I-click ang **`Submit new issue`** $\to$ Aayusin agad ni Justin sa loob ng 2 minuto!

---

## 🎭 6. Limang-Minutong Roleplay Script Bago ang Thesis Defense

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
