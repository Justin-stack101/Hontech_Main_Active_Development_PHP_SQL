# HonTech AutoCenter Management System
## Executive User Guide, Module Tutorial & Technical Architecture
*Prepared for the Company President, General Manager, and Capstone Examination Panel*

---

## 🏛️ 1. Executive Summary & Purpose

The **HonTech AutoCenter Management System** is an enterprise-grade automotive workshop monitoring, intake tracking, and operational intelligence platform.

### Primary Purpose for the Company President:
1. **Executive Oversight Without Micro-Management**: Provides real-time visibility into workshop capacity, live bay occupancy, and daily vehicle intake volume across branches.
2. **Turnaround SLA Enforcement ($\le 60$ Minutes)**: Tracks Express Lane turnaround velocity and flags operational friction points causing delays.
3. **Data-Driven Strategic Decisions**: Replaces guesswork with factual descriptive analytics to guide decisions on technician staffing, parts inventory safety stock, and bay scheduling.
4. **Zero Black-Box / Zero AI**: 100% deterministic, transparent arithmetic (counts, sums, and averages) powered by PHP, MySQL PDO, and vanilla JavaScript.

---

## 🧭 2. Complete Dashboard Walkthrough (The 4 Executive Tabs)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                 HONTECH DASHBOARD SUITE                                  │
├──────────────────────────┬──────────────────────────┬─────────────────────────┬──────────┤
│ 1. Live Operations       │ 2. Analytics & Reports   │ 3. Report Data          │ 4. Express & Delay │
│    Monitor               │    Center                │    (Intake & Flow)      │    Intelligence    │
└──────────────────────────┴──────────────────────────┴─────────────────────────┴──────────┘
```

---

### 🟢 Tab 1: Live Operations Monitor
* **What It Displays**: Real-time status of all active vehicles currently in the workshop.
* **Key Components**:
  * **Active Vehicle Queue**: Visual cards showing vehicle plate, claim stub, model, customer name, assigned Service Advisor (SA), and service category.
  * **Live Stage Tracking**: Shows vehicle stage (`Intake Reception` $\rightarrow$ `Inspection & Estimate` $\rightarrow$ `In-Progress Repair` $\rightarrow$ `Quality Inspection` $\rightarrow$ `Ready for Release`).
  * **Elapsed Job Timer**: Live counter showing active duration on the floor.
* **How the President Uses It**: Identifies workshop bottlenecks in real time during peak hours without walking to the shop floor.

---

### 🔵 Tab 2: Analytics & Reports Center
* **What It Displays**: Historical performance, financial trends, and staff productivity over selected timeframes (Daily, Weekly, Monthly, Custom Range).
* **Key Components**:
  * **Throughput KPIs**: Total Completed Jobs, Total Invoiced Revenue, Average Ticket Size.
  * **Service Advisor (SA) Leaderboard**: Jobs handled, completion rate, and revenue contribution per advisor.
  * **Status Breakdown Chart**: Proportion of completed, in-progress, and cancelled repair orders.
* **How the President Uses It**: Evaluates staff performance, monthly revenue targets, and seasonal demand trends.

---

### 🟣 Tab 3: Report Data (Intake & Flow)
* **What It Displays**: Daily and periodic intake trends, target fulfillment, service mix, and peak workshop hours.
* **Key Components**:
  * **Target vs. Actual Intakes Comparison**: Compares the branch's daily intake capacity target (e.g. 25 cars/day) against actual recorded intake volume.
  * **Service Mix Distribution**: Quantifies the workload breakdown across:
    * **PMS (Preventive Maintenance Service)**: Oil change, fluid checks, filter replacement.
    * **GRS (General Repair Service)**: Major engine, transmission, electrical, or suspension repair.
    * **Carry-Over**: Jobs from the previous day still being serviced.
    * **Express**: Quick-service turnaround under 60 minutes.
  * **Intakes Inflow by Channel**: Compares **Walk-In Customers** vs. **Online Bookings**.
  * **Intakes Trend & Peak Hour Analysis**: Hourly arrival distribution identifying workshop peak hours (e.g. 8:00 AM – 10:00 AM rush).
  * **Daily Intakes Audit Table**: Comprehensive day-by-day table showing walk-ins, online bookings, category counts, capacity load %, and peak hour.
* **How the President Uses It**: Adjusts technician shift schedules and allocates service bays based on actual intake channels and peak hours.

---

### ⚡ Tab 4: Express Lane SLA Performance & Delay Root Causes Intelligence
* **What It Displays**: Focused executive analytics on quick-service turnaround and operational failure modes.
* **Key Components**:
  1. **4 KPI Scorecards**:
     * **SLA Compliance Rate ($\le 60$m)**: Percentage of express jobs completed within the 1-hour target (Target $\ge 90\%$).
     * **Turnaround Velocity**: Average duration in minutes, fastest job, and longest overrun.
     * **SLA Overrun Count**: Total breached vehicles and average extra minutes (+mins).
     * **Top Root Cause**: Leading bottleneck driving delays (e.g. Parts Stockout, Customer Approval Delay, Bay Congestion).
  2. **Interactive Visual Charts**:
     * **Turnaround Duration Distribution Histogram**: Groups completed jobs into time brackets ($\le 30$m, 31–45m, 46–60m, 61–90m, $>90$m).
     * **Delay Root Cause Pareto Ranking**: Sorts failure reasons by incident count to highlight highest-impact friction points.
  3. **Factual Analytical Tables**:
     * **Category SLA Performance Breakdown**: Compares Express PMS vs. Express GRS vs. Quick Diagnostics.
     * **Delay Root Cause Impact Summary**: Shows frequency count, percentage share, and average overrun minutes (+mins).
  4. **Detailed Delayed Services Diagnostic Audit Log**: Complete audit table of all overrunning jobs with 1-click CSV Export and Print Brief.
* **How the President Uses It**: Pinpoints why quick jobs get delayed and takes targeted action with suppliers, bay allocation, or customer communication workflows.

---

## 🧮 3. Transparent Mathematical Formulas Reference

The entire system uses standard arithmetic so every number is 100% explainable during audits or capstone examinations:

| Metric | Formula | Example |
| :--- | :--- | :--- |
| **Job Turnaround Duration** | $\text{Departure Time} - \text{Arrival Time}$ | 09:45 AM $-$ 08:30 AM $= 75\text{ mins}$ |
| **SLA Compliance Rate** | $\left(\frac{\text{Express Jobs with Duration } \le 60\text{ mins}}{\text{Total Express Jobs}}\right) \times 100$ | $\frac{18}{20} \times 100 = 90.0\%$ |
| **Average Turnaround Duration** | $\frac{\sum \text{Job Durations}}{\text{Total Completed Jobs}}$ | $\frac{920\text{ mins}}{20\text{ jobs}} = 46\text{ mins}$ |
| **Average Overrun Delta** | $\frac{\sum (\text{Duration} - 60)}{\text{Total Overrun Jobs}}$ | $\frac{52\text{ mins overrun}}{2\text{ delayed jobs}} = +26\text{ mins}$ |
| **Target Fulfillment Rate** | $\left(\frac{\text{Actual Intakes}}{\text{Target Intakes}}\right) \times 100$ | $\frac{23}{25} \times 100 = 92.0\%$ |
| **Capacity Load Percentage** | $\left(\frac{\text{Total Vehicles in Workshop}}{\text{Maximum Bay Capacity}}\right) \times 100$ | $\frac{14}{16} \times 100 = 87.5\%$ |
| **Root Cause Impact Share** | $\left(\frac{\text{Incidents for Reason } X}{\text{Total Delayed Incidents}}\right) \times 100$ | $\frac{3\text{ Parts Delays}}{6\text{ Total Delays}} \times 100 = 50.0\%$ |

---

## 📄 4. Exporting, Auditing & Printing Guide

The system supports executive reporting in multiple formats:

1. **Top Header Export Actions**:
   * **PDF Export**: Generates high-resolution executive summary tables with date filters and branding.
   * **Excel / Word Export**: Exports tabular spreadsheet data for accounting and financial analysis.
   * **Comprehensive Export Modal**: Allows selecting custom date ranges, branches, and specific metrics.
2. **Express Delay Audit Log Export**:
   * **Export Delay Log (CSV)**: Generates a CSV audit file containing plate numbers, timestamps, duration, overrun minutes, and diagnostic remarks.
   * **Print Executive Brief**: Formats a clean, high-contrast, black-and-white printable summary ready for executive board meetings.

---

## 🛡️ 5. Technical Architecture & Defense Points

* **Architecture**: PHP 8+ MVC Backend + MySQL PDO + Vanilla JavaScript / HTML5 / Tailwind CSS.
* **Security & Auth**: Role-Based Access Control (RBAC) supporting 4 distinct roles:
  * **Owner / President**: Full analytical suite, financial reports, multi-branch overview.
  * **Admin**: Staff management, system settings, master audit logs.
  * **Service Advisor (SA)**: Job reception, repair order estimates, customer claim stubs.
  * **Assistant**: Read-only queue monitor, vehicle inspection checklist.
* **Offline & Intranet Resilience**: Defensive JavaScript guards protect all Chart.js instances and Lucide icon rendering from network latency or offline intranet deployment.
