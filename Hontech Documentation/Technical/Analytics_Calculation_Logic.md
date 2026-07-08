# HonTech Analytics: Calculation Logic & Edge Cases

This document details the mathematical logic behind the Owner Dashboard analytics, specifically focusing on metrics that have been temporarily suspended for the MVP due to data complexity. This serves as a study guide for Version 2.0.

---

## 1. Average Service Time (Currently Suspended)

This metric attempts to calculate how long a vehicle spends in the shop. However, it presents significant mathematical challenges depending on the business definition of "Service Time."

### A. The "Total Customer Wait Time" Calculation
This is the simplest form of calculation based on our current database schema.
*   **Formula:** `Departure Time - Arrival Time`
*   **What it covers:** It measures the absolute total time the customer was waiting, from the second they arrived at the front desk to the second they were handed their keys.
*   **The Obstacle (Why it's suspended):** It makes the mechanics look very slow if there is a bottleneck at the front desk or if the car sits in the parking lot for 3 hours before moving to a lift.

### B. The "Carry-Over" 24-Hour Glitch (The Major Obstacle)
If a car arrives at 10:00 AM today, but requires a part that won't arrive until tomorrow, the SA changes the status to **"Carry Over"**. 
*   **The Problem:** If the car is finished the next day at 10:00 AM, the simple math (`Departure - Arrival`) calculates the service time as **24 hours (1,440 minutes)**. 
*   **The Danger:** If you include a 24-hour repair in the daily average alongside 1-hour oil changes, it completely destroys the average. The dashboard will tell the owner the "Average Service Time" is 8 hours, which is false and will cause panic.
*   **The V2.0 Solution:** The code must be updated to explicitly say: `if (job.status === 'Carry Over') { exclude_from_average() }`. Carry-over jobs must only be counted in the "Carry-Overs Recorded" metric, never the average time metric.

### C. The V2.0 Goal: "Actual Wrench Time"
To provide the owner with true mechanic efficiency, Version 2.0 must track "Wrench Time" instead of "Wait Time."
*   **What it requires:** Adding new database fields (`bayStartTime`, `bayEndTime`).
*   **How it works:** The timer *only* starts when the status changes to `Lift 1, 2, 3, or 4`. The timer *stops* when it is changed to `Ready` or `Carry Over`. This accurately tracks the exact minutes the mechanic was working on the vehicle.

---

## 2. Completion Success Rate (Active)

Unlike Average Service Time, this metric is mathematically safe and currently active on the dashboard.

*   **Formula:** `(Total Jobs Completed in Period / Total Jobs Registered in Period) * 100`
*   **What it covers:** It provides a percentage representing how much of the workload the shop successfully handled for a given day or month.
*   **Example:** If 10 cars enter the shop today, and 7 are marked as "Completed" or "Released", the Success Rate is 70%.
*   **Edge Cases:** There are no major edge cases here because it relies on raw document counting (`Job.countDocuments()`) rather than timestamps. Even if a car takes 12 hours, it still counts as exactly "1 Completed Job."

---

## 3. PMS Goal Success Rate (Active)

Tracks how efficiently the shop completes Preventive Maintenance Service (PMS) tasks against the internal 2-hour benchmark.

*   **Formula:** `(Total Successful PMS Jobs / (Total Successful PMS Jobs + Total Failed PMS Jobs)) * 100`
*   **What it covers:** Evaluates shop efficiency specifically for standard maintenance check-ups.
*   **Trigger Event:** Auto-calculates upon job completion. When a Service Advisor marks a `PMS` category job as `Completed`, the backend calculates `Departure Time - Arrival Time`.
    *   If the service duration is **less than or equal to 120 minutes (2 hours)**, the job is designated `Successful`.
    *   If it exceeds **120 minutes**, it is designated `Failed`.
    *   For non-PMS jobs, the designation defaults to `N/A`.
*   **Data Presentation:** The Owner Dashboard renders:
    *   An insight card displaying the calculated **PMS Goal Success Rate (%)**.
    *   Absolute count indicators displaying total **Successful** and **Failed** PMS jobs.

---

## 4. Workload Volume & Channel Distributions (Active)

*   **Intake Channels:** Compares `Walk-in` vs `Online` jobs using a doughnut chart representation to identify customer booking habits.
*   **Category Distribution:** Tracks volume across categories (`PMS`, `GR`, `Check-Up`, and custom typed entries under `Others`) using horizontal bar charts to identify the most requested shop services.
*   **Monthly Completed Volume:** Displays a line graph representing the volume of cars serviced over time to identify business seasonality trends.

