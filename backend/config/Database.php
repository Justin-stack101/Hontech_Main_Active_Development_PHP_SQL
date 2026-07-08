<?php
namespace App\Config;

use PDO;
use PDOException;

/**
 * Database Connection Manager
 * 
 * PDO-based MySQL connection singleton.
 * Replaces the Node.js Mongoose/MongoDB connection in config/db.js.
 */
class Database
{
    private static ?PDO $instance = null;

    /**
     * Get or create the singleton PDO connection
     */
    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            Env::load();

            $host = Env::get('DB_HOST', 'localhost');
            $name = Env::get('DB_NAME', 'hontech');
            $user = Env::get('DB_USER', 'root');
            $pass = Env::get('DB_PASS', '');
            $port = Env::get('DB_PORT', '3306');

            $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";

            try {
                self::$instance = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['message' => 'Database connection failed.', 'error' => $e->getMessage()]);
                exit;
            }
        }

        return self::$instance;
    }
}
