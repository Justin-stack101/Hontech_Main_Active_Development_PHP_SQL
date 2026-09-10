# HonTech Operations System: Form 3/3 (Billing Statement & Invoice Studio) Specification

## 1. Executive Summary & Purpose
**Form 3/3 (Billing Statement / BILLING NO.)** represents the final accounting, cashier, and vehicle release document in the HonTech AutoCenter core service lifecycle:

$$\text{Form 1/3 (Job Order \& Claim Stub)} \longrightarrow \text{Form 2/3 (Quotation \& BIR 12\% VAT)} \longrightarrow \text{Form 3/3 (Billing Statement \& Invoice)}$$

While Form 1/3 establishes initial customer authorization and Form 2/3 defines the cost estimate, Form 3/3 represents the **official finalized invoice statement** presented to the customer upon completion of work for cashier payment and vehicle gate release.

---

## 2. Physical Form 3/3 Architecture & Visual Blueprint

Based on the official physical client template (`page 1 screenshot`):

### A. Document Header Grid
* **Top Right**:
  * Form Identifier: `Form 3/3` (Right-aligned, bold, 10 pt)
  * Large Title: `BILLING NO. [ ____________ ]` (Font size 16 pt, bold, with solid line for sequential billing ID e.g. `HT-BIL-0001`)
  * 3-Row Bordered Grid:
    * `DATE:` (ISO `YYYY-MM-DD`)
    * `JOB ORDER NO.:` (Linked Job Order identifier e.g. `HT-JO-0001`)
    * `QUOTATION NO.:` (Linked Quotation identifier e.g. `HT-QT-0001`)
* **Top Left**:
  * Official HonTech Logo badge (Red italic `HONTECH` in black container)
  * Motto: `"Building Trust"`
  * Company Name: `Hontech Auto Center`
  * Address: `70 Bayan Bayanan Ave cor Narra St., Marikina Heights, Marikina City`
  * Online & Social: `fb.com/hontechautocenter`
  * Telephone & Viber: `85644550/ 71219124/ 09458757441/ 09525065084- VIBER`

### B. Customer Details Matrix (Boxed)
* Centered Title Bar: `CUSTOMER DETAILS` (Bold uppercase, light gray background)
* 4-Row 2-Column Bordered Field Grid:
  * Left Column:
    * `Name : [ Customer Full Name ]`
    * `Address : [ Billing Address ]`
    * `Contact No: [ Contact Number / Viber ]`
    * `E-Mail Add : [ Customer Email Address ]`
  * Right Column:
    * `Plate No: [ Vehicle Plate Number ]`
    * `Model/Year: [ Vehicle Make, Model & Year ]`
    * `Color: [ Vehicle Body Color ]`
    * `Km Reading: [ Odometer Mileage ]`

### C. Formal Billing Declaration
* Dynamic statement text:
  $$\text{"This is to bill you in the amount of }\mathbf{\text{[ ₱ TOTAL ]}}\text{ with the following details described below:"}$$

### D. 35-Row Parts & Labor Calculation Matrix
* 7-Column Table Header:
  1. `PARTS/MATERIAL` (Description, wide column)
  2. `QTY` (Quantity, centered)
  3. `FRT` (Flat Rate Time in hours, centered)
  4. `LABOR` (Labor cost in PHP, right-aligned)
  5. `PARTS` (Parts cost in PHP, right-aligned)
  6. `MATERALS` (Materials cost in PHP, right-aligned)
  7. `AMOUNT` (Total row line item cost, right-aligned)
* **35 Form Rows**:
  * Supports up to 35 line items matching physical template line spacing.
  * Default empty rows display `0.00` in the `LABOR` and `AMOUNT` columns matching physical template characteristics.

### E. Tax Computation & Totals Block
* Boxed calculation summary:
  * `LABOR`: $\sum \text{Row Labor}$
  * `VAT 12%`: $(\text{Labor} + \text{Parts} + \text{Materials}) \times 0.12$
  * `MATERIALS`: $\sum \text{Row Materials}$
  * `PARTS`: $\sum \text{Row Parts}$
  * `TOTAL`: $\text{Labor} + \text{VAT 12\%} + \text{Materials} + \text{Parts}$

### F. Terms & Signatories
* **Terms & Conditions Box**:
  * *"Failure to claim vehicle within the prescribed period shall bear a corresponding storage fee. Replaced items/parts/materials from the vehicle within 30 days shall be disposed of without prior notice."*
* **Signatory**:
  * `HONTECH MANGEMENT:`
  * Line with Service Advisor Name (`Roman Sarol`)
  * Designation: `Service Advisor`
* **Footer**:
  * Centered text: `Thank you for trusting us!`

---

## 3. Data Flow & Multi-Form Integration
1. **Inheritance from Form 1/3 & Form 2/3**:
   * When opening Form 3/3, customer details and linked Job Order / Quotation identifiers are populated automatically.
2. **1-Click "Copy from Quote"**:
   * Service Advisor can pull all approved line items from Form 2/3 into Form 3/3 without re-typing.
3. **Single-Page Isolated Print**:
   * Isolated iframe printing with `@page { size: portrait; margin: 5mm; }` guarantees clean physical 1-page generation.
