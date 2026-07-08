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
    ['name' => 'System Owner',           'role' => 'owner',     'email' => 'owner@hontech.com', 'password' => Env::get('OWNER_PASSWORD', 'owner123'), 'branch' => 'Branch A'],
    ['name' => 'System Admin',           'role' => 'admin',     'email' => 'admin@hontech.com', 'password' => Env::get('ADMIN_PASSWORD', 'admin123'), 'branch' => 'Branch A'],
    
    // Branch A (Branch 1) Test Users
    ['name' => 'Jessica (Front Desk A)', 'role' => 'assistant', 'email' => 'staff@hontech.com', 'password' => Env::get('STAFF_PASSWORD', 'staff123'), 'branch' => 'Branch A'],
    ['name' => 'Mark (Advisor A)',       'role' => 'sa',        'email' => 'sa@hontech.com',    'password' => Env::get('SA_PASSWORD', 'sa123'), 'branch' => 'Branch A'],
    
    // Branch B (Branch 2) Test Users
    ['name' => 'Jessica (Front Desk B)', 'role' => 'assistant', 'email' => 'staff.east@hontech.com', 'password' => Env::get('STAFF_PASSWORD', 'staff123'), 'branch' => 'Branch B'],
    ['name' => 'Dave (Advisor B)',       'role' => 'sa',        'email' => 'sa.east@hontech.com',    'password' => Env::get('SA_PASSWORD', 'sa123'), 'branch' => 'Branch B'],
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
        echo "[=] User already exists: {$u['email']}\n";
    }
}

// =============================================
// SEED JOBS
// =============================================
$stmt = $db->query('SELECT COUNT(*) as cnt FROM jobs');
$jobCount = (int)$stmt->fetch()['cnt'];

if ($jobCount <= 3) {
    echo "\nSeeding initial placeholder and historical jobs...\n";

    // Clear existing small seeds
    $db->exec('DELETE FROM jobs');

    $today = date('Y-m-d');

    $getRelativeDate = function(int $offsetDays): string {
        return date('Y-m-d', strtotime("-{$offsetDays} days"));
    };

    // Build date-relative claim stubs
    $todayCompact = substr(str_replace('-', '', $today), 4); // MMDDYY from YYYYMMDD

    $defaultJobs = [
        // TODAY (Active & Completed)
        [
            'job_id' => 'ONL-1001', 'source' => 'Online', 'plate' => 'XYZ 123', 'name' => 'Alice Smith',
            'contact' => '0912-345-6789', 'category' => 'PMS', 'vehicle' => 'Toyota Vios',
            'concern' => 'Change Oil and Filter', 'date_received' => $today,
            'appt_date' => $today, 'appt_time' => '08:00', 'confirmed' => 1,
            'status' => 'Pending', 'parts_available' => 'Yes'
        ],
        [
            'job_id' => 'WLK-2002', 'source' => 'Walk-in', 'plate' => 'ABC 987', 'name' => 'Bob Jones',
            'contact' => '0912-000-1111', 'category' => 'GR', 'vehicle' => 'Honda Civic',
            'concern' => 'Brakes squeaking, check pads', 'date_received' => $today,
            'arrival' => '09:00', 'claim_stub' => "{$todayCompact}060626-001",
            'parts_available' => 'Pending', 'evaluation' => 'Checking pads',
            'status' => 'In Progress', 'location' => 'Lift 1', 'bay_assigned' => 0,
            'sa_name' => 'Mark (Advisor)'
        ],
        [
            'job_id' => 'WLK-2003', 'source' => 'Walk-in', 'plate' => 'LMN 456', 'name' => 'Charlie Brown',
            'contact' => '0912-555-5555', 'category' => 'Check-Up', 'vehicle' => 'Nissan City',
            'concern' => 'Scratch on front bumper', 'date_received' => $today,
            'claim_stub' => "{$todayCompact}060626-002",
            'parts_available' => 'Pending', 'evaluation' => 'Awaiting Paint',
            'status' => 'Carry Over', 'promised_date' => $today,
            'remarks' => 'Paint curing delay', 'sa_name' => 'Mark (Advisor)'
        ],
        [
            'job_id' => 'WLK-2004', 'source' => 'Walk-in', 'plate' => 'AAA 1111', 'name' => 'Dave Smith',
            'category' => 'PMS', 'vehicle' => 'Toyota Fortuner',
            'concern' => '40k KM PMS checkup', 'date_received' => $today,
            'arrival' => '08:30', 'departure' => '10:30',
            'claim_stub' => "{$todayCompact}060626-003",
            'status' => 'Completed', 'date_completed' => $today,
            'sa_name' => 'Mark (Advisor)'
        ],
        [
            'job_id' => 'ONL-1005', 'source' => 'Online', 'plate' => 'BBB 2222', 'name' => 'Elena Rostova',
            'category' => 'GR', 'vehicle' => 'Hyundai Accent',
            'concern' => 'Alternator replacement', 'date_received' => $today,
            'arrival' => '10:00', 'departure' => '12:15',
            'claim_stub' => "{$todayCompact}060626-004",
            'status' => 'Completed', 'date_completed' => $today,
            'sa_name' => 'Mark (Advisor)'
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
        'INSERT INTO jobs (job_id, source, plate, name, contact, vehicle, category, concern, lane_type, date_received, arrival, departure, appt_date, appt_time, confirmed, claim_stub, parts_available, evaluation, status, location, branch, bay_assigned, promised_date, remarks, sa_name, date_completed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    foreach ($defaultJobs as $i => $job) {
        $branch   = ($i % 2 === 0) ? 'Branch A' : 'Branch B';
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
            $job['remarks'] ?? '',
            $job['sa_name'] ?? '',
            $job['date_completed'] ?? null,
        ]);

        echo "[+] Seeded job: {$job['job_id']} — {$job['name']} ({$job['status']})\n";
    }

    echo "\nAll seed jobs inserted successfully!\n";
} else {
    echo "\nJobs table already has {$jobCount} records — skipping job seeding.\n";
}

echo "\n=== Seeding Complete ===\n";
