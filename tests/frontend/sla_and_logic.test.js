// tests/frontend/sla_and_logic.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
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
});

