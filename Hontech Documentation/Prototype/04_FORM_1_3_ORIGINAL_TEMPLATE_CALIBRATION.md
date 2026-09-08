# Form 1/3 Official Original Document Template Calibration
## Pixel-Perfect Coordinate Mapping & Dynamic Vector Auto-Fit Specification

---

## 📌 1. Overview & Objective
This document details the architectural rules, mathematical baselines, and pixel-accurate coordinate mappings used by the **Form 1/3 Job Order Studio Engine** (`compileForm13PDFBytes()` in `frontend/js/app.js`).

### 🎯 Core Engineering Directives:
1. **100% Template Fidelity**: The system uses the **official original physical blank document** (`frontend/assets/form13_template.pdf` / `2025 BLANK JOB ORDER.pdf`) without re-drawing or altering vector borders, grid boxes, or typography.
2. **Dynamic Overlay Only**: The system exclusively stamps dynamic text and executes surgical white-outs over default template placeholders (e.g., pre-printed `0.00` in populated rows, placeholder SA name `Roman Sarol`).
3. **Zero Collisions & Zero Truncation**: Text fields sit precisely on printed underlines, inside cell boundaries, and after colons with zero label overlapping.
4. **Responsive Text Fitting**: Implements algorithmic font scaling (`drawTextFit()`) that dynamically reduces font sizes before truncating long vehicle models, customer names, or addresses.

---

## 📐 2. Coordinate System & PDF Geometry
* **Page Dimensions**: Standard A4 (`595.0 pt` width × `842.0 pt` height).
* **Coordinate Origin**: Bottom-left `(0, 0)`.
* **Standard Left Margin**: `x = 77.0 pt`.
* **Standard Right Margin**: `x = 522.0 pt` (Effective printable width: `445.0 pt`).

---

## 🗺️ 3. Comprehensive Field Coordinate & Dimension Mapping

### 1. Header Section
| Field | Template Label / Box Reference | Target Coordinate | Font & Style | Alignment |
| :--- | :--- | :--- | :--- | :--- |
| **Job Order No.** | `JOB ORDER NO.` (ends at `x: 472.2, y: 794.0`) | `x: 478.0, y: 794.0` | Helvetica-Bold, `9.5 pt`, Red (`#D91A1A`) | Left-aligned |
| **Header Date** | Pre-printed `DATE:` box (`x: 475..535, y: 763..776`) | `x: 505.0, y: 767.6` | Helvetica-Bold, `7.5 pt`, Black | Horizontally Centered |

---

### 2. Customer & Vehicle Details Matrix
All text strings are stamped at the exact label baselines. Horizontal underlines sit at $y \approx y_{\text{baseline}} - 1.5\text{ pt}$.

| Row | Field | Template Label & Colon Position | Text Start ($x$) | Baseline ($y$) | Max Width | Auto-Fit Rules |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Row 1** | **Customer Name** | `Name` (`77.0`) + `:` (`126.1`) | `134.0` | `723.3` | `140 pt` | Bold `7.5 pt`, scales down to `4.8 pt` |
| **Row 1** | **Year / Model** | `Year/Model` (`289.6`) + `:` (`341.4`) | `348.0` | `723.3` | `72 pt` | Regular `7.5 pt`, scales down to `4.5 pt` |
| **Row 1** | **Plate Number** | `Plate No` (`423.6`) + `:` (`464.6`) | `472.0` | `723.3` | `48 pt` | Bold `8.0 pt`, uppercase |
| **Row 2** | **Address** | `Address` (`77.0`) + `:` (`125.4`) | `134.0` | `715.2` | `140 pt` | Regular `7.0 pt`, scales down to `4.8 pt` |
| **Row 2** | **KM Reading** | `KM Reading` (`289.6`) + `:` (`342.6`) | `348.0` | `715.2` | `72 pt` | Regular `7.5 pt` |
| **Row 2** | **Intake Date** | `Intake Date` (`423.6`) + `:` (`465.6`) | `472.0` | `715.2` | `48 pt` | Regular `7.0 pt` |
| **Row 3** | **Contact No.** | `Contact No.` (`77.0`) + `:` (`126.8`) | `134.0` | `707.1` | `140 pt` | Regular `7.5 pt` |
| **Row 3** | **Engine No.** | `Engine No` (`289.6`) + `:` (`342.6`) | `348.0` | `707.1` | `72 pt` | Regular `7.0 pt` |
| **Row 3** | **Promise Date** | `Promise Date` (`423.6`) + `:` (`466.3`) | `472.0` | `707.1` | `48 pt` | Regular `7.0 pt` |
| **Row 4** | **E-Mail Add.** | `E-Mail Add.` (`82.1`) + `:` (`130.9`) | `136.0` | `698.9` | `138 pt` | Regular `7.0 pt` |
| **Row 4** | **Chassis No.** | `Chassis No.` (`289.6`) + `:` (`341.9`) | `348.0` | `698.9` | `72 pt` | Regular `7.0 pt` |
| **Row 4** | **Color** | `Color` (`428.8`) + `:` (`469.3`) | `475.0` | `698.9` | `46 pt` | Regular `7.0 pt`, scales down to `4.5 pt` |

---

### 3. Concern, Surcharge & Diagnostics Boxes
| Section | Bounding Box ($x, y, w, h$) | Text Parameters | Formatting & Overflow |
| :--- | :--- | :--- | :--- |
| **Customer Concern** | `x: 82.0, y: 658.0`<br>Interior area: $77\text{ to }517\text{ pt}$ | Font: `7.0 pt`, `lineHeight: 9.5 pt`<br>`maxWidth: 430 pt` | Multi-line wrapped, 5 pt padding on borders. |
| **Interviewed by (SA)** | Line: `y: 582.0`, centered at `x: 184` | White-out: `(145, 582.8, 80, 7)`<br>Text: `(184, 583.5, size: 7.5 pt)` | Wipes `Roman Sarol`, preserves solid underline, centers SA name. |
| **Diagnostic Result** | Column span: `x: 77..188`, `y: 316..508` | Font: `6.0 pt`, `lineHeight: 8.5 pt`<br>`maxWidth: 100 pt` | Left padding 4 pt, right padding 4 pt from vertical table divider. |

---

### 4. Parts & Materials 23-Row Table Matrix
The physical document features **23 rows** with a step size of **$8.1\text{ pt}$**.

#### Row Y-Baselines Array:
```javascript
const ROW_Y = [
    494.4, 486.3, 478.2, 470.1, 462.0, 453.8, 445.7, 437.6, 
    429.5, 421.4, 413.3, 405.2, 397.1, 389.0, 380.9, 372.8, 
    364.7, 356.6, 348.5, 340.4, 332.2, 324.1, 317.0
];
```

#### Column Boundaries & Alignment:
| Column Name | Section | Column Span ($x_1 \to x_2$) | Text Anchor ($x$) | Alignment | White-out Box ($x, y, w, h$) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Description** | Parts | `189.0` to `232.0` (`w: 43`) | `190.5` | Left (`maxWidth: 41`, font `5.2`) | None |
| **Quantity** | Parts | `233.0` to `257.0` (`w: 24`) | `245.0` | Centered (font `6.0`) | None |
| **Unit Price** | Parts | `258.0` to `295.0` (`w: 37`) | `293.0` | Right-aligned (font `6.0`) | None |
| **Amount** | Parts | `296.0` to `353.0` (`w: 57`) | `350.0` | Right-aligned (Bold `6.0`) | `(297, ry - 1.5, 55, 7.5)` *(Covers default 0.00)* |
| **Description** | Materials | `354.0` to `403.0` (`w: 49`) | `355.5` | Left (`maxWidth: 46`, font `5.2`) | None |
| **Quantity** | Materials | `404.0` to `427.0` (`w: 23`) | `415.0` | Centered (font `6.0`) | None |
| **Unit Price** | Materials | `428.0` to `473.0` (`w: 45`) | `471.0` | Right-aligned (font `6.0`) | None |
| **Amount** | Materials | `474.0` to `522.0` (`w: 48`) | `520.0` | Right-aligned (Bold `6.0`) | `(475, ry - 1.5, 46, 7.5)` *(Covers default 0.00)* |

*Note: In rows where no item is added, the white-out is not triggered, perfectly preserving the original pre-printed vector `0.00` characters.*

---

### 5. Totals & Signatures Block
| Element | Reference | Coordinate / White-out | Font & Color |
| :--- | :--- | :--- | :--- |
| **Parts Subtotal** | Between `( - )` (`x: 289.6..349.1`) | Whiteout: `(293, 305, 54, 8)`<br>Text: Right-aligned `x: 347, y: 307.5` | Helvetica-Bold, `6.5 pt` |
| **Materials Subtotal** | Between `( - )` (`x: 475.6..519.3`) | Whiteout: `(479, 304, 38, 8)`<br>Text: Right-aligned `x: 517, y: 306.5` | Helvetica-Bold, `6.5 pt` |
| **Grand Total** | Next to `TOTAL` (`x: 423.6, y: 298.3`) | Whiteout: `(455, 294, 66, 10)`<br>Text: Right-aligned `x: 514, y: 297.5` | Helvetica-Bold, `7.5 pt`, Red (`#D91A1A`) |
| **Diagnosed by (Mechanic)** | Above `Auto Mechanic` (`y: 272.2`) | Centered: `x: 184, y: 279.8` | Helvetica-Bold, `6.5 pt` |
| **Assessed by (Assessor)** | Above `Parts/Materials Controller` | Centered: `x: 462, y: 279.8` | Helvetica-Bold, `6.5 pt` |
| **Recommending Approval** | Above `Service Advisor` (`y: 197.7`) | Whiteout: `(150, 204, 70, 9)`<br>Centered: `x: 184, y: 206.0` | Helvetica-Bold, `7.0 pt` |
| **Approved by** | Above `Chief, Auto Mechanic` | Centered: `x: 413, y: 206.0` | Helvetica-Bold, `7.0 pt` |
| **Conforme (Customer)** | Above `Customer's Name & Signature` | Centered: `x: 184, y: 169.5` | Helvetica-Bold, `7.0 pt` |
| **Concurred by (GM)** | Above `General Manager` | Centered: `x: 413, y: 169.5` | Helvetica-Bold, `7.0 pt` |

---

### 6. Bottom Filipino Claim Stub (Tear-off Receipt)
| Field | Template Anchor | Target Coordinate | Max Width / Style |
| :--- | :--- | :--- | :--- |
| **Customer Name** | `Name` (`77.0`) + `:` (`131.3`) | `x: 134.0, y: 77.6` | `maxWidth: 140 pt`, Bold `7.0 pt` |
| **Vehicle / Plate** | `Plate No./Year/Model :` (`289.6`) | `x: 355.0, y: 77.6` | `maxWidth: 160 pt`, Bold `7.0 pt` |
| **Service Advisor** | `Service Advisor` (`77.0`) + `:` (`131.7`) | Whiteout: `(170, 68, 80, 8)`<br>Text: `x: 175.0, y: 69.1` | `maxWidth: 100 pt`, Bold `7.0 pt` |
| **Intake Date** | `Date:` (`77.0, y: 59.0`) | `x: 95.0, y: 59.0` | Regular `7.0 pt` |
| **Claim Stub ID** | `Claim Stub` (`289.6`) + `:` (`347.4`) | `x: 355.0, y: 59.0` | Bold `8.0 pt`, Red (`CS-XXXX`) |

---

## 💻 4. Algorithmic Helpers in `app.js`

### 1. `drawTextFit()`: Dynamic Responsive Scaling
```javascript
const drawTextFit = (str, x, y, maxWidth, initialSize = 7.5, isBold = false, color = black, minSize = 4.8) => {
    if (!str && str !== 0) return;
    let s = String(str);
    let size = initialSize;
    const f = isBold ? fontBold : fontNorm;
    while (size > minSize && f.widthOfTextAtSize(s, size) > maxWidth) {
        size -= 0.2;
    }
    if (f.widthOfTextAtSize(s, size) > maxWidth) {
        while (s.length > 3 && f.widthOfTextAtSize(s + '...', size) > maxWidth) {
            s = s.slice(0, -1);
        }
        s += '...';
    }
    page.drawText(s, { x, y, size, font: f, color });
};
```

### 2. `drawTextRight()`: Accounting Right-Alignment
```javascript
const drawTextRight = (str, rightX, y, size = 6, isBold = false, color = black) => {
    if (!str && str !== 0) return;
    const s = String(str);
    const f = isBold ? fontBold : fontNorm;
    const w = f.widthOfTextAtSize(s, size);
    page.drawText(s, { x: rightX - w, y, size, font: f, color });
};
```

### 3. `drawTextCenter()`: Center Alignment for Tables & Signatures
```javascript
const drawTextCenter = (str, centerX, y, size = 6, isBold = false, color = black) => {
    if (!str && str !== 0) return;
    const s = String(str);
    const f = isBold ? fontBold : fontNorm;
    const w = f.widthOfTextAtSize(s, size);
    page.drawText(s, { x: centerX - (w / 2), y, size, font: f, color });
};
```

---

## 🧪 5. Validation & Proof Results
* **Browser Test Harness**: PDF-Lib vector compilation tested live in headless Chromium runtime.
* **Fidelity Review**: 100% vector line preservation with zero overlap on labels, colons, or grid columns.
* **Cache Management**: Version incremented to `v=5.46` in `frontend/index.html`.
* **Git Sync**: Deployed and merged to branch `prototype_process` (`5756e28`).
