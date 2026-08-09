<?php
namespace App\Controllers;

use App\Config\Database;
use App\Middleware\Auth;
use App\Repositories\UserRepository;
use App\Utils\ApiResponse;

/**
 * Staff Roster Management Controller
 * 
 * Handles staff creation, updates, role assignment, active status toggles, and deletion.
 */
class StaffController
{
    /**
     * GET /api/auth/staff
     */
    public static function getStaff(): void
    {
        try {
            $currentUser = Auth::getCurrentUser();
            if (!$currentUser || !in_array($currentUser['role'], ['owner', 'admin'])) {
                ApiResponse::forbidden('Access forbidden. Admin or Owner privileges required.');
                return;
            }

            $userRepo = new UserRepository();
            $staff = $userRepo->getAllActiveStaff();

            ApiResponse::json($staff);
        } catch (\Exception $e) {
            ApiResponse::serverError('Error fetching staff list.', $e->getMessage());
        }
    }

    /**
     * POST /api/auth/staff
     */
    public static function createStaff(): void
    {
        try {
            $currentUser = Auth::getCurrentUser();
            if (!$currentUser || !in_array($currentUser['role'], ['owner', 'admin'])) {
                ApiResponse::forbidden('Access forbidden. Admin or Owner privileges required.');
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $name   = trim($input['name'] ?? '');
            $email  = trim($input['email'] ?? '');
            $pass   = $input['password'] ?? '';
            $role   = $input['role'] ?? 'assistant';
            $branch = $input['branch'] ?? 'Branch A';

            if (empty($name) || empty($email) || empty($pass)) {
                ApiResponse::badRequest('Name, email, and password are required.');
                return;
            }

            if (!in_array($role, ['admin', 'sa', 'assistant', 'owner'])) {
                ApiResponse::badRequest('Invalid role specified.');
                return;
            }

            // Restrict owner assignment to existing owners only
            if ($role === 'owner' && $currentUser['role'] !== 'owner') {
                ApiResponse::forbidden('Access forbidden. Only an existing Owner can create another Owner account.');
                return;
            }

            $userRepo = new UserRepository();
            if ($userRepo->findByEmail($email)) {
                ApiResponse::badRequest('Email address is already in use.');
                return;
            }

            $user = $userRepo->createStaffUser($name, $email, $pass, $role, $branch);
            ApiResponse::json([
                'message' => 'Staff account created successfully.',
                'user'    => $user
            ], 201);
        } catch (\Exception $e) {
            ApiResponse::serverError('Error creating staff account.', $e->getMessage());
        }
    }

    /**
     * PUT /api/auth/staff/{id}
     */
    public static function updateStaff(int $id): void
    {
        try {
            $currentUser = Auth::getCurrentUser();
            if (!$currentUser || !in_array($currentUser['role'], ['owner', 'admin'])) {
                ApiResponse::forbidden('Access forbidden. Admin or Owner privileges required.');
                return;
            }

            $input  = json_decode(file_get_contents('php://input'), true) ?? [];
            $name   = trim($input['name'] ?? '');
            $email  = trim($input['email'] ?? '');
            $role   = $input['role'] ?? 'assistant';
            $branch = $input['branch'] ?? 'Branch A';

            if (empty($name) || empty($email)) {
                ApiResponse::badRequest('Name and email are required.');
                return;
            }

            $userRepo = new UserRepository();
            $targetUser = $userRepo->findById($id);
            if (!$targetUser) {
                ApiResponse::notFound('Staff account not found.');
                return;
            }

            if ($targetUser['role'] === 'owner' || ($role === 'owner' && $currentUser['role'] !== 'owner')) {
                if ($currentUser['role'] !== 'owner') {
                    ApiResponse::forbidden('Access forbidden. Owner role is protected and cannot be modified by Administrators.');
                    return;
                }
            }

            $existing = $userRepo->findByEmail($email);
            if ($existing && (int)$existing['id'] !== $id) {
                ApiResponse::badRequest('Email address is already in use by another user.');
                return;
            }

            $userRepo->updateStaffUser($id, $name, $email, $role, $branch);
            ApiResponse::json(['message' => 'Staff member details updated successfully.']);
        } catch (\Exception $e) {
            ApiResponse::serverError('Error updating staff member details.', $e->getMessage());
        }
    }

    /**
     * PATCH /api/auth/staff/{id}/toggle-active
     */
    public static function toggleStaffActive(int $id): void
    {
        try {
            $currentUser = Auth::getCurrentUser();
            if (!$currentUser || !in_array($currentUser['role'], ['owner', 'admin'])) {
                ApiResponse::forbidden('Access forbidden. Admin or Owner privileges required.');
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $isActive = (bool)($input['isActive'] ?? false);

            $userRepo = new UserRepository();
            $targetUser = $userRepo->findById($id);
            if (!$targetUser) {
                ApiResponse::notFound('Staff account not found.');
                return;
            }

            if ($targetUser['role'] === 'owner' && $currentUser['role'] !== 'owner') {
                ApiResponse::forbidden('Access forbidden. Only an Owner can toggle an Owner account status.');
                return;
            }

            $userRepo->toggleActiveStatus($id, $isActive);
            $statusStr = $isActive ? 'activated' : 'deactivated';
            ApiResponse::json(['message' => "Staff account has been {$statusStr}."]);
        } catch (\Exception $e) {
            ApiResponse::serverError('Error toggling staff account status.', $e->getMessage());
        }
    }

    /**
     * DELETE /api/auth/staff/{id}
     */
    public static function deleteStaff(int $id): void
    {
        try {
            $currentUser = Auth::getCurrentUser();
            if (!$currentUser || !in_array($currentUser['role'], ['owner', 'admin'])) {
                ApiResponse::forbidden('Access forbidden. Admin or Owner privileges required.');
                return;
            }

            $userRepo = new UserRepository();
            $targetUser = $userRepo->findById($id);
            if (!$targetUser) {
                ApiResponse::notFound('Staff account not found.');
                return;
            }

            if ($targetUser['role'] === 'owner') {
                ApiResponse::forbidden('Access forbidden. Owner accounts cannot be deleted.');
                return;
            }

            $userRepo->softDeleteUser($id);
            ApiResponse::json(['message' => 'Staff account deleted successfully.']);
        } catch (\Exception $e) {
            ApiResponse::serverError('Error deleting staff account.', $e->getMessage());
        }
    }
}
