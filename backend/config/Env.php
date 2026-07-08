<?php
namespace App\Config;

/**
 * Environment Configuration Loader
 * 
 * Parses the project root .env file and loads variables into $_ENV.
 * Replaces the Node.js 'dotenv' package.
 */
class Env
{
    private static bool $loaded = false;

    /**
     * Load environment variables from .env file
     */
    public static function load(string $path = null): void
    {
        if (self::$loaded) return;

        $envPath = $path ?? dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . '.env';

        if (!file_exists($envPath)) {
            return;
        }

        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        foreach ($lines as $line) {
            // Skip comments
            $line = trim($line);
            if (empty($line) || str_starts_with($line, '#')) {
                continue;
            }

            // Parse KEY=VALUE
            $eqPos = strpos($line, '=');
            if ($eqPos === false) continue;

            $key   = trim(substr($line, 0, $eqPos));
            $value = trim(substr($line, $eqPos + 1));

            // Remove surrounding quotes if present
            if ((str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
                $value = substr($value, 1, -1);
            }

            $_ENV[$key] = $value;
            putenv("$key=$value");
        }

        self::$loaded = true;
    }

    /**
     * Get an environment variable value
     */
    public static function get(string $key, string $default = ''): string
    {
        return $_ENV[$key] ?? getenv($key) ?: $default;
    }
}
