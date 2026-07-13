<?php
// index.php in the project root.
// Bypasses Apache directory index settings and automatically redirects visitors to the frontend index.html.

header('Location: frontend/index.html');
exit;
