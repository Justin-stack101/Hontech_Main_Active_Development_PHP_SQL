<?php
/**
 * HonTech AutoCenter — Database Seeder
 * 
 * Port of server.js seedDatabase() function (lines 32-329).
 * Seeds 5 default users and 17 historical jobs.
 * 
 * Usage: php backend/seed.php
 */

require_once __DIR__ . '/vendor/autoload.php';

use App\Config\Env;
use App\Config\Database;

Env::load();
$db = Database::getConnection();

echo "=== HonTech Database Seeder ===\n\n";

// =============================================
// SEED USERS
// =============================================
$defaultUsers = [
    // 1. TOP GLOBAL EXECUTIVE
    ['name' => 'Engr. Antonio Honrado',   'role' => 'owner',     'email' => 'owner@hontech.com',      'password' => Env::get('OWNER_PASSWORD', 'owner123'), 'branch' => 'Marikina Branch'],

    // 2. MARIKINA MAIN BRANCH (Branch 1)
    ['name' => 'Adrian Mendoza',          'role' => 'admin',     'email' => 'admin@hontech.com',      'password' => Env::get('ADMIN_PASSWORD', 'admin123'), 'branch' => 'Marikina Branch'],
    ['name' => 'Mark Bautista',           'role' => 'sa',        'email' => 'sa@hontech.com',         'password' => Env::get('SA_PASSWORD', 'sa123'),       'branch' => 'Marikina Branch'],
    ['name' => 'Dayne Ramirez',           'role' => 'sa',        'email' => 'sa2@hontech.com',        'password' => Env::get('SA_PASSWORD', 'sa123'),       'branch' => 'Marikina Branch'],
    ['name' => 'Jessica Cruz',            'role' => 'assistant', 'email' => 'staff@hontech.com',      'password' => Env::get('STAFF_PASSWORD', 'staff123'), 'branch' => 'Marikina Branch'],
    ['name' => 'Juan Santos',             'role' => 'tech',      'email' => 'tech@hontech.com',       'password' => Env::get('TECH_PASSWORD', 'tech123'),   'branch' => 'Marikina Branch'],

    // 3. EAST BRANCH (Branch 2 - Other Branch)
    ['name' => 'Adrian Mendoza',          'role' => 'admin',     'email' => 'admin.east@hontech.com', 'password' => Env::get('ADMIN_PASSWORD', 'admin123'), 'branch' => 'East Branch'],
    ['name' => 'Alex Valenzuela',         'role' => 'sa',        'email' => 'sa.east@hontech.com',    'password' => Env::get('SA_PASSWORD', 'sa123'),       'branch' => 'East Branch'],
    ['name' => 'Carl Domingo',            'role' => 'sa',        'email' => 'sa2.east@hontech.com',   'password' => Env::get('SA_PASSWORD', 'sa123'),       'branch' => 'East Branch'],
    ['name' => 'Maria Aquino',            'role' => 'assistant', 'email' => 'staff.east@hontech.com', 'password' => Env::get('STAFF_PASSWORD', 'staff123'), 'branch' => 'East Branch'],
];

foreach ($defaultUsers as $u) {
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$u['email']]);

    if (!$stmt->fetch()) {
        $hashed = password_hash($u['password'], PASSWORD_BCRYPT, ['cost' => 10]);
        $stmt   = $db->prepare('INSERT INTO users (name, email, password, role, branch) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$u['name'], $u['email'], $hashed, $u['role'], $u['branch']]);
        echo "[+] Seeded user: {$u['name']} ({$u['email']}) for {$u['branch']}\n";
    } else {
        $stmt = $db->prepare('UPDATE users SET name = ?, branch = ?, role = ? WHERE email = ?');
        $stmt->execute([$u['name'], $u['branch'], $u['role'], $u['email']]);
        echo "[=] Updated user branch/role/name: {$u['email']} -> {$u['name']} ({$u['branch']} - {$u['role']})\n";
    }
}

// Ensure all existing active users have Marikina Branch
$db->exec("UPDATE users SET branch = 'Marikina Branch' WHERE branch = 'Branch A' OR branch = 'Branch B' OR branch IS NULL;");

// =============================================
// SEED JOBS
// =============================================
echo "\nSeeding active and historical jobs with current relative dates...\n";
$db->exec('SET FOREIGN_KEY_CHECKS = 0;');
$db->exec('TRUNCATE TABLE jobs;');
$db->exec('SET FOREIGN_KEY_CHECKS = 1;');

$today = date('Y-m-d');

$getRelativeDate = function(int $offsetDays): string {
    return date('Y-m-d', strtotime("-{$offsetDays} days"));
};

// Build date-relative claim stubs
$todayCompact = substr(str_replace('-', '', $today), 4); // MMDDYY from YYYYMMDD

$defaultJobs = [
    // BRANCH A — TODAY (Active & Completed)
    [
        'job_id' => 'ONL-1001', 'source' => 'Online', 'plate' => 'XYZ 123', 'name' => 'Alice Smith',
        'contact' => '0912-345-6789', 'category' => 'PMS', 'vehicle' => 'Toyota Vios',
        'concern' => 'Change Oil and Filter', 'date_received' => $today,
        'appt_date' => $today, 'appt_time' => '08:00', 'confirmed' => 1,
        'status' => 'Pending', 'parts_available' => 'Yes', 'lane_type' => 'PMS & GRS Lane', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'WLK-2002', 'source' => 'Walk-in', 'plate' => 'ABC 987', 'name' => 'Bob Jones',
        'contact' => '0912-000-1111', 'category' => 'GRS', 'vehicle' => 'Honda Civic',
        'concern' => 'Brakes squeaking, check pads', 'date_received' => $today,
        'arrival' => '09:00', 'claim_stub' => "{$todayCompact}-001",
        'parts_available' => 'Pending', 'evaluation' => 'Front Brake Pads Replacement',
        'status' => 'Monitoring', 'location' => 'Bay 1', 'bay_assigned' => 1,
        'lane_type' => 'PMS & GRS Lane', 'sa_name' => 'Mark Bautista', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'WLK-2003', 'source' => 'Walk-in', 'plate' => 'LMN 456', 'name' => 'Charlie Brown',
        'contact' => '0912-555-5555', 'category' => 'Others', 'vehicle' => 'Nissan Navara',
        'concern' => 'Scratch on front bumper & alignment', 'date_received' => $today,
        'claim_stub' => "{$todayCompact}-002",
        'parts_available' => 'No', 'evaluation' => 'Front Bumper Painting & Curing',
        'status' => 'Carry Over', 'carry_over_status' => 'Awaiting Parts', 'promised_date' => $today, 'lane_type' => 'Flexible',
        'remarks' => 'Paint curing delay', 'sa_name' => 'Mark Bautista', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'WLK-2025', 'source' => 'Walk-in', 'plate' => 'NDH 5521', 'name' => 'Diana Prince',
        'contact' => '0917-888-0001', 'category' => 'GRS', 'vehicle' => 'Mazda CX-5',
        'concern' => 'Intermittent engine stalling & wiring harness check', 'date_received' => $today,
        'claim_stub' => "{$todayCompact}-011",
        'parts_available' => 'Yes', 'evaluation' => 'ECU Diagnostic & Harness Rewiring',
        'status' => 'Carry Over', 'carry_over_status' => 'Extended Repair', 'promised_date' => $today, 'lane_type' => 'Flexible',
        'remarks' => 'Extended diagnostic trace required', 'sa_name' => 'Mark Bautista', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'WLK-2026', 'source' => 'Walk-in', 'plate' => 'BAT 999', 'name' => 'Bruce Wayne',
        'contact' => '0918-999-0002', 'category' => 'Others', 'vehicle' => 'Porsche Macan',
        'concern' => 'Custom brake upgrade kit installation', 'date_received' => $today,
        'claim_stub' => "{$todayCompact}-012",
        'parts_available' => 'No', 'evaluation' => 'Brembo Calipers & Rotors Import Pending',
        'status' => 'Carry Over', 'carry_over_status' => 'Awaiting Parts', 'promised_date' => $today, 'lane_type' => 'Special Lane',
        'remarks' => 'Custom parts arrival pending courier', 'sa_name' => 'Mark Bautista', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'WLK-2004', 'source' => 'Walk-in', 'plate' => 'AAA 1111', 'name' => 'Dave Smith',
        'contact' => '0917-111-2222', 'category' => 'PMS', 'vehicle' => 'Toyota Fortuner',
        'concern' => '40k KM PMS checkup', 'date_received' => $today,
        'arrival' => '08:30', 'departure' => '10:30',
        'claim_stub' => "{$todayCompact}-003", 'evaluation' => '40K Heavy PMS Service Done',
        'status' => 'Completed', 'date_completed' => $today, 'lane_type' => 'PMS & GRS Lane',
        'sa_name' => 'Mark Bautista', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'ONL-1005', 'source' => 'Online', 'plate' => 'BBB 2222', 'name' => 'Elena Rostova',
        'contact' => '0918-333-4444', 'category' => 'GRS', 'vehicle' => 'Hyundai Accent',
        'concern' => 'Alternator replacement', 'date_received' => $today,
        'arrival' => '10:00', 'departure' => '12:15',
        'claim_stub' => "{$todayCompact}-004", 'evaluation' => 'New Denso Alternator Installed',
        'status' => 'Completed', 'date_completed' => $today, 'lane_type' => 'PMS & GRS Lane',
        'sa_name' => 'Mark Bautista', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'WLK-2005', 'source' => 'Walk-in', 'plate' => 'NKO 4821', 'name' => 'Carlos Yulo',
        'contact' => '0919-444-5555', 'category' => 'PMS', 'vehicle' => 'Toyota Innova 2.8',
        'concern' => '10,000 KM Periodic Maintenance', 'date_received' => $today,
        'arrival' => '08:15', 'claim_stub' => "{$todayCompact}-005",
        'evaluation' => 'Fully Synthetic Oil Change & Filter',
        'status' => 'Waiting', 'location' => 'None', 'lane_type' => 'PMS & GRS Lane',
        'sa_name' => 'Mark Bautista', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'WLK-2020', 'source' => 'Walk-in', 'plate' => 'WXY 9012', 'name' => 'Ramon Santos',
        'contact' => '0920-111-9999', 'category' => 'GRS', 'vehicle' => 'Isuzu D-Max',
        'concern' => 'Clutch slipping, inspect assembly', 'date_received' => $today,
        'arrival' => '09:30', 'claim_stub' => "{$todayCompact}-006",
        'evaluation' => 'Clutch Disc & Release Bearing Replace',
        'status' => 'Monitoring', 'location' => 'Bay 2', 'bay_assigned' => 2,
        'lane_type' => 'PMS & GRS Lane', 'sa_name' => 'Mark Bautista', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'WLK-2021', 'source' => 'Walk-in', 'plate' => 'NDR 7741', 'name' => 'Maria Clara',
        'contact' => '0921-777-8888', 'category' => 'PMS & GRS', 'vehicle' => 'Honda HR-V',
        'concern' => 'Engine check light & CVT fluid change', 'date_received' => $today,
        'arrival' => '10:15', 'claim_stub' => "{$todayCompact}-007",
        'evaluation' => 'OBD Diagnostic Scan & HCF-2 Fluid Flush',
        'status' => 'Monitoring', 'location' => 'Bay 3', 'bay_assigned' => 3,
        'lane_type' => 'Express Lane', 'sa_name' => 'Mark Bautista', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'WLK-2022', 'source' => 'Walk-in', 'plate' => 'ZTB 3319', 'name' => 'Juan Dela Cruz',
        'contact' => '0922-333-2222', 'category' => 'Others', 'vehicle' => 'Hyundai Creta',
        'concern' => 'Aircon not cooling', 'date_received' => $today,
        'arrival' => '11:00', 'claim_stub' => "{$todayCompact}-008",
        'evaluation' => 'Aircon Leak Test & Freon Recharge Complete',
        'status' => 'Ready to Release', 'location' => 'None',
        'lane_type' => 'Flexible', 'sa_name' => 'Mark Bautista', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'WLK-2023', 'source' => 'Walk-in', 'plate' => 'KGB 8820', 'name' => 'Pedro Penduko',
        'contact' => '0923-444-5555', 'category' => 'PMS', 'vehicle' => 'Montero Sport',
        'concern' => '20,000 KM Maintenance & Brake Cleaning', 'date_received' => $today,
        'arrival' => '11:30', 'claim_stub' => "{$todayCompact}-009",
        'evaluation' => 'Engine Flush & Brake Pad Service',
        'status' => 'Waiting', 'location' => 'None',
        'lane_type' => 'Priority Lane', 'sa_name' => 'Mark Bautista', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'WLK-2024', 'source' => 'Walk-in', 'plate' => 'NXX 1234', 'name' => 'Andres Bonifacio',
        'contact' => '0924-555-6666', 'category' => 'GRS', 'vehicle' => 'Ford Ranger Wildtrak',
        'concern' => 'Suspension noise & wheel alignment', 'date_received' => $today,
        'arrival' => '12:00', 'claim_stub' => "{$todayCompact}-010",
        'evaluation' => 'Front Shock Bushing Replace & Calibrate',
        'status' => 'Monitoring', 'location' => 'Bay 4', 'bay_assigned' => 4,
        'lane_type' => 'Special Lane', 'sa_name' => 'Mark Bautista', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'WLK-2027', 'source' => 'Walk-in', 'plate' => 'NDS 1024', 'name' => 'Mateo Santos',
        'contact' => '0925-111-2233', 'category' => 'PMS', 'vehicle' => 'Toyota Hilux Conquest',
        'concern' => '30,000 KM Periodic Maintenance', 'date_received' => $today,
        'arrival' => '08:45', 'claim_stub' => "{$todayCompact}-013",
        'evaluation' => '30k KM PMS + Fuel Filter Replacement',
        'status' => 'Waiting', 'location' => 'None',
        'lane_type' => 'PMS & GRS Lane', 'sa_name' => 'Mark Bautista', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'WLK-2028', 'source' => 'Walk-in', 'plate' => 'CAR 8841', 'name' => 'Camille Rodriguez',
        'contact' => '0926-222-3344', 'category' => 'GRS', 'vehicle' => 'Honda City RS',
        'concern' => 'Front suspension knocking sound', 'date_received' => $today,
        'arrival' => '09:15', 'claim_stub' => "{$todayCompact}-014",
        'evaluation' => 'Front Shock Absorber & Stabilizer Link Replacement',
        'status' => 'Monitoring', 'location' => 'Bay 1', 'bay_assigned' => 1,
        'lane_type' => 'Flexible Lane', 'sa_name' => 'Mark Bautista', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'WLK-2029', 'source' => 'Walk-in', 'plate' => 'GBR 7720', 'name' => 'Gabriel Cruz',
        'contact' => '0927-333-4455', 'category' => 'PMS', 'vehicle' => 'Mitsubishi Xpander Cross',
        'concern' => '20,000 KM PMS + Brake Cleaning', 'date_received' => $today,
        'arrival' => '10:00', 'claim_stub' => "{$todayCompact}-015",
        'evaluation' => '20,000 KM Periodic Maintenance & Brake Service',
        'status' => 'Waiting', 'location' => 'None',
        'lane_type' => 'Express Lane', 'sa_name' => 'Dayne Ramirez', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'WLK-2030', 'source' => 'Walk-in', 'plate' => 'PAT 3390', 'name' => 'Patricia Lim',
        'contact' => '0928-444-5566', 'category' => 'Others', 'vehicle' => 'Ford Everest Titanium',
        'concern' => 'Power steering fluid flush & belt inspection', 'date_received' => $today,
        'arrival' => '10:30', 'claim_stub' => "{$todayCompact}-016",
        'evaluation' => 'Power Steering Fluid Flush & Belt Tensioner Adjustment',
        'status' => 'Monitoring', 'location' => 'Bay 2', 'bay_assigned' => 2,
        'lane_type' => 'Special Lane', 'sa_name' => 'Mark Bautista', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'WLK-2031', 'source' => 'Walk-in', 'plate' => 'ROD 1105', 'name' => 'Rodrigo Roxas',
        'contact' => '0929-555-6677', 'category' => 'PMS', 'vehicle' => 'Nissan Terra VL',
        'concern' => '50,000 KM Major PMS & Coolant Drain/Fill', 'date_received' => $today,
        'arrival' => '11:15', 'claim_stub' => "{$todayCompact}-017",
        'evaluation' => '50,000 KM Major PMS & Radiator Coolant Flush',
        'status' => 'Ready to Release', 'location' => 'None',
        'lane_type' => 'Priority Lane', 'sa_name' => 'Dayne Ramirez', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'WLK-2032', 'source' => 'Walk-in', 'plate' => 'BEA 6623', 'name' => 'Beatrice Mendoza',
        'contact' => '0930-666-7788', 'category' => 'GRS', 'vehicle' => 'Suzuki Jimny 1.5',
        'concern' => '4WD Transfer Case Fluid Change & Differential Check', 'date_received' => $today,
        'arrival' => '11:45', 'claim_stub' => "{$todayCompact}-018",
        'evaluation' => '4WD Transfer Case & Rear Differential Fluid Service',
        'status' => 'Monitoring', 'location' => 'Bay 3', 'bay_assigned' => 3,
        'lane_type' => 'Flexible Lane', 'sa_name' => 'Mark Bautista', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'WLK-2033', 'source' => 'Walk-in', 'plate' => 'JON 4912', 'name' => 'Jonathan Tan',
        'contact' => '0931-777-8899', 'category' => 'PMS', 'vehicle' => 'Hyundai Staria',
        'concern' => '15,000 KM PMS + Cabin Air Filter Replacement', 'date_received' => $today,
        'arrival' => '12:15', 'claim_stub' => "{$todayCompact}-019",
        'evaluation' => '15,000 KM Periodic Maintenance & AC Filter Replace',
        'status' => 'Waiting', 'location' => 'None',
        'lane_type' => 'Express Lane', 'sa_name' => 'Mark Bautista', 'branch' => 'Branch A'
    ],
    [
        'job_id' => 'WLK-2034', 'source' => 'Walk-in', 'plate' => 'CLA 2288', 'name' => 'Clarissa Villanueva',
        'contact' => '0932-888-9900', 'category' => 'GRS', 'vehicle' => 'Geely Coolray Sport',
        'concern' => 'Turbo boost check & throttle body cleaning', 'date_received' => $today,
        'arrival' => '12:45', 'claim_stub' => "{$todayCompact}-020",
        'evaluation' => 'Turbo Boost Sensor Diagnostics & Throttle Body Cleaning',
        'status' => 'Waiting', 'location' => 'None',
        'lane_type' => 'Special Lane', 'sa_name' => 'Dayne Ramirez', 'branch' => 'Branch A'
    ],

    // BRANCH B — TODAY (Active & Completed)
    [
        'job_id' => 'WLK-3001', 'source' => 'Walk-in', 'plate' => 'EAS 101', 'name' => 'Michael Chang',
        'contact' => '0919-888-9999', 'category' => 'GR', 'vehicle' => 'Mitsubishi Montero',
        'concern' => 'Transmission fluid leak check', 'date_received' => $today,
        'arrival' => '08:45', 'claim_stub' => "EAST-{$todayCompact}-001",
        'parts_available' => 'Yes', 'evaluation' => 'Replacing seal',
        'status' => 'Monitoring', 'location' => 'Bay 1', 'bay_assigned' => 1,
        'sa_name' => 'Alex Valenzuela', 'branch' => 'Branch B'
    ],
    [
        'job_id' => 'ONL-3002', 'source' => 'Online', 'plate' => 'EAS 202', 'name' => 'Sophia Loren',
        'contact' => '0920-555-7777', 'category' => 'Check-Up', 'vehicle' => 'Ford Ranger',
        'concern' => 'Aircon cleaning & freon recharge', 'date_received' => $today,
        'appt_date' => $today, 'appt_time' => '10:30', 'confirmed' => 1,
        'status' => 'Pending', 'parts_available' => 'Yes', 'branch' => 'Branch B'
    ],
    [
        'job_id' => 'WLK-3003', 'source' => 'Walk-in', 'plate' => 'EAS 303', 'name' => 'Robert De Niro',
        'contact' => '0921-444-3333', 'category' => 'PMS', 'vehicle' => 'Suzuki Swift',
        'concern' => '10k KM PMS Service', 'date_received' => $today,
        'arrival' => '09:15', 'departure' => '11:00',
        'claim_stub' => "EAST-{$todayCompact}-002",
        'status' => 'Completed', 'date_completed' => $today,
        'sa_name' => 'Alex Valenzuela', 'branch' => 'Branch B'
    ],

        // YESTERDAY
        [
            'job_id' => 'WLK-2006', 'source' => 'Walk-in', 'plate' => 'CCC 3333', 'name' => 'Francis Ge',
            'category' => 'PMS', 'vehicle' => 'Mitsubishi Mirage',
            'date_received' => $getRelativeDate(1), 'arrival' => '09:00', 'departure' => '10:30',
            'claim_stub' => 'YEST-001', 'status' => 'Completed', 'date_completed' => $getRelativeDate(1)
        ],
        [
            'job_id' => 'ONL-1007', 'source' => 'Online', 'plate' => 'DDD 4444', 'name' => 'Gail Garcia',
            'category' => 'Check-Up', 'vehicle' => 'Ford Ranger',
            'date_received' => $getRelativeDate(1), 'arrival' => '13:00', 'departure' => '13:45',
            'claim_stub' => 'YEST-002', 'status' => 'Completed', 'date_completed' => $getRelativeDate(1)
        ],

        // PAST WEEK
        [
            'job_id' => 'WLK-2008', 'source' => 'Walk-in', 'plate' => 'EEE 5555', 'name' => 'Harry Styles',
            'category' => 'PMS', 'vehicle' => 'Toyota Vios',
            'date_received' => $getRelativeDate(2), 'arrival' => '08:15', 'departure' => '09:45',
            'status' => 'Completed', 'date_completed' => $getRelativeDate(2)
        ],
        [
            'job_id' => 'ONL-1009', 'source' => 'Online', 'plate' => 'FFF 6666', 'name' => 'Ian Cruz',
            'category' => 'GR', 'vehicle' => 'Honda City',
            'date_received' => $getRelativeDate(2), 'arrival' => '11:00', 'departure' => '14:30',
            'status' => 'Completed', 'date_completed' => $getRelativeDate(2)
        ],
        [
            'job_id' => 'WLK-2010', 'source' => 'Walk-in', 'plate' => 'GGG 7777', 'name' => 'Julia Roberts',
            'category' => 'PMS', 'vehicle' => 'Subaru Forester',
            'date_received' => $getRelativeDate(3), 'arrival' => '10:00', 'departure' => '12:00',
            'status' => 'Completed', 'date_completed' => $getRelativeDate(3)
        ],
        [
            'job_id' => 'WLK-2011', 'source' => 'Walk-in', 'plate' => 'HHH 8888', 'name' => 'Kevin Bacon',
            'category' => 'Check-Up', 'vehicle' => 'Mazda 3',
            'date_received' => $getRelativeDate(4), 'arrival' => '14:00', 'departure' => '14:40',
            'status' => 'Completed', 'date_completed' => $getRelativeDate(4)
        ],
        [
            'job_id' => 'ONL-1012', 'source' => 'Online', 'plate' => 'III 9999', 'name' => 'Liam Neeson',
            'category' => 'GR', 'vehicle' => 'Toyota Hilux',
            'date_received' => $getRelativeDate(5), 'arrival' => '08:00', 'departure' => '11:30',
            'status' => 'Completed', 'date_completed' => $getRelativeDate(5)
        ],
        [
            'job_id' => 'WLK-2013', 'source' => 'Walk-in', 'plate' => 'JJJ 1212', 'name' => 'Manny Pacquiao',
            'category' => 'PMS', 'vehicle' => 'Toyota Alphard',
            'date_received' => $getRelativeDate(6), 'arrival' => '09:30', 'departure' => '11:15',
            'status' => 'Completed', 'date_completed' => $getRelativeDate(6)
        ],

        // PAST MONTH
        [
            'job_id' => 'WLK-2014', 'source' => 'Walk-in', 'plate' => 'KKK 2323', 'name' => 'Normani Kordei',
            'category' => 'PMS', 'vehicle' => 'Suzuki Swift',
            'date_received' => $getRelativeDate(12), 'arrival' => '10:00', 'departure' => '11:30',
            'status' => 'Completed', 'date_completed' => $getRelativeDate(12)
        ],
        [
            'job_id' => 'ONL-1015', 'source' => 'Online', 'plate' => 'LLL 3434', 'name' => 'Orlando Bloom',
            'category' => 'GR', 'vehicle' => 'Audi A4',
            'date_received' => $getRelativeDate(15), 'arrival' => '13:00', 'departure' => '16:00',
            'status' => 'Completed', 'date_completed' => $getRelativeDate(15)
        ],
        [
            'job_id' => 'WLK-2016', 'source' => 'Walk-in', 'plate' => 'MMM 4545', 'name' => 'Penelope Cruz',
            'category' => 'Check-Up', 'vehicle' => 'Kia Picanto',
            'date_received' => $getRelativeDate(20), 'arrival' => '09:00', 'departure' => '09:45',
            'status' => 'Completed', 'date_completed' => $getRelativeDate(20)
        ],
        [
            'job_id' => 'ONL-1017', 'source' => 'Online', 'plate' => 'NNN 5656', 'name' => 'Quentin Tarantino',
            'category' => 'PMS', 'vehicle' => 'Toyota Prius',
            'date_received' => $getRelativeDate(25), 'arrival' => '08:30', 'departure' => '10:00',
            'status' => 'Completed', 'date_completed' => $getRelativeDate(25)
        ],
    ];

    $insertStmt = $db->prepare(
        'INSERT INTO jobs (job_id, source, plate, name, contact, vehicle, category, concern, lane_type, date_received, arrival, departure, appt_date, appt_time, confirmed, claim_stub, parts_available, evaluation, status, location, branch, bay_assigned, promised_date, carry_over_status, remarks, sa_name, date_completed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    foreach ($defaultJobs as $i => $job) {
        $branch   = !empty($job['branch']) ? $job['branch'] : 'Marikina Branch';
        if ($branch === 'Branch A' || $branch === 'Branch B') $branch = 'Marikina Branch';
        $location = (!empty($job['location'])) ? $job['location'] : 'None';

        $insertStmt->execute([
            $job['job_id'],
            $job['source'],
            $job['plate'],
            $job['name'],
            $job['contact'] ?? null,
            $job['vehicle'],
            $job['category'],
            $job['concern'] ?? null,
            $job['lane_type'] ?? '',
            $job['date_received'],
            $job['arrival'] ?? '',
            $job['departure'] ?? '',
            $job['appt_date'] ?? null,
            $job['appt_time'] ?? '',
            $job['confirmed'] ?? 0,
            $job['claim_stub'] ?? '',
            $job['parts_available'] ?? 'Pending',
            $job['evaluation'] ?? '',
            $job['status'],
            $location,
            $branch,
            $job['bay_assigned'] ?? null,
            $job['promised_date'] ?? null,
            $job['carry_over_status'] ?? '',
            $job['remarks'] ?? '',
            $job['sa_name'] ?? '',
            $job['date_completed'] ?? null,
        ]);

        echo "[+] Seeded job: {$job['job_id']} — {$job['name']} ({$job['status']})\n";
    }

    echo "\nAll seed jobs inserted successfully!\n";

echo "\n=== Seeding Complete ===\n";
