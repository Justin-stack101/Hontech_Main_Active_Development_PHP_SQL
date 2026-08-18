<?php
require_once __DIR__ . '/../backend/vendor/autoload.php';
use App\Config\Env;
use App\Config\Database;

Env::load();
$db = Database::getConnection();

// Fix seed roles:
$db->exec("UPDATE users SET role = 'admin' WHERE email = 'admin@hontech.com'");
$db->exec("UPDATE users SET role = 'assistant' WHERE email = 'staff@hontech.com'");
$db->exec("UPDATE users SET role = 'sa' WHERE email = 'sa@hontech.com'");

$res = $db->query('SELECT id, name, email, role, branch, is_active FROM users')->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($res, JSON_PRETTY_PRINT);
