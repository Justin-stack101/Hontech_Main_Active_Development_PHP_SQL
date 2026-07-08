<?php
namespace App\Controllers;

use App\Config\Database;
use App\Middleware\Auth;

class TrashController
{
    /**
     * GET /api/admin/trash
     * Lists all soft-deleted staff and jobs
     */
    public static function getTrash(): void
    {
        try {
            $db = Database::getConnection();

            // Fetch soft-deleted staff
            $stmt = $db->query('SELECT id, name, email, role, branch, updated_at as deleted_at FROM users WHERE is_deleted = 1 ORDER BY updated_at DESC');
            $staff = $stmt->fetchAll();
            // Map keys to match frontend expectation
            $staffResult = array_map(function($u) {
                return [
                    '_id' => $u['id'],
                    'name' => $u['name'],
                    'email' => $u['email'],
                    'role' => $u['role'],
                    'branch' => $u['branch'],
                    'deletedAt' => $u['deleted_at']
                ];
            }, $staff);

            // Fetch soft-deleted jobs
            $stmt = $db->query('SELECT id, job_id, plate, name, vehicle, category, branch, updated_at as deleted_at FROM jobs WHERE is_deleted = 1 ORDER BY updated_at DESC');
            $jobs = $stmt->fetchAll();
            $jobsResult = array_map(function($j) {
                return [
                    '_id' => $j['id'],
                    'jobId' => $j['job_id'],
                    'plate' => $j['plate'],
                    'name' => $j['name'],
                    'vehicle' => $j['vehicle'],
                    'category' => $j['category'],
                    'branch' => $j['branch'],
                    'deletedAt' => $j['deleted_at']
                ];
            }, $jobs);

            echo json_encode([
                'staff' => $staffResult,
                'jobs' => $jobsResult
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error retrieving trash bin.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * POST /api/admin/trash/restore
     * Restores a soft-deleted staff or job
     */
    public static function restoreItem(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $type = $input['type'] ?? '';
        $id = $input['id'] ?? '';

        if (empty($type) || empty($id)) {
            http_response_code(400);
            echo json_encode(['message' => 'Type and ID are required.']);
            return;
        }

        try {
            $db = Database::getConnection();

            if ($type === 'staff') {
                $stmt = $db->prepare('UPDATE users SET is_deleted = 0, is_active = 1 WHERE id = ?');
                $stmt->execute([$id]);
                echo json_encode(['message' => 'Staff account successfully restored.']);
            } elseif ($type === 'job') {
                // If it's a job, id can be the primary auto-increment id or the job_id string. 
                // Let's check which it is and run update accordingly.
                if (is_numeric($id)) {
                    $stmt = $db->prepare('UPDATE jobs SET is_deleted = 0 WHERE id = ?');
                } else {
                    $stmt = $db->prepare('UPDATE jobs SET is_deleted = 0 WHERE job_id = ?');
                }
                $stmt->execute([$id]);
                echo json_encode(['message' => 'Job record successfully restored.']);
            } else {
                http_response_code(400);
                echo json_encode(['message' => 'Invalid item type.']);
            }
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error restoring item.', 'error' => $e->getMessage()]);
        }
    }

    /**
     * DELETE /api/admin/trash/purge
     * Permanently deletes a soft-deleted staff or job
     */
    public static function purgeItem(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $type = $input['type'] ?? '';
        $id = $input['id'] ?? '';

        if (empty($type) || empty($id)) {
            http_response_code(400);
            echo json_encode(['message' => 'Type and ID are required.']);
            return;
        }

        try {
            $db = Database::getConnection();

            if ($type === 'staff') {
                $stmt = $db->prepare('DELETE FROM users WHERE id = ? AND is_deleted = 1');
                $stmt->execute([$id]);
                echo json_encode(['message' => 'Staff account permanently purged.']);
            } elseif ($type === 'job') {
                if (is_numeric($id)) {
                    $stmt = $db->prepare('DELETE FROM jobs WHERE id = ? AND is_deleted = 1');
                } else {
                    $stmt = $db->prepare('DELETE FROM jobs WHERE job_id = ? AND is_deleted = 1');
                }
                $stmt->execute([$id]);
                echo json_encode(['message' => 'Job record permanently purged.']);
            } else {
                http_response_code(400);
                echo json_encode(['message' => 'Invalid item type.']);
            }
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error purging item.', 'error' => $e->getMessage()]);
        }
    }
}
