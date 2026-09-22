// tests/security/recovery_and_secrets.test.js
// Static regression checks for account-recovery hardening and secret hygiene (no server or database required).
import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(file, 'utf8');

function walk(dir, out = []) {
    const skip = new Set(['node_modules', 'vendor', '.git', 'archive', 'scratch']);
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (skip.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else if (/\.(md|php|js|html|json|sql|csv|txt)$/i.test(entry.name)) out.push(full);
    }
    return out;
}

describe('Account recovery hardening', () => {
    const controller = read('backend/controllers/PasswordResetController.php');

    it('never returns the reset code or token in an API response', () => {
        const responseArrays = controller.match(/ApiResponse::json\(\s*\[[^\]]*\]/g) || [];
        assert.ok(responseArrays.length > 0, 'expected ApiResponse::json calls');
        for (const call of responseArrays) {
            assert.doesNotMatch(call, /['"](token|otp|code)['"]\s*=>/i, `response leaks a reset secret: ${call}`);
        }
    });

    it('binds the reset lookup to the email and never looks users up by code alone', () => {
        const repo = read('backend/repositories/UserRepository.php');
        assert.doesNotMatch(repo, /WHERE\s+reset_otp\s*=/i);
        assert.doesNotMatch(repo, /WHERE\s+reset_token\s*=/i);
        assert.match(controller, /findByEmail/);
    });

    it('compares codes in constant time and limits guesses', () => {
        assert.match(controller, /hash_equals/);
        assert.match(controller, /MAX_ATTEMPTS/);
        assert.match(controller, /CODE_TTL_SECONDS\s*=\s*900/);
    });

    it('uses a CSPRNG for reset codes, not mt_rand/rand', () => {
        const utils = read('backend/utils/SecurityUtils.php');
        assert.match(utils, /random_int/);
        assert.doesNotMatch(controller, /\bmt_rand\(|\brand\(/);
    });

    it('keeps developer sandbox routes (emailed codes, reset tools) out of production', () => {
        const router = read('backend/index.php');
        assert.match(router, /str_starts_with\(\$route,\s*'\/auth\/developer\/'\)/);
        assert.match(router, /APP_ENV/);
    });
});

describe('Secret hygiene', () => {
    it('does not commit Gmail/SMTP app passwords or Google client secrets anywhere in the repo', () => {
        const patterns = [
            /SMTP_PASS\s*=\s*["']?[a-z]{16}["']?(\s|$)/i,
            /\$mail->Password\s*=\s*'[a-z]{16}'/i
        ];
        const offenders = [];
        for (const file of walk('.')) {
            const text = read(file);
            for (const pattern of patterns) {
                if (pattern.test(text)) offenders.push(`${file} matches ${pattern}`);
            }
            // Google client secrets; runs of x's are documentation placeholders, not secrets
            for (const [, tail] of text.matchAll(/GOCSPX-([A-Za-z0-9_-]{10,})/g)) {
                if (!/^[xX*_-]+$/.test(tail)) offenders.push(`${file} contains a Google client secret`);
            }
        }
        assert.deepStrictEqual(offenders, []);
    });
});
