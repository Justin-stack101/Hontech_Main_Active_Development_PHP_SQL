<?php
/**
 * HonTech AutoCenter — Multi-Day Test Data (2026-09-20 to 2026-09-22)
 *
 * Adds fresh QA records for exercising Daily Intakes, the Booking Module,
 * carry-overs and claim stubs. Safe to re-run: it only removes and re-adds
 * rows whose job_id starts with "TST-" and never touches other data.
 *
 * Usage:   php backend/seed_test_days.php
 * Cleanup: php backend/seed_test_days.php --clean
 */

require_once __DIR__ . '/vendor/autoload.php';

use App\Config\Env;
use App\Config\Database;

Env::load();
$db = Database::getConnection();

$removed = $db->exec("DELETE FROM jobs WHERE job_id LIKE 'TST-%'");
echo "Removed {$removed} previous TST- test rows.\n";

if (in_array('--clean', $argv ?? [], true)) {
    echo "Clean only, nothing re-added.\n";
    exit(0);
}

$D20 = '2026-09-20';
$D21 = '2026-09-21';
$D22 = '2026-09-22';
$MK  = 'Marikina Branch';
$EA  = 'East Branch';

// Claim stub in the same format the backend generates: MMDDYY + J + running number.
$stub = fn(string $date, int $n): string => date('mdy', strtotime($date)) . 'J' . $n;

$jobs = [
    // ===================== 09/20 — historical =====================
    ['TST-0920-01', 'Walk-in', 'TST 2001', 'Ramon Villanueva', '0917-200-0001', 'Toyota Vios 1.3 E', 'PMS', '10,000 KM PMS', 'Flexible Lane', $D20, '08:15', '09:45', null, '', 0, $stub($D20, 1), 'Yes', 'Oil & filter change done', 'Completed', 'None', $MK, null, null, '', '', 'Manney Sarol', $D20],
    ['TST-0920-02', 'Walk-in', 'TST 2002', 'Liza Manalo', '0917-200-0002', 'Honda City RS', 'GRS', 'Front brake noise', 'Express Lane', $D20, '09:00', '11:00', null, '', 0, $stub($D20, 2), 'Yes', 'Front pads replaced', 'Completed', 'None', $MK, null, null, '', '', 'Marriel Ayo', $D20],
    ['TST-0920-03', 'Online', 'TST 2003', 'Paolo Reyes', '0917-200-0003', 'Mitsubishi Xpander', 'PMS', '20,000 KM PMS', 'Flexible Lane', $D20, '10:30', '13:00', $D20, '10:30', 1, $stub($D20, 3), 'Yes', 'PMS package completed', 'Completed', 'None', $MK, null, null, '', '', 'Manney Sarol', $D20],
    ['TST-0920-04', 'Walk-in', 'TST 2004', 'Angela Cruz', '0917-200-0004', 'Ford Everest Titanium', 'GRS', 'Alternator not charging', 'Special Lane', $D20, '13:30', '', null, '', 0, $stub($D20, 4), 'No', 'Alternator on order', 'Carry Over', 'None', $MK, null, $D22, 'Waiting for Parts', 'Parts ETA 09/22', 'Manney Sarol', null],
    ['TST-0920-05', 'Walk-in', 'TST 2005', 'Miguel Torres', '0917-200-0005', 'Nissan Navara EL', 'PMS & GRS', '40,000 KM PMS + shocks', 'Flexible Lane', $D20, '14:15', '', null, '', 0, $stub($D20, 5), 'Pending', 'Awaiting customer approval on quote', 'Carry Over', 'None', $MK, null, $D21, 'Awaiting Approval', '', 'Marriel Ayo', null],
    ['TST-0920-06', 'Walk-in', 'TST 2006', 'Sofia Lim', '0917-200-0006', 'Suzuki Ertiga', 'PMS', '5,000 KM PMS', 'Express Lane', $D20, '15:00', '16:20', null, '', 0, $stub($D20, 6), 'Yes', 'Express PMS done', 'Completed', 'None', $MK, null, null, '', '', 'Marriel Ayo', $D20],
    ['TST-0920-EA1', 'Walk-in', 'TST 2101', 'Jerome Castillo', '0918-200-0101', 'Toyota Innova', 'PMS', '30,000 KM PMS', 'Flexible Lane', $D20, '09:30', '11:45', null, '', 0, 'EAST-' . $stub($D20, 1), 'Yes', 'Done', 'Completed', 'None', $EA, null, null, '', '', 'Ed Marvin Malantay', $D20],

    // ===================== 09/21 — yesterday =====================
    ['TST-0921-01', 'Walk-in', 'TST 2011', 'Danica Ong', '0917-210-0001', 'Hyundai Accent', 'PMS', '15,000 KM PMS', 'Flexible Lane', $D21, '08:00', '10:00', null, '', 0, $stub($D21, 1), 'Yes', 'PMS complete', 'Completed', 'None', $MK, null, null, '', '', 'Manney Sarol', $D21],
    ['TST-0921-02', 'Online', 'TST 2012', 'Kevin Santos', '0917-210-0002', 'Toyota Fortuner', 'GRS', 'AC not cooling', 'Priority Lane', $D21, '09:30', '12:30', $D21, '09:30', 1, $stub($D21, 2), 'Yes', 'AC recharge + compressor check', 'Completed', 'None', $MK, null, null, '', '', 'Marriel Ayo', $D21],
    ['TST-0921-03', 'Walk-in', 'TST 2013', 'Bea Navarro', '0917-210-0003', 'Mazda 3 Sedan', 'GRS', 'Suspension knocking', 'Special Lane', $D21, '10:15', '', null, '', 0, $stub($D21, 3), 'No', 'Stabilizer links on backorder', 'Carry Over', 'None', $MK, null, $D22, 'Waiting for Parts', 'Supplier delivers 09/22', 'Manney Sarol', null],
    ['TST-0921-04', 'Walk-in', 'TST 2014', 'Carlo Mendoza', '0917-210-0004', 'Isuzu D-Max LS', 'PMS', '50,000 KM PMS', 'Flexible Lane', $D21, '11:00', '14:30', null, '', 0, $stub($D21, 4), 'Yes', 'Major PMS complete', 'Completed', 'None', $MK, null, null, '', '', 'Marriel Ayo', $D21],
    ['TST-0921-05', 'Walk-in', 'TST 2015', 'Nina Bautista', '0917-210-0005', 'Kia Seltos', 'PMS', '10,000 KM PMS', 'Express Lane', $D21, '13:00', '14:40', null, '', 0, $stub($D21, 5), 'Yes', 'Express PMS done', 'Completed', 'None', $MK, null, null, '', '', 'Manney Sarol', $D21],
    ['TST-0921-06', 'Walk-in', 'TST 2016', 'Oscar Dizon', '0917-210-0006', 'Ford Ranger Wildtrak', 'Others', 'Bumper repaint', 'Special Lane', $D21, '14:00', '', null, '', 0, $stub($D21, 6), 'Yes', 'Paint curing in progress', 'Carry Over', 'None', $MK, null, $D22, 'Extended Repair', 'Curing overnight', 'Marriel Ayo', null],
    ['TST-0921-EA1', 'Walk-in', 'TST 2111', 'Trisha Domingo', '0918-210-0101', 'Honda Civic', 'GRS', 'Brake fluid flush', 'Flexible Lane', $D21, '10:00', '12:00', null, '', 0, 'EAST-' . $stub($D21, 1), 'Yes', 'Done', 'Completed', 'None', $EA, null, null, '', '', 'Carl Domingo', $D21],

    // ===================== 09/22 — today (active queue) =====================
    ['TST-0922-01', 'Walk-in', 'TST 2021', 'Hannah Uy', '0917-220-0001', 'Toyota Hilux Conquest', 'PMS', '30,000 KM PMS', 'Flexible Lane', $D22, '08:10', '', null, '', 0, $stub($D22, 1), 'Yes', 'Queued for bay assignment', 'Waiting', 'None', $MK, null, null, '', '', 'Manney Sarol', null],
    ['TST-0922-02', 'Walk-in', 'TST 2022', 'Ivan Padilla', '0917-220-0002', 'Honda BR-V', 'GRS', 'Engine check light', 'Express Lane', $D22, '08:40', '', null, '', 0, $stub($D22, 2), 'Pending', 'OBD scan in progress', 'Monitoring', 'Bay 1', $MK, 1, null, '', '', 'Marriel Ayo', null],
    ['TST-0922-03', 'Walk-in', 'TST 2023', 'Julia Ferrer', '0917-220-0003', 'Mitsubishi Montero Sport', 'PMS & GRS', '20,000 KM PMS + brakes', 'Priority Lane', $D22, '09:05', '', null, '', 0, $stub($D22, 3), 'Yes', 'Brake pads + PMS ongoing', 'Monitoring', 'Bay 2', $MK, 2, null, '', '', 'Manney Sarol', null],
    ['TST-0922-04', 'Walk-in', 'TST 2024', 'Kyle Ramos', '0917-220-0004', 'Suzuki Swift', 'PMS', '5,000 KM PMS', 'Express Lane', $D22, '09:20', '', null, '', 0, $stub($D22, 4), 'Yes', 'Service complete, awaiting release', 'Ready to Release', 'None', $MK, null, null, '', '', 'Marriel Ayo', null],
    ['TST-0922-05', 'Walk-in', 'TST 2025', 'Lorna Aquino', '0917-220-0005', 'Nissan Terra VL', 'Others', 'Aircon evaporator leak', 'Special Lane', $D22, '09:45', '', null, '', 0, $stub($D22, 5), 'No', 'Evaporator core on order', 'Waiting', 'None', $MK, null, null, '', '', 'Manney Sarol', null],
    ['TST-0922-06', 'Walk-in', 'TST 2026', 'Marco Delos Reyes', '0917-220-0006', 'Toyota Innova 2.8', 'GRS', 'Clutch slipping', 'Flexible Lane', $D22, '10:10', '', null, '', 0, $stub($D22, 6), 'Yes', 'Clutch kit replacement', 'Processing', 'Bay 3', $MK, 3, null, '', '', 'Marriel Ayo', null],
    // Online bookings pending in the Booking Module (no claim stub until they arrive)
    ['TST-0922-ON1', 'Online', 'TST 2031', 'Nora Salazar', '0917-220-1001', 'Hyundai Tucson', 'PMS', '', 'Express Lane', $D22, '', '', $D22, '13:00', 1, '', 'Pending', '', 'Pending', 'None', $MK, null, null, '', '', '', null],
    ['TST-0922-ON2', 'Online', 'TST 2032', 'Owen Tiu', '0917-220-1002', 'Ford Territory', 'GRS', '', 'Flexible Lane', $D22, '', '', $D22, '14:30', 0, '', 'Pending', 'Unconfirmed — call customer', 'Pending', 'None', $MK, null, null, '', '', '', null],
    ['TST-0922-ON3', 'Online', 'TST 2033', 'Pia Gonzales', '0917-220-1003', 'Geely Coolray', 'PMS & GRS', '', 'Priority Lane', $D22, '', '', $D22, '15:30', 1, '', 'Pending', '', 'Pending', 'None', $MK, null, null, '', '', '', null],
    // Online booking already arrived today (moved to Waiting, stub issued)
    ['TST-0922-ON4', 'Online', 'TST 2034', 'Quinn Abad', '0917-220-1004', 'Toyota Wigo', 'PMS', '', 'Express Lane', $D22, '10:00', '', $D22, '10:00', 1, $stub($D22, 7), 'Yes', 'Booked customer arrived on time', 'Waiting', 'None', $MK, null, null, '', '', 'Manney Sarol', null],
    ['TST-0922-EA1', 'Walk-in', 'TST 2121', 'Ryan Alcantara', '0918-220-0101', 'Mazda CX-5', 'PMS', '20,000 KM PMS', 'Flexible Lane', $D22, '09:00', '', null, '', 0, 'EAST-' . $stub($D22, 1), 'Yes', 'In service', 'Monitoring', 'Bay 1', $EA, 1, null, '', '', 'Ed Marvin Malantay', null],
    ['TST-0922-EA2', 'Online', 'TST 2122', 'Sheila Perez', '0918-220-1101', 'Kia Sportage', 'GRS', '', 'Flexible Lane', $D22, '', '', $D22, '11:00', 1, '', 'Pending', '', 'Pending', 'None', $EA, null, null, '', '', '', null],
];

$insert = $db->prepare(
    'INSERT INTO jobs (job_id, source, plate, name, contact, vehicle, category, concern, lane_type,
        date_received, arrival, departure, appt_date, appt_time, confirmed, claim_stub, parts_available,
        evaluation, status, location, branch, bay_assigned, promised_date, carry_over_status, remarks,
        sa_name, date_completed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

$counts = [];
foreach ($jobs as $row) {
    $insert->execute($row);
    $key = "{$row[9]} {$row[18]}";
    $counts[$key] = ($counts[$key] ?? 0) + 1;
}

ksort($counts);
echo "Inserted " . count($jobs) . " test rows:\n";
foreach ($counts as $k => $n) {
    echo "  {$k}: {$n}\n";
}
