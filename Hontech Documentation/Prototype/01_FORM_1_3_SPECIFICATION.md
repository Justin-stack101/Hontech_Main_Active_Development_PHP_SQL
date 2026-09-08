# Form 1/3 Job Order Studio & Live PDF Synchronizer
## Technical Specification & UI Architecture

---

## 📌 1. Overview & Objective
This specification defines the split-screen **Interactive SA Document Studio** and **Live PDF Form 1/3 Canvas**. As the Service Advisor types in the left-hand form fields, the right-hand canvas renders the exact physical **HonTech Job Order (Form 1/3)** and its bottom **Customer Claim Stub** with zero perceptible latency.

---

## 🏛️ 2. Split-Screen Layout Architecture

```
+-------------------------------------------------------+-------------------------------------------------------+
|                LEFT: SA SMART DATA FORM               |             RIGHT: LIVE FORM 1/3 PDF CANVAS           |
+-------------------------------------------------------+-------------------------------------------------------+
| [Customer & Vehicle Dossier]                          | +---------------------------------------------------+ |
| - Customer Full Name                                  | | Form 1/3   JOB ORDER NO. [ AUTO-JOB-001 ]         | |
| - Address & Contact / Viber                           | | HONTECH AUTOCENTER - Marikina City                | |
| - Plate No, Year/Model, Color                         | +---------------------------------------------------+ |
| - Mileage (KM), Engine #, Chassis #                   | | Customer: Juan Dela Cruz   Plate: ABC-1234        | |
| - Intake Date, Promise Date                           | | Address: Marikina City     Model: Vios 2021       | |
|                                                       | +---------------------------------------------------+ |
| [Service Concern & Diagnostic Findings]               | | Description of Requested Service / Concern:       | |
| - Text area with standard preset triggers             | | [ Live mirror of SA typed text ]                  | |
|                                                       | +---------------------------------------------------+ |
| [Parts & Materials Dynamic Table]                     | | DIAGNOSTIC RESULT | PARTS | MATERIALS             | |
| - [+ Add Part Row] [Desc, Qty, Unit Price]            | | [Live calculated line items & column totals]      | |
| - [+ Add Material Row] [Desc, Qty, Unit Price]        | +---------------------------------------------------+ |
| - Auto-calculated live totals                         | | Certificate of Completion & Conforme Signatures   | |
|                                                       | + - - - - - - - - - - - - - - - - - - - - - - - - - + |
| [Signatories & Actions]                               | | (Bottom Tear-off Claim Stub in Filipino)          | |
| - SA Name, Mechanic, Assessor, Manager                | | Name: Juan Dela Cruz     Claim Stub: CS-8821      | |
| - [🖨️ Print Form 1/3] [🚀 Push to Bay Queue]         | +---------------------------------------------------+ |
+-------------------------------------------------------+-------------------------------------------------------+
```

---

## 📑 3. Field Mapping & Data Binding Matrix

| Form Section | Data Field | Input Type | Live PDF Target Element | Synchronized Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Header** | `job_id` | Auto / Read-only | Top Right: `JOB ORDER NO.` | Generated sequential Job Order #. |
| **Header** | `date` | Date Picker | Top Right: `DATE:` | Defaults to current date. |
| **Customer** | `customer_name` | Text Input | `Name:` | Mirrors on Form 1/3 & Claim Stub. |
| **Customer** | `address` | Text Input | `Address:` | Form 1/3 Customer Box. |
| **Customer** | `contact_no` | Text Input | `Contact No.:` | Form 1/3 & Claim Stub contact line. |
| **Customer** | `email` | Text Input | `E-Mail Add.:` | Form 1/3 Customer Box. |
| **Vehicle** | `year_model` | Text Input | `Year/Model:` | Mirrors on Form 1/3 & Claim Stub. |
| **Vehicle** | `km_reading` | Text / Number | `KM Reading:` | Form 1/3 Customer Box. |
| **Vehicle** | `engine_no` | Text Input | `Engine No:` | Form 1/3 Customer Box. |
| **Vehicle** | `chassis_no` | Text Input | `Chassis No.:` | Form 1/3 Customer Box. |
| **Vehicle** | `plate_no` | Text Input | `Plate No:` | Mirrors on Form 1/3 & Claim Stub. |
| **Vehicle** | `intake_date` | Date Picker | `Intake Date:` | Form 1/3 Customer Box. |
| **Vehicle** | `promise_date` | Date Picker | `Promise Date:` | Form 1/3 Customer Box. |
| **Vehicle** | `color` | Text Input | `Color:` | Form 1/3 Customer Box. |
| **Concern** | `concern_description` | Textarea | Service Concern Box | Live typing preview + warranty surcharge note. |
| **Diagnostics** | `diagnostic_findings` | Textarea | Diagnostic Column | Live diagnostic result matrix. |
| **Parts** | `parts_list[]` | Dynamic Repeater | Parts Table (`Desc, Qty, Unit, Amount`) | `Qty × Unit Price = Amount`. Live column total. |
| **Materials** | `materials_list[]` | Dynamic Repeater | Materials Table (`Desc, Qty, Unit, Amount`) | `Qty × Unit Price = Amount`. Live column total. |
| **Sign-off** | `sa_name` | Text / Auto | `Interviewed by` & `Recommending Approval` | Prefills logged-in SA full name. |
| **Sign-off** | `mechanic_name` | Text Input | `Diagnosed by` & `Chief Mechanic` | Mechanic sign-off line. |
| **Sign-off** | `assessor_name` | Text Input | `Assessed by (Parts Controller)` | Parts Controller sign-off line. |
| **Claim Stub** | `claim_stub_no` | Auto / Sequential | Bottom `Claim Stub :` | Generated unique Claim Stub ID. |

---

## ⚙️ 4. Dynamic Math & Calculation Engine
* **Row Calculation**: $\text{Amount} = \text{Quantity} \times \text{Unit Price}$
* **Parts Total**: $\sum (\text{Parts Amounts})$
* **Materials Total**: $\sum (\text{Materials Amounts})$
* **Grand Estimated Total**: $\text{Parts Total} + \text{Materials Total}$
* **Owner-Supplied Notice**: Automatic display of the 25% surcharge warranty clause.
