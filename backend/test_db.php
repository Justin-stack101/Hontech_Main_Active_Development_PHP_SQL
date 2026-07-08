<?php
require_once __DIR__ . '/vendor/autoload.php';
use App\Config\Env;
use App\Config\Database;

Env::load();

try {
    $db = Database::getConnection();
    echo "SUCCESS: Connected to database successfully!\n";
} catch (Exception $e) {
    echo "ERROR: Could not connect to database: " . $e->getMessage() . "\n";
}
