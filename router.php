<?php
// router.php - Router for local development with PHP's built-in web server.
// Simulates rewrite rules in .htaccess and ensures correct MIME types and asset resolution.

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// 1. Forward any /api/* requests to the PHP backend API router
if (str_contains($uri, '/api/')) {
    include __DIR__ . '/backend/index.php';
    exit;
}

// 2. Serve static assets
if ($uri !== '/' && $uri !== '/index.html' && $uri !== '/index.php') {
    $filePath = null;

    // Check direct path
    if (file_exists(__DIR__ . $uri) && !is_dir(__DIR__ . $uri)) {
        $filePath = __DIR__ . $uri;
    }
    // Check inside frontend directory
    elseif (file_exists(__DIR__ . '/frontend' . $uri) && !is_dir(__DIR__ . '/frontend' . $uri)) {
        $filePath = __DIR__ . '/frontend' . $uri;
    }
    // Check if asset exists anywhere inside frontend/js, frontend/css, etc. if nested route was requested
    elseif (preg_match('#/(js|css|screenshots|scss)/(.+)$#', $uri, $m)) {
        $candidate = __DIR__ . '/frontend/' . $m[1] . '/' . $m[2];
        if (file_exists($candidate) && !is_dir($candidate)) {
            $filePath = $candidate;
        }
    }
    // Check images in frontend root
    elseif (in_array(strtolower(pathinfo($uri, PATHINFO_EXTENSION)), ['png', 'jpg', 'jpeg', 'ico', 'svg', 'gif', 'webp'])) {
        $candidate = __DIR__ . '/frontend/' . basename($uri);
        if (file_exists($candidate) && !is_dir($candidate)) {
            $filePath = $candidate;
        }
    }

    if ($filePath) {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimeTypes = [
            'css'   => 'text/css; charset=utf-8',
            'js'    => 'application/javascript; charset=utf-8',
            'png'   => 'image/png',
            'jpg'   => 'image/jpeg',
            'jpeg'  => 'image/jpeg',
            'svg'   => 'image/svg+xml',
            'ico'   => 'image/x-icon',
            'woff'  => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf'   => 'font/ttf',
            'json'  => 'application/json',
            'map'   => 'application/json'
        ];

        if (isset($mimeTypes[$ext])) {
            header('Content-Type: ' . $mimeTypes[$ext]);
        } else {
            header('Content-Type: ' . (mime_content_type($filePath) ?: 'application/octet-stream'));
        }

        readfile($filePath);
        exit;
    }

    // If a static asset (js, css, map, json, image) was requested but not found, return 404 text instead of index.html!
    $ext = strtolower(pathinfo($uri, PATHINFO_EXTENSION));
    if (in_array($ext, ['js', 'css', 'map', 'json', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf'])) {
        http_response_code(404);
        header('Content-Type: text/plain');
        echo "404 Not Found: Asset $uri could not be located.";
        exit;
    }
}

// 3. Fallback to serving the main SPA frontend
include __DIR__ . '/frontend/index.html';
exit;
