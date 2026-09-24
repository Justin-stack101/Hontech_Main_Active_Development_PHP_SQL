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
        assert.ok(indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"') || indexHtml.includes('src="js/app.js?v=3.01"') || indexHtml.includes('src="js/app.js?v=3.00"') || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"'));
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

    it('AUT-FRONT-115: REV-148 Unlocked Editable Top Meta Bars (Job Order No, Quotation No, Billing No)', () => {
        assert.ok(
            indexHtml.includes('id="f13-input-job-no" placeholder="e.g. HT-JO-0001" class="w-full bg-white'),
            'f13-input-job-no must be editable with bg-white styling and without readonly'
        );
        assert.ok(
            indexHtml.includes('id="f23-input-quote-no" placeholder="e.g. QT-2026-0001" class="w-full bg-white'),
            'f23-input-quote-no must be editable with bg-white styling and without readonly'
        );
        assert.ok(
            indexHtml.includes('id="bill-input-billing-no" placeholder="e.g. BL-2026-0001" class="w-full bg-white'),
            'bill-input-billing-no must be editable with bg-white styling and without readonly'
        );
        assert.ok(
            appJs.includes("if (id === 'f23-input-quote-no') delete el.dataset.autoDerived;"),
            'Quotation number listener must clear autoDerived on manual typing'
        );
        assert.ok(
            appJs.includes("if (id === 'bill-input-billing-no') delete el.dataset.autoDerived;"),
            'Billing number listener must clear autoDerived on manual typing'
        );
        assert.ok(
            appJs.includes("if (quoteEl && (!quoteEl.value || quoteEl.dataset.autoDerived === 'true'))"),
            'syncJobOrderFieldsToQuote must not overwrite customized quote numbers'
        );
        assert.ok(
            appJs.includes("if (billEl && (!billEl.value || billEl.dataset.autoDerived === 'true'))"),
            'syncJobOrderFieldsToBilling must not overwrite customized billing numbers'
        );
        assert.ok(
            appJs.includes("const quoteNo = getVal('f23-input-quote-no') ||"),
            'exportOfficialXLSX must extract custom quoteNo from input'
        );
        assert.ok(
            appJs.includes("const billingNo = getVal('bill-input-billing-no') ||"),
            'exportOfficialXLSX must extract custom billingNo from input'
        );
    });

    it('AUT-FRONT-116: REV-149 Form 1/3 PDF Formatting, Exact Coordinates, Center Alignment & Ghost Elimination', () => {
        // 1. Verify customer details use uniform unbolded typography
        assert.ok(
            appJs.includes("drawTextFit(plate, 464, 715.8, 44, 6.2, false, darkInk, 5.0);"),
            'Customer details must have plate rendered in regular font without bolding'
        );

        // 2. Verify concern box is horizontally centered at 307.5 and centered vertically at 635.0
        assert.ok(
            appJs.includes("drawTextCenter(lineStr, 307.5, startY - (idx * lineH), 6.5, false, darkInk);"),
            'Customer concern lines must be centered horizontally at 307.5'
        );

        // 3. Verify Interviewed by proper baseline and Authorization customer name
        assert.ok(
            appJs.includes("drawTextCenter(sa, 196.5, 583.5, 6.5, false);"),
            'Interviewed by SA must sit on Y=583.5 baseline with 6.5pt font'
        );
        assert.ok(
            appJs.includes("whiteOut(285, 542.6, 35, 10.0);") &&
            appJs.includes("drawTextCenter(name, 302.5, 545.5, 6.5, false);"),
            'Authorization signature must mask template 0 ghost and center customer name at X=302.5'
        );

        // 4. Verify Diagnostic box starts cleanly below the header bar
        assert.ok(
            appJs.includes("x: 86, y: 492, size: 6.2, font: fontNorm, maxWidth: 95"),
            'Diagnostic text must start at Y=492 below header bar'
        );

        // 5. Verify Parts & Materials true 7.78pt row step and amount ghost whiteout
        assert.ok(
            appJs.includes("Array.from({ length: 23 }, (_, i) => +(497.75 - i * 7.78).toFixed(2))"),
            'ROW_Y must follow 7.78pt step starting at 497.75'
        );
        assert.ok(
            appJs.includes("whiteOut(326, ry - 0.5, 22, 5.8);") &&
            appJs.includes("whiteOut(488, ry - 0.5, 22, 5.8);"),
            'Amount columns must mask pre-printed 0.00 ghosts cleanly without erasing grid lines'
        );

        // 6. Verify 1-click fast preset chips in index.html
        assert.ok(
            indexHtml.includes("onclick=\"addForm13PartRow('Engine Oil Filter', 1, 450)\""),
            'index.html must provide 1-click preset for Engine Oil Filter'
        );
        assert.ok(
            indexHtml.includes("onclick=\"addForm13MaterialRow('Fully Synthetic 5W-40 (4L)', 1, 1850)\""),
            'index.html must provide 1-click preset for Synthetic Oil'
        );

        // 7. Verify signatures alignments
        assert.ok(
            appJs.includes("drawTextCenter(mechanic, 200.0, 290.0, 6.5, false);") &&
            appJs.includes("drawTextCenter(assessor, 435.0, 290.0, 6.5, false);") &&
            appJs.includes("drawTextCenter(sa, 200.0, 220.5, 6.5, false);") &&
            appJs.includes("drawTextCenter(mechanic, 435.0, 220.5, 6.5, false);") &&
            appJs.includes("drawTextCenter(name, 200.0, 186.5, 6.5, false);") &&
            appJs.includes("drawTextCenter(manager, 435.0, 186.5, 6.5, false);"),
            'All signature names must be centered above their respective underlines'
        );

        // 8. Verify Filipino Claim stub ghost masking and exact coordinate placement
        assert.ok(
            appJs.includes("whiteOut(148, 98.5, 138, 7.5);") &&
            appJs.includes("whiteOut(368, 98.5, 155, 7.5);") &&
            appJs.includes("drawTextFit(name, 152, 99.5, 132, 6.2, false);") &&
            appJs.includes("drawTextCenter(plate, 396.5, 99.5, 6.2, false);") &&
            appJs.includes("drawTextCenter(model, 482.5, 99.5, 6.2, false);") &&
            appJs.includes("drawTextFit(sa, 152, 89.5, 132, 6.2, false);") &&
            appJs.includes("drawTextCenter(intakeDate, 215.5, 80.5, 6.2, false);") &&
            appJs.includes("drawTextCenter(stubId, 446.5, 80.5, 7.0, true);"),
            'Filipino claim stub must mask all 5 ghost placeholders and place data on true lines'
        );
    });
});
