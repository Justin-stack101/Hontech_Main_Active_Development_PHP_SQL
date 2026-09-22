# HonTech 2025 RO Studio — Auto-Magnifier & Camera-Lock Blueprint
**Document ID**: `HONTECH-ARCH-STUDIO-MAGNIFIER-01`  
**Status**: 📦 **Archived / Shelved Feature (Preserved for Future Development)**  
**Decommission Revision**: `REV-141` (`September 22, 2026`)  
**Target Module**: `#section-form13` (2025 RO Excel Studio — All 4 Worksheets)

---

## 1. Executive Summary & Purpose

This document serves as the permanent engineering blueprint, architectural specification, and re-implementation guide for the **Senior Service Advisor Adaptive Auto-Magnifier & Document Camera-Lock Engine**.

### Why It Was Shelved (REV-141 Context)
During the September 2026 sprint, this feature was temporarily decommissioned in favor of a rock-steady, 100% aspect-fit vector PDF preview. The native browser PDF engine (Chromium PDFium) internally manages its own scroll offsets and viewport redraws, which created typing reload conflicts and required disproportionate maintenance tokens compared to core business foundations (RBAC, branch data isolation, workshop bay ceilings, and cloud database migration).

This blueprint preserves **100% of the mathematical formulas, coordinate zones, event flows, and technical lessons learned** so any future engineering team can revive or extend the feature without starting from scratch.

---

## 2. System Architecture & High-Level Flow

The Auto-Magnifier was designed to dynamically zoom and pan the right-hand live PDF preview to match the exact physical document section corresponding to whatever input field the Service Advisor is actively typing into.

```
+-------------------------------------------------------------------------------+
|                             2025 RO Excel Studio                              |
+------------------------------------+------------------------------------------+
|       Left Column (7 cols)         |          Right Column (5 cols)           |
|         Active Form Editor         |          Live Vector PDF Canvas          |
|                                    |                                          |
|  [ Customer Name Input ]  --Focus->|  +------------------------------------+  |
|                                    |  | Viewport Wrap (overflow: hidden)   |  |
|  [ Parts Table Entry   ]  --Focus->|  |   +------------------------------+ |  |
|                                    |  |   | PDF iframe                   | |  |
|  [ Conforme Signature  ]  --Focus->|  |   | Camera Translate(X, Y)       | |  |
|                                    |  |   | Scale: 1.85 (185% Senior Zoom| |  |
|  [ Claim Stub Intake   ]  --Focus->|  |   +------------------------------+ |  |
|                                    |  +------------------------------------+  |
+------------------------------------+------------------------------------------+
```

### Event Lifecycle:
1. **Focus/Input Detection**: User tabs or clicks into an input field (e.g., `#f13-input-name`).
2. **Zone Mapping**: `mapElementToSectionKey(el)` or `getStudioZoneForElement(el)` maps the DOM element to a calibrated document section key (`customer`, `table`, `signatures`, `claim_stub`, etc.).
3. **Aspect-Fit Calculation**: `applyStudioAspectFit(iframe, sheet)` sizes the iframe's CSS box to the exact aspect ratio of the underlying PDF page to eliminate unmeasurable letterboxing padding.
4. **Camera Translation Matrix**: `lockStudioSection(sectionKey)` computes the exact vertical and horizontal CSS transforms (`translate(X, Y) scale(1.85)`) and locks the document indefinitely.
5. **Debounced Refresh Synchronization**: When the user finishes typing (`blur` or `change`), `scheduleFormStudioPdfRefresh()` regenerates the PDF blob. Upon the iframe's `load` event, `reapplyStudioLockAfterReload()` reapplies the transform so the browser viewer does not snap back to default size.

---

## 3. Mathematical Centering Engine & Coordinate Matrix

### 3.1 Hardcoded Section Vertical Ratios (`STUDIO_HARDCODED_SECTIONS`)
Calibrated across standard Letter/A4 vehicle repair order forms:

| Section Key | Target Ratio (`yRatio`) | Zoom Scale | Target Document Area |
| :--- | :---: | :---: | :--- |
| `customer` | `0.00` (Top) | `1.85` | Customer Dossier, Plate, Engine, Odometer, Dates |
| `diagnostic` | `0.25` | `1.85` | Customer Concern, Scope of Work, Diagnostic Result |
| `table` | `0.50` (Middle) | `1.85` | Parts & Materials Table Rows, Scope Pricing Items |
| `totals` | `0.72` | `1.85` | Subtotals, Discounts, VAT, Balance Due |
| `signatures` | `0.85` | `1.85` | Diagnosed By, Assessed By, Conforme Signatures |
| `claim_stub` | `1.00` (Bottom) | `1.85` | Customer Claim Stub, Arrival Time, Release Gate |
| `chk_interior` | `0.10` | `1.85` | Checklist System 1-4 (Interior / Electrical) |
| `chk_underhood` | `0.35` | `1.85` | Checklist System 5-8 (Battery, Fluids, Engine) |
| `chk_underchassis` | `0.65` | `1.85` | Checklist System 9-12 (Suspension, Brakes, Tires)|
| `chk_bottom` | `1.00` | `1.85` | Checklist Remarks, Technician Signature, Fuel Gauge|

### 3.2 Viewport Translation Formula
To compute the exact pixel displacement on any viewport container:

```javascript
// Container and iframe dimensions
const containerW = wrap.clientWidth;
const containerH = wrap.clientHeight;
const iframeW = iframe.offsetWidth || containerW;
const iframeH = iframe.offsetHeight || containerH;
const scale = 1.85; // 185% Senior Legibility Zoom

// 1. Horizontal Centering:
const targetX = (containerW - (scale * iframeW)) / 2;

// 2. Vertical Pan Clamping:
// maxScrollY represents the maximum negative displacement before overshooting into blank space
const maxScrollY = containerH - (scale * iframeH);
const targetY = section.yRatio * maxScrollY;

// 3. CSS Transform Injection:
iframe.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
iframe.style.transformOrigin = '0 0';
iframe.style.transform = `translate(${Math.round(targetX)}px, ${Math.round(targetY)}px) scale(${scale})`;
```

---

## 4. Key Engineering Discoveries & Pitfalls to Avoid

When reviving this feature, avoid the following architectural traps discovered during previous iterations:

### ⚠️ Pitfall 1: The "200% Oversized Canvas + 0.5 Downscale" Trap (REV-128)
* **Mistake**: Wrapping the iframe in a 200% width/height container (~950px+) and scaling it down by `0.5` via CSS to achieve retina super-sampling.
* **Why it broke**: Chromium's built-in PDFium viewer detects the raw DOM element dimensions at load time. When it saw an enormous 200% box, it rendered the PDF page as a tiny letterboxed postage stamp inside a sea of black/blank space.
* **Solution**: Always keep the iframe at normal `w-full h-full` and use `applyStudioAspectFit` to dynamically match the exact aspect ratio of the underlying PDF page.

### ⚠️ Pitfall 2: Reloading the Iframe on Every Keystroke (REV-136)
* **Mistake**: Calling `generate*PDF()` on every `input` event with a short 300ms debounce.
* **Why it broke**: Whenever a native PDF iframe's `src` is reassigned, Chromium destroys the active document viewer instance and reinitializes it at default zoom (`scale(1.0)`). While a user typed a sentence, the document continuously snapped between zoomed and unzoomed states.
* **Solution**: Freeze PDF generation during active keypresses (`input` event). Trigger PDF refreshes only on `change` (field commit) or `blur` (moving to another field), or use an offscreen PDF canvas rather than reloading the main iframe.

### ⚠️ Pitfall 3: Premature Auto-Reset Timers (REV-130)
* **Mistake**: Setting a 3.5s or 5s inactivity timer to snap the document back to 100% Fit view.
* **Why it broke**: Senior Service Advisors reviewing complex parts numbers or reading diagnostic remarks felt disoriented when the camera suddenly snapped back while they were still reading.
* **Solution**: Keep the section locked indefinitely (**Permanent Document Lock**). The view should only change when the user moves to another field or explicitly toggles `[Fit]`.

---

## 5. Step-by-Step Revival & Re-Activation Guide

If stakeholder requirements mandate re-enabling the Auto-Magnifier, execute these 4 surgical steps:

### Step 1: Re-enable UI Controls in `frontend/index.html`
Add the toggle button and zoom presets back into `#form-top-tab-bar` or the canvas header:
```html
<button type="button" id="btn-studio-auto-magnify" onclick="toggleStudioAutoMagnify()" class="px-2.5 py-1 bg-red-600 text-white rounded-lg font-bold text-xs">
    <i data-lucide="zoom-in" class="w-3.5 h-3.5"></i> <span id="label-studio-auto-magnify">Auto-Magnify: ON</span>
</button>
<div class="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-[10px] font-bold">
    <button type="button" onclick="setStudioManualZoom(1.0)">Fit</button>
    <button type="button" onclick="setStudioManualZoom(1.85)">185%</button>
    <button type="button" onclick="setStudioManualZoom(2.25)">225%</button>
</div>
```

### Step 2: Restore State & Transform Engine in `frontend/js/app.js`
1. Set `isStudioAutoMagnifyEnabled = true;`
2. Restore the full `lockStudioSection(sectionKey)` implementation using the formulas in Section 3.2.
3. Re-enable `applyStudioFieldMagnification(el)`:
```javascript
function applyStudioFieldMagnification(elementOrId) {
    if (!isStudioAutoMagnifyEnabled) return;
    const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    const sectionKey = mapElementToSectionKey(el);
    lockStudioSection(sectionKey);
}
```

### Step 3: Reconnect Event Listeners
In `initForm13Studio()` and other sheet initializers, re-bind the `focus` listener on each form input:
```javascript
el.addEventListener('focus', () => {
    if (typeof applyStudioFieldMagnification === 'function') {
        applyStudioFieldMagnification(el);
    }
});
```

### Step 4: Run Regression Tests
Run the test runner to verify 100% passage:
```powershell
npm.cmd test
```

---

## 6. Document Governance & Ownership
* **Primary Author**: HonTech Core Engineering & QA Team
* **Original Implementation**: Commits `8f929c1` (REV-127), `c33418c` (REV-130), `e1bd399` (REV-131)
* **Shelving Commit**: `816a4ca` / `14edd54` (REV-141)
* **Master Architectural Cross-Reference**: [`HONTECH_SYSTEM_ARCHITECTURE_AND_USER_JOURNEY_MAP.md`](file:///c:/xampp/htdocs/CapstoneOfficial2_Development_Part-2-Hontech_Prototype_Process/Hontech%20Documentation/Technical/02_Architecture_and_Engineering/HONTECH_SYSTEM_ARCHITECTURE_AND_USER_JOURNEY_MAP.md)
