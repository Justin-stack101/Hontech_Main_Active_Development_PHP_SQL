<?php
/**
 * HonTech AutoCenter Operations System — PHP API Router
 * 
 * Single entry point for all /api/* requests.
 * Replaces Express routing from authRoutes.js and jobRoutes.js.
 * 
 * All routes are dispatched to controller methods based on HTTP method + URI path.
 */

// Composer autoloader (PSR-4)
require_once __DIR__ . '/vendor/autoload.php';

use App\Config\Env;
use App\Middleware\Auth;
use App\Controllers\AuthController;
use App\Controllers\JobController;
use App\Controllers\BranchController;
use App\Controllers\TrashController;

// Load environment
Env::load();

// Set JSON content type for all API responses
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Parse the request
$method    = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';

// Remove query string
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove the base path prefix (handles /i%20can%20fix%20her/backend/ or /i can fix her/backend/)
// Normalize URL-encoded spaces
$path = urldecode($path);

// Strip any leading path up to and including '/api/'
// This makes the router 100% robust against folder renaming
$route = $path;
if (preg_match('#/api/(.*)$#', $path, $matches)) {
    $route = '/' . $matches[1];
}

// Normalize: ensure leading slash, remove trailing slash
$route = '/' . ltrim($route, '/');
$route = rtrim($route, '/');
if ($route === '') $route = '/';

// =============================================
// ROUTE DISPATCH
// =============================================

// --- AUTH ROUTES ---

// Developer sandbox email routes (public)
if ($method === 'GET' && $route === '/auth/developer/emails') {
    AuthController::getSimulatedEmails();
    exit;
}
if ($method === 'DELETE' && $route === '/auth/developer/emails') {
    AuthController::clearSimulatedEmails();
    exit;
}
if ($method === 'PATCH' && preg_match('#^/auth/developer/emails/([^/]+)/read$#', $route, $m)) {
    AuthController::markEmailRead($m[1]);
    exit;
}

// Public auth routes
if ($method === 'POST' && $route === '/auth/login') {
    AuthController::login();
    exit;
}
if ($method === 'POST' && $route === '/auth/verify-mfa') {
    AuthController::verifyMfa();
    exit;
}
if ($method === 'POST' && $route === '/auth/logout') {
    AuthController::logout();
    exit;
}
if ($method === 'POST' && $route === '/auth/forgot-password') {
    AuthController::forgotPassword();
    exit;
}
if ($method === 'POST' && $route === '/auth/reset-password') {
    AuthController::resetPassword();
    exit;
}
if ($method === 'POST' && $route === '/auth/google/login') {
    AuthController::googleLogin();
    exit;
}

// Public job route (temp file download)
if ($method === 'GET' && preg_match('#^/jobs/export-download/([^/]+)$#', $route, $m)) {
    JobController::downloadTempFile($m[1]);
    exit;
}

// =============================================
// PROTECTED ROUTES (require authentication)
// =============================================

if (!Auth::authenticateUser()) {
    exit; // Response already sent by middleware
}

// --- Protected Auth Routes ---
if ($method === 'GET' && $route === '/auth/me') {
    AuthController::getMe();
    exit;
}
if ($method === 'POST' && $route === '/auth/ping') {
    AuthController::pingActiveSession();
    exit;
}
if ($method === 'PUT' && $route === '/auth/profile/password') {
    AuthController::updatePassword();
    exit;
}
if ($method === 'POST' && $route === '/auth/profile/email-change/request') {
    AuthController::requestEmailChange();
    exit;
}
if ($method === 'POST' && $route === '/auth/profile/email-change/verify') {
    AuthController::verifyEmailChange();
    exit;
}
if ($method === 'POST' && $route === '/auth/profile/backup-email/request') {
    AuthController::requestBackupEmail();
    exit;
}
if ($method === 'POST' && $route === '/auth/profile/backup-email/verify') {
    AuthController::verifyBackupEmail();
    exit;
}

// MFA routes
if ($method === 'POST' && $route === '/auth/mfa/setup') {
    AuthController::setupMfa();
    exit;
}
if ($method === 'POST' && $route === '/auth/mfa/enable') {
    AuthController::enableMfa();
    exit;
}
if ($method === 'POST' && $route === '/auth/mfa/disable') {
    AuthController::disableMfa();
    exit;
}

// Google SSO routes
if ($method === 'POST' && $route === '/auth/google/link') {
    AuthController::googleLink();
    exit;
}
if ($method === 'POST' && $route === '/auth/google/unlink') {
    AuthController::googleUnlink();
    exit;
}

// Staff management routes (Owner/Admin only)
if ($method === 'GET' && $route === '/auth/staff') {
    if (!Auth::requireRole(['owner', 'admin'])) exit;
    AuthController::getStaff();
    exit;
}
if ($method === 'POST' && $route === '/auth/staff') {
    if (!Auth::requireRole(['owner', 'admin'])) exit;
    AuthController::createStaff();
    exit;
}
if ($method === 'DELETE' && preg_match('#^/auth/staff/(\d+)$#', $route, $m)) {
    if (!Auth::requireRole(['owner', 'admin'])) exit;
    AuthController::deleteStaff($m[1]);
    exit;
}
if ($method === 'POST' && preg_match('#^/auth/staff/(\d+)/reset-password$#', $route, $m)) {
    if (!Auth::requireRole(['owner', 'admin'])) exit;
    AuthController::resetStaffPassword($m[1]);
    exit;
}
if ($method === 'PATCH' && preg_match('#^/auth/staff/(\d+)/toggle-active$#', $route, $m)) {
    if (!Auth::requireRole(['owner', 'admin'])) exit;
    AuthController::toggleStaffActiveStatus($m[1]);
    exit;
}
if ($method === 'PUT' && preg_match('#^/auth/staff/(\d+)/role$#', $route, $m)) {
    if (!Auth::requireRole(['owner', 'admin'])) exit;
    AuthController::updateStaffRole($m[1]);
    exit;
}
if ($method === 'PATCH' && preg_match('#^/auth/staff/(\d+)/branch$#', $route, $m)) {
    if (!Auth::requireRole(['owner', 'admin'])) exit;
    AuthController::updateStaffBranch($m[1]);
    exit;
}
if ($method === 'PUT' && preg_match('#^/auth/staff/(\d+)/edit$#', $route, $m)) {
    if (!Auth::requireRole(['owner', 'admin'])) exit;
    AuthController::editStaff($m[1]);
    exit;
}

// --- Protected Job Routes ---
if ($method === 'GET' && $route === '/jobs') {
    JobController::getJobs();
    exit;
}
if ($method === 'GET' && $route === '/jobs/analytics') {
    if (!Auth::requireRole(['owner', 'admin'])) exit;
    JobController::getAnalyticsData();
    exit;
}
if ($method === 'POST' && $route === '/jobs') {
    if (!Auth::requireRole(['assistant', 'sa'])) exit;
    JobController::createJob();
    exit;
}
if ($method === 'PATCH' && preg_match('#^/jobs/([^/]+)/field$#', $route, $m)) {
    JobController::updateJobField($m[1]);
    exit;
}
if ($method === 'PATCH' && preg_match('#^/jobs/([^/]+)/status$#', $route, $m)) {
    JobController::setJobStatus($m[1]);
    exit;
}
if ($method === 'DELETE' && preg_match('#^/jobs/([^/]+)$#', $route, $m)) {
    if (!Auth::requireRole(['assistant', 'owner', 'admin'])) exit;
    JobController::deleteJob($m[1]);
    exit;
}
if ($method === 'POST' && $route === '/jobs/export-temp') {
    JobController::uploadTempFile();
    exit;
}

// --- Protected Branch Routes ---
if ($method === 'GET' && $route === '/branches') {
    BranchController::getBranches();
    exit;
}
if ($method === 'GET' && $route === '/branches/all') {
    if (!Auth::requireRole(['owner', 'admin'])) exit;
    BranchController::getAllBranches();
    exit;
}
if ($method === 'POST' && $route === '/branches') {
    if (!Auth::requireRole(['owner', 'admin'])) exit;
    BranchController::createBranch();
    exit;
}
if ($method === 'PUT' && preg_match('#^/branches/(\d+)$#', $route, $m)) {
    if (!Auth::requireRole(['owner', 'admin'])) exit;
    BranchController::updateBranch($m[1]);
    exit;
}
if ($method === 'DELETE' && preg_match('#^/branches/(\d+)$#', $route, $m)) {
    if (!Auth::requireRole(['owner', 'admin'])) exit;
    BranchController::deleteBranch($m[1]);
    exit;
}
if ($method === 'POST' && preg_match('#^/branches/(\d+)/restore$#', $route, $m)) {
    if (!Auth::requireRole(['owner', 'admin'])) exit;
    BranchController::restoreBranch($m[1]);
    exit;
}

// --- Protected Trash Bin Routes ---
if ($method === 'GET' && $route === '/admin/trash') {
    if (!Auth::requireRole(['owner', 'admin'])) exit;
    TrashController::getTrash();
    exit;
}
if ($method === 'POST' && $route === '/admin/trash/restore') {
    if (!Auth::requireRole(['owner', 'admin'])) exit;
    TrashController::restoreItem();
    exit;
}
if ($method === 'DELETE' && $route === '/admin/trash/purge') {
    if (!Auth::requireRole(['owner', 'admin'])) exit;
    TrashController::purgeItem();
    exit;
}

// =============================================
// 404 — Route not found
// =============================================
http_response_code(404);
echo json_encode(['message' => 'API endpoint not found.', 'route' => $route, 'method' => $method]);
