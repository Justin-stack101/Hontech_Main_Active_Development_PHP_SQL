<?php
require_once __DIR__ . '/../backend/config/Env.php';
require_once __DIR__ . '/../backend/config/Database.php';

use App\Config\Database;

$db = Database::getConnection();

$stmt = $db->query("SELECT id, name, email, role, branch FROM users");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT) . "\n";
