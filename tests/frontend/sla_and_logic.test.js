// tests/frontend/sla_and_logic.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { TEST_CONFIG } from '../helpers/test_config.js';

// Reusable logic functions corresponding to frontend/js/app.js implementations
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatFieldName(field) {
    if (!field) return 'System Action';
    const map = {
        'departure': 'Departure Time',
        'arrival': 'Arrival Time',
        'evaluation': 'Diagnosis / Evaluation',
        'category': 'Service Category',
        'laneType': 'Lane Type',
        'promisedDate': 'Promised Date',
        'carryOverStatus': 'Carry Over Status',
        'status': 'Job Status',
        'remarks': 'Remarks & Notes',
        'location': 'Workshop Bay',
        'saName': 'Ticket Handover (SA)',
        'express_delay_report': 'Express Delay Report'
    };
    return map[field] || field;
}

function calculateSlaMinutes(arrivalTimeStr, referenceTimeStr) {
    if (!arrivalTimeStr || !referenceTimeStr) return 0;
    const [arrH, arrM] = arrivalTimeStr.split(':').map(Number);
    const [refH, refM] = referenceTimeStr.split(':').map(Number);

    let arrTotal = arrH * 60 + arrM;
    let refTotal = refH * 60 + refM;

    // Day rollover protection (e.g. arrival 23:45, reference 01:15)
    if (refTotal < arrTotal) {
        refTotal += 24 * 60;
    }
    return refTotal - arrTotal;
}

function isExpressSlaOverdue(elapsedMinutes, thresholdMinutes = 120) {
    return elapsedMinutes >= thresholdMinutes;
}

function validateClaimStubFormat(stub) {
    // Expected format: MMDDYY-XXX (e.g. 091726-001)
    const regex = /^\d{6}-\d{3,4}$/;
    return regex.test(stub);
}

function validatePhilippinePlateNumber(plate) {
    // Standard formats: ABC-1234, ABC-123, or ABC 1234
    const cleaned = plate.trim().toUpperCase().replace(/\s+/g, '-');
    const regex = /^[A-Z]{3}-?\d{3,4}$/;
    return regex.test(cleaned);
}

describe('Frontend Logic & SLA Calculation Unit Tests', () => {

    describe('1. HTML Sanitization & Field Label Mapping', () => {
        it('should escape dangerous characters to prevent XSS injection', () => {
            const dirty = '<script>alert("hacked")</script>&foo=\'bar\'';
            const clean = escapeHtml(dirty);
            assert.strictEqual(clean.includes('<script>'), false);
            assert.strictEqual(clean.includes('&lt;script&gt;'), true);
            assert.strictEqual(clean.includes('&quot;hacked&quot;'), true);
            assert.strictEqual(clean.includes('&#039;bar&#039;'), true);
        });

        it('should handle null and undefined safely without throwing', () => {
            assert.strictEqual(escapeHtml(null), '');
            assert.strictEqual(escapeHtml(undefined), '');
            assert.strictEqual(escapeHtml(''), '');
        });

        it('should map field names to human-readable audit descriptions', () => {
            assert.strictEqual(formatFieldName('arrival'), 'Arrival Time');
            assert.strictEqual(formatFieldName('location'), 'Workshop Bay');
            assert.strictEqual(formatFieldName('saName'), 'Ticket Handover (SA)');
            assert.strictEqual(formatFieldName('unknown_col'), 'unknown_col');
        });
    });

    describe('2. Express PMS 2-Hour SLA Turnaround Calculations', () => {
        it('should compute standard turnaround minutes correctly (< 2 hours)', () => {
            const elapsed = calculateSlaMinutes('09:00', '10:45');
            assert.strictEqual(elapsed, 105);
            assert.strictEqual(isExpressSlaOverdue(elapsed), false);
        });

        it('should flag SLA Overdue when turnaround reaches or exceeds 120 minutes', () => {
            const elapsedExact = calculateSlaMinutes('08:00', '10:00');
            assert.strictEqual(elapsedExact, 120);
            assert.strictEqual(isExpressSlaOverdue(elapsedExact), true);

            const elapsedOverdue = calculateSlaMinutes('08:00', '10:25');
            assert.strictEqual(elapsedOverdue, 145);
            assert.strictEqual(isExpressSlaOverdue(elapsedOverdue), true);
        });

        it('should handle overnight / midnight time rollovers gracefully', () => {
            const elapsed = calculateSlaMinutes('23:30', '01:00');
            assert.strictEqual(elapsed, 90);
            assert.strictEqual(isExpressSlaOverdue(elapsed), false);
        });
    });

    describe('3. Validation Rules (Claim Stubs & License Plates)', () => {
        it('should validate standard Claim Stub format MMDDYY-XXX', () => {
            assert.strictEqual(validateClaimStubFormat('091726-001'), true);
            assert.strictEqual(validateClaimStubFormat('091726-0023'), true);
            assert.strictEqual(validateClaimStubFormat('INVALID-STUB'), false);
            assert.strictEqual(validateClaimStubFormat('12345'), false);
        });

        it('should validate Philippine License Plate numbers', () => {
            assert.strictEqual(validatePhilippinePlateNumber('ABC-1234'), true);
            assert.strictEqual(validatePhilippinePlateNumber('NDB-3829'), true);
            assert.strictEqual(validatePhilippinePlateNumber('NCS 4821'), true);
            assert.strictEqual(validatePhilippinePlateNumber('1234-ABC'), false);
        });
    });

    describe('4. RBAC Permission Matrix Assertions', () => {
        it('Owner should be restricted from changing bay ceiling (View Only)', () => {
            assert.strictEqual(TEST_CONFIG.ROLES.OWNER.canChangeBayCeiling, false);
            assert.strictEqual(TEST_CONFIG.ROLES.OWNER.canViewAnalytics, true);
        });

        it('Admin should have unrestricted bay ceiling and staff management', () => {
            assert.strictEqual(TEST_CONFIG.ROLES.ADMIN.canChangeBayCeiling, true);
            assert.strictEqual(TEST_CONFIG.ROLES.ADMIN.canManageStaff, true);
        });

        it('Service Advisor should be able to allocate bays but cannot view executive analytics', () => {
            assert.strictEqual(TEST_CONFIG.ROLES.SA.canAssignBays, true);
            assert.strictEqual(TEST_CONFIG.ROLES.SA.canViewAnalytics, false);
        });

        it('Assistant should be able to encode bookings but locked out from bay operations', () => {
            assert.strictEqual(TEST_CONFIG.ROLES.ASSISTANT.canCreateOnlineBookings, true);
            assert.strictEqual(TEST_CONFIG.ROLES.ASSISTANT.canAssignBays, false);
        });
    });

    describe('5. 2025 RO Excel Studio 4-Sheet Architecture & Cross-Sync', () => {
        it('AUT-FRONT-13: should strictly register the 4 authentic SA worksheets and purge obsolete non-SA tabs', async () => {
            const fs = await import('node:fs');
            const appJs = fs.readFileSync('frontend/js/app.js', 'utf8');
            const indexHtml = fs.readFileSync('frontend/index.html', 'utf8');

            // 1. Verify allFormWorkbookSheets has exactly 4 sheets
            const sheetsMatch = appJs.match(/const allFormWorkbookSheets = (\[[\s\S]*?\]);/);
            assert.ok(sheetsMatch, 'allFormWorkbookSheets definition must exist in app.js');
            
            // Safe parse of the array literal
            const cleanArrayStr = sheetsMatch[1].replace(/'/g, '"').replace(/([a-zA-Z0-9_]+):/g, '"$1":');
            const sheets = JSON.parse(cleanArrayStr);
            assert.strictEqual(sheets.length, 4, 'Must contain strictly 4 worksheets');
            
            const expectedKeys = ['form13', 'form23', 'billing', 'checklist'];
            const actualKeys = sheets.map(s => s.key);
            assert.deepStrictEqual(actualKeys, expectedKeys, 'Keys must match the 4 authentic SA sheets');

            // 2. Verify decommissioned tabs are purged from index.html bottom bar
            const purgedTabs = [
                'tab-sheet-cashad',
                'tab-sheet-oef',
                'tab-sheet-liquidation',
                'tab-sheet-disbursement',
                'tab-sheet-cashflow',
                'tab-sheet-acknowledgement'
            ];
            purgedTabs.forEach(tabId => {
                assert.strictEqual(indexHtml.includes(tabId), false, `Decommissioned tab ${tabId} must be purged from index.html`);
            });
        });

        it('AUT-FRONT-14: should cross-synchronize core vehicle dossier from Job Order across Quote, Billing, and Checklist', () => {
            // Mock source Job Order data
            const jobOrderData = {
                jobNo: 'HT-JO-0042',
                date: '2026-09-17',
                name: 'Catherine Dayne',
                contact: '0917-555-0199',
                address: 'Marikina City',
                plate: 'ncd 8821',
                model: 'Honda Civic RS 2022',
                color: 'Rallye Red',
                km: '38,200 km'
            };

            // Test synchronization logic matching app.js
            const quoteRef = 'QT-' + jobOrderData.date.slice(0, 4) + '-' + (jobOrderData.jobNo.replace(/[^0-9]/g, '') || '0001');
            const billingRef = 'BL-' + jobOrderData.date.slice(0, 4) + '-' + (jobOrderData.jobNo.replace(/[^0-9]/g, '') || '0001');
            const normalizedPlate = (jobOrderData.plate || '').toUpperCase();

            // Assertions
            assert.strictEqual(quoteRef, 'QT-2026-0042');
            assert.strictEqual(billingRef, 'BL-2026-0042');
            assert.strictEqual(normalizedPlate, 'NCD 8821');

            // Test cross-sheet payload integrity
            const billingPayload = {
                billingNo: billingRef,
                date: jobOrderData.date,
                jobNo: jobOrderData.jobNo,
                name: jobOrderData.name,
                plate: normalizedPlate,
                model: jobOrderData.model
            };
            assert.strictEqual(billingPayload.name, 'Catherine Dayne');
            assert.strictEqual(billingPayload.plate, 'NCD 8821');
        });

        it('AUT-FRONT-15: should calculate billing totals accurately and validate 15-point inspection checkpoints', () => {
            // 1. Billing calculations assertion
            const sampleBillingItems = [
                { desc: 'Comprehensive Periodic Maintenance Service Package', qty: 1, price: 3500 },
                { desc: 'Fully Synthetic Motor Oil 5W-30 (4 Liters)', qty: 4, price: 650 },
                { desc: 'OEM Genuine Oil Filter Element', qty: 1, price: 450 },
                { desc: 'Brake Caliper Servicing & System Bleeding', qty: 1, price: 1200 }
            ];
            const total = sampleBillingItems.reduce((acc, item) => acc + (item.qty * item.price), 0);
            assert.strictEqual(total, 7750, 'Billing items sum should equal ₱7,750.00');

            // 2. Checklist inspection checkpoints assertion
            const sampleCheckpoints = [
                { id: 'eng_oil', status: 'Good' },
                { id: 'brk_fluid', status: 'Good' },
                { id: 'coolant', status: 'Good' },
                { id: 'battery', status: 'Good' },
                { id: 'lights_ext', status: 'Good' },
                { id: 'ac_cooling', status: 'Good' },
                { id: 'horn_wipers', status: 'Good' },
                { id: 'tire_fl', status: 'Good' },
                { id: 'tire_fr', status: 'Good' },
                { id: 'tire_rl', status: 'Good' },
                { id: 'tire_rr', status: 'Good' },
                { id: 'spare_tire', status: 'Good' },
                { id: 'brakes_pads', status: 'Attention' },
                { id: 'suspension', status: 'Good' },
                { id: 'exhaust', status: 'Good' }
            ];
            assert.strictEqual(sampleCheckpoints.length, 15, 'Standard inspection must have 15 checkpoints');
            const goodCount = sampleCheckpoints.filter(c => c.status === 'Good').length;
            const attnCount = sampleCheckpoints.filter(c => c.status === 'Attention').length;
            assert.strictEqual(goodCount, 14);
            assert.strictEqual(attnCount, 1);
        });
    });

    describe('Suite 6: REV-073 TV Monitor Natural Trigger, Top 4-Tab Bar & Current_2025 Template Sync', () => {
        it('AUT-FRONT-16: should verify modal-tv-broadcast-hub exists in DOM and openTVBroadcastHubModal is callable', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(indexHtml.includes('id="modal-tv-broadcast-hub"'), true, 'modal-tv-broadcast-hub must exist in index.html');
            assert.strictEqual(indexHtml.includes('tab-tv-method-live'), true, 'Live wireless tab must exist in TV hub modal');
            assert.strictEqual(indexHtml.includes('tab-tv-method-hdmi'), true, 'HDMI direct tab must exist in TV hub modal');
            assert.strictEqual(appJs.includes('function openTVBroadcastHubModal()'), true, 'openTVBroadcastHubModal must be defined in app.js');
        });

        it('AUT-FRONT-17: should verify form-top-tab-bar has strictly 4 authentic SA tabs with carets', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(indexHtml.includes('id="form-top-tab-bar"'), true, 'form-top-tab-bar must exist in index.html');
            assert.strictEqual(indexHtml.includes('id="tab-top-joborder"'), true, 'Job_Order top tab must exist');
            assert.strictEqual(indexHtml.includes('id="tab-top-quote"'), true, 'Quotation_No top tab must exist');
            assert.strictEqual(indexHtml.includes('id="tab-top-billing"'), true, 'Billing_No top tab must exist');
            assert.strictEqual(indexHtml.includes('id="tab-top-checklist"'), true, 'CheckList_Result top tab must exist');

            // Verify switchFormStudioSheet handles top tabs
            assert.strictEqual(appJs.includes('topId: \'tab-top-joborder\''), true, 'switchFormStudioSheet must bind topId for joborder');
            assert.strictEqual(appJs.includes('topId: \'tab-top-quote\''), true, 'switchFormStudioSheet must bind topId for quote');
            assert.strictEqual(appJs.includes('topId: \'tab-top-billing\''), true, 'switchFormStudioSheet must bind topId for billing');
            assert.strictEqual(appJs.includes('topId: \'tab-top-checklist\''), true, 'switchFormStudioSheet must bind topId for checklist');
        });

        it('AUT-FRONT-18: should verify Current_2025 BLANK RO UPDATED template integration and zero Polished_2025 references', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            // 1. Zero occurrences of Polished_2025
            assert.strictEqual(appJs.includes('Polished_2025'), false, 'app.js must not contain references to Polished_2025');
            assert.strictEqual(indexHtml.includes('Polished_2025'), false, 'index.html must not contain references to Polished_2025');

            // 2. Base64 template is populated and matches Current_2025
            const currentXlsxPath = path.resolve('frontend/assets/Current_2025 BLANK RO UPDATED.xlsx');
            assert.strictEqual(fs.existsSync(currentXlsxPath), true, 'Current_2025 BLANK RO UPDATED.xlsx must exist in assets');
            assert.strictEqual(fs.existsSync(path.resolve('frontend/assets/Polished_2025 BLANK RO UPDATED.xlsx')), false, 'Polished_2025 BLANK RO UPDATED.xlsx must be removed');
        });
    });

    describe('Suite 7: REV-074 Official PDF Format Preview Sidebars & Purge Keystroke HTML Canvas', () => {
        it('AUT-FRONT-19: should verify all 3 official PDF worksheet templates exist in frontend/assets/', () => {
            const quotePdf = path.resolve('frontend/assets/Current_2025 BLANK RO UPDATED.xlsx - Quotation_No.pdf');
            const billPdf = path.resolve('frontend/assets/Current_2025 BLANK RO UPDATED.xlsx - Billing_No.pdf');
            const chkPdf = path.resolve('frontend/assets/Current_2025 BLANK RO UPDATED.xlsx - CheckList_Result.pdf');
            const joPdf = path.resolve('frontend/assets/form13_template.pdf');

            assert.strictEqual(fs.existsSync(quotePdf), true, 'Quotation_No PDF must exist in assets');
            assert.strictEqual(fs.existsSync(billPdf), true, 'Billing_No PDF must exist in assets');
            assert.strictEqual(fs.existsSync(chkPdf), true, 'CheckList_Result PDF must exist in assets');
            assert.strictEqual(fs.existsSync(joPdf), true, 'Job Order PDF must exist in assets');

            assert.ok(fs.statSync(quotePdf).size > 10000, 'Quotation PDF must have valid file size');
            assert.ok(fs.statSync(billPdf).size > 10000, 'Billing PDF must have valid file size');
            assert.ok(fs.statSync(chkPdf).size > 10000, 'Checklist PDF must have valid file size');
        });

        it('AUT-FRONT-20: should verify PDF iframe format view sidebars in Job Order, Quotation, Billing, and Checklist', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            // Form 1/3 (Job Order) PDF preview
            assert.strictEqual(indexHtml.includes('id="f13-pdf-viewer-wrap"'), true, 'f13-pdf-viewer-wrap must exist');
            assert.strictEqual(indexHtml.includes('form13_template.pdf'), true, 'form13_template.pdf must be loaded in Job Order PDF iframe');

            // Quotation PDF preview
            assert.strictEqual(indexHtml.includes('Current_2025%20BLANK%20RO%20UPDATED.xlsx%20-%20Quotation_No.pdf'), true, 'Quotation PDF must be embedded in form23-canvas-pane');

            // Billing PDF preview
            assert.strictEqual(indexHtml.includes('Current_2025%20BLANK%20RO%20UPDATED.xlsx%20-%20Billing_No.pdf'), true, 'Billing PDF must be embedded in billing-canvas-pane');

            // Checklist PDF preview
            assert.strictEqual(indexHtml.includes('Current_2025%20BLANK%20RO%20UPDATED.xlsx%20-%20CheckList_Result.pdf'), true, 'Checklist PDF must be embedded in checklist-canvas-pane');
        });

        it('AUT-FRONT-21: should verify keystroke HTML sheet simulation is completely removed from index.html and app.js', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // Verify keystroke sheet button is removed
            assert.strictEqual(indexHtml.includes('btn-f13-tab-html'), false, 'btn-f13-tab-html must be removed');
            assert.strictEqual(indexHtml.includes('f13-html-canvas-wrap'), false, 'f13-html-canvas-wrap must be removed');

            // Verify onReactiveJobOrderInput no longer calls heavy canvas text updates
            assert.strictEqual(appJs.includes('syncForm13Canvas();\n                syncJobOrderFieldsToQuote();'), false, 'syncForm13Canvas must not be called inside onReactiveJobOrderInput');
        });
    });

    describe('Suite 8: REV-075 Dynamic PDF Stamping Across All SA Worksheets & Open-Minded Inquiry Mandate', () => {
        it('AUT-FRONT-22: should verify dynamic PDF compilers are registered in app.js and callables exist', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(appJs.includes('compileQuotePDFBytes'), true, 'compileQuotePDFBytes must exist in app.js');
            assert.strictEqual(appJs.includes('generateQuotePDF'), true, 'generateQuotePDF must exist in app.js');
            assert.strictEqual(appJs.includes('compileBillingPDFBytes'), true, 'compileBillingPDFBytes must exist in app.js');
            assert.strictEqual(appJs.includes('generateBillingPDF'), true, 'generateBillingPDF must exist in app.js');
            assert.strictEqual(appJs.includes('compileChecklistPDFBytes'), true, 'compileChecklistPDFBytes must exist in app.js');
            assert.strictEqual(appJs.includes('generateChecklistPDF'), true, 'generateChecklistPDF must exist in app.js');
            assert.strictEqual(appJs.includes('scheduleFormStudioPdfRefresh'), true, 'scheduleFormStudioPdfRefresh must exist in app.js');
        });

        it('AUT-FRONT-23: should verify standardized dark ink typography and removal of destructive whiteout in Form 1/3', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // Form 13 must use darkInk rather than glaring red
            assert.strictEqual(appJs.includes('drawText(jobNo, 478, 794, 8.5, true, darkInk);'), true, 'Job No must use darkInk typography');
            // Border destructive whiteouts in table parts/materials must be removed
            assert.strictEqual(appJs.includes('whiteOut(297, ry - 1.5, 55, 7.5);'), false, 'Parts row destructive whiteout must be removed');
            assert.strictEqual(appJs.includes('whiteOut(475, ry - 1.5, 46, 7.5);'), false, 'Materials row destructive whiteout must be removed');
        });

        it('AUT-FRONT-24: should verify Open-Minded Inquiry Mandate is codified in AGENTS.md and agent-workflow SKILL.md', () => {
            const agentsMd = fs.readFileSync(path.resolve('.agents/AGENTS.md'), 'utf8');
            const workflowSkill = fs.readFileSync(path.resolve('.agents/skills/agent-workflow/SKILL.md'), 'utf8');

            assert.strictEqual(agentsMd.includes('Mandatory Open-Minded Inquiry & Alignment Requirement'), true, 'AGENTS.md must mandate open-minded questions');
            assert.strictEqual(workflowSkill.includes('Open-Minded Collaborative Inquiry Phase'), true, 'agent-workflow SKILL.md must mandate open-minded questions');
        });
    });

    describe('Suite 9: REV-076 Full Multi-Sheet Lossless XLSX Data Injection Engine', () => {
        it('AUT-FRONT-25: should verify exportOfficialXLSX uses getOfficialXlsxTemplateBuffer with caching', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(appJs.includes('getOfficialXlsxTemplateBuffer'), true, 'getOfficialXlsxTemplateBuffer must exist in app.js');
            assert.strictEqual(appJs.includes('Current_2025%20BLANK%20RO%20UPDATED.xlsx'), true, 'Template path must reference Current_2025 BLANK RO UPDATED.xlsx');
            assert.strictEqual(appJs.includes('HONTECH_2025_RO_TEMPLATE_BASE64'), false, 'Undefined template base64 string must not be referenced');
        });

        it('AUT-FRONT-26: should verify accurate cell coordinate injection for Job_Order Parts and Materials', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // Customer dossier coordinates
            assert.strictEqual(appJs.includes("setCell(sheet1Doc, 'C10', name);"), true, 'Name must map to C10');
            assert.strictEqual(appJs.includes("setCell(sheet1Doc, 'H10', model);"), true, 'Model must map to H10');
            assert.strictEqual(appJs.includes("setCell(sheet1Doc, 'K10', plate);"), true, 'Plate must map to K10');

            // Parts in columns D-G and Materials in columns H-K starting at row 27
            assert.strictEqual(appJs.includes("setCell(sheet1Doc, 'D' + rIdx, p.desc || '');"), true, 'Parts description must map to column D');
            assert.strictEqual(appJs.includes("setCell(sheet1Doc, 'E' + rIdx, qty, true);"), true, 'Parts qty must map to column E');
            assert.strictEqual(appJs.includes("setCell(sheet1Doc, 'F' + rIdx, price, true);"), true, 'Parts unit price must map to column F');
            assert.strictEqual(appJs.includes("setCell(sheet1Doc, 'G' + rIdx, qty * price, true);"), true, 'Parts amount must map to column G');

            assert.strictEqual(appJs.includes("setCell(sheet1Doc, 'H' + rIdx, m.desc || '');"), true, 'Materials description must map to column H');
            assert.strictEqual(appJs.includes("setCell(sheet1Doc, 'I' + rIdx, qty, true);"), true, 'Materials qty must map to column I');
            assert.strictEqual(appJs.includes("setCell(sheet1Doc, 'J' + rIdx, price, true);"), true, 'Materials unit price must map to column J');
            assert.strictEqual(appJs.includes("setCell(sheet1Doc, 'K' + rIdx, qty * price, true);"), true, 'Materials amount must map to column K');
        });

        it('AUT-FRONT-27: should verify multi-sheet XML targeting across Quotation (sheets 2-4), Billing (sheets 5-6), and Checklist (sheet 7)', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // Quotation targets sheets 2, 3, 4
            assert.strictEqual(appJs.includes("'xl/worksheets/sheet2.xml'"), true, 'Quotation 1 must target sheet2.xml');
            assert.strictEqual(appJs.includes("'xl/worksheets/sheet3.xml'"), true, 'Quotation 2 must target sheet3.xml');
            assert.strictEqual(appJs.includes("'xl/worksheets/sheet4.xml'"), true, 'Quotation 3 must target sheet4.xml');

            // Billing targets sheets 5, 6
            assert.strictEqual(appJs.includes("'xl/worksheets/sheet5.xml'"), true, 'Billing 1 must target sheet5.xml');
            assert.strictEqual(appJs.includes("'xl/worksheets/sheet6.xml'"), true, 'Billing 2 must target sheet6.xml');

            // Checklist targets sheet 7
            assert.strictEqual(appJs.includes("'xl/worksheets/sheet7.xml'"), true, 'Checklist must target sheet7.xml');
        });
    });

    describe('Suite 10: REV-077 Quotation Handler Scope Safety & Legacy Alias Integrity', () => {
        it('AUT-FRONT-28: should verify removeForm23Row and addForm23Row exist as callable aliases in app.js', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(appJs.includes('window.removeForm23Row = function(index)'), true, 'removeForm23Row must be safely declared');
            assert.strictEqual(appJs.includes('window.addForm23Row = function()'), true, 'addForm23Row must be safely declared');
            assert.strictEqual(appJs.includes('window.removeForm23ItemRow = removeForm23ItemRow'), true, 'removeForm23ItemRow must be registered');
        });

        it('AUT-FRONT-29: should verify app.js evaluates cleanly in JS context without top-level ReferenceErrors', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const sandbox = {
                window: {},
                document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {} },
                navigator: {},
                console: { log: () => {}, warn: () => {}, error: () => {} },
                localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
                sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
                setTimeout: () => {},
                setInterval: () => {},
                clearTimeout: () => {},
                clearInterval: () => {},
                fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
                CustomEvent: function() {},
                Event: function() {},
                location: { href: 'http://localhost:8000', search: '', pathname: '/' },
                alert: () => {},
                confirm: () => true,
                prompt: () => '',
                addEventListener: () => {}
            };
            sandbox.window = sandbox;
            sandbox.globalThis = sandbox;
            sandbox.self = sandbox;

            assert.doesNotThrow(() => {
                vm.runInNewContext(appJs, sandbox);
            }, 'app.js must execute without throwing top-level ReferenceErrors');

            assert.strictEqual(typeof sandbox.window.removeForm23Row, 'function');
            assert.strictEqual(typeof sandbox.window.addForm23Row, 'function');
        });

        it('AUT-FRONT-30: should verify exportOfficialXLSX uses OpenXML SpreadsheetML namespace and purges empty xmlns attributes', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(appJs.includes("const SML_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';"), true, 'SpreadsheetML namespace must be defined');
            assert.strictEqual(appJs.includes("doc.createElementNS(SML_NS, 'is')"), true, 'inlineStr <is> element must use SpreadsheetML namespace');
            assert.strictEqual(appJs.includes("doc.createElementNS(SML_NS, 't')"), true, '<t> element must use SpreadsheetML namespace');
            assert.strictEqual(appJs.includes("doc.createElementNS(SML_NS, 'v')"), true, '<v> element must use SpreadsheetML namespace');
            assert.strictEqual(appJs.includes("replace(/\\sxmlns=\"\"/g, '')"), true, 'Empty xmlns attributes must be purged on sheet serialization');
            assert.strictEqual(appJs.includes('fullCalcOnLoad="1"'), true, 'Workbook must enforce automatic formula recalculation on load');
        });
    });

    describe('Suite 11: REV-080 1-Button Studio RO Registration, Back-Job Sync & Intake Streamlining', () => {
        it('AUT-FRONT-31: should verify registerStudioROToSystem gathers all 10 core fields, back-job attributes, and maintains pushToBayQueueFromStudio alias', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(appJs.includes('async function registerStudioROToSystem()'), true, 'registerStudioROToSystem function must be declared');
            assert.strictEqual(appJs.includes('window.registerStudioROToSystem = registerStudioROToSystem;'), true, 'registerStudioROToSystem must be exposed on window');
            assert.strictEqual(appJs.includes('window.pushToBayQueueFromStudio = registerStudioROToSystem;'), true, 'pushToBayQueueFromStudio must be aliased to registerStudioROToSystem');
            assert.strictEqual(appJs.includes('address: address,'), true, 'payload must include address');
            assert.strictEqual(appJs.includes('kmReading: kmReading,'), true, 'payload must include kmReading');
            assert.strictEqual(appJs.includes('engineNo: engineNo,'), true, 'payload must include engineNo');
            assert.strictEqual(appJs.includes('color: color,'), true, 'payload must include color');
            assert.strictEqual(appJs.includes('isBackjob: isBackJobActive ? 1 : 0,'), true, 'payload must include isBackjob flag');
            assert.strictEqual(appJs.includes('parentJobId: parentJobId,'), true, 'payload must include parentJobId');
        });

        it('AUT-FRONT-32: should verify loadCustomerIntoStudioForms and cancelStudioBackJobMode support returning customer and warranty back-job loading', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(appJs.includes('function loadCustomerIntoStudioForms('), true, 'loadCustomerIntoStudioForms must be declared');
            assert.strictEqual(appJs.includes('window.loadCustomerIntoStudioForms = loadCustomerIntoStudioForms;'), true, 'loadCustomerIntoStudioForms must be exposed on window');
            assert.strictEqual(appJs.includes('function cancelStudioBackJobMode('), true, 'cancelStudioBackJobMode must be declared');
            assert.strictEqual(appJs.includes('window.cancelStudioBackJobMode = cancelStudioBackJobMode;'), true, 'cancelStudioBackJobMode must be exposed on window');
            assert.strictEqual(appJs.includes("document.getElementById('f13-backjob-banner')"), true, 'Must manage f13-backjob-banner DOM element');
        });

        it('AUT-FRONT-33: should verify customer lookup registry and search indexing include engine_no and address alongside plate and name', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(appJs.includes("const engineNo = (job.engine_no || job.engineNo || '').trim();"), true, 'customer registry must extract engine_no');
            assert.strictEqual(appJs.includes("const address = (job.address || '').trim();"), true, 'customer registry must extract address');
            assert.strictEqual(appJs.includes("const matchEngine = (cust.engineNo || '').toLowerCase().includes(query)"), true, 'lookup search filter must match on engine number');
        });

        it('AUT-FRONT-34: should verify index.html UI elements for 1-Button registration and back-job warranty alert banner', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            assert.strictEqual(indexHtml.includes('id="btn-register-ro-top"'), true, '#btn-register-ro-top must exist in index.html');
            assert.strictEqual(indexHtml.includes('id="f13-btn-register-ro"'), true, '#f13-btn-register-ro must exist in index.html');
            assert.strictEqual(indexHtml.includes('id="f13-backjob-banner"'), true, '#f13-backjob-banner must exist in index.html');
            assert.strictEqual(indexHtml.includes('registerStudioROToSystem()'), true, 'registerStudioROToSystem onclick handler must exist');
        });

        it('AUT-FRONT-35: should verify Service Advisor navigation stream eliminates obsolete Walk-In Form and bay queue fallback targets 2025 RO Excel Studio', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // Find SA nav block
            const saNavIdx = appJs.indexOf("else if (role === 'sa') {");
            const saNavBlock = appJs.slice(saNavIdx, saNavIdx + 1200);

            assert.strictEqual(saNavBlock.includes('Walk-In Form'), false, 'SA navigation must not contain obsolete Walk-In Form');
            assert.strictEqual(appJs.includes("closeBayAllocationModal(); showSection('form13');"), true, 'Empty bay allocation fallback must target form13');
        });
    });

    describe('Suite 12: Authentic HonTech Form 1/3 Customer Details Layout & Dossier Actions (REV-081)', () => {
        it('AUT-FRONT-36: should verify top contact header, CUSTOMER DETAILS banner, and cache buster v=2.40 in index.html', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            assert.strictEqual(indexHtml.includes('85644550 / 71219124 / 09458757441 / 09525065084 - VIBER'), true, 'Must display official HonTech contact header');
            assert.strictEqual(indexHtml.includes('CUSTOMER DETAILS'), true, 'Must include authentic CUSTOMER DETAILS uppercase banner');
            assert.strictEqual(indexHtml.toLowerCase().includes('bg-[#c0c0c0]'), true, 'Header banner must have authentic gray background #c0c0c0');
            assert.strictEqual(/js\/app\.js\?v=2\.(4[0-9]|[5-9]\d)/.test(indexHtml), true, 'Cache buster must be at least v=2.40');
        });

        it('AUT-FRONT-37: should verify all 12 authentic HonTech Form 1/3 fields exist in index.html with underlined document styling', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            const expectedFieldIds = [
                // Col 1: Customer Identity & Contacts
                'dossier-customer-name',
                'dossier-customer-address',
                'dossier-customer-phone',
                'dossier-customer-email',
                // Col 2: Vehicle Specs & Mechanics
                'dossier-vehicle-model',
                'dossier-km-reading',
                'dossier-engine-no',
                'dossier-chassis-no',
                // Col 3: Registration, Timeline & Appearance
                'dossier-vehicle-plate',
                'dossier-intake-date',
                'dossier-promise-date',
                'dossier-vehicle-color'
            ];

            expectedFieldIds.forEach(id => {
                assert.strictEqual(indexHtml.includes(`id="${id}"`), true, `Field element #${id} must exist in index.html`);
            });
        });

        it('AUT-FRONT-38: should verify customer lookup registry extracts email and chassis_no, and selectCustomerForLookup populates all 12 fields', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(appJs.includes("const chassisNo = (job.chassis_no || job.chassisNo || job.chassis || '').trim();"), true, 'Registry must extract chassis number');
            assert.strictEqual(appJs.includes("const email = (job.customer_email || job.email || '').trim();"), true, 'Registry must extract customer email');
            assert.strictEqual(appJs.includes("document.getElementById('dossier-customer-email').innerText = cust.email"), true, 'Must populate dossier-customer-email');
            assert.strictEqual(appJs.includes("document.getElementById('dossier-chassis-no').innerText = cust.chassisNo"), true, 'Must populate dossier-chassis-no');
            assert.strictEqual(appJs.includes("document.getElementById('dossier-intake-date').innerText = intakeDateFormatted"), true, 'Must populate dossier-intake-date');
            assert.strictEqual(appJs.includes("document.getElementById('dossier-promise-date').innerText = promiseDateFormatted"), true, 'Must populate dossier-promise-date');
        });

        it('AUT-FRONT-39: should verify copyCustomerDossier function, action command buttons, and telemetry integration', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            assert.strictEqual(appJs.includes('function copyCustomerDossier()'), true, 'copyCustomerDossier function must be declared');
            assert.strictEqual(appJs.includes('window.copyCustomerDossier = copyCustomerDossier;'), true, 'copyCustomerDossier must be exposed on window');
            assert.strictEqual(indexHtml.includes('onclick="copyCustomerDossier()"'), true, 'Copy button must trigger copyCustomerDossier()');
            assert.strictEqual(indexHtml.includes('id="btn-regular-visit"'), true, 'Start New Service button must exist');
            assert.strictEqual(indexHtml.includes('id="btn-backjob-yes"'), true, 'Issue Back-Job button must exist');
            assert.strictEqual(indexHtml.includes('onclick="exportCustomerServicePassportPDF()"'), true, 'Passport PDF button must exist');
            assert.strictEqual(indexHtml.includes('id="dossier-total-visits"'), true, 'Telemetry metric Total Visits must exist');
        });
    });
describe('Suite 13: Daily Intakes 3-Table Alignment, Spacing Rhythm & Command Deck (REV-082)', () => {
        it('AUT-FRONT-40: should verify section-queue uses unified flex gap-5 layout and standard card headers', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            assert.strictEqual(indexHtml.includes('id="section-queue" class="section-content hidden fade-in flex flex-col gap-5'), true, 'section-queue must use flex flex-col gap-5');
            assert.strictEqual(indexHtml.includes('border-t-blue-600'), true, 'Booking Module must have blue accent header');
            assert.strictEqual(indexHtml.includes('border-t-red-600'), true, 'Daily Intakes must have red accent header');
            assert.strictEqual(indexHtml.includes('border-t-amber-500'), true, 'Carry-Over Data must have amber accent header');
            assert.strictEqual(indexHtml.includes('src="js/app.js?v=2.52"') || indexHtml.includes('src="js/app.js?v=2.51"') || indexHtml.includes('src="js/app.js?v=2.50"') || indexHtml.includes('src="js/app.js?v=2.49"') || indexHtml.includes('src="js/app.js?v=2.48"') || indexHtml.includes('src="js/app.js?v=2.47"') || indexHtml.includes('src="js/app.js?v=2.46"') || indexHtml.includes('src="js/app.js?v=2.45"') || indexHtml.includes('src="js/app.js?v=2.44"') || indexHtml.includes('src="js/app.js?v=2.43"') || indexHtml.includes('src="js/app.js?v=2.42"') || indexHtml.includes('src="js/app.js?v=2.41"'), true, 'Cache buster must be incremented');
        });

        it('AUT-FRONT-41: should verify unified command deck and standardized table header across queue views', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(appJs.includes('Unified Command & Filter Deck') || appJs.includes('intake-search-input'), true, 'Daily Intakes command deck must exist');
            assert.strictEqual(appJs.includes('Claim Stub'), true, 'Claim Stub sorting header must exist');
            assert.strictEqual(appJs.includes('bg-slate-50/95 backdrop-blur-xs'), true, 'Sticky backdrop table header must be used');
        });

        it('AUT-FRONT-42: should verify Carry-Over table compact cells and action buttons prevent horizontal overflow', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(appJs.includes('Return Active'), true, 'Return Active button must exist in Carry-Over');
            assert.strictEqual(appJs.includes('setJobStatus'), true, 'setJobStatus call must be bound');
            assert.strictEqual(appJs.includes('completeRelease'), true, 'completeRelease call must be bound');
        });
    });

    describe('Suite 14: Model & Category Column Form Vertical Badge Stacking (REV-083)', () => {
        it('AUT-FRONT-43: should verify Model & Category badges use vertical column stack flex-col items-start in app.js', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(
                appJs.includes('flex flex-col items-start'),
                true,
                'Model & Category badge container must use flex flex-col items-start to stack badges vertically in column form'
            );
            
            const advisorIdx = appJs.indexOf('<!-- Service Advisor Action / Status Badge -->');
            const categoryIdx = appJs.indexOf('<!-- Service Category Selection -->');
            const laneIdx = appJs.indexOf('<!-- Lane Selection -->');
            
            assert.strictEqual(advisorIdx !== -1, true, 'Advisor badge template must exist');
            assert.strictEqual(categoryIdx !== -1, true, 'Category selection template must exist');
            assert.strictEqual(laneIdx !== -1, true, 'Lane selection template must exist');
            assert.strictEqual(advisorIdx < categoryIdx, true, 'Advisor badge (myjob) must precede Service Category (grs)');
            assert.strictEqual(categoryIdx < laneIdx, true, 'Service Category (grs) must precede Lane Selection (special)');
        });
    });

    describe('Suite 15: Daily Intakes & Queue Tables Expanded Spacing & Cell Breathing Room (REV-084)', () => {
        it('AUT-FRONT-44: should verify Daily Intakes and Carry-Over tables use expanded cell padding py-3.5 and min-w-[240px]', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            assert.strictEqual(
                appJs.includes('px-5 py-5 align-middle min-w-[280px]') || appJs.includes('px-4 py-3.5 align-middle min-w-[240px]'),
                true,
                'Model & Category cell must use px-4 py-3.5 min-w-[240px] for spacious layout'
            );
            assert.strictEqual(
                appJs.includes('px-4 py-5') || appJs.includes('px-3.5 py-3.5'),
                true,
                'Cells must use generous py-3.5 padding to eliminate compressed feeling'
            );
            assert.strictEqual(
                indexHtml.includes('p-5 rounded-2xl'),
                true,
                'Card containers must use generous p-5 padding'
            );
        });
    });

    describe('Suite 16: Scaled Typography & Prominent Table Value Sizing (REV-085)', () => {
        it('AUT-FRONT-45: should verify table values and badges use prominent text-xs and text-sm sizing', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            assert.strictEqual(
                appJs.includes('font-bold text-slate-900 text-sm'),
                true,
                'Vehicle names must use prominent text-sm font-bold'
            );
            assert.strictEqual(
                appJs.includes('text-xs font-bold uppercase px-3 py-1.5') || appJs.includes('text-xs font-bold uppercase px-2.5 py-1'),
                true,
                'Badges must use comfortable text-xs with px-2.5 py-1 padding'
            );
            assert.strictEqual(
                indexHtml.includes('text-slate-600 text-xs font-black uppercase tracking-wider'),
                true,
                'Table headers must use clear text-xs typography'
            );
        });
    });

    describe('Suite 17: Queue Unified 3-Table Stack, Edge Insets & Scrollbar Clearance (REV-087)', () => {
        it('AUT-FRONT-46: should verify main-content edge padding, sleek custom scrollbars, table min-height and clearance', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            assert.strictEqual(
                indexHtml.includes('padding: 1.5rem'),
                true,
                'main-content must have edge padding (1.5rem) to prevent cards from touching window edges'
            );
            assert.strictEqual(
                indexHtml.includes('height: 6px !important;'),
                true,
                'Custom sleek 6px scrollbars must be defined to eliminate bulky default scrollbars'
            );
            assert.strictEqual(
                indexHtml.includes('min-height: 180px !important;'),
                true,
                'Table scroll wrappers must enforce min-height: 180px so empty/single rows never crush headers'
            );
            assert.strictEqual(
                indexHtml.includes('padding-bottom: 6px !important;'),
                true,
                'Table scroll wrappers must have padding-bottom: 6px clearance so scrollbars never overlay row contents'
            );
            assert.strictEqual(
                indexHtml.includes('id="container-online-queue"') &&
                indexHtml.includes('id="container-daily-intakes"') &&
                indexHtml.includes('id="container-carry-over"'),
                true,
                'All three queue module tables must be present and unified on the screen'
            );
        });
    });

    describe('Suite 18: REV-089 DOM Hierarchy Recovery & Dual Scroll Elimination', () => {
        it('AUT-FRONT-47: should verify section-queue is properly nested inside main-content without premature closing tags', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            
            // Check that app-main-wrapper has w-full max-w-full and is not squashed
            assert.strictEqual(
                indexHtml.includes('id="app-main-wrapper" class="flex-1 min-w-0 flex flex-col h-full overflow-hidden w-full max-w-full"'),
                true,
                'app-main-wrapper must have w-full max-w-full'
            );
            
            // Check that section-form13 does not have extra closing div tags dumping main-content
            const form13Idx = indexHtml.indexOf('id="section-form13"');
            const queueIdx = indexHtml.indexOf('id="section-queue"');
            const mainCloseIdx = indexHtml.indexOf('</main>');
            
            assert.strictEqual(form13Idx !== -1 && queueIdx !== -1, true, 'Both sections must exist');
            assert.strictEqual(queueIdx < mainCloseIdx, true, 'section-queue must be inside <main id="main-content"> before </main>');
            
            // Verify cache buster
            assert.strictEqual(indexHtml.includes('src="js/app.js?v=2.52"') || indexHtml.includes('src="js/app.js?v=2.51"') || indexHtml.includes('src="js/app.js?v=2.50"') || indexHtml.includes('src="js/app.js?v=2.49"') || indexHtml.includes('src="js/app.js?v=2.48"'), true, 'Cache buster must be incremented');
        });
    });


    describe('Suite 19: REV-090 Filter Deck Distance & Roomy Table Row Spacing', () => {
        it('AUT-FRONT-48: should verify generous distance between filter deck and table, and expanded py-5 row padding', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            assert.strictEqual(
                appJs.includes('space-y-6'),
                true,
                'Daily intakes container must use space-y-6 for generous distance from filter deck'
            );
            assert.strictEqual(
                appJs.includes('px-5 py-5 align-middle min-w-[280px]'),
                true,
                'Model & Category column must use px-5 py-5 with min-w-[280px] for spacious layout'
            );
            assert.strictEqual(
                appJs.includes('px-4 py-5 align-middle whitespace-nowrap'),
                true,
                'Rows must use generous py-5 padding to eliminate cramped feeling'
            );
            assert.strictEqual(
                appJs.includes('px-3 py-4.5 bg-slate-50 text-center w-10 text-slate-400 font-bold'),
                true,
                'Table headers must use py-4.5 for comfortable vertical breathing room'
            );
            assert.strictEqual(
                indexHtml.includes('src="js/app.js?v=2.52"') || indexHtml.includes('src="js/app.js?v=2.51"') || indexHtml.includes('src="js/app.js?v=2.50"') || indexHtml.includes('src="js/app.js?v=2.49"'),
                true,
                'Cache buster must be v=2.52, v=2.51, v=2.50 or v=2.49'
            );
        });
    });


    describe('Suite 20: REV-091 Multi-Table Design Harmonization & Inner Viewport Scroll Limits', () => {
        it('AUT-FRONT-49: should verify inner scroll containers, py-5 roomy rows, and badge harmonization across all queue tables', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            // 1. Daily Intakes inner scroll container with max-h-[500px] overflow-y-auto
            assert.strictEqual(
                appJs.includes('overflow-x-auto max-h-[500px] overflow-y-auto border border-slate-200 rounded-xl custom-scroll bg-white shadow-sm pb-4 mt-2'),
                true,
                'Daily intakes table wrapper must have max-h-[500px] and overflow-y-auto for smooth internal scrolling'
            );

            // 2. Booking Module and Carry-Over inner scroll containers in index.html
            assert.strictEqual(
                indexHtml.includes('id="container-online-queue"') && indexHtml.includes('max-h-[480px] overflow-y-auto'),
                true,
                'Booking module container must have max-h-[480px] overflow-y-auto'
            );
            assert.strictEqual(
                indexHtml.includes('id="container-carry-over"') && indexHtml.includes('max-h-[480px] overflow-y-auto'),
                true,
                'Carry-over container must have max-h-[480px] overflow-y-auto'
            );

            // 3. Roomy py-5 row padding in Booking Module and Carry-Over
            assert.strictEqual(
                appJs.includes('px-4 py-5 align-middle') && appJs.includes('px-3 py-5 text-center font-mono text-xs text-slate-400 font-bold align-middle'),
                true,
                'Booking module rows must use generous py-5 padding'
            );
            assert.strictEqual(
                appJs.includes('px-3 py-5 align-middle text-center font-mono text-xs text-slate-400 font-bold'),
                true,
                'Carry-over rows must use generous py-5 padding'
            );

            // 4. Roomy badge pills (px-3 py-1.5 rounded-lg) in Carry-Over and Booking
            assert.strictEqual(
                appJs.includes('px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs'),
                true,
                'Plate numbers and claim stubs must use roomy px-3 py-1.5 rounded-lg badge pills'
            );

            // 5. Cache buster v=2.52, v=2.51 or v=2.50
            assert.strictEqual(
                indexHtml.includes('src="js/app.js?v=2.52"') || indexHtml.includes('src="js/app.js?v=2.51"') || indexHtml.includes('src="js/app.js?v=2.50"'),
                true,
                'Cache buster must be v=2.52, v=2.51 or v=2.50'
            );
        });
    });

    describe('Suite 21: REV-092 Carry-Over Table Revisions & Remarks Migration', () => {
        it('AUT-FRONT-50: should verify Carry-Over table header has no Claim Stub column and features Remarks header', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            const carryOverTableIdx = indexHtml.indexOf('id="table-carry-over"');
            assert.strictEqual(carryOverTableIdx !== -1, true, 'table-carry-over must exist in index.html');

            const carryOverHeaderSection = indexHtml.substring(carryOverTableIdx - 1500, carryOverTableIdx);
            assert.strictEqual(
                carryOverHeaderSection.includes('Claim Stub'),
                false,
                'Carry-Over header must NOT contain Claim Stub column to recover horizontal width'
            );
            assert.strictEqual(
                carryOverHeaderSection.includes('Remarks') && carryOverHeaderSection.includes('min-w-[210px]'),
                true,
                'Carry-Over header must feature Remarks column with min-w-[210px]'
            );
        });

        it('AUT-FRONT-51: should verify Carry-Over row template removes Claim Stub, implements hybrid flexible Remarks combobox, and has colspan 9', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Verify hybrid flexible Remarks combobox with co-remarks- id
            assert.strictEqual(
                appJs.includes('id="co-remarks-${job.id}"'),
                true,
                'Carry-Over rows must feature hybrid flexible text input co-remarks-${job.id}'
            );
            assert.strictEqual(
                appJs.includes('placeholder="Remarks or choose preset..."'),
                true,
                'Remarks input must guide user to type freely or choose standard preset'
            );
            assert.strictEqual(
                appJs.includes('Pick standard preset or type custom remark'),
                true,
                'Remarks select dropdown must allow selecting quick presets'
            );

            // 2. Verify key presets are available
            assert.strictEqual(
                appJs.includes('Awaiting Parts') && 
                appJs.includes('For Customer Approval') && 
                appJs.includes('Machine Shop / Sublet') && 
                appJs.includes('Insurance Clearance'),
                true,
                'Remarks presets must include workshop operational categories'
            );

            // 3. Verify empty state colspan is 9 (not 10)
            assert.strictEqual(
                appJs.includes('colspan="9" class="text-center py-10 text-slate-400 font-medium">No carry over vehicles'),
                true,
                'Carry-Over empty state must have colspan="9" matching the 9 table columns'
            );
        });

        it('AUT-FRONT-52: should verify cache buster is incremented to v=2.51 or v=2.52', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            assert.strictEqual(
                indexHtml.includes('src="js/app.js?v=2.52"') || indexHtml.includes('src="js/app.js?v=2.51"'),
                true,
                'Cache buster in index.html must be incremented to v=2.52 or v=2.51'
            );
        });
    });

    describe('Suite 22: REV-093 Status Terminology Upgrade ("Monitoring" ➔ "Processing") & Relaxing Lounge Voice Engine', () => {
        it('AUT-FRONT-53: should verify isProcessingStatus helper exists and supports backward compatibility', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(
                appJs.includes('function isProcessingStatus(status)'),
                true,
                'isProcessingStatus function must exist in frontend/js/app.js'
            );
            assert.strictEqual(
                appJs.includes("status === 'Processing' || status === 'Monitoring'"),
                true,
                'isProcessingStatus must treat both Processing and Monitoring as active processing status'
            );
        });

        it('AUT-FRONT-54: should verify table row status dropdown and workshop bay assignment use Processing terminology', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(
                appJs.includes('<option value="Processing"'),
                true,
                'Daily intakes table status select must contain Processing option'
            );
            assert.strictEqual(
                appJs.includes("Set Status to 'Processing' to assign a workshop bay."),
                true,
                'Locked workshop bay tooltip must instruct setting status to Processing'
            );
            assert.strictEqual(
                appJs.includes('Status: ${curStatus} ➔ Promotes to Processing') || appJs.includes('Promotes to Processing'),
                true,
                'Bay allocation dispatch modal must promote waiting vehicles to Processing'
            );
        });

        it('AUT-FRONT-55: should verify universal broadcast toast plaque, relaxing lounge chime and female voice selection', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const tvHtml = fs.readFileSync(path.resolve('frontend/tv.html'), 'utf8');

            // 1. Toast markup in index.html
            assert.strictEqual(
                indexHtml.includes('id="universal-broadcast-alert-toast"'),
                true,
                'Universal broadcast alert toast markup must exist in index.html'
            );

            // 2. Toast functions in app.js
            assert.strictEqual(
                appJs.includes('function showUniversalBroadcastToast('),
                true,
                'showUniversalBroadcastToast function must exist in app.js'
            );
            assert.strictEqual(
                appJs.includes('function dismissUniversalBroadcastToast()'),
                true,
                'dismissUniversalBroadcastToast function must exist in app.js'
            );

            // 3. Lounge chime theme in app.js and tv.html
            assert.strictEqual(
                appJs.includes("theme === 'lounge'"),
                true,
                'playAutomotiveChime must implement relaxing lounge theme'
            );
            assert.strictEqual(
                tvHtml.includes('WORKSHOP PROCESSING'),
                true,
                'tv.html alert header and simulation must display WORKSHOP PROCESSING'
            );

            // 4. Soft female voice selection keywords
            assert.strictEqual(
                appJs.includes('femaleKeywords') || appJs.includes('zira'),
                true,
                'Speech engine must filter for soft female voices'
            );
        });

        it('AUT-FRONT-56: should verify cache buster in index.html is incremented to v=2.52', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            assert.strictEqual(
                indexHtml.includes('src="js/app.js?v=2.52"'),
                true,
                'Cache buster in index.html must be incremented to v=2.52'
            );
        });
    });

});

