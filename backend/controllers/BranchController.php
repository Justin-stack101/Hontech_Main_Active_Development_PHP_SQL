<?php
namespace App\Controllers;

use App\Repositories\BranchRepository;
use App\Utils\ApiResponse;

class BranchController
{
    private static function getRepository(): BranchRepository
    {
        return new BranchRepository();
    }

    /**
     * GET /api/branches
     * Lists active branches
     */
    public static function getBranches(): void
    {
        try {
            $branches = self::getRepository()->getActiveBranches();
            ApiResponse::json($branches);
        } catch (\Exception $e) {
            ApiResponse::serverError('Error retrieving branches.', $e->getMessage());
        }
    }

    /**
     * GET /api/branches/all
     * Lists all branches (including inactive/deleted) - Admin/Owner only
     */
    public static function getAllBranches(): void
    {
        try {
            $branches = self::getRepository()->getAllBranches();
            ApiResponse::json($branches);
        } catch (\Exception $e) {
            ApiResponse::serverError('Error retrieving all branches.', $e->getMessage());
        }
    }

    /**
     * POST /api/branches
     * Creates a new branch
     */
    public static function createBranch(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $name = trim($input['name'] ?? '');
        $code = trim($input['code'] ?? '');

        if (empty($name) || empty($code)) {
            ApiResponse::error('Branch name and code are required.', 400);
            return;
        }

        try {
            $repo = self::getRepository();
            $existing = $repo->findByNameOrCode($name, $code);

            if ($existing) {
                if ($existing['is_deleted']) {
                    $repo->restoreAndReactivate($existing['id'], $name, $code);
                    ApiResponse::success(null, 'Branch re-created/restored successfully.');
                    return;
                } else {
                    ApiResponse::error('A branch with this name or code already exists.', 400);
                    return;
                }
            }

            $repo->create($name, $code);
            ApiResponse::success(null, 'Branch created successfully.');
        } catch (\Exception $e) {
            ApiResponse::serverError('Error creating branch.', $e->getMessage());
        }
    }

    /**
     * PUT /api/branches/:id
     * Updates an existing branch
     */
    public static function updateBranch(string $id): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $name = trim($input['name'] ?? '');
        $code = trim($input['code'] ?? '');
        $isActive = isset($input['isActive']) ? (int)$input['isActive'] : null;

        try {
            $repo = self::getRepository();
            $branch = $repo->findById($id);

            if (!$branch) {
                ApiResponse::notFound('Branch not found.');
                return;
            }

            $updateData = [];
            if (!empty($name)) $updateData['name'] = $name;
            if (!empty($code)) $updateData['code'] = $code;
            if ($isActive !== null) $updateData['isActive'] = $isActive;

            if (empty($updateData)) {
                ApiResponse::error('No fields to update.', 400);
                return;
            }

            $repo->update($id, $updateData);
            ApiResponse::success(null, 'Branch updated successfully.');
        } catch (\Exception $e) {
            ApiResponse::serverError('Error updating branch.', $e->getMessage());
        }
    }

    /**
     * DELETE /api/branches/:id
     * Soft-deletes a branch
     */
    public static function deleteBranch(string $id): void
    {
        try {
            $repo = self::getRepository();
            $branch = $repo->findById($id);

            if (!$branch) {
                ApiResponse::notFound('Branch not found.');
                return;
            }

            $staffCount = $repo->getActiveStaffCountByBranch($branch['name']);
            $repo->softDelete($id);

            ApiResponse::json([
                'message' => 'Branch soft-deleted successfully.',
                'staffCount' => $staffCount
            ]);
        } catch (\Exception $e) {
            ApiResponse::serverError('Error deleting branch.', $e->getMessage());
        }
    }

    /**
     * POST /api/branches/:id/restore
     * Restores a soft-deleted branch
     */
    public static function restoreBranch(string $id): void
    {
        try {
            $repo = self::getRepository();
            $branch = $repo->findById($id);

            if (!$branch) {
                ApiResponse::notFound('Branch not found.');
                return;
            }

            $repo->restore($id);
            ApiResponse::success(null, 'Branch restored successfully.');
        } catch (\Exception $e) {
            ApiResponse::serverError('Error restoring branch.', $e->getMessage());
        }
    }
}
