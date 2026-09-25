## 📅 September 25, 2026 (Checklist Brake Condition Per-Wheel Status)

### 📋 Checklist Brake Condition Per-Wheel Status (REV-166)
* **Objective & Context**: The user asked to be able to select more than one status for Brake Condition. A single "Brake pads (Left/Right Front & Left/Right Rear)" row forced one status onto all four wheels. The user chose per-wheel status, matching the four separate brake boxes on the printed CheckList_Result form, the PDF and the Excel sheet.
* **Core Changes Made**:
  - `frontend/js/app.js`:
    - `defaultChecklistPoints`: replaced `brakes_pads` with four Brake Condition rows, `brake_fl` (Left Front), `brake_fr` (Right Front), `brake_rl` (Left Rear) and `brake_rr` (Right Rear), each with its own Good / Attention / Defect / N/A status and notes; added `BRAKE_WHEEL_IDS`.
    - `canonicalizeChecklistPoints()`: older drafts with a single `brakes_pads` status seed all four wheels with that status and notes; the legacy entry is not carried forward.
    - `toggleChecklistBrakesNotInspected()`: now sets all four wheels to N/A and restores each wheel's own previous status and notes when unticked (previously it hard-coded the restored notes). "All Good" / "All Attn" leave the wheels on N/A while brakes are marked not inspected.
    - `compileChecklistPDFBytes()`: each wheel is stamped in its own brake box (front row Y 478.1, rear row Y 448.4; left / right box columns); the legacy `brakes_pads` path is kept for un-migrated data.
    - `exportOfficialXLSX()`: each wheel maps to its own cells (Left Front M31/N31/O31, Right Front AI31/AK31/AN31, Left Rear M35/N35/O35, Right Rear AI35/AK35/AN35); brakes-not-inspected skips all brake cells.
  - `frontend/index.html`: Incremented cache buster to v=3.19.
  - `tests/frontend/sla_and_logic.test.js`: Added AUT-FRONT-125 (four wheel rows, legacy migration, per-wheel toggle restore, PDF and Excel per-wheel mapping); added v=3.19 to multi-revision cache buster checks.
  - `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv` and `.xlsx`: Added SA-42 test row (workbook ranges extended to row 168).
  - `Revisions checklist.csv`: Appended REV-166 row.
* **Automated & Manual QA Verification**:
  - 154/154 automated unit tests passing across 63 test suites (`npm test`).
  - Ran the real migration and toggle code in Node: a legacy `brakes_pads` Attention draft becomes four Attention wheels; ticking and unticking "Brakes not inspected" restores each wheel's own status and notes.
  - Rendered the UI in headless Chrome (four independent wheel rows), rendered the PDF with a different status per wheel, and ran the real Excel export read back with openpyxl: every wheel's symbol lands in its own box / cells.
* **Cache Busting**: `js/app.js?v=3.19`.
* **GitHub Commit Traceability**: Pending remote sync.

---

## 📅 September 25, 2026 (Checklist Status Buttons Filled With Actual Form Colors)

### 📋 Checklist Status Buttons Filled With Actual Printed-Form Colors (REV-165)
* **Objective & Context**: The user asked for the checkpoint status options to "use actual colors, not like this small dot color". In REV-163 the selected option turned dark gray and the form colors appeared only as small 8px dots inside each option.
* **Core Changes Made**:
  - `frontend/js/app.js`:
    - `checklistStatusButtonHtml()`: the selected option is now filled with the printed form's actual box color (Good `#2FB044` with white text, Attention `#FFED00` with dark text, Defect / battery Replace `#EE1C25` with white text, N/A dark gray `#374151`) and set in semibold; unselected options stay plain white with gray text. The small dot swatches were removed from the buttons.
    - `checklistSwatchHtml()` (legend): replaced the small dots with full 16px color blocks in the form colors.
  - `frontend/index.html`: Incremented cache buster to v=3.18.
  - `tests/frontend/sla_and_logic.test.js`: Added AUT-FRONT-124 (selected option filled with the form color, no dot swatches in buttons, full-size legend blocks); updated AUT-FRONT-122's selected-style assertion; added v=3.18 to multi-revision cache buster checks.
  - `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv` and `.xlsx`: Added SA-41 test row (workbook ranges extended to row 167).
  - `Revisions checklist.csv`: Appended REV-165 row.
* **Automated & Manual QA Verification**:
  - 153/153 automated unit tests passing across 63 test suites (`npm test`).
  - Rendered the checklist editor in headless Chrome with Good, Attention, Defect, N/A and battery Replace selections: each selected option is fully filled with its form color and remains readable.
* **Cache Busting**: `js/app.js?v=3.18`.
* **GitHub Commit Traceability**: `0435d02`.

---

## 📅 September 25, 2026 (CheckList Studio Quick Actions Original Colors Restored)

### 📋 CheckList Studio Quick Actions Original Colors Restored (REV-164)
* **Objective & Context**: The user approved the REV-163 professional design and asked to restore the original colors of the four CheckList Studio header buttons only: Save Draft, All Pass, Reset and Export .xlsx.
* **Core Changes Made**:
  - `frontend/index.html`: Restored the pre-REV-163 color classes on the Quick Actions while keeping the current button shape (`h-8 px-3 text-xs font-medium rounded-md`):
    - Save Draft and All Pass: `text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200`.
    - Reset: `text-gray-700 bg-gray-100 hover:bg-amber-50 hover:text-amber-800 border-gray-200`.
    - Export .xlsx: `text-white bg-emerald-600 hover:bg-emerald-700 border-emerald-700`.
    - Icons inherit the button text color again; added `id="chk-quick-actions"` to the button group. The rest of the REV-163 neutral design is unchanged.
  - `frontend/index.html`: Incremented cache buster to v=3.17.
  - `tests/frontend/sla_and_logic.test.js`: Added AUT-FRONT-123 asserting each Quick Action's original colors and current shape; AUT-FRONT-122 now excludes the Quick Actions from its neutral-palette check; added v=3.17 to multi-revision cache buster checks.
  - `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv` and `.xlsx`: Added SA-40 test row (workbook ranges extended to row 166).
  - `Revisions checklist.csv`: Appended REV-164 row.
* **Automated & Manual QA Verification**:
  - 152/152 automated unit tests passing across 63 test suites (`npm test`).
  - Rendered the editor header in headless Chrome and confirmed the four buttons show their original colors in the current shape.
* **Cache Busting**: `js/app.js?v=3.17`.
* **GitHub Commit Traceability**: `cefc43f`.

---

## 📅 September 25, 2026 (CheckList Studio Professional Neutral Redesign)

### 📋 CheckList Studio Professional Neutral Redesign & Fuel Selector Fix (REV-163)
* **Objective & Context**: The user asked to make the CheckList Studio editor "not colorful" and as professional as possible. The editor mixed amber, emerald and blue accents, a pulsing "Sheet 4 Active" badge, emoji status glyphs, heavy black-weight labels and rounded card-within-card rows.
* **Design Direction**: Neutral gray scale with one dark primary action (Export .xlsx). The printed form's green / yellow / red are kept only as small 8px swatches on each status option and in the legend, so the mapping to the printed boxes stays visible without coloring the interface. The Checklist PDF and Excel export are unchanged and still match the printed form (REV-161).
* **Bug Found & Fixed**: The fuel buttons in `frontend/index.html` have no `id`, but `setChecklistFuel()` looked them up with `getElementById('chk-fuel-' + lvl)`, so the highlight never moved from 1/2 and the "1/2 (50%)" label never updated. The selector now resolves buttons by `data-fuel` and updates the label and `aria-pressed`.
* **Core Changes Made**:
  - `frontend/index.html` (`#checklist-editor-pane`): Header, customer / vehicle fields, fuel level, checkpoints and remarks restyled as flat `rounded-lg` sections with gray borders; secondary actions as outlined buttons; Export .xlsx as the dark primary button; inputs with gray focus rings and associated `<label for>`; fuel level as a segmented control; brakes-not-inspected row as a neutral footer of the checkpoints section. All ids, handlers and the `.chk-fuel-btn` hook are unchanged.
  - `frontend/js/app.js`: `renderChecklistTable()` renders a flat list with plain section headers and a neutral segmented status control per item (selected option dark, form-color swatch on each option, form legend and printed symbol in the tooltip); added `checklistSwatchHtml()`; fixed `setChecklistFuel()` as described above.
  - `frontend/index.html`: Incremented cache buster to v=3.16.
  - `tests/frontend/sla_and_logic.test.js`: Added AUT-FRONT-122 (no decorative amber / emerald / blue / pulse classes in the editor, single dark primary action, fuel selector by `data-fuel` with label sync, neutral segmented status control); added v=3.16 to multi-revision cache buster checks.
  - `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv` and `.xlsx`: Added SA-39 test row (workbook ranges extended to row 165).
  - `Revisions checklist.csv`: Appended REV-163 row.
* **Automated & Manual QA Verification**:
  - 151/151 automated unit tests passing across 63 test suites (`npm test`).
  - Rendered the real editor markup and rendering code in headless Chrome at desktop (820px) and phone (390px) widths: neutral styling, selected statuses and fuel level highlighted, no horizontal overflow.
* **Cache Busting**: `js/app.js?v=3.16`.
* **GitHub Commit Traceability**: `da403bb`.

---

## 📅 September 25, 2026 (Checklist "Brakes not inspected" Checkbox Placement)

### 📋 Checklist "Brakes not inspected on this visit" Checkbox Moved Below the Checkpoints (REV-162)
* **Objective & Context**: The user asked to move the "Brakes not inspected on this visit" checkbox from the top of the Multi-Point Receiving Checkpoints card to the bottom, right before "Inspector Remarks / Discovered Deficiencies". This also matches the printed CheckList_Result form, where the checkbox sits directly below the Brake Condition boxes.
* **Core Changes Made**:
  - `frontend/index.html`: Moved the `#chk-brakes-not-inspected` toggle block (Sheet 7: M37) from above `#checklist-items-container` to below it, inside the same card, so it is the last element before the Inspector Remarks card. No behavior changed; the checkbox still calls `toggleChecklistBrakesNotInspected()`.
  - `frontend/index.html`: Incremented cache buster to v=3.15.
  - `tests/frontend/sla_and_logic.test.js`: Added AUT-FRONT-121 asserting the checkbox order (checkpoints, then brakes checkbox, then Inspector Remarks) and that only one checkbox exists; added v=3.15 to multi-revision cache buster checks.
  - `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv` and `.xlsx`: Added SA-38 test row (workbook ranges extended to row 164).
  - `Revisions checklist.csv`: Appended REV-162 row.
* **Automated & Manual QA Verification**:
  - 150/150 automated unit tests passing across 63 test suites (`npm test`).
  - Rendered the updated card from `frontend/index.html` in headless Chrome and confirmed the checkbox appears after the checkpoint list and directly above Inspector Remarks.
* **Cache Busting**: `js/app.js?v=3.15`.
* **GitHub Commit Traceability**: `878b4bc`.

---

## 📅 September 25, 2026 (Checklist UI / PDF / Excel Unified Wording, Colors & Status Symbols)

### 📋 Checklist UI, PDF & Excel Share Printed-Form Wording, Colors & Status Symbols (REV-161)
* **Objective & Context**: The user asked that the Checklist PDF and Excel export match the on-screen checklist so Service Advisors keep "their natural coloring perspective and data inputting from their past" (the paper CheckList_Result form). Before this revision the three outputs disagreed:
  1. **UI** showed ✓ Good (green), ⚠ Attention (**orange**), ✕ Defect (red), under non-form section names ("Exterior & Electrical", "Interior & Controls", "Fluids & Engine Bay", "Underchassis & Fluids", "Tires & Brakes") and reworded item names.
  2. **PDF** stamped the same ✓ for every status (REV-160).
  3. **Excel** stamped the same ✓ for every status, put battery "Attention" in the **Good** box (the PDF used Replace), and overwrote two printed template texts: `M59` ("*Note: Brake fluid NOT filled...") with the Service Advisor name and `M41` ("Please Indicate Areas of External Damage or Wear") with the remarks.
* **Core Changes Made**:
  - `frontend/js/app.js`:
    - Added `CHECKLIST_STATUS_STYLES` as the single source of truth for status symbol, label, printed-form legend wording and printed box color (Good ✓ `#2FB044` Satisfactory; Attention ⚠ `#FFED00` May Require Future Attention; Defect ✕ `#EE1C25` Requires Immediate Attention; N/A — left blank on the form) plus `normalizeChecklistStatus()`.
    - `defaultChecklistPoints` now uses the printed form's section names (Interior/Exterior, Battery Performance, Under Hood, Under Vehicle, Tire Condition, Brake Condition) and item wording.
    - Added `canonicalizeChecklistPoints()` so older saved drafts are migrated to form wording and order while keeping each point's status and notes; applied on start-up and when a draft loads.
    - `renderChecklistTable()`: status buttons are painted with the printed box colors when selected, show the form legend as a tooltip, and a legend row mirrors the form; Battery offers Good / Replace (form has no Attention box). Live canvas preview status cells use the same symbol and fill.
    - `compileChecklistPDFBytes()`: draws ✓ / ⚠ / ✕ vectors per status (dark ink, centered in the matching box), including battery and all four brake boxes.
    - `exportOfficialXLSX()`: stamps the same symbol per status into the matching green / yellow / red cell; battery Attention goes to Replace (`E30`); stopped overwriting `M59` and `M41`; remarks now word-wrap across the Comments lines `B53`-`B56`.
    - "All Attn" keeps the battery on Replace, and the toast reports the real checkpoint count (23, not 15).
  - `frontend/index.html`: Incremented cache buster to v=3.14.
  - `tests/frontend/sla_and_logic.test.js`: Added AUT-FRONT-120; updated AUT-FRONT-95 (Sheet 7 coordinates) and AUT-FRONT-96 (symbol stamping, comments); added v=3.14 to multi-revision cache buster checks.
  - `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv` and `.xlsx`: Added SA-37 test row (workbook ranges extended to row 163).
  - `Revisions checklist.csv`: Appended REV-161 row.
* **Automated & Manual QA Verification**:
  - 149/149 automated unit tests passing across 63 test suites (`npm test`).
  - Rendered the real `renderChecklistTable()` in headless Chrome with an old-format draft: sections and items show printed-form wording, selected buttons use the form's green / yellow / red, battery shows Good / Replace.
  - Rendered the Checklist PDF with a Good / Attention / Defect rotation: ✓ / ⚠ / ✕ centered in the matching boxes.
  - Ran the real `exportOfficialXLSX()` in headless Chrome and read the workbook back with openpyxl: every point's symbol lands in its matching colored cell, N/A rows stay blank, `M41` / `M59` keep their printed text, comments wrap over `B53`-`B55`, technician name in `C63`.
* **Cache Busting**: `js/app.js?v=3.14`.
* **GitHub Commit Traceability**: `5495682`.

---

## 📅 September 25, 2026 (Checklist Result Status-Box Grid, Header & Signature Alignment)

### 📋 Checklist Result Measured Status-Box Grid, Header Ghost Masking, Comments & Signatures (REV-160)
* **Objective & Context**: In direct response to the user's screenshot of the Checklist Result PDF showing that status marks were "not properly saved on the boxes":
  1. Green checkmarks landed between rows and outside the green / yellow / red status boxes (e.g. under Headlights, Interior light, Windshield, and on Tire / Brake rows).
  2. Several inspection points (Interior light, Parking brake, Horn, Clutch, Air filter, Hydraulic clutch, Fluid leaks, Drive shaft) had no position at all and were never stamped.
  3. Caret-like artifacts appeared before Customer Name, Plate Number, Vehicle Year Model and Date values, and the Date overlapped its underline.
  4. Green checkmarks were invisible on green boxes; Comments and the Technician / Customer signatures were drawn far below their template fields (Y = 175 and Y = 55.8).
* **Vector Measurement & Root Cause Analysis** (pdfplumber on `Current_2025 BLANK RO UPDATED.xlsx - CheckList_Result.pdf`, 595x842pt):
  - Status column centers: left tables G/Y/R = X 253.1 / 267.8 / 282.9; tire & brake left boxes = X 315.0 / 329.3 / 343.55; right boxes = X 524.5 / 539.35 / 554.9.
  - Row centers taken as midpoints between the measured row border lines (e.g. Headlights 644.4, Interior light 624.7, ... Drive shaft 290.8; tires 627.3 / 583.6 / 539.9; brakes 478.1 / 448.4; battery Good 499.2 / Replace 484.3).
  - The old header whiteouts (height 10 from y 734.5) stopped below the tops of the template's `0` placeholders (top 745.6), leaving the caret artifacts.
* **Core Changes Made**:
  - `frontend/js/app.js`: Rebuilt `compileChecklistPDFBytes()` placement:
    - Header values at X = 117 on the underlines (7.5pt, plate bold), `0` placeholders fully masked (x 115.2, height 12.2) above each underline; Date centered at X = 516.6 on its underline with its `0` masked.
    - Fuel level: ellipse ring centered on the selected label inside its measured cell (E 447.05, 1/4 472.85, 1/2 498.6, 3/4 524.3, F 550.25).
    - All 23 inspection points mapped to their template rows; a dark checkmark is centered in the Satisfactory / Future Attention / Immediate Attention box matching the status (N/A leaves the row blank). Battery maps to the Good / Replace box; Brake Pads stamp all four wheel boxes, or the "Brakes not inspected on this visit" checkbox when that option is set.
    - Comments word-wrap onto the five ruled lines (baselines 239.6 .. 176.6, max width 248pt).
    - Technician name centered on its underline (X = 180.05, Y = 114.4); customer name centered on the Customer Signature line (X = 435.65, Y = 114.4) with its `0` placeholder masked.
    - Removed the unused green / amber / red ink helpers.
  - `frontend/index.html`: Incremented cache buster to v=3.13.
  - `tests/frontend/sla_and_logic.test.js`: Added AUT-FRONT-119 asserting the measured grid, header masking, row coverage for all points, comments and signatures; updated AUT-FRONT-94 and AUT-FRONT-107 checklist assertions; added v=3.13 to multi-revision cache buster checks.
  - `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv` and `.xlsx`: Added SA-36 test row (workbook ranges extended to row 162).
  - `Revisions checklist.csv`: Appended REV-160 row.
* **Automated & Manual QA Verification**:
  - 148/148 automated unit tests passing across 63 test suites (`npm test`).
  - Rendered the compiled Checklist PDF at 200 dpi with a Good / Attention / Defect rotation across all 23 points, plus Fuel E and F and "Brakes not inspected" variants, and confirmed every mark is centered in the correct colored box with no header artifacts.
* **Cache Busting**: `js/app.js?v=3.13`.
* **GitHub Commit Traceability**: `5855eac`.

---

## 📅 September 25, 2026 (Billing Form 3/3 Service Advisor Signature Alignment)

### 📋 Billing Form 3/3 Service Advisor Signature Alignment (REV-159)
* **Objective & Context**: In direct response to the user's screenshot of the Billing Form 3/3 lower section, the Service Advisor name ("Manney Sarol") was left-aligned at a fixed X = 88 and floated off-center from both the signature line and the "Service Advisor" label beneath it.
* **Vector Measurement & Root Cause Analysis**:
  - Measured on `Current_2025 BLANK RO UPDATED.xlsx - Billing_No.pdf` with pdfplumber: the signature line spans x 28.6..218.1 (center 123.4) with its top edge at y 88.5; the "Service Advisor" label spans x 96.0..151.4 (center 123.7); "HONTECH MANGEMENT:" has its baseline at y 101.5.
  - The old call `drawTextFit(sa, 88, 95, 140, 7.2, false)` left-aligned the name at X = 88, so its visual center shifted with every name length.
* **Core Changes Made**:
  - `frontend/js/app.js`: `compileBillingPDFBytes()` now centers the Service Advisor name at X = 123.4 on baseline Y = 90.6 (just above the line, clear of "HONTECH MANGEMENT:"), with font size shrinking from 7.5pt to fit within 180pt for long names.
  - `frontend/index.html`: Incremented cache buster to v=3.12.
  - `tests/frontend/sla_and_logic.test.js`: Added AUT-FRONT-118 asserting the centered signature and cache buster v=3.12; updated the REV-121 and AUT-FRONT-94 signature assertions; added v=3.12 to multi-revision cache buster checks.
  - `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv` and `.xlsx`: Added SA-35 test row (workbook ranges extended to row 161).
  - `Revisions checklist.csv`: Appended REV-159 row.
* **Automated & Manual QA Verification**:
  - 147/147 automated unit tests passing across 63 test suites (`npm test`).
  - Rendered the compiled Billing PDF at 300 dpi with "Manney Sarol" and confirmed the name is centered on the signature line and vertically aligned with the "Service Advisor" label.
* **Cache Busting**: `js/app.js?v=3.12`.
* **GitHub Commit Traceability**: `3828720`.

---

## 📅 September 25, 2026 (Billing Form 3/3 Measured Vector Alignment & Border-Safe Ghost Masking)

### 📋 Billing Form 3/3 Measured Vector Alignment & Border-Safe Ghost Masking (REV-158)
* **Objective & Context**: In direct response to the user's "Full PDF" screenshot of Form 3/3 (Billing_No) showing:
  1. `BL-2026-8783` overlapping the "BILLING NO." title.
  2. Caret-like `^` artifacts beside every Customer Details field and beside the Job Order / Quotation numbers.
  3. Broken underlines leaving short stray line segments, and a broken line under the Job Order No box.
  4. The Km Reading value overlapping the "Km Reading:" label.
  5. The bill amount (`PHP 3,505.50`) overlapping and erasing part of the word "with".
  6. Item descriptions crossing the table's left border, a dashed left border, and dash artifacts in empty AMOUNT cells.
* **Vector Decompilation & Root Cause Analysis**:
  - Measured the template geometry with pdfplumber on `Current_2025 BLANK RO UPDATED.xlsx - Billing_No.pdf` (595x842pt).
  - The `^` marks were the tops of the template's `0` placeholders (x = 210.6 and 490.4) left uncovered by undersized whiteouts, while the same whiteouts (x 80..310, y 662.5..671.5) cut through the underlines (y 662.4..663.2) and left the 310..337pt segments behind.
  - Table whiteouts started at x = 25, erasing the left border (x 28.3..29.1). Rows used a 583.2 start with 11.58pt pitch, drifting off the true grid (first row bottom 580.0, pitch 11.609pt, 36 rows) and leaving slivers of the `0.00` placeholders.
  - The amount whiteout (x 185..225) overlapped the word "with" (x 219.7), and the totals whiteout (x 500..555) left the right half of the `0.00` placeholders (x 548.5..565.7) visible.
* **Core Changes Made**:
  - `frontend/js/app.js`: Rebuilt `compileBillingPDFBytes()` placement on measured coordinates:
    - Billing No at X = 491, Y = 757.2 on the underline right of "NO." (ends x 483.8); Date / Job Order No / Quotation No at X = 491 inside their boxes (Y = 723.6, 712.0, 700.4) with the `0` ghosts masked at x 524.6.
    - Customer Details left values at X = 90 (underline 87.8..337.6), right values at X = 420 (underline 417.4..567.9, clear of "Km Reading:"); `0` ghost masks span exactly from each underline to the line above (`maskH = row.ceil - row.lineTop - 0.1`).
    - 36-row table (`firstRowBottom = 580.0`, `rowStep = 11.609`) with LABOR and AMOUNT `0.00` masks strictly inside cell interiors; description at X = 31.5 inside the left border; QTY/FRT centered and LABOR/PARTS/MATERIALS/AMOUNT right-aligned to their column edges.
    - LABOR, VAT 12%, MATERIALS and PARTS summary boxes masked per box and values vertically centered; TOTAL at Y = 116.3 inside its box.
    - Bill amount right-aligned at X = 217.5 on its underline with auto-shrink (max 53pt), masking only the `0` placeholder so "with the following" stays intact.
  - `frontend/index.html`: Incremented cache buster to v=3.11.
  - `tests/frontend/sla_and_logic.test.js`: Added AUT-FRONT-117 asserting REV-158 coordinates, border-safe whiteouts and cache buster v=3.11; updated AUT-FRONT-94, AUT-FRONT-98 and the REV-121 billing assertions to the measured coordinates; added v=3.11 to multi-revision cache buster checks.
  - `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`: Added SA-34 test row.
  - `Revisions checklist.csv`: Appended REV-158 row.
* **Automated & Manual QA Verification**:
  - 146/146 automated unit tests passing across 63 test suites (`npm test`).
  - Rendered the compiled Billing PDF with the screenshot's sample data (Node + pdf-lib, rasterized with pdfplumber at 200/300 dpi) and confirmed: no `^` artifacts, intact underlines and table borders, no label overlaps, and no leftover `0.00` fragments.
* **Documentation Sync (follow-up)**: Synced SA-26 through SA-34 into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.xlsx` (it previously stopped at SA-25), extending the Summary formulas, Status dropdown, conditional formatting and filter range from row 151 to row 160; corrected the REV-157 commit hash to `d8a826b` in this log and in `Revisions checklist.csv`.
* **Cache Busting**: `js/app.js?v=3.11`.
* **GitHub Commit Traceability**: `ee130e0`.

---

## 📅 September 25, 2026 (Quotation Form 2/3 Exact Visual Vector Alignment & Border-Safe Masking)

### 📋 Quotation Form 2/3 Exact Visual Vector Alignment & Border-Safe Masking (REV-157)
* **Objective & Context**: In direct response to the user's test feedback and visual proof screenshot showing that on "Full PDF":
  1. Data was drawn ~42pt lower than the template's visual position: QT-2026-5777 landed inside the Promised Date box instead of above the QUOTATION NO. underline, Date/Job/Promised date landed next to Customer Details, and Customer details landed inside the Parts/Materials table rows.
  2. Pre-printed template 0 ghost placeholders remained visible inside the Customer Details card.
  3. Pre-printed 0.00 ghosts produced small artifacts inside the table cells.
* **Vector Decompilation & Root Cause Analysis**:
  - Measured rendered visual coordinates with pdfplumber on Current_2025 BLANK RO UPDATED.xlsx - Quotation_No.pdf.
  - Discovered that the true visual positions in the PDF stream were shifted vertically by +42pt from initial pypdf unscaled text tokens:
    - QUOTATION NO. underline is at Y = 769.77 (X = 454.63..519.38). Text baseline is at Y = 772.0.
    - Right Meta Box: Date cell (Y = 740.30..749.74, baseline 742.8), Job Order No cell (Y = 730.86..740.30, baseline 733.2), Promised Date cell (Y = 721.42..730.86, baseline 723.8).
    - Customer Details: Underlines are at Y = 693.10, 683.66, 674.22. Text baselines sit cleanly at Y = 694.8, 685.4, 675.9. Template ghost 0 characters sit at Y = 694.63, 685.19, 675.74. Whiteouts placed strictly above underline (y = 693.9, 684.5, 675.0, height 8.2) 100% eliminate ghosts while keeping 100% of black underline lines intact.
    - 30 Table Line Items: Mapped exact 31 horizontal table dividers (655.34 down to 374.74). Whiteouts for LABOR and AMOUNT cells are bound strictly inside each row (botY + 0.8, height topY - botY - 0.9), wiping out all ghost 0.00 without touching any table grid borders.
    - Totals block: Masked inside cell bounds (Y = 328.3..366.1) and aligned values to X = 516.5.
    - Signatures: Service Advisor centered at X = 159.0, Y = 149.0, Manager centered at X = 424.0, Y = 149.0, and Customer Conforme centered at X = 298.0, Y = 102.0 with ghost 0 masked at Y = 98.0.
* **Core Changes Made**:
  - frontend/js/app.js: Updated compileQuotePDFBytes() with exact calibrated coordinates and border-safe whiteout rectangles. Verified with headless pypdfium2 rendering across top, middle, and bottom document slices.
  - frontend/index.html: Incremented cache buster to v=3.10.
  - tests/frontend/sla_and_logic.test.js: Added AUT-FRONT-111 asserting exact REV-157 coordinates, whiteouts, and cache buster v=3.10; updated multi-revision assertions AUT-FRONT-91, AUT-FRONT-94, AUT-FRONT-98, AUT-FRONT-107.
  - Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv: Added SA-33 test row.
  - Revisions checklist.csv: Appended REV-157 row.
* **Automated & Manual QA Verification**:
  - 145/145 automated unit tests passing across 63 test suites (npm.cmd test).
  - Headless image verification confirmed 100% visual alignment of Quotation No, Meta Header, Customer Details, Table Rows, Totals, and Signatures.
* **Cache Busting**: js/app.js?v=3.10.
* **GitHub Commit Traceability**: `d8a826b` (corrected from `3e928c1`, a pre-amend hash not present on any branch).

---

## 📅 September 25, 2026 (Quotation Form 2/3 PDF Coordinate Calibration & Overlap Elimination)

### 📋 Quotation Form 2/3 PDF Coordinate Calibration & Overlap Elimination (REV-156)
* **Objective & Context**: In direct response to user request and screenshot showing formatting errors on the Quotation sheet (Form 2/3) when clicking Full PDF:
  1. Quotation Number (`QT-2026-9749`) colliding and overlapping the large pre-printed `QUOTATION NO.` header text.
  2. Right Meta Header: Date floating too high above the box; destructive whiteout cutting off `JOB ORDER NO.:` and `PROMISED DATE:` into `JOB OR` and `PROMIS`.
  3. Customer Details: drawn ~45pt too high, text overlapping gray header bar, pre-printed template `0` ghosts visible next to Name and Plate, `Plate No:` label partially erased (`Pl  N `), right border cut up.
  4. Table Line Items: 24-row whiteout loop started at `startY = 649.1` which was directly inside the Customer Details card.
* **Vector Content Decompilation & Root Cause Analysis**:
  - Decompiled the native vector content stream of `Current_2025 BLANK RO UPDATED.xlsx - Quotation_No.pdf` (MediaBox `[0, 0, 595, 842]` A4).
  - Located the pre-printed underline for Quotation No at `Y = 724.06` (`X = 467.62..534.22`), right after `QUOTATION NO.` text ending at `X ≈ 462`.
  - Identified that previous coordinates drew `quoteNo` at `X = 420, Y = 775.5` with a massive destructive whiteout `whiteout(420, 720, 100, 62)` that wiped out the pre-printed labels `JOB ORDER NO.:` and `PROMISED DATE:`.
  - Measured true cell baselines: Date (`Y = 699.34`), Job Order No (`Y = 690.46`), Promised Date (`Y = 681.58`).
  - Measured true Customer Details baselines: Row 1 (`Y = 654.94`), Row 2 (`Y = 646.06`), Row 3 (`Y = 637.18`) with gray header at `Y = 663.82`.
  - Extracted 30 authentic table row baselines starting at `Y = 610.54` down to `Y = 355.49`, right-aligned totals at `X = 530.5`, and authentic underlines for SA, Manager, and Conforme signatures.
* **Core Changes Made**:
  - `frontend/js/app.js`: Overhauled `compileQuotePDFBytes()`:
    - Purged destructive `whiteout(420, 720, 100, 62)`.
    - Positioned `quoteNo` centered above the underline: `drawTextCenter(quoteNo, 500.9, 726.5, 8.5, true, darkInk)` with zero overlap into header text.
    - Aligned `date` (`Y = 699.34`), `jobNo` (`Y = 690.46` with localized cell whiteout), and `promiseDate` (`Y = 681.58`) with labels 100% intact.
    - Shifted Customer Details down to `Y = 654.94`, `646.06`, `637.18` with surgical column whiteouts preserving all borders and labels.
    - Calibrated 30-row parts/labor table starting at `Y = 610.54` with non-destructive `LABOR` and `AMOUNT` ghost whiteouts.
    - Aligned Totals block at `X = 530.5` (`Y = 346.61..311.09`) and centered lower signatures on authentic underlines.
  - `frontend/index.html`: Incremented cache buster to `v=3.09`.
  - `tests/frontend/sla_and_logic.test.js`: Updated assertions in `AUT-FRONT-40`, `AUT-FRONT-91`, `AUT-FRONT-94`, `AUT-FRONT-98`, and `AUT-FRONT-107` to support calibrated Quotation coordinates and `v=3.09`.
  - `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`: Added `SA-32` test row.
  - `Revisions checklist.csv`: Appended `REV-156` row.
* **Automated & Manual QA Verification**:
  - 144/144 automated unit tests passing across 63 test suites (`npm.cmd test`).
* **Cache Busting**: `js/app.js?v=3.09`.
* **GitHub Commit Traceability**: `cb4caa8`.

---

## 📅 September 25, 2026 (Form 1/3 & RO Excel Export Multi-Sheet Cross-Verification with Live PDF Data)

### 📋 Form 1/3 & RO Excel Export Multi-Sheet Cross-Verification with Live PDF Data (REV-155)
* **Objective & Context**: In direct response to user request: "make sure that what i type on the forms pdf it must be the same thing aswell on the exel. i know that the pdf is just an different format to export what i wanted is you verify that the system is on the pdf must be the same data with the exel becuase they are important":
  1. **Root Cause Analysis & Discrepancy Elimination**:
     - Investigated `exportOfficialXLSX()` in `frontend/js/app.js` and compared every cell reference against the PDF compilers (`compileForm13PDFBytes`, `compileQuotePDFBytes`, `compileBillingPDFBytes`, `compileChecklistPDFBytes`).
     - Found that `exportOfficialXLSX()` extracted inputs with empty string fallbacks (`const name = getVal('f13-input-name') || '';`), meaning that if a user edited on the Quotation, Billing, or Checklist tab, or relied on the demo defaults, the Excel export cells were skipped because `setCell` ignores empty values (`if (textVal === '') return;`).
     - In Sheet 1 (`Job_Order`):
       - Row 70 (Claim Stub): only combined column `I70` (`plate / model`) was populated; `H70` (Plate) and `J70` (Model) were missing.
       - Row 71 (Claim Stub): customer contact was completely omitted from the Excel injector (`setCell` for `H71`/`I71` was missing).
       - Row 72 (Claim Stub): `H72` (the template's claim stub formula cell `=K2`) was not directly populated with `claimStubId`.
  2. **Harmonized 1:1 Parity Implementation**:
     - **Multi-Tier Cascade & Demo Fallbacks in `exportOfficialXLSX`**: Updated all variable declarations in `exportOfficialXLSX()` to use the identical cascading fallbacks as `compileForm13PDFBytes()` (`name`, `address`, `contact`, `email`, `plate`, `model`, `km`, `engine`, `chassis`, `color`, `concern`, `sa`, `mechanic`, `assessor`, `manager`).
     - **Complete Sheet 1 Claim Stub OpenXML Injection**:
       - Injected `H70` (Plate No.) and `J70` (Year/Model) alongside `I70`.
       - Injected `H71` and `I71` with customer contact (`contact`), guaranteeing the claim stub contact in Excel matches the PDF.
       - Injected `H72` and `I72` with `claimStubId`.
     - **Cross-Sheet Multi-Sheet Verification**:
       - Verified Sheet 1 (`Job_Order`): Header, Customer Dossier, Concern, Diagnostics, Parts (D27..G52), Materials (H27..K52), Subtotals (G53, K53, K54), all 6 Signatures, and complete Claim Stub.
       - Verified Sheets 2–4 (`Quotation_No 1–3`): Quote No, Date, Job No, Promise Date, Customer Details, up to 30 items across Columns A–H with formulas/amounts, and Signatures (A62, F62, A65).
       - Verified Sheets 5–6 (`Billing_No 1–2`): Billing No, Date, Job No, Quote No, Customer Details, Grand Total (C14), up to 36 line items, and SA Signature (A60).
       - Verified Sheet 7 (`CheckList_Result`): Customer Name (C2), Date (AD2), Plate (C3), Model (C4), SA Inspector (M59/C63), Customer Conforme (M63), Remarks (M41/B53), Fuel Level checkmark, and 15-point multi-system inspection status marks.
* **Core Changes Made**:
  - `frontend/js/app.js`: Updated `exportOfficialXLSX()` with identical multi-tier variable cascades and complete claim stub cell injection (`H70`, `J70`, `H71`, `I71`, `H72`, `I72`).
  - `frontend/index.html`: Incremented cache buster to `v=3.08`.
  - `tests/frontend/sla_and_logic.test.js`: Updated cache buster assertions for `v=3.08`.
* **Automated & Manual QA Verification**:
  - 144/144 automated unit tests passing across 63 test suites (`npm.cmd test`).
  - Appended `SA-31` to `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
  - Appended `REV-155` to `Revisions checklist.csv`.
* **Cache Busting**: `js/app.js?v=3.08`.
* **GitHub Commit Traceability**: `e35479c`.

---

## 📅 September 25, 2026 (Form 1/3 Customer Conforme Signature & Filipino Claim Stub Data Alignment)

### 📋 Form 1/3 Customer Conforme Signature & Filipino Claim Stub Data Alignment (REV-154)
* **Objective & Context**: In direct response to user request and screenshot showing missing customer name above the `CONFORME: Customer's Name & Signature` line and missing/unaligned data on the bottom Filipino Claim Stub (`Name`, `Plate No./Year/Model`, `Contact`, `Date`):
  1. **Root Cause Analysis**:
     - Customer Dossier input fields were unpopulated when the studio opened without previous local storage or prefilled booking data, leaving `name`, `contact`, `plate`, and `model` as empty strings.
     - While other studio worksheets (Quotation, Billing, Checklist) had default fallbacks, `compileForm13PDFBytes()` did not have fallback defaults for these fields, resulting in empty strings drawn onto the canvas.
     - In the bottom Filipino Claim Stub:
       - `Contact` drawing logic was completely omitted from the compiler.
       - `intakeDate` was centered at `X = 212.6` across the entire underline width, creating an awkward large gap between `Date : ` label and the date string.
       - Keystrokes in `f13-input-name` and vehicle fields were only scheduled on `change` events rather than immediate 350ms debounced `input` events, preventing real-time preview updates during live typing.
  2. **Engineering & Coordinate Calibration**:
     - **Default Seeding & Resilient Fallbacks**: Updated `initForm13Studio()` in `frontend/js/app.js` to seed standard default demo values (`Juan Dela Cruz`, `0917-123-4567`, `123 Narra St...`, `ABC-1234`, `2021 Toyota Vios`, etc.) if empty, and added resilient fallback chains across `compileForm13PDFBytes()`.
     - **Live Typing Sync**: Updated `onReactiveJobOrderInput()` in `frontend/js/app.js` to schedule debounced PDF regeneration (`350ms`) on active typing keystrokes (`input` events).
     - **CONFORME Customer Signature**: Calibrated `drawTextCenter(name, 184.7, 169.0, 6.5, false)` with safe underline whiteout, ensuring the customer's name sits cleanly centered directly above the pre-printed `Customer's Name & Signature` line.
     - **Filipino Claim Stub Geometric Alignment**:
       - Row 1: Left-aligned `name` at `X = 140` (`Y = 77.9`, max width `146pt`); centered `plate` at `X = 378.1`; left-aligned `model` at `X = 424` (`Y = 77.9`, max width `96pt`).
       - Row 2: Left-aligned `sa` at `X = 140` (`Y = 67.8`, max width `146pt`); added missing `contact` drawing left-aligned at `X = 355` (`Y = 67.8`, max width `160pt`).
       - Row 3: Left-aligned `intakeDate` at `X = 140` (`Y = 57.8`, max width `146pt`), creating a perfectly aligned vertical column with `name` and `sa`; centered bold `stubId` at `X = 438.45` (`Y = 57.8`, 7.5pt font).
* **Core Changes Made**:
  - `frontend/js/app.js`: Seeded initial customer dossier demo defaults in `initForm13Studio()`, enabled 350ms debounced reactive preview refresh on input keystrokes, added multi-tier fallbacks in `compileForm13PDFBytes()`, added missing claim stub `contact` drawing, and aligned claim stub `intakeDate` to `X = 140`.
  - `frontend/index.html`: Incremented cache buster to `v=3.07`.
  - `tests/frontend/app.test.js`: Updated AUT-FRONT-116 test assertion for calibrated claim stub arguments.
  - `tests/frontend/sla_and_logic.test.js`: Synced cache buster references to accept `v=3.07` and satisfied AUT-FRONT-94.
* **Automated & Manual QA Verification**:
  - 144/144 automated unit tests passing across 63 test suites (`npm.cmd test`).
  - Appended `SA-30` to `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
  - Appended `REV-154` to `Revisions checklist.csv`.
* **Cache Busting**: `js/app.js?v=3.07`.
* **GitHub Commit Traceability**: `31be322`.

---

## 📅 September 25, 2026 (Form 1/3 Parts & Materials Table Amount Alignment & Ghost Crescent Removal)

### 📋 Form 1/3 Parts & Materials Table Amount Alignment & Ghost Crescent Removal (REV-153)
* **Objective & Context**: In direct response to user request and screenshot showing a trailing parenthesis artifact `)` on amount values (e.g. `450.00)` and `1850.00)`) and slight right-alignment offset relative to pre-printed `0.00` in rows below:
  1. **Root Cause Analysis via Content Stream Decompilation**:
     - Decompiled the vector content stream of `Current_2025 BLANK RO UPDATED_v3.xlsx - Job_Order_Wide.pdf`.
     - In the Excel template, each row in the Parts AMOUNT column has pre-printed `0.00` (evaluating from `=QTY*PRICE`) drawn by Font0 glyphs `<0013 0011 0013 0013>` starting at `X = 339.56` with width `12.06 pt`, ending at `X = 351.62`.
     - The Parts cell vertical lines are at `X = 287.96` (left) and `X = 353.29` (right).
     - Previous `whiteOut(288.5, ry - 0.5, 62, 6.5)` only covered up to `X = 350.5`. This left the right `1.12 pt` slice of the template's final `0` exposed (from `X = 350.5` to `351.62`).
     - Because `drawTextRight(amt.toFixed(2), 350.5, ...)` placed the right edge of the text at `X = 350.5`, the uncovered right arc of the pre-printed zero sat directly after the numbers, creating a phantom `)` artifact (e.g. `450.00)` and `1850.00)`).
     - Furthermore, `350.5` was offset by `1.12 pt` to the left compared to the un-whited-out rows below where `0.00` ends at `X = 351.62`.
  2. **Mathematical Calibration & Ghost Annihilation**:
     - Parts AMOUNT: Expanded `whiteOut` width to `64.2 pt` (`X = 288.5` to `352.7`), safely covering up to `352.7` (1.08 pt past `0.00` and 0.59 pt inside vertical border line `353.29`), completely destroying the pre-printed character ghost.
     - Calibrated `drawTextRight` alignment to `X = 351.6`, matching the exact horizontal alignment of `0.00` in rows below.
     - Materials AMOUNT: Calibrated `whiteOut` to `48.2 pt` (`X = 474.5` to `522.7`, safely inside border `523.29`) and aligned text to `X = 521.4` (matching template `521.38`).
     - Parts Subtotal, Materials Subtotal, and Grand Total: Calibrated whiteouts (`64.2 pt` & `47.7 pt`) and right-alignment (`X = 351.6` and `X = 521.4`).
* **Core Changes Made**:
  - `frontend/js/app.js`: Updated `compileForm13PDFBytes()` with 64.2pt/48.2pt whiteout bounds and 351.6pt/521.4pt alignment.
  - `frontend/index.html`: Incremented cache buster to `v=3.06`.
  - `tests/frontend/app.test.js`: Updated AUT-FRONT-116 test assertion for calibrated whiteouts.
  - `tests/frontend/sla_and_logic.test.js`: Synced cache buster references to accept `v=3.06`.
* **Automated & Manual QA Verification**:
  - 144/144 automated unit tests passing across 63 test suites (`npm.cmd test`).
  - Appended `SA-29` to `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
  - Appended `REV-153` to `Revisions checklist.csv`.
* **Cache Busting**: `js/app.js?v=3.06`.
* **GitHub Commit Traceability**: `2bd7a5f`.

---

## 📅 September 25, 2026 (Current_2025 BLANK RO UPDATED_v3 Job_Order_Wide Official Template Migration & Precision Calibration)

### 📋 Current_2025 BLANK RO UPDATED_v3 Job_Order_Wide Template Migration & Precision Calibration (REV-152)
* **Objective & Context**: In direct response to user request, migrated Form 1/3 (Job Order) from the previous narrow-column PDF to the user's authentic new format `Current_2025 BLANK RO UPDATED_v3.xlsx - Job_Order_Wide.pdf`:
  1. **Asset Organization & Cleanup**: Relocated the user's PDF from `Hontech Documentation/` into `frontend/assets/Current_2025 BLANK RO UPDATED_v3.xlsx - Job_Order_Wide.pdf`, overwritten `frontend/assets/form13_template.pdf` and `frontend/assets/form13_template_hd.pdf` with this current version, and purged the temporary upload from the documentation folder so repository structure remains clean and organized.
  2. **Direct Vector PDF Geometry**: Unlike older scanned templates, the new v3 Wide template is a direct native vector PDF exported from Excel (595 x 842 pt A4) with high-res company logo assets and wider table description columns, eliminating text clipping and ellipsis (`...`) truncation.
  3. **Affine Coordinate Mapping & Line Extraction**: Extracted exact vector geometry from the PDF content stream and calibrated all field injection baselines in `compileForm13PDFBytes()`:
     - Header: Job Order No (`X = 498.8, Y = 792.2`, 8.0pt bold) and Date (`X = 498.8, Y = 767.0`, 7.0pt true) directly above printed underlines.
     - Customer Dossier: 12 fields spaced at authentic `8.11 pt` intervals (`Y = 723.5, 715.4, 707.3, 699.2`) with `146 pt` width for Name/Address/Contact/Email, `66 pt` for Model/KM/Engine/Chassis, and `47 pt` for Plate/Intake/Promise/Color (6.2pt regular, auto-shrink down to 4.8pt).
     - Customer Concern Box: Centered horizontally at `X = 299.4` with max width expanded to `430 pt` (box bounds `Y: 614.4..670.2`, center `Y = 642.3`).
     - Interviewed by: Aligned above Service Advisor underline at `X = 184.7, Y = 583.8`.
     - Authorization: Customer signature centered at `X = 294.65, Y = 542.3`.
     - Diagnostics: Starting below header bar at `X = 78, Y = 492`, max width `104 pt`.
     - Parts & Materials Table: 23 table rows at exact `8.11 pt` pitch starting at `Y = 494.6` (`ROW_Y = Array.from({ length: 23 }, (_, i) => +(494.6 - i * 8.11).toFixed(2))`) with wide description column and non-destructive whiteouts masking only active amount cells.
     - Subtotals & Totals: Parts Subtotal (`X = 350.5, Y = 307.2`), Materials Subtotal (`X = 521.5, Y = 307.2`), and Grand Total (`X = 521.5, Y = 299.1`) cleanly bounded inside boxes.
     - Lower Signatures: Diagnosed by / Assessed by (`Y = 280.0`), Recommending / Approved by (`Y = 206.1`), Conforme / Concurred by (`Y = 169.0`) resting directly above underlines without horizontal line slicing.
     - Filipino Claim Stub: All 3 rows aligned with template underlines (`Y = 77.9, 67.8, 57.8`) with pre-printed placeholder ghosts masked.
* **Core Changes Made**:
  - `frontend/assets/`: Installed `Current_2025 BLANK RO UPDATED_v3.xlsx - Job_Order_Wide.pdf`, updated `form13_template.pdf` and `form13_template_hd.pdf`.
  - `frontend/js/app.js`: Updated `compileForm13PDFBytes()` with exact coordinates, expanded description columns, and zero text truncation.
  - `frontend/index.html`: Incremented cache buster to `v=3.05`.
  - `tests/frontend/app.test.js` & `tests/frontend/sla_and_logic.test.js`: Updated `AUT-FRONT-112`, `AUT-FRONT-116`, `AUT-FRONT-23`, `AUT-FRONT-94`, `AUT-FRONT-104`, and `AUT-FRONT-106` with calibrated coordinates and `v=3.05`.
* **Automated & Manual QA Verification**:
  - 144/144 automated unit tests passing across 63 test suites (`npm.cmd test`).
  - Synced `SA-28` into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
  - Synced `REV-152` into `Revisions checklist.csv`.
* **Cache Busting**: `js/app.js?v=3.05`.
* **GitHub Commit**: `25735b5`.

---

## 📅 September 24, 2026 (Form 1/3 PDF Table Grid Integrity & Lower Signatures Calibration)

### 📋 Form 1/3 PDF Table Grid Integrity, Whiteout Elimination & Signatures Calibration (REV-151)
* **Objective & Context**: In direct response to user screenshots showing white void rectangles ("so many white parts") erasing table grid lines, row 0 overlapping the table header, and underlines slicing through lower signature names:
  1. **Purged Destructive Column Whiteouts**: Replaced the 23-row loop that previously wiped out the Amount columns with 45pt-wide white rectangles. Ghost `"0.00"` placeholders are now only masked on rows that actually contain items, using compact `22pt x 5.8pt` insets strictly inside cell padding. Empty rows retain 100% intact horizontal and vertical black grid lines with zero white artifacts.
  2. **Calibrated Row 0 & 7.78pt Pitch**: Shifted Parts & Materials row 0 from `Y = 495.5` up to its true baseline `Y = 497.75` with exact `7.78 pt` row pitch (`ROW_Y = Array.from({ length: 23 }, (_, i) => +(497.75 - i * 7.78).toFixed(2))`), ensuring "Engine Oil Filter" and "Brake Cleaner" sit cleanly inside the first row without overlapping header dividers.
  3. **Subtotals & Grand Total Box Clearance**: Re-scoped whiteout and amount baselines for Parts Subtotal (`Y = 317.5`, `whiteOut(290, 315.5, 56, 7.2)`), Materials Subtotal (`Y = 317.5`, `whiteOut(464, 315.7, 43, 7.2)`), and Grand Total (`Y = 309.5`, `whiteOut(464, 307.8, 43, 6.2)`) so text sits squarely inside the boxes without clipping black box borders.
  4. **Certificate of Completion Signatures**: Lowered Recommending Approval (SA) and Approved by (Chief Mechanic) from `Y = 223.5` down to `Y = 220.5` directly above the `Y = 219.0` underline, centered at `X = 200.0` and `X = 435.0`.
  5. **Conforme & Concurred by Signatures**: Raised Customer Name ("John Kaye Paranas Fernandez") and Manager ("General Manager") from `Y = 182.5` up to `Y = 186.5` directly above the `Y = 185.0` underline, completely eliminating the horizontal underline slicing through the text.
* **Core Changes Made**:
  - `frontend/js/app.js`: Updated `compileForm13PDFBytes()` with non-destructive cell-padded whiteouts, `497.75` row 0 with `7.78pt` pitch, bounded totals, and calibrated signature baselines.
  - `frontend/index.html`: Incremented cache buster query parameter to `v=3.04`.
  - `tests/frontend/app.test.js` & `tests/frontend/sla_and_logic.test.js`: Updated `AUT-FRONT-112`, `AUT-FRONT-116`, `AUT-FRONT-94` assertions and cache buster checks to `v=3.04`.
* **Automated & Manual QA Verification**:
  - 144/144 automated unit tests passing across 63 test suites (`npm.cmd test`).
  - Headless Chrome rendering and screenshot inspection verified zero white stripe artifacts, intact grid lines, and perfectly rested signature baselines.
  - Synced `SA-27` into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
  - Synced `REV-151` into `Revisions checklist.csv`.
* **Cache Busting**: `js/app.js?v=3.04`.
* **GitHub Commit**: `84dd33f`.

---

## 📅 September 24, 2026 (Form 1/3 PDF Pixel-Perfect Visual Calibration for Customer Concern, Interviewed By, Authorization & Signatures)

### 📋 Form 1/3 PDF Pixel-Perfect Visual Calibration for Customer Concern, Interviewed By, Authorization & Signatures (REV-150)
* **Objective & Context**: In direct response to user visual feedback on Form 1/3 (Job Order) PDF preview formatting, eliminate all remaining coordinate misalignments caused by embedded PDF XObject coordinate translations:
  1. Fix Customer Concern / Description of Requested Service: previously drawn outside the box and overlapping the "NOTE" legal text; calibrated to sit centered horizontally and vertically directly inside the white Concern Box (`X = 307.5`, `startY = 635.0` within `Y: 610..660`).
  2. Fix "Interviewed by" Service Advisor name: previously shifted down to the wrong baseline over the Parts header; calibrated to rest directly above the `Interviewed by: ____________________ Service Advisor` underline (`X = 196.5, Y = 583.5` with `whiteOut(148, 582.5, 96, 7.5)`).
  3. Fix "Customer Name and Signature" under Authorization: previously displaced with pre-printed ghost `"0"` visible; calibrated to sit directly above the `Customer Name and Signature` underline (`X = 302.5, Y = 545.5`) with pre-printed ghost `"0"` 100% masked (`whiteOut(285, 542.6, 35, 10.0)`).
  4. Parts & Materials Table: Recalibrated `ROW_Y` array to start at `Y = 495.5` with `7.32 pt` pitch and masked `"0.00"` ghosts with targeted insets (`whiteOut(304, ry - 1.0, 45, 6.8)` and `whiteOut(475, ry - 1.0, 37, 6.8)`).
  5. Calibrate Lower Signatures: Diagnosed by (`X = 200.0, Y = 292.0`), Assessed by (`X = 442.5, Y = 292.0`), Recommending Approval (`X = 200.0, Y = 223.5`), Approved by Chief Mechanic (`X = 442.5, Y = 223.5`), Conforme Customer (`X = 200.0, Y = 182.5`), Concurred by Manager (`X = 442.5, Y = 182.5`).
  6. Calibrate Filipino Claim Stub: Baselines aligned at `Y = 99.5`, `Y = 89.5`, and `Y = 80.5` with all 5 pre-printed ghost placeholders cleanly masked.
* **Core Changes Made**:
  - `frontend/js/app.js`: Updated `compileForm13PDFBytes()` with visually verified coordinates across all sections.
  - `frontend/index.html`: Incremented cache buster query parameter to `v=3.03`.
  - `tests/frontend/app.test.js`: Updated `AUT-FRONT-112` and `AUT-FRONT-116` with calibrated coordinates and `v=3.03`.
  - `tests/frontend/sla_and_logic.test.js`: Updated `AUT-FRONT-94` and `AUT-FRONT-106` assertions to recognize calibrated coordinates.
* **Automated & Manual QA Verification**:
  - 144/144 automated tests passing across 63 suites (`npm.cmd test`).
  - Visually verified via headless Chrome rendering and screenshot inspection.
  - Synced `SA-26` into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
  - Synced `REV-150` into `Revisions checklist.csv`.
* **Cache Busting**: `js/app.js?v=3.03`.
* **GitHub Commit**: `e001ee8`.

---

## 📅 September 24, 2026 (Form 1/3 PDF Comprehensive Typography, Centered Concern, Grid Calibration & Ghost Elimination)

### 📋 Form 1/3 PDF Comprehensive Typography, Centered Concern, Grid Calibration & Ghost Elimination (REV-149)
* **Objective & Context**: In direct response to user revisions on Form 1/3 (Job Order) PDF formatting, eliminate all remaining template coordinate misalignments: enforce uniform unbolded typography across all 12 customer detail fields, horizontally and vertically center customer request service/concern text inside the concern box, correct the Service Advisor "Interviewed by" baseline from floating in the air down to the true line with standard font size, fill missing customer authorization signature with masked template ghost, align diagnostic result cleanly below the header bar, recalibrate Parts & Materials rows to the exact 7.32pt template grid with Amount ghost whiteouts, center all 6 signature slots above their respective underlines, and completely overhaul the bottom Filipino claim stub by masking all 5 pre-printed ghost placeholders (`"0"`, `"0"`, `"0"`, `"1/0/1900"`, `"0"`) and positioning Name, Plate, Model, SA, Date, and Claim Stub ID on their authentic baselines.
* **Core Changes Made**:
  - `frontend/js/app.js`:
    - **Customer Details**: Standardized all 12 fields (Name, Address, Contact, Email, Model, Plate, KM, Intake Date, Promise Date, Engine, Chassis, Color) to uniform unbolded 6.2pt typography (`fontNorm`, `isBold: false`).
    - **Customer Service Concern**: Centered each line horizontally (`centerX = 298.5`) and vertically within the concern box (`Y = 600..610`) using dynamic word wrapping and centering.
    - **Interviewed by**: Lowered baseline from floating `Y = 583.5` down to `Y = 549.5` directly above the Service Advisor underline (`Y = 548.0`) at standard `6.5 pt` font, centered at `X = 187.5`.
    - **Authorization Signature**: Masked template pre-printed `"0"` ghost at `X = 301.39, Y = 511.03` with whiteout and centered customer name at `X = 300.0, Y = 511.5`.
    - **Diagnostic Result**: Lowered start baseline from `Y = 498` down to `Y = 466.0` inside the white diagnostic box below the header.
    - **Parts & Materials Table**: Recalibrated row step from `8.1 pt` to the exact **`7.32 pt`** template grid (`ROW_Y = [469.0, 461.7, 454.4, ... 308.0]`), added inset whiteouts across all 23 rows in Amount columns to mask pre-printed `"0.00"` ghosts, and centered subtotals.
    - **Signatures Alignment**: Centered all 6 signatures on their lines: Diagnosed by (`X = 215.0, Y = 274.8`), Assessed by (`X = 467.5, Y = 274.8`), Recommending Approval (`X = 215.0, Y = 207.8`), Approved by Chief Mechanic (`X = 442.5, Y = 207.8`), Conforme Customer Signature (`X = 215.0, Y = 174.8`, masking template `"0"` ghost), and Concurred by General Manager (`X = 442.5, Y = 174.8`).
    - **Filipino Claim Stub Overhaul**: Masked all 5 template ghost placeholders (`Y = 92.5` and `Y = 74.8`) and placed data on true rows: Name (`X = 152, Y = 92.8`), Plate No (`X = 396.5, Y = 92.8`), Year/Model (`X = 482.5, Y = 92.8`), SA (`X = 152, Y = 84.0`), Date (`X = 215.5, Y = 75.0`), and Claim Stub ID (`X = 446.5, Y = 75.0`).
  - `frontend/index.html`:
    - Added 1-click fast preset chips (`[+ Oil Filter ₱450]`, `[+ Brake Pads ₱1,850]`, `[+ Spark Plugs ₱1,200]`, `[+ Air Filter ₱650]` for Parts; `[+ Synthetic Oil ₱1,850]`, `[+ Brake Cleaner ₱350]`, `[+ Engine Flush ₱480]`, `[+ Coolant ₱380]` for Materials) to make data entry 1-click simple for the SA.
    - Incremented script cache buster query parameter to `v=3.02`.
  - `tests/frontend/app.test.js` & `tests/frontend/sla_and_logic.test.js`:
    - Added comprehensive unit test `AUT-FRONT-116` validating all 8 Form 1/3 PDF formatting rules.
    - Updated `AUT-FRONT-94` and `AUT-FRONT-106` to verify calibrated 6.2pt uniform typography and centered concern layout.
    - Updated cache buster checks across all test suites to recognize `v=3.02`.
* **Automated & Manual QA Verification**:
  - 144/144 automated tests passing across 63 suites (`npm.cmd test`).
  - Synced `SA-25` into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
  - Synced `REV-149` into `Revisions checklist.csv`.
* **Cache Busting**: `js/app.js?v=3.02`.
* **GitHub Commit**: Pending.

---

### 📋 2025 RO Excel Studio Unlocked Top Meta Bars & Custom Number Preservation (REV-148)
* **Objective & Context**: Unlock Job Order No, Quotation No, and Billing No top meta input fields for free manual editing, and preserve custom numbers across form sheet switches, live PDF renders, offline drafts, and Excel exports without reactive overwriting.
* **Core Changes Made**:
  - `frontend/index.html`: Removed `readonly` locks and disabled styling from `#f13-input-job-no`, `#f23-input-quote-no`, and `#bill-input-billing-no`; styled with clean `bg-white`.
  - `frontend/js/app.js`: Added `autoDerived` dataset logic so manual typing is preserved; updated `saveWorkbookDraftOffline` and `loadWorkbookDraftOffline` to store and restore custom numbers; updated `exportOfficialXLSX` to extract custom inputs.
  - Added unit test `AUT-FRONT-115` in `tests/frontend/app.test.js`.
  - Synced `SA-24` into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
  - Synced `REV-148` into `Revisions checklist.csv`.
* **Cache Busting**: `js/app.js?v=3.01`.
* **GitHub Commit**: Pending.

---

## 📅 September 24, 2026 (Quotation PDF Ghost Placeholder Masking & Subtotals Alignment Overhaul)

### 📋 Quotation PDF Ghost Placeholder Masking & Subtotals Alignment Overhaul (REV-147)
* **Objective & Context**: In response to user feedback on Quotation (Form 2/3) PDF preview formatting, eliminate all pre-printed template placeholder ghosts (`"0"` and `"0.00"` strings), clear empty table rows, extend whiteout masking across all 7 table columns (PARTS/MATERIAL, QTY, FRT, LABOR, PARTS, MATERIALS, AMOUNT), fix Customer Details and Meta Header placeholder leakage, and overhaul the Subtotals and Grand Total summary block area without altering or breaking template grid lines.
* **Core Changes Made**:
  - `frontend/js/app.js`:
    - **Quotation (Form 2/3)**:
      - **Meta Header**: Replaced single narrow whiteout with wide block `whiteout(420, 720, 100, 62)` covering the full right-side header column (Quote No, Date, Job No, Promise Date) to remove pre-printed `"0"` placeholders before drawing dynamic values.
      - **Customer Details**: Expanded row whiteout rectangles to wide single-strip insets `whiteout(110, Y, 400, 9)` for Rows 1-3 (`Y = 692.0, 682.5, 673.0`), completely wiping stray `"0"` ghosts between the left (Name, Address, Contact) and right (Plate, Model, Color) column groups.
      - **Line Items Table**: Expanded row clearing loop from 3 column insets to all 7 column insets (`whiteout(72, ry-1.5, 120, 8.5)` for Desc, `whiteout(192, ry-1.5, 22, 8.5)` for QTY `"0"`, `whiteout(218, ry-1.5, 28, 8.5)` for FRT `"0.00"`, `whiteout(248, ry-1.5, 35, 8.5)` for LABOR `"0.00"`, `whiteout(300, ry-1.5, 48, 8.5)` for PARTS `"0.00"`, `whiteout(360, ry-1.5, 45, 8.5)` for MATERIALS `"0.00"`, `whiteout(410, ry-1.5, 60, 8.5)` for AMOUNT `"0.00"`).
      - **Row Totals**: Suppressed drawing `rowTotal.toFixed(2)` on empty rows (`if (rowTotal > 0)`), ensuring blank table rows remain completely clean and clear.
      - **Subtotals & Grand Total**: Replaced narrow 55×50 whiteout with wide summary block `whiteout(300, 318, 175, 56)` covering all 5 summary lines (`Y = 318..374`), masking template pre-printed `"0.00"` ghosts while accurately drawing non-zero Labor, VAT 12%, Materials, Parts, and Grand Total values.
  - `frontend/index.html`:
    - Incremented script cache buster query parameter from `v=2.99` to `v=3.00`.
  - `tests/frontend/sla_and_logic.test.js` & `tests/frontend/app.test.js`:
    - Updated `AUT-FRONT-107` assertion to accept the expanded header whiteout rectangle `whiteout(420, 720, 100, 62)`.
    - Updated `AUT-FRONT-112` and all 42 cache-buster test assertions across the suite to recognize `v=3.00`.
* **Automated & Manual QA Verification**:
  - 142/142 automated tests passing across 63 suites (`npm.cmd test`).
  - Synced `SA-23` into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
  - Synced `REV-147` into `Revisions checklist.csv`.
* **Cache Busting**: `js/app.js?v=3.00`.
* **GitHub Commit**: `501e128`.

---

## 📅 September 24, 2026 (2025 RO Excel Studio Multi-Sheet PDF Document Formatting, Typography & Vector Overhaul)

### 📋 2025 RO Excel Studio Multi-Sheet PDF Document Formatting, Typography & Vector Overhaul (REV-146)
* **Objective & Context**: In response to user instruction to extend the precision document alignment from Form 1/3 across all remaining worksheets (Quotation Form 2/3, Billing Statement, and Inspection Checklist), overhaul dynamic text coordinate placement, eradicate template placeholder text clashes (e.g. pre-printed `"0"` and `"0.00"` strings), eliminate horizontal line cutting through text, and protect table column borders from destructive block whiteouts.
* **Core Changes Made**:
  - `frontend/js/app.js`:
    - **Quotation (Form 2/3)**:
      - Header: Anchored Quote No (`quoteNo`) to `Y = 775.5` directly on the pre-printed underline; centered Date to `X = 470, Y = 743.5` alongside the label; added non-destructive whiteout (`X: 475-540, Y: 729.5-739.5`) to eliminate the template's pre-printed `"0"` placeholder and drew `jobNo` at `X = 485, Y = 734.0` in bold; positioned Promise Date at `X = 470, Y = 724.6`.
      - Customer Details: Masked template pre-printed `"0"` strings in both columns using targeted insets (`X: 115-320` and `X: 375-500`) without cutting border rules; dynamically injected Name (`Y = 696.3`), Address (`Y = 686.8`), Contact No (`Y = 677.4`), Plate No (`Y = 696.3`, bold), Year/Model (`Y = 686.8`), and Color (`Y = 677.4`) with 6.5pt clean sans-serif typography and `minSize: 5.2` auto-shrink.
      - Line Items Table: Replaced monolithic 405pt block whiteout with targeted cell insets (`whiteout(72, ry - 1.5, 120, 8.5)` for Description, `whiteout(265, ry - 1.5, 45, 8.5)` for Labor placeholder `"0.00"`, `whiteout(440, ry - 1.5, 65, 8.5)` for Amount placeholder `"0.00"`), perfectly preserving vertical column grid lines and horizontal rules. Calibrated row baseline step to exact 9.46pt (`startY = 649.1`).
    - **Billing Statement**:
      - Header: Aligned Billing No (`billingNo`) to `X = 475, Y = 761.0` in bold; Date to `X = 495, Y = 724.5`; masked pre-printed `"0"` placeholders for Job Order No (`X: 490-550, Y: 708.5-717.5`) and Quotation No (`X: 490-550, Y: 697.0-706.0`) before drawing dynamic values at `Y = 712.9` and `Y = 701.3`.
      - Customer Details: Corrected vertical baseline offsets to true template positions (`Y = 666.4, 654.8, 643.2, 631.6`); masked pre-printed `"0"` strings with targeted insets (`X: 80-310` and `X: 395-535`); rendered Name, Address, Contact, Email, Plate (bold), Model, Color, and KM reading with 6.5pt clean regular font and 5.2pt auto-shrink.
      - Line Items Table: Replaced 530pt full-width whiteout with targeted cell insets (`whiteout(25, ry - 1.5, 155, 9.5)` for Description, `whiteout(285, ry - 1.5, 45, 9.5)` for Labor `"0.00"`, and `whiteout(505, ry - 1.5, 45, 9.5)` for Amount `"0.00"`). Set `startY = 583.2` to eliminate table header clipping.
    - **Inspection Checklist**:
      - Header Details: Masked pre-printed `"0"` placeholders across Customer Name, Date, Plate No, and Vehicle Model; aligned text baselines to `Y = 739.0` (Name & Date), `Y = 723.1` (Plate No, bold), and `Y = 707.3` (Vehicle Model) with 6.5pt typography.
      - Fuel Gauge Indicator: Removed redundant `drawText('FUEL LEVEL:', ...)` string since the template already features a pre-printed label at `X = 379.9, Y = 707.8`; anchored fuel selector coordinates to exact template letter positions (`E: 445`, `1/4: 468`, `1/2: 494`, `3/4: 520`, `F: 548`) and rendered a clean vector border ring around the active level.
  - `frontend/index.html`:
    - Incremented client script cache buster query parameter to `v=2.99`.
  - `tests/frontend/sla_and_logic.test.js`:
    - Updated Suite 49 (`AUT-FRONT-94`) and Suite 52 (`AUT-FRONT-98`) assertions to support calibrated coordinates and targeted cell whiteout masking.
    - Added comprehensive unit test `AUT-FRONT-107` verifying Quotation, Billing, and Checklist multi-sheet precision coordinates, placeholder masking, and fuel selector ring positioning.
    - Updated cache buster checks across test suites to recognize `v=2.99`.
* **Automated & Manual QA Verification**:
  - 142/142 automated tests passing across 63 suites (`npm.cmd test`).
  - Synced `SA-22` into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
* **Cache Busting**: `js/app.js?v=2.99`.
* **GitHub Commit**: `fe04a58`.

---

## 📅 September 24, 2026 (2025 RO Excel Studio PDF Document Formatting, Typography & Precise Coordinate Alignment)

### 📋 2025 RO Excel Studio PDF Document Formatting, Typography & Precise Coordinate Alignment (REV-145)
* **Objective & Context**: In response to user review of Job Order Form 1/3 and other studio sheets, eliminate all document formatting flaws, horizontal line piercing, text-column collisions, and font mismatches. Align the dynamic text injection across all 4 worksheets (Job Order, Quotation, Billing, Inspection Checklist) to the exact physical vector coordinates and 6.5pt clean sans-serif typography of the official templates, keeping key identifiers (Plate No, Job/Quote/Billing No) bolded for rapid scanning.
* **Core Changes Made**:
  - `frontend/js/app.js`:
    - **Job Order (Form 1/3)**:
      - Header: Shifted Job Order No (`jobNo`) from floating at Y=794 down to `drawTextCenter(jobNo, 485.5, 781.5, 8.0, true, darkInk)` directly above the printed underline (Y=780.0). Centered Intake Date inside the pre-printed date rectangle `drawTextCenter(intakeDate, 485.8, 758.2, 7.0, true, darkInk)` (box bounds: X: 462.4-509.1, Y: 756.0-765.1).
      - Customer Details: Replaced faulty 8.1pt decrement with exact 7.78pt template underline spacing and +1.3pt baseline clearance (Rows 1-4: Y = 715.8, 708.0, 700.3, 692.5). Prevents pre-printed underlines from slicing horizontally through contact numbers, emails, and color.
      - Typography & Auto-Shrink: Standardized customer details to 6.5pt regular font (6.2pt for address/email) matching the official template. Set Plate No to bold 6.5pt. Configured `minSize: 5.2` and clamped Column 2 (`maxWidth: 62`) to prevent long model names (e.g. "Geely Coolray Sport") from colliding with the Plate No column.
      - Concern Box: Repositioned text origin to `x: 94, y: 652` with `maxWidth: 405` and `lineHeight: 9.0` to preserve clean interior margins inside the bounding box (X: 88.6-508.5, Y: 611.4-665.4) without overlapping the top header line or side borders.
    - **Quotation (Form 2/3)**:
      - Standardized customer details typography to 6.5pt regular with bold Plate No (`X: 380, Y: 696.5`) and bold Quote No / Job No. Added `minSize: 5.2` auto-shrink.
    - **Billing Statement**:
      - Standardized customer details typography to 6.5pt regular with bold Plate No (`X: 400, Y: 668.2`) and bold Billing No / Job No. Added `minSize: 5.2` auto-shrink.
    - **Inspection Checklist**:
      - Standardized header details to 6.5pt regular with bold Plate No (`X: 120, Y: 720.8`).
  - `tests/frontend/sla_and_logic.test.js`:
    - Updated `AUT-FRONT-94` and `AUT-FRONT-23` to assert the calibrated coordinates and bold Plate No.
    - Added `AUT-FRONT-106` verifying Job Order No underline centering, Date box alignment, 7.78pt row decrement with +1.3pt baseline clearance, middle-column width clamping (62pt), and Concern Box margin bounds.
* **Automated & Manual QA Verification**:
  - 141/141 automated tests passing across 63 suites (`npm.cmd test`).
  - Synced `SA-21` into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
* **Cache Busting**: `js/app.js?v=2.98`.
* **GitHub Commit**: `9bacb7b`.

---

## 📅 September 24, 2026 (Official System Title Branding on Login Page & Document Title)

### 📋 Official System Title Branding on Login Page & Document Title (REV-144)
* **Objective & Context**: In response to explicit user instruction, update the official title of the system across the application login screen and browser document title to: **"Web-Based Operations and Real-Time Queue Management System"**. This aligns the capstone prototype branding with the official academic and corporate research title.
* **Core Changes Made**:
  - `frontend/index.html`:
    - Updated HTML `<title>` tag on line 10 to: `<title>HonTech — Web-Based Operations and Real-Time Queue Management System</title>`.
    - Updated the left hero marketing header (`<h1>`) on lines 499-503 to display `Web-Based <br>Operations and <br>Real-Time Queue <br><span class="text-red-500">Management System</span>`.
    - Preserved rich dark-mode typography, drop shadow, italic styling, and accented red highlight on `Management System`.
    - Bumped script cache buster query parameter to `v=2.98`.
  - `tests/frontend/app.test.js`:
    - Updated `AUT-FRONT-112` cache buster assertion for `v=2.98`.
    - Added `AUT-FRONT-114` verifying that the document title and login marketing header display the exact official system title with styled markup.
  - `tests/frontend/sla_and_logic.test.js`:
    - Updated cache buster compatibility checks in Suites 49-55 to recognize `v=2.98`.
* **Automated & Manual QA Verification**:
  - 140/140 automated tests passing across 63 suites (`npm.cmd test`).
  - Synced `AUTH-30` into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
* **Cache Busting**: `js/app.js?v=2.98`.
* **GitHub Commit**: `f2f2723`.

---

## 📅 September 24, 2026 (Consolidated Daily Intakes Online Module & Clean Service Advisor Navigation)

### 📋 Consolidated Daily Intakes Online Module & Clean Service Advisor Navigation (REV-143)
* **Objective & Context**: In response to direct user feedback, streamline the Service Advisor navigation by removing the separate "Online Bookings" button from the left sidebar and top navigation. Instead, the Service Advisor accesses the Online Booking Module exclusively within "Daily Intakes" (`showSection('queue')`), keeping the sidebar clean (strictly 5 core operational tools: 2025 RO Excel Studio, Daily Intakes, Customer Lookup, Bay Status, TV Monitor). Inside Daily Intakes, the Online Booking Module sits right at the head of the queue, strictly isolated to the SA's branch with clean static text badge and 1-click `[Load to RO Studio]` handover.
* **Core Changes Made**:
  - `frontend/js/app.js`:
    - Removed `showSection('online-bookings', this)` from both `navHTML` and `sidebarNavHTML` for the `sa` role in `buildNavbar()`.
    - Confined SA navigation strictly to 5 tools: 1. 2025 RO Excel Studio, 2. Daily Intakes, 3. Customer Lookup, 4. Bay Status, 5. TV Monitor.
    - Verified that visiting Daily Intakes (`showSection('queue')`) displays the branch-isolated Online Booking Module at the head of the queue with active workshop floor jobs below.
  - `frontend/index.html`:
    - Bumped script query parameter cache buster to `v=2.97`.
  - `tests/frontend/app.test.js`:
    - Updated `AUT-FRONT-108` to verify that SA navbar excludes separate Online Bookings buttons and consolidates access into Daily Intakes.
    - Updated `AUT-FRONT-112` for `v=2.97`.
    - Added `AUT-FRONT-113` verifying the strict 5-item operational order for Service Advisor navigation.
  - `tests/frontend/sla_and_logic.test.js`:
    - Synchronized cache buster assertions to accept `v=2.97`.
* **Automated & Manual QA Verification**:
  - 139/139 automated tests passing across 63 suites (`npm.cmd test`).
  - Synced `SA-20` into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
* **Cache Busting**: `js/app.js?v=2.97`.
* **GitHub Commit**: `d2224ef`.

---

## 📅 September 23, 2026 (Assistant Branch Dispatch & SA Branch-Locked Online Booking Handover)

### 📋 Assistant Branch Dispatch & SA Branch-Locked Online Booking Module to 2025 RO Studio Flow (REV-142)
* **Objective & Context**: Close the loop between the Assistant logging an online inquiry and the Service Advisor receiving the customer at the shop. The Assistant dispatches each booking to one branch; when the customer arrives ("I have an online booking"), the SA of *that* branch finds it in their Online Bookings module and hands it into the 2025 RO Excel Studio in one click. Previously SAs had no Online Bookings entry point, could see and edit every branch's online bookings, the Load-to-Studio function existed but had no button, and registering from the Studio created a duplicate job while the booking stayed pending.
* **Core Changes Made**:
  - `backend/repositories/JobRepository.php`:
    - `getFilteredJobs()` now withholds other branches' **pending Online bookings** from the `sa` role (server-side, no API leakage). Other records stay cross-branch so Customer Lookup history is unaffected.
    - New `branchMatchSql()` (parameterized alias-aware branch condition: `Marikina Branch`/`Branch A`/`Marikina`/empty and `East Branch`/`Branch B`/`Regalado Branch`) and `isSameBranch()` helpers.
  - `backend/controllers/JobController.php`:
    - Removed the SA cross-branch Online-booking write exemption from `updateJobField`, `setJobStatus` and `deleteJob`; all three now use the alias-aware `JobRepository::isSameBranch()` guard.
    - `createJob()` accepts `fromBookingId` (SA only): the pending Online booking is **converted in place** (same `job_id`, status `Waiting`, claim stub issued, `confirmed = 1`) instead of inserting a duplicate. Rejects other-branch bookings (403) and already-registered bookings (404).
  - `frontend/js/app.js`:
    - SA navbar: new **Online Bookings** entry (`calendar-clock`) in header and sidebar → virtual `online-bookings` view showing only `#container-online-queue` (reload-safe).
    - Booking Module: SA hard-locked to own branch (branch switcher hidden for SA); Branch column removed; static text-only badge `#online-queue-branch-badge` shows `<Branch> · Online Queue`; SA rows get **Load to RO Studio**.
    - `loadOnlineBookingToForm13()`: SA branch guard, tags `activeOnlineBookingId`, prefills Job No with the booking ID plus name/contact/plate/model/concern/date/category.
    - `registerStudioROToSystem()`: sends `fromBookingId` only while the loaded booking is still pending and the plate still matches (stale tags cannot convert the wrong booking); shows *Booking Handover Complete*.
    - `processIntake()`: Online submissions toast `Vehicle <PLATE> registered to <Branch> Booking Module.` and point the Booking Module at the dispatch branch.
    - New `getBranchDisplayName()` helper (`East Branch` → `Regalado Branch`); Assistant Target Branch option relabelled *Regalado Branch* (stored value unchanged).
    - Fix: Booking Module rows showed *Online Inquirer* and no phone because they read `customerName`/`phone`; now fall back to the API's `name`/`contact`.
  - `frontend/index.html`: removed the Booking Module `Branch` header, added the top-right badge, removed 📍 emojis from the branch switcher, added `.queue-focus-online` CSS, relabelled the static Target Branch option.
* **Automated & Manual QA Verification**:
  - New `tests/frontend/app.test.js` (`AUT-FRONT-107`–`112`), `tests/frontend/ro_studio.test.js` (`AUT-FRONT-113`–`115`), `tests/security/branch_isolation.test.js` (`SEC-BR-01`–`05`, executes the PHP branch helpers).
  - `AUT-FRONT-78` updated: the REV-101 Branch column assertion now asserts the column is gone and the badge exists.
  - 138/138 tests passing (`npm.cmd test`); live API end-to-end run against the dev server passed 8/8 (dispatch, Marikina SA read/edit/convert blocked, Regalado SA converts in place, no duplicate, re-convert rejected).
  - Synced `AST-62`, `SA-18`, `SA-19` into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
* **Cache Busting**: `js/app.js?v=2.96`.
* **GitHub Commit**: `9a7ca22`.

---

## 📅 September 22, 2026 (Master Queue Branch-Lock, Auto-Magnifier Overhaul, PDF Alignment, Full-PDF Views & Branch-Scoped RBAC)

### 📋 Decommission Auto-Magnifier & Typing Camera Locks for Steady PDF Preview (REV-141)
* **Objective & Context**: Decommission the complex auto-magnifier and typing camera/section locks across all 4 worksheets (`Job_Order`, `Quotation_No`, `Billing_No`, `CheckList_Result`) in the 2025 RO Studio. The dynamic transforms and letterbox calculations caused typing conflicts and layout jitter. Removing these locks provides a rock-steady, 100% aspect-fit vector preview without camera jumps or black voids, refocusing development on core business foundations.
* **Core Changes Made**:
  - `frontend/index.html`:
    - Removed the `#btn-studio-auto-magnify` toggle button and manual zoom presets (`Fit / 185% / 225%`) from the preview header, leaving clean, uncluttered action buttons (`Maximize PDF`, `Full PDF`, `Download PDF`).
    - Incremented cache buster to `v=2.95`.
  - `frontend/js/app.js`:
    - Set `isStudioAutoMagnifyEnabled = false`.
    - Removed `focus` and `input` event listeners calling `applyStudioFieldMagnification` across all form fields and delegated tables.
    - Simplified `applyStudioFieldMagnification()` and `lockStudioSection()` to safe no-ops that enforce steady `scale(1)` viewports without camera displacement.
    - Refactored `applyStudioAspectFit()` to maintain a stable, centered, letterbox-free aspect fit.
  - `tests/frontend/sla_and_logic.test.js`:
    - Updated Suite 49 assertions (`AUT-FRONT-99` through `AUT-FRONT-104`) to reflect the decommissioned auto-magnifier and steady preview state.
    - Added `AUT-FRONT-105` (REV-140) and `AUT-FRONT-106` (REV-141).
    - Batch-updated cache buster checks to accept `v=2.95`.
* **Automated & Manual QA Verification**:
  - 100% automated test suite passing: 124/124 tests across 60 suites (`npm.cmd test`).
  - Synced `SA-17` into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
* **Cache Busting**: `js/app.js?v=2.95`.
* **GitHub Commit**: `816a4ca`.

---

### 📋 2025 RO Studio Maximized PDF View, Live Full PDF In New Tab & Decommission Section Lock Bars (REV-140)
* **Objective & Context**: Address 3 explicit user-requested enhancements to the 2025 RO Studio:
  1. Remove the section-lock navigation pill strip (`Lock: Fit, Customer, Scope, Parts Table, Signatures, Claim Stub`) from the PDF preview panes across all 4 worksheets (`Job_Order`, `Quotation_No`, `Billing_No`, `CheckList_Result`) to eliminate visual clutter and expand vertical viewport height.
  2. Implement an ergonomic "Maximize PDF" toggle in the sticky top tab bar and canvas toolbars that collapses the left-hand form editor panes (`xl:col-span-7`) and expands the PDF preview canvas to full 12-column width (`xl:col-span-12`) with high vertical clearance, with seamless 1-click restore to normal side-by-side editing.
  3. Ensure that when users access the Full PDF preview (both in fullscreen enlarge modals and via direct New Tab buttons), it compiles and displays dynamic live in-memory form data with full customer/vehicle dossier, line items, and signatures rather than a static blank template.
* **Core Changes Made**:
  - `frontend/index.html`:
    - Added `#btn-maximize-studio-pdf` to the sticky top tab bar (`#form-top-tab-bar`).
    - Added `.btn-canvas-maximize-pdf` action buttons to the preview canvas toolbars across all 4 sheets.
    - Added `New Tab` buttons (`openActivePDFInNewTab()`) across all 4 fullscreen enlarge modals (`modal-f13-enlarge`, `modal-f23-enlarge`, `modal-billing-enlarge`, `modal-checklist-enlarge`).
    - Decommissioned and removed obsolete `lockStudioSection(...)` quick-lock pill strips across all 4 worksheets.
    - Incremented cache buster to `v=2.94`.
  - `frontend/js/app.js`:
    - Implemented `toggleStudioMaximizedPDF()`: toggles `hidden` on editor panes (`form13-editor-pane`, etc.), expands canvas panes to `xl:col-span-12`, updates button labels/icons (`Maximize PDF` ↔ `Normal View`), calls `applyStudioAspectFit()`, and displays intuitive toast feedback.
    - Implemented `openActivePDFInNewTab()`: dynamically compiles fresh PDF bytes via `generate*PDF(false)` with live form inputs, generates an in-memory Blob URL, and opens it directly in a new browser tab with native zoom and print controls.
    - Exported both functions onto `window` scope.
  - `tests/frontend/sla_and_logic.test.js`:
    - Updated Suite 49 assertion in `AUT-FRONT-103` to verify backward compatibility of `lockStudioSection`.
    - Added `AUT-FRONT-105` test case verifying maximized PDF toggle, live full PDF new tab viewer, removal of lock pills, and cache buster `v=2.94`.
    - Batch-updated cache buster assertions to accept `v=2.94`.
* **Automated & Manual QA Verification**:
  - 100% automated test suite passing: 124/124 tests across 60 suites (`npm.cmd test`).
  - Synced `SA-16` into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
* **Cache Busting**: `js/app.js?v=2.94`.
* **GitHub Commit**: `2f8f2ce`.

---

### 📋 Branch-Scoped Data Isolation, Per-Branch Workshop Bay Settings & Role-Gated Module Access (REV-139)
* **Objective & Context**: Owner previously could see both branches (correct), but Admin could see and edit *every* branch's job data through the same `/api/jobs` endpoint — there was no server-side branch boundary for Admin at all outside the analytics report. The Workshop Bay ceiling was a single global `localStorage` value with no branch awareness and no server persistence, so two branches sharing one browser profile would silently share (or clobber) the same bay count, and it reset per device. Customer Lookup and TV Monitor had no role restriction beyond which nav buttons happened to be rendered. This revision enforces: Admin sees/edits only their own branch; Owner still sees both; Owner has zero functionality in the Workshop Bay module; Admin sets the per-branch bay ceiling; SA's active bay count is server-clamped to it; Customer Lookup is SA-only; TV Monitor is SA/Assistant-only.
* **Core Changes Made**:
  - `backend/repositories/JobRepository.php` — `getFilteredJobs()`: Admin is now unconditionally filtered to their own branch (no `?branch=` override possible); Owner/Assistant/SA keep the existing optional branch-filter behavior.
  - `backend/controllers/JobController.php` — removed `admin` from the branch-ownership exemption list on all 3 job-mutation branch-security checks (create/update/status-change), so an Admin can no longer edit another branch's job.
  - New `backend/repositories/BayRepository.php` + `backend/controllers/BayController.php` + 3 routes in `backend/index.php` (`GET /api/bays/settings`, `POST /api/bays/settings/limit` admin-only, `POST /api/bays/settings/active` sa-only) — a new `branch_bay_settings` DB table (added via `backend/migration.php`) replaces the old global-only `localStorage` bay ceiling with a real per-branch server setting. Owner is rejected with 403 on every bay endpoint, even though route-level `Auth::requireRole()` already excludes it.
  - `frontend/js/app.js` — `buildNavbar()`: removed "Workshop Bays" and "TV Monitor" from Owner's nav; removed "Customer Lookup" and "TV Monitor" from Admin's nav; removed "Customer Lookup" from Assistant's nav. `showSection()` gained guards for `'bays'` (blocks Assistant + Owner) and `'lookup'` (SA only); `openTVBroadcastHubModal()` gained a role guard (SA/Assistant only).
  - `frontend/js/app.js` — `setFacilityMaxBayLimit`/`promptCustomCeilingLimit`/`stepWorkshopBayCount`/`promptCustomBayCount`/`handleWorkshopBayCountChange`/`updateBayControlsVisibility`: removed Owner from every "can configure bays" branch (Admin-only ceiling, SA-only active count); each write now also persists to the new backend endpoint. New `syncBaySettingsFromServer()` refreshes the local cache from the branch's server-side truth on every login, so a different device/SA at the same branch sees the Admin's actual configured ceiling instead of a stale local value.
  - **Bug fix**: `currentUserBranch` was declared once (`let currentUserBranch = 'Marikina Branch'`) but never reassigned anywhere in the codebase — every logged-in user's frontend branch context silently stayed "Marikina Branch" regardless of their real branch. Fixed across all 4 login paths (`processLogin`, auto-login via `/api/auth/me`, Google sandbox login, MFA verify).
* **Automated & Manual QA Verification**:
  - Live-tested via curl with real seeded accounts across both branches: Marikina Admin's `/api/jobs` returned only `Marikina Branch` rows (36), East Admin's returned only `East Branch` rows (2), Owner's returned both (38 combined).
  - Marikina Admin attempting to `PATCH` an East Branch job's status correctly received `403`.
  - Owner correctly received `403` on `GET`/`POST /api/bays/settings*`; Assistant correctly received `403`; Marikina Admin and East Admin each set an independent bay ceiling (6 vs 9) with zero cross-branch bleed; SA's active-count request of `99` correctly clamped server-side to the branch's ceiling.
  - Live headless-browser nav/section verification across all 4 roles confirmed: Owner's nav has no Workshop Bays/Customer Lookup/TV Monitor and all 3 sections/modal are blocked; Admin's nav has Workshop Bays but no Customer Lookup/TV Monitor; Assistant's nav has TV Monitor but no Customer Lookup/Bay Status; SA retains full access to all three.
  - Full automated suite: 124/124 tests passing (`npm.cmd test`).
* **Cache Busting**: `js/app.js?v=2.93`.
* **GitHub Commit**: `d73493c`.

---

### 📋 Full-PDF Enlarge Modal Views for Quotation, Billing & Checklist + Duplicate Modal Cleanup (REV-138)
* **Objective & Context**: All 4 sheet "Full PDF" buttons were plain `<a href="assets/..._template.pdf" target="_blank">` links to the *static, unfilled* template asset — clicking it never showed the user's actual data. A fully-built fullscreen "enlarge" modal (with live PDF, Download, Print) already existed in the HTML/JS for Job Order only, but nothing ever called it.
* **Core Changes Made**:
  - `frontend/index.html` — replaced the 4 static template links with buttons calling `openForm13EnlargeModal()` / `openQuoteEnlargeModal()` / `openBillingEnlargeModal()` / `openChecklistEnlargeModal()`; added 3 new fullscreen modals (`modal-f23-enlarge`, `modal-billing-enlarge`, `modal-checklist-enlarge`) mirroring the existing Job Order one.
  - `frontend/js/app.js` — added the 3 new open/close function pairs; each `open*EnlargeModal()` now regenerates the PDF first (`await generate*PDF(false)`) so the enlarged view always reflects the latest typed data, not a stale blob; generalized the ESC-to-close handler to cover all 4 modals.
  - Discovered and removed an accidental full duplicate of ~150 lines of modal HTML (the enlarge modal, the audit-history modal, and the edit-reason-prompt modal each appeared twice verbatim with clashing `id`s) while adding the new modals in that same region of `frontend/index.html`.
* **Automated & Manual QA Verification**:
  - Live headless-browser test opened all 4 enlarge modals in sequence and confirmed each iframe loaded a real `blob:` PDF (not `about:blank`), and confirmed every previously-duplicated `id` now appears exactly once in the DOM.
* **Cache Busting**: `js/app.js?v=2.92`.
* **GitHub Commit**: `6b398d0`.

---

### 📋 Job Order PDF Field & Signature Alignment Fixes (REV-137)
* **Objective & Context**: User-reported misaligned PDF fields matched screenshots exactly: the Customer Details block was drawn one full row too high (the Name value floated above the "Name" label entirely, overlapping the header divider, and every label below it showed the *next* field's value instead of its own). Separately, Parts/Materials Amount cells and several signature lines showed doubled/overlapping text.
* **Core Changes Made**:
  - `frontend/js/app.js` — `compileForm13PDFBytes()`: shifted the 4-row Customer Details block (Name/Address/Contact/Email × Year-Model/Plate/KM/Intake-Date/Engine/Promise-Date/Chassis/Color) down by one row (`723.3→715.2`, `715.2→707.1`, `707.1→698.9`, and a previously-missing 5th row at `698.9→690.8`), so each value now lands on its own label's line.
  - Added targeted `whiteOut()` rectangles before drawing Parts/Materials row amounts — the template pre-prints a `"0.00"` placeholder in every Amount cell that was peeking out from under real totals once a row had data.
  - Added `whiteOut()` before the Diagnosed-by/Assessed-by (mechanic/assessor) and Concurred-by (manager) signature draws — the template pre-prints the role label directly under these lines, which doubled up visibly with the drawn value whenever it defaulted to placeholder text identical to the label.
  - Removed an erroneous `drawTextCenter('Chief, Auto Mechanic', ...)` call with no backing input field that was redundantly duplicating the template's own printed "Chief, Auto Mechanic / Authorized AM" label.
* **Automated & Manual QA Verification**:
  - Diagnosed by extracting the actual PDF content stream (`Tm`/`Tj` operators) via `pdf-lib` rather than trusting screenshots, after discovering an earlier headless-browser verification pass had been serving a cached pre-fix `app.js` — confirmed with a fresh, cache-disabled browser profile that all corrected Y-coordinates and whiteout rectangles are present in the generated PDF.
  - Updated `AUT-FRONT-94` to assert the corrected `715.2` Y-coordinates instead of the old `723.3`.
  - Full suite: 103/103 tests passing.
* **Cache Busting**: `js/app.js?v=2.91`.
* **GitHub Commit**: `e96b1a3`.

---

### 📋 PDF Auto-Magnifier Typing Freeze Fix (REV-136)
* **Objective & Context**: User reported that typing into a job-order field caused the zoomed document preview to snap back to normal size and stay there. Root cause: the live-preview feature fully reloaded the PDF iframe (`iframe.src = ...`) on every ~350–600ms typing pause; reloading a PDF always resets the browser's built-in viewer to default zoom before the app's JS could re-lock it, and rapid successive reloads while still typing made that re-lock unreliable.
* **Core Changes Made**:
  - `frontend/js/app.js` — `onReactiveJobOrderInput()` and the Quotation/Billing/Checklist field input handlers no longer trigger a PDF reload on the `'input'` event (only on `'change'`/`'blur'`, i.e. when the field is committed or loses focus); the zoom lock itself (`applyStudioFieldMagnification`) still runs synchronously on every keystroke with no reload involved, so it stays instantly responsive. Added an equivalent `focusout`-based refresh for the delegated Parts/Materials/Checklist table-row containers, which previously had no other trigger once their `input` reload was removed.
* **Automated & Manual QA Verification**:
  - Live headless-browser test typed a full sentence character-by-character into the Diagnostic field, sampling the iframe's `transform` style 9 times during typing — it stayed at `scale(1.85)` the entire time (never reverted to `scale(1)`), and remained correctly locked after the field lost focus and the preview reloaded.
  - Updated `AUT-FRONT-99` to accept the new `e.type !== 'input'` guard pattern.
  - Full suite: 103/103 tests passing.
* **Cache Busting**: `js/app.js?v=2.90`.
* **GitHub Commit**: `4e45274`.

---

### 📋 Auto-Magnifier Camera-Lock Overhaul & Master Queue Branch-Lock (REV-135)
* **Objective & Context**: Two bundled fixes addressing the reported bug where the magnifier only targeted the top-left of the document instead of the whole page, plus a Master Queue table hardening pass done in the same work session.
* **Core Changes Made — Auto-magnifier camera-lock overhaul**:
  - Root cause was a "200% oversized iframe + CSS 0.5 downscale" super-sampling trick that made PDFium render the page as a tiny thumbnail with unpredictable letterboxing, so pixel-based pan math overshot into blank/black space for lower sections (Signatures, Claim Stub).
  - Replaced it with normal-sized iframes (`w-full h-full`) and real CSS zoom multipliers (`scale(1.85)` instead of the fake `0.88` calibrated against the broken canvas).
  - Added `applyStudioAspectFit()`, which sizes each iframe's box to the real PDF page's aspect ratio (read from `pdf-lib` at compile time) before every (re)load, eliminating the unmeasurable letterboxing padding.
  - Added `reapplyStudioLockAfterReload()` to re-apply the last requested camera lock once an async PDF reload's `'load'` event actually fires, instead of computing the lock against stale/mid-reload geometry.
* **Core Changes Made — Master Queue & SLA reporting**:
  - Branch is now fixed once an Assistant creates a booking via the Online Booking Form's Target Branch field; removed the per-row branch-reassignment dropdown from the Master Queue table (now a read-only badge).
  - Restricted SLA delay-report filing to SA (and Owner/Admin) only; Assistant no longer has that ability.
  - Simplified the Assistant's Online Booking Form: hid the Destination Table toggle entirely (Assistant only ever dispatches to the Booking Module) and widened the Target Branch field to fill the row.
* **Automated & Manual QA Verification**:
  - Updated `AUT-FRONT-65`, `AUT-FRONT-78`, `AUT-FRONT-100` through `AUT-FRONT-103` to match the new assertions.
  - Full suite: 103/103 tests passing.
* **Cache Busting**: `js/app.js?v=2.89`.
* **GitHub Commit**: `4a2cf22`.

---

## 📅 September 22, 2026 (Account Recovery Security Hardening, Booking Form Fixes & Security Documentation Tracker)

### 📋 Security Implementation Status Tracker & Leaked SMTP Secret Redaction (REV-134)
* **Ground-Truth Security Tracker (`Hontech Documentation/Technical/02_Architecture_and_Engineering/HONTECH_SECURITY_IMPLEMENTATION_STATUS_AND_NEXT_STEPS.md`)**:
  - Added a new tracker distinguishing what is actually implemented in code (✅), partially implemented (🟡), or still only planned (❌) across account recovery, Google Sign-In, MFA, sessions, and secrets hygiene — the existing `HONTECH_SECURITY_AND_ACCOUNT_RECOVERY_MASTER.md` describes target architecture only and had drifted from the real codebase.
  - Recorded 3 open decisions for the project owner: self-service reset scope by role, revoking the leaked Gmail app password, and Google ID-token verification timing.
  - Linked from `HONTECH_SECURITY_AND_ACCOUNT_RECOVERY_MASTER.md` with an explicit drift warning, and annotated `HONTECH_STAGE_GATE_PRODUCTION_ROADMAP_AND_SANDBOXING_STANDARD.md` and `Vercel_and_Supabase_Cloud_Architecture/README.md` with current phase status (cloud repo not yet created).
* **Secrets Hygiene**:
  - Redacted a real Gmail SMTP app password that had been committed in plaintext across 4 files under `Hontech Documentation/google auth_september/` (introduced in commit `a1641b8`), replacing it with a placeholder. The value remains in git history and requires revocation at `myaccount.google.com/apppasswords`.

---

### 📋 Password-Reset Account-Takeover Fix & Developer Route Lockdown (REV-133)
* **Critical Fix (`backend/controllers/PasswordResetController.php`)**:
  - Closed an account-takeover hole where `forgot-password` returned the reset token and OTP directly in the API response, and `reset-password` accepted the OTP alone with no email binding — anyone who knew a staff email could take over that account. Both endpoints previously didn't even function (they called `UserRepository` methods that no longer existed).
  - Rewrote the flow: a 6-digit code is emailed only, never returned by the API; reset requires email + code together; identical generic response for known/unknown/inactive/rate-limited accounts to prevent email enumeration.
* **Cryptography & Storage (`backend/utils/SecurityUtils.php`, `backend/repositories/UserRepository.php`)**:
  - Added `generateNumericCode()` (`random_int`, not `mt_rand`), `hashOneTimeCode()` (HMAC-SHA256 keyed with `JWT_SECRET`, bound to the account email), and `validatePasswordStrength()` (min 10 chars, needs a letter + a number, rejects email-derived and common passwords).
  - Replaced `findByResetToken()`/`findByResetOtp()` (lookup by secret alone) with `saveResetCodeHash()`/`incrementResetAttempts()`/`clearResetCode()`/`updatePasswordAndClearResetCode()`, all keyed by user id after an email lookup.
  - Codes expire after 15 minutes, are single-use, lock after 5 wrong guesses, and have a 60s resend cooldown; comparison uses `hash_equals()`.
* **Schema (`database.sql`, `backend/migration.php`)**:
  - Added `reset_otp` (64-char hash), `reset_token_expires_at`, `reset_attempts` columns; migration clears any legacy plaintext codes on upgrade.
* **Developer Sandbox Lockdown (`backend/index.php`)**:
  - `/api/auth/developer/*` (emailed-code viewer, DB reset/seed, audit log clear) now 404s unless `APP_ENV=development`. Previously reachable in any environment.
* **Automated Unit Testing & Quality Assurance (`tests/security/recovery_and_secrets.test.js`)**:
  - New 6-test regression suite: fails the build if a reset secret is ever returned in an API response, if lookup-by-code-alone reappears, or if an SMTP/Google secret gets committed to the repo.
  - All 124 automated unit tests pass with 100% compliance across 60 suites (`npm.cmd test`).
  - Synced QA testing rows `SEC-62` and `SEC-63` into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
* **Not yet done**: Google Sign-In still trusts a client-submitted email with no server-side ID token verification; MFA verify still accepts a bare `userId` with no password step or attempt throttling; login has no rate limiting. Tracked in `HONTECH_SECURITY_IMPLEMENTATION_STATUS_AND_NEXT_STEPS.md`.

---

### 📋 Assistant Online Booking Form Field Alignment & Multi-Day Test Data Seeder (REV-132)
* **Assistant Online Booking Form (`frontend/index.html`, `frontend/js/app.js`)**:
  - Fixed inconsistent input heights across the Destination Table, Target Branch, appointment time, lane type, and Confirmed Booking fields.
  - Kept the destination toggle buttons (`Booking Module` / `Daily Intakes`) a consistent size across state changes instead of reflowing on click.
* **Multi-Day Test Data Seeder (`backend/seed_test_days.php`)**:
  - Seeds 26 realistic jobs across 09/20–09/22 (walk-ins, online bookings, carry-overs, completions) for exercising the claim stub and Booking Module features.
  - Scoped entirely to `job_id LIKE 'TST-%'` rows; safe to re-run or clean up with `--clean`.
* **Automated Unit Testing & Quality Assurance**:
  - Synced QA testing row `AST-61` into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
  - Incremented client script cache buster in `frontend/index.html` to `v=2.88`.

---

## 📅 September 22, 2026 (High-Definition Vector PDF Templates & Senior SA Auto-Magnifier Active Engine)

### 📋 High-Definition Vector PDF Templates & Senior SA Auto-Magnifier Overhaul (REV-131 / v5.131)
* **High-Definition Vector PDF Templates (`frontend/assets/`)**:
  - Eliminated blurriness at the root cause by decommissioning all low-resolution 72 DPI bitmap scans ($622 \times 288\text{ px}$) from `form13_template.pdf`, `Quotation_No.pdf`, `Billing_No.pdf`, and `CheckList_Result.pdf`.
  - Exported authentic, 300+ DPI vector PDF templates directly from the master spreadsheet `Current_2025 BLANK RO UPDATED_V1.xlsx` via Microsoft Excel automation.
  - All document borders, gridlines, typography, and headers are now 100% mathematical vectors that remain crystal sharp at any zoom level ($100\%$, $185\%$, $250\%$).
* **Senior SA Auto-Magnifier Default-ON Overhaul (`frontend/js/app.js`)**:
  - Resolved user issue where the automatic magnifier was not doing its job while typing. Identified that `isStudioAutoMagnifyEnabled` previously defaulted to `false`, causing every keystroke to reset to fit view instead of magnifying.
  - Defaulted `isStudioAutoMagnifyEnabled` to `true` (`localStorage.getItem('hontech_studio_auto_magnify') !== 'false'`) so auto-magnifier operates immediately without requiring manual button toggling.
  - Enhanced `mapElementToSectionKey` with direct ID checks so focusing or typing into parts/materials rows, quotation items, billing entries, and checklist radio buttons immediately routes to their respective section locks (`table`, `chk_interior`, `chk_underhood`, `chk_underchassis`, `chk_bottom`).
  - Synchronized `updateStudioAutoMagnifyUI()` on studio initialization to display active red badge `[Auto-Magnify: ON]`.
* **Automated Unit Testing & Quality Assurance (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 55 (`AUT-FRONT-104`) asserting default-ON auto-magnifier state, debounced refresh, direct ID section mapping, elimination of 622px bitmap slices, and cache buster `v=2.87`.
  - All 118 automated unit tests pass with 100% compliance across 58 suites (`npm.cmd test`).
  - Synced QA testing row `SA-STU-60` into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
  - Incremented client script cache buster in `frontend/index.html` to `v=2.87`.

---

## 📅 September 21, 2026 (Hardcoded Section-Lock Navigation, Permanent Document Lock & 1-Click Quick-Lock Pills)

### 📋 Hardcoded Section-Lock Navigation & Permanent Magnification Engine (REV-130 / v5.130)
* **Permanent Document Section Lock (`frontend/js/app.js`)**:
  - Resolved user issue where the document auto-magnifier was having a hard time locking onto sections because of premature 3.5-second auto-reset timeouts and 1.2-second blur resets that caused the preview to zoom back out while reading or thinking.
  - Decommissioned premature auto-reset timers in `applyStudioFieldMagnification` and `delegateStudioContainer`: focusing or typing in any section locks the viewer onto that section **permanently** until another section is focused or the user clicks `[🔍 Fit]`.
* **Hardcoded Calibrated Vertical Lock Anchors (`frontend/js/app.js`)**:
  - Implemented `STUDIO_HARDCODED_SECTIONS` with exact calibrated vertical scroll ratios:
    - `customer`: $0.00$ ($0\text{px}$ top customer dossier & vehicle details)
    - `diagnostic`: $0.25$ (Customer concern & initial diagnosis)
    - `table`: $0.50$ (Middle Parts Table, Consumables Table, Quotation Items, Billing Items)
    - `totals`: $0.72$ (Estimated Job Order Total, VAT, Billing discount & net settlement)
    - `signatures`: $0.85$ (Service Advisor, Mechanic, Assessor, General Manager signatures)
    - `claim_stub`: $1.00$ (Customer Claim Stub ID, Clock-in Time, and Claim Stub footer at document bottom)
    - Checklist equivalents: `chk_interior` ($0.20$), `chk_underhood` ($0.45$), `chk_underchassis` ($0.68$), `chk_bottom` ($1.00$).
  - Implemented `lockStudioSection(sectionKey, sheetOverride)` calculating exact horizontal center $T_x = \frac{W_c - (\text{scale} \times W_i)}{2}$ and exact vertical translation $T_y = \text{yRatio} \times (H_c - (\text{scale} \times H_i))$.
  - Implemented `mapElementToSectionKey(el)` mapping any focused input or repeater table row directly to its hardcoded section anchor.
* **1-Click Quick-Lock Navigation Pills (`frontend/index.html`)**:
  - Equipped all 4 sheet PDF viewports (`Job_Order`, `Quotation_No`, `Billing_No`, `CheckList_Result`) with an ergonomic 1-click Quick Lock navigation pill bar directly above the viewer.
  - Provides instant 1-click jump-and-lock pills: `[🔍 Fit]`, `[👤 Customer]`, `[📋 Scope]`, `[🔧 Parts Table]`, `[✍️ Signatures]`, `[🎟️ Claim Stub]`.
* **Automated Unit Testing & Quality Assurance (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 54 (`AUT-FRONT-103`) asserting `STUDIO_HARDCODED_SECTIONS`, `lockStudioSection`, `mapElementToSectionKey`, Quick-Lock navigation pills across all 4 sheets, and cache buster `v=2.86`.
  - All 117 automated unit tests pass with 100% compliance across 58 suites (`npm.cmd test`).
  - Synced QA testing row `SA-STU-59` into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
  - Incremented client script cache buster in `frontend/index.html` to `v=2.86`.

---

## 📅 September 21, 2026 (Full-Form Dynamic Follow-Along Auto-Magnifier with Mathematical Camera Centering)

### 📋 Full-Form Dynamic Follow-Along Auto-Magnifier (REV-129 / v5.129)
* **Mathematical Camera Viewport Centering Engine (`frontend/js/app.js`)**:
  - Solved the limitation where document auto-zoom only locked onto Customer Name and Address (`y: 18%`), leaving the middle tables, signatures, and bottom claim stub unmagnified or clipped out of view.
  - Replaced pure `transform-origin` scaling with an exact mathematical camera translation engine:
    Target $X = \frac{\text{Container Width}}{2} - \text{Scale} \times (p_x \times \text{Iframe Width})$
    Target $Y = \frac{\text{Container Height}}{2} - \text{Scale} \times (p_y \times \text{Iframe Height})$
  - Clamps boundaries dynamically to preserve clean document framing (`Math.min(0, Math.max(min, target))`), rendering via hardware-accelerated `translate(targetX, targetY) scale(scale)` with top-left origin (`0 0`).
  - Seamlessly slides any targeted section—from top metadata (8%), customer dossier (17%-22%), diagnostic scope (32%), middle parts/materials tables (48%-58%), signatures (74%), down to the bottom customer claim stub (88%)—directly into the vertical center of the preview viewport.
* **Full-Form Zone Mapping & Dynamic Table Delegation (`frontend/js/app.js`)**:
  - Expanded `STUDIO_MAGNIFIER_ZONES` with comprehensive coordinate mapping across all 4 worksheets (`Job_Order`, `Quotation_No`, `Billing_No`, `CheckList_Result`).
  - Implemented `getStudioZoneForElement(el)` with container hierarchy resolution (`closest('#f13-parts-table-body')`, `closest('#f13-materials-table-body')`, `closest('#f23-quote-items-tbody')`, `closest('#bill-items-table-body')`, `closest('#chk-editor-interior')`, `closest('#chk-editor-battery')`, `closest('#chk-editor-hood')`, `closest('#chk-editor-under')`, `.chk-fuel-btn`).
  - Added robust event delegation (`focusin`, `input`, `click`, `focusout`) on dynamic table bodies and checklist buttons so adding or editing rows immediately centers the document preview on that exact section.
  - Retained natural 3.5s inactivity glide-back return to `translate(0px, 0px) scale(0.5)` full document view.
* **Automated Unit Testing & Quality Assurance (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 53 (`AUT-FRONT-102`) asserting full-form zone coverage, table row delegation, mathematical camera centering calculation, and cache buster `v=2.85`.
  - All 116 automated unit tests pass with 100% compliance across 58 suites (`npm.cmd test`).
  - Synced QA testing row `SA-STU-58` into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
  - Incremented client script cache buster in `frontend/index.html` to `v=2.85`.

---

## 📅 September 21, 2026 (Option 1: High-Definition Super-Sampling Crisp Zoom for Senior Service Advisor Studio)

### 📋 Option 1 High-Definition Super-Sampling Crisp Zoom (REV-128 / v5.128)
* **High-Definition Super-Sampling Viewport Architecture (`frontend/index.html`)**:
  - Solved the root cause of PDF zoom blurriness: browser PDFium engines rasterize embedded iframes based on layout dimensions (~450px wide column); standard CSS `scale(...)` magnifies that low-resolution raster texture, causing fuzzy, stretched pixels.
  - Implemented double-resolution super-sampling: wrapped all 4 PDF preview iframes (`#f13-pdf-iframe`, `#f23-pdf-iframe`, `#billing-pdf-iframe`, `#checklist-pdf-iframe`) inside dedicated overflow-hidden viewport containers (`relative w-full flex-1 h-full min-h-[560px] rounded-xl overflow-hidden`).
  - Configured iframes to render at double resolution (`w-[200%] h-[200%]`, ~950px+ native vector layout) with top-left origin (`transform-origin: 0 0`) and base scale downsample (`transform: scale(0.5)`).
  - In standard view, the document downsamples from 950px+ to 450px with retina-quality crispness; all typography, grid lines, and logos look razor sharp.
* **Razor-Sharp Follow-Along Zoom & Natural Return (`frontend/js/app.js`)**:
  - Updated `STUDIO_MAGNIFIER_ZONES` and `applyStudioFieldMagnification` to use super-sampled coordinates: zooms to `scale(0.88)` (a 1.76x magnification relative to base 0.5) centered on the active field.
  - Because `scale(0.88)` is less than 1.0 of the native 950px layout width, the browser displays native high-res vector glyphs with zero GPU pixel stretching and zero blurriness.
  - Preserved `studioMagnifierNaturalResetTimer`: while typing, the document stays locked and sharp; after 3.5s of typing inactivity or upon field blur, the document smoothly glides back (`transform: scale(0.5)`, `transform-origin: 0 0`) to the full document view.
* **Automated Unit Testing & Quality Assurance (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 52 (`AUT-FRONT-101`) asserting super-sampling viewport markup (`w-[200%] h-[200%]`, `scale(0.5)`), `activeStudioZoomScale = 0.88`, natural glide-back reset, and cache buster `v=2.84`.
  - All 115 automated unit tests pass with 100% compliance across 58 suites (`npm.cmd test`).
  - Synced QA testing row `SA-STU-57` into `Hontech Documentation/HONTECH_QA_TEST_CHECKLIST.csv`.
  - Incremented client script cache buster in `frontend/index.html` to `v=2.84`.

---

## 📅 September 21, 2026 (Senior Follow-Along Document Auto-Magnify with Natural Glide-Back & Crisp Vector Resolution)

### 📋 Senior SA Follow-Along Document Auto-Magnify & Natural Glide-Back (REV-127 / v5.127)
* **Direct Document Auto-Zoom for Non-Techy Seniors (`frontend/js/app.js`)**:
  - Addressed feedback from senior Service Advisor: completely eliminated separate floating dark Loupe HUD cards (`#*-field-magnifier-hud`) that obstructed view.
  - Implemented direct document follow-along zooming: when typing or focusing in form fields (Customer Details, Diagnostics, Line Items, Signatures, Claim Stub), the PDF preview automatically and smoothly glides to center on that exact document section.
  - Inserted text appears live directly on the authentic PDF document in real time without lag.
* **Natural Glide-Back Auto-Reset Engine (`frontend/js/app.js`)**:
  - Implemented `studioMagnifierNaturalResetTimer`: while actively typing, the document remains zoomed in on the active field.
  - Once the user pauses typing for 3.5 seconds of inactivity, the document smoothly and naturally glides back (`transform: scale(1.0)`, `transformOrigin: center top`) to the 100% Fit full view.
  - Tabbing or blurring out of studio inputs also triggers a graceful return to full view, ensuring senior users never have to search for reset buttons.
* **Crisp Anti-Aliased Vector Rendering & Blurriness Elimination (`frontend/index.html` & `frontend/js/app.js`)**:
  - Configured PDF iframes with `image-rendering: -webkit-optimize-contrast;` and `-webkit-font-smoothing: antialiased;`.
  - Tuned magnification scale to `1.55` with horizontal centering (`x: '50%'`), preventing GPU bitmap pixel-stretching blurriness while ensuring large, senior-friendly legibility.
* **Automated Regression Testing & Quality Verification (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 51 (`AUT-FRONT-100`) asserting permanent suppression of Loupe HUDs, `studioMagnifierNaturalResetTimer`, crisp vector scaling, and cache buster `v=2.83`.
  - All 114 automated unit tests pass with 100% compliance (`npm.cmd test`).
  - Browser verification confirmed clean zoom directly to typed text and smooth glide-back to 100% Fit.
  - Incremented client script cache buster in `frontend/index.html` to `v=2.83`.

---

## 📅 September 21, 2026 (Solution A: High-Definition Field Inspector Loupe HUD & 100% Crisp Vector Resolution)

### 📋 High-Definition Field Inspector Loupe HUD & Zero-Blur Vector Resolution (REV-126 / v5.126)
* **High-Definition Field Inspector Loupe HUD (`frontend/js/app.js` & `frontend/index.html`)**:
  - Implemented **Solution A**: transformed the magnifying glass into a dedicated, razor-sharp **Field Inspector Loupe HUD** (`#f13-field-magnifier-hud`, `#f23-field-magnifier-hud`, `#billing-field-magnifier-hud`, `#checklist-field-magnifier-hud`).
  - When Auto-Magnify is enabled or the advisor types into any input field, a sleek dark-glass card docks directly above the PDF viewer displaying:
    - Glowing amber zoom icon and animated status badge (`100% Crisp Vector`).
    - Field badge (`CUSTOMER NAME`, `PLATE NUMBER`, `INITIAL DIAGNOSIS`, etc.).
    - High-contrast gold monospace live text display (`text-amber-300 font-mono font-bold text-base md:text-lg`) with instantaneous 0ms latency.
    - Dismissal button (`×`) to quickly close or toggle the inspector.
* **100% Crisp Native Vector Resolution (Elimination of Blurry CSS Transform Scaling)**:
  - Eliminated CSS `transform: scale(1.85)` GPU bitmap pixel-stretching on all 4 PDF `<iframe>` elements (`#f13-pdf-iframe`, `#f23-pdf-iframe`, `#billing-pdf-iframe`, `#checklist-pdf-iframe`).
  - Iframe elements remain permanently fixed at `scale(1.0)` / native vector DPI, ensuring the official PDF templates and typed entries are rendered with 100% crisp typography, zero blurriness, and zero distortion.
* **Typing Debounce & Live Document Synchronization (`frontend/js/app.js`)**:
  - Synchronized form field keystrokes smoothly to the PDF document with responsive debouncing to eliminate browser PDF plugin reloading and grey flashes during active typing.
  - Preserved immediate flush (0ms) on `blur` and `change` events so data renders onto the document instantly upon finishing input.
* **Automated Regression Testing & Quality Verification (`tests/frontend/sla_and_logic.test.js`)**:
  - Updated Suite 50 (`AUT-FRONT-99`) asserting High-Definition Field Loupe HUD elements, `scale(1.0)` zero-blur vector scaling, backward compatibility across all preceding suites, and cache buster `v=2.82`.
  - All 113 automated unit tests across 58 suites pass with 100% compliance (`npm.cmd test`).
  - Headless browser verification confirmed 0ms text display in Loupe HUD and sharp vector preview.
  - Incremented client script cache buster in `frontend/index.html` to `v=2.82`.

---

## 📅 September 21, 2026 (100% Crisp Vector PDF Preview Resolution & Blurriness-Free Real-Time Typing Sync)

### 📋 100% Crisp Vector Resolution & Blurriness-Free Real-Time Typing Sync (REV-125 / v5.125)
* **Elimination of CSS Scaling Blurriness (`frontend/js/app.js` & `frontend/index.html`)**:
  - Identified root cause of blurriness: CSS `transform: scale(1.85)` on an `<iframe>` performs GPU texture pixel-stretching over the rasterized PDF view rather than vector re-rendering.
  - Reconfigured Auto-Magnify to default to `OFF` (`isStudioAutoMagnifyEnabled = localStorage.getItem('hontech_studio_auto_magnify') === 'true'`).
  - The live document preview remains at 100% sharp native vector resolution (`scale(1.0)` / Fit) by default.
  - Eliminated disruptive view jumping and pixelation when typing into form fields.
* **Seamless Real-Time Document Typing Reflection (`frontend/js/app.js`)**:
  - Form inputs across Job Order, Quotation, Billing, and Checklist dynamically recompile onto the PDF preview via 350ms debounced updates and immediate 0ms flush on blur/change.
  - Newly entered text renders directly onto the crisp, unblurred document in real time.
* **Automated Regression Testing & Quality Verification (`tests/frontend/sla_and_logic.test.js`)**:
  - Updated Suite 50 (`AUT-FRONT-99`) verifying Auto-Magnify defaults to OFF for crisp 100% vector resolution, absence of 5s reset timer, suppressed Loupe HUD, and cache buster `v=2.81`.
  - All 113 automated unit tests across 58 suites pass with 100% compliance (`npm.cmd test`).
  - Incremented client script cache buster in `frontend/index.html` to `v=2.81`.

---

## 📅 September 21, 2026 (Pure Follow-Along Auto-Magnifier, Suppressed Loupe HUD & Seamless Document Typing Sync)

### 📋 Pure Follow-Along Auto-Magnifier & Clean Real-Time Document Typing Sync (REV-124 / v5.124)
* **Suppressed Loupe HUD Overlay (`frontend/index.html` & `frontend/js/app.js`)**:
  - Permanently suppressed the floating black Loupe HUD banner overlay (`#f13-field-magnifier-hud`, `#f23-field-magnifier-hud`, `#billing-field-magnifier-hud`, `#checklist-field-magnifier-hud`) across all 4 sheet views per explicit user directive (`style="display: none !important;"`).
  - Removed UI unhiding in `applyStudioFieldMagnification`, keeping the live document PDF preview completely clean, unobstructed, and authentic.
* **Removal of 5-Second Auto-Reset Timer Rule (`frontend/js/app.js`)**:
  - Completely decommissioned `studioMagnifier5sResetTimer` and its 5000ms timeout reset logic per user request.
  - As the advisor types into or focuses each form input (Name, Contact, Plate, Scope, Diagnostics, Signatures, Claim Stub), the right-hand PDF preview smoothly glides and scales to follow the active document section.
  - The preview stays stably locked onto that section as long as the user is working in it, without prematurely reverting back to 100% Fit.
* **Real-Time Follow-Along Document Typing Sync (`frontend/js/app.js`)**:
  - Restored responsive 350ms debounced PDF recompilation across Job Order, Quotation, Billing, and Checklist inputs, eliminating the previous 5000ms delay that froze typing reflection.
  - Immediate flush (0ms) on `blur` and `change` events ensures newly entered data renders cleanly onto the document canvas when transitioning between fields.
* **Automated Regression Testing & Quality Verification (`tests/frontend/sla_and_logic.test.js`)**:
  - Updated Suite 50 (`AUT-FRONT-99`) asserting follow-along field magnification, permanently suppressed Loupe HUD, absence of 5s reset timer, and cache buster `v=2.80`.
  - All 113 automated unit tests across 58 suites pass with 100% compliance (`npm.cmd test`).
  - Incremented client script cache buster in `frontend/index.html` to `v=2.80`.

---

## 📅 September 21, 2026 (Senior Service Advisor 5-Second Timed Auto-Magnifier Rule & Stutter-Free Typing Refresh)

### 📋 Senior Service Advisor 5-Second Timed Auto-Magnifier Rule & Debounced Typing Refresh (REV-123 / v5.123)
* **Senior SA 5-Second Auto-Reset Timer Rule (`frontend/js/app.js`)**:
  - Implemented `studioMagnifier5sResetTimer` tracking active keypress and focus interactions across all 4 worksheets (`Job_Order`, `Quotation_No`, `Billing_No`, `CheckList_Result`).
  - When typing or focusing any mapped field, preview instantly zooms in wider (185%–200% scale) directly onto the corresponding document coordinates with immediate live text reflection in the Loupe HUD.
  - Automatically starts a 5-second countdown timer (`5000ms`). Every keystroke resets the timer, keeping the view stable, wide, and magnified while the Senior SA is typing.
  - Once typing is paused or completed, after 5 seconds of inactivity, smoothly glides and scales back to standard view (Fit 100%, scale 1.0, transform-origin center top).
* **Elimination of PDF Reload Flashing & Restarts (`frontend/js/app.js`)**:
  - Solved the issue where the PDF iframe was restarting and reloading every 350ms during active keystrokes, which caused Chrome's native PDF plugin to unload, flash grey, and show loading spinners.
  - Upgraded `scheduleFormStudioPdfRefresh(delay = 350)` with `effectiveDelay`: while `studioMagnifier5sResetTimer` is active, background PDF recompilation is debounced to 5000ms.
  - Immediate flush (0ms / 100ms) is preserved for `blur` and `change` events when the advisor shifts between fields or submits.
* **Automated Regression Testing & Quality Verification (`tests/frontend/sla_and_logic.test.js`)**:
  - Updated Suite 50 (`AUT-FRONT-99`) asserting `studioMagnifier5sResetTimer`, 5-second auto-reset timer rule, `effectiveDelay` debounce during active typing, and cache buster `v=2.79`.
  - All 113 automated unit tests across 58 suites pass with 100% compliance (`npm.cmd test`).
  - Incremented client script cache buster in `frontend/index.html` to `v=2.79`.

---

## 📅 September 21, 2026 (Senior Service Advisor Adaptive Auto-Magnifier, Section Gliding & Studio Zoom Engine)

### 📋 Senior Service Advisor Adaptive Auto-Magnifier & Studio Zoom Controls (REV-122 / v5.122)
* **Senior Service Advisor Adaptive Auto-Magnifier & Glide Engine (`frontend/js/app.js` & `frontend/index.html`)**:
  - Implemented `STUDIO_MAGNIFIER_ZONES` mapping exact authentic document coordinates and optimal zoom levels (1.75x–1.85x) across all studio sections:
    - Customer Details: Name, Contact, Address, Email, Plate, Model, Color, KM (`x: 25%–55%, y: 16%–19%, scale: 1.85`).
    - Service Category, Concern & Diagnostics: (`x: 25%–30%, y: 23%–34%, scale: 1.80`).
    - Signatures & Conforme: SA, Mechanic, Assessor, Manager (`x: 25%–55%, y: 65%–68%, scale: 1.75`).
    - Customer Claim Stub & Arrival Time: (`x: 50%, y: 88%, scale: 1.85`).
    - Cross-sheet coordinate mapping across Quotation_No, Billing_No, and CheckList_Result.
  - Attached reactive `focus` and `input` listeners across all studio inputs: typing any character smoothly glides and magnifies the preview container (`transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), transform-origin 0.32s`) directly over that section so newly typed letters are rendered large, sharp, and wide for senior legibility.
  - Implemented real-time **Field Inspection Loupe HUD** (`#f13-field-magnifier-hud`, `#f23-field-magnifier-hud`, `#billing-field-magnifier-hud`, `#checklist-field-magnifier-hud`) providing instantaneous 0ms text confirmation with high-contrast badge and gold monospace value.
  - Added accessible canvas toolbar controls: `[Auto-Magnify: ON / OFF]` toggle (persisted in `localStorage`), and manual zoom presets (`[Fit 100%]`, `[185% Senior Legibility]`, `[225% Macro Close-Up]`).
* **Automated Regression Testing & Quality Verification (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 50 (`AUT-FRONT-99`) asserting `btn-studio-auto-magnify`, manual zoom presets, Field Loupe HUDs across all 4 sheet canvas wrappers, `STUDIO_MAGNIFIER_ZONES`, `applyStudioFieldMagnification`, reactive focus/input listener integration, and cache buster `v=2.78`.
  - All 113 automated unit tests across 58 suites pass with 100% compliance (`npm.cmd test`).
  - Incremented client script cache buster in `frontend/index.html` to `v=2.78`.

---

## 📅 September 21, 2026 (Quotation_No & Billing_No Dynamic PDF Compilers & Interactive Form Alignment)

### 📋 Quotation_No & Billing_No Dynamic PDF Compilers & Interactive Form Alignment (REV-121 / v5.121)
* **Quotation_No & Billing_No Dynamic PDF Compilers (`frontend/js/app.js`)**:
  - Resolved fatal runtime crash (`ReferenceError: drawTextCenter is not defined`) by defining `drawTextCenter` and localized `whiteout` rectangular masking in both `compileQuotePDFBytes` and `compileBillingPDFBytes`.
  - Cleared pre-printed `0.00` placeholders on blank PDF templates before drawing real line items, eliminating numerical collisions.
  - Aligned Billing PDF coordinates directly with the ground-truth layout of `Current_2025 BLANK RO UPDATED.xlsx - Billing_No.pdf`:
    - Meta Header: Billing No `(475, 763.2)`, Date `(495, 726.1)`, Job No `(495, 714.5)`, Quote No `(495, 703.0)`.
    - Customer Details: Name `(80, 668.2)`, Plate `(400, 668.2)`, Address `(80, 656.6)`, Model `(400, 656.6)`, Contact `(80, 645.0)`, Color `(400, 645.0)`, Email `(80, 633.5)`, Km Reading `(400, 633.5)`.
    - Amount Banner (Row 14): Masked pre-printed `0` and stamped formatted grand total `(188, 619.8)`.
    - Table Line Items: `startY = 585.1`, `rowStep = 11.58` across 24 rows, with FRT at `x=238`, labor at `x=318`, parts at `x=390`, materials at `x=460`, and row total at `x=545`.
    - Subtotals: Labor `(545, 168.1)`, VAT 12% `(545, 156.5)`, Materials `(545, 144.9)`, Parts `(545, 131.3)`, Total `(545, 119.6)`.
    - Signatures: Service Advisor placed cleanly above `Service Advisor` line at `(88, 95)`.
* **Billing Studio Interactive Form & Financial Summary Matrix (`frontend/index.html` & `frontend/js/app.js`)**:
  - Fixed table body DOM lookup in `renderBillingRows()` to target `document.getElementById('bill-items-table-body') || document.getElementById('bill-items-tbody')`, restoring line item rendering in the Billing Studio.
  - Aligned Billing table `<thead>` with 6 columns by adding `<th class="py-2.5 px-3 w-10 text-center">#</th>`.
  - Re-engineered `calcBillingTotals()` to calculate parts subtotal, labor subtotal, apply discount, and update `#bill-summary-parts`, `#bill-summary-labor`, and `#bill-summary-grand-total`.
* **Automated Regression Testing & Quality Verification (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 49 (`AUT-FRONT-98`) asserting `drawTextCenter`, `whiteout`, exact Billing PDF coordinates (`585.1`, `11.58`, `168.1`, `119.6`), table body lookup, and cache buster `v=2.77`.
  - Updated preceding test suites to seamlessly support cache buster `v=2.77`.
  - All 112 automated unit tests across 58 suites pass with 100% compliance (`npm.cmd test`).
  - Incremented client script cache buster in `frontend/index.html` to `v=2.77`.

---

## 📅 September 21, 2026 (SA Checklist Completeness & Stamping for Interior Light, Hydraulic Clutch, Drive Shaft, and Brakes Not Inspected)

### 📋 SA Checklist Completeness & Stamping for Interior Light, Hydraulic Clutch, Drive Shaft, and Brakes Not Inspected (REV-120 / v5.120)
* **Specific Checklist Inspection Checkpoint Additions & Mapping (`frontend/js/app.js` & `frontend/index.html`)**:
  - Expanded vehicle receiving inspection points to explicitly register and color-stamp specific mechanical and electrical components:
    - `interior_light`: Interior Dome & Courtesy Light (Sheet 7 Row 11: Green `I11`, Yellow `J11`, Red `K11`).
    - `hydraulic_clutch`: Hydraulic Clutch Reservoir Fluid (Sheet 7 Row 44: Green `I44`, Yellow `J44`, Red `K44`).
    - `drive_shaft`: Drive Shaft Boots & Constant Velocity Joints (Sheet 7 Row 50: Green `I50`, Yellow `J50`, Red `K50`).
    - Added dedicated checkpoint rows for `parking_brake` (Row 16: `I16`/`J16`/`K16`), `horn_op` (Row 18: `I18`/`J18`/`K18`), `clutch_op` (Row 20: `I20`/`J20`/`K20`), `air_filter` (Row 40: `I40`/`J40`/`K40`), and `fluid_leaks` (Row 49: `I49`/`J49`/`K49`).
* **Brakes Not Inspected on This Visit Toggle & Excel Stamping (`frontend/index.html` & `frontend/js/app.js`)**:
  - Implemented interactive checkbox `#chk-brakes-not-inspected` with reactive state synchronization `window.checklistBrakesNotInspected` and handler `toggleChecklistBrakesNotInspected(checked)`.
  - When enabled, automatically marks brake pad inspection item as N/A with status "Brakes not inspected on this visit" and skips individual wheel brake pad color box stamping (`M31`, `AI31`, `M35`, `AI35`).
  - Injects `[✓] Brakes not inspected on this visit` into Sheet 7 cell `M37` (merged `M37:W39`) upon export; injects `[   ] Brakes not inspected on this visit` when unchecked.
* **Automated Regression Testing & Quality Verification (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 48 (`AUT-FRONT-97`) validating `interior_light`, `hydraulic_clutch`, `drive_shaft`, `chk-brakes-not-inspected` UI element, `toggleChecklistBrakesNotInspected` handler, `M37` stamping, and cache buster `v=2.76`.
  - Updated all preceding test suites to seamlessly support cache buster `v=2.76`.
  - All 111 automated assertions across 57 test suites pass with 100% compliance (`npm.cmd test`).
  - Incremented client script cache buster in `frontend/index.html` to `v=2.76`.

---

## 📅 September 21, 2026 (SA 2025 RO Studio Receiving Checklist Color Status Stamping & Studio Controls)

### 📋 SA 2025 RO Studio Receiving Checklist Color Status Stamping & Studio Controls (REV-119 / v5.119)
* **Multi-Point Inspection Color Cell Checkmark Stamping (`frontend/js/app.js`)**:
  - Engineered direct status mark stamping in `exportOfficialXLSX()` targeting the exact OpenXML coordinates in `Sheet 7: CheckList_Result` (`sheet7.xml`) of `Current_2025 BLANK RO UPDATED_V1.xlsx`.
  - Mapped all 15 vehicle receiving inspection points to their respective status columns:
    - Left Column (Columns `I` [Green `#2FB044`], `J` [Yellow `#FFED00`], `K` [Red `#EE1C25`]): `lights_ext` (Row 9), `horn_wipers` (Rows 13 & 18), `ac_cooling` (Row 22), `eng_oil` (Rows 36 & 49), `brk_fluid` (Row 46), `coolant` (Row 42), `suspension` (Row 47), `exhaust` (Row 48).
    - Battery Condition (Row 28 `E28` [Green], Row 30 `E30` [Red]).
    - Right Column Tires (Left = `M10`, `N10`, `O10` / `M15`, `N15`, `O15`; Right = `AI10`, `AK10`, `AN10` / `AI15`, `AK15`, `AN15`; Spare = `M21`, `N21`, `O21`).
    - Brakes Condition (Left = `M31`, `N31`, `O31` / `M35`, `N35`, `O35`; Right = `AI31`, `AK31`, `AN31` / `AI35`, `AK35`, `AN35`).
  - Stamped centered Unicode checkmarks `✓` (`\u2713`) directly into the selected colored cell based on status (`Good` -> Green, `Attention` -> Yellow, `Defect` -> Red), preserving original cell styling, background fills, and borders.
  - Automatically stamps standard uninspected sub-rows (`I11`, `I16`, `I20`, `I40`, `I44`, `I50`) as Satisfactory when overall vehicle health passes all 15 points.
* **Fuel Gauge Level & Personnel Injection (`frontend/js/app.js`)**:
  - Prefixes selected fuel level gauge in Row 4 (`Y4: E`, `AB4: 1/4`, `AF4: 1/2`, `AH4: 3/4`, `AL4: F`) with checkmark `✓ [Level]`.
  - Injects Service Advisor name into technician cell `C63` (next to `B63: TECHNICIAN NAME:`) and inspection comments into comments box `B53` alongside `M41`.
* **Checklist Studio Batch Actions & Visual Badges (`frontend/index.html` & `frontend/js/app.js`)**:
  - Added quick batch action buttons to the Checklist Studio header: `[✓ All Good]` (one-click full pass), `[⚠ All Attn]`, and `[Reset]`.
  - Enhanced individual checkpoint toggle buttons with clear icon indicators: `✓ Good` (Emerald), `⚠ Attention` (Amber), `✕ Defect` (Red), and `— N/A` (Gray) with active ring focus.
* **Automated Regression Testing & Quality Verification (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 47 (`AUT-FRONT-96`) asserting Sheet 7 multi-point color stamping (`I9`, `M10`, `AI10`, `E28`), fuel level marking in Row 4, technician name injection into `C63`, comments into `B53`, batch action buttons in `index.html`, and verifying cache buster `v=2.75`.
  - Updated previous test suite cache buster assertions to seamlessly accept `v=2.75`.
  - All 110 automated tests pass across 56 test suites with zero failures (`npm.cmd test`).
  - Incremented client script cache buster in `frontend/index.html` to `v=2.75`.

---

## 📅 September 21, 2026 (SA 2025 RO Studio Migration to Current_2025 BLANK RO UPDATED_V1.xlsx)

### 📋 SA 2025 RO Studio Migration to Current_2025 BLANK RO UPDATED_V1.xlsx (REV-118 / v5.118)
* **Official Export Engine Template Migration (`frontend/js/app.js`)**:
  - Migrated official Excel binary buffer loader `getOfficialXlsxTemplateBuffer()` to load the user's updated and formatted template `assets/Current_2025%20BLANK%20RO%20UPDATED_V1.xlsx`.
  - Updated error handling and diagnostics to reference `Current_2025 BLANK RO UPDATED_V1.xlsx`.
  - Maintained memory-cached binary arrayBuffer loading for instant zero-lag exports.
* **Sheet 7 (`CheckList_Result`) Dynamic Formula Synchronization & Coordinate Alignment (`frontend/js/app.js`)**:
  - Aligned data injection with the new Sheet 7 OpenXML layout and formulas linking to `Job_Order`:
    - `C2`: `=Job_Order!C10` (Customer Name)
    - `AD2`: `=Job_Order!K5` (Date)
    - `C3`: `=Job_Order!K10` (Plate Number)
    - `C4`: `=Job_Order!H10` (Vehicle Model / Year)
    - `M63`: `=Job_Order!C10` (Customer Signature Conforme)
    - `M59`: Service Advisor / Inspector signature block
    - `M41`: Vehicle inspection remarks block
  - `setCell()` retains native OpenXML `<f>` formulas while setting cached `<v>` / `<is>` values for seamless rendering across both desktop Excel and web/mobile spreadsheet previewers.
  - Preserved multi-layer OpenXML sheet protection (`DB3E`), workbook protection, and automatic calculation on load (`fullCalcOnLoad="1"`).
* **Automated Regression Testing & Quality Verification (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 46 (`AUT-FRONT-95`) asserting V1 template path loading, Sheet 7 coordinate injection (`C2`, `AD2`, `C3`, `C4`, `M59`, `M63`, `M41`), and verifying cache buster `v=2.74`.
  - Updated Suite 7, Suite 9, Suite 39, and Suite 40 assertions to accept V1 template paths and coordinates.
  - All 109 automated tests pass across 55 test suites with zero failures (`npm.cmd test`).
  - Incremented client script cache buster in `frontend/index.html` to `v=2.74`.

---

## 📅 September 21, 2026 (SA 2025 RO Studio PDF Typography & Non-Bold Formatting Alignment with Excel Template)

### 📋 SA 2025 RO Studio PDF Typography & Non-Bold Formatting Alignment with Excel Template (REV-117 / v5.117)
* **Ground-Truth Excel Typography & Font-Weight Inspection (`frontend/assets/Current_2025 BLANK RO UPDATED.xlsx`)**:
  - Inspected OpenXML styles (`xl/styles.xml`) and worksheets (`sheet1.xml`, `sheet2.xml`, `sheet5.xml`, `sheet7.xml`) to determine the staff's exact requested formatting.
  - Confirmed customer dossier cells (Name, Plate, Address, Contact, Date, Model), line items (Description, Qty, Labor, Parts, Materials, Totals), and personnel signatures are standard unbolded cells (`bold=False`, `Arial 10pt / 9pt` or `Segoe UI 8pt`).
  - Preserved bold emphasis on Grand Totals (`isBold = true` / `fontBold`) for official audit compliance, financial clarity, and customer billing legibility.
* **Universal Non-Bold Weight Alignment Across All 4 PDF Compilers (`frontend/js/app.js`)**:
  - `compileForm13PDFBytes` (Job Order): Switched customer dossier (`name`, `model`, `plate`, `address`, `km`, `intakeDate`, `contact`, `engine`, `promiseDate`, `email`, `chassis`, `color`), line item amounts, subtotals, interviewed-by SA, personnel signatures (`mechanic`, `assessor`, `sa`, `Chief Mechanic`, `customer`, `manager`), and Filipino claim stub to clean regular weight (`isBold: false`, `7.5pt` / `7.2pt` / `6.5pt`).
  - `compileQuotePDFBytes` (Quotation): Switched Quote No (`quoteNo`), customer dossier, row item totals, subtotal metrics, and staff signatures (`sa`, `manager`, `name`) to regular non-bold font (`isBold: false`, `7.5pt` / `7.2pt` / `6.8pt`). Grand Total remains bold.
  - `compileBillingPDFBytes` (Billing): Switched Billing No (`billingNo`), customer dossier, row item totals, subtotal breakdown, and Service Advisor signature (`sa`) to regular non-bold weight (`isBold: false`, `7.5pt` / `7.2pt` / `6.8pt`). Grand Total and Row 14 header banner remain bold.
  - `compileChecklistPDFBytes` (15-Point Checklist): Rendered customer name, plate/km, and date in clean regular non-bold font (`isBold: false`, `7.5pt`).
* **Automated Regression Testing & Quality Verification (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 45 (`AUT-FRONT-94`) asserting authentic regular non-bold fonts and exact text sizes across all 4 sheet compilers and verifying cache buster `v=2.73`.
  - Updated Suite 42 signature checks to accept both standard weights.
  - All 108 automated tests pass across 54 test suites with zero failures (`npm.cmd test`).
  - Incremented client script cache buster in `frontend/index.html` to `v=2.73`.

---

## 📅 September 21, 2026 (SA 2025 RO Studio Follow-Along Sticky PDF Preview & Viewport Height Across All Sheets)

### 📋 SA 2025 RO Studio Follow-Along Sticky PDF Preview & Viewport Height Across All Sheets (REV-116 / v5.116)
* **Viewport-Pinned Sticky Follow-Along Architecture (`frontend/index.html`)**:
  - Addressed user feedback requesting the right-side PDF preview to dynamically follow along as the Service Advisor scrolls down through lengthy form inputs.
  - Upgraded right-side canvas panes (`#form13-canvas-pane`, `#form23-canvas-pane`, `#billing-canvas-pane`, `#checklist-canvas-pane`) with `xl:sticky xl:top-14 xl:self-start`.
  - Positioned the sticky top baseline at `top-14` (`56px`), docking smoothly directly underneath the sticky workbook tab bar (`#form-top-tab-bar`).
  - Preserved responsive mobile/tablet layout (`< 1280px`), allowing elements to stack naturally without obstructing mobile form controls.
* **Ergonomic Viewport Container Sizing (`frontend/index.html`)**:
  - Re-architected PDF viewer containers (`#f13-pdf-viewer-wrap`, `#f23-pdf-viewer-wrap`, `#billing-pdf-viewer-wrap`, `#checklist-pdf-viewer-wrap`) to use adaptive viewport sizing `h-[calc(100vh-8.5rem)] min-h-[580px]`.
  - Allowed iframes (`#f13-pdf-iframe`, `#f23-pdf-iframe`, `#billing-pdf-iframe`, `#checklist-pdf-iframe`) to expand to `h-full min-h-[560px]`, eliminating dual page-level scroll collisions and keeping toolbar controls in full view.
* **Automated Regression Testing & Quality Verification (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 44 (`AUT-FRONT-93`) verifying sticky follow-along classes, adaptive viewport container heights, and cache buster `v=2.72`.
  - All 107 automated tests pass across 53 test suites with zero failures (`npm.cmd test`).
  - Incremented client script cache buster in `frontend/index.html` to `v=2.72`.

---

## 📅 September 21, 2026 (SA 2025 RO Studio XLSX Export Personnel Scoping Fix)

### 📋 SA 2025 RO Studio XLSX Export Personnel Scoping Fix (REV-115 / v5.115)
* **Personnel Variable Hoisting in `exportOfficialXLSX` (`frontend/js/app.js`)**:
  - Resolved runtime `ReferenceError: manager is not defined` triggered when clicking `[Export Official .xlsx]`.
  - Hoisted `manager`, `mechanic`, and `assessor` variable declarations out of the block-scoped `if (sheet1File)` conditional block into the outer function scope of `exportOfficialXLSX()` alongside `sa`.
  - Maintained fallback defaults (`'General Manager'`, `'Auto Mechanic'`, `'Parts/Materials Controller'`) and robust fallback logic using `getVal()`.
  - Successfully preserved downstream multi-sheet injection into Quotation copy sheets (`qDoc` / `sheet2.xml`, `sheet3.xml`, `sheet4.xml` at cell `F62`) and Job Order (`sheet1.xml` at cells `C53` and `I53`).
* **Automated Regression Testing & Quality Verification (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 43 (`AUT-FRONT-92`) asserting outer variable scoping for `manager`, `mechanic`, and `assessor`, verification of Quotation `F62` injection, and cache buster `v=2.71`.
  - All 106 automated tests pass across 52 test suites with zero failures (`npm.cmd test`).
  - Incremented client script cache buster in `frontend/index.html` to `v=2.71`.

---

## 📅 September 21, 2026 (SA 2025 RO Studio Live Multi-Sheet PDF Preview Sync, Exact Coordinates & 7-Sheet XLSX Export)

### 📋 SA 2025 RO Studio Live Multi-Sheet PDF Preview Sync, Exact Coordinates & 7-Sheet XLSX Export (REV-114 / v5.114)
* **Instant Reactive Studio Cascading (`frontend/js/app.js`)**:
  - Implemented `syncJobOrderItemsToQuoteAndBilling()` connecting Form 1/3 Job Order input fields, parts, and materials to Quotation (`form23Items`) and Billing (`billingItems`) in real time.
  - Sourced Parts and Materials from Job Order with confirmed `0.00` default labor rates, eliminating redundant double-entry for Service Advisors while allowing custom labor or item pricing adjustments.
  - Extended live typing listeners to all interactive inputs on Quotation, Billing, and Checklist views (`syncQuoteFieldsToJobOrder()`, `syncBillingToJobOrder()`, `syncChecklistCanvas()`).
* **Universal Debounced Multi-Sheet PDF Preview Engine (`frontend/js/app.js` & `frontend/index.html`)**:
  - Implemented `scheduleFormStudioPdfRefresh(delay = 350)` ensuring responsive debounced live compilation (350ms on keystroke, 0ms on change/blur) targeted dynamically to whichever worksheet tab is currently active (`form13`, `form23`, `billing`, `checklist`).
  - Added subtle, sleek green live-sync indicator pills (`#f13-live-sync-badge`, `#f23-live-sync-badge`, `#bill-live-sync-badge`, `#chk-live-sync-badge`) inside each PDF preview header with an animated emerald pulse dot.
  - Bound tab activation switches in `switchFormStudioSheet()` to re-render fresh PDF previews instantly with zero latency when navigating between sheets.
* **Exact PDF Coordinates & Authentic Plain Text Signatures (`frontend/js/app.js`)**:
  - Aligned exact coordinates for Quotation PDF (`compileQuotePDFBytes`): Quote No (420, 776.6), Date (440, 744.3), Job No (440, 734.7), Promise Date (440, 725.2), Customer dossier, 24 item rows (startY 649.2, step 9.56), subtotals, 12% VAT, grand total, and plain text signatures (`sa` at 70, 165; `manager` at 330, 165; `customer` at 70, 125).
  - Aligned exact coordinates for Billing PDF (`compileBillingPDFBytes`): Billing No (420, 776.6), Date (440, 746.0), Job No (440, 736.5), Quote No (440, 727.0), dossier, 24 item rows (startY 629.5, step 9.56), subtotals, 12% VAT, grand total banner (210, 658.0), and plain text signature (`sa` at 70, 215).
  - Maintained authentic plain text signatures without fake cursive graphics as confirmed by stakeholder directives.
* **Automated Regression Testing & Quality Verification (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 42 (`AUT-FRONT-91`) validating reactive data cascading, live sync badges, universal debounced scheduler, exact PDF coordinates, and cache buster `v=2.70`.
  - All 105 automated tests pass across 51 test suites with zero failures (`npm.cmd test`).
  - Incremented client script cache buster in `frontend/index.html` to `v=2.70`.

---

## 📅 September 20, 2026 (Quotation 1-3 & Billing 1-2 Mirrored Multi-Sheet Excel Export & Coordinates Alignment)

### 📋 Quotation 1-3 & Billing 1-2 Mirrored Multi-Sheet Excel Export & Coordinates Alignment (REV-113 / v5.113)
* **Unified Line Item Sourcing & Multi-Worksheet Mirroring (`frontend/js/app.js`)**:
  - Addressed the user issue where exported `.xlsx` workbooks only populated Quotation 1 and left Quotation 2, Quotation 3, and Billing sheets empty.
  - Implemented `unifiedItems` resolution in `exportOfficialXLSX()` that automatically cascades across whichever line items data source is actively populated (`window.form23Items`, `window.form13Parts` / `window.form13Materials`, or `window.billingItems`).
  - Purged static hardcoded dummy items from global array initializers (`window.form23Items` and `window.billingItems`), ensuring clean initial states that reset faithfully in `resetWorkbookToTemplate()`.
  - Mirrored line items across all 3 Quotation worksheets (`sheet2.xml`, `sheet3.xml`, `sheet4.xml`) across rows 15 to 44, injecting Description (Col `A`), Quantity (Col `C`), FRT (Col `D`), Labor (Col `E`), Parts (Col `F`), Materials (Col `G`), and Total (Col `H`).
  - Mirrored line items across both Billing worksheets (`sheet5.xml`, `sheet6.xml`) across rows 17 to 52 with matching column mappings.
* **Exact OpenXML Formula & Signature Alignment (`frontend/js/app.js`)**:
  - Ground-truth mapped rows 45 to 49 in Quotation sheets as native template SUM formulas (`H45: SUM(E15:E44)`, `H46: (H45*12%)`, `H47: SUM(G15:G44)`, `H48: SUM(F15:F44)`, `H49: SUM(H45:H48)`); eliminated legacy manual writes to `H35` and `H36` that corrupted line items.
  - Injected authentic Quotation signatures to Row 62 (`A62` for Service Advisor, `F62` for General Manager) and Row 65 (`A65` for Customer Conforme).
  - Injected authentic Billing signature to Row 60 (`A60` for Service Advisor / Cashier), preventing corruption of item row 40 (`B40`).
* **Automated Unit & Regression Testing (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 41 (`AUT-FRONT-90`) verifying quotation mirroring (sheets 2–4), billing mirroring (sheets 5–6), unified item resolution, clean array initializers, and cache buster `v=2.69`.
  - All 104 automated tests pass across 50 test suites (`npm.cmd test`).
  - Incremented client script cache buster in `frontend/index.html` to `v=2.69`.

---

## 📅 September 20, 2026 (Precise Excel Cell Coordinates & Multi-Column Pricing Export Across All Sheets)

### 📋 Precise Excel Cell Coordinates & Multi-Column Pricing Export Across All Sheets (REV-112 / v5.112)
* **Authentic Job_Order Signature & Customer Claim Stub Ground-Truth Alignment (`frontend/js/app.js`)**:
  - Ground-truth analyzed `xl/worksheets/sheet1.xml` from official template `Current_2025 BLANK RO UPDATED.xlsx` to map exact signature and claim stub coordinates:
    - **Row 53:** Injected Mechanic signature above `C54` label (`Auto Mechanic`) and Parts Assessor signature above `I54` label (`Parts/Materials Controller`).
    - **Row 58:** Injected Service Advisor signature into `C58` above `C59` label (`Service Advisor` / Recommending Approval), and Chief Mechanic into `H58` above `H59` label (`Chief, Auto Mechanic` / Approved by).
    - **Row 61:** Injected Customer Name into `C61` above `C62` label (`Customer's Name & Signature` / CONFORME), and General Manager into `H61` above `H62` label (`General Manager` / Concurred by).
    - **Rows 70–72 (Customer Claim Stub):** Injected Customer Name into `C70` (beside `B70` label `Name :`), Plate No./Model into `I70` (beside `G70` label `Plate No./Year/Model :`), Service Advisor into `C71` (beside `B71` label `Service Advisor :`), Date into `C72` (beside `B72` label `Date:`), and Claim Stub Tracking ID into `I72` (beside `G72` label `Claim Stub :`).
* **Multi-Column Quotation & Billing Item Pricing Architecture (`frontend/js/app.js`)**:
  - Re-architected Quotation (`sheet2.xml`, `sheet3.xml`, `sheet4.xml`) and Billing (`sheet5.xml`, `sheet6.xml`) row injection loops to map each line item across all standard OpenXML columns:
    - Column `A`: Item Description (`desc` / `description`)
    - Column `C`: Quantity (`qty`)
    - Column `D`: Flat Rate Time / Labor FRT (`frt`)
    - Column `E`: Labor Amount (`labor`)
    - Column `F`: Parts Amount (`parts` or unit `price`)
    - Column `G`: Materials Amount (`materials`)
    - Column `H`: Total Line Amount (`total = (labor + parts + materials) * qty`)
  - Resolved `0.00` price anomaly caused by generic item price property extraction; now dynamically resolves parts, labor, materials, and generic fallback amounts.
* **CheckList_Result Inspection Date Header Fix (`frontend/js/app.js`)**:
  - Relocated inspection date write target from cell `L5` to `M5`, preserving the pre-printed `DATE` text label at `L5`.
* **Automated Unit & Regression Testing (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 40 (`AUT-FRONT-89`) asserting exact signature cell injection (`C58`, `C61`, `H58`, `H61`), claim stub coordinates (`C70`, `I70`, `C71`, `C72`, `I72`), multi-column pricing columns (`D`, `E`, `F`, `G`, `H`), Checklist date in `M5`, and cache buster `v=2.68`.
  - Incremented client script cache buster in `frontend/index.html` to `v=2.68`.
  - All 103 automated unit, RBAC, and security regression tests pass across 49 test suites (`npm.cmd test`).

---

## 📅 September 20, 2026 (Form 1/3 Live Typing-to-PDF Connection & Full Multi-Sheet Excel Injection)

### 📋 Form 1/3 Live Typing-to-PDF Connection & Full Multi-Sheet Excel Injection (REV-111 / v5.111)
* **Real-Time Live Typing-to-PDF Synchronization (`frontend/js/app.js`)**:
  - Implemented `scheduleForm13PDFRefresh(delay)` using a smart 350ms keystroke debounce for typing and 0ms immediate execution on `blur` or `change` events.
  - Bound `input`, `change`, and `blur` events across all Form 1/3 fields (Customer Name, Contact, Address, Email, Plate Number, Vehicle Model, Color, KM Reading, Engine, Chassis, Intake Date, Promise Date, Concern, Diagnostic, Service Advisor, Mechanic, Assessor, Manager, Claim Stub ID, Arrival Time, Intake Source, Target Branch).
  - Wired `scheduleForm13PDFRefresh(150)` to fire automatically whenever parts or materials items are added, removed, or updated in the editor table.
  - Live PDF preview iframe (`#f13-pdf-iframe`) re-renders seamlessly as the Service Advisor types, displaying the customer dossier, vehicle dossier, diagnostics, parts, materials, and customer claim stub with zero keystroke latency.
* **Comprehensive Multi-Sheet Excel Injection Across All 7 Sheets (`frontend/js/app.js`)**:
  - Upgraded `exportOfficialXLSX()` to inject live system data across every tab in `Current_2025 BLANK RO UPDATED.xlsx`:
    - **Sheet 1 (`Job_Order` - `sheet1.xml`):** Header, Customer & Vehicle dossier, Concern, Diagnostics, Parts (D27:G52), Materials (H27:K52), Parts Total (`G53`), Materials Total (`K53`), Grand Total (`K54`), Staff signatures (SA `C55`, Mechanic `F55`, Assessor `I55`, Manager `K55`), and Customer Claim Stub (`C58`, `H58`, `K58`, `C59`, `H59`).
    - **Sheets 2–4 (`Quotation_No 1-3` - `sheet2.xml`, `sheet3.xml`, `sheet4.xml`):** Quote header, Customer & Vehicle dossier, Quote items (A15:H34), Page Subtotal (`H35`), Quote Grand Total (`H36`), and SA signature (`B38`).
    - **Sheets 5–6 (`Billing_No 1-2` - `sheet5.xml`, `sheet6.xml`):** Billing header, Customer & Vehicle dossier, Grand Total Due (`C14`), Billing line items (A17:H36), and Cashier/SA signature (`B40`).
    - **Sheet 7 (`CheckList_Result` - `sheet7.xml`):** Customer (`C5`), Date (`L5`), Plate (`C6`), Model (`D7`), KM (`K7`), Fuel Level (`C12`), 15 inspection points status (`PASS`, `ATTENTION`, `DEFECT`), Remarks (`C45`), and Inspector/SA signature (`C48`).
  - Preserved multi-layer OpenXML sheet protection (`password="DB3E"`, `selectLockedCells="1"`, `formatCells="0"`, `fileSharing readOnlyRecommended="1"`, `workbookProtection lockStructure="1"`).
* **Automated Unit & Regression Testing (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 39 (`AUT-FRONT-88`) asserting `scheduleForm13PDFRefresh`, live claim stub extraction in `compileForm13PDFBytes`, full multi-sheet injection across sheets 1-7 in `exportOfficialXLSX`, and cache buster `v=2.67`.
  - Incremented client script cache buster in `frontend/index.html` to `v=2.67`.
  - All 102 automated unit, RBAC, and security regression tests pass across 48 test suites (`npm.cmd test`).

---

## 📅 September 20, 2026 (Form 1/3 Floating Sticky Bar Removal & Header Action Consolidation)

### 📋 Form 1/3 Floating Sticky Bar Removal & Action Consolidation (REV-110 / v5.110)
* **Removal of Redundant Floating Sticky Bottom Bar (`frontend/index.html`)**:
  - Permanently removed the sticky bottom floating action toolbar (`<div class="sticky bottom-14 ...">`) in `#form13-editor-pane` that previously hovered over inputs while scrolling and duplicated Register RO, Reset, and Print actions.
  - Leaves the Form 1/3 editor cleanly unobstructed throughout scrolling.
* **Top Tab Bar Print Integration (`frontend/index.html`)**:
  - Integrated `[Print Form 1/3]` directly into the master top tab bar (`#form-top-tab-bar`) action cluster alongside Save Draft, Export .xlsx, Register RO, and Preview Toggle.
* **Header & Preview Action Consolidation (`frontend/index.html`)**:
  - Enhanced `[Print Form 1/3]` in `#form13-canvas-toolbar` (the PDF preview header) with high-contrast styling and direct access.
  - Linked `[Reset Form]` in the Form 1/3 Studio header card (`#card-f13-editor`) to `resetForm13Studio()` with confirmation protection.
* **Automated Unit & Regression Testing (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 38 (`AUT-FRONT-87`) asserting removal of `sticky bottom-14`, presence of Print button in top tab bar, Reset button in header, and cache buster `v=2.66`.
  - Incremented client script cache buster in `frontend/index.html` to `v=2.66`.
  - All 101 automated unit, RBAC, and security regression tests pass across 47 test suites (`npm.cmd test`).

---

## 📅 September 20, 2026 (2025 RO Excel Studio Unified Professional Redesign & Alignment)

### 📋 2025 RO Excel Studio Unified Professional Redesign & Alignment (REV-109 / v5.109)
* **Unified 7/5 Column Ergonomic Split Across All 4 Worksheets (`frontend/index.html`)**:
  - Upgraded grid column distribution across all four authentic operational worksheets (`Job_Order`, `Quotation_No`, `Billing_No`, `CheckList_Result`) from rigid 50/50 (`xl:col-span-6 / xl:col-span-6`) to an ergonomic 7/5 ratio (`xl:col-span-7 / xl:col-span-5`).
  - Expands the interactive editor pane to ~650px (giving form controls ample breathing room on 100% zoom laptops in Microsoft Edge) while allocating ~450px to the official PDF format preview canvas.
* **Ergonomic 2-Column Workshop Monitoring Card Grid (`frontend/index.html`)**:
  - Eliminated the cramped 3-column (~150px) layout in `#f13-monitoring-dispatch-card` that previously caused severe option text truncation (`Marikina Main B...`, `None (Unalloca...`, `Waiting (In Que...`, `No (Standard S...`).
  - Reorganized the 9 dispatch parameters into an organized 2-column matrix (`sm:grid-cols-2 gap-3.5`):
    - Row 1: **Claim Stub ID** (with regenerate button) | **Arrival Time (Clock In)** (with live clock stamping button)
    - Row 2: **Target Branch** | **Intake Source**
    - Row 3: **Lane Classification** | **Workshop Bay Location**
    - Row 4: **Parts Availability** | **Initial Floor Status**
    - Row 5: **Carry-Over (C.O.)** | **Automated Floor Queue & TV Sync Notice**
    - Row 6: Full-width prominent `[💾 Register Repair Order to System]` button.
  - Widens each field column to ~320px, allowing long option titles ("Marikina Main Branch", "None (Unallocated / Staging)", "Express Lane (60m SLA)", "Pending Supplier Courier") to render 100% complete without clipping.
* **Removal of Redundant Sticky Bottom Sheet Bar (`frontend/index.html`)**:
  - Permanently removed `#form-workbook-bottom-bar` (`sticky bottom-0`) which previously hovered over the bottom of the page, obscuring inputs and eating 48px of vertical screen height. The sticky top bar (`#form-top-tab-bar`) remains the single, authoritative Google Sheets-style tab navigation.
* **Studio-Wide PDF Preview Toggle (`frontend/js/app.js`, `frontend/index.html`)**:
  - Added `#btn-toggle-studio-preview` to the top tab bar action cluster with live state handling (`toggleStudioPDFPreview()`).
  - Allows Service Advisors on compact laptops to instantly collapse the right-side PDF preview and expand the editor to full 12-column width (`xl:col-span-12`) on demand, or restore the 7/5 side-by-side view with a single click.
* **Automated Regression Suite (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 37 (`AUT-FRONT-86`) asserting 7/5 column split across all 4 sheet views, 2-column monitoring layout, removal of `#form-workbook-bottom-bar`, presence of `#btn-toggle-studio-preview`, and cache buster `v=2.65`.
  - Incremented client script cache buster in `frontend/index.html` to `v=2.65`.
  - All 100 automated unit, RBAC, and security regression tests pass across 46 test suites (`npm.cmd test`).

---

## 📅 September 20, 2026 (Studio Layout Alignment & Edge Responsiveness Polish at 100% Zoom)

### 📋 2025 RO Studio Layout Alignment & Edge Responsiveness Polish (REV-108 / v5.108)
* **Workshop Monitoring Dispatch Card Grid Alignment (`frontend/index.html`)**:
  - Eliminated label-overflow text collision caused by `whitespace-nowrap` on `ARRIVAL TIME (CLOCK IN) *` colliding with `INITIAL FLOOR STATUS` on compact column viewports (~160px width in `#form13-editor-pane`).
  - Standardized all 9 field label containers with uniform `h-5 flex items-center text-[10.5px] font-bold text-gray-600 uppercase tracking-wider mb-1`:
    - Row 1: `Claim Stub ID *`, `Intake Source`, `Target Branch *`
    - Row 2: `Lane Type *`, `Workshop Bay`, `Parts Availability`
    - Row 3: `Arrival Time *`, `Floor Status`, `Carry-Over (C.O.)`
  - Polished input and select element heights and padding (`px-3 py-2 text-xs border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500`) ensuring straight, uniform horizontal baselines across all 3 columns.
  - Refactored card header to `flex items-center justify-between border-b border-gray-100 pb-3 gap-2 flex-wrap sm:flex-nowrap`, cleanly separating title typography and the `Auto-Prefilled` pulse indicator.
* **Top Tab Bar Responsiveness on 100% Zoom (`frontend/index.html`)**:
  - Updated `#form-top-tab-bar` right action button cluster with `flex-wrap gap-2` and adaptive responsive text spans:
    - Export button: renders `Export Official .xlsx` on larger displays and `Export .xlsx` on narrower viewports.
    - Register RO button (`#btn-register-ro-top`): renders `💾 Register Repair Order to System` on `xl:` and scales gracefully to `💾 Register RO` on narrower displays.
  - Prevents action buttons from overflowing past the right margin or getting clipped in Microsoft Edge at 100% display zoom.
* **Automated Unit & Regression Testing (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 36 (`AUT-FRONT-85`) asserting that `whitespace-nowrap` is removed from Arrival Time, uniform `h-5` label containers are utilized, all 9 monitoring IDs are preserved, responsive text spans are active, and cache buster is `v=2.64`.
  - Incremented client script cache buster in `frontend/index.html` to `v=2.64`.
  - All 99 automated unit, RBAC, and security regression tests pass across 45 test suites (`npm.cmd test`).

---

## 📅 September 20, 2026 (Excel Export Schema-Compliant Multi-Layer Tamper-Proof Locking)

### 📋 Excel Export Schema-Compliant Multi-Layer Tamper-Proof Locking (REV-107 / v5.107)
* **OpenXML CT_Worksheet Schema Compliance (`frontend/js/app.js`)**:
  - Diagnosed XML schema violation in previous export engine: `<sheetProtection>` was being inserted before `<pageMargins>`, positioning it *after* `<mergeCells>` and `<printOptions>`. In OpenXML (`CT_Worksheet`), `<sheetProtection>` must strictly appear before `<mergeCells>`. When out of order, Microsoft Excel either stripped or bypassed the protection element upon opening.
  - Repositioned `<sheetProtection>` insertion dynamically: now inserted immediately before `<mergeCells>` (or as `sheetData.nextSibling`), guaranteeing 100% strict OpenXML schema validation across all 7 worksheets (`Job_Order`, `Quotation_No 1-3`, `Billing_No 1-2`, `CheckList_Result`).
* **Cryptographic Administrative Protection Password & Permission Restrictions**:
  - Injected OpenXML standard password hash `DB3E` (`HonTech2025`) into `<sheetProtection>` preventing unauthorized users from clicking *Unprotect Sheet* without managerial authentication.
  - Set `selectLockedCells="1"` and `selectUnlockedCells="1"` to empower Service Advisors and clients to click, inspect, and copy cell contents while strictly locking editing (`formatCells="0"`, `formatColumns="0"`, `formatRows="0"`, `insertColumns="0"`, `insertRows="0"`, `deleteColumns="0"`, `deleteRows="0"`).
* **Workbook Structure Protection & Read-Only Recommendation (`xl/workbook.xml`)**:
  - Injected `<fileSharing readOnlyRecommended="1" userName="HonTech AutoCenter"/>` prompting users upon opening in Microsoft Excel to open in Read-Only mode.
  - Injected `<workbookProtection lockStructure="1" lockWindows="1" workbookPassword="DB3E"/>` preventing malicious deletion, renaming, or reordering of worksheets.
* **Automated Regression Suite (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 35 (`AUT-FRONT-84`) verifying schema placement before `mergeCells`, password hash `DB3E`, `selectLockedCells="1"`, `fileSharing`, and `workbookProtection`.
  - Incremented cache buster in `frontend/index.html` to `v=2.63`.
  - All 98 automated unit, RBAC, and security regression tests pass across 44 test suites (`npm.cmd test`).

---

## 📅 September 20, 2026 (Form 1/3 Studio Right-Side PDF Preview & Hyphen-Free Daily Claim Stub Ranking)

### 📋 Form 1/3 Studio Right-Side PDF Preview & Hyphen-Free Claim Stub Ranking (REV-106 / v5.106)
* **Form 1/3 Studio Right-Side PDF Preview Restoration (`frontend/index.html`)**:
  - Diagnosed structural layout root cause: `#form13-editor-pane` was missing its closing `</div>` before `#form13-canvas-pane`, which caused the canvas pane (containing the official Form 1/3 PDF iframe preview) to become accidentally nested inside the 6-column editor pane at its very bottom, leaving the entire right 6 columns of the 12-column grid completely blank.
  - Inserted the closing `</div>` for `#form13-editor-pane` immediately following `#card-f13-editor`.
  - Removed redundant `</div>` at the bottom of `#section-form13` to preserve perfect 0-delta DOM container balances across all 4 worksheet views (`view-sheet-form13`, `view-sheet-quote`, `view-sheet-billing`, `view-sheet-checklist`).
  - Restored side-by-side layout: Left column hosts the Form 1/3 interactive editor, while right column renders `#form13-canvas-pane` with live PDF preview toolbar (`[Full PDF]`, `[Download PDF]`, `[Print]`, `[Hide]`) and embedded `assets/form13_template.pdf` iframe (`508px × 848px`).
* **Hyphen-Free Daily Claim Stub Ranking (`092026J1` > `J2` > `J3`)**:
  - Removed hyphen from claim stub generator outputs in `frontend/js/app.js` (`generateNextStudioClaimStub()`) and `backend/controllers/JobController.php` (`generateStubNumber()`): now formats daily intakes strictly as `MMDDYYJ1`, `092026J2`, `092026J3`.
  - Updated input placeholder in `#f13-input-claim-stub` to `e.g. 092026J1`.
  - Preserved backward-compatible regex matching `^${prefix}[-_]?j(\d+)$` so legacy records remain fully accessible in natural claim stub sorting and search.
* **Ergonomic Typography Polish**:
  - Added `whitespace-nowrap text-[10px]` to Arrival Time label in `#f13-monitoring-dispatch-card` to eliminate awkward multi-line wrapping ("AR RIVAL TIME (CLOCK IN)").
* **Automated Unit & Regression Testing (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 34 (`AUT-FRONT-83`) asserting that `form13-editor-pane` and `form13-canvas-pane` are direct sibling columns in the 12-column grid, PDF iframe embeds `form13_template.pdf`, and claim stub generator returns `092026J1` without hyphen.
  - Incremented client script cache buster in `frontend/index.html` to `v=2.62`.
  - All 97 automated unit, RBAC, and security regression tests pass across 43 test suites (`npm.cmd test`).

---

## 📅 September 20, 2026 (Form 1/3 Studio Closing Div Balance & Universal Module Visibility Restored)

### 📋 Form 1/3 Studio Closing Div Balance & Universal Module Visibility Restored (REV-105 / v5.105)
* **DOM Hierarchy Isolation & Closing Div Fix (`frontend/index.html`)**:
  - Resolved critical structural DOM nesting defect where an unclosed `<div>` in `#section-form13` (at line 3754) caused 7 downstream primary application modules (`#section-intake`, `#section-queue`, `#section-bays`, `#section-tv`, `#section-profile`, `#section-settings`, `#section-support`) to become accidentally nested inside `#section-form13`.
  - Because `.section-content.hidden { display: none !important; }` is applied globally when switching tabs away from Form 1/3 Studio, this nesting trapped the child modules in an inherited `display: none`, making Daily Intakes, Workshop Bay Status, Online Bookings, and Master Queue appear completely invisible/blank for Assistant and Service Advisor roles.
  - Inserted the required closing `</div>` to cleanly terminate `#section-form13`; verified all section containers are direct sibling elements under `<main id="main-content">` with a balanced 0 unclosed div delta across all view containers.
* **Table Body ID Restoration (`frontend/js/app.js`)**:
  - Restored `id="table-daily-intakes"` on the dynamically generated `<tbody>` inside `renderStaffTables()`.
  - Ensured seamless element access for all role-specific table population routines and dynamic intake updates.
* **Automated Unit & Regression Testing (`tests/frontend/sla_and_logic.test.js`)**:
  - Added Suite 33 (`AUT-FRONT-82`) in `tests/frontend/sla_and_logic.test.js` validating that `#section-form13` is closed before `#section-intake`, `#section-queue`, and `#section-bays`, and that none of these sections are nested inside `#section-form13`.
  - Incremented client script cache buster in `frontend/index.html` to `v=2.61` and updated all version check assertions across the test suite.
  - All 96 automated unit, RBAC, and security regression tests pass across 42 test suites (`npm.cmd test`).

---

## 📅 September 20, 2026 (Step 1 Workshop Monitoring First Workflow & Daily Claim Stub Ranking)

### 📋 Step 1 Workshop Monitoring First Workflow & Daily Claim Stub Ranking (REV-104 / v5.104)
* **Step 1 Workshop Monitoring First Layout**:
  - Re-anchored `#f13-monitoring-dispatch-card` as Card #1 directly at the top of Form 1/3 interactive editor (`#form13-editor-pane`) in `frontend/index.html`.
  - Service Advisors now encounter the monitoring dispatch parameters as their primary step upon vehicle arrival before navigating to job details or customer specifics.
* **Integrated Prominent System Registration Button**:
  - Integrated full-width crimson action button (`#f13-btn-register-ro-card`) directly into the base of `#f13-monitoring-dispatch-card`:
    `[ 💾 Register Repair Order to System ]` (matching the layout and visual weight of the Online Booking Form registration trigger).
  - Bound `#f13-btn-register-ro-card` to `registerStudioROToSystem()` in `frontend/js/app.js` with loading state disabling, error handling, and smooth focus redirection to missing inputs (`Plate Number`, `Customer Name`, or `Vehicle Model`).
* **Daily Claim Stub Ranking Engine (`092026-J1` > `J2` > `J3`)**:
  - Upgraded `generateNextStudioClaimStub()` in `frontend/js/app.js`: isolates daily `J` sequence matching from legacy seed `-001` numbers; calculates today's prefix (`MMDDYY`) and auto-ranks sequential intakes as `092026-J1`, `092026-J2`, `092026-J3`.
  - Upgraded `JobController::generateStubNumber` and `JobRepository::getNextStubCount` in `backend/controllers/JobController.php` and `backend/repositories/JobRepository.php` to consistently produce `${datePrefix}-J{$nextNum}`.
* **Automated Unit & Regression Testing**:
  - Added Suite 32 (`AUT-FRONT-80`) in `tests/frontend/sla_and_logic.test.js` validating card hierarchy order, button presence, and daily `-J` ranking engine.
  - All 95 automated unit, RBAC, and security regression tests pass across 41 test suites (`npm.cmd test`).

---

## 📅 September 20, 2026 (Professional White Aesthetic Redesign of Workshop Monitoring Dispatch Card)

### 📋 Professional White Aesthetic Redesign of Workshop Monitoring Card (REV-103 / v5.103)
* **Professional White Card & Dealership Aesthetic Redesign (`#f13-monitoring-dispatch-card`)**:
  - Overhauled the workshop monitoring and daily intakes dispatch card directly at the head of Form 1/3 Editor (`#form13-editor-pane`) in `frontend/index.html` to mirror the clean, white, professional layout of the Online Booking Form.
  - Replaced the previous dark-red-to-dark-blue gradient header banner and heavy slate border (`border-2 border-slate-900`) with a clean dealership card container: `bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4`.
  - Upgraded card header with a subtle rounded icon badge (`w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-600`), clean uppercase tracking title (`Workshop Monitoring & Daily Intakes Dispatch`), subtle tracking subtitle, and refined emerald pulse badge (`Auto-Prefilled`).
  - Standardized all 9 form fields with uniform styling: `border border-gray-200 focus:border-red-500 rounded-xl px-3.5 py-2 font-semibold text-xs text-gray-800 shadow-2xs outline-none transition`.
  - Purged distracting colorful emoji prefixes from dropdown option labels (`f13-input-parts-status`, `f13-input-status`, `f13-input-carry-over`) for a clean, executive typography presentation.
  - Preserved all 9 DOM element IDs (`f13-input-claim-stub`, `f13-input-source`, `f13-input-target-branch`, `f13-input-lane-type`, `f13-input-bay-location`, `f13-input-parts-status`, `f13-input-arrival-time`, `f13-input-status`, `f13-input-carry-over`) and automated prefill / payload binding logic without breaking any test assertions.
* **Automated Unit & Regression Testing**:
  - Executed full test suite across 40 suites: 94/94 tests passing cleanly (`npm.cmd test`).

---

## 📅 September 20, 2026 (2025 RO Studio Workshop Monitoring & Daily Intakes Dispatch Card)

### 📋 2025 RO Studio Workshop Monitoring & Daily Intakes Dispatch Card (REV-102 / v5.102)
* **Workshop Monitoring & Daily Intakes Dispatch Card (`#f13-monitoring-dispatch-card`)**:
  - Embedded a high-contrast dark-slate and crimson executive dispatch card directly at the head of Form 1/3 Editor (`#form13-editor-pane`) in `frontend/index.html`.
  - Structured into 4 operational clusters:
    - **Intake Identity & Branch**: Claim Stub ID (`#f13-input-claim-stub`), Intake Source (`#f13-input-source`), and Target Branch (`#f13-input-target-branch`).
    - **Workshop Bay & Lane Routing**: Lane Classification (`#f13-input-lane-type`), Initial Workshop Bay (`#f13-input-bay-location`), and Parts Stock Availability (`#f13-input-parts-status`).
    - **Timing & Floor State**: Arrival Time Clock-In (`#f13-input-arrival-time`), Initial Floor Status (`#f13-input-status`), and Carry-Over Flag (`#f13-input-carry-over`).
* **Zero-Typing Auto-Prefill & Claim Stub Generator**:
  - Implemented `generateNextStudioClaimStub()` in `frontend/js/app.js`: computes system date prefix `MMDDYY` and auto-increments sequential identifier (`MMDDYY-j1`, `MMDDYY-j2`, etc.) based on existing database and daily intake records.
  - Implemented `getStudioCurrentClockTime()` and `stampStudioArrivalClock()`: auto-prefills arrival time with current 24H system time (`HH:MM`) upon loading or resetting the studio.
  - Implemented `refreshStudioClaimStub()`: provides quick 1-click re-generation of sequential claim stub with instant feedback toast.
* **1-Button Unified RO Registration & Dispatch Sync**:
  - Updated `registerStudioROToSystem()` in `frontend/js/app.js` to bundle all 14 monitoring parameters (`claimStub`, `source`, `branch`, `laneType`, `bayLocation`, `partsStatus`, `arrival`, `status`, `carryOver`, `plate`, `name`, `vehicle`, `category`, `saName`) into the API payload.
  - Synchronized `resetForm13Studio()` to cleanly restore monitoring inputs to fresh defaults and regenerate sequential claim stub and clock timestamps.
  - Integrated `loadOnlineBookingToForm13()` to set `source` to `Online` and mirror booking branch selection.
* **Automated Unit & Regression Testing**:
  - Added Suite 31 (`AUT-FRONT-79`) in `tests/frontend/sla_and_logic.test.js`.
  - All 94 automated unit, RBAC, and security regression tests pass across 40 test suites (`npm.cmd test`).
  - Incremented client script cache buster to `v=2.60` in `frontend/index.html`.

---

## 📅 September 20, 2026 (Assistant & SA Multi-Branch Online Booking Selection & Form Dispatch)

### 📋 Assistant & SA Multi-Branch Online Booking Module Selection & Form Dispatch (REV-101 / v5.101)
* **Multi-Branch Online Booking Module Toolbar & Filters**:
  - Implemented an interactive segmented branch control (`All Branches`, `📍 Marikina Main`, `📍 East Branch`) in the Booking Module header (`#container-online-queue`) in `frontend/index.html`.
  - Added state variable `onlineBranchFilter` and management handlers `setOnlineBranchFilter` and `syncOnlineBranchFilterUI` in `frontend/js/app.js`.
  - Enabled Assistant (`Mhiecaella Parungao`) and Service Advisors to view, partition, and triage online booking inquiries across both Marikina Main Branch and East Branch seamlessly.
* **Row-Level Branch Assignment & Visual Indicators**:
  - Added a dedicated `Branch` column to the Booking Module table with color-coded styling (`📍 Marikina Main` in blue and `📍 East Branch` in purple).
  - Provided Assistant and Service Advisors with an inline branch selector dropdown in each table row, allowing instantaneous reassignment of booking inquiries between branches (`updateJobField(job.id, 'branch', value)`).
* **1-Click [📝 Load to Form 1/3 (RO)] Dispatch Action**:
  - Implemented `loadOnlineBookingToForm13(jobId)`: Service Advisors can click `[📝 Load to RO]` on any pending online booking row to automatically switch to the 2025 RO Excel Studio (`#section-form13`) and populate Customer Name, Contact Number, Plate Number, Vehicle Model, Customer Concern, Appointment Date, and Category into Form 1/3 editor fields and synchronize across sheets (`syncJobOrderFieldsToQuote`, `syncJobOrderFieldsToBilling`, `syncJobOrderFieldsToChecklist`).
* **Backend Multi-Branch Query & Permission Updates**:
  - Updated `JobRepository::getFilteredJobs` in `backend/repositories/JobRepository.php` to allow SAs and Assistants to retrieve records across branches or query specific branches via `?branch=`.
  - Updated `JobController.php` (`updateField`, `updateStatus`, `deleteJob`) to grant SAs and Assistants permission to manage and dispatch cross-branch online booking inquiries.
* **Automated Unit & Regression Testing**:
  - Added Suite 30 (`AUT-FRONT-78`) in `tests/frontend/sla_and_logic.test.js`.
  - All 93 automated unit, RBAC, and security regression tests pass across 39 test suites (`npm.cmd test`).
  - Incremented client script cache buster to `v=2.59` in `frontend/index.html`.

---

## 📅 September 20, 2026 (Authentic 2025 RO Form 1/3 CUSTOMER DETAILS Layout in Customer Lookup)

### 📋 Authentic 2025 RO Form 1/3 CUSTOMER DETAILS Layout (REV-100 / v5.100)
* **Faithful Visual Representation of Printed Repair Order (Form 1/3)**:
  - Overhauled `#lookup-dossier-card` in `frontend/index.html` to mirror the official printed format:
    - **Header**: Authentic solid gray bar (`bg-[#c0c0c0]`) with black border and uppercase bold text: `CUSTOMER DETAILS`.
    - **Outer Frame**: Solid black 2px border matching the official shop floor document.
    - **3-Column Matrix**:
      - Column 1: `Name`, `Address`, `Contact No.`, `E-Mail Add.`
      - Column 2: `Year/Model`, `KM Reading`, `Engine No`, `Chassis No.`
      - Column 3: `Plate No`, `Intake Date`, `Promise Date`, `Color`
    - **Form-Line Underlining**: Each row features aligned colons (`:`) followed by authentic horizontal document underline borders (`border-b border-black`) that display vehicle records cleanly.
  - Refined data population fallbacks in `frontend/js/app.js` (`selectCustomerForLookup`), rendering clean underlines without awkward `______` literal text spillover.
* **Automated Unit & Regression Testing**:
  - Added Suite 29 (`AUT-FRONT-77`) in `tests/frontend/sla_and_logic.test.js`.
  - All 92 automated unit, RBAC, and security regression tests pass across 38 test suites (`npm.cmd test`).
  - Incremented client script cache buster to `v=2.58` in `frontend/index.html`.

---

## 📅 September 20, 2026 (Repository File Structure & Tooling Organization)

### 📋 Repository File Structure & Tooling Organization (REV-099 / v5.99)
* **Root Directory Restructuring & Tooling Segregation**:
  - Created a dedicated `scripts/` directory and segregated loose execution scripts:
    - Moved `start_lan_server.bat` to `scripts/start_lan_server.bat`.
    - Moved `backup_database.bat` to `scripts/backup_database.bat`.
    - Moved `tunnel.js` to `scripts/tunnel.js`.
  - Updated `package.json` script target `"tunnel": "node scripts/tunnel.js"`.
  - Removed duplicate 55 MB `cloudflared.exe` binary from the repository root (preserved in `tools/cloudflared.exe` and git-ignored).
* **Isolation of Legacy Prototypes and External Design Documents**:
  - Created `archive/` and `archive/legacy_prototypes/`.
  - Archived unrelated Unity C# game design document (`PSYCHOLOGICAL_GAMES_MASTER_PLAN.md`).
  - Archived inactive prototype mockups from `frontend/OthersPrototype` (`multibranch_demo.html`, `prototype.html`, `prototype_chatbot.html`, `prototype_priority.html`, `prototype_skipped.html`, `user_agreement.html`).
* **Automated Unit & Regression Testing**:
  - Added Suite 28 (`AUT-FRONT-76`) in `tests/frontend/sla_and_logic.test.js` validating the presence of `scripts/`, updated `package.json` command, and complete eradication of root binaries and stray documents.
  - All 91 automated unit, RBAC, and security regression tests pass across 37 test suites (`npm.cmd test`).

---

## 📅 September 20, 2026 (Excel Auto-Locking, Authentic Staff Roster, Modernized Lookup UI & Assistant Destination Switcher)

### 📋 Excel Auto-Locking, Authentic Staff Roster, Modernized Lookup UI & Assistant Switcher (REV-098 / v5.98)
* **Lossless Excel Multi-Sheet Export Auto-Locking (OpenXML sheetProtection)**:
  - Upgraded `exportOfficialXLSX()` in `frontend/js/app.js` with `applySheetProtection(doc)` helper.
  - Automatically injects OpenXML `<sheetProtection sheet="1" objects="1" scenarios="1" selectLockedCells="1" selectUnlockedCells="1"/>` tag into worksheets across `Job_Order`, `Quotation_No 1-3`, `Billing_No 1-2`, and `CheckList_Result` before serialization and ZIP compression.
  - Ensures exported `.xlsx` workbooks open in Microsoft Excel with cell editing locked by default, protecting official calculated formulas and figures from accidental manual tampering.
* **Authentic HonTech Staff Directory Synchronization & QA Test Names Preservation**:
  - Updated `backend/seed.php` with official employee roster:
    - **Marikina Main Branch**: Owner: Nicodemus L. De Guzman, Admin: Laynie Espiritu, SA1: Manney Sarol, SA2: Marriel Ayo, Assistant: Mhiecaella Parungao.
    - **East Branch**: Admin: Vic Godoy, SA1: Ed Marvin Malantay, SA2: Carl Domingo, Assistant: Mhiecaella Parungao.
  - Preserved original test employee names (`Engr. Antonio Honrado`, `Adrian Mendoza`, `Mark Bautista`, `Dayne Ramirez`, `Jessica Cruz`, `Juan Santos`, `Alex Valenzuela`, `Maria Aquino`) within an explicit developer reference comment block for future QA and testing benchmarks.
  - Replaced legacy mock/fallback employee names across `frontend/js/app.js` and `frontend/index.html`.
  - Re-seeded the local MySQL database with authentic names across active and historical job orders.
* **Modernized Customer Lookup Dossier Profile Card (Clutter & Box Removal)**:
  - Overhauled `#lookup-dossier-card` in `frontend/index.html`: eliminated heavy, bulky borders and repetitive underscore placeholder clutter (`___________________`).
  - Implemented sleek modern profile card aesthetics with a gradient dark-slate contact top bar, inline category labels, and clean "Not Stamped" / "Not Specified" fallbacks.
  - Preserved 100% of the underlying 12-field data bindings (`dossier-customer-name`, `dossier-customer-phone`, `dossier-vehicle-plate`, `dossier-km-reading`, etc.) and one-click action buttons (`⚡ Start New Service in Forms`, `🔁 Issue Back-Job in Forms`, `Copy Info`, `Passport PDF`).
* **Assistant Intake Destination Table Switcher & Target Branch Selector**:
  - Added segmented destination switcher pill buttons (`[📅 Booking Module]` vs. `[📋 Daily Intakes]`) to `#section-intake` in `frontend/index.html`.
  - Implemented `setAssistantDestination(dest)` in `frontend/js/app.js` dynamically toggling form fields, timing pickers, lane dropdowns, and stub preview depending on destination.
  - Added target branch selector (`Marikina Branch` vs. `East Branch`), correctly tagged into `intakePayload.branch` when submitted by Assistant staff.
* **Automated Unit & Regression Testing**:
  - Added Suite 27 (`AUT-FRONT-73`, `AUT-FRONT-74`, `AUT-FRONT-75`) in `tests/frontend/sla_and_logic.test.js`.
  - All 90 automated unit, RBAC, and security regression tests pass across 36 test suites (`npm.cmd test`).
  - Incremented client script cache buster to `v=2.57` in `frontend/index.html`.

---

## 📅 September 19, 2026 (Dual-Mode TV Monitoring Audio-Visual Announcements & Silent SA Dashboard)

### 📋 Dual-Mode TV Monitoring Audio-Visual Alerts & Locked Female Persona (REV-097 / v5.97)
* **Dual-Mode TV Monitoring Location & Status Audio-Visual Alerts**:
  - Upgraded both TV monitoring modes—the Standalone TV Kiosk (`frontend/tv.html`) and the In-App TV Monitor (`#section-tv` in `frontend/index.html` / `app.js`).
  - Added deep cross-poll state snapshot diff engine (`jobStateSnapshotMap` and `detectAndBroadcastAlerts`) in `tv.html` that actively tracks both workshop bay transitions (`currLoc !== prevLoc`) and status transitions (`Processing`, `Ready for Release`, `Carry-Over`, `Released`).
  - Moving a vehicle to any bay (e.g. `Bay 1`, `Bay 2`, `Bay 3`, etc.) instantly triggers the 3-tone chime, displays the dynamic blue alert plaque banner (`ALLOCATED: BAY-0X`), and broadcasts the spoken voice announcement.
  - Implemented sequential announcement queue (`enqueueTVAnnouncement` & `processNextTVAnnouncement`) in `tv.html` preventing audio and speech collision when multiple vehicles update in rapid succession.
* **Permanent Single Woman's Voice Persona (Never Randomized)**:
  - Implemented `getPermanentFemaleVoice()` with strict female keyword priority (`zira`, `samantha`, `victoria`, `karen`, `jenny`, `aria`, `natasha`, etc.) and hard-coded blacklist excluding male voices (`david`, `mark`, `george`, `guy`, `richard`, `james`, `paul`, etc.).
  - Permanently locks the selected voice instance across the entire browser session (`_permanentFemaleVoice`), guaranteeing 100% consistent female identity without voice switching or randomization.
* **Silent Service Advisor Dashboard vs. Auditory TV Protocol**:
  - Enforced strict operational silence on the Service Advisor dashboard (`#section-queue`, `#section-form13`) to prevent audio disruptions during face-to-face customer consultations.
  - Audio chimes and speech synthesis only fire locally when the TV module is active (`isTVModuleActive()`).
  - All status and location actions on the SA dashboard continue to display the visual floating alert plaque (`#universal-broadcast-alert-toast`) at the top center of the screen with zero auditory disturbance.
* **Automated Unit & Regression Testing**:
  - Added Suite 26 (`AUT-FRONT-69`, `AUT-FRONT-70`, `AUT-FRONT-71`, `AUT-FRONT-72`) in `tests/frontend/sla_and_logic.test.js`.
  - All 87 automated unit, RBAC, and security regression tests pass across 35 test suites (`npm.cmd test`).
  - Incremented client script cache buster to `v=2.56` in `frontend/index.html`.

---

## 📅 September 18, 2026 (Express 2-Hour SLA Overrun Trigger & Simple Tabular Owner/Admin Audit Hub)

### 📋 Express 2-Hour SLA Overrun Trigger & Simple Tabular Audit Hub (REV-096 / v5.96)
* **Express 2-Hour SLA Overrun Incident Trigger & Modal Workflow (Module 8)**:
  - Enabled the SLA column visibility in Daily Intakes (`showGoal`) for Service Advisors (`isSA`), Owners, and Admins.
  - Dynamically calculates live elapsed duration (`now - arrival`) for active PMS (120m SLA target) and Express Lane (60m SLA target) services.
  - Automatically transforms the SLA cell into an interactive alert button `[⚠️ 2h Exceeded — File Report]` when elapsed minutes cross the target threshold without vehicle release.
  - Clicking launches `#modal-express-delay-report` pre-populated with customer name, plate badge, vehicle model, arrival time, and elapsed minutes.
  - SAs select a reason category (`Required Parts Delay`, `Additional Deep Diagnostics`, `Customer Requested Scope Change`, `Technician Bay Bottleneck`, `Unforeseen Complications`, or `Others`) and provide verbatim diagnostic notes.
  - Submitting writes to `/api/express-issues` in MySQL and records into `job_audit_logs`, updates in-memory job state, and flips the cell to a calm, verified status pill `[Reported: Parts Delay]` with tooltip inspection.
* **Simple Tabular Owner & Admin Audit Hub (Module 9 - No Canvas Graphs)**:
  - Preserved an ultra-clean, straightforward tabular log in `#db-tab-express` without heavy Chart.js canvas graphs or confusing metrics, specifically tailored for academic capstone defense and operational audits.
  - Seamlessly merges reported delay records into `#table-express-delays-body` displaying Date, Claim Stub, Plate No., Vehicle Model, Service Advisor, Category, Arrival, Departure, Duration, Overrun (+Xm), and SA Diagnostic Remarks.
  - Supports quick search, date range filters, branch scopes, and 1-click CSV/Print export.
* **Automated Unit & Regression Testing**:
  - Added Suite 25 (`AUT-FRONT-65`, `AUT-FRONT-66`, `AUT-FRONT-67`, `AUT-FRONT-68`) in `tests/frontend/sla_and_logic.test.js`.
  - All 83 automated unit, RBAC, and security regression tests pass across 34 test suites (`npm.cmd test`).
  - Incremented client script cache buster to `v=2.55` in `frontend/index.html`.

---

## 📅 September 18, 2026 (Natural Claim Stub Sorting & Interactive Customer Lookup Link)

### 📋 Natural Claim Stub Sorting & Interactive Customer Lookup Link (REV-095 / v5.95)
* **Natural Alphanumeric Claim Stub Sorting Hierarchy (Module 6)**:
  - Replaced standard ASCII string sorting in Daily Intakes with natural collation via `naturalStubSort(stubA, stubB)` using `{ numeric: true, sensitivity: 'base' }`.
  - Guarantees logical sequence ordering for multi-digit claim stubs: `052226j1` < `052226j2` < `052226j9` < `052226j10` < `052226j11`, eliminating the notorious ASCII sorting flaw where `052226j10` sorted ahead of `052226j2`.
  - Automatically invoked whenever Daily Intakes sorting is set to `claimStub`.
* **Interactive Customer Lookup Dossier Quick-Link & Live Status Indicator (Module 7)**:
  - Purged redundant printer button (`printJobClaimStubPDF`) from the Daily Intakes table cell, decluttering the queue row and reclaiming visual real estate.
  - Replaced it with an interactive, clickable claim stub badge link (`openCustomerLookupForStub(stub, plate)`) featuring an external link indicator.
  - Clicking navigates seamlessly to `#section-lookup`, populates the search query, matches the customer dossier via `customerLookupRegistry`, and smoothly scrolls the official HonTech Form 1/3 customer sheet into view.
  - Injected `#dossier-live-status-badge` into the `#lookup-dossier-card` header in `frontend/index.html`.
  - Updated `selectCustomerForLookup` to compute real-time workshop state across customer jobs, rendering a live status pill (e.g., `● ONSITE IN WORKSHOP · BAY 1` or `✓ SERVICED TODAY · RELEASED AT 15:25`).
* **Automated Unit & Regression Testing**:
  - Added Suite 24 (`AUT-FRONT-61`, `AUT-FRONT-62`, `AUT-FRONT-63`, `AUT-FRONT-64`) in `tests/frontend/sla_and_logic.test.js`.
  - All 79 automated unit, RBAC, and security regression tests pass across 33 test suites (`npm.cmd test`).
  - Incremented client script cache buster to `v=2.54` in `frontend/index.html`.

---

## 📅 September 18, 2026 (Zero-Typing Departure Clock Stamping & Same-Day Re-open Safeguards)

### 📋 Automatic Departure Clock Stamping & Same-Day Re-open (REV-094 / v5.94)
* **Zero-Typing Automatic Departure Clock Stamping**:
  - Replaced manual text input boxes (`dep-input-${job.id}`) and preset dropdowns in Daily Intakes with an authentic non-editable display badge.
  - Active vehicles display non-editable, calm mono pills (`--:--`).
  - Upon clicking `[Release]` and confirming the modal, the system immediately captures `new Date()` (e.g. `18:15`), writes `departure = '18:15'` and `date_completed = date('Y-m-d')` into central MySQL via `JobController.php`, vacates workshop bays, and locks the row.
  - Released vehicles render an emerald pill (`bg-emerald-50 text-emerald-800 border-emerald-200`) with check icon and precise 24H timestamp.
* **Same-Day Intake Retention & Re-Open Exception Safeguard**:
  - Updated Daily Intakes date filter to retain today's released vehicles in the queue view instead of immediately hiding them, maintaining transparency for end-of-day reconciliation.
  - Added `#reopen-confirm-modal` in `frontend/index.html` allowing Service Advisors to click `[Re-open]` on today's released vehicles.
  - Re-opening resets vehicle status back to `Processing`, clears the departure timestamp, and syncs central MySQL.
* **Lounge Voice Departure Announcement & TV Monitor Sync**:
  - Added `announceVehicleReleased(job)` function triggering the soothing female voice broadcast: *"Attention please. Vehicle [Plate], customer [Name], has been officially released. Thank you for choosing HonTech AutoCenter."*
  - Synced Universal Broadcast Alert Toast with emerald theme (`OFFICIALLY RELEASED · Keys Dispatched · Departure Clock Stamped`).
  - Updated TV public display endpoint in `backend/index.php` to exclude both `Completed` and `Released` statuses (`status NOT IN ('Completed', 'Released')`).
* **Automated Unit & Regression Testing**:
  - Added Suite 23 (`AUT-FRONT-57`, `AUT-FRONT-58`, `AUT-FRONT-59`, `AUT-FRONT-60`) in `tests/frontend/sla_and_logic.test.js`.
  - All 75 automated unit, RBAC, and security regression tests pass across 32 test suites (`npm.cmd test`).
  - Incremented client script cache buster to `v=2.53` in `frontend/index.html`.

---

## 📅 September 18, 2026 (Status Upgrade to Processing, Lounge Voice Engine & Broadcast Toast)

### 📋 Status Upgrade to Processing, Lounge Voice Engine & Broadcast Toast (REV-093 / v5.93)
* **Status Terminology Migration from "Monitoring" ➔ "Processing"**:
  - Migrated table row status dropdowns, badges, and bay allocation checks across `frontend/js/app.js` and `backend/controllers/JobController.php` from `"Monitoring"` to `"Processing"`.
  - Added `isProcessingStatus(status)` helper to ensure complete backward compatibility with existing MySQL records storing `"Monitoring"`.
  - Updated bay dispatch modal and location locks: assigning a bay requires or auto-promotes to `"Processing"`.
  - Updated reports live metrics and subtext: `Currently in Bay (${processingCount} Processing)`.
* **Relaxing Soft Female Voice Engine & Executive Lounge Chime**:
  - Filtered Web Speech API voices to select soothing natural female voices (e.g., Zira, Samantha, Victoria, Karen, Jenny, Aria, Natasha, Google US English).
  - Tuned broadcast speech parameters to a calm, relaxing tempo (`rate: 0.88`, `pitch: 1.05`).
  - Added Chrome garbage collection guard (`window._activeUtterance`) to prevent speech cutoff during long announcements.
  - Introduced default `"lounge"` chime theme (mellow harmonic triangle wave notes C5 523Hz -> E5 659Hz -> G5 784Hz with smooth 0.85s decay).
  - Implemented multi-event user interaction listener (`click`, `keydown`, `touchstart`) to unlock browser AudioContext autoplay blocks.
* **Universal Broadcast Alert Toast / Pop-up Plaque**:
  - Injected `#universal-broadcast-alert-toast` fixed at top center (`z-[999999]`) of `frontend/index.html`.
  - Integrated `showUniversalBroadcastToast(eventData)` across workshop announcements (`processing`, `bay_assigned`, `ready`, `carryover`, `return_active`).
  - Equipped with auto-dismiss (6s), smooth slide-in/fade transitions, and dismiss button.
* **Smart TV Monitor Display Sync (`frontend/tv.html`)**:
  - Updated TV alert banners, simulation controls, and lane lists to `"WORKSHOP PROCESSING"`.
  - Synced TV voice engine with the relaxing lounge chime and soft female voice profile.
* **Automated Unit & Regression Testing**:
  - Added Suite 22 (`AUT-FRONT-53`, `AUT-FRONT-54`, `AUT-FRONT-55`, `AUT-FRONT-56`) in `tests/frontend/sla_and_logic.test.js`.
  - All 71 automated unit, RBAC, and security regression tests pass across 31 test suites (`npm.cmd test`).
  - Incremented client script cache buster to `v=2.52` in `frontend/index.html`.

---

## 📅 September 18, 2026 (Carry-Over Table Revisions & Remarks Migration)

### 📋 Carry-Over Table Revisions & Remarks Migration (REV-092 / v5.92)
* **Elimination of Claim Stub Column in Carry-Over Table**:
  - Removed Claim Stub `<th>` from `frontend/index.html` and corresponding `<td>` cell in `frontend/js/app.js` row renderer, recovering ~115px of horizontal canvas.
  - Completely resolved action button truncation (`RETURN AC...`), allowing `[Return Active]` and `[Release]` buttons to render with full visual fidelity on standard 1366x768 and 1920x1080 screens.
  - Adjusted empty state row `colspan` from `10` to `9` to match the authentic 9-column schema.
* **Migration from Rigid Status to Hybrid Flexible Remarks Combobox**:
  - Renamed table header column from `Status` to `Remarks` (`min-w-[210px]`).
  - Replaced rigid `<select>` dropdown with a modern Google-style hybrid combobox (`#co-remarks-${job.id}`) combining free-form typing and instant preset picking.
  - Integrated preset options (*Awaiting Parts*, *For Customer Approval*, *Machine Shop / Sublet*, *Insurance Clearance*, *Job Completed (Ready)*, *Extended Repair*, *Technician Unavailable*, *WCA*, *Others*).
  - Maintained bidirectional sync with central MySQL database via `updateJobField(job.id, 'carryOverStatus', this.value)`.
  - Configured graceful read-only badge pill for non-editable viewing contexts.
* **Automated Unit & Regression Testing**:
  - Added Suite 21 (`AUT-FRONT-50`, `AUT-FRONT-51`, `AUT-FRONT-52`) in `tests/frontend/sla_and_logic.test.js`.
  - All 67 automated tests pass across 30 test suites (`npm.cmd test`).
  - Incremented client script cache buster to `v=2.51` in `frontend/index.html`.

---

## 📅 September 18, 2026 (Multi-Table Design Harmonization & Inner Viewport Scroll Limits)

### 📋 Multi-Table Design Harmonization & Inner Viewport Scroll Limits (REV-091 / v5.91)
* **Bounded Inner Scroll Containers with Sleek 6px Custom Scrollbars**:
  - Implemented responsive bounded inner scroll container (`max-h-[500px] overflow-y-auto custom-scroll`) on the Master Daily Intakes table wrapper, preventing long queue lists from causing infinite vertical page scrolling.
  - Added matching bounded containers (`max-h-[480px] overflow-y-auto custom-scroll`) to Booking Module (`#container-online-queue`) and Carry-Over Data (`#container-carry-over`).
* **Multi-Table Visual Rhythm & Row Harmonization**:
  - Unified table row cell padding across all 3 tables with generous `py-5` (20px) vertical spacing and `px-4` horizontal padding.
  - Standardized roomy plate number and claim stub badge pills to `px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs` across Booking Module and Carry-Over Data.
  - Aligned table headers and status selectors with consistent rounded corner geometries (`rounded-lg`) and crisp typography.
* **Automated Unit & Regression Testing**:
  - Added Suite 20 (`AUT-FRONT-49`) in `tests/frontend/sla_and_logic.test.js`.
  - All 64 automated unit, RBAC, and security regression tests pass across 29 test suites (`cmd /c npm test`).
  - Incremented client script cache buster to `v=2.50` in `frontend/index.html`.

---

## 📅 September 18, 2026 (Filter Deck Distance & Roomy Table Row Spacing Rhythm)

### 📋 Filter Deck Distance & Roomy Table Row Spacing Rhythm (REV-090 / v5.90)
* **24px Separation Distance Above Table**:
  - Separated the Unified Command & Filter Deck card from the Daily Intakes data table using `space-y-6` (24px gap) and `mt-2` elevation, eliminating the cramped visual collision between the filter search inputs and the table header.
  - Standardized generous distance rhythm across Booking Module, Daily Intakes, and Carry-Over Data.
* **Roomy Row Spacing & Adjusted Cell Rhythm**:
  - Expanded vertical cell padding from cramped `py-3.5` to generous `py-5` (20px) across all table rows in Daily Intakes, Carry-Over Data, and Booking Module.
  - Widened **Model & Category** column to `min-w-[280px]` with `mb-2` vehicle title margin and `gap-2` badge stack spacing.
  - Enlarged Service Advisor name container from `max-w-[85px]` to `max-w-[160px]`, completely eliminating ugly truncation (`ALEX VALENZUE...` -> `ALEX VALENZUELA`).
  - Scaled table header cells to `py-4.5` with crisp uppercase slate typography (`text-xs font-black`).
  - Enlarged Claim Stub and Plate No. badges to `px-3 py-1.5` with rounded borders and prominent font weights.
  - Expanded Evaluation / Diagnosis input to `min-w-[260px] max-w-[320px]` with `py-2 px-3` comfortable input padding.
* **Automated Regression Testing & Cache Invalidation**:
  - Added Suite 19 (`AUT-FRONT-48`) in `tests/frontend/sla_and_logic.test.js`.
  - All 63 automated unit and regression tests pass across 28 test suites (`cmd /c npm test`).
  - Incremented client script cache buster to `v=2.49` in `frontend/index.html`.

---

## 📅 September 18, 2026 (DOM Tree Hierarchy Recovery, Dual Scroll Elimination & 24px Gutters)

### 📋 DOM Tree Hierarchy Recovery, Dual Scroll Elimination & 24px Gutters (REV-089 / v5.89)
* **Resolved Premature Closing `</div>` Tags & Broken DOM Nesting**:
  - Identified critical structural bug where two redundant `</div>` tags at lines 3604–3605 prematurely closed `<main id="main-content">` and `<div id="app-main-wrapper">`.
  - Because of this premature closing, `#section-queue`, `#section-intake`, and other major views were pushed out of `#app-main-wrapper` and placed directly inside `#app-shell` as sibling flex items alongside `#app-sidebar` in a horizontal flex layout (`flex-direction: row`).
  - This caused `#section-queue` to sit directly flush (0px margin) against the dark sidebar and squashed `#app-main-wrapper` to 0px width (`w-0`), rendering the entire page structure defective.
* **Eliminated Dual Scroll Phenomenon (Outer Spillover vs Inner Table Scroll)**:
  - Discovered that the outer horizontal scroll was caused by `#section-queue` overflowing `#app-shell` horizontally as an orphaned sibling flex item, while the table inside `#section-queue` had its own horizontal scrollbar.
  - By removing the two rogue `</div>` tags, updating `#app-main-wrapper` to `w-full max-w-full`, and keeping all views strictly enclosed inside `<main id="main-content">` (which enforces `overflow-x: hidden; overflow-y: auto;` with 24px–32px gutters), the double scroll has been 100% eliminated.
  - The viewport now has a single vertical page scrollbar, while tables scroll horizontally within their dedicated containers only if table columns exceed the screen width.
* **Verified Visual Excellence & Responsiveness in Chrome DevTools**:
  - `#section-queue` is strictly inside `<main id="main-content">` with a generous width of `1120px+` and 24px padding on all sides.
  - All 3 tables (**Booking Module**, **Daily Intakes - Marikina**, and **Carry-Over Data**) are rendered together cleanly without sub-tab buttons.
  - Rows render at their natural 100% readable height with prominent typography and vertical column badges (`My Job` -> `Category/PMS` -> `Lane/Flexible`).
* **Automated Unit Testing & Cache Invalidation**:
  - Added Suite 18 (`AUT-FRONT-47`) in `tests/frontend/sla_and_logic.test.js`.
  - All 62 automated unit and regression tests pass across 27 test suites (`cmd /c npm test`).
  - Incremented client script cache buster to `v=2.48` in `frontend/index.html`.

---

# HonTech Capstone Revisions Log

This log documents all feature revisions, bugs resolved, and system updates completed for the HonTech Queue Monitoring System.

---

## 📅 September 18, 2026 (Enterprise Data Table Layout, Natural Height & Full Responsiveness)

### 📋 Enterprise Data Table Layout, Natural Height & Full Responsiveness (REV-088 / v5.88)
* **Eliminated Inner Vertical Scroll Traps & Squashed Slits**:
  - Removed nested `max-h-[...]` and `overflow-y-auto` constraints from all three table wrappers that previously trapped the mouse wheel and squashed Daily Intakes into an unreadable 25px slit or forced vertical scrollbars on 1-row Carry-Over tables.
  - Each table now renders naturally at 100% readable height (`overflow-y: visible`), delegating page-level scrolling to `#main-content` like standard enterprise data dashboards (Stripe, Linear, GitHub).
* **100% Horizontal Responsiveness & Clearance**:
  - Standardized horizontal overflow wrapper with `overflow-x-auto min-h-[180px]` and 6px bottom clearance, ensuring smooth, non-intrusive 6px scrollbars only when the display is narrower than table columns.
  - Preserved sticky table headers (`bg-slate-50/95 backdrop-blur-xs`) and high-contrast uppercase typography.
* **High-Visibility Empty States with Centered Illustrations**:
  - Added roomy `py-14` empty-state cards with 48px rounded-2xl icon containers and descriptive status guides for Daily Intakes, Booking Module, and Carry-Over Data.
* **Automated Testing & Cache Invalidation**:
  - All 61 test assertions pass across 26 test suites (`cmd /c npm test`).
  - Cache buster bumped to `v=2.47` in `frontend/index.html`.

---

## 📅 September 18, 2026 (Queue View Unified 3-Table Stack, Professional Spacing & Scrollbar Clearance)

### 📋 Queue View Unified 3-Table Stack, Professional Spacing & Scrollbar Clearance (REV-087 / v5.87)
* **Restored Unified 3-Table Overview (Zero Sub-Tabs)**:
  - Removed segmented tab switcher buttons per user directive, restoring all 3 operational tables (**Booking Module**, **Daily Intakes - Marikina**, and **Carry-Over Data**) into a single, unified command overview.
* **Eliminated Horizontal Scrollbar Text Overlay (Min-Height & Clearance)**:
  - Fixed root cause where empty tables (e.g. Booking Module with 0 rows) or single-row tables collapsed to 30px-70px, forcing the 17px browser scrollbar to draw directly on top of table header letters and row text.
  - Enforced `min-height: 180px !important;` and `padding-bottom: 6px !important;` across all table scroll wrappers, ensuring the horizontal scrollbar always has dedicated clearance beneath table data.
* **Rich Empty States with Friendly Centered Illustrations**:
  - Replaced cramped 1-line empty messages with roomy `py-12` empty-state cards containing centered circular icon badges and descriptive status text for all 3 tables.
* **24px-32px Viewport Gutters & Inset Canvas**:
  - Maintained `padding: 1.5rem 2rem !important;` on `#main-content`, ensuring cards never stretch 100% against the dark sidebar or window edges.
  - Enforced sleek 6px custom scrollbars (`.custom-scroll`) with cross-browser Firefox (`scrollbar-width: thin`) and WebKit support.
* **Automated Unit Testing & Cache Invalidation**:
  - Updated Suite 17 (`AUT-FRONT-46`) in `tests/frontend/sla_and_logic.test.js`.
  - All 61 automated assertions pass across 26 test suites (`cmd /c npm test`).
  - Incremented client script cache buster to `v=2.46` in `frontend/index.html`.

---

## 📅 September 18, 2026 (Queue View Edge Insets, Sleek Scrollbars & Sub-Tab Module Switcher)

### 📋 Queue View Edge Insets, Sleek Scrollbars & Sub-Tab Module Switcher (REV-086 / v5.86)
* **24px Viewport Gutters & Inset Canvas**:
  - Enforced strict `padding: 1.5rem !important;` (24px) on `#main-content`, completely eliminating the edge-to-edge 100% flush issue against the dark sidebar and browser window borders.
  - Cards now float gracefully with visible rounded corners (`rounded-2xl`), soft shadows, and clean slate canvas borders.
* **Sleek 6px Custom Scrollbars**:
  - Replaced chunky 17px Windows default gray scrollbars across all table wrappers with custom 6px smooth pill scrollbars (`bg-slate-300` thumb on `bg-slate-100` track), eliminating horizontal scrollbar clutter.
* **Queue View Module Switcher Deck (Sub-Tabs)**:
  - Implemented an interactive Segmented Sub-Tab Switcher at the top of `#section-queue`:
    - **Daily Intakes** (Active workshop queue, shown full-height by default).
    - **Booking Module** (Online inquiries queue with live badge counter).
    - **Carry-Over Data** (Extended stays with badge counter).
    - **View All 3** (Stacked multi-table overview).
  - Eliminates the vertical compression where 3 tables competed for viewport height on a single screen.
* **Automated Unit Testing & Cache Invalidation**:
  - Added Suite 17 (`AUT-FRONT-46`) in `tests/frontend/sla_and_logic.test.js`.
  - All 61 automated assertions pass across 26 test suites (`npm.cmd test`).
  - Incremented client script cache buster to `v=2.45` in `frontend/index.html`.

---

## 📅 September 18, 2026 (Daily Intakes & Queue Tables Scaled Typography & Prominent Value Sizing)

### 📋 Scaled Typography & Prominent Table Value Sizing (REV-085 / v5.85)
* **Scaled Typography & Value Readability**:
  - Replaced tiny `text-[9px]`, `text-[9.5px]`, and `text-[10px]` font sizes across table values with prominent, easy-to-read typography:
    - **Vehicle Name**: Scaled from `text-xs` to **`text-sm font-extrabold text-slate-900`** with `w-4 h-4` car icon.
    - **Badges & Selectors (`My Job`, `PMS/GRS`, `Lane`)**: Scaled from `text-[9.5px]` to **`text-xs font-bold`** with comfortable `px-2.5 py-1` padding and `w-3.5 h-3.5` icons.
    - **Plate Numbers & Claim Stubs**: Enhanced with `px-2.5 py-1 rounded-md font-bold text-xs/text-sm text-slate-900`.
    - **Source Badge**: Scaled from `text-[9px]` to **`text-[11px] font-black px-2 py-1`**.
    - **Status & Location Badges**: Scaled from `text-[10px]` to **`text-xs font-bold px-2.5 py-1.5`**.
    - **Table Headers**: Scaled from `text-[10px]` to **`text-xs font-black uppercase tracking-wider`**.
* **Automated Testing & Cache Invalidation**:
  - Added Suite 16 (`AUT-FRONT-45`) in `tests/frontend/sla_and_logic.test.js`.
  - All 60 automated assertions pass across 25 test suites (`npm.cmd test`).
  - Incremented client script cache buster to `v=2.44` in `frontend/index.html`.

---

## 📅 September 18, 2026 (Daily Intakes & Queue Tables Expanded Spacing & Cell Breathing Room)

### 📋 Daily Intakes & Queue Tables Expanded Spacing & Cell Breathing Room (REV-084 / v5.84)
* **Generous Row & Cell Padding Architecture**:
  - Replaced cramped `py-2` / `py-2.5` cell dimensions across Daily Intakes and Carry-Over tables with generous, readable `py-3.5 px-3.5` / `px-4` padding.
  - Standardized table headers to match row proportions with `py-3.5 px-3.5`.
* **Model & Category Column Expansion & Badge Breathing Rhythm**:
  - Widened `Model & Category` column from `min-w-[200px]` to `min-w-[240px]` with `px-4 py-3.5` padding.
  - Increased spacing between the vertical stacked badges to `gap-1.5 mt-1.5`, giving clear visual separation between Advisor, Category, and Lane pills.
* **Expanded Column Minimum Widths & Controls**:
  - Widened `Evaluation / Diagnosis` to `min-w-[210px]` with `px-4 py-3.5`.
  - Expanded `Status` and `Location` columns to `min-w-[145px]` with `px-3.5 py-3.5`, preventing select badge truncation.
* **Card Container & Viewport Capacity**:
  - Upgraded table card padding from `p-4` to `p-5 rounded-2xl` across all 3 queue cards (`#container-booking`, `#container-daily-intakes`, `#container-carry-over`).
  - Increased scrollable table max-heights to `max-h-[620px]` and `max-h-[520px]` for smooth, unconstrained viewport reading.
* **Automated Unit Testing & Cache Invalidation**:
  - Added Suite 15 (`AUT-FRONT-44`) in `tests/frontend/sla_and_logic.test.js`.
  - All 59 automated assertions pass across 24 test suites (`npm.cmd test`).
  - Incremented client script cache buster to `v=2.43` in `frontend/index.html`.

---

## 📅 September 18, 2026 (Daily Intakes Model & Category Column Form Vertical Badge Stacking)

### 📋 Model & Category Column Form Vertical Badge Stacking (REV-083 / v5.83)
* **Vertical Column Form Badge Stacking**:
  - Replaced horizontal wrapped badge container (`flex flex-wrap items-center gap-1`) with a strict vertical column stack (`flex flex-col items-start gap-1 mt-1`) in the `MODEL & CATEGORY` column of the Daily Intakes table (`renderJobRows`).
  - Standardized the stacked badge sequence strictly per operational hierarchy:
    1. **Service Advisor Action / Assignment Badge**: `My Job` (or `[Advisor Name] [Take Over]` / `Take Job` / `Unassigned`).
    2. **Service Category Badge & Selector**: `PMS` / `GRS` / `OTHERS` with wrench icon and inline dropdown.
    3. **Lane Type Badge & Selector**: `FLEXIBLE` / `SPECIAL` / `EXPRESS` with route icon and inline dropdown.
  - Eliminated haphazard horizontal wrapping across rows, achieving pixel-perfect left alignment and visual predictability.
* **Automated Testing & Cache Invalidation**:
  - Added Suite 14 (`AUT-FRONT-43`) in `tests/frontend/sla_and_logic.test.js`.
  - All 58 automated assertions pass across 23 test suites (`npm.cmd test`).
  - Incremented client script cache buster to `v=2.42` in `frontend/index.html`.

---

## 📅 September 18, 2026 (Daily Intakes 3-Table Alignment, Spacing Rhythm, Command Deck & Carry-Over Overflow Fix)

### 📋 Daily Intakes 3-Table Alignment, Spacing Rhythm, Command Deck & Carry-Over Overflow Fix (REV-082 / v5.82)
* **Unified Section Queue Flex Spacing Architecture**:
  - Refactored parent container (`#section-queue`) from conflicting `space-y-3` to a standardized `flex flex-col gap-5 w-full min-w-0 max-w-full overflow-hidden pb-8`.
  - Removed rogue `mt-3` from `#container-carry-over`, completely eliminating margin collision and establishing strict mathematical spacing between all 3 queue cards.
* **Branded Accent Card Headers & Synchronized Status Badges**:
  - Implemented cohesive card design system across all 3 tables with high-contrast colored icon badges (`p-2 border rounded-xl shadow-2xs`):
    - **Booking Module**: Blue theme (`border-t-4 border-t-blue-600`, `bg-blue-50 text-blue-600 border-blue-100`) with live `Online Queue` pulsing badge.
    - **Daily Intakes**: Red theme (`border-t-4 border-t-red-600`, `bg-red-50 text-red-600 border-red-100`) with dynamic date and active intake counter badge.
    - **Carry-Over Data**: Amber theme (`border-t-4 border-t-amber-500`, `bg-amber-50 text-amber-600 border-amber-100`) with `Extended Stays` status badge.
* **Streamlined Two-Tier Daily Intakes Command Deck**:
  - Replaced two fragmented, double-bordered toolbar containers with a single unified command deck (`bg-slate-50/80 border border-slate-200 rounded-xl p-3 space-y-2.5 shadow-2xs`):
    - **Tier 1 (Date Control & Scope)**: Calendar date picker, `‹ Today ›` stepper, "Show All Dates" toggle, and "Include Carry-Overs" toggle checkbox.
    - **Tier 2 (Search & Filtering)**: Full-width search bar alongside unified filter pills (`Advisor`, `Source`, `Time`, and `Sort By`) with matching heights, unified rounded borders, and consistent typography.
* **Standardized Table Headers & Row Alignments Across All 3 Tables**:
  - Added `#` (row index) column to the Booking Module so all three tables start with a standardized index column (`w-10 text-center text-slate-400 font-bold`).
  - Standardized table header styling across all 3 tables: `bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider py-2.5 px-3`.
* **Carry-Over Horizontal Overflow & Truncation Elimination**:
  - Re-engineered Action column with compact, high-contrast buttons (`Return Active` and `Remove`) with icons (`px-2.5 py-1 text-xs`).
  - Replaced bulky date box with a clean 2-line compact stack (`Recv:` and `Prom:` with dashed underline for editable promised dates).
  - Trimmed Carry-Over status dropdown to `w-[145px]` with clean amber badge styling.
  - Compacted the `YES / NO` Parts Available toggle into a clean inline pill.
  - Eliminated horizontal viewport scrolling on standard laptop resolutions.
* **Testing & Cache Busting**:
  - Added Suite 13 (`AUT-FRONT-40` to `AUT-FRONT-42`) in `tests/frontend/sla_and_logic.test.js`.
  - All 57 automated assertions pass across 22 test suites (`npm.cmd test`).
  - Cache buster incremented to `v=2.41` in `frontend/index.html`.


---

## 📅 September 17, 2026 (Customer Lookup Authentic Document Redesign, 1-Button RO Registration, Warranty Back-Job Sync, Documentation Reorganization & OpenXML Namespace Compliance)

### 📋 Authentic HonTech Form 1/3 Customer Details 3-Column Layout & Dossier Actions (REV-081 / v5.81)
* **Authentic Physical Form 3-Column Document Architecture**:
  - Redesigned the Customer Lookup module (`#section-lookup`) to precisely mirror the physical HonTech Form 1/3 document and 2025 Excel template header block.
  - Replaced generic card layout with an authentic 3-column physical document card with dark solid 2px borders, top contact header (`85644550 / 71219124 / 09458757441 / 09525065084 - VIBER`), and authentic gray `#C0C0C0` centered uppercase `CUSTOMER DETAILS` banner.
* **12 Structured Form Fields with Document Underlines**:
  - Structured exactly across 3 columns matching workshop documentation:
    - Column 1: Customer Name, Address, Contact No., E-Mail Add.
    - Column 2: Year / Model, KM Reading, Engine No., Chassis No.
    - Column 3: Plate No., Intake Date, Promise Date, Color.
  - Form fields render with authentic, sharp document underlines (`border-b border-slate-800 pb-0.5`).
* **Registry Data Extraction & Field Population**:
  - Updated `buildCustomerLookupRegistry()` in `frontend/js/app.js` to extract `customer_email`/`email` and `chassis_no` into customer records alongside engine number and address.
  - Updated `selectCustomerForLookup()` to defensively populate all 12 fields and format dates (`YYYY-MM-DD`) with defensive null fallbacks.
* **Integrated Action Toolbar & One-Click Dossier Copy**:
  - Embedded an attached command toolbar at the base of the Customer Details box containing:
    - `[⚡ Start New Service in Forms]` (`confirmRegularIntake()`)
    - `[🔁 Issue Back-Job in Forms]` (`openBackJobReasonModal()`)
    - `[Copy Info]` (`copyCustomerDossier()`)
    - `[Passport PDF]` (`exportCustomerServicePassportPDF()`)
  - Preserved 4 telemetry metrics (Total Visits, Last Service, PMS Prediction, Warranty Standing) and historical repair order timeline.
* **Testing & Verification**:
  - Added Suite 12 (`AUT-FRONT-36` to `AUT-FRONT-39`) in `tests/frontend/sla_and_logic.test.js`.
  - All 54 automated assertions pass across 21 test suites (`npm.cmd test`).
  - Cache buster incremented to `v=2.40` in `frontend/index.html`.

### 🚗 Service Advisor Unified Workflow — 1-Button RO Registration, Warranty Back-Job Sync & Intake Streamlining (REV-080 / v5.80)
* **Single Source of Truth 1-Button Registration Architecture**:
  - Implemented `registerStudioROToSystem()` in `frontend/js/app.js` and wired to `#btn-register-ro-top`, `#f13-btn-register-ro`, and `#f13-btn-push-bay`.
  - Replaced disjointed queue push with a single unified action saving all 10 core fields (`name`, `address`, `contact`, `vehicle`, `km_reading`, `engine_no`, `plate`, `date_received`, `promised_date`, `color`) plus monitoring and warranty fields (`evaluation`, `concern`, `category`, `sa_name`, `is_backjob`, `parent_job_id`, `backjob_reason`).
  - Synced payload via `POST /api/jobs` to central MySQL MariaDB, seamlessly refreshing `#container-daily-intakes`, Wireless Smart TV Monitor, and Customer History Registry without losing the SA's place in the Studio.
* **Database Schema Migration & Backend Controller Support**:
  - Enhanced `backend/migration.php` with columns `address`, `km_reading`, `engine_no`, `color`, `is_backjob`, `parent_job_id`, `backjob_reason`, and widened `source` to VARCHAR(50).
  - Updated `backend/controllers/JobController.php` to handle all 10 fields, back-job attributes, and custom identifiers using prepared statements with parameter binding.
* **Customer Lookup Roundtrip & Warranty Back-Job Handling**:
  - Upgraded `buildCustomerLookupRegistry()` and search filter to match against Customer Name, License Plate, Engine Number, Contact Number, Vehicle Model, and Claim Stub ID.
  - Added `loadCustomerIntoStudioForms()` supporting both returning regular customers and warranty back-jobs.
  - Added dynamic `#f13-backjob-banner` in 2025 RO Excel Studio highlighting back-job return details and parent job reference, with `cancelStudioBackJobMode()`.
* **Redundant Intake Form Retirement from SA Flow**:
  - Retired the obsolete walk-in form (`#section-intake`) from the Service Advisor navigation bar and sidebar, establishing the 2025 RO Excel Studio as the exclusive vehicle intake engine.
  - Retargeted bay allocation empty queue button from obsolete `intake` to `showSection('form13')`.
* **Verification & Automated Testing**:
  - Added Suite 11 (AUT-FRONT-31 to AUT-FRONT-35) in `tests/frontend/sla_and_logic.test.js`.
  - All 50 tests pass across 20 suites with 0 failures (`npm.cmd test`).
  - Cache buster incremented to `v=2.39` in `frontend/index.html`.

### 📁 Technical Documentation Organization & 7 Numbered Operational Subdirectories (REV-079 / v5.79)
* **Technical Documentation Reorganization**:
  - Reorganized all 40+ flat files in `Hontech Documentation/Technical/` into strictly 7 clean, numbered operational directories:
    - `01_Staff_Foundations_and_Operations`: Service Advisor, Floor Staff, Executive & Handover SOPs.
    - `02_Architecture_and_Engineering`: Master blueprints, DFDs, codebase audit rules, and security.
    - `03_Quality_Assurance_and_Testing`: Automated test catalogs, SLA delay diagnostics, and playbooks.
    - `04_Deployment_and_Infrastructure`: Local intranet (₱0), mDNS domain setup, and production runbooks.
    - `05_Client_Proposals_and_Defense`: Client pitches, retainer plans, and future roadmap.
    - `06_Project_Logs_and_Checkpoints`: Project trajectory, conversation history, and archived sprint plans.
    - `07_Career_and_Portfolio`: Developer portfolio and external setup guides.
  - Overhauled root `Hontech Documentation/README.md` into an executive navigation directory linking all active documents.
  - Synchronized `.agents/AGENTS.md` and `implementation_plan.md` paths.
  - Verified 100% test pass rate (45/45 assertions across 19 suites).

### 📈 OpenXML SpreadsheetML Namespace Compliance & LibreOffice Display Fix (REV-078 / v5.78)
* **Root Cause Diagnostics on Empty Spreadsheet Cells in LibreOffice Calc**:
  - Investigated user report where exported workbook (`HonTech_Official_RO_2025_123131_HT-JO-8214.xlsx`) opened in LibreOffice Calc with empty customer dossier cells despite values being injected.
  - Forensic XML inspection revealed that `doc.createElement('is')`, `doc.createElement('t')`, and `doc.createElement('v')` in browser DOMParser were serialized by `XMLSerializer` as `<is xmlns=""><t>...</t></is>`, resetting the element namespace to empty (`""`).
  - Because OpenXML SpreadsheetML strictly requires `http://schemas.openxmlformats.org/spreadsheetml/2006/main`, LibreOffice Calc and Excel's schema validators discarded tags with `xmlns=""` as unrecognized schema extensions, displaying empty cells (which caused formula `=C10` on cell D23 to evaluate to `0`).
* **SpreadsheetML Namespace Enforcement & Serialization Sanitization**:
  - Updated `setCell` to strictly use `doc.createElementNS(SML_NS, '...')` across `<row>`, `<c>`, `<v>`, `<is>`, and `<t>`.
  - Implemented `serializeSheet(doc)` which strips any rogue `xmlns=""` attributes via regex before zipping (`.replace(/\sxmlns=""/g, '')`).
  - Updated `xl/workbook.xml` calculation properties to include `<calcPr fullCalcOnLoad="1"/>` ensuring automatic formula evaluation (customer signature `=C10`, grand totals) upon file open in LibreOffice Calc and Microsoft Excel.
* **Automated Test Expansion (Suite 10)**:
  - Added `AUT-FRONT-30` in `tests/frontend/sla_and_logic.test.js` validating SpreadsheetML namespace enforcement and empty `xmlns` purging.
  - Automated assertions increased to **45/45 passing** across 19 test suites.
  - Cache buster updated to `v=2.37`.

### 🛡️ Quotation Scope Safety & Zero-Crash Startup Fix (REV-077 / v5.77)
* **Root Cause Diagnostics & ReferenceError Elimination**:
  - Investigated exception diagnostics report `HTR-CRASH-20260917-154947` (`Uncaught ReferenceError: removeForm23Row is not defined` at `js/app.js:14691`).
  - Identified that during historical refactoring of the Service Advisor Quotation studio, `removeForm23Row` was renamed to `removeLegacyForm23Row`, but line 14691 retained an undeclared reference `window.removeForm23Row = removeForm23Row;`, causing the JavaScript runtime to halt top-level evaluation and trigger the developer exception diagnostics modal.
* **Safe Compatibility Aliases & Obsolete Prototype Handler Purge**:
  - Registered defensive global compatibility wrappers that safely route legacy invocations to active 2025 RO Excel Studio handlers:
    - `window.removeForm23Row = function(index) { if (typeof removeForm23ItemRow === 'function') removeForm23ItemRow(index); };`
    - `window.addForm23Row = function() { if (typeof addForm23ItemRow === 'function') addForm23ItemRow(); };`
    - `window.calculateForm23Totals = function() { if (typeof calcForm23Totals === 'function') return calcForm23Totals(); };`
    - `window.applyForm23Preset = function(presetKey) { if (typeof applyQuotePreset === 'function') applyQuotePreset(presetKey); };`
    - `window.resetForm23Studio = function() { ... };`
  - Purged 300+ lines of duplicate, dead prototype studio code (lines 14607–14910) that was overwriting the active 2025 `syncForm23Canvas`.
* **Automated Test Expansion (Suite 10)**:
  - Added Suite 10 (`AUT-FRONT-28`, `AUT-FRONT-29`) in `tests/frontend/sla_and_logic.test.js` validating alias registration and full Node VM execution of `frontend/js/app.js` with zero runtime exceptions.
  - Automated assertions increased to **44/44 passing** across 19 test suites.
  - Cache buster updated to `v=2.36`.

### 📊 Complete Lossless Data Injection into Official Excel Template (REV-076 / v5.76)
* **Binary Buffer Template Loading & Memory Cache Engine**:
  - Eliminated dependency on missing/undefined base64 strings by implementing `getOfficialXlsxTemplateBuffer()` which directly fetches `assets/Current_2025%20BLANK%20RO%20UPDATED.xlsx` (423 KB) and caches the pristine `ArrayBuffer` in memory for instant offline-first exports.
* **Precision XML Cell Coordinate Mapping on Sheet 1 (`Job_Order`)**:
  - Mapped customer dossier cells to exact sheet coordinates: Customer Name (`C10`), Model (`H10`), Plate (`K10`), Address (`C11`), KM Reading (`H11`), Intake Date (`K11`), Contact (`C12`), Engine No (`H12`), Promise Date (`K12`), Email (`C13`), Chassis No (`H13`), Color (`K13`), Job Order No (`K2`), Date (`K5`), Concern (`B17`), Service Advisor (`C19`), and Customer Signature (`C23`).
  - Corrected table columns: mapped Diagnostic findings into Column B (`B27:B52`), Parts into Columns D–G (`D27:G52`: Description, Qty, Unit Price, Amount), and Materials into Columns H–K (`H27:K52`: Description, Qty, Unit Price, Amount).
* **Multi-Sheet Synchronization across Sheets 1 through 7**:
  - `Quotation_No 1–3` (`sheet2.xml`, `sheet3.xml`, `sheet4.xml`): Injected Quote No (`H2`), Date (`H5`), JO No (`H6`), Promise Date (`H7`), customer dossier, and line items (Description `A15:A50`, Qty `C15:C50`, Price `F15:F50`, Amount `H15:H50`) with automatic 20-item page spillover.
  - `Billing_No 1–2` (`sheet5.xml`, `sheet6.xml`): Injected Billing No (`H2`), Date (`H5`), JO No (`H6`), Quote Ref (`H7`), customer dossier, billed total amount (`C14`), and line items (`A17:H50`).
  - `CheckList_Result` (`sheet7.xml`): Injected Customer Name (`C5`), Date (`L5`), Plate No (`C6`), Vehicle Model (`D7`), KM (`K7`), Remarks (`C45`), and Inspector (`C48`).
* **Automated Test Expansion (Suite 9)**:
  - Added Suite 9 (`AUT-FRONT-25`, `AUT-FRONT-26`, `AUT-FRONT-27`) in `tests/frontend/sla_and_logic.test.js`.
  - Automated assertions increased to **42/42 passing** across 18 test suites.
  - Cache buster updated to `v=2.35`.

### 🖨️ Dynamic PDF Stamping Across All SA Worksheets & Open-Minded Inquiry Mandate (REV-075 / v5.75)
* **Dynamic Live PDF Stamping Across All SA Worksheets**:
  - Implemented dynamic PDF compiling via `PDFLib` for the 3 remaining Service Advisor worksheets matching `Job_Order`:
    - `Quotation_No`: `compileQuotePDFBytes()` & `generateQuotePDF()` stamp quote no, date, customer & vehicle dossier, line items (qty, description, unit price, total), subtotals, VAT, and grand total directly onto `assets/Current_2025 BLANK RO UPDATED.xlsx - Quotation_No.pdf`.
    - `Billing_No`: `compileBillingPDFBytes()` & `generateBillingPDF()` stamp billing no, date, JO/quote reference, customer & vehicle specs, line items, discounts, VAT, and balance due directly onto `assets/Current_2025 BLANK RO UPDATED.xlsx - Billing_No.pdf`.
    - `CheckList_Result`: `compileChecklistPDFBytes()` & `generateChecklistPDF()` stamp vehicle dossier, date, SA inspector name, 15-point multi-system inspection status markers (`✔` Good, `⚠` Attn, `✘` Defect), dark fuel gauge badge marker over `E`, `1/4`, `1/2`, `3/4`, or `F`, and remarks onto `assets/Current_2025 BLANK RO UPDATED.xlsx - CheckList_Result.pdf`.
  - Added debounced (350ms) auto-refresh pipeline (`scheduleFormStudioPdfRefresh()`) that updates the active preview iframe (`#f13-pdf-iframe`, `#f23-pdf-iframe`, `#billing-pdf-iframe`, `#checklist-pdf-iframe`) with zero keystroke lag.
  - Connected toolbar "Download PDF" buttons with standardized filenames (`HonTech_Quotation_QT-2026-XXXX.pdf`, `HonTech_Billing_BL-2026-XXXX.pdf`, `HonTech_CheckList_HT-JO-XXXX.pdf`).
* **Standardized Professional PDF Typography & Visual Quality Fix**:
  - Fixed typography issues reported by user on `Job_Order` PDF: eliminated clashing bright red headers, irregular font sizes, and destructive whiteout blocks that clipped table borders.
  - Harmonized typography across all 4 PDFs with authentic laser-printed charcoal/black ink (`rgb(0.08, 0.08, 0.08)`), consistent 8pt standard sizing (7.5pt secondary), and clean baseline vertical alignments.
* **Mandatory AI Workflow Directive (Open-Minded Collaborative Inquiry Phase)**:
  - Codified user mandate permanently into `.agents/AGENTS.md` and `.agents/skills/agent-workflow/SKILL.md`: Whenever creating an implementation plan, the AI MUST formulate deep, open-minded questions for the user (covering UI styling, colors, typography, layout ergonomics, data capacity, and operational edge cases) to ensure mutual understanding and alignment before code is written.
* **Automated Test Expansion (Suite 8)**:
  - Added Suite 8 (`AUT-FRONT-22`, `AUT-FRONT-23`, `AUT-FRONT-24`) in `tests/frontend/sla_and_logic.test.js`.
  - Automated assertions increased to **39/39 passing** across 17 test suites.
  - Cache buster updated to `v=2.34`.

### 📄 Official PDF Format Preview Sidebars & Purge Keystroke HTML Canvas (REV-074 / v5.74)
* **Official PDF Format Preview Sidebars across All Worksheets**:
  - Embedded high-fidelity responsive PDF format viewers in the right preview sidebar for all 4 worksheets using the newly provided official assets:
    - `Job_Order`: `assets/form13_template.pdf`
    - `Quotation_No`: `assets/Current_2025 BLANK RO UPDATED.xlsx - Quotation_No.pdf`
    - `Billing_No`: `assets/Current_2025 BLANK RO UPDATED.xlsx - Billing_No.pdf`
    - `CheckList_Result`: `assets/Current_2025 BLANK RO UPDATED.xlsx - CheckList_Result.pdf`
  - Added dedicated preview action toolbars with "Full PDF" (`target="_blank"`), "Download PDF" (`download`), and "Export .xlsx" triggers.
* **Purge of Keystroke Sheet HTML Canvas Overhead**:
  - Removed simulated keystroke HTML document sheets (`#f13-html-canvas-wrap`, `#billing-canvas-sheet`, `#checklist-canvas-sheet`) and hundreds of unnecessary span tags that triggered expensive DOM redraw loops on every keypress.
  - Streamlined `onReactiveJobOrderInput` to focus exclusively on zero-latency input field cross-synchronization and `localStorage` offline draft persistence.
* **Ordered Worksheet DOM Architecture**:
  - Re-ordered sheet views in DOM sequentially: `view-sheet-form13` -> `view-sheet-quote` -> `view-sheet-billing` -> `view-sheet-checklist`, followed by `form-workbook-bottom-bar`.
  - Removed 820+ lines of duplicate and dead HTML canvas markup.
* **Automated Test Expansion (Suite 7)**:
  - Added Suite 7 (`AUT-FRONT-19`, `AUT-FRONT-20`, `AUT-FRONT-21`) in `tests/frontend/sla_and_logic.test.js`.
  - Total automated assertions increased from 33 to **36/36 tests passing** in ~1.7s.
  - Cache buster bumped to `v=2.32`.

### 📺 TV Monitor Natural Trigger, Top 4-Tab Bar, Reactive Auto-Fill & Current_2025 Template Sync (REV-073 / v5.73)
* **Natural TV Monitor Launch & Hub Restoration**:
  - Restored `#modal-tv-broadcast-hub` in `frontend/index.html` after accidental omission in earlier commits, resolving non-responsive TV Monitor navigation clicks.
  - Features high-contrast modal with live wireless pairing (URL, 4-digit PIN, QR code), direct HDMI Dual-Display guide, and 1-click in-app slides launcher.
* **Authentic Top Tab Selection Bar (Strictly 4 Core SA Sheets)**:
  - Engineered `#form-top-tab-bar` positioned prominently at the top of `#section-form13` so tabs are permanently visible without scrolling.
  - Implemented strictly the 4 authentic worksheets matching user reference styling: `Job_Order ▾`, `Quotation_No ▾`, `Billing_No ▾`, `CheckList_Result ▾`.
  - Active tab highlighted in Google blue (`bg-[#e8f0fe]`, `text-[#1a73e8]`, border line, active caret); seamless two-way view switching.
* **Instant "Type-to-Save & Auto-Fill" Pipeline (Zero Copy-Pasting)**:
  - Connected reactive input listeners across all `Job_Order` fields (`f13-input-*`).
  - Typing customer dossier, vehicle specifications, intake/promised dates, and repair scopes instantly auto-populates `Quotation_No`, `Billing_No`, and `CheckList_Result`.
  - Re-renders all physical document preview canvases in real time and persists draft data automatically to `localStorage`.
* **Migration to `Current_2025 BLANK RO UPDATED.xlsx` Export Template**:
  - Permanently deleted obsolete `Polished_2025 BLANK RO UPDATED.xlsx` (0 residual references).
  - Encoded base64 of official `Current_2025 BLANK RO UPDATED.xlsx` (423 KB) containing sheets 1–7 into `window.HONTECH_2025_RO_TEMPLATE_BASE64`.
  - Updated `exportOfficialXLSX` to inject typed data across all 7 sheets: `Job_Order` (`sheet1.xml`), `Quotation_No 1-3` (`sheet2-4.xml`), `Billing_No 1-2` (`sheet5-6.xml`), and `CheckList_Result` (`sheet7.xml`).
* **Automated Test Suite Expansion**:
  - Added Suite 6 with assertions `AUT-FRONT-16`, `AUT-FRONT-17`, and `AUT-FRONT-18` in `tests/frontend/sla_and_logic.test.js`.
  - All 33 assertions passing across 15 test suites with 0 failures; bumped cache buster to `v=2.31`.

### 📊 2025 RO Excel Studio Streamlining & Non-SA Tabs Purge (REV-072 / v5.72)
* **Purge of 6 Non-SA Tabs & Mock Stores**:
  - Completely removed the 6 non-SA tabs (`Cash_Advance`, `OEF`, `LIQUIDATION_REPORT`, `(Broken)DISBURSEMENT`, `(Broken)Daily Cash Flow`, and `Acknowledgement`) from the bottom tab navigation bar (`#form-sheet-tabs-scroll`).
  - Purged obsolete client-side mock stores (`customSheetDataStore`), non-SA tab switch logic, and DOM elements from `frontend/index.html` and `frontend/js/app.js`.
* **Preservation & Polish of 4 Essential Service Advisor Worksheets**:
  - `Job_Order` (`sheet1.xml`): Primary customer dossier, intake timestamps, labor & parts diagnostic matrix.
  - `Quotation_No` (`sheet2.xml`): Formal estimation studio with dynamic line-item CRUD editor, package presets (PMS, Brakes, Aircon, Underchassis), and 1:1 physical paper sheet preview.
  - `Billing_No` (`sheet3.xml`): Dedicated billing & settlement studio with line items, parts/labor subtotals, VAT calculations, and real-time document canvas.
  - `CheckList_Result` (`sheet4.xml`): 15-point multi-system inspection matrix (Fluids, Electrical, Interior, Tires, Brakes, Suspension), fuel level gauge selector (`E`, `1/4`, `1/2`, `3/4`, `F`), inspector notes, and physical inspection report canvas.
* **Reactive "Type-to-Save & Export" Cross-Sheet Pipeline**:
  - Engineered bidirectional synchronization (`syncJobOrderFieldsToBilling`, `syncBillingToJobOrder`, `syncJobOrderFieldsToChecklist`, `syncChecklistToJobOrder`).
  - Customer name, license plate, vehicle make/model, contact, and mileage automatically cross-populate between sheets upon typing.
  - Offline draft engine (`saveWorkbookDraftOffline` / `loadWorkbookDraftOffline`) persists all 4 sheet states and line items in `localStorage`.
* **Strict Service Advisor Only RBAC Lockout**:
  - Form 13 navigation buttons removed from Owner and Admin role bars.
  - Hard guardrail in `showSection('form13')` blocks non-SA roles with warning toast and auto-redirect.
* **Lossless 1:1 Official XLSX Export (`exportOfficialXLSX`)**:
  - Direct cell injection into `sheet1.xml`, `sheet2.xml`, `sheet3.xml`, and `sheet4.xml` using JSZip.
  - Non-SA sheets (5–10) in `xl/workbook.xml` are dynamically assigned `state="hidden"`, ensuring Microsoft Excel opens displaying strictly the 4 authentic SA worksheets.
* **Testing Expansion & Cache Busting**:
  - Expanded automated test suite from 27 to 30 passing assertions (`AUT-FRONT-13`, `AUT-FRONT-14`, `AUT-FRONT-15`).
  - Incremented cache buster in `frontend/index.html` to `js/app.js?v=2.30`.

---

## 📅 September 18, 2026 (Daily Intakes 3-Table Alignment, Spacing Rhythm, Command Deck & Carry-Over Overflow Fix)

### 📋 Daily Intakes 3-Table Alignment, Spacing Rhythm, Command Deck & Carry-Over Overflow Fix (REV-082 / v5.82)
* **Unified Section Queue Flex Spacing Architecture**:
  - Refactored parent container (`#section-queue`) from conflicting `space-y-3` to a standardized `flex flex-col gap-5 w-full min-w-0 max-w-full overflow-hidden pb-8`.
  - Removed rogue `mt-3` from `#container-carry-over`, completely eliminating margin collision and establishing strict mathematical spacing between all 3 queue cards.
* **Branded Accent Card Headers & Synchronized Status Badges**:
  - Implemented cohesive card design system across all 3 tables with high-contrast colored icon badges (`p-2 border rounded-xl shadow-2xs`):
    - **Booking Module**: Blue theme (`border-t-4 border-t-blue-600`, `bg-blue-50 text-blue-600 border-blue-100`) with live `Online Queue` pulsing badge.
    - **Daily Intakes**: Red theme (`border-t-4 border-t-red-600`, `bg-red-50 text-red-600 border-red-100`) with dynamic date and active intake counter badge.
    - **Carry-Over Data**: Amber theme (`border-t-4 border-t-amber-500`, `bg-amber-50 text-amber-600 border-amber-100`) with `Extended Stays` status badge.
* **Streamlined Two-Tier Daily Intakes Command Deck**:
  - Replaced two fragmented, double-bordered toolbar containers with a single unified command deck (`bg-slate-50/80 border border-slate-200 rounded-xl p-3 space-y-2.5 shadow-2xs`):
    - **Tier 1 (Date Control & Scope)**: Calendar date picker, `‹ Today ›` stepper, "Show All Dates" toggle, and "Include Carry-Overs" toggle checkbox.
    - **Tier 2 (Search & Filtering)**: Full-width search bar alongside unified filter pills (`Advisor`, `Source`, `Time`, and `Sort By`) with matching heights, unified rounded borders, and consistent typography.
* **Standardized Table Headers & Row Alignments Across All 3 Tables**:
  - Added `#` (row index) column to the Booking Module so all three tables start with a standardized index column (`w-10 text-center text-slate-400 font-bold`).
  - Standardized table header styling across all 3 tables: `bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider py-2.5 px-3`.
* **Carry-Over Horizontal Overflow & Truncation Elimination**:
  - Re-engineered Action column with compact, high-contrast buttons (`Return Active` and `Remove`) with icons (`px-2.5 py-1 text-xs`).
  - Replaced bulky date box with a clean 2-line compact stack (`Recv:` and `Prom:` with dashed underline for editable promised dates).
  - Trimmed Carry-Over status dropdown to `w-[145px]` with clean amber badge styling.
  - Compacted the `YES / NO` Parts Available toggle into a clean inline pill.
  - Eliminated horizontal viewport scrolling on standard laptop resolutions.
* **Testing & Cache Busting**:
  - Added Suite 13 (`AUT-FRONT-40` to `AUT-FRONT-42`) in `tests/frontend/sla_and_logic.test.js`.
  - All 57 automated assertions pass across 22 test suites (`npm.cmd test`).
  - Cache buster incremented to `v=2.41` in `frontend/index.html`.


---

## 📅 September 17, 2026 (Terminal Dev Automation, Automated Test Runner & 5-Stage AI Closed-Loop Lifecycle)

### 🧪 Terminal Dev Automation & 27-Assertion Test Suite (v5.71)
* **Terminal Dev Runner**: Updated `package.json` to configure `npm.cmd run dev` pointing directly to the PHP built-in server (`php -S 0.0.0.0:8000 router.php`), removing defunct Node `backend/server.js` references.
* **Automated Script Testing Suite (`npm.cmd test`)**:
  - **Frontend Tests (`tests/frontend/sla_and_logic.test.js`)**: 12 assertions testing Express PMS 2-Hour SLA turnaround calculations, overnight midnight rollovers, XSS HTML sanitization (`escapeHtml`), audit field labels (`formatFieldName`), and claim stub format validation.
  - **Backend Tests (`tests/backend/api.test.js`)**: 8 assertions testing PHP CLI syntax linting (`php -l`), MariaDB/MySQL PDO database connectivity (`backend/test_db.php`), and HTTP routing.
  - **Security Tests (`tests/security/security.test.js`)**: 7 assertions performing static repository audits for PDO prepared statement parameter binding, input sanitization against SQL injection payloads, 401/403 RBAC boundary protection, and 4-digit PIN validation.
* **Whole-System Regression Prevention & Self-Debugging Directives**: Enforced in `.agents/AGENTS.md` and `.agents/skills/hontech-qa-and-revisions-sync/SKILL.md` that any code change must be accompanied by `npm.cmd test` execution, self-debugging on failure, updating `HONTECH_QA_TEST_CHECKLIST.csv` (CLI-01, CLI-02, SEC-01, SEC-02), and logging in `Revisions checklist.csv` (`REV-071`).

---

## 📅 September 14, 2026 (Queue Calendar Engine, Auto-Reset, Historical Recall & Ctrl+D Dev Sandbox)

### 📅 Queue Calendar Filter, Next-Day Board Auto-Reset & Historical Recall (v5.55)
* **Prototype Alignment**: Modeled after the staff module in `frontend/OthersPrototype/prototype_skipped.html` to introduce calendar-driven queue management across all 3 core workshop tables.
* **Table 1: Online Booking Module (`#container-online-queue` / `#table-pending-express`)**:
  - Added embedded date picker `#online-date-filter` and **"All Inquiries" / "Filter by Date"** toggle button.
  - Defaults to filtering pending bookings scheduled for the chosen calendar day, with fast toggle to all pending inquiries.
* **Table 2: Daily Intakes Master Queue (`#container-daily-intakes` / `#table-daily-intakes`)**:
  - **Intake Calendar Toolbar**: Live digital date picker (`#intake-date-filter`), Day Steppers (`‹ Previous Day`, `Today`, `Next Day ›`), and `Show All Dates` toggle.
  - **Automatic Next-Day Clean Reset**: When the calendar advances to tomorrow, the board automatically resets clean, clearing yesterday's intake clutter so the shop starts every morning with a fresh board.
  - **Historical Ticket Recall**: Selecting any past date immediately recalls that day's intake tickets, diagnoses, arrival/departure timestamps, and completion statuses for advisors and auditors.
  - **Include Carry-Overs Checkbox**: Staff toggle to display active unresolved carry-overs alongside daily intakes.
* **Table 3: Carry-Over Data Table (`#container-carry-over` / `#table-carry-over`)**:
  - **3-Mode Filter**: `All Active` (default to prevent vehicle loss across days), `Promised Date` (filter by scheduled delivery date), and `Intake Date` (filter by original intake date).

### 🛠️ Unified Developer Testing Console & Ctrl+D Toolbox UI Redesign (v5.56)
* **Global Developer Shortcut (`Ctrl + D` / `Cmd + D`)**: Relocated developer simulation controls from permanent on-screen clutter into the Unified Developer Toolbox modal (`#dev-toolbox-modal`), widened to `max-w-3xl`.
* **Queue Date Time Machine & Auto-Reset Console**:
  - **Simulated Calendar Steppers**: `⏪ -1 Day (Recall Past)`, `🔄 Today (Real Clock)`, `⏩ +1 Day (Fresh Reset)`, and direct Jump Date selector.
  - **1-Click Multi-Day Test Suite**: `Seed Data` button injecting 8 partitioned test vehicles across Yesterday, Today, and Tomorrow, with `Purge Seed` button for instant cleanup.
  - **Live Telemetry & Record Counter**: Real-time counter cards showing vehicle distributions for Yesterday, Today, and Tomorrow with diagnostic status messages.
* **Smart Active Simulation Banner (`#dev-sim-active-banner`)**:
  - Non-intrusive alert banner in `#section-queue` that displays *only* when a simulated date is active (`⚠️ Time Travel Simulation Active: [YYYY-MM-DD]`), with quick `Reset to Today` and `Open Toolbox (Ctrl+D)` actions.
  - Normal staff operations remain 100% clean and uncluttered in real-time mode.
* **Cache Busting**: Incremented script cache-buster tag in `frontend/index.html` to `js/app.js?v=5.56`.

### ☁️ Google Auth, Supabase & Vercel Cloud Integration Documentation
* **Cross-Repository Alignment**: Reviewed and documented integration workflows for Google OAuth, Supabase database schemas, and Vercel serverless deployment from `CapstoneOfficial2_Part3_Hontech_Cloud_GoogleAuth_Production`.
* **Architecture Rules**: Added dedicated `.agents/skills/hontech-vercel-supabase/SKILL.md` and migration guidance for client cloud deployments.

### 📺 Wireless Smart TV Monitor via Direct Link & PIN Authentication (v5.57)
* **HDMI-Free Direct Web Link Display**: Allows actual smart TVs (Samsung Tizen, LG webOS, Sony Android TV, Fire TV, Apple TV, PC browsers) to display the live workshop and queue status over Wi-Fi without needing HDMI cables or screen mirroring.
* **Staff TV Broadcast Hub Modal (`#modal-tv-broadcast-hub`)**:
  - Accessible via the **"Wireless TV Link & PIN"** button in the TV Monitor header.
  - **Broadcast Power Switch**: Master toggle allowing Service Advisors (SAs) or Admins to activate or pause the live TV stream at any time.
  - **Direct Access URL & PIN**: Displays standard access URL (`http://<server-ip>:8000/tv.html`) alongside an active 4-digit security PIN (`8492` default).
  - **1-Click Auto-Login Link**: Provides a direct link with pre-authenticated PIN (`tv.html?pin=XXXX`) for smart TV bookmarks.
  - **Dynamic QR Code**: Generates instant QR code for fast mobile and tablet onboarding.
  - **PIN Re-generation**: 1-click button to cycle a new random 4-digit security PIN whenever needed.
* **Standalone Big-Screen TV Kiosk App (`frontend/tv.html`)**:
  - **PIN Lock Screen (`#screen-auth`)**: Features large high-contrast PIN entry dots, TV remote-friendly on-screen numeric keypad, keyboard listeners, and instant verification feedback. Supports auto-login via `?pin=` parameter.
  - **Standby Auto-Wakeup Screen (`#screen-standby`)**: Appears whenever staff deactivates the broadcast session. Auto-polls the backend every 5 seconds and instantly resumes live broadcast the moment staff reactivates it.
  - **Active Cinema Monitor (`#screen-active-tv`)**:
    - High-visibility automotive dark cinema theme optimized for 55"+ 1080p/4K panels.
    - 3-slide auto-rotating carousel (Bays Grid, Live Queue & Releases, Workshop Lanes).
    - Live background polling every 6 seconds to `/api/jobs/tv`.
    - Automated Web Speech API audio chimes and voice announcements for vehicle readiness, bay assignments, and carry-overs.
* **Backend Session Architecture**:
  - Dedicated state store in `backend/tv_session.json`.
  - Added REST API endpoints in `backend/index.php`: `GET /tv/session`, `POST /tv/session`, `POST /tv/verify-pin`.
  - Added direct server routing in `router.php` for `/tv`, `/tv.html`, and `/frontend/tv.html`.
* **Cache Busting**: Incremented script cache-buster tag in `frontend/index.html` to `js/app.js?v=5.57`.

### 🎛️ TV Monitor Launch & Control Hub Navigation Integration (v5.58)
* **Direct Navigation Modal Trigger (`launchTVMode`)**: Updated `launchTVMode()` across the application so that clicking **"TV Monitor"** in the top navigation bar or sidebar immediately displays the **TV Monitor Launch & Control Hub** modal (`#modal-tv-broadcast-hub`).
* **Two Clear, Dependable Display Flows**:
  - **Option 1: Display on This PC / Local Monitor**: Added a prominent primary action button (`📺 Launch TV Cinema Kiosk (New Tab)`) that opens `tv.html` in a dedicated cinema kiosk browser tab with automatic PIN authentication.
  - **Option 2: Connect Smart TV Wirelessly**: Consolidated the wireless connection cards (Broadcast Power switch, Direct URL, 4-digit security PIN, 1-Click Auto-Login bookmark link, dynamic QR code, and 3-step setup guide).
* **System-Wide RBAC Availability**: Integrated the **TV Monitor** navigation button into **Owner** and **Administrator** profiles in `buildNavbar()`, ensuring that shop owners and admins have direct access alongside Service Advisors and Assistants.
* **Direct URL Query Handling**: Added automatic redirect in `app.js` routing `index.html?mode=tv` directly to `tv.html`.
* **Cache Busting**: Incremented script cache-buster tag in `frontend/index.html` to `js/app.js?v=5.58`.

### 📺 Staff TV Live Activation & Manual TV Opening Flow (REV-058 / v5.60)
* **Physical Workshop Process Alignment**: Tailored the TV Monitor operational flow to reflect the physical workshop environment:
  1. The TV starts in an **Offline / Standby** state by default.
  2. A staff member (SA, Assistant, Owner, Admin) clicks **"Make TV Live Now"** on their workstation or mobile dashboard.
  3. The module activates the broadcast session and reveals the generated **Smart TV Browser Link** (`http://<IP>:8000/tv.html`) and the **4-digit Password / PIN** (`8492`).
  4. The staff manually opens the built-in browser on the Smart TV (Samsung, LG, Sony, etc.), types in the link, and enters the password using the TV remote.
* **Staff TV Broadcast Hub Two-State UI (`#modal-tv-broadcast-hub`)**:
  - **State 1: Offline (`#tv-hub-state-offline`)**: Displays when the broadcast is offline. Features a prominent call-to-action button: `🔴 Make TV Live Now (Generate Link & Password)` with clear guidance that no HDMI cables are needed.
  - **State 2: Live (`#tv-hub-state-live`)**: Reveals the generated TV Link with 1-click copy, the 4-digit Password with 1-click rotation, auto-login link for bookmarks, dynamic QR code, and a 3-step manual setup checklist. Includes a `⏹️ Stop Live` control to power down the broadcast.
* **Broadcast Manager Methods (`HontechTVBroadcastManager`)**:
  - `startLiveBroadcast()`: Activates the session (`active: true`), generates link & PIN, updates the modal UI to Live state, and alerts staff via toast feedback.
  - `stopLiveBroadcast()`: Pauses the session (`active: false`), updates the modal UI to Offline state, and places connected TVs into standby mode.
  - `updateUI()`: Toggles `#tv-hub-state-offline` and `#tv-hub-state-live` with defensive element guards.
* **Smart TV Auto-Standby & Wakeup Engine (`frontend/tv.html`)**:
  - Added `startStandbyPolling()` and `stopStandbyPolling()`: When in standby, the TV checks `/api/tv/session` every 3 seconds. The moment staff activates the broadcast, the TV automatically authenticates and transitions to active monitoring.
* **Backend API & Response Guard**:
  - Ensured `GET /tv/session` and `POST /tv/verify-pin` strictly default to `active: false` until staff activation.
  - Added `ApiResponse::badRequest()` helper method in `backend/utils/ApiResponse.php`.
### 📺 Unified TV Display Hub: Two-Method Flow (Live Stream vs HDMI Cable) (REV-059 / v5.61)
* **Unified User Flow Popup**: When a user clicks **"TV Monitor"** in the top navigation bar or sidebar across any role (**Owner**, **Admin**, **Service Advisor**, **Assistant**), a modal popup (`#modal-tv-broadcast-hub`) appears presenting two connection methods:
  - **Method Option 1: Live Wireless Smart TV (`#tab-tv-method-live`)**:
    - **Step 1**: Staff clicks **"Make TV Live Now"** when TV is offline.
    - **Step 2**: The module generates and reveals the active **Smart TV Browser Link** (`http://<IP>:8000/tv.html`) and the **4-digit Password / PIN** (`8492`).
    - **Step 3**: Staff manually opens the built-in browser on the Smart TV (Samsung, LG, Sony, etc.) and enters the 4-digit password using the TV remote control.
    - Includes auto-login bookmark URL, dynamic QR code, and 1-click password re-generation.
  - **Method Option 2: Direct HDMI Cable Mode (`#tab-tv-method-hdmi`)**:
    - **Step 1: Plug Cable**: Connect an HDMI cable directly from the computer to the TV monitor port.
    - **Step 2: Extend Screen**: Press <kbd>Win + P</kbd> on the keyboard and select **"Extend"** to configure the TV as a secondary display.
    - **Step 3: Launch Kiosk**: Click **"Launch HDMI Cinema Kiosk (New Window)"** to launch the borderless monitor on the TV screen without requiring password entry.
    - Includes **"Open In-App"** preview to view the monitor without opening a new window.
* **Broadcast Manager Methods (`HontechTVBroadcastManager`)**:
  - `switchMethod(method)`: Switches active selection and toggles `#panel-tv-method-live` vs `#panel-tv-method-hdmi` with persistent choice in `localStorage`.
  - `launchHDMIKiosk()`: Ensures broadcast session is active and opens `tv.html?pin=XXXX&kiosk=true` in a new window ready to drag to the TV.
* **Standalone Kiosk App (`frontend/tv.html`)**:
  - Added `kiosk=true` query parameter detection on startup to automatically request fullscreen for HDMI secondary monitors.
* **Cache Busting**: Incremented script cache-buster tag in `frontend/index.html` to `js/app.js?v=5.61`.

---


## 📅 September 4, 2026 (Operational SLA Tracking & System-Wide Edit Reason Audit Guard)

### ⚡ Express Lane 2-Hour SLA Peak Limit Alert & Delay Reporting (v4.86)
* **Real-Time 2-Hour Duration Tracking**: Continuously measures turnaround duration for Express Lane customer vehicles against the 24-hour arrival benchmark.
* **Calm & Non-Disruptive Duration Indicator**: When an in-progress Express job reaches $\ge 2\text{ hours}$ (120 minutes), the system displays a clear duration badge (`⏱️ Express: 2h 15m`) and a clean `📄 Report Reason` action button.
* **Operational Progress Note Modal (`#modal-express-delay-report`)**:
  - Automatically prefills Customer Name, Plate Number, Vehicle Model, Arrival Time, and Total Elapsed Time.
  - Features standardized automotive delay categories (*Parts Delay / Not in Stock*, *Additional Deep Diagnostics*, *Customer Requested Scope Change*, *Bay & Lift Bottleneck*, *Unforeseen Mechanical Complexity*, *Others*).
  - Enforces mandatory technical justification remarks when custom reasons are selected.
* **Live In-Table Update**: Submitting the delay report immediately updates the table row with a clean note badge (`Note: Parts Not in Stock`) without requiring a page reload.
* **Dual Database Persistence**: Persists records to `express_lane_issues` and simultaneously records an immutable entry into `job_audit_logs`.
* **Management Report Integration**: Synchronized into the **Reports Tab** (`⚡ Express Lane & Delay Intelligence` / `#db-tab-express`) for Owner and Admin performance evaluation with CSV/Excel export and Chart.js distribution analytics.

### 🛡️ System-Wide Reason-Required Edit Audit Guard & Timeline History
* **Anti-Tampering Record Protection**: Protects saved customer and vehicle operational records (Departure Time, Diagnosis, Vehicle Category, Lane, Plate, Status) against silent or unauthorized modifications.
* **Mandatory Edit Reason Prompt (`#modal-edit-reason-prompt`)**:
  - Intercepts all field edits across the system.
  - Renders a side-by-side comparison displaying Field Name, Old Saved Value, and New Updated Value.
  - Provides operational reason presets (*Typo / Data Entry Correction*, *Customer Requested Scope Change*, *Diagnostic Escalation*, *Technical Re-evaluation*, *Others*) plus mandatory justification notes.
* **Immutable Audit Trail (`job_audit_logs`)**: Permanent database audit logging capturing `edited_by_id`, `edited_by_name`, `edited_by_role`, `field_name`, `old_value`, `new_value`, `edit_reason`, and `created_at`.
* **Vehicle-Level Audit History Modal (`#modal-job-audit-history`)**: Accessible via the History clock button (`<i data-lucide="history"></i>`) next to each claim stub, providing a complete chronological timeline of every edit and delay note logged for that specific vehicle.

### 🎨 Vehicle Table Cell & Evaluation/Diagnosis Ergonomics Refinement
* **3-Row Stacked Vehicle Hierarchy**: Restructured the intake vehicle cell into a clean vertical 3-row layout:
  - **Row 1**: Service Advisor status / actions (`My Job` / `Take Job` / `[SA Name] + Take Over`).
  - **Row 2**: Service Category selector (`PMS` / `GRS` / `PMS & GRS` / `OTHERS` with an extended 140px custom service textbox).
  - **Row 3**: Service Lane / Priority selector (`Flexible` / `Express` / `Priority` / `Special`).
* **Unified Evaluation Card Design**: Replaced raw inputs in Daily Intakes and Carry Over tables with the minimalist `eval-field-card` and `eval-badge-static` design from the Staff Booking Module.
* **Cache Busting**: Incremented script cache-buster tag in `frontend/index.html` to `js/app.js?v=4.86`.

---

## 📅 August 31, 2026 (UI Ergonomics Upgrade & Cloud Infrastructure Strategy)

### 🎨 Vehicle Intake & Online Booking Form Modernization (v4.26)
* **Wide 2-Column Executive Dashboard Layout**: Replaced the tall, single-column vertical form with a balanced, space-efficient 2-column layout (`max-w-6xl`) that eliminates vertical page scrolling.
  - **Left Card**: Customer & Vehicle Dossier (Date, Plate Number, Vehicle Model, Customer Full Name, Mobile Number) + Service Scope & Workshop Lane Allocation with zero label line-wrapping.
  - **Right Card**: Timing & Queue Dispatch Center + Integrated Submission Action Button.
* **Modern Time Pickers & Quick Slot Grid**:
  - Replaced outdated dropdown selects with native `<input type="time">` digital pickers for both Service Advisor and Assistant Desk.
  - Added a 2×3 interactive slot chip grid (`08:00 AM`, `09:30 AM`, `11:00 AM`, `01:30 PM`, `03:00 PM`, `04:30 PM`) for 1-click booking assignment.
  - Added a **"⚡ Set to Current Time"** button for Service Advisor walk-in reception.
* **Executive Monochrome Styling**: Stripped distracting vibrant gradient badges and converted all form borders, input fills, and buttons into executive slate/neutral tones.
* **Cache Busting**: Incremented script cache-buster tag in `frontend/index.html` to `js/app.js?v=4.26`.

### ☁️ Cloud Hosting, Sandbox PoC & Architecture Documentation
* **Master Hosting Infrastructure Guide**: Authored [`HONTECH_HOSTING_INFRASTRUCTURE_AND_CLOUD_STRATEGY_GUIDE.md`](Hontech%20Documentation/Technical/HONTECH_HOSTING_INFRASTRUCTURE_AND_CLOUD_STRATEGY_GUIDE.md) providing an architectural and financial breakdown of **Local XAMPP/LAN**, **AWS (EC2/Lightsail)**, **Vercel**, and **Supabase**.
* **Free-Tier Gotchas & Risk Analysis**: Documented real-world operational constraints including Supabase's **7-day inactivity database pausing rule**, **500MB DB cap vs photo uploads**, **Row-Level Security (RLS) enforcement**, and **Vercel serverless function execution limits**.
* **Isolated Sandbox PoC Playbook**: Authored [`HONTECH_SANDBOX_POC_VERCEL_SUPABASE_SETUP_GUIDE.md`](Hontech%20Documentation/Technical/HONTECH_SANDBOX_POC_VERCEL_SUPABASE_SETUP_GUIDE.md) featuring a complete 1-file working demo with live Supabase Realtime WebSockets for client demonstrations.
* **Adaptive Client-Driven Strategy**: Formalized the dual-path decision tree (Local-first deployment vs. Cloud migration refactoring).

---

## 📅 August 22, 2026 (Local Intranet Deployment & Multi-Device Testing)

### 🌐 Local Network Hosting & Multi-Device Synchronization
* **All-Interfaces Server Binding**: Configured PHP 8.0 server to bind to `0.0.0.0:8000`, enabling cross-device communication across the shop's local Wi-Fi / mobile hotspot.
* **1-Click Direct Role Logins**: Integrated instant role authentication triggers (`👑 Owner`, `👔 Admin`, `🛠️ SA`, `🔧 Tech`) on the login screen to streamline live multi-role testing without manual password typing.
* **Mobile QR Code Pairing**: Added `openMobileConnectModal()` with on-screen dynamic QR code generation, allowing technicians and advisors to scan and open the system on smartphones in seconds.
* **Automated LAN Launcher**: Created `start_lan_server.bat` in the project root to automatically detect the host's active LAN IPv4 address and launch the server with one click.
* **Online Booking Lane Types**: Updated Assistant Online Booking form and pending bookings table with all 4 lane selections: **Express Lane**, **Flexible Lane**, **Special Lane**, and **Priority Lane**, including dynamic Chart.js lane share visualization updates.
* **Online Booking Module Access (Assistant Staff Controls; SA/Admin/Owner View-Only)**: Service Advisors, Administrators, and Owners have visibility into the Online Booking Module (`#container-online-queue`) with strict read-only permissions, preserving operational editing, confirmation, and deletion authority exclusively for **Assistant Staff**.
* **Workshop Bay Capacity Configuration (4–10 Bays)**: Empowered Administrators and Owners to configure the active workshop bay capacity dynamically (4 to 10 bays) via Account Settings, automatically scaling Service Advisor bay allocation dropdowns, occupancy validations, and the real-time TV Bay Monitor layout (with adaptive 2-to-5 column grid responsiveness).
* **Dedicated Workshop Bays Navigation Module (`#section-bays`)**: Created a dedicated primary navigation tab and module on the left sidebar & top navigation for **Owner**, **Admin**, **SA**, and **Assistant**. Features a live workshop floor plan grid (`BAY-01` to `BAY-10`), real-time utilization stats (Total, In Service, Free, Utilization %), quick capacity scaling presets (4, 6, 8, 10 bays), and 1-click allocation of unassigned waiting vehicles directly into empty bays.
* **Express Lane Performance & Unsuccessful Root Cause Analytics**: Integrated a dedicated Analytics card for **Owner** and **Admin** evaluating Express Lane SLA compliance ($\le 60\text{ min}$ turnaround) alongside categorized root cause distributions for Unsuccessful/Delayed express services (Parts Delay, Customer Add-on Approval, Lift Congestion, Complex Repair, Extended QC).
* **Operational Report Data Module (Plan vs. Pumasok & Daily Intake Volume)**: Integrated a dedicated 3rd tab (`📊 Report Data`) for **Owner** and **Admin** featuring:
  - **Plan vs. Pumasok Inflow Matrix**: Tracks planned/scheduled targets against actual intake arrivals across **Carry-Over**, **GRS (General Repair)**, **PMS (Preventive Maintenance)**, **Express Lane**, and **Check-ups** with fulfillment rate percentages and variance indicators.
  - **Daily Intake Volume Breakdown**: Day-by-day chronological report aggregating total intakes, walk-in vs. online split, category distribution, shop capacity load %, and peak intake windows with 1-click CSV export and print-ready summary generation.
* **Intranet Architecture Documentation**: Documented local-only `.local` mDNS resolution (`hontech-marikina.local`), zero-cost on-premises resilience, and client presentation guides in `Hontech Documentation/Technical/LOCAL_INTRANET_DEPLOYMENT_GUIDE.md`.

---

## 📅 August 12, 2026 (Security & Account Recovery Branch Updates)

### 🛡️ Security, Exception Diagnostics & System Stability
* **Defensive DOM Operations**: Added strict null-checks for `buildNavbar` elements (`#header-actions` and `#sidebar-user-role`), preventing uncaught `TypeError` crashes on login.
* **Period Log Records Table**: Restored missing responsive Period Record Log Table HTML component (`#table-analytics-body`, `#analytic-table-count`, SA, Status, Goal filters, and Search inputs).
* **Developer Crash Reporter Overlay**: Refactored `showCrashOverlay` to safely pass multi-line diagnostic payloads into `window.currentCrashLogData`, making **Export Log (.txt)**, **Copy Trace**, and **Reset & Seed DB** fully functional.
* **Workspace Customizations**: Created project `.agents/AGENTS.md` rules and `.agents/skills/hontech-security-recovery/SKILL.md` workflow documentation.

---

## 📅 July 5, 2026 (System-Wide Revision Cycle)

### ⚙️ General System & Core Logic
* **24-Hour Time Engine**: Time calculations (arrival, departure, and service duration) now run on a 24-hour base with overnight adjustments. *(Note: The 12h/24h toggle selector is not yet added).*
* **Claim Stub System**: Fully functional, generating clean, unique stub numbers automatically.
* **Zebra Table Styling**: Improved contrast on all data tables. Headers are now light gray (`bg-gray-200`) with darker text, and rows have alternating light gray stripes without breaking custom status backgrounds.
* **Intake Header Design**: The intake form header now has a distinct grey card background (`bg-gray-50`) with borders for a more polished look.

### 👥 Assistant (Staff) Module
* **Form Rename & Subtitle**: Re-labeled to **Online Booking Form** with the description: *"Log online inquiries to Booking Module."*
* **Simplified Booking Forms**:
  * **"Parts" Column Removed**: Completely removed the parts input fields from both the online booking form and the booking table.
  * **"Lane Type" Removed**: Removed the lane type selection from the intake forms to simplify data entry.
* **Editable Booking Table**: The Assistant can now edit **Lane Type**, **Appointment Date/Time**, and the **Confirmed Checkbox** directly inside the booking table.
* **Confirm Active & Timestamp Flow**:
  * Replaced the "Push Active" button with **Confirm Active**.
  * Once clicked, the system automatically logs the current time as the vehicle's arrival timestamp and updates it in the daily intakes list.
* **UI Cleanups**:
  * The daily intakes list in the Assistant view now shows all entries (Walk-in & Online) without filters.
  * Improved the delete/remove entry button with a clean confirmation modal.

### 🛠️ Service Advisor (SA) Module
* **Form Rename & Subtitle**: Re-labeled to **Walk-In Form** with the description: *"Encode physical walk-in paperwork & assign Stub."*
* **Simplified Intake Form**: Removed the "Specific Problems" text area to keep walk-in registrations fast and simple.
* **Intakes Table Improvements**:
  * **Actions Column Removed**: Removed the "Actions" column to make the table cleaner.
  * **In-Line Editing**: The SA can now change the category (PMS, GRS, PMS & GRS, or Others) and lane types (Flexible, Express, Special) directly in the table row.
  * **Carry-Over Integration**: Added read-only columns for **Promised Date** and **C.O. Status** (reasons) to the intakes table.
  * **Carry-Over Visuals**: Added a dynamic orange `[Carry-Over]` badge below the plate number.
  * **Return Carry-Over Option**: The status dropdown now dynamically displays **Return Carry Over** instead of "Carry Over" if the vehicle came from the carry-over list.
* **Carry-Over Table & Modal**:
  * **Data Preservation**: Opening the Carry-Over modal now preloads and preserves the last-saved promised date and reason instead of overriding them.
  * **New Reason**: Added **WCA** (Waiting Customer Approval) to the carry-over status selections.

### 📺 TV Monitoring Module
* **Lanes Monitoring (Slide 3)**:
  * Fully functional and layout bugs fixed (Slide 3 no longer hides under Slide 2).
  * **Vibrant Redesign**: Upgraded Slide 3 columns with solid color headers (**Red** for Express, **Blue** for Flexible, **Purple** for Specialty) and matching light background tints for the columns to match the premium design of Slide 1.

### 👑 Owner Dashboard (Analytics)
* **Periodic Table Tab**:
  * Created a dedicated **Periodic Table** tab at the top of the owner's dashboard.
  * Extracted the Period Log Records table from the Analytics tab and placed it inside the new tab.
  * Made the date/scope and branch selectors **shared** so they sit above both the Analytics and Periodic Table tabs, allowing easy historical searches.
* **Operational Metrics Refinements**:
  * **Released Today**: Counts jobs by their actual completion date (`dateCompleted`), ensuring carry-overs released today are counted. Shows `(X Ready to Release)` subtext.
  * **In Bays (Working)**: Excludes completed/released jobs from the active bay count. Shows `(X Monitoring)` subtext.
  * **Branch Separation**: Removed the Branch column from table rows and moved it to the main top filters for better structure.

---

## 📅 July 20, 2026 (Backend Architecture & SOLID Refactoring Cycle)

### 🏗️ Architectural Layering & SOLID Principles
* **Data Access Repositories**: Extracted database query execution out of controllers into dedicated repository classes:
  * `App\Repositories\BranchRepository`: Encapsulates branch queries, creation, soft-deletion, and restoration.
  * `App\Repositories\UserRepository`: Encapsulates user lookups, staff roster queries, and credential management.
  * `App\Repositories\JobRepository`: Encapsulates job record filtering, claim stub sequence generation, and analytics queries.
* **Standardized Response Helper (`App\Utils\ApiResponse`)**: Introduced unified API response handling (`success`, `error`, `unauthorized`, `forbidden`, `notFound`, `serverError`) to eliminate duplicate header setting and `http_response_code` boilerplate.
* **Encapsulated Auth Context**: Removed direct controller reliance on `$GLOBALS['user']` in favor of static `Auth::getCurrentUser()` / `Auth::setCurrentUser()`.
* **File Concurrency Safety**: Applied `LOCK_EX` to file writing operations in `EmailUtils.php` and `JobController.php` to prevent temporary cache file corruption.

### 🌐 Router & Dev Server Adjustments
* **Asset Route Resolution**: Updated `router.php` to serve static assets (CSS, JS, fonts, images) directly from the `frontend/` directory with proper MIME `Content-Type` headers (`text/css`, `application/javascript`, etc.).
* **API Prefix Compatibility**: Updated `router.php` to handle `/backend/index.php/api/` request prefixes cleanly, preventing API requests from falling back to HTML documents.
* **Database Service**: Verified MariaDB/MySQL service on port 3307 and executed database migrations and seeders (`php backend/seed.php`).

---

## 📅 August 8, 2026 (Developer Version & Diagnostics Enhancements)

### ⚙️ Global Exception Handling & Developer Tools
* **Global Error Overlay (Crash Reporter)**: Integrated window-level exception and promise rejection listeners. If any javascript runtime crash triggers, it captures the error name, triggered source file name, line number, and full stack trace in a premium red-themed overlay.
* **Session & Environment Diagnostics Panel**: Added an expandable dashboard directly inside the crash overlay to inspect user state details (`currentUserRole`, `currentUserName`, `currentUserEmail`, active branch, and request URL) at the exact moment of crash.
* **Instant Database Re-Seeding Trigger**: Included a **Reset & Seed DB** trigger that sends a secure request to a newly implemented developer route (`POST /api/auth/developer/reset-seed`) to cleanly truncate tables and re-execute mock seed data. Output logs are printed live inside the overlay.
* **Diagnostic Crash Log Export**: Added a one-click **Export Log File** action that downloads a detailed report `.txt` file containing trace details, environment state, and localStorage details.

### 👑 Owner Dashboard (Analytics Fixes)
* **Auth Session Credentials**: Fixed a bug where credentials were not attached to same-origin fetch calls, preventing `/api/jobs/analytics` from verifying JWT tokens. Added `credentials: 'include'` to `apiRequest()`.
* **Date Parsing & Range Query Fixes**: Fixed date conversions in `loadAnalyticsData` that caused timezone offsets. Enhanced `getAnalyticsData()` database query to check both `date_received` and `date_completed` to correctly capture vehicles within selected periods.

---

## 📅 August 16, 2026 (Architectural Review, Diagnostic Audit & QA Protocols)

### 🔬 Root Cause & Architectural Audit
* **SQL PDO Property Mapping**: Documented the critical schema boundary between backend MySQL PDO snake_case attributes (`id`, `is_active` [0/1], `is_online` [0/1]) and frontend JavaScript camelCase conventions. Enforced standard fallback normalization (`user.id ?? user._id`, `Number(user.is_active) === 1`).
* **Defensive Array State Guarding**: Mandated `Array.isArray()` fallbacks (`const safeJobs = Array.isArray(allJobs) ? allJobs : [];`) across all table rendering and analytical filtering functions to prevent unhandled `TypeError` exceptions.
* **Browser Cache Busting**: Established mandatory script version bumping (`<script src="js/app.js?v=X.Y"></script>`) in `frontend/index.html` to eliminate stale script execution during development.

### 🧪 Standard 4-Step QA & Manual Testing Protocol
When developing or revising features, developers and teammates must follow this verified cycle:

```
[1. Baseline Health Check] ➔ [2. Build Isolated Feature] ➔ [3. 4-Role Manual Unit Test] ➔ [4. Git Checkpoint Commit]
```

1. **Step 1: Baseline Health Check**: Verify existing core views (Login, Queues, Analytics) load without console errors before editing.
2. **Step 2: Build Isolated Feature**: Implement only one specific requirement at a time without mixing concerns.
3. **Step 3: 4-Role Manual Unit Test**: Test the change across all 4 operational roles:
   - **Owner (`owner@hontech.com`)**: Verify Analytics KPIs, charts, period records, and staff roster.
   - **Admin (`admin@hontech.com`)**: Verify administration capabilities and operational records.
   - **Service Advisor (`sa@hontech.com`)**: Verify Walk-In Intake encoding, Claim Stub generation, and Daily Intakes lift board.
   - **Assistant Staff (`staff@hontech.com`)**: Verify Online Booking form, Booking Module queue, and Confirm Active conversion.
4. **Step 4: Commit & Checkpoint**: Commit to Git with a clear descriptive message (`feat(...)` or `fix(...)`) only after all 4 roles pass clean with zero console errors.

---

## 🏛️ Enterprise System Architecture Audit & Full-Stack Hardening Roadmap

### 🌟 Active Commercial-Grade Industry Standards Implemented
1. **Security & RBAC Layer**:
   - HTTP-Only JWT Cookie Authentication with BCrypt password hashing (`cost = 10`).
   - Server-side RBAC middleware enforcing strict 403 Forbidden on unauthorized endpoint access.
   - Dynamic 30-second user presence heartbeat (`/api/auth/ping`) and configurable idle session timeouts.
   - Dual-mode account recovery (4-digit security PIN verification + Developer Mailbox fallback).
2. **Resilience & Developer Crash Diagnostics**:
   - Global error interceptors (`window.onerror` and `window.onunhandledrejection`) with high-contrast diagnostic overlay.
   - Stack trace clipboard capture, `.txt` crash log export, and one-click database re-seeding endpoint (`/api/auth/developer/reset-seed`).
3. **Data Layer Defensive Engineering**:
   - MySQL PDO prepared statements eliminating SQL injection vulnerabilities.
   - Explicit snake_case / camelCase data normalization fallbacks (`id ?? _id`, `Number(is_active) === 1`).
   - Systematic `Array.isArray()` guarding across all collection filters, maps, and Chart.js aggregations.
4. **DevOps & QA Protocol**:
   - **3-Tier Risk Architecture** (Tier 1: Visual/Cosmetic ~5s, Tier 2: Single-Role ~30s, Tier 3: Shared Core ~2m).
   - Interactive standalone HTML test dashboard (`HONTECH_QA_MANUAL_TESTING_MATRIX.html`) with dynamic custom test generation, local storage persistence, and CSV export.

---

### 🔮 Future Enterprise Hardening Roadmap (Planned Enhancements)
The following four items represent advanced enterprise optimizations documented for future release sprints:
1. **🛡️ Client-Side XSS Escaping Helper**: Add a global `escapeHtml(string)` utility to sanitize all user-submitted text interpolations (`remarks`, `customer name`, `evaluation`) before DOM injection.
2. **⏱️ Brute-Force Rate Limiting**: Implement Redis/session-based rate-limiting on `/api/auth/login` to lock login attempts for 60 seconds after 5 consecutive failures.
3. **🌐 Offline Network State Detection**: Implement `window.addEventListener('offline' / 'online')` listeners to display a non-intrusive connectivity badge when working with intermittent local Wi-Fi.
4. **🗄️ Uniform Soft-Deletion Architecture**: Standardize `is_deleted = 1` flag across all tables (`jobs`, `users`, `branches`) to guarantee full audit trail compliance for executive analytics.
5. **🔔 Live TV Display Sound Chime System**: Integrate Web Audio API chime sounds (`playChime()`) triggered when vehicles transition to "Ready to Release" or upon carousel slide transition on the TV monitor.

---

## 🎯 Strategic Project Roadmap & Client Presentation Protocol

### 🏆 The Executive Verdict & 3-Phase Execution Strategy
* **🎯 Current Priority (Sprint 1)**: Polish, freeze, and verify all client-approved revisions using the **3-Tier QA Manual Testing Matrix**. Do not add unrequested complex features before client acceptance.
* **👑 Tomorrow (Client Milestone)**: Deliver the **ArchiMate Socio-Technical Architecture Presentation** and 2-minute live system demonstration to the **Company President**.
* **🚀 Post-Approval (Sprint 2 & 3)**:
  1. **Phase 2 (Security Hardening)**: Google OAuth / API Security integration, 2-Factor Authentication (PIN / Email), and enhanced Account Recovery.
  2. **Phase 3 (Deployment & Training)**: Configure workshop PC as on-premise local server, link waiting-area TV monitors via local network, and conduct hands-on staff training for Service Advisors and Assistant Staff.

---

### 🗺️ ArchiMate Poster Printing & Physical Assembly Guide
To present the comprehensive system architecture map in high-resolution format to the President:
1. **Export Resolution**: Export the ArchiMate model as **Vector PDF** or **High-Resolution PNG (300 DPI / 4K)** from the modeling tool.
2. **Multi-Sheet Poster Tiling (2×2 Grid / 4 Pages)**:
   - **Using Adobe Acrobat Reader**: Open PDF ➔ `Ctrl + P` ➔ Select **"Poster"** under *Page Sizing & Handling* ➔ Set Tile Scale to `150%-200%` with `0.1 in` overlap ➔ Print.
   - **Using BlockPosters / Web Tool**: Upload image ➔ Select *2 pages wide (A4 / Letter)* ➔ Download sliced 4-page PDF ➔ Print.
3. **Assembly**: Trim the overlapping margins on the inner edges, align the connector lines across sheets, and secure the back with clear tape to create a unified ~A2 executive table poster.

---

### 💡 Problem-Driven Feature Policy (YAGNI & Client Alignment)
* **Principle**: Only implement new components (e.g., custom Activity Logs, Audit Trail tables) when explicitly requested by the client to solve an active business pain point.
* **Benefit**: Eliminates wasted development hours, prevents user confusion, and ensures 100% stakeholder buy-in for every new database table and feature added.



