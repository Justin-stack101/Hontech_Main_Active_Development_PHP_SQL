# HonTech 2025 Revised Checklist Format Specification

This document provides the layout mapping, cell coordinates, column structure, formulas, and usage rules for the new **column-based editable Checklist system** inside [2025 BLANK RO UPDATED.xlsx](file:///c:/Users/justi/Downloads/hontech/2025%20BLANK%20RO%20UPDATED.xlsx) and [2025_RO_HT-JO-8268.xlsx](file:///c:/Users/justi/Downloads/hontech/2025_RO_HT-JO-8268.xlsx).

---

## 1. Column Grid Definition

The `CHECKLIST` worksheet is structured across 13 columns (`A` through `M`):

| Col | Purpose | Width | Description / Format |
| :---: | :--- | :---: | :--- |
| **`A`** | Left Section Item Description | `34.0` | Item names (Interior/Exterior, Under Hood, Under Vehicle, Battery, Comments) |
| **`B`** | Left Status: Satisfactory (🟩) | `4.5` | Green status check cell (`✓` / `S` / green fill) |
| **`C`** | Left Status: Future Attention (🟨) | `4.5` | Yellow status check cell (`✓` / `Y` / yellow fill) |
| **`D`** | Left Status: Immediate Attention (🟥)| `4.5` | Red status check cell (`✓` / `R` / red fill) |
| **`E`** | Center Spacer Column | `2.0` | Clean visual separator between left and right sections |
| **`F`** | Right Section Position / Item | `12.0` | Tire positions (`Left Front`, `Spare`), Brake positions, Checkbox |
| **`G`** | Wear Pattern / Brake Spec | `14.0` | Wear pattern slot (`Wear pattern: ____`) / Brake thickness input |
| **`H`** | Tread Depth / Brake Spec | `14.0` | Tread slot (`Tire tread: ___ 32nds`) / Brake thickness input |
| **`I`** | Right Status: Satisfactory (🟩) | `4.5` | Green status check cell for tires / brakes |
| **`J`** | Right Status: Future Attention (🟨) | `4.5` | Yellow status check cell for tires / brakes |
| **`K`** | Right Status: Immediate Attention (🟥)| `4.5` | Red status check cell for tires / brakes |
| **`L`** | Date Label | `9.0` | Label: `DATE` |
| **`M`** | Date Dynamic Value | `13.0` | Formula linked to Job Order Date: `=J.O.!K5` |

---

## 2. Row-by-Row Layout & Coordinates

### Header & Vehicle Information (Rows 1–7)

```
[Row 1-3]: [HonTech Logo] (Centered across Columns D to J)
[Row 5]:   A5: "CUSTOMER NAME"         | C5: "=J.O.!C10"              | L5: "DATE" | M5: "=J.O.!K5"
[Row 6]:   A6: "PLATE NUMBER"          | C6: "=J.O.!K10"              | F6: "CHECKLIST RESULT"
[Row 7]:   A7: "VEHICLE YEAR MODEL"    | D7: "=J.O.!H10"              | H7: "FUEL LEVEL:" | I7: "E" | J7: "1/4" | K7: "1/2" | L7: "3/4" | M7: "F"
```

---

### Status Legend Bar (Row 9)

```
[Row 9]:   B9:C9 (Merged) -> "Satisfactory" (Green #00B050)
           D9:G9 (Merged) -> "May Require Future Attention" (Yellow #FFD966)
           H9:K9 (Merged) -> "Requires Immediate Attention" (Red #FF0000)
```

---

### Upper Section: Interior/Exterior & Tires (Rows 11–18)

| Row | Left Side: `A` (Item) + `B` (🟩) `C` (🟨) `D` (🟥) | Right Side: `F` (Pos) + `G` (Wear) + `H` (Tread) + `I` (🟩) `J` (🟨) `K` (🟥) |
| :---: | :--- | :--- |
| **11** | **`Interior / Exterior` [Header]** (B11:🟩, C11:🟨, D11:🟥) | **`Tire Condition` [Header]** (I11:🟩, J11:🟨, K11:🟥) |
| **12** | Headlights (high/low)/Taillights/Brake lights/Hazards/Signals | `Left Front` \| `Wear pattern: ____` \| `Tire tread: ___ 32nds` |
| **13** | Interior light | `Right Front` \| `Wear pattern: ____` \| `Tire tread: ___ 32nds` |
| **14** | Windshield washer spray/Wiper operation/Blades/Condition | `Left Rear` \| `Wear pattern: ____` \| `Tire tread: ___ 32nds` |
| **15** | Parking brake | `Right Rear` \| `Wear pattern: ____` \| `Tire tread: ___ 32nds` |
| **16** | Horn operation | `Spare` \| `Wear pattern: ____` \| `Tire tread: ___ 32nds` |
| **17** | Clutch operation (if applicable) | `Front tire inflation set to: _______ psi` (Merged F17:H17) |
| **18** | Micron cabin filter** | `Rear tire inflation set to: _______ psi` (Merged F18:H18) |

---

### Mid Section: Battery & Brakes (Rows 20–25)

| Row | Left Side: `A` (Item) + `B` (🟩) `C` (🟨) `D` (🟥) | Right Side: `F` (Pos) + `G:H` (Thickness) + `I` (🟩) `J` (🟨) `K` (🟥) |
| :---: | :--- | :--- |
| **20** | **`Battery Performance` [Header]** (B20:🟩, C20:🟨, D20:🟥) | **`Brake Condition` [Header]** (I20:🟩, J20:🟨, K20:🟥) |
| **21** | Good | `Left Front` \| `Thickness: _____ mms` |
| **22** | Replace | `Right Front` \| `Thickness: _____ mms` |
| **23** | *(blank row)* | `Left Rear` \| `Thickness: _____ mms` |
| **24** | **`Under Hood` [Header]** (B24:🟩, C24:🟨, D24:🟥) | `Right Rear` \| `Thickness: _____ mms` |
| **25** | Fluid levels: Oil/Coolant/PS/Brake/Washer/ATF | `Brakes not inspected on this visit [   ]` (Merged F25:H25) |

---

### Lower Section: Under Hood, Under Vehicle & Damage Diagram (Rows 26–45)

| Row | Left Side: `A` (Item) + `B` (🟩) `C` (🟨) `D` (🟥) | Right Side: External Damage / Diagram Area |
| :---: | :--- | :--- |
| **26** | Air filter condition** | *(External damage box area)* |
| **27** | External drive belts and radiator hoses | **`Please Indicate Areas of External Damage or Wear` [Header]** |
| **28** | Hydraulic clutch reservoir fluid (M/T vehicles) | *(Diagram box border)* |
| **30** | **`Under Vehicle` [Header]** (B30:🟩, C30:🟨, D30:🟥) | *(Diagram box border)* |
| **31** | Brake lines / Hoses / Parking brake cable | *(Diagram box border)* |
| **32** | Shock absorbers / Struts / Suspension / Tie rod ends & boots | *(Diagram box border)* |
| **33** | Exhaust system | *(Diagram box border)* |
| **34** | Engine oil and/or fluid leaks | *(Diagram box border)* |
| **35** | Drive shaft boots / Constant velocity boots and bands | *(Diagram box border)* |
| **37** | **`Comments` [Header]** (Merged A37:D37) | *(Diagram box border)* |
| **38–44**| **Editable Comment Lines** (Merged A38:D38 through A44:D44) | *(Diagram box border)* |

---

### Footnotes & Signatures (Rows 46–62)

```
[Row 46]:  A46: "*Note: Brake fluid NOT filled - fluid level indicates pad wear" | F46: "**Refer to maintenance schedule"
[Row 61]:  H61: "=J.O.!C10" (Customer printed name above line)
[Row 62]:  B62: "TECHNICIAN NAME: ____________________" | I62: "CUSTOMER SIGNATURE"
```

---

## 3. Dynamic Formula Map to `J.O.` (Job Order Sheet)

Every customer and vehicle field entered on the `J.O.` tab automatically populates the `CHECKLIST`:

| Data Field | Source Cell on `J.O.` | Destination Cell on `CHECKLIST` | Evaluation Rule |
| :--- | :---: | :---: | :--- |
| **Customer Name** | `J.O.!C10` | `CHECKLIST!C5` | Automatically matches customer |
| **Job Date** | `J.O.!K5` | `CHECKLIST!M5` | Synced intake date |
| **Plate Number** | `J.O.!K10` | `CHECKLIST!C6` | Synced vehicle plate |
| **Vehicle Model** | `J.O.!H10` | `CHECKLIST!D7` | Synced vehicle year / model |
| **Customer Signature**| `J.O.!C10` | `CHECKLIST!H61` | Dynamic customer name for signature line |

---

## 4. How to Use the New Format

1. **Direct Editing in Excel / WPS**:
   - Open [2025 BLANK RO UPDATED.xlsx](file:///c:/Users/justi/Downloads/hontech/2025%20BLANK%20RO%20UPDATED.xlsx).
   - Enter Job details in `J.O.` (or directly edit `CHECKLIST`).
   - Type `✓` or `X` into columns `B`, `C`, or `D` (left side) or `I`, `J`, or `K` (right side) to mark inspection findings.
   - Enter tire wear, tread depths (`32nds`), brake thicknesses (`mms`), and pressure readings (`psi`) in their respective cells.
   - Type inspection notes directly into comments row `A38`.
   - Save or Print (`Ctrl + P`) – the sheet is aligned and sized for standard single-page printing.

2. **Automated Batch Processing from PDF**:
   Run the included CLI converter whenever you receive a PDF checklist:
   ```powershell
   python convert_checklist_pdf_to_excel.py --pdf HonTech_CheckList_HT-JO-8268.pdf --template "2025 BLANK RO UPDATED.xlsx" --out "2025_RO_HT-JO-8268.xlsx"
   ```
