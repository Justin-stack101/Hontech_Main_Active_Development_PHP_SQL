# Prototype Quality Assurance & Testing Playbook
## Form 1/3 Interactive Studio & Live PDF Flow

This playbook outlines the manual and automated validation procedures for the **`prototype_process`** stream.

---

## 🧪 Test Matrix Summary

| Test ID | Test Category | Priority | Expected Result | Pass Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **TC-PROTO-01** | Reactive Keystroke Sync | High | Customer & Vehicle data mirrors instantly to live PDF canvas. | Latency < 16ms, no text truncations. |
| **TC-PROTO-02** | Claim Stub Synchronizer | Critical | Customer Name, Plate, Model, and Claim Stub ID update synchronously on bottom slip. | Text match 100% with top form. |
| **TC-PROTO-03** | Auto-Math Engine | Critical | `Qty × Unit Price = Amount`, live Parts & Materials column totals. | Arithmetic accurate to 2 decimal places. |
| **TC-PROTO-04** | Dynamic Row Repeater | Medium | Adding and removing Parts/Materials rows dynamically recalculates totals. | Zero DOM errors or NaN outputs. |
| **TC-PROTO-05** | `@media print` Fidelity | High | Print preview replicates physical Form 1/3 with bottom tear-off perforation line. | Single page A4/Letter fit. |
| **TC-PROTO-06** | Workshop Bay Handover | High | Job registers into the active table and is visible in Workshop Bay Monitoring. | Vehicle appears in unassigned bay queue. |
| **TC-PROTO-07** | Zero-Regression Safety | Critical | Legacy daily intake and existing status changes operate without issues. | Legacy workflows 100% functional. |

---

## 🔍 Detailed Execution Steps

### 1. TC-PROTO-01: Reactive Keystroke Sync
1. Log in as Service Advisor (`sa@hontech.com`).
2. Navigate to **Prototype Document Studio**.
3. Type `"Juan Dela Cruz"` into Customer Name.
4. Type `"ABC-1234"` into Plate Number.
5. **Validation**: Confirm the text appears in real time on both the main Form 1/3 preview and the bottom Claim Stub.

### 2. TC-PROTO-03 & 04: Math & Row Repeater
1. Click `+ Add Part Item`.
2. Enter Item: `"Brake Pads"`, Qty: `2`, Unit Price: `1200.00`.
3. Click `+ Add Material Item`.
4. Enter Item: `"Brake Cleaner"`, Qty: `1`, Unit Price: `350.00`.
5. **Validation**: Verify Parts Total is `2,400.00`, Materials Total is `350.00`, and Grand Total is `2,750.00`.

### 3. TC-PROTO-06: Bay Monitoring Handover
1. Click `Print & Push to Bay Queue`.
2. Open **Workshop Bays (`#section-bays`)**.
3. **Validation**: Verify that vehicle `"ABC-1234"` is present in the waiting queue and can be moved to an active workshop bay (`BAY-01` to `BAY-10`).
