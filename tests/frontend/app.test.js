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

    it('AUT-FRONT-108: SA navbar excludes separate Online Bookings button and consolidates into Daily Intakes', () => {
        const matches = appJs.match(/showSection\('online-bookings', this\)/g) || [];
        assert.strictEqual(matches.length, 0, 'SA navbar and sidebar must not have separate Online Bookings buttons');
        assert.ok(appJs.includes("showSection('queue', this)"));
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

    it('AUT-FRONT-112: cache buster bumped to v=2.98 or higher', () => {
        assert.ok(indexHtml.includes('src="js/app.js?v=3.00"') || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"'));
    });

    it('AUT-FRONT-113: SA navigation order strictly adheres to 5 core operational tools', () => {
        const saBlockMatch = appJs.match(/else if \(role === 'sa'\) \{([\s\S]*?)setupIntakeForm\('sa'\);/);
        assert.ok(saBlockMatch, 'SA role block must exist in buildNavbar');
        const saBlock = saBlockMatch[1];
        assert.strictEqual(saBlock.includes("showSection('online-bookings'"), false, 'SA block must not contain online-bookings nav button');
        assert.ok(saBlock.includes("showSection('form13'"), 'Must include 2025 RO Excel Studio');
        assert.ok(saBlock.includes("showSection('queue'"), 'Must include Daily Intakes');
        assert.ok(saBlock.includes("showSection('lookup'"), 'Must include Customer Lookup');
        assert.ok(saBlock.includes("showSection('bays'"), 'Must include Bay Status');
        assert.ok(saBlock.includes("openTVBroadcastHubModal()"), 'Must include TV Monitor');
    });

    it('AUT-FRONT-114: Login page and document title reflect the official capstone system title', () => {
        assert.ok(
            indexHtml.includes('<title>HonTech — Web-Based Operations and Real-Time Queue Management System</title>'),
            'Document title must match official system title'
        );
        assert.ok(
            indexHtml.includes('Web-Based <br>Operations and <br>Real-Time Queue <br><span class="text-red-500">Management System</span>'),
            'Login marketing hero must display official system title with styled accent'
        );
    });
});
