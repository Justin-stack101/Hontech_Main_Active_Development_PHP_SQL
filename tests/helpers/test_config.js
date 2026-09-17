// tests/helpers/test_config.js
// Shared configuration and helpers for HonTech test suites

export const TEST_CONFIG = {
    BASE_URL: process.env.HONTECH_URL || 'http://localhost:8000',
    ROLES: {
        OWNER: {
            email: 'owner@hontech.com',
            password: 'owner123',
            role: 'owner',
            canChangeBayCeiling: false,
            canViewAnalytics: true,
            canManageStaff: true
        },
        ADMIN: {
            email: 'admin@hontech.com',
            password: 'admin123',
            role: 'admin',
            canChangeBayCeiling: true,
            canViewAnalytics: true,
            canManageStaff: true
        },
        SA: {
            email: 'sa.marikina1@hontech.com',
            password: 'sa123',
            role: 'sa',
            canChangeBayCeiling: false,
            canViewAnalytics: false,
            canAssignBays: true
        },
        ASSISTANT: {
            email: 'assistant.marikina@hontech.com',
            password: 'assistant123',
            role: 'assistant',
            canChangeBayCeiling: false,
            canViewAnalytics: false,
            canAssignBays: false,
            canCreateOnlineBookings: true
        }
    }
};

/**
 * Robust fetch wrapper with timeout
 */
export async function apiRequest(path, options = {}) {
    const url = `${TEST_CONFIG.BASE_URL}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 3000);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });
        clearTimeout(timeoutId);
        let data = null;
        const text = await response.text();
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
        return { status: response.status, ok: response.ok, headers: response.headers, data };
    } catch (err) {
        clearTimeout(timeoutId);
        return { status: 0, ok: false, error: err.message, data: null };
    }
}
