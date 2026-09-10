# HonTech AutoCenter — Cash Advance Voucher Studio Specification
**Document ID**: `HT-SPEC-PROTO-009`  
**Revision**: `1.0`  
**Status**: `Approved / In Implementation`  
**Module**: `Form Studio / Cash Advance Voucher (CASH AD ▾)`  

---

## 1. Executive Summary

This specification establishes the digital and physical architecture for the **Cash Advance Voucher Studio (`CASH ADVANCE`)** at HonTech AutoCenter. Replicating the shop's physical voucher ledger template (`media_1789014865631.pdf`), the system enables Service Advisors, Cashiers, and Workshop Managers to disburse, monitor, and reconcile cash advances for vehicle parts, outside machining, shop consumables, and specialized contractor labor.

Integrated as the 5th operational tab in the shop's Google Sheets bottom workbook bar under **`CASH AD ▾`**, this module provides:
1. **Interactive Transaction Ledger Editor**: Multi-row disbursement and reimbursement tracking.
2. **Real-Time Running Balance Engine**: Automatic computation of row totals, cumulative disbursements, and net cash balance on hand.
3. **Auditing & Liquidation Compliance Enforcement**: Embedded reminders enforcing official receipts (OR) or reimbursement expense receipts (RER).
4. **1:1 Authentic Physical Document Canvas**: 30-row ledger sheet with centered branding, clear column subheaders, ruled lines, and formal signatory blocks.
5. **Dedicated Single-Page A4 Print Engine**: Isolated iframe renderer producing clean, physical audit slips without distortion.

---

## 2. Document Data Dictionary

### 2.1 Voucher Meta Headers
| Field Name | Data Type | Default / Sample | Description |
| :--- | :--- | :--- | :--- |
| `ca_no` | String | `HT-CA-2026-001` | Sequential voucher control number |
| `date` | Date | `YYYY-MM-DD` | Date of voucher initialization |
| `linked_job_no`| String | `WLK-2026` | Associated Job Order ID for auditing attribution |
| `cust_name` | String | `Juan Dela Cruz` | Client / Vehicle reference |

### 2.2 Ledger Row Columns
| Column Header | Sub-Column | Description | Math / Formatting |
| :--- | :--- | :--- | :--- |
| `ITEM NO.` | — | Sequential line item number (1 to N) | Integer |
| `CASH ISSUED` | `DATE` | Date disbursement / release occurred | Short Date (`YYYY-MM-DD` or `MM/DD/YY`) |
| `CASH ISSUED` | `BY` | Releasing officer / custodian (e.g. `VIC`, SA, Admin) | Text |
| `AMOUNT` | `REC'D` | Cash advance amount released in this transaction | Currency (`₱#,##0.00`) |
| `AMOUNT` | `CARRIED OVER` | Unspent cash balance brought forward from prior batch | Currency (`₱#,##0.00`) |
| `AMOUNT` | `TOTAL` | $\text{REC'D} + \text{CARRIED OVER}$ | Auto-calculated |
| `EXPENSES INCURRED`| — | Verified disbursements supported by receipts/RER | Currency (`₱#,##0.00`) |
| `BALANCE / CASH ON HAND` | — | Remaining liquid funds ($\text{TOTAL} - \text{EXPENSES INCURRED}$) | Auto-calculated |
| `REMARKS` | — | Description of purpose, vendor, or parts receipt details | Text |

---

## 3. Financial Calculation Formulas

$$\text{Row Total Cash} = \text{Amount Rec'd} + \text{Amount Carried Over}$$

$$\text{Row Balance on Hand} = \text{Row Total Cash} - \text{Expenses Incurred}$$

$$\text{Cumulative Cash Advance Available} = \sum (\text{Rec'd}) + \sum (\text{Carried Over})$$

$$\text{Total Expenses Incurred} = \sum (\text{Expenses Incurred})$$

$$\text{Net Cash Balance on Hand} = \text{Cumulative Cash Advance Available} - \text{Total Expenses Incurred}$$

---

## 4. Auditing & Compliance Directives (Template Page 2)

Per official shop management auditing guidelines:
1. **Receipt Requirement**: *To ensure proper accounting and auditing, always support your expenditures with official receipts or reimbursement expense receipts (RER) and liquidation documents. No proof of transaction is not allowed.*
2. **Job Order Reference**: *Always record your transaction everytime you make purchases/services related to the approved job order.*

---

## 5. UI & Split-Screen Architecture

- **Left Column (`#cashad-editor-pane`)**:
  - Summary metric cards (Total Received, Total Expenses Incurred, Cash Balance on Hand).
  - Dynamic transaction row cards with auto-math.
  - Action buttons: Add Row, Reset, Load Sample, Print A4.
  - Auditing reminder accordion.
- **Right Column (`#cashad-canvas-pane`)**:
  - 1:1 Live Physical Sheet (`#cashad-document-sheet`) rendered in authentic monochrome ledger style.
  - 30-row ledger table preserving exact grid spacing.
  - Bottom audit reminders box and 3 signature lines:
    - *Received By* (Signature over printed name)
    - *Issued By* (Authorized custodian)
    - *Audited / Approved By* (Shop management)
