# HonTech AutoCenter Inc. — Future Development Roadmap & Feature Matrix
**Branch Reference**: `branch2-Security-Account-Recovery`  
**Target Defense / Production Delivery**: Capstone Part 2 Active Cycle  
**Institution**: STI College Marikina — BS in Information Technology  

---

## 📌 Executive Summary
This document serves as the **Future Development Roadmap** capturing prioritized system enhancements, advanced architectural revisions, and micro-UX improvements evaluated during active client and defense iterations.

---

## 🚀 Active Feature Backlog & Prioritization

### Phase 1: Interactive Workshop & Customer Notification (Current Delivery)
| Feature ID | Feature Name | Description | Status |
| :--- | :--- | :--- | :--- |
| **WS-01** | **TV Display Audio & Visual Chime** | Web Audio API dual-tone chime (587Hz $\rightarrow$ 880Hz) + floating notification banner triggered upon vehicle marked "Ready / Completed". | ✅ **Implemented (`v=2.84`)** |
| **WS-02** | **Unified Developer Sandbox Toolbox** | Expandable floating HUD containing Test Loader, Theme Selector, Dev Mailbox, Crash Diagnostics, and TV Audio Chime simulator. | ✅ **Implemented (`v=2.83`)** |
| **WS-03** | **Automotive Preloader Splash Themes** | 5 customizable loading animations (Single Big Gear, Classic Emblem, Turbo Tachometer, Cyber Scanner, Engine Pistons). | ✅ **Implemented (`v=2.82`)** |

---

### Phase 2: Security, Governance & Audit Trails (Upcoming Revisions)
| Feature ID | Feature Name | Description | Priority |
| :--- | :--- | :--- | :--- |
| **SEC-01** | **Owner Activity & Security Audit Log** | Immutable log table tracking staff role promotions/demotions, branch switching, login attempts, and password reset tokens with IP & timestamp. | 🔴 **High (Next Sprint)** |
| **SEC-02** | **Automated Offline Network Connectivity Banner** | Global detection hook (`navigator.onLine`) displaying floating reconnect/offline banner if network drops. | 🟡 **Medium** |
| **SEC-03** | **Biometric / PIN Fast-Switch for Service Advisors** | Quick 4-digit PIN lock screen to switch active SA terminals without full logout. | 🟢 **Future Release** |

---

### Phase 3: Workshop Job Card & Flow Enhancements
| Feature ID | Feature Name | Description | Priority |
| :--- | :--- | :--- | :--- |
| **JOB-01** | **Visual Job Progress Stepper / Timeline** | Step-by-step visual tracker in Job Card modal: `Intake` $\rightarrow$ `Lift Assigned` $\rightarrow$ `Under Inspection` $\rightarrow$ `In Progress` $\rightarrow$ `QC Check` $\rightarrow$ `Released`. | 🔴 **High** |
| **JOB-02** | **Parts Requisition & Inventory Linkage** | Auto-deduct workshop parts inventory (oil filters, brake pads) directly upon job order approval. | 🟡 **Medium** |
| **JOB-03** | **Customer Claim Stub SMS / QR Code Dispatch** | Generate SMS or printable QR claim stub for walk-in vehicle pickup verification. | 🟢 **Future Release** |

---

### Phase 4: Micro-UI & Analytics Optimization
| Feature ID | Feature Name | Description | Priority |
| :--- | :--- | :--- | :--- |
| **UI-01** | **Table Skeleton Shimmer Loaders** | Gray shimmering placeholder rows while database queries or search filters execute. | 🟡 **Medium** |
| **UI-02** | **Global Keyboard Command Palette (`Ctrl + K`)** | Instant shortcut overlay to search jobs, switch branches, or navigate sections. | 🟢 **Low / Polish** |
| **UI-03** | **Multi-Branch Comparative Financial Matrix** | Side-by-side revenue and bay occupancy comparisons across Marikina and Regalado branches. | 🟡 **Medium** |

---

## 🛠️ Verification & Diagnostic Protocols
1. **Developer Sandbox**: Accessible via bottom-right floating trigger `[ 🛠️ Dev Toolbox ]`.
2. **TV Audio Testing**: Use Action 5 (*TV Audio Chime*) to verify browser sound synthesizer.
3. **Database Seed Reset**: Use Developer Crash Overlay $\rightarrow$ Reset & Seed DB to restore test baseline.

---
*Maintained by the HonTech System Development Team (Branch 2: Security & Account Recovery)*
