# Form 2/3 Quotation Studio & Multi-Sheet Architecture
## Technical Specification, Math Engine & 1:1 Physical Sheet Canvas

---

## 📌 1. Overview & Objective
This specification defines the **Form 2/3 Quotation Studio** and the **Excel-Style Multi-Sheet Workbook Navigation Bar**. It allows Service Advisors to switch seamlessly between the **Job Order (Form 1/3)** and **Quotation (Form 2/3)** while preserving customer and vehicle information across both documents in real time.

---

## 🏛️ 2. Excel-Style Sheet Architecture

```
+-----------------------------------------------------------------------------------------------+
|                               ACTIVE STUDIO WORKSPACE (SPLIT-SCREEN)                          |
|         LEFT: Smart Editor Input Form         |          RIGHT: Live Physical Canvas          |
+-----------------------------------------------------------------------------------------------+
| [ 📄 Sheet 1: Form 1/3 (Job Order) ] | [ 📊 Sheet 2: Form 2/3 (Quotation) ] | [ ➕ Form 3/3 ]  |
+-----------------------------------------------------------------------------------------------+
```

### Key Principles:
1. **Shared In-Memory Dossier**: Editing Customer Name, Plate Number, Address, Contact, Model, Color, Job Order #, or Dates on either sheet synchronizes to the other sheet instantly with zero re-typing.
2. **Independent Specialized Calculations**:
   - **Form 1/3**: Parts + Materials calculation with bottom tear-off Customer Claim Stub (`CS-XXXX`).
   - **Form 2/3**: Parts + Materials + Labor + 12% VAT computation with 30-row estimation matrix and 4 Terms & Conditions clauses.

---

## 📑 3. Form 2/3 Document Structure & Field Mappings

| Section | Field Name | Template Anchor | Description & Data Source |
| :--- | :--- | :--- | :--- |
| **Top Tag** | `form_tag` | Top Right | Displays `Form 2/3` |
| **Header** | `quotation_no` | `QUOTATION NO.` | Auto-generated sequential quotation number (`QTN-XXXX`). |
| **Header** | `date` | `DATE:` | Quotation issuance date (defaults to current date). |
| **Header** | `job_no` | `JOB ORDER NO.:` | Associated Job Order Reference (synced with Form 1/3). |
| **Header** | `promised_date`| `PROMISED DATE:` | Target completion/release commitment date. |
| **Customer** | `name` | `Name:` | Customer full name (synced bidirectionally). |
| **Customer** | `address` | `Address:` | Customer billing/service address. |
| **Customer** | `contact_no` | `Contact No:` | Mobile/Viber telephone number. |
| **Vehicle** | `plate_no` | `Plate No:` | Philippine vehicle license plate (uppercase font-mono). |
| **Vehicle** | `year_model` | `Year/Model:` | Vehicle make, model, and year specification. |
| **Vehicle** | `color` | `Color:` | Vehicle exterior paint finish. |
| **Matrix** | `parts_materials[]` | 30-Row Matrix Table | Description, Qty, FRT, Labor, Parts, Materials, Amount. |
| **Summary** | `total_labor` | `LABOR` | Sum of all line item Labor charges. |
| **Summary** | `vat_12` | `VAT 12%` | Standard Philippine 12% Value Added Tax on subtotal. |
| **Summary** | `total_materials`| `MATERIALS` | Sum of all line item Material charges. |
| **Summary** | `total_parts` | `PARTS` | Sum of all line item Parts charges. |
| **Summary** | `grand_total` | `TOTAL` | Total Labor + Parts + Materials + 12% VAT. |
| **Signatures**| `service_advisor`| `Prepared by:` | Service Advisor name (Roman Sarol / logged-in user). |
| **Signatures**| `general_manager`| `Approved by:` | General Manager / Authorized Officer. |
| **Conforme** | `customer_signature` | `Customer Name & Signature` | Authorization and repair work concurrence. |

---

## ⚙️ 4. Form 2/3 Math & Tax Computation Engine

1. **Row Line Item Arithmetic**:
   $$\text{Row Amount} = \text{Labor} + \text{Parts} + \text{Materials}$$
2. **Subtotal Accumulation**:
   $$\text{Total Labor} = \sum_{i=1}^{30} \text{Labor}_i, \quad \text{Total Parts} = \sum_{i=1}^{30} \text{Parts}_i, \quad \text{Total Materials} = \sum_{i=1}^{30} \text{Materials}_i$$
3. **Net Subtotal**:
   $$\text{Net Subtotal} = \text{Total Labor} + \text{Total Parts} + \text{Total Materials}$$
4. **12% Value-Added Tax (VAT)**:
   $$\text{VAT (12\%)} = \text{Net Subtotal} \times 0.12$$
5. **Grand Quotation Total**:
   $$\text{Grand Total} = \text{Net Subtotal} + \text{VAT (12\%)}$$

---

## 📜 5. Official Terms & Conditions (Verbatim)

1. *This quotation is valid only for 15 days from the date of issuance.*
2. *The details of the estimate provided above are based on our first inspection and do not constitute a guarantee that no further work/parts will be required. The total bill of work will be per the details available on completion of work. Other terms and conditions as applicable.*
3. *Under certain circumstances, Hontech shall not be responsible for any loss or damage to the vehicle including article/s left therein while it is in the premise. Failure to claim your vehicle within the prescribed period shall bear a corresponding storage fee.*
4. *To avail of the warranty given for material, parts, and service, owner supplied is discouraged, otherwise a surcharge of 25% of the price of item/s is automatically applied. The price of the item/s shall be the current price of Hontech Auto Center, Inc.*

---

## 🖨️ 6. Single-Page Print Engine
* `printForm23()` renders the `#form23-document-sheet` inside a hidden, isolated iframe.
* Forces pure A4 portrait geometry with zero browser navigation, dashboard headers, or sidebars bleeding into the physical print dialog.
