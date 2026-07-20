<?php
namespace App\Utils;

/**
 * Standardized HTTP API Response Helper
 */
class ApiResponse
{
    /**
     * Send a JSON response with specified HTTP status code
     */
    public static function json(mixed $data, int $statusCode = 200): void
    {
        if (!headers_sent()) {
            http_response_code($statusCode);
            header('Content-Type: application/json; charset=utf-8');
            header('Access-Control-Allow-Origin: *');
        }
        echo json_encode($data);
        exit;
    }

    /**
     * Send a successful JSON response
     */
    public static function success(mixed $data = null, string $message = '', int $statusCode = 200): void
    {
        if (is_string($data) && empty($message)) {
            self::json(['message' => $data], $statusCode);
        }

        if (is_array($data) || is_object($data)) {
            self::json($data, $statusCode);
        }

        $response = ['message' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }

        self::json($response, $statusCode);
    }

    /**
     * Send an error response
     */
    public static function error(string $message, int $statusCode = 400, mixed $errorDetails = null): void
    {
        $response = ['message' => $message];
        if ($errorDetails !== null) {
            $response['error'] = is_string($errorDetails) ? $errorDetails : $errorDetails;
        }

        self::json($response, $statusCode);
    }

    /**
     * 401 Unauthorized Response
     */
    public static function unauthorized(string $message = 'Authentication required. Access denied.'): void
    {
        self::error($message, 401);
    }

    /**
     * 403 Forbidden Response
     */
    public static function forbidden(string $message = 'Access forbidden. Insufficient permissions.'): void
    {
        self::error($message, 403);
    }

    /**
     * 404 Not Found Response
     */
    public static function notFound(string $message = 'Resource not found.'): void
    {
        self::error($message, 404);
    }

    /**
     * 500 Server Error Response
     */
    public static function serverError(string $message = 'Internal server error.', mixed $details = null): void
    {
        self::error($message, 500, $details);
    }
}
