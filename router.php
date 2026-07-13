<?php
// router.php - Router for local development with PHP's built-in web server.
// Simulates the rewrite rules in .htaccess.

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// 1. Forward /api/* requests to the PHP backend API router
if (preg_match('#^/api/(.*)$#', $uri)) {
    // index.php expects $_SERVER['REQUEST_URI'] to contain /api/* or similar.
    // It normalizes by searching for /api/ in the path.
    include __DIR__ . '/backend/index.php';
    exit;
}

// 2. Serve existing files/directories directly (e.g. css, js, images)
if ($uri !== '/' && file_exists(__DIR__ . $uri)) {
    return false; // let the built-in server handle the static asset
}

// 3. Fallback to serving the main SPA frontend
include __DIR__ . '/frontend/index.html';
exit;


