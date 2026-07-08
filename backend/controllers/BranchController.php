<?php
namespace App\Controllers;

use App\Config\Database;
use App\Middleware\Auth;

class BranchController
{
    /**
     * GET /api/branches
     * Lists active branches
     */
    public static function getBranches(): void
    {
        try {
            $db = Database::getConnection();
            $stmt = $db->query('SELECT id, name, code, is_active FROM branches WHERE is_deleted = 0 AND is_active = 1 ORDER BY name ASC');
            $branches = $stmt->fetchAll();
            echo json_encode($branches);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error retrieving branches.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/branches/all
     * Lists all branches (including inactive/deleted) - Admin/Owner only
     */
    public static function getAllBranches(): void
    {
        try {
            $db = Database::getConnection();
            $stmt = $db->query('SELECT id, name, code, is_active, is_deleted FROM branches ORDER BY name ASC');
            $branches = $stmt->fetchAll();
            echo json_encode($branches);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error retrieving all branches.', 'error' => $e->getMessage()]);
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
            http_response_code(400);
            echo json_encode(['message' => 'Branch name and code are required.']);
            return;
        }

        try {
            $db = Database::getConnection();

            // Check if branch name or code already exists
            $stmt = $db->prepare('SELECT id, is_deleted FROM branches WHERE name = ? OR code = ?');
            $stmt->execute([$name, $code]);
            $existing = $stmt->fetch();

            if ($existing) {
                if ($existing['is_deleted']) {
                    // If it was soft-deleted, reactivate it instead of erroring
                    $stmt = $db->prepare('UPDATE branches SET name = ?, code = ?, is_active = 1, is_deleted = 0 WHERE id = ?');
                    $stmt->execute([$name, $code, $existing['id']]);
                    echo json_encode(['message' => 'Branch re-created/restored successfully.']);
                    return;
                } else {
                    http_response_code(400);
                    echo json_encode(['message' => 'A branch with this name or code already exists.']);
                    return;
                }
            }

            $stmt = $db->prepare('INSERT INTO branches (name, code, is_active, is_deleted) VALUES (?, ?, 1, 0)');
            $stmt->execute([$name, $code]);

            echo json_encode(['message' => 'Branch created successfully.']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error creating branch.', 'error' => $e->getMessage()]);
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
            $db = Database::getConnection();

            // Verify branch exists
            $stmt = $db->prepare('SELECT * FROM branches WHERE id = ?');
            $stmt->execute([$id]);
            $branch = $stmt->fetch();

            if (!$branch) {
                http_response_code(404);
                echo json_encode(['message' => 'Branch not found.']);
                return;
            }

            $fields = [];
            $params = [];

            if (!empty($name)) {
                $fields[] = 'name = ?';
                $params[] = $name;
            }
            if (!empty($code)) {
                $fields[] = 'code = ?';
                $params[] = $code;
            }
            if ($isActive !== null) {
                $fields[] = 'is_active = ?';
                $params[] = $isActive;
            }

            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(['message' => 'No fields to update.']);
                return;
            }

            $params[] = $id;
            $sql = 'UPDATE branches SET ' . implode(', ', $fields) . ' WHERE id = ?';
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            echo json_encode(['message' => 'Branch updated successfully.']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error updating branch.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * DELETE /api/branches/:id
     * Soft-deletes a branch
     */
    public static function deleteBranch(string $id): void
    {
        try {
            $db = Database::getConnection();

            // Verify branch exists
            $stmt = $db->prepare('SELECT * FROM branches WHERE id = ?');
            $stmt->execute([$id]);
            $branch = $stmt->fetch();

            if (!$branch) {
                http_response_code(404);
                echo json_encode(['message' => 'Branch not found.']);
                return;
            }

            // Check if there are active staff members in this branch
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM users WHERE branch = ? AND is_deleted = 0");
            $stmt->execute([$branch['name']]);
            $staffCount = $stmt->fetch()['count'];

            // Instead of blocking, we can soft delete it but we return a warning if there are staff members
            // As per user approved comments: "alert the admin first, but do not automatically deactivate staff"
            // The frontend will prompt/warn, and call the delete endpoint.
            
            $stmt = $db->prepare('UPDATE branches SET is_deleted = 1, is_active = 0 WHERE id = ?');
            $stmt->execute([$id]);

            echo json_encode([
                'message' => 'Branch soft-deleted successfully.',
                'staffCount' => $staffCount
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error deleting branch.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/branches/:id/restore
     * Restores a soft-deleted branch
     */
    public static function restoreBranch(string $id): void
    {
        try {
            $db = Database::getConnection();

            $stmt = $db->prepare('SELECT * FROM branches WHERE id = ?');
            $stmt->execute([$id]);
            $branch = $stmt->fetch();

            if (!$branch) {
                http_response_code(404);
                echo json_encode(['message' => 'Branch not found.']);
                return;
            }

            $stmt = $db->prepare('UPDATE branches SET is_deleted = 0, is_active = 1 WHERE id = ?');
            $stmt->execute([$id]);

            echo json_encode(['message' => 'Branch restored successfully.']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error restoring branch.', 'error' => $e->getMessage()]);
        }
    }
}
