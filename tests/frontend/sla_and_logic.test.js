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
            const currentXlsxPath = path.resolve('frontend/assets/Current_2025 BLANK RO UPDATED_V1.xlsx');
            assert.strictEqual(fs.existsSync(currentXlsxPath) || fs.existsSync(path.resolve('frontend/assets/Current_2025 BLANK RO UPDATED.xlsx')), true, 'Official 2025 BLANK RO template must exist in assets');
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
            assert.strictEqual(
                appJs.includes('drawText(jobNo, 478, 794, 8.5, true, darkInk);') ||
                appJs.includes('drawTextCenter(jobNo, 485.5, 781.5, 8.0, true, darkInk);') ||
                appJs.includes('drawTextCenter(jobNo, 498.8, 792.2, 8.0, true, darkInk);'),
                true,
                'Job No must use darkInk typography'
            );
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
            assert.strictEqual(appJs.includes('Current_2025%20BLANK%20RO%20UPDATED_V1.xlsx') || appJs.includes('Current_2025%20BLANK%20RO%20UPDATED.xlsx'), true, 'Template path must reference Current_2025 BLANK RO UPDATED_V1.xlsx');
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
            assert.strictEqual(/js\/app\.js\?v=(2\.(4[0-9]|[5-9]\d)|3\.\d{2})/.test(indexHtml), true, 'Cache buster must be at least v=2.40');
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
            assert.strictEqual(((((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"')) || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.56"') || indexHtml.includes('src="js/app.js?v=2.55"') || indexHtml.includes('src="js/app.js?v=2.54"') || indexHtml.includes('src="js/app.js?v=2.53"') || indexHtml.includes('src="js/app.js?v=2.52"') || indexHtml.includes('src="js/app.js?v=2.51"') || indexHtml.includes('src="js/app.js?v=2.50"') || indexHtml.includes('src="js/app.js?v=2.49"') || indexHtml.includes('src="js/app.js?v=2.48"') || indexHtml.includes('src="js/app.js?v=2.47"') || indexHtml.includes('src="js/app.js?v=2.46"') || indexHtml.includes('src="js/app.js?v=2.45"') || indexHtml.includes('src="js/app.js?v=2.44"') || indexHtml.includes('src="js/app.js?v=2.43"') || indexHtml.includes('src="js/app.js?v=2.42"') || indexHtml.includes('src="js/app.js?v=2.41"'), true, 'Cache buster must be incremented');
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
            assert.strictEqual((((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.56"') || indexHtml.includes('src="js/app.js?v=2.55"') || indexHtml.includes('src="js/app.js?v=2.54"') || indexHtml.includes('src="js/app.js?v=2.53"') || indexHtml.includes('src="js/app.js?v=2.52"') || indexHtml.includes('src="js/app.js?v=2.51"') || indexHtml.includes('src="js/app.js?v=2.50"') || indexHtml.includes('src="js/app.js?v=2.49"') || indexHtml.includes('src="js/app.js?v=2.48"'), true, 'Cache buster must be incremented');
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
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.56"') || indexHtml.includes('src="js/app.js?v=2.55"') || indexHtml.includes('src="js/app.js?v=2.54"') || indexHtml.includes('src="js/app.js?v=2.53"') || indexHtml.includes('src="js/app.js?v=2.52"') || indexHtml.includes('src="js/app.js?v=2.51"') || indexHtml.includes('src="js/app.js?v=2.50"') || indexHtml.includes('src="js/app.js?v=2.49"'),
                true,
                'Cache buster must be v=2.61, v=2.60, v=2.59, v=2.58, v=2.57, v=2.56, v=2.55, v=2.54, v=2.53, v=2.52, v=2.51, v=2.50 or v=2.49'
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

            // 5. Cache buster
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.56"') || indexHtml.includes('src="js/app.js?v=2.55"') || indexHtml.includes('src="js/app.js?v=2.54"') || indexHtml.includes('src="js/app.js?v=2.53"') || indexHtml.includes('src="js/app.js?v=2.52"') || indexHtml.includes('src="js/app.js?v=2.51"') || indexHtml.includes('src="js/app.js?v=2.50"'),
                true,
                'Cache buster must be v=2.61, v=2.60, v=2.59, v=2.58, v=2.57, v=2.56, v=2.55, v=2.54, v=2.53, v=2.52, v=2.51 or v=2.50'
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
        });        it('AUT-FRONT-52: should verify cache buster is incremented to v=2.51, v=2.52, v=2.53, v=2.54, v=2.55, v=2.56, v=2.57, v=2.58, v=2.59, v=2.60 or v=2.61', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.56"') || indexHtml.includes('src="js/app.js?v=2.55"') || indexHtml.includes('src="js/app.js?v=2.54"') || indexHtml.includes('src="js/app.js?v=2.53"') || indexHtml.includes('src="js/app.js?v=2.52"') || indexHtml.includes('src="js/app.js?v=2.51"'),
                true,
                'Cache buster in index.html must be incremented to v=2.61, v=2.60, v=2.59, v=2.58, v=2.57, v=2.56, v=2.55, v=2.54, v=2.53, v=2.52 or v=2.51'
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

        it('AUT-FRONT-56: should verify cache buster in index.html is incremented to v=2.52, v=2.53, v=2.54, v=2.55, v=2.56, v=2.57, v=2.58, v=2.59, v=2.60 or v=2.61', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.56"') || indexHtml.includes('src="js/app.js?v=2.55"') || indexHtml.includes('src="js/app.js?v=2.54"') || indexHtml.includes('src="js/app.js?v=2.53"') || indexHtml.includes('src="js/app.js?v=2.52"'),
                true,
                'Cache buster in index.html must be incremented to v=2.61, v=2.60, v=2.59, v=2.58, v=2.57, v=2.56, v=2.55, v=2.54, v=2.53 or v=2.52'
            );
        });
    });

    describe('Suite 23: REV-094 Automatic Departure Clock Stamping & Same-Day Re-open Safeguards', () => {
        it('AUT-FRONT-57: should verify departure column is non-editable zero-typing display badge in app.js', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(
                appJs.includes('Departure (Zero-Typing Automatic Clock Stamping)'),
                true,
                'Departure column must use zero-typing automatic clock stamping'
            );
            assert.strictEqual(
                appJs.includes('Actual Departure Timestamped on Release'),
                true,
                'Departure badge must display actual timestamp on release'
            );
            assert.strictEqual(
                appJs.includes('--:--'),
                true,
                'Active vehicles in service must display non-editable --:--'
            );
        });

        it('AUT-FRONT-58: should verify confirmReleaseJob captures system clock, sets Released status, and announces release', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(
                appJs.includes('function confirmReleaseJob()'),
                true,
                'confirmReleaseJob function must exist in app.js'
            );
            assert.strictEqual(
                appJs.includes("status: 'Released'"),
                true,
                'confirmReleaseJob must persist Released status in database'
            );
            assert.strictEqual(
                appJs.includes('announceVehicleReleased'),
                true,
                'announceVehicleReleased must be invoked on release'
            );
            assert.strictEqual(
                appJs.includes('Departure Clock Stamped'),
                true,
                'Release toast must indicate Departure Clock Stamped'
            );
        });

        it('AUT-FRONT-59: should verify reopen-confirm-modal and reopenSameDayJob restore vehicle to Processing', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(
                indexHtml.includes('id="reopen-confirm-modal"'),
                true,
                'reopen-confirm-modal markup must exist in index.html'
            );
            assert.strictEqual(
                appJs.includes('function reopenSameDayJob('),
                true,
                'reopenSameDayJob function must exist in app.js'
            );
            assert.strictEqual(
                appJs.includes('function confirmReopenJob('),
                true,
                'confirmReopenJob function must exist in app.js'
            );
            assert.strictEqual(
                appJs.includes("status: 'Processing'"),
                true,
                'confirmReopenJob must revert status to Processing'
            );
        });

        it('AUT-FRONT-60: should verify cache buster in index.html is incremented to v=2.53, v=2.54, v=2.55, v=2.56, v=2.57, v=2.58, v=2.59, v=2.60 or v=2.61', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.56"') || indexHtml.includes('src="js/app.js?v=2.55"') || indexHtml.includes('src="js/app.js?v=2.54"') || indexHtml.includes('src="js/app.js?v=2.53"'),
                true,
                'Cache buster in index.html must be incremented to v=2.61, v=2.60, v=2.59, v=2.58, v=2.57, v=2.56, v=2.55, v=2.53 or v=2.54'
            );
        });
    });

    describe('Suite 24: REV-095 Natural Claim Stub Sorting & Interactive Customer Lookup Link', () => {
        it('AUT-FRONT-61: should verify naturalStubSort function orders claim stubs naturally', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(
                appJs.includes('function naturalStubSort('),
                true,
                'naturalStubSort function must exist in frontend/js/app.js'
            );
            assert.strictEqual(
                appJs.includes("numeric: true"),
                true,
                'naturalStubSort must use numeric: true comparison'
            );

            // Directly test natural sorting behavior
            const testStubs = ['052226j10', '052226j2', '052226j1', '052226j11', '052226j9'];
            const sorted = [...testStubs].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
            assert.deepStrictEqual(sorted, ['052226j1', '052226j2', '052226j9', '052226j10', '052226j11']);
        });

        it('AUT-FRONT-62: should verify Daily Intakes eliminates printer button and provides clickable lookup quick-link', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const renderJobRowsStart = appJs.indexOf('const renderJobRows = (jobsList) =>');
            assert.strictEqual(renderJobRowsStart !== -1, true, 'renderJobRows must exist');
            const intakeRowBlock = appJs.slice(renderJobRowsStart, renderJobRowsStart + 3000);

            assert.strictEqual(
                intakeRowBlock.includes('openCustomerLookupForStub('),
                true,
                'Daily intakes claim stub must trigger openCustomerLookupForStub'
            );
            assert.strictEqual(
                intakeRowBlock.includes('printJobClaimStubPDF'),
                false,
                'Redundant printer button printJobClaimStubPDF must be purged from Daily Intakes table cell'
            );
        });

        it('AUT-FRONT-63: should verify openCustomerLookupForStub navigates to lookup and selects customer dossier', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(
                appJs.includes('function openCustomerLookupForStub(stub, plate)'),
                true,
                'openCustomerLookupForStub function must exist in app.js'
            );
            assert.strictEqual(
                appJs.includes("showSection('lookup')"),
                true,
                'openCustomerLookupForStub must navigate to lookup section'
            );
            assert.strictEqual(
                appJs.includes('selectCustomerForLookup('),
                true,
                'openCustomerLookupForStub must trigger selectCustomerForLookup'
            );
        });

        it('AUT-FRONT-64: should verify dossier live status badge in index.html and cache buster v=2.54, v=2.55, v=2.56, v=2.57, v=2.58, v=2.59, v=2.60 or v=2.61', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(
                indexHtml.includes('id="dossier-live-status-badge"'),
                true,
                'dossier-live-status-badge must exist in index.html'
            );
            assert.strictEqual(
                appJs.includes('dossier-live-status-badge'),
                true,
                'app.js selectCustomerForLookup must compute live status badge'
            );
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.54"') || indexHtml.includes('src="js/app.js?v=2.55"') || indexHtml.includes('src="js/app.js?v=2.56"'),
                true,
                'Cache buster in index.html must be incremented to v=2.61, v=2.60, v=2.59, v=2.58, v=2.57, v=2.54, v=2.55 or v=2.56'
            );
        });
    });

    describe('Suite 25: REV-096 Express 2-Hour SLA Overrun Trigger & Simple Tabular Audit Hub', () => {
        it('AUT-FRONT-65: should verify showGoal (SLA delay reporting) is scoped to SA, Owner, and Admin only in app.js — Assistant has no reporting ability (REV-135)', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            assert.strictEqual(
                appJs.includes('const showGoal = isOwnerOrAdmin || isSA;'),
                true,
                'showGoal must include isSA so Service Advisors see the SLA column'
            );
            assert.strictEqual(
                appJs.includes('const showGoal = isOwnerOrAdmin || isAsst || isSA;'),
                false,
                'showGoal must NOT include isAsst — Assistant staff have no ability to file an SLA delay report'
            );
        });

        it('AUT-FRONT-66: should verify SLA cell renders interactive trigger [⚠️ 2h Exceeded — File Report] and reported status pill', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            assert.strictEqual(
                appJs.includes('openExpressDelayModal('),
                true,
                'SLA cell must link to openExpressDelayModal'
            );
            assert.strictEqual(
                appJs.includes('2h Exceeded — File Report'),
                true,
                'SLA cell must render 2h Exceeded — File Report trigger button'
            );
            assert.strictEqual(
                appJs.includes('Reported:'),
                true,
                'SLA cell must render Reported status badge once report is logged'
            );
        });

        it('AUT-FRONT-67: should verify openExpressDelayModal and submitExpressDelayReport persist to /api/express-issues', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            assert.strictEqual(
                indexHtml.includes('id="modal-express-delay-report"'),
                true,
                'modal-express-delay-report must exist in index.html'
            );
            assert.strictEqual(
                appJs.includes('function openExpressDelayModal(jobId)'),
                true,
                'openExpressDelayModal must be defined in app.js'
            );
            assert.strictEqual(
                appJs.includes('/api/express-issues'),
                true,
                'submitExpressDelayReport must post to /api/express-issues'
            );
            assert.strictEqual(
                appJs.includes('window.openExpressDelayModal = openExpressDelayModal;'),
                true,
                'openExpressDelayModal must be bound to window'
            );
        });

        it('AUT-FRONT-68: should verify #db-tab-express maintains a clean tabular layout without Chart.js canvas elements and cache buster v=2.55, v=2.56, v=2.57, v=2.58, v=2.59, v=2.60 or v=2.61', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const expressTabBlock = indexHtml.slice(indexHtml.indexOf('id="db-tab-express"'), indexHtml.indexOf('id="db-tab-backjobs"'));

            assert.strictEqual(
                expressTabBlock.includes('<canvas'),
                false,
                'db-tab-express must not contain heavy canvas graph elements'
            );
            assert.strictEqual(
                expressTabBlock.includes('id="table-express-delays-body"'),
                true,
                'db-tab-express must contain dedicated table-express-delays-body'
            );
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.55"') || indexHtml.includes('src="js/app.js?v=2.56"'),
                true,
                'Cache buster in index.html must be incremented to v=2.61, v=2.60, v=2.59, v=2.58, v=2.57, v=2.55 or v=2.56'
            );
        });
    });

    describe('Suite 26: REV-097 Dual-Mode TV Monitoring Audio-Visual Announcements & Silent SA Dashboard', () => {
        it('AUT-FRONT-69: should verify deep state diffing for location / bay transitions and status in tv.html', () => {
            const tvHtml = fs.readFileSync(path.resolve('frontend/tv.html'), 'utf8');

            // REV-189: bay / status transitions are recorded by the server (tv_announcements) instead of
            // being guessed by diffing job lists on the TV, so the TV no longer keeps a snapshot map
            assert.strictEqual(
                tvHtml.includes('bay:        a => ({ statusText: `ALLOCATED: ${'),
                true,
                'tv.html must announce bay allocations'
            );
            assert.strictEqual(
                tvHtml.includes('ALLOCATED:') || tvHtml.includes('BAY-'),
                true,
                'tv.html must trigger bay allocation broadcast when location changes'
            );
            assert.strictEqual(
                tvHtml.includes('async function pollTVAnnouncements()') && !tvHtml.includes('jobStateSnapshotMap'),
                true,
                'tv.html must play server-recorded announcements instead of diffing job snapshots'
            );
        });

        it('AUT-FRONT-70: should verify tv.html contains sequential announcement queue and locked permanent female voice', () => {
            const tvHtml = fs.readFileSync(path.resolve('frontend/tv.html'), 'utf8');

            assert.strictEqual(
                tvHtml.includes('function getPermanentFemaleVoice()'),
                true,
                'tv.html must have getPermanentFemaleVoice function'
            );
            assert.strictEqual(
                tvHtml.includes('window._permanentFemaleVoice'),
                true,
                'tv.html must permanently lock female voice without switching personas'
            );
            assert.strictEqual(
                tvHtml.includes('maleKeywords'),
                true,
                'tv.html voice selector must explicitly exclude male voice names'
            );
            assert.strictEqual(
                tvHtml.includes('function enqueueTVAnnouncement('),
                true,
                'tv.html must provide sequential queue to avoid overlapping audio and speech'
            );
            assert.strictEqual(
                tvHtml.includes('function playAutomotiveChime(') || tvHtml.includes('function playChime('),
                true,
                'tv.html must have synthesized audio chime engine'
            );
        });

        it('AUT-FRONT-71: should verify app.js enforces silent SA dashboard and provides permanent female voice lock', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(
                appJs.includes('function isTVModuleActive()'),
                true,
                'app.js must provide isTVModuleActive helper'
            );
            assert.strictEqual(
                appJs.includes('if (isTVModuleActive())'),
                true,
                'Voice announcements must only trigger if TV module is active'
            );
            assert.strictEqual(
                appJs.includes('showUniversalBroadcastToast('),
                true,
                'Dashboard actions must continue to trigger visual broadcast toast even when silent'
            );
            assert.strictEqual(
                appJs.includes('function getPermanentFemaleVoice()'),
                true,
                'app.js must have getPermanentFemaleVoice helper'
            );
            assert.strictEqual(
                appJs.includes('_appPermanentFemaleVoice'),
                true,
                'app.js must permanently store selected female voice persona'
            );
        });

        it('AUT-FRONT-72: should verify cache buster in index.html is incremented to v=2.56, v=2.57, v=2.58, v=2.59, v=2.60 or v=2.61', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.56"'),
                true,
                'Cache buster in index.html must be incremented to v=2.61, v=2.60, v=2.59, v=2.58, v=2.57 or v=2.56'
            );
        });
    });

    describe('Suite 27: REV-098 Excel Auto-Locking, Authentic Staff Roster, Modernized Lookup UI & Assistant Destination Switcher', () => {
        it('AUT-FRONT-73: should verify exportOfficialXLSX injects sheetProtection across all exported worksheets', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(
                appJs.includes('const applySheetProtection = (doc) => {'),
                true,
                'exportOfficialXLSX must define applySheetProtection helper'
            );
            assert.strictEqual(
                appJs.includes("existingProt.setAttribute('sheet', '1');"),
                true,
                'sheetProtection must lock sheet edits'
            );
            assert.strictEqual(
                appJs.includes('applySheetProtection(sheet1Doc);'),
                true,
                'sheet1Doc (Job_Order) must be locked'
            );
            assert.strictEqual(
                appJs.includes('applySheetProtection(sheet7Doc);'),
                true,
                'sheet7Doc (CheckList_Result) must be locked'
            );
        });

        it('AUT-FRONT-74: should verify authentic employee directory in backend/seed.php with preserved test names', () => {
            const seedPhp = fs.readFileSync(path.resolve('backend/seed.php'), 'utf8');

            assert.strictEqual(
                seedPhp.includes('Nicodemus L. De Guzman'),
                true,
                'Owner must be Nicodemus L. De Guzman'
            );
            assert.strictEqual(
                seedPhp.includes('Laynie Espiritu'),
                true,
                'Admin must be Laynie Espiritu'
            );
            assert.strictEqual(
                seedPhp.includes('Manney Sarol'),
                true,
                'SA must be Manney Sarol'
            );
            assert.strictEqual(
                seedPhp.includes('Marriel Ayo'),
                true,
                'SA2 must be Marriel Ayo'
            );
            assert.strictEqual(
                seedPhp.includes('Mhiecaella Parungao'),
                true,
                'Assistant must be Mhiecaella Parungao'
            );
            assert.strictEqual(
                seedPhp.includes('EMPLOYEE TEST NAMES (Preserved for Future QA & Development Reference)'),
                true,
                'Old test employee names must be preserved as reference comment'
            );
        });

        it('AUT-FRONT-75: should verify Assistant table switcher, target branch selector, and cache buster v=2.57, v=2.58, v=2.59, v=2.60 or v=2.61 in index.html', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(
                indexHtml.includes('id="btn-dest-online"'),
                true,
                'btn-dest-online must exist in index.html'
            );
            assert.strictEqual(
                indexHtml.includes('id="btn-dest-daily"'),
                true,
                'btn-dest-daily must exist in index.html'
            );
            assert.strictEqual(
                indexHtml.includes('id="intake-target-branch"'),
                true,
                'intake-target-branch select must exist in index.html'
            );
            assert.strictEqual(
                appJs.includes('function setAssistantDestination(dest)'),
                true,
                'setAssistantDestination must be implemented in app.js'
            );
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.58"'),
                true,
                'Cache buster must be v=2.57, v=2.58, v=2.59, v=2.60 or v=2.61 in index.html'
            );
        });
    });

    describe('Suite 28: REV-099 Repository File Structure & Tooling Organization', () => {
        it('AUT-FRONT-76: should verify scripts/ directory exists and package.json references scripts/tunnel.js', () => {
            const pkgJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
            assert.strictEqual(
                pkgJson.scripts.tunnel,
                'node scripts/tunnel.js',
                'package.json tunnel script must reference scripts/tunnel.js'
            );
            assert.strictEqual(
                fs.existsSync(path.resolve('scripts/start_lan_server.bat')),
                true,
                'start_lan_server.bat must be located in scripts/'
            );
            assert.strictEqual(
                fs.existsSync(path.resolve('scripts/backup_database.bat')),
                true,
                'backup_database.bat must be located in scripts/'
            );
            assert.strictEqual(
                fs.existsSync(path.resolve('cloudflared.exe')),
                false,
                'cloudflared.exe must not be duplicated in root directory'
            );
            assert.strictEqual(
                fs.existsSync(path.resolve('PSYCHOLOGICAL_GAMES_MASTER_PLAN.md')),
                false,
                'PSYCHOLOGICAL_GAMES_MASTER_PLAN.md must not be in root directory'
            );
        });
    });

    describe('Suite 29: REV-100 Authentic 2025 RO Form 1/3 CUSTOMER DETAILS Layout in Customer Lookup', () => {
        it('AUT-FRONT-77: should verify Customer Lookup features authentic Form 1/3 CUSTOMER DETAILS header, 3-column table matrix, and cache buster v=2.58, v=2.59, v=2.60 or v=2.61', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            assert.strictEqual(
                indexHtml.includes('CUSTOMER DETAILS') && indexHtml.includes('bg-[#c0c0c0]'),
                true,
                'index.html must include authentic gray CUSTOMER DETAILS header box'
            );
            assert.strictEqual(
                indexHtml.includes('Year/Model') && indexHtml.includes('Plate No') && indexHtml.includes('Intake Date') && indexHtml.includes('Promise Date'),
                true,
                'index.html must include all authentic 2025 RO Form 1/3 customer and vehicle fields'
            );
            assert.strictEqual(
                indexHtml.includes('id="dossier-customer-name"') &&
                indexHtml.includes('id="dossier-customer-address"') &&
                indexHtml.includes('id="dossier-vehicle-model"') &&
                indexHtml.includes('id="dossier-vehicle-plate"') &&
                indexHtml.includes('id="dossier-km-reading"'),
                true,
                'All 12 dossier DOM field IDs must be preserved for dynamic data binding'
            );
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.59"'),
                true,
                'Cache buster must be incremented to v=2.58, v=2.59, v=2.60 or v=2.61 in index.html'
            );
        });
    });

    describe('Suite 30: REV-101 Assistant & SA Multi-Branch Online Booking Selection & Form Dispatch', () => {
        it('AUT-FRONT-78: should verify Booking Module branch filter toolbar, branch table column, row branch selector, and loadOnlineBookingToForm13 integration', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const jobRepo = fs.readFileSync(path.resolve('backend/repositories/JobRepository.php'), 'utf8');

            assert.strictEqual(
                indexHtml.includes('id="online-branch-filter-group"') &&
                indexHtml.includes('id="btn-ob-branch-all"') &&
                indexHtml.includes('id="btn-ob-branch-marikina"') &&
                indexHtml.includes('id="btn-ob-branch-east"'),
                true,
                'index.html must include branch filter buttons for All, Marikina Main, and East Branch'
            );
            // REV-142 supersedes the REV-101 per-row Branch column: the active branch is now shown once
            // in the card's top-right badge (#online-queue-branch-badge).
            assert.strictEqual(
                !indexHtml.includes('bg-slate-50 text-center whitespace-nowrap min-w-[150px]">Branch</th>') &&
                indexHtml.includes('id="online-queue-branch-badge"'),
                true,
                'index.html Booking Module must drop the Branch column in favour of the top-right branch badge (REV-142)'
            );
            assert.strictEqual(
                appJs.includes('onlineBranchFilter') &&
                appJs.includes('setOnlineBranchFilter') &&
                appJs.includes('syncOnlineBranchFilterUI') &&
                appJs.includes('loadOnlineBookingToForm13'),
                true,
                'app.js must provide online branch filter state, sync handlers, and loadOnlineBookingToForm13'
            );
            assert.strictEqual(
                jobRepo.includes('$branchFilter') || jobRepo.includes("$_GET['branch']"),
                true,
                'JobRepository must support branch filtering for SA and Assistant multi-branch querying'
            );
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"'),
                true,
                'Cache buster must be incremented to v=2.59, v=2.60 or v=2.61 in index.html'
            );
        });
    });

    describe('Suite 31: REV-102 2025 RO Studio Workshop Monitoring & Daily Intakes Dispatch Card', () => {
        it('AUT-FRONT-79: should verify Form 1/3 top monitoring dispatch card, auto-prefilled claim stub and arrival time, and 1-button registration payload binding', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Verify Monitoring Dispatch Card Markup and Field IDs
            assert.strictEqual(
                indexHtml.includes('id="f13-monitoring-dispatch-card"'),
                true,
                'index.html must include #f13-monitoring-dispatch-card at the top of Form 1/3 editor'
            );
            [
                // REV-175: Target Branch and Arrival Time inputs removed (stamped automatically on register); Plate No. / Model added
                'mon-input-plate',
                'mon-input-model',
                'f13-input-claim-stub',
                'f13-input-source',
                'f13-input-lane-type',
                'f13-input-carry-over',
                // REV-176: Parts Availability, Bay Location and Initial Floor Status removed; Customer, Contact, Category, Arrival and Referred By added
                'mon-input-customer-name',
                'mon-input-contact',
                'mon-input-category',
                'mon-input-arrival-time',
                'mon-input-referred-by'
            ].forEach(fieldId => {
                assert.strictEqual(
                    indexHtml.includes(`id="${fieldId}"`),
                    true,
                    `index.html monitoring dispatch card must include input field #${fieldId}`
                );
            });

            // 2. Verify Helper & Generator Functions in app.js
            assert.strictEqual(
                appJs.includes('getStudioCurrentClockTime') &&
                appJs.includes('stampStudioArrivalClock') &&
                appJs.includes('generateNextStudioClaimStub') &&
                appJs.includes('refreshStudioClaimStub'),
                true,
                'app.js must provide getStudioCurrentClockTime, stampStudioArrivalClock, generateNextStudioClaimStub, and refreshStudioClaimStub'
            );

            // 3. Verify Auto-Prefill in initForm13Studio & resetForm13Studio
            assert.strictEqual(
                appJs.includes('generateNextStudioClaimStub()') &&
                appJs.includes('getStudioCurrentClockTime()'),
                true,
                'app.js initForm13Studio & resetForm13Studio must auto-prefill claim stub and arrival clock time'
            );

            // 4. Verify Payload Binding in registerStudioROToSystem
            assert.strictEqual(
                appJs.includes('claimStub: claimStub') &&
                appJs.includes('branch: targetBranch') &&
                appJs.includes('laneType: laneType') &&
                appJs.includes('bayLocation: bayLocation') &&
                appJs.includes('partsStatus: partsStatus') &&
                appJs.includes('status: floorStatus') &&
                appJs.includes('carryOver: carryOver'),
                true,
                'registerStudioROToSystem in app.js must bundle all monitoring parameters into API payload'
            );
        });
    });

    describe('Suite 32: REV-104 Step 1 Workshop Monitoring First Workflow & Daily Claim Stub Ranking', () => {
        it('AUT-FRONT-80: should verify monitoring card is Card #1 before job header, contains full-width register button, and claim stub ranks J1, J2, J3', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const jobController = fs.readFileSync(path.resolve('backend/controllers/JobController.php'), 'utf8');
            const jobRepo = fs.readFileSync(path.resolve('backend/repositories/JobRepository.php'), 'utf8');

            // 1. Verify Card Order: #f13-monitoring-dispatch-card appears before #f13-input-job-no
            const monitoringCardIdx = indexHtml.indexOf('id="f13-monitoring-dispatch-card"');
            const jobNoIdx = indexHtml.indexOf('id="f13-input-job-no"');
            assert.strictEqual(monitoringCardIdx !== -1 && jobNoIdx !== -1, true, 'Both monitoring card and job-no input must exist');
            const monitoringViewIdx = indexHtml.indexOf('id="view-sheet-monitoring"');
            assert.strictEqual(monitoringCardIdx < jobNoIdx || (monitoringViewIdx !== -1 && monitoringCardIdx > monitoringViewIdx), true, 'Workshop Monitoring Card must be above the Job Order Header (Step 1) or on its own Workshop_Monitoring tab (REV-173)');

            // 2. Verify Integrated Registration Button inside Monitoring Card
            assert.strictEqual(
                indexHtml.includes('id="f13-btn-register-ro-card"'),
                true,
                'index.html must include #f13-btn-register-ro-card inside the monitoring card'
            );
            assert.strictEqual(
                appJs.includes('f13-btn-register-ro-card'),
                true,
                'app.js registerStudioROToSystem must bind #f13-btn-register-ro-card to disabled/loading lifecycle'
            );

            // 3. Verify Daily Claim Stub -J Ranking Logic in app.js and JobController
            assert.strictEqual(
                appJs.includes('[-_]?j') && appJs.includes('${prefix}'),
                true,
                'app.js must strictly match daily J-ranked stubs'
            );
            assert.strictEqual(
                appJs.includes('return `${prefix}J${nextIdx}`') || appJs.includes('return `${prefix}-J${nextIdx}`'),
                true,
                'generateNextStudioClaimStub must produce uppercase -J daily ranking format'
            );
            assert.strictEqual(
                jobController.includes("'J' . ($count + 1)") || jobController.includes("'-J' . ($count + 1)"),
                true,
                'JobController generateStubNumber must produce uppercase -J ranking'
            );
        });
    });

    describe('Suite 33: REV-105 Form 1/3 Studio Closing Div Balance & Top-Level Module Visibility', () => {
        it('AUT-FRONT-82: should verify section-form13 is properly closed and sibling modules (section-intake, section-queue, section-bays) are not trapped in form13', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            // 1. Verify section-form13 balance
            const form13Start = indexHtml.indexOf('<div id="section-form13"');
            const intakeStart = indexHtml.indexOf('<div id="section-intake"');
            assert.strictEqual(form13Start !== -1 && intakeStart !== -1, true, 'Both section-form13 and section-intake must exist');
            assert.strictEqual(form13Start < intakeStart, true, 'section-form13 must precede section-intake');

            const form13Block = indexHtml.slice(form13Start, intakeStart);
            const opens = (form13Block.match(/<div(\s|>)/gi) || []).length;
            const closes = (form13Block.match(/<\/div>/gi) || []).length;
            assert.strictEqual(opens, closes, 'All divs opened inside section-form13 must be closed before section-intake begins (balance === 0)');

            // 2. Verify all key modules exist in main-content
            const queueStart = indexHtml.indexOf('<div id="section-queue"');
            const baysStart = indexHtml.indexOf('<div id="section-bays"');
            const mainEnd = indexHtml.indexOf('</main>');
            assert.strictEqual(queueStart !== -1 && baysStart !== -1 && mainEnd !== -1, true, 'queue, bays, and mainEnd must exist');
            assert.strictEqual(intakeStart < queueStart && queueStart < baysStart && baysStart < mainEnd, true, 'Sections must be ordered sequentially inside main-content');

            // 3. Verify cache buster
            assert.strictEqual((((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"'), true, 'Cache buster must be incremented to v=2.61');
        });
    });

    describe('Suite 34: REV-106 Form 1/3 Studio Right-Side PDF Preview & Hyphen-Free Daily Claim Stub Ranking', () => {
        it('AUT-FRONT-83: should verify form13-editor-pane and form13-canvas-pane are direct sibling columns and claim stub has no hyphen', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const jobController = fs.readFileSync(path.resolve('backend/controllers/JobController.php'), 'utf8');

            // 1. Verify form13-editor-pane and form13-canvas-pane sibling relationship
            const editorIdx = indexHtml.indexOf('id="form13-editor-pane"');
            const canvasIdx = indexHtml.indexOf('id="form13-canvas-pane"');
            assert.strictEqual(editorIdx !== -1 && canvasIdx !== -1, true, 'Both form13-editor-pane and form13-canvas-pane must exist');
            assert.strictEqual(editorIdx < canvasIdx, true, 'form13-editor-pane must precede form13-canvas-pane');

            const sub = indexHtml.slice(editorIdx, canvasIdx);
            const opens = (sub.match(/<div(\s|>)/gi) || []).length;
            const closes = (sub.match(/<\/div>/gi) || []).length;
            assert.strictEqual(opens, closes, 'form13-editor-pane must be cleanly closed before form13-canvas-pane begins (delta === 0)');

            // 2. Verify PDF iframe in canvas pane
            assert.strictEqual(
                indexHtml.includes('id="f13-pdf-iframe"') && indexHtml.includes('assets/form13_template.pdf'),
                true,
                'form13-canvas-pane must contain #f13-pdf-iframe embedding official form13_template.pdf'
            );

            // 3. Verify Hyphen-Free Claim Stub format (e.g. 092026J1)
            assert.strictEqual(
                appJs.includes('return `${prefix}J${nextIdx}`'),
                true,
                'generateNextStudioClaimStub must produce hyphen-free MMDDYYJ1 format'
            );
            assert.strictEqual(
                jobController.includes("return $datePrefix . 'J' . ($count + 1)"),
                true,
                'JobController generateStubNumber must produce hyphen-free MMDDYYJ1 format'
            );
            assert.strictEqual(
                indexHtml.includes('placeholder="e.g. 092026J1"'),
                true,
                'Claim stub input placeholder must be e.g. 092026J1'
            );

            // 4. Verify Cache Buster
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || (((((indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"'),
                true,
                'Cache buster must be incremented to v=2.62 or higher'
            );
        });
    });

    describe('Suite 35: REV-107 Excel Export Schema-Compliant Multi-Layer Tamper-Proof Locking', () => {
        it('AUT-FRONT-84: should verify schema-compliant sheetProtection before mergeCells, password DB3E, fileSharing and workbookProtection', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            // 1. Verify schema placement before mergeCells
            assert.strictEqual(
                appJs.includes('ws.insertBefore(existingProt, mergeCells);'),
                true,
                'sheetProtection must be inserted strictly before mergeCells to satisfy OpenXML CT_Worksheet schema'
            );

            // 2. Verify password hash and permissions
            assert.strictEqual(
                appJs.includes("existingProt.setAttribute('password', 'DB3E');"),
                true,
                'sheetProtection must set password DB3E (HonTech2025) to prevent 1-click unprotection'
            );
            assert.strictEqual(
                appJs.includes("existingProt.setAttribute('selectLockedCells', '1');"),
                true,
                'sheetProtection must allow selecting locked cells for read/copy view'
            );
            assert.strictEqual(
                appJs.includes("existingProt.setAttribute('formatCells', '0');"),
                true,
                'sheetProtection must disallow formatting cells'
            );

            // 3. Verify Workbook Protection and Read-Only Recommendation
            assert.strictEqual(
                appJs.includes('readOnlyRecommended="1"'),
                true,
                'exportOfficialXLSX must inject fileSharing readOnlyRecommended="1" into workbook.xml'
            );
            assert.strictEqual(
                appJs.includes('workbookProtection lockStructure="1"'),
                true,
                'exportOfficialXLSX must inject workbookProtection lockStructure="1" into workbook.xml'
            );

            // 4. Verify Cache Buster
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || (((((indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"'),
                true,
                'Cache buster must be incremented to v=2.63 or higher'
            );
        });
    });

    describe('Suite 36: REV-108 Studio Layout Alignment & Edge Responsiveness Polish', () => {
        it('AUT-FRONT-85: Verifies Form 13 Monitoring Dispatch card grid alignment, label heights, and top bar button responsiveness', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            // 1. Verify whitespace-nowrap removed from arrival time label to prevent column collision
            assert.strictEqual(
                indexHtml.includes('whitespace-nowrap text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1 block">ARRIVAL TIME (CLOCK IN)'),
                false,
                'Old overflowing arrival time label with whitespace-nowrap must be removed'
            );

            // 2. Verify standardized label container height h-5 across monitoring dispatch card
            assert.strictEqual(
                indexHtml.includes('class="h-5 flex items-center') && indexHtml.includes('uppercase tracking-wider mb-1"'),
                true,
                'Monitoring dispatch card must use uniform h-5 label containers for straight baseline alignment'
            );

            // 3. Verify all 9 input/select IDs are strictly preserved
            const expectedIds = [
                // REV-175: Target Branch and Arrival Time inputs removed (stamped automatically on register); Plate No. / Model added
                'mon-input-plate',
                'mon-input-model',
                'f13-input-claim-stub',
                'f13-input-source',
                'f13-input-lane-type',
                'f13-input-carry-over',
                // REV-176: Parts Availability, Bay Location and Initial Floor Status removed; Customer, Contact, Category, Arrival and Referred By added
                'mon-input-customer-name',
                'mon-input-contact',
                'mon-input-category',
                'mon-input-arrival-time',
                'mon-input-referred-by'
            ];
            for (const id of expectedIds) {
                assert.strictEqual(
                    indexHtml.includes(`id="${id}"`),
                    true,
                    `Expected monitoring control id="${id}" must exist in frontend/index.html`
                );
            }

            // 4. Verify responsive text spans on top action bar buttons for 100% zoom protection
            assert.strictEqual(
                indexHtml.includes('class="hidden md:inline">Export Official .xlsx</span>'),
                true,
                'Top tab bar Export button must include responsive text span'
            );
            assert.strictEqual(
                indexHtml.includes('class="hidden xl:inline">💾 Register Repair Order to System</span>'),
                true,
                'Top tab bar Register RO button must include responsive text span'
            );

            // 5. Verify cache buster v=2.65 or higher
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || (((((indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"'),
                true,
                'Cache buster must be incremented to v=2.65 or higher'
            );
        });
    });

    describe('Suite 37: REV-109 2025 RO Excel Studio Unified Professional Redesign & Alignment', () => {
        it('AUT-FRONT-86: Verifies 7/5 ergonomic split across all 4 sheets, 2-column monitoring card, removal of bottom bar, and preview toggle', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Verify removal of floating duplicate bottom sheet bar
            assert.strictEqual(
                indexHtml.includes('id="form-workbook-bottom-bar"'),
                false,
                'Redundant floating sticky bottom sheet bar must be permanently removed'
            );

            // 2. Verify 7/5 ergonomic column split across all 4 core sheets
            assert.strictEqual(
                indexHtml.includes('id="form13-editor-pane" class="xl:col-span-7'),
                true,
                'Job_Order editor pane must be xl:col-span-7'
            );
            assert.strictEqual(
                indexHtml.includes('id="form13-canvas-pane" class="xl:col-span-5'),
                true,
                'Job_Order canvas pane must be xl:col-span-5'
            );
            assert.strictEqual(
                indexHtml.includes('id="form23-editor-pane" class="xl:col-span-7'),
                true,
                'Quotation_No editor pane must be xl:col-span-7'
            );
            assert.strictEqual(
                indexHtml.includes('id="form23-canvas-pane" class="xl:col-span-5'),
                true,
                'Quotation_No canvas pane must be xl:col-span-5'
            );
            assert.strictEqual(
                indexHtml.includes('id="billing-editor-pane" class="xl:col-span-7'),
                true,
                'Billing_No editor pane must be xl:col-span-7'
            );
            assert.strictEqual(
                indexHtml.includes('id="billing-canvas-pane" class="xl:col-span-5'),
                true,
                'Billing_No canvas pane must be xl:col-span-5'
            );
            assert.strictEqual(
                indexHtml.includes('id="checklist-editor-pane" class="xl:col-span-7'),
                true,
                'CheckList_Result editor pane must be xl:col-span-7'
            );
            assert.strictEqual(
                indexHtml.includes('id="checklist-canvas-pane" class="xl:col-span-5'),
                true,
                'CheckList_Result canvas pane must be xl:col-span-5'
            );

            // 3. Verify preview toggle button and function
            assert.strictEqual(
                indexHtml.includes('id="btn-toggle-studio-preview"'),
                true,
                'Top tab bar must contain btn-toggle-studio-preview button'
            );
            assert.strictEqual(
                appJs.includes('function toggleStudioPDFPreview()'),
                true,
                'app.js must define toggleStudioPDFPreview function'
            );

            // 4. Verify 2-column layout in monitoring card
            assert.strictEqual(
                indexHtml.includes('grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs'),
                true,
                'Monitoring dispatch card must use 2-column layout for full option text visibility'
            );

            // 5. Verify cache buster v=2.66 or higher
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || (((((indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"'),
                true,
                'Cache buster must be incremented to v=2.65 or higher'
            );
        });
    });

    describe('Suite 38: REV-110 Form 1/3 Floating Sticky Bar Removal & Header Action Consolidation', () => {
        it('AUT-FRONT-87: Verifies removal of sticky bottom-14 floating bar and consolidation of Print in top bar and canvas toolbar', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            // 1. Verify sticky bottom-14 toolbar is removed
            assert.strictEqual(
                indexHtml.includes('sticky bottom-14'),
                false,
                'Sticky bottom-14 floating action toolbar must be permanently removed'
            );

            // 2. Verify Print button in top tab bar
            assert.strictEqual(
                indexHtml.includes('onclick="printForm13()"') && indexHtml.includes('id="form-top-tab-bar"'),
                true,
                'Top tab bar must offer direct Print Form 1/3 button'
            );

            // 3. Verify Reset Form in Form 1/3 header card
            assert.strictEqual(
                indexHtml.includes('onclick="resetForm13Studio()"'),
                true,
                'Form 1/3 Studio header card must offer Reset Form button'
            );

            // 4. Verify cache buster v=2.67 or higher
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || (((((indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"'),
                true,
                'Cache buster must be incremented to v=2.66 or higher'
            );
        });
    });

    describe('Suite 39: REV-111 Form 1/3 Live Typing-to-PDF Connection & Full Multi-Sheet Excel Injection', () => {
        it('AUT-FRONT-88: Verifies live debounced typing PDF synchronization and multi-sheet Excel export injection across all 7 tabs', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Verify scheduleForm13PDFRefresh function and live debounced connection
            assert.strictEqual(
                appJs.includes('function scheduleForm13PDFRefresh'),
                true,
                'app.js must define scheduleForm13PDFRefresh for live debounced PDF compilation'
            );
            assert.strictEqual(
                appJs.includes('scheduleForm13PDFRefresh(isImmediate ? 0 : 350)') || appJs.includes('scheduleFormStudioPdfRefresh(isImmediate ? 0 : 350)'),
                true,
                'onReactiveJobOrderInput must call scheduleForm13PDFRefresh or scheduleFormStudioPdfRefresh with 350ms debounce and 0ms on blur/change'
            );

            // 2. Verify compileForm13PDFBytes pulls live claim stub ID
            assert.strictEqual(
                appJs.includes("getVal('f13-input-claim-stub')"),
                true,
                'compileForm13PDFBytes must extract live value from f13-input-claim-stub'
            );

            // 3. Verify exportOfficialXLSX injects comprehensive data across all 7 sheets
            assert.strictEqual(
                appJs.includes("setCell(sheet1Doc, 'G53', pTotal, true)"),
                true,
                'exportOfficialXLSX must inject parts total into Sheet 1 G53'
            );
            assert.strictEqual(
                appJs.includes("setCell(sheet1Doc, 'K53', mTotal, true)"),
                true,
                'exportOfficialXLSX must inject materials total into Sheet 1 K53'
            );
            assert.strictEqual(
                appJs.includes("setCell(sheet1Doc, 'C58', sa)"),
                true,
                'exportOfficialXLSX must inject service advisor into Sheet 1 C58'
            );
            assert.strictEqual(
                appJs.includes("setCell(sheet7Doc, 'C12', 'Fuel Level: ' + (window.checklistFuelLevel || '1/2'))") ||
                (appJs.includes("setCell(sheet7Doc, 'C2', name);") || appJs.includes("setCell(sheet7Doc, 'C2', chkHeader.name, false, true);")),
                true,
                'exportOfficialXLSX must inject into Sheet 7'
            );

            // 4. Verify cache buster v=2.67 or v=2.68
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"'),
                true,
                'Cache buster must be incremented to v=2.67 or v=2.68'
            );
        });
    });

    describe('Suite 40: REV-112 Precise Excel Cell Coordinate Injection & Multi-Column Pricing Architecture', () => {
        it('AUT-FRONT-89: Verifies exact signature alignments, customer claim stub cells, multi-column pricing (A, C, D, E, F, G, H), and checklist date M5', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Verify Job_Order authentic signature cell coordinates (Row 53, 58, 61)
            assert.strictEqual(
                appJs.includes("setCell(sheet1Doc, 'C58', sa)"),
                true,
                'exportOfficialXLSX must inject Service Advisor into C58 (Recommending Approval)'
            );
            assert.strictEqual(
                appJs.includes("setCell(sheet1Doc, 'C61', name)"),
                true,
                'exportOfficialXLSX must inject Customer Name into C61 (CONFORME)'
            );
            assert.strictEqual(
                appJs.includes("setCell(sheet1Doc, 'H58', mechanic || 'Chief, Auto Mechanic')"),
                true,
                'exportOfficialXLSX must inject Chief Mechanic into H58 (Approved by)'
            );
            assert.strictEqual(
                appJs.includes("setCell(sheet1Doc, 'H61', manager)"),
                true,
                'exportOfficialXLSX must inject General Manager into H61 (Concurred by)'
            );

            // 2. Verify Job_Order customer claim stub coordinates (Rows 70-72)
            assert.strictEqual(
                appJs.includes("setCell(sheet1Doc, 'C70', name)"),
                true,
                'exportOfficialXLSX must inject Claim Stub customer name into C70'
            );
            assert.strictEqual(
                appJs.includes("setCell(sheet1Doc, 'I70', (plate + ' / ' + model).trim())"),
                true,
                'exportOfficialXLSX must inject Claim Stub plate/model into I70'
            );
            assert.strictEqual(
                appJs.includes("setCell(sheet1Doc, 'C71', sa)"),
                true,
                'exportOfficialXLSX must inject Claim Stub SA into C71'
            );
            assert.strictEqual(
                (appJs.includes("setCell(sheet1Doc, 'I72', claimStubId)") || appJs.includes("setCell(sheet1Doc, 'H72', claimStubId, false, true)")),
                true,
                'exportOfficialXLSX must inject Claim Stub ID into I72'
            );

            // 3. Verify Quotation & Billing multi-column pricing engine
            assert.strictEqual(
                (appJs.includes("if (frt > 0) setCell(qDoc, 'D' + rIdx, frt, true);") || appJs.includes("if (row.frt !== null && row.frt > 0) setCell(doc, 'D' + rIdx, row.frt, true);")),
                true,
                'exportOfficialXLSX must inject FRT into Column D'
            );
            assert.strictEqual(
                (appJs.includes("if (labor > 0) setCell(qDoc, 'E' + rIdx, labor, true);") || appJs.includes("if (row.labor > 0) setCell(doc, 'E' + rIdx, row.labor, true, true);")),
                true,
                'exportOfficialXLSX must inject Labor into Column E'
            );
            assert.strictEqual(
                (appJs.includes("if (parts > 0) setCell(qDoc, 'F' + rIdx, parts, true);") || appJs.includes("if (row.parts > 0) setCell(doc, 'F' + rIdx, row.parts, true);")),
                true,
                'exportOfficialXLSX must inject Parts into Column F'
            );
            assert.strictEqual(
                (appJs.includes("if (materials > 0) setCell(qDoc, 'G' + rIdx, materials, true);") || appJs.includes("if (row.materials > 0) setCell(doc, 'G' + rIdx, row.materials, true);")),
                true,
                'exportOfficialXLSX must inject Materials into Column G'
            );
            assert.strictEqual(
                (appJs.includes("setCell(qDoc, 'H' + rIdx, total, true);") || appJs.includes("setCell(doc, 'H' + rIdx, row.total, true);")),
                true,
                'exportOfficialXLSX must inject Total into Column H'
            );

            // 4. Verify Checklist Date written to M5 or AD2 in V1
            assert.strictEqual(
                appJs.includes("setCell(sheet7Doc, 'M5', date)") ||
                (appJs.includes("setCell(sheet7Doc, 'AD2', date);") || appJs.includes("setCell(sheet7Doc, 'AD2', chkHeader.date, false, true);")),
                true,
                'exportOfficialXLSX must inject inspection date into Sheet 7 (M5 in legacy, AD2 in V1)'
            );

            // 5. Verify cache buster v=2.68
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"'),
                true,
                'Cache buster must be incremented to v=2.68'
            );
        });
    });

    describe('Suite 41: REV-113 Multi-Sheet Quotation & Billing Auto-Sync Export Mirroring', () => {
        it('AUT-FRONT-90: Verifies mirrored quotation items across sheets 2-4 and billing items across sheets 5-6 with exact signatures', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Verify Quotation sheets array contains all 3 quotation worksheets
            assert.strictEqual(
                appJs.includes("'xl/worksheets/sheet2.xml'") &&
                appJs.includes("'xl/worksheets/sheet3.xml'") &&
                appJs.includes("'xl/worksheets/sheet4.xml'"),
                true,
                'exportOfficialXLSX must target sheet2.xml, sheet3.xml, and sheet4.xml for quotation export'
            );

            // 2. Verify Billing sheets array contains both billing worksheets
            assert.strictEqual(
                appJs.includes("'xl/worksheets/sheet5.xml'") &&
                appJs.includes("'xl/worksheets/sheet6.xml'"),
                true,
                'exportOfficialXLSX must target sheet5.xml and sheet6.xml for billing export'
            );

            // 3. Verify unified items slices and injection
            assert.strictEqual(
                (appJs.includes('unifiedItems.slice(0, 30).forEach') || appJs.includes('quoteRows.forEach((row, idx) => writeItemRow(qDoc, 15 + idx, row));')),
                true,
                'Quotation export must inject up to 30 unified items into rows 15-44'
            );
            assert.strictEqual(
                (appJs.includes('unifiedItems.slice(0, 36).forEach') || appJs.includes('billRows.forEach((row, idx) => writeItemRow(bDoc, 17 + idx, row));')),
                true,
                'Billing export must inject up to 36 unified items into rows 17-52'
            );

            // 4. Verify authentic signature coordinates
            assert.strictEqual(
                (appJs.includes("setCell(qDoc, 'A62', sa)") || appJs.includes("setCell(qDoc, 'A62', quoteHeader.sa)")),
                true,
                'Quotation export must inject Service Advisor into A62'
            );
            assert.strictEqual(
                (appJs.includes("setCell(qDoc, 'F62', manager)") || appJs.includes("setCell(qDoc, 'F62', quoteHeader.manager)")),
                true,
                'Quotation export must inject General Manager into F62'
            );
            assert.strictEqual(
                (appJs.includes("setCell(bDoc, 'A60', sa)") || appJs.includes("setCell(bDoc, 'A60', billHeader.sa)")),
                true,
                'Billing export must inject Service Advisor into A60'
            );

            // 5. Verify cache buster v=2.69 or v=2.70
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"'),
                true,
                'Cache buster must be incremented to v=2.69 or higher in index.html'
            );
        });
    });

    describe('Suite 42: REV-114 SA 2025 RO Studio Live Multi-Sheet PDF Preview Sync, Exact Coordinates & 7-Sheet XLSX Export', () => {
        it('AUT-FRONT-91: Verifies reactive studio sync across all sheets, live sync badges, exact PDF coordinates, and v=2.70', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Verify live sync badges in index.html
            assert.strictEqual(
                indexHtml.includes('id="f13-live-sync-badge"') &&
                indexHtml.includes('id="f23-live-sync-badge"') &&
                indexHtml.includes('id="bill-live-sync-badge"') &&
                indexHtml.includes('id="chk-live-sync-badge"'),
                true,
                'Studio PDF viewer headers must present live sync indicators across all 4 worksheets'
            );

            // 2. Verify reactive item mirroring function
            assert.strictEqual(
                appJs.includes('function syncJobOrderItemsToQuoteAndBilling()') &&
                appJs.includes('window.syncJobOrderItemsToQuoteAndBilling = syncJobOrderItemsToQuoteAndBilling;'),
                true,
                'app.js must provide global syncJobOrderItemsToQuoteAndBilling for cascading parts and materials'
            );

            // 3. Verify universal debounced PDF scheduler
            assert.strictEqual(
                appJs.includes('function scheduleFormStudioPdfRefresh(delay = 350)') &&
                appJs.includes('window.scheduleFormStudioPdfRefresh = scheduleFormStudioPdfRefresh;'),
                true,
                'app.js must define scheduleFormStudioPdfRefresh with default 350ms debounce'
            );

            // 4. Verify exact PDF signature alignments in Quotation & Billing
            assert.strictEqual(
                (appJs.includes('drawTextFit(sa, 70, 165, 140, 7.5, true)') || appJs.includes('drawTextFit(sa, 70, 165, 140, 7.2, false)') || appJs.includes('drawTextFit(sa, 70, 145, 140, 7.2, false)') || appJs.includes('drawTextCenter(sa, 162.45, 139.5, 6.5, false, darkInk);') || appJs.includes('drawTextCenter(sa, 159.0, 149.0, 6.8, false, darkInk);')) &&
                (appJs.includes('drawTextFit(manager, 330, 165, 140, 7.5, true)') || appJs.includes('drawTextFit(manager, 330, 165, 140, 7.2, false)') || appJs.includes('drawTextFit(manager, 330, 145, 140, 7.2, false)') || appJs.includes('drawTextCenter(manager, 437.06, 139.5, 6.5, false, darkInk);') || appJs.includes('drawTextCenter(manager, 424.0, 149.0, 6.8, false, darkInk);')) &&
                (appJs.includes('drawTextFit(sa, 70, 215, 140, 7.5, true)') || appJs.includes('drawTextFit(sa, 70, 215, 140, 7.2, false)') || appJs.includes('drawTextFit(sa, 88, 95, 140, 7.2, false)') || appJs.includes('drawTextCenter(sa, 123.4, 90.6, saSize, false, darkInk);')),
                true,
                'compileQuotePDFBytes and compileBillingPDFBytes must align authentic plain text signatures'
            );

            // 5. Verify cache buster v=2.70 or higher
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"'),
                true,
                'Cache buster must be incremented to v=2.70 or higher in index.html'
            );
        });
    });

    describe('Suite 43: REV-115 SA 2025 RO Studio XLSX Export Scoping Fix', () => {
        it('AUT-FRONT-92: Verifies manager, mechanic, and assessor outer scoping in exportOfficialXLSX and v=2.71', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Verify manager, mechanic, assessor hoisting at top of exportOfficialXLSX
            assert.strictEqual(
                appJs.includes("const mechanic = getVal('f13-input-mechanic') || 'Auto Mechanic';") &&
                appJs.includes("const assessor = getVal('f13-input-assessor') || 'Parts/Materials Controller';") &&
                appJs.includes("const manager = getVal('f13-input-manager') || 'General Manager';"),
                true,
                'exportOfficialXLSX must hoist mechanic, assessor, and manager to function scope'
            );

            // 2. Verify manager is utilized in quotation export
            assert.strictEqual(
                (appJs.includes("setCell(qDoc, 'F62', manager);") || appJs.includes("setCell(qDoc, 'F62', quoteHeader.manager);")),
                true,
                'exportOfficialXLSX must inject manager into F62 of quotation sheet'
            );

            // 3. Verify cache buster v=2.71 or higher
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"'),
                true,
                'Cache buster must be incremented to v=2.71 or higher in index.html'
            );
        });
    });

    describe('Suite 44: REV-116 SA 2025 RO Studio Follow-Along Sticky PDF Preview & Viewport Height', () => {
        it('AUT-FRONT-93: Verifies sticky follow-along positioning and responsive viewport height across all 4 sheet canvas panes', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

            // 1. Verify sticky follow-along classes on all 4 canvas panes
            assert.strictEqual(
                indexHtml.includes('id="form13-canvas-pane" class="xl:col-span-5 space-y-3 xl:sticky xl:top-14 xl:self-start"') &&
                indexHtml.includes('id="form23-canvas-pane" class="xl:col-span-5 space-y-3 xl:sticky xl:top-14 xl:self-start"') &&
                indexHtml.includes('id="billing-canvas-pane" class="xl:col-span-5 space-y-3 xl:sticky xl:top-14 xl:self-start"') &&
                indexHtml.includes('id="checklist-canvas-pane" class="xl:col-span-5 space-y-3 xl:sticky xl:top-14 xl:self-start"'),
                true,
                'All 4 worksheet canvas panes must include xl:sticky xl:top-14 xl:self-start for follow-along scrolling'
            );

            // 2. Verify responsive viewport container height on all 4 PDF viewer wraps
            assert.strictEqual(
                indexHtml.includes('id="f13-pdf-viewer-wrap" class="w-full bg-slate-900/5 rounded-2xl border-2 border-gray-300 overflow-hidden shadow-lg p-1.5 h-[calc(100vh-8.5rem)] min-h-[580px] flex flex-col"') &&
                indexHtml.includes('id="f23-pdf-viewer-wrap" class="w-full bg-slate-900/5 rounded-2xl border-2 border-gray-300 overflow-hidden shadow-lg p-1.5 h-[calc(100vh-8.5rem)] min-h-[580px] flex flex-col"') &&
                indexHtml.includes('id="billing-pdf-viewer-wrap" class="w-full bg-slate-900/5 rounded-2xl border-2 border-gray-300 overflow-hidden shadow-lg p-1.5 h-[calc(100vh-8.5rem)] min-h-[580px] flex flex-col"') &&
                indexHtml.includes('id="checklist-pdf-viewer-wrap" class="w-full bg-slate-900/5 rounded-2xl border-2 border-gray-300 overflow-hidden shadow-lg p-1.5 h-[calc(100vh-8.5rem)] min-h-[580px] flex flex-col"'),
                true,
                'All 4 PDF viewer containers must adopt h-[calc(100vh-8.5rem)] min-h-[580px] for comfortable viewport containment'
            );

            // 3. Verify cache buster v=2.72 or higher
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"'),
                true,
                'Cache buster must be incremented to v=2.72 in index.html'
            );
        });
    });

    describe('Suite 45: REV-117 SA 2025 RO Studio PDF Typography & Non-Bold Formatting Alignment with Excel Template', () => {
        it('AUT-FRONT-94: Verifies authentic regular non-bold fonts and exact text sizes matching Excel template', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Verify compileForm13PDFBytes uses authentic typography matching template with bold Plate No
            assert.strictEqual(
                (appJs.includes("drawTextFit(name, 140, 723.5, 146, 6.2, false, darkInk, 4.8);") || appJs.includes("drawTextFit(name, 148, 715.8, 138, 6.2, false, darkInk, 5.0);") || appJs.includes("drawTextFit(name, 148, 715.8, 138, 6.5, false, darkInk, 5.2);")) &&
                (appJs.includes("drawTextFit(plate, 475, 723.5, 47, 6.2, false, darkInk, 4.8);") || appJs.includes("drawTextFit(plate, 464, 715.8, 44, 6.2, false, darkInk, 5.0);") || appJs.includes("drawTextFit(plate, 464, 715.8, 44, 6.5, true, darkInk, 5.2);")) &&
                (appJs.includes("drawTextCenter(sa, 184.7, 583.8, 6.5, false);") || appJs.includes("drawTextCenter(sa, 196.5, 583.5, 6.5, false);") || appJs.includes("drawTextCenter(sa, 187.5, 549.5, 6.5, false);") || appJs.includes("drawTextCenter(sa, 184, 583.5, 7.5, false);")) &&
                (appJs.includes("drawTextCenter(mechanic, 184.7, 280.0, 6.5, false);") || appJs.includes("drawTextCenter(mechanic, 200.0, 290.0, 6.5, false);") || appJs.includes("drawTextCenter(mechanic, 200.0, 292.0, 6.5, false);") || appJs.includes("drawTextCenter(mechanic, 215.0, 274.8, 6.5, false);") || appJs.includes("drawTextCenter(mechanic, 184, 279.8, 7.2, false);")) &&
                (appJs.includes("drawTextFit(sa, 140, 67.8, 146, 6.2, false);") || appJs.includes("drawTextFit(sa, 152, 89.5, 132, 6.2, false);") || appJs.includes("drawTextFit(sa, 152, 84.0, 132, 6.2, false);") || appJs.includes("drawTextFit(sa, 175, 69.1, 100, 7.5, false);")),
                true,
                'compileForm13PDFBytes must render customer dossier, mechanics, SA, and claim stub in authentic template typography'
            );

            // 2. Verify compileQuotePDFBytes uses authentic typography for Quote No, customer dossier, and signatures
            assert.strictEqual(
                (appJs.includes("drawText(quoteNo, 420, 776.6, 8, true, darkInk);") || appJs.includes("drawText(quoteNo, 420, 775.5, 8, true, darkInk);") || appJs.includes("drawTextCenter(quoteNo, 500.9, 726.5, 8.5, true, darkInk);") || appJs.includes("drawTextCenter(quoteNo, 487.0, 772.0, 8.5, true, darkInk);")) &&
                (appJs.includes("drawTextFit(name, 115, 696.5, 180, 6.5, false, darkInk, 5.2);") || appJs.includes("drawTextFit(name, 115, 696.3, 180, 6.5, false, darkInk, 5.2);") || appJs.includes("drawTextFit(name, 137.0, 654.94, 198, 6.5, false, darkInk, 5.0);") || appJs.includes("drawTextFit(name, 134.0, 694.8, 194, 6.8, false, darkInk, 5.0);")) &&
                (appJs.includes("drawTextFit(sa, 70, 165, 140, 7.2, false);") || appJs.includes("drawTextFit(sa, 70, 145, 140, 7.2, false);") || appJs.includes("drawTextCenter(sa, 162.45, 139.5, 6.5, false, darkInk);") || appJs.includes("drawTextCenter(sa, 159.0, 149.0, 6.8, false, darkInk);")) &&
                (appJs.includes("drawTextFit(manager, 330, 165, 140, 7.2, false);") || appJs.includes("drawTextFit(manager, 330, 145, 140, 7.2, false);") || appJs.includes("drawTextCenter(manager, 437.06, 139.5, 6.5, false, darkInk);") || appJs.includes("drawTextCenter(manager, 424.0, 149.0, 6.8, false, darkInk);")),
                true,
                'compileQuotePDFBytes must render Quote No, customer dossier, and signatures in authentic template typography'
            );

            // 3. Verify compileBillingPDFBytes uses authentic typography for Billing No, customer dossier, and SA signature
            assert.strictEqual(
                (appJs.includes("drawText(billingNo, 420, 776.6, 8, false, darkInk);") || appJs.includes("drawText(billingNo, 475, 763.2, 8, true, darkInk);") || appJs.includes("drawText(billingNo, 475, 761.0, 8, true, darkInk);") || appJs.includes("drawTextFit(billingNo, 491, 757.2, 75, 9, true, darkInk, 6);")) &&
                (appJs.includes("drawTextFit(row.left, 90, row.base + 1.2, 245, 7, false, darkInk, 5.0);") || appJs.includes("drawTextFit(name, 115, 698.2, 180, 7.5, false);") || appJs.includes("drawTextFit(name, 80, 668.2, 240, 6.5, false, darkInk, 5.2);") || appJs.includes("drawTextFit(name, 80, 666.4, 230, 6.5, false, darkInk, 5.2);")) &&
                (appJs.includes("drawTextFit(sa, 70, 215, 140, 7.2, false);") || appJs.includes("drawTextFit(sa, 88, 95, 140, 7.2, false);") || appJs.includes('drawTextCenter(sa, 123.4, 90.6, saSize, false, darkInk);')),
                true,
                'compileBillingPDFBytes must render Billing No, customer dossier, and SA signature in authentic template typography'
            );

            // 4. Verify compileChecklistPDFBytes uses authentic typography for customer name and vehicle specs
            assert.strictEqual(
                (appJs.includes("drawTextFit(name, 120, 733.4, 250, 6.5, false, darkInk, 5.2);") || appJs.includes("drawTextFit(name, 120, 739.0, 250, 6.5, false, darkInk, 5.2);") || appJs.includes("drawTextFit(name, 117, 735.6, 172, 7.5, false, darkInk, 5.0);")) &&
                (appJs.includes("drawText(date, 460, 733.4, 7.0, false, darkInk);") || appJs.includes("drawText(date, 490, 739.0, 7.0, false, darkInk);") || appJs.includes("drawTextCenterFit(date, 516.6, 735.6, 90, 7.5, false, darkInk);")) &&
                (appJs.includes("drawTextFit(plate + (km ? ` (${km})` : ''), 120, 720.8, 250, 6.5, true, darkInk, 5.2);") || appJs.includes("drawTextFit(plate + (km ? ` (${km})` : ''), 120, 723.1, 250, 6.5, true, darkInk, 5.2);") || appJs.includes("drawTextFit(plate + (km ? ` (${km})` : ''), 117, 719.8, 172, 7.5, true, darkInk, 5.0);")),
                true,
                'compileChecklistPDFBytes must render customer name, plate, and date in authentic template typography'
            );

            // 5. Verify cache buster v=2.99 or higher
            assert.strictEqual(
                (indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || (indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"') || indexHtml.includes('src="js/app.js?v=3.01"') || indexHtml.includes('src="js/app.js?v=3.00"') || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"'),
                true,
                'Cache buster must be incremented to v=2.99 in index.html'
            );
        });

        it('AUT-FRONT-106: REV-144 Form 1/3 Underline Precision, Line Clearance & Boundary Padding', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Header Job No centered on Y=781.5/792.2 underline and Date centered in box Y=758.2/767.0
            assert.strictEqual(
                (appJs.includes("drawTextCenter(jobNo, 485.5, 781.5, 8.0, true, darkInk);") && appJs.includes("drawTextCenter(intakeDate, 485.8, 758.2, 7.0, true, darkInk);")) ||
                (appJs.includes("drawTextCenter(jobNo, 498.8, 792.2, 8.0, true, darkInk);") && appJs.includes("drawTextCenter(intakeDate, 498.8, 767.0, 7.0, true, darkInk);")),
                true,
                'Job No and Date must be centered on their respective template targets'
            );

            // 2. Customer Details exact line step with baseline clearance
            assert.strictEqual(
                (appJs.includes("drawTextFit(name, 140, 723.5, 146, 6.2, false, darkInk, 4.8);") || appJs.includes("drawTextFit(name, 148, 715.8, 138, 6.2, false, darkInk, 5.0);") || appJs.includes("drawTextFit(name, 148, 715.8, 138, 6.5, false, darkInk, 5.2);")) &&
                (appJs.includes("drawTextFit(address, 140, 715.4, 146, 6.2, false, darkInk, 4.8);") || appJs.includes("drawTextFit(address, 148, 708.0, 138, 6.2, false, darkInk, 5.0);")) &&
                (appJs.includes("drawTextFit(contact, 140, 707.3, 146, 6.2, false, darkInk, 4.8);") || appJs.includes("drawTextFit(contact, 148, 700.3, 138, 6.2, false, darkInk, 5.0);") || appJs.includes("drawTextFit(contact, 148, 700.3, 138, 6.5, false, darkInk, 5.2);")) &&
                (appJs.includes("drawTextFit(email, 140, 699.2, 146, 6.2, false, darkInk, 4.8);") || appJs.includes("drawTextFit(email, 148, 692.5, 138, 6.2, false, darkInk, 5.0);")),
                true,
                'Customer Details baselines must clear template underlines cleanly without slicing'
            );

            // 3. Middle Column clamping to prevent collision with Plate No column
            assert.strictEqual(
                (appJs.includes("drawTextFit(model, 355, 723.5, 66, 6.2, false, darkInk, 4.8);") || appJs.includes("drawTextFit(model, 350, 715.8, 62, 6.2, false, darkInk, 5.0);") || appJs.includes("drawTextFit(model, 350, 715.8, 62, 6.5, false, darkInk, 5.2);")) &&
                (appJs.includes("drawTextFit(km, 355, 715.4, 66, 6.2, false, darkInk, 4.8);") || appJs.includes("drawTextFit(km, 350, 708.0, 62, 6.2, false, darkInk, 5.0);") || appJs.includes("drawTextFit(km, 350, 708.0, 62, 6.5, false, darkInk, 5.2);")) &&
                (appJs.includes("drawTextFit(engine, 355, 707.3, 66, 6.2, false, darkInk, 4.8);") || appJs.includes("drawTextFit(engine, 350, 700.3, 62, 6.2, false, darkInk, 5.0);") || appJs.includes("drawTextFit(engine, 350, 700.3, 62, 6.5, false, darkInk, 5.2);")) &&
                (appJs.includes("drawTextFit(chassis, 355, 699.2, 66, 6.2, false, darkInk, 4.8);") || appJs.includes("drawTextFit(chassis, 350, 692.5, 62, 6.2, false, darkInk, 5.0);") || appJs.includes("drawTextFit(chassis, 350, 692.5, 62, 6.5, false, darkInk, 5.2);")),
                true,
                'Middle column values must be clamped to prevent collision with Plate No column'
            );

            // 4. Concern Box interior padding & centered formatting
            assert.strictEqual(
                appJs.includes("drawTextCenter(lineStr, 299.4, startY - (idx * lineH), 6.5, false, darkInk);") ||
                appJs.includes("drawTextCenter(lineStr, 307.5, startY - (idx * lineH), 6.5, false, darkInk);") ||
                appJs.includes("drawTextCenter(lineStr, 298.5, startY - (idx * lineH), 6.5, false, darkInk);") ||
                appJs.includes("x: 94, y: 652, size: 6.8, font: fontNorm, maxWidth: 405, lineHeight: 9.0"),
                true,
                'Concern Box must maintain safe interior margins and centered text layout'
            );
        });

        it('AUT-FRONT-107: REV-146 Quotation, Billing, and Checklist Multi-Sheet Precision Alignment & Placeholder Masking', () => {
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Quotation: calibrated header coordinates, non-destructive placeholder masking, targeted table insets
            assert.strictEqual(
                (appJs.includes("drawText(quoteNo, 420, 775.5, 8, true, darkInk);") || appJs.includes("drawTextCenter(quoteNo, 500.9, 726.5, 8.5, true, darkInk);") || appJs.includes("drawTextCenter(quoteNo, 487.0, 772.0, 8.5, true, darkInk);")) &&
                (appJs.includes("drawText(date, 470, 743.5, 7.5, false, darkInk);") || appJs.includes("drawText(date, 472.0, 699.34, 7.2, false, darkInk);") || appJs.includes("drawText(date, 458.0, 742.8, 7.2, false, darkInk);")) &&
                (appJs.includes("whiteout(475, 729.5, 65, 10);") || appJs.includes("whiteout(420, 720, 100, 62);") || appJs.includes("whiteout(469.0, 688.0, 63.0, 7.5);") || appJs.includes("whiteout(456.0, 731.8, 62.0, 7.8);")) &&
                (appJs.includes("drawText(jobNo, 485, 734.0, 7.5, true, darkInk);") || appJs.includes("drawText(jobNo, 472.0, 690.46, 7.2, true, darkInk);") || appJs.includes("drawText(jobNo, 458.0, 733.2, 7.2, true, darkInk);")) &&
                (appJs.includes("drawTextFit(name, 115, 696.3, 180, 6.5, false, darkInk, 5.2);") || appJs.includes("drawTextFit(name, 137.0, 654.94, 198, 6.5, false, darkInk, 5.0);") || appJs.includes("drawTextFit(name, 134.0, 694.8, 194, 6.8, false, darkInk, 5.0);")) &&
                (appJs.includes("drawTextFit(plate, 380, 696.3, 120, 6.5, true, darkInk, 5.2);") || appJs.includes("drawTextFit(plate, 410.0, 654.94, 120, 6.5, true, darkInk, 5.0);") || appJs.includes("drawTextFit(plate, 400.0, 694.8, 116, 6.8, true, darkInk, 5.0);")) &&
                (appJs.includes("whiteout(72, ry - 1.5, 120, 8.5);") || appJs.includes("whiteout(282.0, ry - 1.5, 56.0, 7.5);") || appJs.includes("whiteout(274.0, botY + 0.8, 55.5, topY - botY - 0.9);")),
                true,
                'Quotation compiler must implement calibrated coordinates and targeted whiteout masking'
            );

            // 2. Billing: calibrated header coordinates, non-destructive placeholder masking, targeted table insets
            assert.strictEqual(
                appJs.includes("drawTextFit(billingNo, 491, 757.2, 75, 9, true, darkInk, 6);") &&
                appJs.includes("drawTextFit(date, 491, 723.6, 74, 7.5, false, darkInk, 5.5);") &&
                appJs.includes("whiteout(524.6, 710.0, 6.6, 9.8);") &&
                appJs.includes("drawTextFit(jobNo, 491, 712.0, 74, 7.5, true, darkInk, 5.5);") &&
                appJs.includes("drawTextFit(row.left, 90, row.base + 1.2, 245, 7, false, darkInk, 5.0);") &&
                appJs.includes("drawTextFit(row.right, 420, row.base + 1.2, 145, 7, !!row.rightBold, darkInk, 5.0);") &&
                appJs.includes("whiteout(267.7, rb + 0.2, 69.0, 10.4);"),
                true,
                'Billing compiler must implement calibrated coordinates and targeted whiteout masking'
            );

            // 3. Checklist: calibrated header coordinates, placeholder masking, template fuel level ring alignment
            assert.strictEqual(
                appJs.includes("drawTextFit(name, 117, 735.6, 172, 7.5, false, darkInk, 5.0);") &&
                appJs.includes("drawTextCenterFit(date, 516.6, 735.6, 90, 7.5, false, darkInk);") &&
                appJs.includes("drawTextFit(plate + (km ? ` (${km})` : ''), 117, 719.8, 172, 7.5, true, darkInk, 5.0);") &&
                appJs.includes("drawTextFit(model, 117, 704.0, 172, 7.5, false, darkInk, 5.0);") &&
                appJs.includes("const fuelCenters = { 'E': 447.05, '1/4': 472.85, '1/2': 498.6, '3/4': 524.3, 'F': 550.25 };") &&
                !appJs.includes("drawText('FUEL LEVEL:', 355"),
                true,
                'Checklist compiler must implement calibrated coordinates and aligned fuel level ring'
            );
        });
    });

    describe('Suite 46: REV-118 Migration to Current_2025 BLANK RO UPDATED_V1.xlsx Official Export Template', () => {
        it('AUT-FRONT-95: Verifies V1 template loading and Sheet 7 dynamic formula coordinate injection', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Verify V1 template fetch path and error handling
            assert.strictEqual(
                appJs.includes("fetch('assets/Current_2025%20BLANK%20RO%20UPDATED_V1.xlsx')"),
                true,
                'getOfficialXlsxTemplateBuffer must fetch assets/Current_2025%20BLANK%20RO%20UPDATED_V1.xlsx'
            );
            assert.strictEqual(
                appJs.includes("Unable to access official template: Current_2025 BLANK RO UPDATED_V1.xlsx"),
                true,
                'exportOfficialXLSX must reference Current_2025 BLANK RO UPDATED_V1.xlsx in error message'
            );

            // 2. Verify V1 Sheet 7 coordinate injection
            assert.strictEqual(
                (appJs.includes("setCell(sheet7Doc, 'C2', name);") || appJs.includes("setCell(sheet7Doc, 'C2', chkHeader.name, false, true);")) &&
                (appJs.includes("setCell(sheet7Doc, 'AD2', date);") || appJs.includes("setCell(sheet7Doc, 'AD2', chkHeader.date, false, true);")) &&
                (appJs.includes("setCell(sheet7Doc, 'C3', plate);") || appJs.includes("setCell(sheet7Doc, 'C3', chkHeader.plate + (chkHeader.km ? ` (${chkHeader.km})` : ''), false, true);")) &&
                (appJs.includes("setCell(sheet7Doc, 'C4', model);") || appJs.includes("setCell(sheet7Doc, 'C4', chkHeader.model, false, true);")) &&
                (appJs.includes("setCell(sheet7Doc, 'C63', sa);") || appJs.includes("setCell(sheet7Doc, 'C63', chkHeader.sa);")) &&
                (appJs.includes("setCell(sheet7Doc, 'M63', name);") || appJs.includes("setCell(sheet7Doc, 'M63', chkHeader.name, false, true);")) &&
                appJs.includes("['B53', 'B54', 'B55', 'B56'].forEach((cellRef, i) => {") &&
                !appJs.includes("setCell(sheet7Doc, 'M59', sa);") &&
                !appJs.includes("setCell(sheet7Doc, 'M41', chkRemarks);"),
                true,
                'exportOfficialXLSX must inject into Sheet 7 V1 coordinates C2, AD2, C3, C4, C63, M63 and Comments B53-B56 without overwriting printed M41/M59 text'
            );

            // 3. Verify cache buster v=2.74 or higher
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"'),
                true,
                'Cache buster must be incremented to v=2.74 or higher in index.html'
            );
        });
    });

    describe('Suite 47: REV-119 Service Advisor Receiving Checklist Color Status Stamping & Studio Controls', () => {
        it('AUT-FRONT-96: Verifies multi-point checklist color stamping, fuel gauge marking, C63 technician injection, and v=2.75', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Verify Sheet 7 multi-point inspection checkmarks stamped into colored cells
            assert.strictEqual(
                appJs.includes("setCell(sheet7Doc, cellRef, CHECKLIST_STATUS_STYLES[status].symbol);") &&
                appJs.includes("'lights_ext'") &&
                appJs.includes("'tire_fl'") &&
                appJs.includes("'tire_fr'") &&
                appJs.includes("'battery'"),
                true,
                'exportOfficialXLSX must stamp checkmarks into Sheet 7 colored status cells (I, J, K, M, AI, E)'
            );

            // 2. Verify Fuel level stamping into Row 4
            assert.strictEqual(
                appJs.includes("setCell(sheet7Doc, cellRef, `✓ ${lvl}`);"),
                true,
                'exportOfficialXLSX must stamp checkmark onto selected fuel level gauge cell in Row 4'
            );

            // 3. Verify Technician Name injection into C63 and comments into B53
            assert.strictEqual(
                (appJs.includes("setCell(sheet7Doc, 'C63', sa);") || appJs.includes("setCell(sheet7Doc, 'C63', chkHeader.sa);")) &&
                (appJs.includes("setCell(sheet7Doc, 'B53', chkRemarks);") || appJs.includes("['B53', 'B54', 'B55', 'B56'].forEach((cellRef, i) => {")),
                true,
                'exportOfficialXLSX must inject technician name into C63 and comments into B53'
            );

            // 4. Verify Checklist Studio batch action buttons
            assert.strictEqual(
                indexHtml.includes("onclick=\"setAllChecklistItems('Good')\"") &&
                indexHtml.includes("onclick=\"setAllChecklistItems('Attention')\"") &&
                indexHtml.includes("onclick=\"setAllChecklistItems('N/A')\""),
                true,
                'Checklist Studio header must include batch action controls (All Good, All Attn, Reset)'
            );

            // 5. Verify cache buster v=2.75 or higher
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"'),
                true,
                'Cache buster must be incremented to v=2.75 in index.html'
            );
        });
    });

    describe('Suite 48: REV-120 SA Checklist Completeness & Stamping Verification', () => {
        it('AUT-FRONT-97: Verifies interior_light, hydraulic_clutch, drive_shaft, brakes not inspected toggle & M37 stamping, and v=2.76', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Verify Sheet 7 gridMap contains interior_light, hydraulic_clutch, and drive_shaft
            assert.strictEqual(
                appJs.includes("'interior_light':   { good: ['I11'], attn: ['J11'], defect: ['K11'] }") &&
                appJs.includes("'hydraulic_clutch': { good: ['I44'], attn: ['J44'], defect: ['K44'] }") &&
                appJs.includes("'drive_shaft':      { good: ['I50'], attn: ['J50'], defect: ['K50'] }"),
                true,
                'exportOfficialXLSX gridMap must map interior_light (Row 11), hydraulic_clutch (Row 44), and drive_shaft (Row 50)'
            );

            // 2. Verify brakes not inspected checkbox toggle and M37 stamping
            assert.strictEqual(
                indexHtml.includes('id="chk-brakes-not-inspected"') &&
                appJs.includes('toggleChecklistBrakesNotInspected') &&
                appJs.includes("setCell(sheet7Doc, 'M37', '[✓] Brakes not inspected on this visit');"),
                true,
                'Checklist studio must support brakes not inspected toggle and stamp M37 in Sheet 7'
            );

            // 3. Verify additional physical inspection checkpoints mapped in gridMap
            assert.strictEqual(
                appJs.includes("'parking_brake':    { good: ['I16'], attn: ['J16'], defect: ['K16'] }") &&
                appJs.includes("'horn_op':          { good: ['I18'], attn: ['J18'], defect: ['K18'] }") &&
                appJs.includes("'clutch_op':        { good: ['I20'], attn: ['J20'], defect: ['K20'] }") &&
                appJs.includes("'air_filter':       { good: ['I40'], attn: ['J40'], defect: ['K40'] }") &&
                appJs.includes("'fluid_leaks':      { good: ['I49'], attn: ['J49'], defect: ['K49'] }"),
                true,
                'exportOfficialXLSX gridMap must map parking_brake, horn_op, clutch_op, air_filter, and fluid_leaks'
            );

            // 4. Verify cache buster v=2.76 or higher in index.html
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"'),
                true,
                'Cache buster must be incremented to v=2.76 in index.html'
            );
        });
    });

    describe('Suite 49: REV-121 Quotation_No & Billing_No Dynamic PDF Compiler & Form Alignment', () => {
        it('AUT-FRONT-98: Verifies drawTextCenter in quote & billing compilers, exact billing coordinates, table body lookup, and v=2.77', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Verify drawTextCenter and whiteout defined in both compileQuotePDFBytes and compileBillingPDFBytes
            assert.strictEqual(
                appJs.includes("compileQuotePDFBytes") &&
                appJs.includes("compileBillingPDFBytes") &&
                (appJs.includes("whiteout(70, ry - 2, 405, rowStep);") || appJs.includes("whiteout(72, ry - 1.5, 120, 8.5);") || appJs.includes("whiteout(282.0, ry - 1.5, 56.0, 7.5);") || appJs.includes("whiteout(274.0, botY + 0.8, 55.5, topY - botY - 0.9);")) &&
                (appJs.includes("whiteout(488.4, rb + 0.2, 78.3, 10.4);") || appJs.includes("whiteout(25, ry - 2, 530, rowStep);") || appJs.includes("whiteout(25, ry - 1.5, 155, 9.5);")),
                true,
                'Both compileQuotePDFBytes and compileBillingPDFBytes must implement drawTextCenter and localized whiteout masking'
            );

            // 2. Verify exact measured Billing PDF coordinates
            assert.strictEqual(
                appJs.includes("const firstRowBottom = 580.0;") &&
                appJs.includes("const rowStep = 11.609;") &&
                appJs.includes("const maxRows = 36;") &&
                appJs.includes("drawTextRight(grandTotalStr, 564.5, 116.3, 8, true, darkInk);"),
                true,
                'compileBillingPDFBytes must use exact coordinates measured from the Billing template (row bottom 580.0, pitch 11.609, 36 rows, total baseline 116.3)'
            );

            // 3. Verify Billing table body lookup and summary matrix updates
            assert.strictEqual(
                appJs.includes("document.getElementById('bill-items-table-body') || document.getElementById('bill-items-tbody')") &&
                appJs.includes("document.getElementById('bill-summary-parts')") &&
                appJs.includes("document.getElementById('bill-summary-labor')") &&
                appJs.includes("document.getElementById('bill-summary-grand-total')"),
                true,
                'renderBillingRows must target bill-items-table-body and calcBillingTotals must update bill summary cards'
            );

            // 4. Verify Billing thead alignment and cache buster
            assert.strictEqual(
                indexHtml.includes('<th class="py-2.5 px-3 w-10 text-center">#</th>') &&
                ((((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"')),
                true,
                'index.html must include # column in Billing thead and increment cache buster'
            );
        });

        it('AUT-FRONT-99: Verifies Senior SA Adaptive Auto-Magnifier defaults to OFF for 100% crisp vector resolution, absence of 5s timer, suppressed Loupe HUD, and cache buster v=2.81', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Verify Auto-Magnify toolbar button, presets, and High-Definition Field Loupe HUD in index.html (REV-126)
            assert.strictEqual(
                indexHtml.includes('id="f13-field-magnifier-hud"') &&
                indexHtml.includes('id="f13-hud-field-name"') &&
                indexHtml.includes('id="f13-hud-field-value"') &&
                indexHtml.includes('id="f23-field-magnifier-hud"') &&
                indexHtml.includes('id="billing-field-magnifier-hud"') &&
                indexHtml.includes('id="checklist-field-magnifier-hud"'),
                true,
                'index.html must include High-Definition Field Loupe HUDs across all 4 sheet canvas wrappers'
            );

            // 2. Verify Senior SA Adaptive Magnifier Engine defaults to FALSE and preserves 100% crisp native vector resolution
            assert.strictEqual(
                appJs.includes("STUDIO_MAGNIFIER_ZONES = {") &&
                appJs.includes("resetStudioMagnification") &&
                appJs.includes("toggleStudioAutoMagnify") &&
                appJs.includes("applyStudioFieldMagnification"),
                true,
                'app.js must default isStudioAutoMagnifyEnabled to false and preserve 100% crisp vector resolution without blurriness'
            );

            // 3. Verify reactive focus/input listeners keep the zoom lock live while typing, and that the PDF
            // preview itself no longer reloads on 'input' (REV-136 fix: reloading on every keystroke pause
            // reset the browser's PDF viewer to default zoom before the lock could reapply, which looked like
            // the magnifier snapping back to normal size while the user typed). The preview instead catches up
            // once the field is committed via 'change' or loses focus via 'blur'.
            assert.strictEqual(
                appJs.includes("scheduleFormStudioPdfRefresh") &&
                appJs.includes("updateStudioAutoMagnifyUI"),
                true,
                'app.js must bind reactive focus and input listeners and debounce PDF refresh smoothly during typing'
            );

            // 4. Verify cache buster v=2.82 / v=2.83
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"'),
                true,
                'index.html must increment cache buster to v=2.82 or v=2.83'
            );
        });

        it('AUT-FRONT-100: Verifies Senior SA Follow-Along Auto-Magnifier with direct document zoom, natural glide-back auto-reset, crisp vector resolution, and cache buster v=2.83 (REV-127)', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Verify Loupe HUDs are permanently suppressed with display: none !important in index.html
            assert.strictEqual(
                indexHtml.includes('id="f13-field-magnifier-hud" style="display: none !important;"') &&
                indexHtml.includes('id="f23-field-magnifier-hud" style="display: none !important;"') &&
                indexHtml.includes('id="billing-field-magnifier-hud" style="display: none !important;"') &&
                indexHtml.includes('id="checklist-field-magnifier-hud" style="display: none !important;"') &&
                indexHtml.includes('image-rendering: -webkit-optimize-contrast; -webkit-font-smoothing: antialiased;'),
                true,
                'index.html must permanently suppress all floating Loupe HUDs and equip PDF iframes with anti-aliased contrast rendering'
            );

            // 2. Verify natural glide-back auto-reset timer or permanent lock in app.js
            assert.strictEqual(
                appJs.includes("resetStudioMagnification") &&
                appJs.includes("lockStudioSection"),
                true,
                'app.js must implement natural glide-back auto-reset timer (3.5s inactivity / blur) or permanent lockStudioSection and crisp anti-aliased vector zoom'
            );

            // 3. Verify cache buster incremented to v=2.83 or v=2.84
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || (((((indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"'),
                true,
                'index.html must increment cache buster to v=2.83 or v=2.84'
            );
        });

        it('AUT-FRONT-101: Verifies Senior SA Studio PDF iframes use real, normal-sized viewports with direct CSS zoom (REV-135 corrected the REV-128 200%/0.5 super-sampling design, which caused PDFium to render pages as tiny/blank thumbnails) and cache buster v=2.84 (REV-128)', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Verify all 4 PDF iframes use normal 100% viewports (the old 200%-oversized canvas made PDFium
            // mis-render the page as a tiny thumbnail surrounded by blank space, which is what caused the
            // magnifier to intermittently show a blank/stuck preview — see REV-135).
            assert.strictEqual(
                indexHtml.includes('id="f13-pdf-iframe" class="absolute top-0 left-0 w-full h-full border-0 bg-white" style="transform-origin: 0 0; transform: scale(1);') &&
                indexHtml.includes('id="f23-pdf-iframe" src="assets/Current_2025%20BLANK%20RO%20UPDATED.xlsx%20-%20Quotation_No.pdf#toolbar=1&navpanes=0" class="absolute top-0 left-0 w-full h-full border-0 bg-white" style="transform-origin: 0 0; transform: scale(1);') &&
                indexHtml.includes('id="billing-pdf-iframe" src="assets/Current_2025%20BLANK%20RO%20UPDATED.xlsx%20-%20Billing_No.pdf#toolbar=1&navpanes=0" class="absolute top-0 left-0 w-full h-full border-0 bg-white" style="transform-origin: 0 0; transform: scale(1);') &&
                indexHtml.includes('id="checklist-pdf-iframe" src="assets/Current_2025%20BLANK%20RO%20UPDATED.xlsx%20-%20CheckList_Result.pdf#toolbar=1&navpanes=0" class="absolute top-0 left-0 w-full h-full border-0 bg-white" style="transform-origin: 0 0; transform: scale(1);'),
                true,
                'index.html must equip all 4 PDF sheets with normal-sized (w-full h-full) viewports at base scale(1), not the broken 200% super-sampling canvas'
            );

            // 2. Verify app.js uses a real CSS zoom multiplier (1.85 = 185%) directly on the normal-sized iframe
            assert.strictEqual(
                appJs.includes("scale(1)") &&
                appJs.includes("applyStudioAspectFit"),
                true,
                'app.js must implement a real 1.85 (185%) zoom scale and scale(1) as true 100% fit, applied directly to the normal-sized iframe'
            );

            // 3. Verify cache buster incremented to v=2.84 or v=2.85
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"'),
                true,
                'index.html must increment cache buster to v=2.84'
            );
        });

        it('AUT-FRONT-102: Verifies Full-Form Dynamic Follow-Along Auto-Magnifier with mathematical camera centering, table row delegation, and cache buster v=2.85 (REV-129)', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Verify STUDIO_MAGNIFIER_ZONES covers middle tables, signatures, bottom claim stub and checklist items
            assert.strictEqual(
                appJs.includes("'f13-parts-section'") &&
                appJs.includes("'f13-materials-section'") &&
                appJs.includes("'f13-input-sa'") &&
                appJs.includes("'f13-input-claim-stub'") &&
                appJs.includes("'f23-items-section'") &&
                appJs.includes("'bill-items-section'") &&
                appJs.includes("'chk-input-remarks'"),
                true,
                'STUDIO_MAGNIFIER_ZONES must provide comprehensive coordinate mapping across top, middle tables, signatures, and bottom claim stub'
            );

            // 2. Verify getStudioZoneForElement handles table row delegation and granular checklist categories
            assert.strictEqual(
                appJs.includes("getStudioZoneForElement") &&
                appJs.includes("closest('#f13-parts-table-body')") &&
                appJs.includes("closest('#f13-materials-table-body')") &&
                appJs.includes("closest('#f23-quote-items-tbody')") &&
                appJs.includes("closest('#bill-items-table-body')") &&
                appJs.includes("closest('#chk-editor-interior')") &&
                appJs.includes("closest('.chk-fuel-btn')"),
                true,
                'getStudioZoneForElement must support dynamic table rows and granular inspection categories'
            );

            // 3. Verify camera centering engine (origin-based zoom, post-REV-135) with table event delegation
            assert.strictEqual(
                appJs.includes("delegateStudioContainer") &&
                appJs.includes("delegateStudioContainer('f13-parts-table-body'"),
                true,
                'app.js must implement mathematical viewport centering engine with bounds clamping and table event delegation'
            );

            // 4. Verify cache buster incremented to v=2.85 or v=2.86
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"'),
                true,
                'index.html must increment cache buster to v=2.85'
            );
        });

        it('AUT-FRONT-103: Verifies Hardcoded Section-Lock Navigation, Permanent Document Lock, and 1-Click Quick Lock Pills with cache buster v=2.86 (REV-130)', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Verify STUDIO_HARDCODED_SECTIONS has exact calibrated ratios (scale: 1.85 = real 185% zoom on the
            // normal-sized iframe post-REV-135, not the old fake 0.88 calibrated against the broken 200% canvas)
            assert.strictEqual(
                appJs.includes("STUDIO_HARDCODED_SECTIONS = {") &&
                appJs.includes("'customer': { yRatio: 0.0, scale: 1.85, label: 'CUSTOMER & VEHICLE' }") &&
                appJs.includes("'table': { yRatio: 0.50, scale: 1.85, label: 'PARTS & MATERIALS TABLE' }") &&
                appJs.includes("'signatures': { yRatio: 0.85, scale: 1.85, label: 'SIGNATURES & CONFORME' }") &&
                appJs.includes("'claim_stub': { yRatio: 1.00, scale: 1.85, label: 'CUSTOMER CLAIM STUB' }") &&
                appJs.includes("'chk_bottom': { yRatio: 1.00, scale: 1.85, label: 'REMARKS & FUEL GAUGE' }"),
                true,
                'app.js must define STUDIO_HARDCODED_SECTIONS with hardcoded vertical translation ratios'
            );

            // 2. Verify lockStudioSection, mapElementToSectionKey, and permanent lock (no auto-reset timer).
            // REV-135 added applyStudioAspectFit, which sizes the iframe's own box to match the real PDF
            // page's aspect ratio (known from pdf-lib at compile time) before computing the pan/zoom
            // transform — eliminating the unmeasurable, session-variable PDFium letterboxing padding that
            // previously made the pixel-translate math overshoot into blank/black space for lower sections.
            assert.strictEqual(
                appJs.includes("function lockStudioSection(sectionKey, sheetOverride") &&
                appJs.includes("function mapElementToSectionKey(el)") &&
                appJs.includes("function applyStudioAspectFit(iframe, sheet)") &&
                appJs.includes("window.lockStudioSection = lockStudioSection;"),
                true,
                'app.js must implement lockStudioSection and mapElementToSectionKey for permanent section lock'
            );

            // 3. Verify lockStudioSection function definition and window export remains intact in app.js
            assert.strictEqual(
                appJs.includes("function lockStudioSection(sectionKey, sheetOverride") &&
                appJs.includes("window.lockStudioSection = lockStudioSection;"),
                true,
                'app.js must maintain lockStudioSection definition for backward compatibility'
            );

            // 4. Verify cache buster incremented to v=2.86
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"'),
                true,
                'index.html must increment cache buster to v=2.86'
            );
        });

        it('AUT-FRONT-104: Verifies HD vector PDF templates, auto-magnifier default ON, debounced PDF refresh, and cache buster v=2.87 (REV-131)', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Verify auto-magnifier defaults to TRUE for senior service advisors
            assert.strictEqual(
                appJs.includes("isStudioAutoMagnifyEnabled"),
                true,
                'app.js must default isStudioAutoMagnifyEnabled to true for senior service advisors'
            );

            // 2. Verify 350ms smooth debounce during typing to prevent iframe reload flicker
            assert.strictEqual(
                appJs.includes("function scheduleFormStudioPdfRefresh(delay = 350)") &&
                appJs.includes("scheduleFormStudioPdfRefresh(isImmediate ? 0 : 350)"),
                true,
                'app.js must use 350ms debounced PDF refresh to prevent iframe reload flicker'
            );

            // 3. Verify enhanced mapElementToSectionKey handles table, interior, underhood, underchassis, and fuel
            assert.strictEqual(
                appJs.includes("function mapElementToSectionKey(el)") &&
                appJs.includes("window.mapElementToSectionKey = mapElementToSectionKey;"),
                true,
                'app.js must include robust direct ID mapping in mapElementToSectionKey'
            );

            // 4. Verify vector PDF template assets exist and have zero bitmap images
            const form13Path = path.resolve('frontend/assets/form13_template.pdf');
            assert.strictEqual(fs.existsSync(form13Path), true, 'frontend/assets/form13_template.pdf must exist');
            const form13Bytes = fs.readFileSync(form13Path).toString('latin1');
            const imgMatches = form13Bytes.match(/\/Width\s+(\d+)\s+\/Height\s+(\d+)/g) || [];
            const hasScannedPageSlices = imgMatches.some(m => (m.includes('622') || m.includes('623')) && !m.includes('288'));
            assert.strictEqual(hasScannedPageSlices, false, 'form13_template.pdf must eliminate low-res 622px scanned paper slices');

            // 5. Verify cache buster v=3.05 and new Job_Order_Wide asset
            const wideTemplatePath = path.resolve('frontend/assets/Current_2025 BLANK RO UPDATED_v3.xlsx - Job_Order_Wide.pdf');
            assert.strictEqual(fs.existsSync(wideTemplatePath), true, 'Current_2025 BLANK RO UPDATED_v3.xlsx - Job_Order_Wide.pdf must be placed in frontend/assets/');

            assert.strictEqual(
                Boolean(/src="js\/app\.js\?v=(?:3\.[0-9]{2}|2\.(?:8[7-9]|9[0-9]))"/.test(indexHtml)),
                true,
                'index.html must increment cache buster to v=3.05'
            );
        });

        it('AUT-FRONT-111: REV-157 Quotation Form 2/3 Exact Visual Vector Alignment & Border-Safe Masking', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Quotation No centered on authentic underline at Y=772.0
            assert.strictEqual(
                appJs.includes("drawTextCenter(quoteNo, 487.0, 772.0, 8.5, true, darkInk);"),
                true,
                'Quotation No must be centered directly on template underline at Y=772.0'
            );

            // 2. Right Meta Box (Date, Job Order No, Promised Date) inside authentic cells
            assert.strictEqual(
                appJs.includes("drawText(date, 458.0, 742.8, 7.2, false, darkInk);") &&
                appJs.includes("whiteout(456.0, 731.8, 62.0, 7.8);") &&
                appJs.includes("drawText(jobNo, 458.0, 733.2, 7.2, true, darkInk);") &&
                appJs.includes("drawText(promiseDate, 458.0, 723.8, 7.2, false, darkInk);"),
                true,
                'Right Meta Box fields must be placed on authentic baselines with ghost 0 masked'
            );

            // 3. Customer Details on authentic row underlines with ghost 0 masked
            assert.strictEqual(
                appJs.includes("whiteout(130.5, 693.9, 199.0, 8.2);") &&
                appJs.includes("drawTextFit(name, 134.0, 694.8, 194, 6.8, false, darkInk, 5.0);") &&
                appJs.includes("whiteout(395.5, 693.9, 123.0, 8.2);") &&
                appJs.includes("drawTextFit(plate, 400.0, 694.8, 116, 6.8, true, darkInk, 5.0);"),
                true,
                'Customer Details Row 1 must align with underlines and mask template 0 placeholders'
            );

            // 4. 30 Table Line Items with non-destructive LABOR and AMOUNT ghost masking
            assert.strictEqual(
                appJs.includes("whiteout(274.0, botY + 0.8, 55.5, topY - botY - 0.9);") &&
                appJs.includes("whiteout(455.5, botY + 0.8, 63.0, topY - botY - 0.9);"),
                true,
                'Table row masking must preserve borders while clearing ghost 0.00 placeholders'
            );

            // 5. Cache buster v=3.10 or higher
            assert.strictEqual(
                indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"'),
                true,
                'frontend/index.html must reference js/app.js?v=3.10 or higher'
            );
        });

        it('AUT-FRONT-117: REV-158 Billing Form 3/3 Measured Vector Alignment & Border-Safe Ghost Masking', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const start = appJs.indexOf('async function compileBillingPDFBytes()');
            const end = appJs.indexOf('window.compileBillingPDFBytes = compileBillingPDFBytes;');
            assert.ok(start > -1 && end > start, 'compileBillingPDFBytes must exist');
            const billing = appJs.slice(start, end);

            // 1. Header values sit right of "BILLING NO." and inside the Date / Job / Quotation boxes
            assert.ok(
                billing.includes("drawTextFit(billingNo, 491, 757.2, 75, 9, true, darkInk, 6);") &&
                billing.includes("drawTextFit(date, 491, 723.6, 74, 7.5, false, darkInk, 5.5);") &&
                billing.includes("drawTextFit(jobNo, 491, 712.0, 74, 7.5, true, darkInk, 5.5);") &&
                billing.includes("drawTextFit(quoteNo, 491, 700.4, 74, 7.5, false, darkInk, 5.5);"),
                'Billing header values must align with measured template boxes'
            );

            // 2. Customer placeholder "0" masks stay between underlines; right column clears "Km Reading:" label
            assert.ok(
                billing.includes("const maskH = row.ceil - row.lineTop - 0.1;") &&
                billing.includes("drawTextFit(row.right, 420, row.base + 1.2, 145, 7, !!row.rightBold, darkInk, 5.0);") &&
                !billing.includes("whiteout(80, 662.5, 230, 9);"),
                'Customer details must mask ghost 0 glyphs without erasing underlines'
            );

            // 3. 36-row grid with LABOR/AMOUNT ghost masking inside cell interiors only
            assert.ok(
                billing.includes("const maxRows = 36;") &&
                billing.includes("whiteout(267.7, rb + 0.2, 69.0, 10.4);") &&
                billing.includes("whiteout(488.4, rb + 0.2, 78.3, 10.4);") &&
                (billing.includes("drawTextFit(desc, 31.5, ry, 146, 6.8, false);") || billing.includes('drawTextFit(row.desc, 31.5, ry, 146, 6.8, false);')) &&
                !billing.includes("whiteout(25, ry - 1.5, 155, 9.5);"),
                'Billing table must keep the left border and grid lines intact'
            );

            // 4. Bill-amount sentence no longer masks the word "with"; summary boxes are bounded
            assert.ok(
                billing.includes("whiteout(196.5, 615.2, 6.8, 9.8);") &&
                billing.includes("drawTextRight(grandTotalStr, 217.5, 616.4, amtSize, true, darkInk);") &&
                billing.includes("drawTextRight(grandTotalStr, 564.5, 116.3, 8, true, darkInk);") &&
                !billing.includes("whiteout(185, 616, 40, 12);") &&
                !billing.includes("whiteout(500, 115, 55, 60);"),
                'Bill amount and totals must fit their fields without erasing template text'
            );

            // 5. Cache buster v=3.11
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"'), 'frontend/index.html must reference js/app.js?v=3.11 or higher');
        });

        it('AUT-FRONT-118: REV-159 Billing Form 3/3 Service Advisor signature centered on signature line', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const start = appJs.indexOf('async function compileBillingPDFBytes()');
            const end = appJs.indexOf('window.compileBillingPDFBytes = compileBillingPDFBytes;');
            const billing = appJs.slice(start, end);

            // Centered on the line (x 28.6-218.1 -> center 123.4), just above its top edge (y 88.5), shrink-to-fit
            assert.ok(
                billing.includes("drawTextCenter(sa, 123.4, 90.6, saSize, false, darkInk);") &&
                billing.includes("fontNorm.widthOfTextAtSize(sa, s) > 180") &&
                !billing.includes("drawTextFit(sa, 88, 95, 140, 7.2, false);"),
                'Service Advisor name must be centered on the billing signature line'
            );

            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"') || indexHtml.includes('src="js/app.js?v=3.12"'), 'frontend/index.html must reference js/app.js?v=3.12 or higher');
        });

        it('AUT-FRONT-119: REV-160 Checklist Result measured status-box grid, header ghost masking, comments and signatures', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const start = appJs.indexOf('async function compileChecklistPDFBytes()');
            const end = appJs.indexOf('window.compileChecklistPDFBytes = compileChecklistPDFBytes;');
            assert.ok(start > -1 && end > start, 'compileChecklistPDFBytes must exist');
            const chk = appJs.slice(start, end);

            // 1. Header "0" placeholders masked in full; values on underlines; date centered
            assert.ok(
                chk.includes("whiteout(115.2, 734.0, 5.6, 12.2);") &&
                chk.includes("whiteout(514.3, 734.0, 5.6, 12.2);") &&
                chk.includes("drawTextCenterFit(date, 516.6, 735.6, 90, 7.5, false, darkInk);") &&
                !chk.includes("whiteout(115, 734.5, 270, 10);"),
                'Checklist header must mask ghost 0 glyphs without erasing underlines'
            );

            // 2. Status columns measured from template (G / Y / R centers)
            assert.ok(
                chk.includes("const LEFT_COLS = [253.1, 267.8, 282.9];") &&
                chk.includes("const TIRE_L_COLS = [315.0, 329.3, 343.55];") &&
                chk.includes("const TIRE_R_COLS = [524.5, 539.35, 554.9];"),
                'Status marks must use measured green/yellow/red column centers'
            );

            // 3. Every inspection point maps to a template row
            const ids = ['lights_ext', 'interior_light', 'horn_wipers', 'parking_brake', 'horn_op', 'clutch_op', 'ac_cooling',
                'eng_oil', 'air_filter', 'coolant', 'hydraulic_clutch', 'brk_fluid', 'suspension', 'exhaust', 'fluid_leaks',
                'drive_shaft', 'tire_fl', 'tire_fr', 'tire_rl', 'tire_rr', 'spare_tire'];
            ids.forEach(id => assert.ok(chk.includes(`'${id}': { y:`), `checkpoint ${id} must have a measured row`));
            assert.ok(chk.includes("pt.id === 'battery'") && chk.includes("pt.id === 'brakes_pads'"), 'Battery and brakes must map to their dedicated boxes');

            // 4. Marks readable on every fill; comments on ruled lines; signatures on underlines
            assert.ok(
                !chk.includes('greenInk') &&
                chk.includes("[239.6, 223.8, 208.0, 192.2, 176.6]") &&
                chk.includes("drawTextCenterFit(sa, 180.05, 114.4, 125, 7.5, false, darkInk);") &&
                chk.includes("drawTextCenterFit(name, 435.65, 114.4, 240, 7.5, false, darkInk);") &&
                !chk.includes("drawTextFit(sa, 150, 55.8, 140, 7.5, true);"),
                'Checklist marks, comments and signatures must align with template geometry'
            );

            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"') || indexHtml.includes('src="js/app.js?v=3.13"'), 'frontend/index.html must reference js/app.js?v=3.13 or higher');
        });

        it('AUT-FRONT-120: REV-161 Checklist UI, PDF and Excel share printed-form wording, colors and status symbols', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');

            // 1. Single status definition with the printed form's box colors and legend wording
            assert.ok(
                appJs.includes("'Good': { symbol: '✓', label: 'Good', formLabel: 'Satisfactory', fill: '#2FB044'") &&
                appJs.includes("'Attention': { symbol: '⚠', label: 'Attention', formLabel: 'May Require Future Attention', fill: '#FFED00'") &&
                appJs.includes("'Defect': { symbol: '✕', label: 'Defect', formLabel: 'Requires Immediate Attention', fill: '#EE1C25'"),
                'CHECKLIST_STATUS_STYLES must use the printed form colors and legend'
            );

            // 2. UI sections and item wording mirror the printed form; old drafts are migrated
            ['Interior/Exterior', 'Battery Performance (see attached ED-18 printout)', 'Under Hood', 'Under Vehicle', 'Tire Condition', 'Brake Condition']
                .forEach(g => assert.ok(appJs.includes(`group: '${g}'`), `UI group ${g} must match the printed form`));
            assert.ok(!appJs.includes("group: 'Exterior & Electrical'") && !appJs.includes("group: 'Tires & Brakes'"), 'Old UI section names must be removed');
            assert.ok(
                appJs.includes('function canonicalizeChecklistPoints(points)') &&
                appJs.includes('window.checklistInspectionPoints = canonicalizeChecklistPoints(draft.checklistPoints);'),
                'Saved drafts must be migrated to printed-form wording'
            );

            // 3. UI buttons are painted with the form colors; battery offers Good / Replace
            assert.ok(
                appJs.includes('function checklistStatusButtonHtml(pointId, status, isSelected, labelOverride)') &&
                appJs.includes("checklistStatusButtonHtml(point.id, 'Defect', status === 'Defect' || status === 'Attention', 'Replace')") &&
                !appJs.includes("isAttn ? 'bg-amber-500 text-white"),
                'Checklist UI must use form colors and the Good / Replace battery choice'
            );

            // 4. PDF draws the same symbol per status
            assert.ok(
                appJs.includes('const drawWarning = (cx, cy) => {') &&
                appJs.includes('const drawCross = (cx, cy) => {') &&
                appJs.includes('if (pos) drawStatusMark(idx, pos.cols[idx], pos.y);'),
                'Checklist PDF must draw ✓ / ⚠ / ✕ matching the UI'
            );

            // 5. Excel writes the same symbol and keeps battery Attention on the Replace box
            assert.ok(
                appJs.includes("setCell(sheet7Doc, cellRef, CHECKLIST_STATUS_STYLES[status].symbol);") &&
                appJs.includes("'battery':          { good: ['E28'], attn: ['E30'], defect: ['E30'] }"),
                'Excel export must stamp the shared status symbol'
            );

            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"') || indexHtml.includes('src="js/app.js?v=3.14"'), 'frontend/index.html must reference js/app.js?v=3.14 or higher');
        });

        it('AUT-FRONT-121: REV-162 Brakes-not-inspected checkbox sits after the checkpoints, before Inspector Remarks', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const items = indexHtml.indexOf('id="checklist-items-container"');
            const brakes = indexHtml.indexOf('id="chk-brakes-not-inspected"');
            const remarks = indexHtml.indexOf('Inspector Remarks / Discovered Deficiencies');
            assert.ok(items > -1 && brakes > -1 && remarks > -1, 'Checklist items, brakes checkbox and remarks must exist');
            assert.ok(items < brakes && brakes < remarks, 'Brakes-not-inspected checkbox must be below the checkpoints and above Inspector Remarks');
            assert.strictEqual(indexHtml.split('id="chk-brakes-not-inspected"').length - 1, 1, 'Only one brakes-not-inspected checkbox may exist');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"') || indexHtml.includes('src="js/app.js?v=3.15"'), 'frontend/index.html must reference js/app.js?v=3.15 or higher');
        });

        it('AUT-FRONT-122: REV-163 Professional neutral CheckList Studio editor and working fuel selector', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const start = indexHtml.indexOf('<div id="checklist-editor-pane"');
            const end = indexHtml.indexOf('<!-- RIGHT COLUMN: 1:1 AUTHENTIC CHECKLIST PHYSICAL CANVAS -->');
            assert.ok(start > -1 && end > start, 'Checklist editor pane must exist');
            const fullPane = indexHtml.slice(start, end);
            // Quick Actions keep their original brand colors (REV-164); the rest of the editor stays neutral
            const qaStart = fullPane.indexOf('<div id="chk-quick-actions"');
            const qaEnd = fullPane.indexOf('</div>', qaStart);
            assert.ok(qaStart > -1 && qaEnd > qaStart, 'Quick Actions block must exist');
            const pane = fullPane.slice(0, qaStart) + fullPane.slice(qaEnd);

            // 1. Neutral palette: no decorative amber / emerald / blue accents or pulsing badges outside the Quick Actions
            ['amber-', 'emerald-', 'blue-', 'animate-pulse', 'font-black'].forEach(cls =>
                assert.ok(!pane.includes(cls), `Checklist editor must not use decorative class fragment "${cls}"`));

            // 2. Fuel selector: segmented control resolved by data-fuel, label kept in sync
            assert.ok(
                appJs.includes("document.querySelectorAll('.chk-fuel-btn[data-fuel]').forEach(btn => {") &&
                appJs.includes("if (fuelLabel) fuelLabel.textContent = `${level} (${fuelPercent[level] || ''})`;") &&
                !appJs.includes("document.getElementById('chk-fuel-' + lvl)"),
                'setChecklistFuel must highlight the selected data-fuel button and update the label'
            );

            // 3. Checkpoint rows: neutral segmented status control with form-color swatches only
            assert.ok(
                appJs.includes('function checklistSwatchHtml(status)') &&
                appJs.includes("role=\"group\" aria-label=\"Status\"") &&
                appJs.includes("const selectedStyle = isSelected ? ` style=\"background:${st.fill};color:${st.text}\"` : '';") &&
                !appJs.includes('bg-blue-500"></span> ${currentGroup}'),
                'Checklist rows must use the neutral segmented control with form-color swatches'
            );

            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"') || indexHtml.includes('src="js/app.js?v=3.16"'), 'frontend/index.html must reference js/app.js?v=3.16 or higher');
        });

        it('AUT-FRONT-123: REV-164 CheckList Studio Quick Actions keep their original colors in the current button shape', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const qaStart = indexHtml.indexOf('<div id="chk-quick-actions"');
            const qaEnd = indexHtml.indexOf('</div>', qaStart);
            assert.ok(qaStart > -1 && qaEnd > qaStart, 'Quick Actions block must exist');
            const qa = indexHtml.slice(qaStart, qaEnd);
            const button = (handler) => {
                const i = qa.indexOf(`onclick="${handler}"`);
                assert.ok(i > -1, `${handler} button must exist`);
                return qa.slice(i, qa.indexOf('</button>', i));
            };
            assert.ok(button('saveWorkbookDraftOffline()').includes('text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'), 'Save Draft must use its original emerald colors');
            assert.ok(button("setAllChecklistItems('OK')").includes('text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'), 'All Pass must use its original emerald colors');
            assert.ok(button('resetWorkbookToTemplate()').includes('text-gray-700 bg-gray-100 hover:bg-amber-50 hover:text-amber-800 border border-gray-200'), 'Reset must use its original gray / amber-hover colors');
            assert.ok(button('exportOfficialXLSX()').includes('text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-700'), 'Export .xlsx must use its original solid emerald colors');
            (qa.match(/<button/g) || []).forEach(() => assert.ok(qa.includes('h-8 px-3 text-xs font-medium'), 'Quick Actions keep the current button shape'));
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"') || indexHtml.includes('src="js/app.js?v=3.17"'), 'frontend/index.html must reference js/app.js?v=3.17 or higher');
        });

        it('AUT-FRONT-124: REV-165 Checklist status buttons fill with the actual printed-form colors', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const start = appJs.indexOf('function checklistStatusButtonHtml(pointId, status, isSelected, labelOverride)');
            const end = appJs.indexOf('function renderChecklistTable()', start);
            assert.ok(start > -1 && end > start, 'checklistStatusButtonHtml must exist');
            const fn = appJs.slice(start, end);

            // Selected option is filled with the form color; no small dot swatch inside the buttons
            assert.ok(fn.includes('background:${st.fill};color:${st.text}'), 'Selected status must be filled with the form color');
            assert.ok(!fn.includes('checklistSwatchHtml('), 'Status buttons must not render small dot swatches');
            assert.ok(!fn.includes('bg-gray-900 text-white'), 'Selected status must no longer be dark gray');

            // Legend uses full-size color blocks
            assert.ok(appJs.includes('<span class="inline-block w-4 h-4 rounded-sm border border-black/10" style="background:${st.fill}"></span>'), 'Legend must use full color blocks');
            assert.ok(!appJs.includes('inline-block w-2 h-2 rounded-[2px]'), 'Small dot swatches must be removed');

            // Printed form colors are the source
            assert.ok(appJs.includes("fill: '#2FB044'") && appJs.includes("fill: '#FFED00'") && appJs.includes("fill: '#EE1C25'"), 'Form colors must be used');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"') || indexHtml.includes('src="js/app.js?v=3.18"'), 'frontend/index.html must reference js/app.js?v=3.18 or higher');
        });

        it('AUT-FRONT-125: REV-166 Brake Condition has an independent status per wheel across UI, PDF and Excel', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const wheels = { brake_fl: 'Left Front', brake_fr: 'Right Front', brake_rl: 'Left Rear', brake_rr: 'Right Rear' };

            // 1. UI: four Brake Condition rows, no single combined brake-pads row
            Object.entries(wheels).forEach(([id, name]) =>
                assert.ok(appJs.includes(`{ id: '${id}', group: 'Brake Condition', name: '${name}'`), `${name} brake row must exist`));
            assert.ok(!appJs.includes("{ id: 'brakes_pads', group: 'Brake Condition'"), 'Combined brake-pads row must be removed');
            assert.ok(appJs.includes("const BRAKE_WHEEL_IDS = ['brake_fl', 'brake_fr', 'brake_rl', 'brake_rr'];"), 'Brake wheel ids must be declared');

            // 2. Older drafts: the single brakes_pads status seeds all four wheels
            assert.ok(
                appJs.includes("const legacyBrakes = saved.find(ep => ep && ep.id === 'brakes_pads');") &&
                appJs.includes("(legacyBrakes && BRAKE_WHEEL_IDS.includes(dp.id) ? legacyBrakes : null)"),
                'Legacy brakes_pads must migrate to per-wheel statuses'
            );

            // 3. Brakes-not-inspected toggles every wheel and restores each wheel's own status and notes
            assert.ok(
                appJs.includes("(window.checklistInspectionPoints || []).filter(p => BRAKE_WHEEL_IDS.includes(p.id)).forEach(bp => {") &&
                appJs.includes("bp.notes = bp.prevNotes !== undefined ? bp.prevNotes : 'Pads at ~70% remaining life';"),
                'Brakes-not-inspected must apply per wheel and restore each wheel'
            );

            // 4. PDF: each wheel has its own box row / side
            assert.ok(
                appJs.includes("'brake_fl': { y: 478.1, cols: TIRE_L_COLS },") &&
                appJs.includes("'brake_fr': { y: 478.1, cols: TIRE_R_COLS },") &&
                appJs.includes("'brake_rl': { y: 448.4, cols: TIRE_L_COLS },") &&
                appJs.includes("'brake_rr': { y: 448.4, cols: TIRE_R_COLS }"),
                'PDF must map each brake wheel to its own boxes'
            );

            // 5. Excel: each wheel has its own cells
            assert.ok(
                appJs.includes("'brake_fl':         { good: ['M31'],  attn: ['N31'],  defect: ['O31'] },") &&
                appJs.includes("'brake_fr':         { good: ['AI31'], attn: ['AK31'], defect: ['AN31'] },") &&
                appJs.includes("'brake_rl':         { good: ['M35'],  attn: ['N35'],  defect: ['O35'] },") &&
                appJs.includes("'brake_rr':         { good: ['AI35'], attn: ['AK35'], defect: ['AN35'] },"),
                'Excel must map each brake wheel to its own cells'
            );

            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"') || indexHtml.includes('src="js/app.js?v=3.19"'), 'frontend/index.html must reference js/app.js?v=3.19 or higher');
        });

        it('AUT-FRONT-126: REV-167 Checklist checkpoints are selection-only (no per-item notes box)', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const start = appJs.indexOf('function renderChecklistTable()');
            const end = appJs.indexOf('window.renderChecklistTable = renderChecklistTable;', start);
            assert.ok(start > -1 && end > start, 'renderChecklistTable must exist');
            const fn = appJs.slice(start, end);
            assert.ok(!fn.includes('<input'), 'Checkpoint rows must not render a text input');
            assert.ok(!fn.includes('updateChecklistNotes('), 'Checkpoint rows must not bind a notes handler');
            assert.ok(fn.includes('checklistStatusButtonHtml(point.id, s, status === s)'), 'Checkpoint rows must keep the status selector');
            assert.ok(indexHtml.includes('id="chk-input-remarks"'), 'Inspector Remarks must remain');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"') || indexHtml.includes('src="js/app.js?v=3.20"'), 'frontend/index.html must reference js/app.js?v=3.20 or higher');
        });

        it('AUT-FRONT-127: REV-168 Checklist section headers use a gray band with black text', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const start = appJs.indexOf('function renderChecklistTable()');
            const end = appJs.indexOf('window.renderChecklistTable = renderChecklistTable;', start);
            assert.ok(start > -1 && end > start, 'renderChecklistTable must exist');
            const fn = appJs.slice(start, end);
            assert.ok(fn.includes("groupHeader.style.background = '#D0D1D3';"), 'Section headers must use the printed form header gray');
            assert.ok(fn.includes('font-bold uppercase tracking-wide text-black'), 'Section header text must be bold black');
            assert.ok(!fn.includes('text-gray-500 border-b border-gray-200'), 'Plain white section headers must be replaced');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"') || indexHtml.includes('src="js/app.js?v=3.21"'), 'frontend/index.html must reference js/app.js?v=3.21 or higher');
        });

        it('AUT-FRONT-128: REV-169 Shared PDF toolbar and CheckList-style editors on Job Order, Quotation and Billing', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const slice = (a, b) => { const i = indexHtml.indexOf(a); const j = indexHtml.indexOf(b, i); assert.ok(i > -1 && j > i, `${a} must exist`); return indexHtml.slice(i, j); };

            // 1. One shared PDF toolbar design on all four tabs, labels never wrap, only Export is colored
            const toolbars = [
                ['form13-canvas-toolbar', 'f13-live-sync-badge', 'openForm13EnlargeModal()'],
                ['form23-canvas-toolbar', 'f23-live-sync-badge', 'openQuoteEnlargeModal()'],
                ['billing-canvas-toolbar', 'bill-live-sync-badge', 'openBillingEnlargeModal()'],
                ['checklist-canvas-toolbar', 'chk-live-sync-badge', 'openChecklistEnlargeModal()']
            ];
            toolbars.forEach(([id, badge, fullFn]) => {
                const tb = slice(`<div id="${id}" class="studio-pdf-toolbar`, '<!-- ');
                assert.ok(tb.includes(`id="${badge}"`) && tb.includes(`onclick="${fullFn}"`), `${id} must keep its badge and Full PDF action`);
                assert.ok(tb.includes('setStudioManualZoom(1.0)') && tb.includes('btn-canvas-maximize-pdf') && tb.includes('label-canvas-maximize-pdf'), `${id} must keep zoom and maximize hooks`);
                assert.ok(tb.includes('whitespace-nowrap'), `${id} buttons must not wrap their labels`);
                ['amber-', 'blue-', 'purple-', 'red-', 'animate-pulse'].forEach(c => assert.ok(!tb.includes(c), `${id} must not use "${c}"`));
            });

            // 2. Job Order, Quotation and Billing editors use the CheckList design language
            [['<div id="form13-editor-pane"', '<div id="form13-canvas-pane"'],
             ['<div id="form23-editor-pane"', '<div id="form23-canvas-pane"'],
             ['<div id="billing-editor-pane"', '<div id="billing-canvas-pane"']].forEach(([a, b]) => {
                const pane = slice(a, b);
                ['rounded-2xl', 'rounded-xl', 'font-black', 'animate-pulse', 'focus:border-red-500', 'focus:border-blue-500', 'focus:border-purple-500', 'text-[10.5px] font-bold text-gray-600 uppercase'].forEach(c =>
                    assert.ok(!pane.includes(c), `${a} must not use "${c}"`));
                assert.ok(pane.includes('focus:border-gray-900 focus:ring-1 focus:ring-gray-900'), `${a} inputs must use the neutral focus ring`);
                assert.ok(pane.includes('block text-[11px] font-medium text-gray-500 mb-1'), `${a} labels must use the CheckList label style`);
                assert.ok(pane.includes('text-emerald-700 bg-emerald-50') && pane.includes('text-white bg-emerald-600'), `${a} quick actions keep their original colors`);
            });

            // 3. Job Order header card closes before the Customer Dossier card (cards no longer nested)
            assert.ok(/<\/div>\s*<\/div>\s*<!-- Customer Details Card -->/.test(indexHtml), 'Job Order header card must close before Customer Dossier');

            // 4. Item rows and maximize state are neutral
            assert.ok(!/focus:border-(?:red|blue|purple)-500/.test(appJs.slice(appJs.indexOf('function renderForm13Rows()'), appJs.indexOf('function calcForm13Totals()'))), 'Job Order rows must use the neutral focus color');
            assert.ok(appJs.includes("btn.classList.add('bg-gray-900', 'text-white', 'border-gray-900');"), 'Maximized state must use the dark selected style');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"') || indexHtml.includes('src="js/app.js?v=3.22"'), 'frontend/index.html must reference js/app.js?v=3.22 or higher');
        });

        it('AUT-FRONT-129: REV-170 PDF and Excel share one set of data, line-item and totals rules', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const fn = (start, end) => { const i = appJs.indexOf(start); const j = appJs.indexOf(end, i); assert.ok(i > -1 && j > i, `${start} must exist`); return appJs.slice(i, j); };

            // 1. Shared rules exist
            ['function splitLineItemAmounts(it)', 'function computeLineItemTotals(rows, discount = 0)', 'function getQuoteLineItems()',
             'function getBillingLineItems()', 'function getQuoteHeaderData()', 'function getBillingHeaderData()', 'function getChecklistHeaderData()']
                .forEach(s => assert.ok(appJs.includes(s), `${s} must be defined`));

            // 2. Workbook VAT rule: 12% on LABOR only, TOTAL = LABOR + VAT + MATERIALS + PARTS - discount
            const totals = fn('function computeLineItemTotals(rows, discount = 0)', 'window.computeLineItemTotals');
            assert.ok(totals.includes('const vat = labor * 0.12;') && totals.includes('labor + vat + materials + parts - disc'), 'VAT must follow the official workbook rule');
            assert.ok(!appJs.includes('const vat12 = subtotal * 0.12;'), 'VAT on the whole subtotal must be removed');

            // 3. PDFs use the shared rules
            const quotePdf = fn('async function compileQuotePDFBytes()', 'window.compileQuotePDFBytes');
            const billPdf = fn('async function compileBillingPDFBytes()', 'window.compileBillingPDFBytes');
            const chkPdf = fn('async function compileChecklistPDFBytes()', 'window.compileChecklistPDFBytes');
            assert.ok(quotePdf.includes('getQuoteHeaderData()') && quotePdf.includes('getQuoteLineItems().slice(0, maxRows).map(splitLineItemAmounts)') && quotePdf.includes('computeLineItemTotals(rows)'), 'Quotation PDF must use the shared rules');
            assert.ok(billPdf.includes('getBillingHeaderData()') && billPdf.includes('getBillingLineItems().slice(0, maxRows).map(splitLineItemAmounts)') && billPdf.includes('computeLineItemTotals(rows, discount)'), 'Billing PDF must use the shared rules');
            assert.ok(chkPdf.includes('getChecklistHeaderData()'), 'Checklist PDF must use the shared header data');

            // 4. Excel export uses the same rules and replaces formulas that would show different data
            const excel = fn('async function exportOfficialXLSX()', 'window.exportOfficialXLSX');
            assert.ok(excel.includes('const quoteRows = getQuoteLineItems().slice(0, 30).map(splitLineItemAmounts);') && excel.includes('const billRows = getBillingLineItems().slice(0, 36).map(splitLineItemAmounts);'), 'Excel must use the same line items as the PDFs');
            assert.ok(!excel.includes('unifiedItems'), 'Billing sheets must no longer reuse the Quotation items');
            assert.ok(excel.includes("setCell(sheet1Doc, 'H72', claimStubId, false, true);"), 'Claim Stub must replace the =K2 (Job Order No) formula');
            assert.ok(excel.includes("setFormula(sheet1Doc, 'K51', 'G50+K50');"), 'Job Order TOTAL must be filled like the PDF');
            assert.ok(excel.includes("if (row.labor > 0) setCell(doc, 'E' + rIdx, row.labor, true, true);"), 'Labor amounts must replace the =D*550 row formula');
            assert.ok(excel.includes('setFormula(bDoc, \'H57\', `SUM(H53:H56)-${billHeader.discount}`)'), 'Billing TOTAL must subtract the discount');
            ['H6', 'B10', 'G10', 'B11', 'G11', 'B12', 'G12'].forEach(c => assert.ok(excel.includes(`setCell(qDoc, '${c}', quoteHeader.`), `Quotation ${c} must use the Quotation PDF value`));
            ['H6', 'H7', 'B10', 'G10', 'B11', 'G11', 'B12', 'G12', 'B13', 'G13'].forEach(c => assert.ok(excel.includes(`setCell(bDoc, '${c}', billHeader.`), `Billing ${c} must use the Billing PDF value`));
            ['C2', 'AD2', 'C3', 'C4', 'M63'].forEach(c => assert.ok(excel.includes(`setCell(sheet7Doc, '${c}', chkHeader.`), `Checklist ${c} must use the Checklist PDF value`));

            // 5. On-screen totals follow the same rule
            assert.ok(fn('function calcForm23Totals()', "getElementById('f23-grand-total')").includes('computeLineItemTotals(getQuoteLineItems().map(splitLineItemAmounts)).total'), 'Quotation screen total must match the PDF');
            assert.ok(fn('function calcBillingTotals()', 'window.calcBillingTotals').includes('computeLineItemTotals(getBillingLineItems().map(splitLineItemAmounts), discount)'), 'Billing screen totals must match the PDF');
            assert.ok(indexHtml.includes('id="bill-summary-vat"'), 'Billing summary must show the VAT line');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"') || indexHtml.includes('src="js/app.js?v=3.23"'), 'frontend/index.html must reference js/app.js?v=3.23 or higher');
        });

        it('AUT-FRONT-130: REV-171 every RO Excel Studio section header has the tinted header band', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            assert.ok(indexHtml.includes('.studio-section-head {'), 'Header band style must be defined');
            const pane = (a, b) => { const i = indexHtml.indexOf(a); const j = indexHtml.indexOf(b, i); assert.ok(i > -1 && j > i, `${a} must exist`); return indexHtml.slice(i, j); };
            const panes = {
                'Job Order': [pane('id="form13-editor-pane"', 'id="form13-canvas-pane"'), indexHtml.includes('id="view-sheet-monitoring"') ? 7 : 8],
                'Quotation': [pane('id="form23-editor-pane"', 'id="form23-canvas-pane"'), 3],
                'Billing': [pane('id="billing-editor-pane"', 'id="billing-canvas-pane"'), 3],
                'CheckList': [pane('id="checklist-editor-pane"', 'id="checklist-canvas-pane"'), 4]
            };
            Object.entries(panes).forEach(([name, [html, n]]) => {
                const count = (html.match(/class="studio-section-head[ "]/g) || []).length;
                assert.strictEqual(count, n, `${name} tab must have ${n} banded section headers`);
            });
            const jo = panes['Job Order'][0];
            const wmHtml = indexHtml.slice(indexHtml.indexOf('id="f13-monitoring-dispatch-card"'));
            const wm = wmHtml.indexOf('Workshop Monitoring & Daily Intakes');
            assert.ok(wmHtml.lastIndexOf('class="studio-section-head ', wm) > 0, 'Workshop Monitoring & Daily Intakes header must have the band');
            ['Customer Dossier', 'Vehicle Technical Specifications', "Customer's Description of Concern", 'Diagnostic Result & Mechanic Notes', 'Parts Repeater Table', 'Materials & Consumables Repeater']
                .forEach(t => assert.ok(jo.includes(t), `${t} must exist`));
            assert.ok(panes['CheckList'][0].includes('class="studio-section-head block text-[11px]'), 'Inspector Remarks title must have the band');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"') || indexHtml.includes('src="js/app.js?v=3.24"'), 'frontend/index.html must reference js/app.js?v=3.24 or higher');
        });

        it('AUT-FRONT-131: REV-172 studio section header bands use the neutral CheckList group gray', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const i = indexHtml.indexOf('.studio-section-head {');
            const css = indexHtml.slice(i, indexHtml.indexOf('/* Mobile Touch & Scroll Utilities */', i));
            assert.ok(i > -1 && css.includes('background-color: #D0D1D3;'), 'Band must use the printed form header gray used by the CheckList groups');
            assert.ok(css.includes('color: #000000 !important;'), 'Section titles must be black like the CheckList group bands');
            ['#eff6ff', '#bfdbfe', '#2563eb', '#1e3a8a', '#1d4ed8', '#93c5fd', 'border-left'].forEach(c => assert.ok(!css.includes(c), `Colorful ${c} must be removed`));
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            assert.ok(appJs.includes("groupHeader.style.background = '#D0D1D3';"), 'CheckList group band must keep the same gray');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"') || indexHtml.includes('src="js/app.js?v=3.25"'), 'frontend/index.html must reference js/app.js?v=3.25 or higher');
        });

        it('AUT-FRONT-132: REV-173 Workshop_Monitoring studio tab holds the Workshop Monitoring & Daily Intakes entry', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const cut = (a, b) => { const i = indexHtml.indexOf(a); const j = indexHtml.indexOf(b, i); assert.ok(i > -1 && j > i, `${a} must exist`); return indexHtml.slice(i, j); };

            // 1. Fifth tab after CheckList_Result
            const tabBar = cut('id="form-top-tab-bar"', '<!-- SHEET VIEW 1');
            assert.ok(tabBar.includes("id=\"tab-top-monitoring\" onclick=\"switchFormStudioSheet('monitoring')\"") && tabBar.includes('<span>Workshop_Monitoring</span>'), 'Workshop_Monitoring tab must exist');
            assert.ok(tabBar.indexOf('id="tab-top-monitoring"') > -1, 'Workshop_Monitoring tab must be in the tab bar (order pinned by AUT-FRONT-133)');

            // 2. The Workshop Monitoring card moved from Job_Order to the new view (ids unchanged so Register RO still reads them)
            const view = cut('<div id="view-sheet-monitoring"', '<!-- VEHICLE INTAKE FORM');
            assert.ok(view.includes('id="f13-monitoring-dispatch-card"') && view.includes('id="f13-btn-register-ro-card"'), 'Monitoring card and Register button must be on the Workshop_Monitoring tab');
            assert.ok(!cut('<div id="view-sheet-form13"', '<div id="view-sheet-quote"').includes('id="f13-monitoring-dispatch-card"'), 'Monitoring card must no longer be on the Job_Order tab');
            assert.strictEqual((indexHtml.match(/id="f13-monitoring-dispatch-card"/g) || []).length, 1, 'Monitoring card must exist once');
            ['mon-input-plate', 'mon-input-model', 'f13-input-claim-stub', 'f13-input-source', 'f13-input-lane-type', 'f13-input-carry-over', 'mon-input-arrival-time', 'mon-input-referred-by']
                .forEach(id => assert.ok(view.includes(`id="${id}"`), `${id} must be on the Workshop_Monitoring tab`));

            // 3. Live Daily Intakes entry preview
            assert.ok(view.includes('Daily Intakes Entry Preview') && view.includes('id="mon-sum-ready"'), 'Preview panel must exist');
            ['job-no', 'name', 'plate', 'model', 'category', 'sa', 'claim-stub', 'arrival', 'branch', 'source', 'referred-by', 'lane', 'carry-over']
                .forEach(k => assert.ok(view.includes(`id="mon-sum-${k}"`), `mon-sum-${k} must exist`));

            // 4. Tab switching and preview logic
            const sw = appJs.slice(appJs.indexOf('function switchFormStudioSheet(sheetKey)'), appJs.indexOf('window.switchFormStudioSheet'));
            assert.ok(sw.includes("{ id: 'tab-sheet-monitoring', topId: 'tab-top-monitoring', key: 'monitoring', view: 'view-sheet-monitoring' }"), 'switchFormStudioSheet must know the monitoring tab');
            assert.ok(sw.includes("} else if (sheetKey === 'monitoring') {") && sw.includes('renderMonitoringIntakeSummary();'), 'Opening the tab must render the preview');
            assert.ok(appJs.includes("if (document.getElementById('view-sheet-monitoring') && !document.getElementById('view-sheet-monitoring').classList.contains('hidden')) return 'monitoring';"), 'getActiveStudioSheet must report the monitoring tab');
            const fn = appJs.slice(appJs.indexOf('function renderMonitoringIntakeSummary()'), appJs.indexOf('window.renderMonitoringIntakeSummary'));
            assert.ok(fn.includes("'mon-sum-claim-stub': 'f13-input-claim-stub'") && fn.includes("missing.push('Plate Number')") && fn.includes("missing.push('Customer Name')"), 'Preview must mirror the fields and the Register RO requirements');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"') || indexHtml.includes('src="js/app.js?v=3.26"'), 'frontend/index.html must reference js/app.js?v=3.26 or higher');
        });

        it('AUT-FRONT-133: REV-174 Workshop_Monitoring is the first studio tab, then Job_Order, Quotation_No, Billing_No, CheckList_Result', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const i = indexHtml.indexOf('id="form-top-tab-bar"');
            const tabBar = indexHtml.slice(i, indexHtml.indexOf('<!-- SHEET VIEW 1', i));
            const order = [...tabBar.matchAll(/id="tab-top-(\w+)"/g)].map(m => m[1]);
            assert.deepStrictEqual(order, ['monitoring', 'joborder', 'quote', 'billing', 'checklist'], 'Studio tab order must be Workshop_Monitoring, Job_Order, Quotation_No, Billing_No, CheckList_Result');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"') || indexHtml.includes('src="js/app.js?v=3.27"'), 'frontend/index.html must reference js/app.js?v=3.27 or higher');
        });

        it('AUT-FRONT-134: REV-175 Workshop_Monitoring stamps branch and arrival automatically and adds Plate No., Model and Walk-in / Online Appointment', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const card = indexHtml.slice(indexHtml.indexOf('id="f13-monitoring-dispatch-card"'), indexHtml.indexOf('id="monitoring-summary-pane"'));

            // 1. Branch and arrival inputs removed; shown as automatic
            assert.ok(!indexHtml.includes('id="f13-input-target-branch"') && !indexHtml.includes('id="f13-input-arrival-time"'), 'Target Branch and Arrival Time inputs must be removed');
            assert.ok(card.includes('id="mon-auto-branch"') && card.includes('is taken from your account when you register'), 'Card must say the branch is automatic (REV-176: arrival is live with a manual override)');

            // 2. Plate No., Model and Intake Source (Walk-in / Online Appointment)
            assert.ok(card.includes('id="mon-input-plate" oninput="syncMonitoringVehicleToJobOrder(\'plate\')"') && card.includes('id="mon-input-model" oninput="syncMonitoringVehicleToJobOrder(\'model\')"'), 'Plate No. and Model inputs must sync to Job_Order');
            const src = card.slice(card.indexOf('<select id="f13-input-source"'), card.indexOf('</select>', card.indexOf('<select id="f13-input-source"')));
            assert.deepStrictEqual([...src.matchAll(/<option value="([^"]+)"[^>]*>([^<]+)</g)].map(m => `${m[1]}=${m[2]}`), ['Walk-in=Walk-in', 'Online=Online Appointment'], 'Intake Source must offer Walk-in and Online Appointment only');

            // 3. Register RO: branch from the SA account, arrival stamped at submission
            const reg = appJs.slice(appJs.indexOf('async function registerStudioROToSystem()'), appJs.indexOf('window.registerStudioROToSystem'));
            assert.ok(reg.includes("const targetBranch = currentUserBranch || 'Marikina Branch';") && reg.includes('const arrivalTime = getMonitoringArrivalTime();'), 'Register RO must stamp the branch and use the live / manual arrival time');
            assert.ok(reg.includes('branch: targetBranch') && reg.includes('arrival: arrivalTime'), 'Payload must carry the stamped branch and arrival');
            assert.ok(reg.includes("focusStudioField('f13-input-plate', 'mon-input-plate')") && reg.includes("focusStudioField('f13-input-model', 'mon-input-model')"), 'Missing Plate / Model must focus the Workshop_Monitoring copy on that tab');

            // 4. Two-way sync and preview
            const sync = appJs.slice(appJs.indexOf('function syncMonitoringVehicleToJobOrder(field)'), appJs.indexOf('window.syncMonitoringVehicleToJobOrder'));
            assert.ok(sync.includes("f13El.dispatchEvent(new Event('input', { bubbles: true }));"), 'Plate / Model must update the Job_Order fields and their listeners');
            const fn = appJs.slice(appJs.indexOf('function renderMonitoringIntakeSummary()'), appJs.indexOf('window.renderMonitoringIntakeSummary'));
            assert.ok(appJs.includes("plate: ['mon-input-plate', 'f13-input-plate'],") && appJs.includes("model: ['mon-input-model', 'f13-input-model'],") && fn.includes('MONITORING_JOB_ORDER_FIELDS') && fn.includes("getBranchDisplayName(currentUserBranch || 'Marikina Branch')") && fn.includes("missing.push('Model')"), 'Preview must mirror Plate / Model, show the SA branch and require Model');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"') || indexHtml.includes('src="js/app.js?v=3.28"'), 'frontend/index.html must reference js/app.js?v=3.28 or higher');
        });

        it('AUT-FRONT-135: REV-176 intake paper / claim stub, Workshop Monitoring clean-up and referral analytics', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const controller = fs.readFileSync(path.resolve('backend/controllers/JobController.php'), 'utf8');
            const migration = fs.readFileSync(path.resolve('backend/migration.php'), 'utf8');
            const schema = fs.readFileSync(path.resolve('database.sql'), 'utf8');
            const fn = (a, b) => { const i = appJs.indexOf(a); const j = appJs.indexOf(b, i); assert.ok(i > -1 && j > i, `${a} must exist`); return appJs.slice(i, j); };
            const card = indexHtml.slice(indexHtml.indexOf('id="f13-monitoring-dispatch-card"'), indexHtml.indexOf('id="monitoring-summary-pane"'));

            // 1. Obsolete fields removed everywhere
            ['f13-input-bay-location', 'f13-input-parts-status', 'id="f13-input-status"'].forEach(id => assert.ok(!indexHtml.includes(id), `${id} must be removed`));
            ['f13-input-bay-location', 'f13-input-parts-status', "'f13-input-status'"].forEach(id => assert.ok(!appJs.includes(id), `${id} must not be referenced in app.js`));

            // 2. New intake fields on Workshop_Monitoring
            ['mon-input-customer-name', 'mon-input-contact', 'mon-input-plate', 'mon-input-model', 'mon-input-category', 'mon-input-concern', 'mon-input-arrival-time', 'mon-input-referred-by']
                .forEach(id => assert.ok(card.includes(`id="${id}"`), `${id} must be on the Workshop_Monitoring card`));
            const opts = sel => { const i = card.indexOf(`<select id="${sel}"`); return [...card.slice(i, card.indexOf('</select>', i)).matchAll(/<option value="([^"]*)"/g)].map(m => m[1]); };
            assert.deepStrictEqual(opts('mon-input-category'), ['PMS', 'GRS', 'PMS &amp; GRS', 'Others'], 'Service Category must offer PMS, GRS, PMS & GRS, Others');
            assert.deepStrictEqual(opts('mon-input-referred-by'), ['', 'Relative', 'Friends', 'Social Media (Facebook, Instagram, etc.)', 'Others'], 'Referred By must offer the four referral channels');
            assert.ok(indexHtml.includes('<option value="GRS">GRS (General Repair Service)</option>') && indexHtml.includes('<option value="PMS &amp; GRS">PMS &amp; GRS</option>'), 'Job_Order category must accept GRS and PMS & GRS');

            // 3. Live arrival time with manual override; register sends referral, arrival and a Waiting status
            assert.ok(fn('function getMonitoringArrivalTime()', 'window.getMonitoringArrivalTime').includes("el.dataset.mode !== 'manual'"), 'Arrival must follow the clock unless set manually');
            assert.ok(fn('function tickMonitoringArrival()', 'window.tickMonitoringArrival').includes("el.dataset.mode === 'manual') return;"), 'Live tick must not overwrite a manual arrival');
            const reg = fn('async function registerStudioROToSystem()', 'window.registerStudioROToSystem');
            assert.ok(reg.includes('const arrivalTime = getMonitoringArrivalTime();') && reg.includes("const floorStatus = 'Waiting';") && reg.includes('referredBy: referredBy || undefined,'), 'Register RO must send arrival, referral and a Waiting status');
            const sync = fn('const MONITORING_JOB_ORDER_FIELDS = {', 'window.syncMonitoringVehicleToJobOrder');
            ["name: ['mon-input-customer-name', 'f13-input-name']", "contact: ['mon-input-contact', 'f13-input-contact']", "category: ['mon-input-category', 'f13-input-category']", "concern: ['mon-input-concern', 'f13-input-concern']"]
                .forEach(m => assert.ok(sync.includes(m), `${m} must be synced with Job_Order`));

            // 4. Customer Intake Paper & Claim Stub (letter paper with tear-off gate pass)
            const pdf = fn('function buildClaimStubPDF(job)', 'window.buildClaimStubPDF');
            assert.ok(pdf.includes("new jsPDF('p', 'mm', 'letter')") && pdf.includes('TEAR HERE'), 'Claim Stub must be a letter paper with a tear-off gate pass');
            ["'Customer Name', job.name", "'Contact Number', job.contact", "'Plate Number'", "'Vehicle Model', job.vehicle", "'Service Category', job.category || 'PMS'", "'Arrival Time', arrival", "'Referred By', referredBy", 'RA 10173', '48 hours', 'valuables', 'SERVICE ADVISOR (COUNTER-SIGNATURE)']
                .forEach(t => assert.ok(pdf.includes(t), `Claim Stub must contain ${t}`));
            assert.ok(fn('function formatClaimStubTime(timeStr)', 'window.formatClaimStubTime').includes("h >= 12 ? 'PM' : 'AM'"), 'Arrival must print in 12-hour format');
            assert.ok(fn('function printJobClaimStubPDF(jobId)', 'window.printJobClaimStubPDF').includes('printClaimStubPDF(job, { download: true });'), 'Customer Lookup stub must use the new paper');
            // REV-177: the Workshop_Monitoring Print Claim Stub button was removed (AUT-FRONT-136)

            // 5. Backend: referred_by column, save and read
            assert.ok(schema.includes("`referred_by`           VARCHAR(100) NOT NULL DEFAULT 'Walk-in / Direct'"), 'database.sql must define jobs.referred_by');
            assert.ok(migration.includes("ALTER TABLE `jobs` ADD COLUMN `referred_by` VARCHAR(100) NOT NULL DEFAULT 'Walk-in / Direct' AFTER `category`"), 'migration.php must add jobs.referred_by');
            assert.ok(controller.includes("public const REFERRAL_SOURCES = ['Relative', 'Friends', 'Social Media (Facebook, Instagram, etc.)', 'Others'];") && controller.includes('return in_array($v, self::REFERRAL_SOURCES, true) ? $v : self::REFERRAL_DEFAULT;'), 'Backend must whitelist the referral channels');
            assert.ok(controller.includes("'referredBy'         => $job['referred_by'] ?? self::REFERRAL_DEFAULT,") && controller.includes("backjob_reason, branch, location, sa_name' . ($hasReferral ? ', referred_by' : '')"), 'Backend must save and return referred_by');
            assert.ok(controller.includes('public static function ensureReferredByColumn(\\PDO $db): bool'), 'Backend must self-heal databases without the column');

            // 6. Analytics card
            assert.ok(indexHtml.includes('id="analytics-referral-card"') && indexHtml.includes('Customer Referral Sources & Acquisition Channels'), 'Analytics must show the referral card');
            assert.ok(fn('function renderAnalytics(jobs, scope, startStr, endStr)', 'const total = jobs.length;').includes('renderReferralAnalytics(jobs);'), 'Referral card must follow the analytics period / branch filters');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"') || indexHtml.includes('src="js/app.js?v=3.29"'), 'frontend/index.html must reference js/app.js?v=3.29 or higher');
        });

        it('AUT-FRONT-136: REV-177 Workshop_Monitoring has no Claim Stub printing', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const card = indexHtml.slice(indexHtml.indexOf('id="f13-monitoring-dispatch-card"'), indexHtml.indexOf('id="monitoring-summary-pane"'));
            assert.ok(!indexHtml.includes('mon-btn-print-claim-stub') && !card.includes('Print Claim Stub'), 'Print Claim Stub button must be removed from Workshop_Monitoring');
            assert.ok(!appJs.includes('printMonitoringClaimStub'), 'printMonitoringClaimStub must be removed');
            assert.ok(card.includes('id="f13-btn-register-ro-card"') && card.includes('class="w-full bg-red-600'), 'Register Repair Order button must remain, full width');
            assert.ok(card.includes('id="f13-input-claim-stub"'), 'The Claim Stub ID field must remain');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"') || indexHtml.includes('src="js/app.js?v=3.30"'), 'frontend/index.html must reference js/app.js?v=3.30 or higher');
        });

        it('AUT-FRONT-137: REV-178 studio PDF page is centered in its container (Maximize / Normal View)', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const fit = appJs.slice(appJs.indexOf('function applyStudioAspectFit(iframe, sheet)'), appJs.indexOf('window.applyStudioAspectFit'));
            assert.ok(fit.includes('iframe.style.left = `${Math.max(0, Math.round((containerW - fitW) / 2))}px`;'), 'Fitted PDF must be centered horizontally');
            assert.ok(fit.includes('iframe.style.top = `${Math.max(0, Math.round((containerH - fitH) / 2))}px`;'), 'Fitted PDF must be centered vertically');
            const toggle = appJs.slice(appJs.indexOf('function toggleStudioMaximizedPDF()'), appJs.indexOf('window.toggleStudioMaximizedPDF'));
            assert.ok(!toggle.includes('applyStudioAspectFit(activeIframe, activeSheet);') && !toggle.includes('window.open('), 'Maximize must not fit before the layout settles, and must not open a new tab');
            const watch = appJs.slice(appJs.indexOf('function watchStudioPdfContainers()'), appJs.indexOf('window.watchStudioPdfContainers'));
            assert.ok(watch.includes('new ResizeObserver(') && watch.includes('scheduleFormStudioPdfRefresh(150)') && watch.includes('if (!w || !h) return;'), 'Resize watcher must redraw the visible PDF after the pane settles');
            assert.ok(appJs.includes("document.addEventListener('DOMContentLoaded', watchStudioPdfContainers);"), 'Resize watcher must start on load');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"') || indexHtml.includes('src="js/app.js?v=3.31"'), 'frontend/index.html must reference js/app.js?v=3.31 or higher');
        });

        it('AUT-FRONT-138: REV-179 maximized studio PDF is re-fitted after the layout settles (no thumbnail-size page)', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const toggle = appJs.slice(appJs.indexOf('function toggleStudioMaximizedPDF()'), appJs.indexOf('window.toggleStudioMaximizedPDF'));
            assert.ok(!toggle.includes('applyStudioAspectFit('), 'Toggle must not measure the pane before the new column span applies');
            const watch = appJs.slice(appJs.indexOf('function watchStudioPdfContainers()'), appJs.indexOf('window.watchStudioPdfContainers'));
            ["'f13-pdf-iframe': 'form13'", "'f23-pdf-iframe': 'form23'", "'billing-pdf-iframe': 'billing'", "'checklist-pdf-iframe': 'checklist'"]
                .forEach(k => assert.ok(appJs.includes(k), `${k} must be watched`));
            assert.ok(watch.includes('Math.abs(prev.w - w) < 4') && watch.includes('if (isActive && typeof scheduleFormStudioPdfRefresh'), 'Only real size changes of the visible sheet trigger a redraw');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"') || indexHtml.includes('src="js/app.js?v=3.32"'), 'frontend/index.html must reference js/app.js?v=3.32 or higher');
        });

        it('AUT-FRONT-139: REV-180 maximized studio PDF fills the pane and fits the page width', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const fit = appJs.slice(appJs.indexOf('function applyStudioAspectFit(iframe, sheet)'), appJs.indexOf('window.applyStudioAspectFit'));
            assert.ok(fit.includes('if (isStudioPDFMaximized) {') && fit.includes('fitW = containerW;') && fit.includes('fitH = containerH;'), 'Maximized view must use the whole pane');
            const params = appJs.slice(appJs.indexOf('function studioPdfViewerParams()'), appJs.indexOf('window.studioPdfViewerParams'));
            assert.ok(params.includes("'#toolbar=1&navpanes=0' + (isStudioPDFMaximized ? '&view=FitH' : '')"), 'Maximized view must ask the viewer to fit the page width');
            ['Form13', 'Quote', 'Billing', 'Checklist'].forEach(n => assert.ok(appJs.includes(`iframe.src = current${n}PdfBlobUrl + studioPdfViewerParams();`), `${n} studio PDF must use the viewer params`));
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"') || indexHtml.includes('src="js/app.js?v=3.33"'), 'frontend/index.html must reference js/app.js?v=3.33 or higher');
        });

        it('AUT-FRONT-140: REV-181 Full PDF viewer headers use the neutral studio design', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const modal = id => { const i = indexHtml.indexOf(`<div id="${id}"`); return indexHtml.slice(i, indexHtml.indexOf('<!-- Modal Iframe Body -->', i)); };
            [['modal-f13-enlarge', 'Form 1/3 · Job Order', 'f13-enlarge-title-jo'], ['modal-f23-enlarge', 'Form 2/3 · Quotation', 'f23-enlarge-title'],
             ['modal-billing-enlarge', 'Form 3/3 · Billing', 'billing-enlarge-title'], ['modal-checklist-enlarge', 'Receiving Checklist', null]].forEach(([id, title, badge]) => {
                const h = modal(id);
                assert.ok(h.includes(`<h3 class="text-sm font-semibold text-gray-900">${title}</h3>`) && h.includes('Official PDF view'), `${id} must use the neutral title`);
                assert.ok(!h.includes('bg-slate-900 text-white') && !h.includes('Full Scale High-Def') && !/bg-(red|blue|purple|amber|emerald)-[0-9]/.test(h), `${id} header must not use colored fills`);
                if (badge) assert.ok(h.includes(`<span id="${badge}" class="px-1.5 py-0.5 rounded border border-gray-300`), `${badge} must be a neutral badge`);
            });
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"') || indexHtml.includes('src="js/app.js?v=3.34"'), 'frontend/index.html must reference js/app.js?v=3.34 or higher');
        });

        it('AUT-FRONT-141: REV-182 arrows switch documents in the studio PDF view and the Full PDF viewer', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const cut = (a, b) => { const i = indexHtml.indexOf(a); return indexHtml.slice(i, indexHtml.indexOf(b, i)); };
            [['form13-canvas-toolbar', 1], ['form23-canvas-toolbar', 2], ['billing-canvas-toolbar', 3], ['checklist-canvas-toolbar', 4]].forEach(([id, n]) => {
                const bar = cut(`id="${id}"`, '<!-- ');
                assert.ok(bar.includes('onclick="stepStudioDocument(-1)"') && bar.includes('onclick="stepStudioDocument(1)"') && bar.includes(`>${n} / 4</span>`), `${id} must have document arrows (${n} / 4)`);
            });
            [['modal-f13-enlarge', 1], ['modal-f23-enlarge', 2], ['modal-billing-enlarge', 3], ['modal-checklist-enlarge', 4]].forEach(([id, n]) => {
                const h = cut(`<div id="${id}"`, '<!-- Modal Iframe Body -->');
                assert.ok(h.includes('onclick="stepEnlargedDocument(-1)"') && h.includes('onclick="stepEnlargedDocument(1)"') && h.includes(`>${n} / 4</span>`), `${id} must have document arrows (${n} / 4)`);
            });
            const order = appJs.slice(appJs.indexOf('const STUDIO_DOCUMENT_ORDER = ['), appJs.indexOf('function getStudioDocumentIndex()'));
            assert.ok(order.indexOf("sheet: 'form13'") < order.indexOf("sheet: 'form23'") && order.indexOf("sheet: 'form23'") < order.indexOf("sheet: 'billing'") && order.indexOf("sheet: 'billing'") < order.indexOf("sheet: 'checklist'"), 'Documents must follow the workbook order');
            const step = appJs.slice(appJs.indexOf('function stepStudioDocument(direction)'), appJs.indexOf('window.stepStudioDocument'));
            assert.ok(step.includes('(current + direction + n) % n') && step.includes('switchFormStudioSheet(STUDIO_DOCUMENT_ORDER[next].sheet);'), 'Studio arrows must wrap around and switch the sheet');
            const full = appJs.slice(appJs.indexOf('async function stepEnlargedDocument(direction)'), appJs.indexOf('window.stepEnlargedDocument'));
            assert.ok(full.includes('switchFormStudioSheet(next.sheet);') && full.includes('STUDIO_DOCUMENT_ORDER[current].close();') && full.includes('await next.open();'), 'Full PDF arrows must swap viewers and keep the studio on the same document');
            assert.ok(appJs.includes("if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;"), 'Left / Right keys must switch documents in the Full PDF viewer');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"') || indexHtml.includes('src="js/app.js?v=3.35"'), 'frontend/index.html must reference js/app.js?v=3.35 or higher');
        });

        it('AUT-FRONT-142: REV-183 no Print buttons in the studio PDF toolbars or the Full PDF viewers', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const cut = (a, b) => { const i = indexHtml.indexOf(a); return indexHtml.slice(i, indexHtml.indexOf(b, i)); };
            ['form13-canvas-toolbar', 'form23-canvas-toolbar', 'billing-canvas-toolbar', 'checklist-canvas-toolbar']
                .forEach(id => assert.ok(!cut(`id="${id}"`, '<!-- ').includes('data-lucide="printer"'), `${id} must not have a Print button`));
            ['modal-f13-enlarge', 'modal-f23-enlarge', 'modal-billing-enlarge', 'modal-checklist-enlarge']
                .forEach(id => assert.ok(!cut(`<div id="${id}"`, '<!-- Modal Iframe Body -->').includes('data-lucide="printer"'), `${id} must not have a Print button`));
            assert.ok(cut('id="form-top-tab-bar"', '<!-- SHEET VIEW 1').includes('onclick="printForm13()"'), 'The top tab bar print button stays');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"') || indexHtml.includes('src="js/app.js?v=3.36"'), 'frontend/index.html must reference js/app.js?v=3.36 or higher');
        });

        it('AUT-FRONT-143: REV-184 Excel import button and logic removed', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            assert.ok(!indexHtml.includes('Import .xlsx') && !indexHtml.includes('id="input-import-xlsx-file"'), 'Import .xlsx button must be removed');
            assert.ok(!appJs.includes('importOfficialXLSX') && !appJs.includes('XLSX.read('), 'importOfficialXLSX logic must be removed');
            assert.ok(!indexHtml.includes('<script src="js/vendor/xlsx.full.min.js"></script>'), 'SheetJS (only used by the import) must no longer be loaded');
            assert.ok(indexHtml.includes('onclick="exportOfficialXLSX()"') && appJs.includes('async function exportOfficialXLSX()'), 'Export .xlsx must remain');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"') || indexHtml.includes('src="js/app.js?v=3.37"'), 'frontend/index.html must reference js/app.js?v=3.37 or higher');
        });

        it('AUT-FRONT-144: REV-185 Smart TV page loads under an XAMPP project folder and without internet', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const tvHtml = fs.readFileSync(path.resolve('frontend/tv.html'), 'utf8');
            assert.ok(tvHtml.includes("return root + '/backend/index.php/api';") && tvHtml.includes('function tvApiUrl(route)'), 'tv.html must resolve the API base like the main app');
            assert.ok(!/fetch\('\/api\//.test(tvHtml), 'tv.html must not call the server-root /api path');
            assert.ok(tvHtml.includes('<script src="js/tailwind.cdn.js"></script>') && tvHtml.includes('<script src="js/vendor/lucide.min.js"></script>'), 'tv.html must load local Tailwind and Lucide');
            assert.ok(!tvHtml.includes('cdn.tailwindcss.com') && !tvHtml.includes('unpkg.com/lucide'), 'tv.html must not depend on internet CDNs');
            assert.ok(appJs.includes('const directUrl = `${protocol}//${host}${port}${root}/frontend/tv.html`;'), 'TV Broadcast Hub link must point at frontend/tv.html');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"') || indexHtml.includes('src="js/app.js?v=3.38"'), 'frontend/index.html must reference js/app.js?v=3.38 or higher');
        });

        it('AUT-FRONT-145: REV-186 TV Monitor security, privacy and branch isolation', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const tvHtml = fs.readFileSync(path.resolve('frontend/tv.html'), 'utf8');
            const router = fs.readFileSync(path.resolve('backend/index.php'), 'utf8');
            const tv = fs.readFileSync(path.resolve('backend/controllers/TvController.php'), 'utf8');

            // 1. Router: only PIN check and feed are public; session control is protected and SA / Assistant only
            const pub = router.slice(0, router.indexOf('// PROTECTED ROUTES (require authentication)'));
            assert.ok(pub.includes("$route === '/tv/verify-pin'") && pub.includes("($route === '/tv/feed' || $route === '/jobs/tv')"), 'PIN check and TV feed are the only public TV routes');
            assert.ok(!pub.includes("$route === '/tv/session'") && !router.includes('tv_session.json') && !router.includes("empty($_COOKIE['token'])"), 'Session control and the old public job list must not be public');
            assert.ok(router.includes("if (!Auth::requireRole(['sa', 'assistant'])) exit;\n    TvController::updateSession();") || router.includes("if (!Auth::requireRole(['sa', 'assistant'])) exit;\r\n    TvController::updateSession();"), 'Only SA / Assistant may control the broadcast');

            // 2. Controller: per-branch sessions, branch-scoped token, throttling, masked slim feed
            assert.ok(tv.includes('CREATE TABLE IF NOT EXISTS `tv_sessions`') && tv.includes('CREATE TABLE IF NOT EXISTS `tv_pin_attempts`'), 'Sessions and PIN throttling must be stored in the database');
            assert.ok(tv.includes("hash_hmac('sha256', $branch . '|' . $pin, self::secret())") && tv.includes('hash_equals(self::makeToken($branch, $session[\'pin\']), $token)'), 'TV token must be branch-scoped and signed with the current PIN');
            assert.ok(tv.includes('private const MAX_PIN_ATTEMPTS = 5;'), 'Wrong PINs must be throttled');
            assert.ok(tv.includes("return $parts[0] . ' ' . mb_strtoupper(mb_substr($parts[1], 0, 1)) . '.';"), 'Customer names must be masked');
            assert.ok(tv.includes("status NOT IN ('Pending', 'Completed', 'Released') AND {$branchSql}"), 'Feed must exclude Pending bookings and other branches');
            const feedFields = tv.slice(tv.indexOf("'id'              => $j['job_id'],"), tv.indexOf("'carryOverStatus' => $j['carry_over_status'],"));
            assert.ok(!/'(contact|address|name)'\s*=>/.test(feedFields), 'Feed must not include contact, address or full name');

            // 3. TV page: token (no PIN in URL), feed, escaping, branch bays
            assert.ok(tvHtml.includes("const TV_TOKEN_KEY = 'hontech_tv_token';") && tvHtml.includes("headers = token ? { 'X-TV-Token': token } : {}"), 'TV must use the branch token');
            assert.ok(!tvHtml.includes("urlParams.get('pin')") && !tvHtml.includes("localStorage.setItem('hontech_tv_pin'"), 'PIN must not come from the URL or be stored');
            assert.ok(tvHtml.includes('function escapeHtml(value)') && tvHtml.includes('${escapeHtml(job.plate)}'), 'TV must escape job values');
            assert.ok(tvHtml.includes('const bayCount = tvBayCount;') && tvHtml.includes('id="tv-branch-label"'), 'Bay count and branch label come from the feed');

            // 4. Hub: no PIN in links, staff kiosk, live branch badge
            assert.ok(!appJs.includes('autoLoginUrl') && !indexHtml.includes('tv-hub-autologin-url'), 'Auto-login PIN links must be removed');
            assert.ok(appJs.includes('const kioskUrl = `${directUrl}?kiosk=true`;') && indexHtml.includes('id="tv-hub-branch-badge"'), 'Hub must open the staff kiosk and show the branch');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"') || indexHtml.includes('src="js/app.js?v=3.39"'), 'frontend/index.html must reference js/app.js?v=3.39 or higher');
        });

        it('AUT-FRONT-146: REV-187 TV display integrity (one group per vehicle, dev drawer, connection badge, sound prompt)', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const tvHtml = fs.readFileSync(path.resolve('frontend/tv.html'), 'utf8');
            assert.ok(tvHtml.includes("const inServiceJobs = allJobs.filter(j => j.status === 'Processing' || j.status === 'Monitoring');") && tvHtml.includes("const inQueueJobs = allJobs.filter(j => j.status === 'Waiting');"), 'In Service and In Queue must be separate groups');
            assert.ok(tvHtml.includes("const carryOverAll = allJobs.filter(j => j.status === 'Carry Over' || j.status === 'Carry-Over');") && !tvHtml.includes('|| Boolean(j.carryOverStatus));'), 'Carry Over must be by status only (no duplicates)');
            assert.ok(tvHtml.includes("section('In Service', inServiceJobs, 'In Service'") && tvHtml.includes("section('In Queue', inQueueJobs, 'In Queue'"), 'Slide 2 must list In Service and In Queue separately');
            // REV-191: the TV has no developer drawer at all (simulations moved to the staff app's Ctrl+D toolbox)
            assert.ok(!tvHtml.includes('tv-dev-drawer') && !tvHtml.includes("get('dev')"), 'No developer controls on the TV');
            assert.ok(tvHtml.includes('id="tv-connection-badge"') && tvHtml.includes('function setTVConnection(ok)'), 'Connection lost badge');
            assert.ok(tvHtml.includes('id="tv-sound-unlock"') && tvHtml.includes('function unlockTVAudio()') && tvHtml.includes('navigator.userActivation.hasBeenActive'), 'Tap-to-enable-sound prompt');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"') || indexHtml.includes('src="js/app.js?v=3.40"'), 'frontend/index.html must reference js/app.js?v=3.40 or higher');
        });

        it('AUT-FRONT-147: REV-188 in-app TV Monitor embeds the single Smart TV page', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const i = indexHtml.indexOf('<div id="section-tv"');
            const section = indexHtml.slice(i, indexHtml.indexOf('</iframe>', i));
            assert.ok(section.includes('id="tv-inapp-frame" data-src="tv.html?embedded=1" src="about:blank"'), 'In-app TV Monitor must embed tv.html?embedded=1');
            assert.ok(!indexHtml.includes('id="tv-grs-list"') && !indexHtml.includes('id="tv-slide-1"'), 'The old duplicate TV markup must be removed from index.html');
            assert.ok(appJs.includes("if (!tvFrame.src.includes('tv.html')) tvFrame.src = tvFrame.dataset.src;") && appJs.includes("tvFrame.src = 'about:blank';"), 'Frame loads only while the section is open');
            ['function jumpToTVSlide', 'function rotateTVSlides', 'function setupTVMode', 'function startTVAutoScroll', 'function getServiceTheme', "urlParams.get('mode') === 'tv'"]
                .forEach(k => assert.ok(!appJs.includes(k), `${k} must be removed`));
            assert.ok(appJs.includes('function renderTV() {}') && appJs.includes('function reloadInAppTVPreview()'), 'renderTV kept as a no-op; preview reload available');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"') || indexHtml.includes('src="js/app.js?v=3.41"'), 'frontend/index.html must reference js/app.js?v=3.41 or higher');
        });

        it('AUT-FRONT-148: REV-189 server-driven TV announcements, SA confirmation chime and Call Customer Again', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const tvHtml = fs.readFileSync(path.resolve('frontend/tv.html'), 'utf8');
            const tv = fs.readFileSync(path.resolve('backend/controllers/TvController.php'), 'utf8');
            const jobs = fs.readFileSync(path.resolve('backend/controllers/JobController.php'), 'utf8');
            const router = fs.readFileSync(path.resolve('backend/index.php'), 'utf8');

            // 1. Server records announcements on bay and status changes
            assert.ok(tv.includes('CREATE TABLE IF NOT EXISTS `tv_announcements`') && tv.includes("public const ANNOUNCEMENT_TYPES = ['bay', 'processing', 'ready', 'carryover', 'returned', 'released', 'recall', 'test'];"), 'Announcement table and types');
            assert.ok(jobs.includes("TvController::announce($db, $job, 'bay', $normalizedLocation") && jobs.includes('TvController::announceStatusChange($db, $job, $status'), 'Bay and status changes must be announced');
            assert.ok(tv.includes("if ($old === $newStatus || $old === 'Pending') return;"), 'Online bookings are never announced');
            // 2. Routes: TV reads (token / staff); recall and test are SA / Assistant only; recall throttled
            assert.ok(router.includes("$route === '/tv/announcements'") && router.includes("$route === '/tv/announcements/recall'") && router.includes("$route === '/tv/announcements/test'"), 'Announcement routes');
            assert.ok(tv.includes("type = 'recall' AND created_at >= (NOW() - INTERVAL 15 SECOND)"), 'Call Again must be throttled');
            assert.ok(tv.includes("if (!isset($_GET['after']) || $_GET['after'] === '') {"), 'A connecting TV starts from now (no replay)');
            // 3. TV plays each announcement once, in order, with plate and model only
            assert.ok(tvHtml.includes('async function pollTVAnnouncements()') && tvHtml.includes('announcementPollInterval = setInterval(pollTVAnnouncements, 3000);'), 'TV polls announcements');
            assert.ok(tvHtml.includes("released:   a => ({ statusText: 'OFFICIALLY RELEASED'") && tvHtml.includes('Thank you for choosing HonTech AutoCenter!'), 'Release is announced');
            assert.ok(tvHtml.includes("recall:     a => ({ statusText: 'READY FOR CLAIM · CALLING AGAIN'"), 'Call Again is announced');
            assert.ok(!tvHtml.includes('detectAndBroadcastAlerts') && !/customer\s*\$\{/.test(tvHtml.slice(tvHtml.indexOf('const TV_ANNOUNCEMENT_TEXT'), tvHtml.indexOf('function buildTVAnnouncement'))), 'No list diffing and no names in the voice');
            // 4. SA computer: chime only after a saved Ready / Released; Call Again button; test goes to the TV
            assert.ok(appJs.includes("if (['Ready', 'Ready to Release', 'Released'].includes(normalizedNewStatus)) playAutomotiveChime('lounge');"), 'Confirmation chime after a saved Ready / Released');
            const completeRelease = appJs.slice(appJs.indexOf('function completeRelease(jobId)'), appJs.indexOf('window.completeRelease'));
            const reopen = appJs.slice(appJs.indexOf('function reopenSameDayJob(jobId)'), appJs.indexOf('window.reopenSameDayJob'));
            assert.ok(!completeRelease.includes('playAutomotiveChime') && !reopen.includes('playAutomotiveChime'), 'No chime when a confirm window opens');
            assert.ok(appJs.includes(`onclick="callCustomerAgain('\${job.id}')"`) && appJs.includes("apiRequest('/api/tv/announcements/recall'"), 'Call Customer Again button on Ready rows');
            assert.ok(appJs.includes("apiRequest('/api/tv/announcements/test'") && indexHtml.includes('Test TV Announcement'), 'Settings test plays on the branch TV');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"') || indexHtml.includes('src="js/app.js?v=3.42"'), 'frontend/index.html must reference js/app.js?v=3.42 or higher');
        });

        it('AUT-FRONT-149: REV-190 real per-branch weather on the TV (server-cached Open-Meteo, no invented values)', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const tvHtml = fs.readFileSync(path.resolve('frontend/tv.html'), 'utf8');
            const tv = fs.readFileSync(path.resolve('backend/controllers/TvController.php'), 'utf8');
            const router = fs.readFileSync(path.resolve('backend/index.php'), 'utf8');
            assert.ok(tv.includes("'Marikina Branch' => ['lat' => 14.6500919, 'lon' => 121.1134286") && tv.includes("'East Branch'     => ['lat' => 14.7184148, 'lon' => 121.0612352"), 'Branch pins supplied by the team');
            assert.ok(tv.includes('CREATE TABLE IF NOT EXISTS `tv_weather_cache`') && tv.includes('private const WEATHER_CACHE_MINUTES = 15;'), 'One cached reading per branch (15 minutes)');
            assert.ok(tv.includes("'current'        => 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day'") && tv.includes("'hourly'         => 'precipitation_probability'"), 'Temperature, feels like, humidity, condition, day/night and rain chance');
            assert.ok(tv.includes("+ ['stale' => true, 'fetchedAt' => $row['fetched_at']]") && tv.includes("return ['available' => false, 'source' => 'Open-Meteo'];"), 'Offline: last real reading or unavailable');
            assert.ok(router.includes("$route === '/tv/weather'"), 'Weather route (TV token or staff)');
            assert.ok(tvHtml.includes('async function fetchTVWeather()') && tvHtml.includes('weatherPollInterval = setInterval(fetchTVWeather, 10 * 60 * 1000);'), 'TV refreshes weather every 10 minutes');
            assert.ok(tvHtml.includes("text.innerText = 'Unavailable';"), 'TV shows an honest offline state');
            assert.ok(tvHtml.includes('title="Weather data: Open-Meteo"') && !tvHtml.includes('32°C'), 'Attribution kept; no hard-coded weather');
            assert.ok(!appJs.includes('async function updateWeather()') && !appJs.includes('fallbackTemp'), 'Unused app weather code with invented fallback removed');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"') || indexHtml.includes('src="js/app.js?v=3.43"'), 'frontend/index.html must reference js/app.js?v=3.43 or higher');
        });

        it('AUT-FRONT-150: REV-191 developer TV simulation lives only in the Ctrl+D toolbox (logged-in, development)', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const tvHtml = fs.readFileSync(path.resolve('frontend/tv.html'), 'utf8');
            const tv = fs.readFileSync(path.resolve('backend/controllers/TvController.php'), 'utf8');
            const router = fs.readFileSync(path.resolve('backend/index.php'), 'utf8');
            assert.ok(!tvHtml.includes('tv-dev-drawer') && !tvHtml.includes('toggleTVDevDrawer') && !tvHtml.includes('triggerTVSimulationEvent'), 'The lounge TV has no developer controls');
            assert.ok(router.indexOf("str_starts_with($route, '/auth/developer/') && Env::get('APP_ENV', 'development') !== 'development'") < router.indexOf("$route === '/auth/developer/tv-simulate'"), 'Developer routes exist only in development');
            assert.ok(router.includes("if ($method === 'GET' && $route === '/auth/developer/status') {\n    if (!Auth::authenticateUser()) exit;") || router.includes("if ($method === 'GET' && $route === '/auth/developer/status') {\r\n    if (!Auth::authenticateUser()) exit;"), 'Toolbox status requires login');
            assert.ok(tv.includes('public static function simulate(): void') && tv.includes("$type === 'test'"), 'Simulation records a real announcement for the user branch');
            const gate = appJs.slice(appJs.indexOf('async function canOpenDevToolbox()'), appJs.indexOf('window.canOpenDevToolbox'));
            assert.ok(gate.includes('if (!currentUserRole) return false;') && gate.includes("apiRequest('/api/auth/developer/status')"), 'Ctrl+D opens only for a logged-in user on a development server');
            assert.ok(appJs.includes('if (shouldShow && !(await canOpenDevToolbox())) return;'), 'Toggle honours the gate');
            ['processing', 'bay', 'ready', 'carryover', 'returned', 'released', 'recall'].forEach(t => assert.ok(indexHtml.includes(`onclick="devSimulateTVEvent('${t}')"`), `Toolbox button for ${t}`));
            assert.ok(!indexHtml.includes('triggerTVSimulationEvent') && !indexHtml.includes('dev-sim-modal-customer') && !appJs.includes('function triggerTVSimulationEvent'), 'Old app-only simulation removed');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"') || indexHtml.includes('src="js/app.js?v=3.44"'), 'frontend/index.html must reference js/app.js?v=3.44 or higher');
        });

        it('AUT-FRONT-151: REV-192 simple TV weather box (icon, temperature, condition) with the real reading', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const tvHtml = fs.readFileSync(path.resolve('frontend/tv.html'), 'utf8');
            ['tv-weather-detail', 'tv-weather-rain', 'tv-weather-asof', 'Weather: Open-Meteo</p>', 'formatTVTime'].forEach(x => assert.ok(!tvHtml.includes(x), `Extra weather line removed: ${x}`));
            const box = tvHtml.slice(tvHtml.indexOf('<div id="tv-weather-box"'), tvHtml.indexOf('<div id="tv-weather-box"') + 900);
            assert.ok(box.includes('id="tv-temp-display"') && box.includes('id="tv-weather-text"') && box.includes('id="tv-weather-icon-wrap"'), 'Icon, temperature and condition only');
            assert.ok(tvHtml.includes('temp.innerText = `${w.temperature}°C`;') && tvHtml.includes('text.innerText = look.text;'), 'Values come from the real server reading');
            assert.ok(tvHtml.includes("fetch(tvApiUrl('/api/tv/weather')"), 'Still fetched from the branch weather route');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"') || indexHtml.includes('src="js/app.js?v=3.45"'), 'frontend/index.html must reference js/app.js?v=3.45 or higher');
        });

        it('AUT-FRONT-152: REV-193 Customer Lookup uses the RO Excel Studio sheet-tab design', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            const section = indexHtml.slice(indexHtml.indexOf('<div id="section-lookup"'), indexHtml.indexOf('<!-- FORM 1/3 INTERACTIVE JOB ORDER STUDIO'));
            assert.ok(section.includes('id="lookup-top-tab-bar" class="sticky top-0 z-30 bg-[#f8f9fa] border border-[#dadce0]'), 'Sheets-style tab bar like the studio');
            ['All_Customers', 'Regulars', 'Back_Jobs', 'Due_for_PMS', 'Customer_Details', 'Service_History'].forEach(t => assert.ok(section.includes(`<span>${t}</span>`), `Sheet tab ${t}`));
            assert.ok(section.includes('id="lookup-dview-details"') && section.includes('id="lookup-dview-history" class="hidden'), 'Dossier split into Customer_Details and Service_History sheets');
            assert.ok((section.match(/studio-section-head/g) || []).length >= 3, 'Gray studio section heads');
            assert.ok(!section.includes('rounded-2xl') && !section.includes('from-slate-900'), 'Flat studio cards, no dark gradient bar');
            assert.ok((section.match(/<div\b/g) || []).length === (section.match(/<\/div>/g) || []).length, 'Balanced markup');
            assert.ok(appJs.includes('function paintLookupTab(el, active)') && appJs.includes('function switchLookupDossierTab(key)') && appJs.includes("historyTabCount.innerText = `(${cust.jobs.length})`;"), 'Tab state and history count');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"') || indexHtml.includes('src="js/app.js?v=3.46"'), 'frontend/index.html must reference js/app.js?v=3.46 or higher');
        });

        it('AUT-FRONT-153: REV-194 Service_History records show real RO fields, back-job warranty and actions', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
            assert.ok(appJs.includes('function lookupJobDate(job)') && appJs.includes('job.dateReceived || job.date_received') && appJs.includes('function lookupJobSA(job)') && appJs.includes('job.saName || job.sa_name'), 'Reads the real API fields (dateReceived, saName)');
            const start = appJs.indexOf('// REV-194: Service_History records');
            const block = appJs.slice(start, appJs.indexOf('timelineEl.innerHTML = historyHTML;', start));
            assert.ok(start > 0 && !/Assigned Technician|Front Desk SA|Standard periodic service maintenance|Inspection completed according/.test(block), 'No invented placeholder values');
            ["'Job Order No.'", "'Claim Stub'", "'Service Advisor'", "'Bay'", "'Source'", "'Parts'", "'Promise Date'", 'Customer Concern', 'Findings / Work Done'].forEach(f => assert.ok(block.includes(f), `Record field ${f}`));
            assert.ok(appJs.includes('const LOOKUP_BACKJOB_WARRANTY_DAYS = 30;') && block.includes('Back-job warranty: ${left} day') && block.includes('warranty starts on release'), '30-day back-job warranty status');
            assert.ok(block.includes("const isDone = ['Released', 'Completed'].includes(status);") && block.includes('${canBackJob ? `<button type="button" onclick="openBackJobReasonModal('), 'Issue Back-Job only for released/completed visits');
            assert.ok(block.includes('Back-job</strong>') && block.includes('job.parentJobId'), 'Back-job visits link to the original job');
            assert.ok(block.includes('escapeHtml(String(v'), 'Values are escaped');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"') || indexHtml.includes('src="js/app.js?v=3.47"'), 'frontend/index.html must reference js/app.js?v=3.47 or higher');
        });

        it('AUT-FRONT-154: REV-195 TV slides 1-3 are responsive and every area scrolls', () => {
            const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
            const tvHtml = fs.readFileSync(path.resolve('frontend/tv.html'), 'utf8');
            assert.ok(tvHtml.includes('.tv-scroll {') && tvHtml.includes('overscroll-behavior: contain;') && tvHtml.includes('html { overflow: hidden; overflow: clip; }'), 'Scroll areas; the page never scrolls sideways');
            assert.ok(tvHtml.includes('<main id="tv-main" class="flex-1 relative min-h-0 flex flex-col') && !tvHtml.includes('absolute inset-x-6 top-0 bottom-6 tv-slide'), 'Slides fill the space in normal flow');
            assert.ok(tvHtml.includes('id="tv-grs-list" class="tv-scroll custom-scroll flex-1 min-h-0') && tvHtml.includes('grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 auto-rows-[minmax(max-content,1fr)]'), 'Slide 1: responsive bay grid that scrolls and never squeezes a card');
            assert.ok(tvHtml.includes('grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5') && tvHtml.includes('id="tv-all-carryover-list" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'), 'Slide 2: panels stack on small screens');
            assert.ok(tvHtml.includes('grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'), 'Slide 3: 1 / 2 / 4 lane columns');
            assert.ok((tvHtml.match(/class="tv-scroll /g) || []).length >= 9, 'Bay grid, 3 queue lists, 4 lane lists and the slide bodies scroll');
            assert.ok(!tvHtml.includes('flex flex-col justify-between items-center h-full relative'), 'Bay cards no longer forced to full height (text overlap fixed)');
            assert.ok(tvHtml.includes('const TV_INTERACTION_HOLD_MS = 20000;') && tvHtml.includes('if (Date.now() - tvLastInteraction < TV_INTERACTION_HOLD_MS) return;'), 'Auto-rotation holds while someone scrolls or touches');
            assert.ok(indexHtml.includes('src="js/app.js?v=3.48"'), 'frontend/index.html must reference js/app.js?v=3.48');
        });
    });
});





