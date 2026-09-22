<?php
namespace App\Controllers;

use App\Middleware\Auth;
use App\Repositories\BayRepository;
use App\Utils\ApiResponse;

/**
 * Bay Controller
 *
 * Workshop Bay ceiling/active-count settings, scoped per branch.
 * Owner has no functionality against this module by design — both endpoints below reject
 * the 'owner' role explicitly, even though route-level guards already restrict who can call them.
 */
class BayController
{
    private static function getRepository(): BayRepository
    {
        return new BayRepository();
    }

    /**
     * GET /api/bays/settings
     * Returns the current bay ceiling/active count for the caller's own branch (any authenticated
     * role except Owner may read this — SAs need it to know how many bays they can select).
     */
    public static function getSettings(): void
    {
        $user = Auth::getCurrentUser();
        if (!$user) {
            ApiResponse::unauthorized();
            return;
        }
        if ($user['role'] === 'owner') {
            ApiResponse::forbidden('Owners do not have access to the Workshop Bay module.');
            return;
        }

        try {
            $settings = self::getRepository()->getSettings($user['branch'] ?? 'Marikina Branch');
            ApiResponse::json($settings);
        } catch (\Exception $e) {
            ApiResponse::serverError('Error retrieving bay settings.', $e->getMessage());
        }
    }

    /**
     * POST /api/bays/settings/limit
     * Admin sets the branch-wide bay ceiling (e.g. "6 bays"). Always scoped to the admin's own
     * branch — the request body cannot target another branch.
     */
    public static function setMaxBayLimit(): void
    {
        $user = Auth::getCurrentUser();
        if (!$user) {
            ApiResponse::unauthorized();
            return;
        }
        if ($user['role'] === 'owner') {
            ApiResponse::forbidden('Owners do not have access to the Workshop Bay module.');
            return;
        }
        if ($user['role'] !== 'admin') {
            ApiResponse::forbidden('Only Admins can set the branch bay ceiling.');
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $maxBayLimit = (int)($input['maxBayLimit'] ?? 0);

        if ($maxBayLimit < 1 || $maxBayLimit > 50) {
            ApiResponse::badRequest('maxBayLimit must be between 1 and 50.');
            return;
        }

        try {
            $settings = self::getRepository()->setMaxBayLimit($user['branch'] ?? 'Marikina Branch', $maxBayLimit, (int)$user['id']);
            ApiResponse::success($settings, 'Bay ceiling updated successfully.');
        } catch (\Exception $e) {
            ApiResponse::serverError('Error updating bay ceiling.', $e->getMessage());
        }
    }

    /**
     * POST /api/bays/settings/active
     * SA sets how many of the Admin-configured bays are actively in operation today, within
     * their own branch. Always clamped server-side to the branch's max_bay_limit.
     */
    public static function setActiveBayCount(): void
    {
        $user = Auth::getCurrentUser();
        if (!$user) {
            ApiResponse::unauthorized();
            return;
        }
        if ($user['role'] === 'owner') {
            ApiResponse::forbidden('Owners do not have access to the Workshop Bay module.');
            return;
        }
        if ($user['role'] !== 'sa') {
            ApiResponse::forbidden('Only Service Advisors can set the active bay count.');
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $activeBayCount = (int)($input['activeBayCount'] ?? 0);

        if ($activeBayCount < 1) {
            ApiResponse::badRequest('activeBayCount must be at least 1.');
            return;
        }

        try {
            $settings = self::getRepository()->setActiveBayCount($user['branch'] ?? 'Marikina Branch', $activeBayCount, (int)$user['id']);
            ApiResponse::success($settings, 'Active bay count updated successfully.');
        } catch (\Exception $e) {
            ApiResponse::serverError('Error updating active bay count.', $e->getMessage());
        }
    }
}
