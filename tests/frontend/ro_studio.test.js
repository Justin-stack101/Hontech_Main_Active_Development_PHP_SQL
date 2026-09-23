// tests/frontend/ro_studio.test.js
// REV-142: 1-click "Load to 2025 RO Studio" handover from the SA Booking Module
import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

const appJs = fs.readFileSync('frontend/js/app.js', 'utf8');

function extractFunction(name) {
    const start = appJs.indexOf(`function ${name}(`);
    assert.ok(start >= 0, `${name} must exist in app.js`);
    const end = appJs.indexOf(`window.${name} = ${name};`, start);
    assert.ok(end > start, `${name} must be exposed on window`);
    return appJs.slice(start, end);
}

describe('REV-142 Load to 2025 RO Studio handover', () => {
    it('AUT-FRONT-113: SA rows render the Load to RO Studio action', () => {
        assert.ok(appJs.includes(`onclick="loadOnlineBookingToForm13('\${job.id}')"`));
        assert.ok(appJs.includes('<i data-lucide="file-spreadsheet" class="w-3.5 h-3.5"></i> Load to RO Studio'));
    });

    it('AUT-FRONT-114: loadOnlineBookingToForm13 branch-guards, tags the session and prefills Form 1/3', () => {
        const fn = extractFunction('loadOnlineBookingToForm13');
        assert.ok(fn.includes("getBranchDisplayName(job.branch) !== getBranchDisplayName(currentUserBranch)"));
        assert.ok(fn.includes('activeOnlineBookingId = job.id;'));
        ['f13-input-name', 'f13-input-plate', 'f13-input-contact', 'f13-input-model',
         'f13-input-concern', 'f13-input-intake-date', 'f13-input-category', 'f13-input-job-no'].forEach(id => {
            assert.ok(fn.includes(`'${id}'`), `must prefill #${id}`);
        });
        assert.ok(fn.includes("showSection('form13')"), 'must switch to the 2025 RO Excel Studio');
        assert.ok(fn.indexOf('activeOnlineBookingId = job.id;') < fn.indexOf("showSection('form13')"),
            'the branch guard and session tag must run before the view switch');
    });

    it('AUT-FRONT-115: Register converts the loaded booking instead of duplicating it', () => {
        const fn = extractFunction('registerStudioROToSystem');
        assert.ok(fn.includes("j.source === 'Online' && j.status === 'Pending'"));
        assert.ok(fn.includes("String(loadedBooking.plate || '').toUpperCase().trim() === plate"),
            'handover must only apply while the plate still matches the loaded booking');
        assert.ok(fn.includes('payload.fromBookingId = loadedBooking.id;'));
        assert.ok(fn.includes('activeOnlineBookingId = null;'), 'handover tag must be cleared after registering');
    });
});
