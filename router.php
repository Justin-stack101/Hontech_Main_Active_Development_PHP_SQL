<?php
// router.php - Router for local development with PHP's built-in web server.
// Simulates the rewrite rules in .htaccess.

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// 1. Forward any /api/* requests to the PHP backend API router
if (str_contains($uri, '/api/')) {
    include __DIR__ . '/backend/index.php';
    exit;
}

// 2. Serve static assets directly from root or frontend folder
if ($uri !== '/') {
    $filePath = null;

    if (file_exists(__DIR__ . $uri) && !is_dir(__DIR__ . $uri)) {
        $filePath = __DIR__ . $uri;
    } elseif (file_exists(__DIR__ . '/frontend' . $uri) && !is_dir(__DIR__ . '/frontend' . $uri)) {
        $filePath = __DIR__ . '/frontend' . $uri;
    }

    if ($filePath) {
        $ext = pathinfo($filePath, PATHINFO_EXTENSION);
        $mimeTypes = [
            'css'   => 'text/css',
            'js'    => 'application/javascript',
            'png'   => 'image/png',
            'jpg'   => 'image/jpeg',
            'jpeg'  => 'image/jpeg',
            'svg'   => 'image/svg+xml',
            'woff'  => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf'   => 'font/ttf',
            'json'  => 'application/json'
        ];

        if (isset($mimeTypes[$ext])) {
            header('Content-Type: ' . $mimeTypes[$ext]);
        } else {
            header('Content-Type: ' . (mime_content_type($filePath) ?: 'application/octet-stream'));
        }

        readfile($filePath);
        exit;
    }
}

// 3. Fallback to serving the main SPA frontend
include __DIR__ . '/frontend/index.html';
exit;
