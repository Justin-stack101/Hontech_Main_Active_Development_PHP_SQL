# HonTech Vehicle Multi-Point Intake Inspection Checklist Specification

## 1. Executive Overview & Purpose
This document provides the technical, architectural, and visual blueprint for the **Vehicle Intake Multi-Point Inspection Checklist Studio & 1:1 Live Physical Inspection Canvas** (`CHECKLIST`), integrated directly into the HonTech Google Sheets workbook tab bar (`#view-sheet-checklist`).

It 100% replicates the official physical HonTech Auto Center Inc. Inspection Sheet (`CHECKLIST RESULT`), enabling Service Advisors and Workshop Technicians to record safety inspections, battery status, fluid integrity, tire tread, brake pad thickness, and interactive vehicle exterior damage mapping during vehicle intake.

---

## 2. Document Layout & Dimensional Specification

### 2.1 Physical Document Grid & Dimensions
- **Standard**: Standard A4 Portrait ($210\text{ mm} \times 297\text{ mm}$).
- **Container**: Bordered single-page card with high-density tabular typography ($8.5\text{ pt} - 10\text{ pt}$).
- **Two-Column Symmetrical Layout**:
  - **Left Section (50% Width)**:
    1. Header & Color Legend.
    2. `Interior/Exterior` Inspection Matrix (7 items).
    3. `Battery Performance (see attached ED-18 printout)` with Battery Graphic (2 items).
    4. `Under Hood` Inspection Matrix (4 items).
    5. `Under Vehicle` Inspection Matrix (5 items).
    6. `Comments` Area (multiline technician ruled observations).
  - **Right Section (50% Width)**:
    1. `Tire Condition` Matrix (Left Front, Right Front, Left Rear, Right Rear, Spare, PSI ratings).
    2. `Brake Condition` Matrix (mm pad thickness per wheel + "Brakes not inspected on this visit" checkbox).
    3. `Please Indicate Areas of External Damage or Wear` (Interactive 4-view vehicle body diagram).
  - **Footer Block**:
    1. Technical footnotes (`*Note: Brake fluid NOT filled...`, `**Refer to maintenance schedule`).
    2. Dual Signatures (`TECHNICIAN NAME` and `CUSTOMER SIGNATURE`).

---

## 3. Inspection System & Color Rating Model

HonTech uses an automotive industry standard 3-tier safety status hierarchy:
| Level | Color Code | Tailwind / Hex | Meaning |
| :--- | :--- | :--- | :--- |
| **Satisfactory** | Green | `bg-emerald-500` / `#22c55e` | In good operational condition, exceeds minimum safety thresholds. |
| **May Require Future Attention** | Yellow | `bg-amber-400` / `#facc15` | Moderate wear or low fluids; monitor on subsequent PMS visits. |
| **Requires Immediate Attention** | Red | `bg-rose-500` / `#ef4444` | Critical defect or safety hazard requiring immediate customer authorization. |

---

## 4. Multi-Point Item Registry

### 4.1 Interior / Exterior (7 Items)
1. `Headlights (check high and low beams)/Taillights/Brake lights/Hazard warning lights/Turn signals/Exterior lamps`
2. `Interior light`
3. `Windshield washer spray/Wiper operation/Wiper blades/Windshield condition`
4. `Parking brake`
5. `Horn operation`
6. `Clutch operation (if applicable)`
7. `Micron cabin filter**`

### 4.2 Battery Performance (2 Items)
1. `Good`
2. `Replace`
*(With visual battery icon and ED-18 diagnostic reference)*

### 4.3 Under Hood (4 Items)
1. `Check fluid levels: Oil/Coolant/Power steering fluid/Brake fluid*/Windshield washer fluid/Automatic transmission fluid`
2. `Air filter condition**`
3. `External drive belts and radiator hoses`
4. `Hydraulic clutch reservoir fluid (M/T vehicles)`

### 4.4 Under Vehicle (5 Items)
1. `Brake lines/Hoses/Parking brake cable`
2. `Shock absorbers/Struts/Suspension/Tie rod ends and boots/Steering gear and dust seals`
3. `Exhaust system`
4. `Engine oil and/or fluid leaks`
5. `Drive shaft boots/Constant velocity boots and bands`

### 4.5 Tire Condition (5 Positions + PSI)
- **Left Front**: Wear Pattern (Normal / Feathering / Cupping / Shoulder Wear), Tread depth (`____ 32nds`).
- **Right Front**: Wear Pattern, Tread depth (`____ 32nds`).
- **Left Rear**: Wear Pattern, Tread depth (`____ 32nds`).
- **Right Rear**: Wear Pattern, Tread depth (`____ 32nds`).
- **Spare**: Wear Pattern, Tread depth (`____ 32nds`).
- **Inflation Settings**: Front tire inflation set to `___ psi`, Rear tire inflation set to `___ psi`.

### 4.6 Brake Condition
- **Left Front**: `____ mms`
- **Right Front**: `____ mms`
- **Left Rear**: `____ mms`
- **Right Rear**: `____ mms`
- **Exemption Checkbox**: `[ ] Brakes not inspected on this visit`

### 4.7 External Damage or Wear Mapping
- Interactive SVG wireframe depicting Top (Roof/Hood/Trunk), Left Side, Right Side, Front, and Rear.
- Technicians can click directly on the diagram to place numbered damage pins with classifications:
  - `D` = Dent
  - `S` = Scratch
  - `P` = Paint Chip / Peel
  - `C` = Crack / Broken Lens

---

## 5. Synchronization Architecture & Google Sheets Integration
1. **Dossier Inheritance**: When switching to `CHECKLIST ▾`, automatically inherit:
   - `Customer Name` (from Form 1/3 or Form 2/3)
   - `Plate Number`
   - `Vehicle Year & Model`
   - `Date` (current date)
2. **Technician Signature**: Auto-populated from logged-in Service Advisor / Technician session user.
3. **Workbook Tab Bar**:
   - `tab-sheet-checklist` styled in soft blue `#e8f0fe` with `#1967d2` text when active.
   - Smoothly shows `#view-sheet-checklist` while hiding `#view-sheet-form13`, `#view-sheet-form23`, and `#view-sheet-billing`.
4. **Print Engine**:
   - Isolated hidden iframe print engine `printChecklist()` styled with `@page { size: A4 portrait; margin: 8mm; }`.
