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

}
