// tests/frontend/app.test.js
// REV-142: SA Online Bookings navigation, branch-locked Booking Module and clean top-right badge
import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import vm from 'node:vm';

const appJs = fs.readFileSync('frontend/js/app.js', 'utf8');
const indexHtml = fs.readFileSync('frontend/index.html', 'utf8');

// Evaluate the real getBranchDisplayName implementation from app.js in isolation
function loadGetBranchDisplayName() {
    const match = appJs.match(/function getBranchDisplayName\(branch\) \{[\s\S]*?\n        \}/);
    assert.ok(match, 'getBranchDisplayName must be defined in app.js');
    const ctx = {};
    vm.runInNewContext(`${match[0]}; this.fn = getBranchDisplayName;`, ctx);
    return ctx.fn;
}

describe('REV-142 Online Booking Module (frontend)', () => {
    it('AUT-FRONT-107: getBranchDisplayName maps stored branch values to display names', () => {
        const fn = loadGetBranchDisplayName();
        assert.strictEqual(fn('Marikina Branch'), 'Marikina Branch');
        assert.strictEqual(fn('Branch A'), 'Marikina Branch');
        assert.strictEqual(fn(''), 'Marikina Branch');
        assert.strictEqual(fn('East Branch'), 'Regalado Branch');
        assert.strictEqual(fn('Branch B'), 'Regalado Branch');
        assert.strictEqual(fn('Regalado Branch'), 'Regalado Branch');
        assert.strictEqual(fn('all'), 'All Branches');
    });

    it('AUT-FRONT-108: SA navbar exposes Online Bookings in both header and sidebar', () => {
        const matches = appJs.match(/showSection\('online-bookings', this\)/g) || [];
        assert.strictEqual(matches.length, 2, 'SA must get Online Bookings in the header and sidebar nav');
        assert.ok(appJs.includes('<i data-lucide="calendar-clock" class="w-4 h-4"></i> Online Bookings'));
        assert.ok(appJs.includes("const isOnlineBookingsView = (id === 'online-bookings');"));
        assert.ok(indexHtml.includes('#section-queue.queue-focus-online > :not(#container-online-queue)'));
    });

    it('AUT-FRONT-109: SA Booking Module is hard-locked to the SA branch', () => {
        assert.ok(appJs.includes("const effectiveOnlineBranchFilter = isSA ? (currentUserBranch || 'Marikina Branch') : onlineBranchFilter;"));
        assert.ok(appJs.includes("filterGroup.classList.toggle('hidden', currentUserRole === 'sa');"));
    });

    it('AUT-FRONT-110: Branch column removed and clean static top-right badge present', () => {
        const tableStart = indexHtml.indexOf('<tbody id="table-pending-express"');
        const theadStart = indexHtml.lastIndexOf('<thead', tableStart);
        const thead = indexHtml.slice(theadStart, tableStart);
        assert.strictEqual(/>\s*Branch\s*<\/th>/.test(thead), false, 'Booking Module table must not have a Branch column');
        assert.strictEqual((thead.match(/<th /g) || []).length, 9);

        const badgeMatch = indexHtml.match(/<span id="online-queue-branch-badge"[^>]*>([^<]*)<\/span>/);
        assert.ok(badgeMatch, 'Top-right branch badge must exist');
        assert.strictEqual(/animate-|pulse|ping|blink/.test(badgeMatch[0]), false, 'Badge must not blink or pulse');
        assert.strictEqual(/\p{Extended_Pictographic}/u.test(badgeMatch[0]), false, 'Badge must contain no emoji');
        assert.ok(appJs.includes('branchBadge.innerText = `${getBranchDisplayName(badgeBranch)} · Online Queue`;'));

        const onlineCard = indexHtml.slice(indexHtml.indexOf('id="container-online-queue"'), tableStart);
        assert.strictEqual(onlineCard.includes('📍'), false, 'Booking Module header must be emoji-free');
    });

    it('AUT-FRONT-111: Assistant dispatch toast names the target branch Booking Module', () => {
        assert.ok(appJs.includes("registered to ${getBranchDisplayName(payload.branch)} Booking Module.`, 'success', 'Booking Dispatched'"));
        assert.ok(appJs.includes("onlineBranchFilter = payload.branch || 'all';"));
    });

    it('AUT-FRONT-112: cache buster bumped to v=2.96', () => {
        assert.ok(indexHtml.includes('src="js/app.js?v=2.96"'));
    });
});
