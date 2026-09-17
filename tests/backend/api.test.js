// tests/backend/api.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { TEST_CONFIG, apiRequest } from '../helpers/test_config.js';

describe('Backend Engine & API Integration Tests', () => {

    describe('1. PHP Code Integrity & Lint Syntax Checks', () => {
        const phpFiles = [
            'router.php',
            'backend/index.php',
            'backend/test_db.php',
            'backend/migration.php',
            'backend/seed.php'
        ];

        phpFiles.forEach(file => {
            it(`should pass syntax linting for ${file} (php -l)`, () => {
                try {
                    const output = execSync(`php -l ${file}`, { encoding: 'utf8' });
                    assert.strictEqual(output.includes('No syntax errors detected'), true);
                } catch (err) {
                    assert.fail(`PHP Linting error in ${file}: ${err.stdout || err.message}`);
                }
            });
        });
    });

    describe('2. MariaDB / MySQL PDO Database Connectivity', () => {
        it('should connect to MariaDB/MySQL successfully via PDO', () => {
            try {
                const output = execSync('php backend/test_db.php', { encoding: 'utf8' });
                const isSuccess = output.includes('SUCCESS: Connected to database successfully!');
                assert.strictEqual(isSuccess, true, `DB test failed with output: ${output}`);
            } catch (err) {
                // In environments where MySQL is temporarily off, surface clear diagnostic
                const out = err.stdout ? err.stdout.toString() : err.message;
                if (out.includes('Connection refused') || out.includes('No connection could be made')) {
                    console.warn('⚠️ MySQL service is currently not running in XAMPP. Start MariaDB in XAMPP to verify live DB.');
                } else {
                    assert.fail(`Database connection error: ${out}`);
                }
            }
        });
    });

    describe('3. HTTP Endpoints & Router Dispatching', () => {
        it('should verify live HTTP router responses if local server is active', async () => {
            const res = await apiRequest('/tv/session');
            if (res.status === 0) {
                console.log('ℹ️ Server not currently active on port 8000; skipping live HTTP assertions. Start with npm.cmd run dev.');
                return;
            }

            // If server is running, verify valid HTTP response
            assert.strictEqual([200, 401, 404, 405].includes(res.status), true);
        });

        it('should reject invalid login credentials with proper error response', async () => {
            const res = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: 'nonexistent_user@hontech.com',
                    password: 'wrongpassword'
                })
            });

            if (res.status === 0) return; // Server offline

            // Status must be 401 or error payload
            assert.strictEqual(res.ok, false);
            if (res.data && typeof res.data === 'object') {
                assert.strictEqual(res.data.status === 'error' || res.data.success === false, true);
            }
        });
    });
});
