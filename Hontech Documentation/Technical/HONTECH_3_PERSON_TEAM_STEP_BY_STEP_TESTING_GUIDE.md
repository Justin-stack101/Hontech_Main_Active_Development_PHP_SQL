# 🚗 HonTech 3-Person Team Step-by-Step Testing & Collaboration Guide
## Gabay Para Kay Justin at sa Kanyang Dalawang (2) Kagrupo sa Capstone

```text
========================================================================================================
PROJECT:               HonTech AutoCenter Management System
TEAM MEMBERS:          Justin Nolasco (Lead Developer) + 2 Groupmates (QA Testers)
BRANCH:                branch2-Security-Account-Recovery
GITHUB:                https://github.com/Justin-stack101/Hontech_Main_Active_Development_PHP_SQL.git
TARGET AUDIENCE:       Para sa buong grupo (Kahit walang background sa coding o GitHub!)
========================================================================================================
```

---

## 📌 Para sa Ating Dalawang Kagrupo (Basahin Ito Bago Magsimula)

Hello team! Huwag kayong mag-alala kung wala kayong background sa coding o GitHub. **Hindi ninyo kailangang mag-code.** 

Ang mahalagang trabaho ninyo sa ating Capstone ay maging **Quality Assurance (QA) & End-User Testers**. Kayo ang magsisilbing **mga staff ng HonTech** (Service Advisor at Reception Assistant) para tingnan kung madali bang gamitin ang system, kung may pangit na text o kulay, o kung may buttons na hindi gumagana.

---

## 👥 Sino ang Gagawa ng Ano? (Our 3-Person Roles)

| Member | Device na Gagamitin | Role sa System | Ano ang Gagawin? |
| :--- | :--- | :--- | :--- |
| **1. Justin (Lead Developer)** | Laptop #1 | **Owner / Admin** | Nagpapatakbo ng server, nag-aayos ng code kapag may nakitang mali, at nag-uupdate sa GitHub. |
| **2. Classmate A (Laptop Tester)** | Laptop #2 | **Service Advisor** | Nagtetest ng Customer Lookup, Walk-in Intake, Back-Job Warranty, at Bay Allocation sa laptop. |
| **3. Classmate B (Phone / Lab Tester)** | Smartphone o School Lab PC | **Assistant Staff & QA Logger** | Nagtetest gamit ang cellphone (Mobile View) o school PC, at naglilista ng mga nakitang mali sa GitHub. |

---

# 🚀 STEP-BY-STEP WORKFLOW: Paano Mag-Test Nang Sabay-Sabay

---

### 🟢 HAKBANG 1: Pag-connect sa iisang Wi-Fi (School, Bahay, o Hotspot)
1. Siguraduhin na ang **Laptop ni Justin**, **Laptop ni Classmate A**, at **Phone ni Classmate B** ay nakakabit sa **iisang Wi-Fi** o **Phone Hotspot**.
2. **Si Justin:** I-double click ang `start_lan_server.bat` sa kanyang laptop.
3. May lalabas na itim na window na magpapakita ng inyong local IP, halimbawa:  
   👉 `http://192.168.1.50:8000` (o kung anong IP ang lumabas).

---

### 🔵 HAKBANG 2: Pag-Login ni Classmate A (Service Advisor Role)
1. Buksan ang Google Chrome sa iyong Laptop.
2. Sa address bar sa itaas, i-type ang IP address ni Justin (halimbawa: `http://192.168.1.50:8000`).
3. Mag-login gamit ang account na ito:
   * **Email:** `sa.marikina1@hontech.com`
   * **Password:** `sa123`
4. **Ang Iyong Gagawin:**
   * I-click ang **Customer Lookup** tab.
   * Mag-search ng pangalan: `Juan Dela Cruz` o plate `ABC 1234`.
   * Tingnan kung lalabas ang **`⭐ Returning Regular`** badge at ang kanyang nakaraang repair logs!
   * I-click ang **`[ 🚗 Regular Visit (PMS) ]`** $\to$ Tingnan kung kusa bang napuno ang Name, Plate, at Phone sa Intake form!
   * I-click ang **`[ 🔁 Back-Job (Warranty) ]`** $\to$ Tingnan kung nakakabit ang dating Job Order ID!

---

### 🟣 HAKBANG 3: Pag-Login ni Classmate B (Assistant Staff / Cellphone Tester)
1. Sa iyong **Smartphone** (o School Lab PC), buksan ang browser (Chrome / Safari).
2. I-type ang IP address ni Justin (halimbawa: `http://192.168.1.50:8000`).
3. Mag-login gamit ang account na ito:
   * **Email:** `assistant.marikina@hontech.com`
   * **Password:** `assistant123`
4. **Ang Iyong Gagawin:**
   * Tingnan ang **Pending Online Inquiries** table.
   * I-click ang button na **`[ 🔍 Search Customer / Back-Job ]`**.
   * Mag-type ng customer name.
   * Piliin ang **`YES (Daily Intakes)`** o **`NO (Stay Here)`**.
   * Tingnan kung maayos ba ang hitsura sa screen ng cellphone (walang tabingi o putol na text!).

---

# 🐛 HAKBANG 4: Paano Mag-Report ng Nakitang Mali o Bug sa GitHub

Kapag may nakita kayong pangit na text, maling kulay, o button na ayaw pumindot, ganito lang kasimple mag-report sa GitHub:

---

### 📱 Paraan sa Pag-Report (Puwede sa Phone o Laptop):
1. Pumunta sa link na ito:  
   👉 [**https://github.com/Justin-stack101/Hontech_Main_Active_Development_PHP_SQL/issues**](https://github.com/Justin-stack101/Hontech_Main_Active_Development_PHP_SQL/issues)
2. I-click ang green button: **`New Issue`**.
3. I-copy-paste at punan itong simpleng template:

```markdown
### 📌 Saan Nakita ang Mali:
- **Screen:** Customer Lookup / Daily Intakes / Login
- **Gamit na Device:** Laptop / Cellphone (Android/iPhone)

### ❓ Ano ang Nangyari (Ang Problema):
[Halimbawa: "Masyadong maliit ang text ng date, hindi mabasa nang maayos sa cellphone."]

### 💡 Ano ang Mas Maganda (Suhestiyon):
[Halimbawa: "Pakilakihan ang font at lagyan ng kulay green ang status."]
```

4. I-click ang **`Submit new issue`**!
5. **Si Justin:** Makikita agad ito sa kanyang computer, aayusin sa code sa loob ng 2 minuto, at ipupush sa GitHub!

---

# 🎭 5-MINUTONG PRACTICAL ROLEPLAY SCRIPT PARA SA GRUPO

*Subukan ninyo itong 5-minutong roleplay para maranasan ang tunay na takbo ng workshop bago ang thesis defense:*

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        5-MINUTE TEAM ROLEPLAY SIMULATION                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. CLASSMATE B (Phone/Assistant):                                                      │
│    "Justin & Classmate A, may tumawag na customer na si Juan Dela Cruz (ABC 1234),     │
│    nag-book siya ng Online PMS para mamayang 2:00 PM." ➔ (I-submit sa Assistant Form) │
│                                                                                        │
│ 2. CLASSMATE A (Laptop/Service Advisor):                                               │
│    "Nakita ko sa Daily Intakes table! Dumating na si Juan Dela Cruz sa shop.          │
│    I-lookup ko ang kanyang history at i-assign ko sa Bay 1." ➔ (I-click Bay Dispatch)  │
│                                                                                        │
│ 3. JUSTIN (Lead Developer/Admin):                                                      │
│    "Pumasok ang order sa master revenue chart at TV workshop monitor! 100% SUCCESS!"   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 🎓 Mensahe Para sa Thesis Defense:
Kapag tinanong kayo ng panel kung paano kayo nagtulungan:
* **Justin:** *"Ako po ang nag-code ng database at backend APIs."*
* **Classmate A:** *"Ako po ang nag-test ng Service Advisor features at Customer History sa desktop."*
* **Classmate B:** *"Ako po ang nag-test ng mobile responsiveness sa phone at nag-log ng mga bugs sa GitHub Issues."*
