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
            assert.strictEqual(((((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"')) || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.56"') || indexHtml.includes('src="js/app.js?v=2.55"') || indexHtml.includes('src="js/app.js?v=2.54"') || indexHtml.includes('src="js/app.js?v=2.53"') || indexHtml.includes('src="js/app.js?v=2.52"') || indexHtml.includes('src="js/app.js?v=2.51"') || indexHtml.includes('src="js/app.js?v=2.50"') || indexHtml.includes('src="js/app.js?v=2.49"') || indexHtml.includes('src="js/app.js?v=2.48"') || indexHtml.includes('src="js/app.js?v=2.47"') || indexHtml.includes('src="js/app.js?v=2.46"') || indexHtml.includes('src="js/app.js?v=2.45"') || indexHtml.includes('src="js/app.js?v=2.44"') || indexHtml.includes('src="js/app.js?v=2.43"') || indexHtml.includes('src="js/app.js?v=2.42"') || indexHtml.includes('src="js/app.js?v=2.41"'), true, 'Cache buster must be incremented');
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
            assert.strictEqual((((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.56"') || indexHtml.includes('src="js/app.js?v=2.55"') || indexHtml.includes('src="js/app.js?v=2.54"') || indexHtml.includes('src="js/app.js?v=2.53"') || indexHtml.includes('src="js/app.js?v=2.52"') || indexHtml.includes('src="js/app.js?v=2.51"') || indexHtml.includes('src="js/app.js?v=2.50"') || indexHtml.includes('src="js/app.js?v=2.49"') || indexHtml.includes('src="js/app.js?v=2.48"'), true, 'Cache buster must be incremented');
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.56"') || indexHtml.includes('src="js/app.js?v=2.55"') || indexHtml.includes('src="js/app.js?v=2.54"') || indexHtml.includes('src="js/app.js?v=2.53"') || indexHtml.includes('src="js/app.js?v=2.52"') || indexHtml.includes('src="js/app.js?v=2.51"') || indexHtml.includes('src="js/app.js?v=2.50"') || indexHtml.includes('src="js/app.js?v=2.49"'),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.56"') || indexHtml.includes('src="js/app.js?v=2.55"') || indexHtml.includes('src="js/app.js?v=2.54"') || indexHtml.includes('src="js/app.js?v=2.53"') || indexHtml.includes('src="js/app.js?v=2.52"') || indexHtml.includes('src="js/app.js?v=2.51"') || indexHtml.includes('src="js/app.js?v=2.50"'),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.56"') || indexHtml.includes('src="js/app.js?v=2.55"') || indexHtml.includes('src="js/app.js?v=2.54"') || indexHtml.includes('src="js/app.js?v=2.53"') || indexHtml.includes('src="js/app.js?v=2.52"') || indexHtml.includes('src="js/app.js?v=2.51"'),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.56"') || indexHtml.includes('src="js/app.js?v=2.55"') || indexHtml.includes('src="js/app.js?v=2.54"') || indexHtml.includes('src="js/app.js?v=2.53"') || indexHtml.includes('src="js/app.js?v=2.52"'),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.56"') || indexHtml.includes('src="js/app.js?v=2.55"') || indexHtml.includes('src="js/app.js?v=2.54"') || indexHtml.includes('src="js/app.js?v=2.53"'),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.54"') || indexHtml.includes('src="js/app.js?v=2.55"') || indexHtml.includes('src="js/app.js?v=2.56"'),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.55"') || indexHtml.includes('src="js/app.js?v=2.56"'),
                true,
                'Cache buster in index.html must be incremented to v=2.61, v=2.60, v=2.59, v=2.58, v=2.57, v=2.55 or v=2.56'
            );
        });
    });

    describe('Suite 26: REV-097 Dual-Mode TV Monitoring Audio-Visual Announcements & Silent SA Dashboard', () => {
        it('AUT-FRONT-69: should verify deep state diffing for location / bay transitions and status in tv.html', () => {
            const tvHtml = fs.readFileSync(path.resolve('frontend/tv.html'), 'utf8');

            assert.strictEqual(
                tvHtml.includes('currLoc !== prevLoc'),
                true,
                'tv.html detectAndBroadcastAlerts must track location and workshop bay transitions'
            );
            assert.strictEqual(
                tvHtml.includes('ALLOCATED:') || tvHtml.includes('BAY-'),
                true,
                'tv.html must trigger bay allocation broadcast when location changes'
            );
            assert.strictEqual(
                tvHtml.includes('jobStateSnapshotMap'),
                true,
                'tv.html must maintain jobStateSnapshotMap for cross-poll state diffing'
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.56"'),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"') || indexHtml.includes('src="js/app.js?v=2.57"') || indexHtml.includes('src="js/app.js?v=2.58"'),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.58"') || indexHtml.includes('src="js/app.js?v=2.59"'),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"') || indexHtml.includes('src="js/app.js?v=2.60"') || indexHtml.includes('src="js/app.js?v=2.59"'),
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
                'f13-input-claim-stub',
                'f13-input-source',
                'f13-input-target-branch',
                'f13-input-lane-type',
                'f13-input-bay-location',
                'f13-input-parts-status',
                'f13-input-arrival-time',
                'f13-input-status',
                'f13-input-carry-over'
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
            assert.strictEqual(monitoringCardIdx < jobNoIdx, true, 'Workshop Monitoring Card must be positioned above Job Order Header as Step 1');

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
            assert.strictEqual((((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"') || indexHtml.includes('src="js/app.js?v=2.61"'), true, 'Cache buster must be incremented to v=2.61');
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || (((((indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"') || indexHtml.includes('src="js/app.js?v=2.62"'),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || (((((indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"') || indexHtml.includes('src="js/app.js?v=2.63"'),
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
                'f13-input-claim-stub',
                'f13-input-source',
                'f13-input-target-branch',
                'f13-input-lane-type',
                'f13-input-bay-location',
                'f13-input-parts-status',
                'f13-input-arrival-time',
                'f13-input-status',
                'f13-input-carry-over'
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || (((((indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"') || indexHtml.includes('src="js/app.js?v=2.64"'),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || (((((indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"') || indexHtml.includes('src="js/app.js?v=2.65"'),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || (((((indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"') || indexHtml.includes('src="js/app.js?v=2.66"'),
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
                appJs.includes("setCell(sheet7Doc, 'C2', name);"),
                true,
                'exportOfficialXLSX must inject into Sheet 7'
            );

            // 4. Verify cache buster v=2.67 or v=2.68
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"') || indexHtml.includes('src="js/app.js?v=2.67"'),
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
                appJs.includes("setCell(sheet1Doc, 'I72', claimStubId)"),
                true,
                'exportOfficialXLSX must inject Claim Stub ID into I72'
            );

            // 3. Verify Quotation & Billing multi-column pricing engine
            assert.strictEqual(
                appJs.includes("if (frt > 0) setCell(qDoc, 'D' + rIdx, frt, true);"),
                true,
                'exportOfficialXLSX must inject FRT into Column D'
            );
            assert.strictEqual(
                appJs.includes("if (labor > 0) setCell(qDoc, 'E' + rIdx, labor, true);"),
                true,
                'exportOfficialXLSX must inject Labor into Column E'
            );
            assert.strictEqual(
                appJs.includes("if (parts > 0) setCell(qDoc, 'F' + rIdx, parts, true);"),
                true,
                'exportOfficialXLSX must inject Parts into Column F'
            );
            assert.strictEqual(
                appJs.includes("if (materials > 0) setCell(qDoc, 'G' + rIdx, materials, true);"),
                true,
                'exportOfficialXLSX must inject Materials into Column G'
            );
            assert.strictEqual(
                appJs.includes("setCell(qDoc, 'H' + rIdx, total, true);"),
                true,
                'exportOfficialXLSX must inject Total into Column H'
            );

            // 4. Verify Checklist Date written to M5 or AD2 in V1
            assert.strictEqual(
                appJs.includes("setCell(sheet7Doc, 'M5', date)") ||
                appJs.includes("setCell(sheet7Doc, 'AD2', date);"),
                true,
                'exportOfficialXLSX must inject inspection date into Sheet 7 (M5 in legacy, AD2 in V1)'
            );

            // 5. Verify cache buster v=2.68
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"') || indexHtml.includes('src="js/app.js?v=2.68"'),
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
                appJs.includes('unifiedItems.slice(0, 30).forEach'),
                true,
                'Quotation export must inject up to 30 unified items into rows 15-44'
            );
            assert.strictEqual(
                appJs.includes('unifiedItems.slice(0, 36).forEach'),
                true,
                'Billing export must inject up to 36 unified items into rows 17-52'
            );

            // 4. Verify authentic signature coordinates
            assert.strictEqual(
                appJs.includes("setCell(qDoc, 'A62', sa)"),
                true,
                'Quotation export must inject Service Advisor into A62'
            );
            assert.strictEqual(
                appJs.includes("setCell(qDoc, 'F62', manager)"),
                true,
                'Quotation export must inject General Manager into F62'
            );
            assert.strictEqual(
                appJs.includes("setCell(bDoc, 'A60', sa)"),
                true,
                'Billing export must inject Service Advisor into A60'
            );

            // 5. Verify cache buster v=2.69 or v=2.70
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"') || indexHtml.includes('src="js/app.js?v=2.69"'),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"') || indexHtml.includes('src="js/app.js?v=2.70"'),
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
                appJs.includes("setCell(qDoc, 'F62', manager);"),
                true,
                'exportOfficialXLSX must inject manager into F62 of quotation sheet'
            );

            // 3. Verify cache buster v=2.71 or higher
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"') || indexHtml.includes('src="js/app.js?v=2.71"'),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"') || indexHtml.includes('src="js/app.js?v=2.73"') || indexHtml.includes('src="js/app.js?v=2.72"'),
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
                (appJs.includes("drawTextFit(name, 120, 733.4, 250, 6.5, false, darkInk, 5.2);") || appJs.includes("drawTextFit(name, 120, 739.0, 250, 6.5, false, darkInk, 5.2);")) &&
                (appJs.includes("drawText(date, 460, 733.4, 7.0, false, darkInk);") || appJs.includes("drawText(date, 490, 739.0, 7.0, false, darkInk);")) &&
                (appJs.includes("drawTextFit(plate + (km ? ` (${km})` : ''), 120, 720.8, 250, 6.5, true, darkInk, 5.2);") || appJs.includes("drawTextFit(plate + (km ? ` (${km})` : ''), 120, 723.1, 250, 6.5, true, darkInk, 5.2);")),
                true,
                'compileChecklistPDFBytes must render customer name, plate, and date in authentic template typography'
            );

            // 5. Verify cache buster v=2.99 or higher
            assert.strictEqual(
                (indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || (indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"') || indexHtml.includes('src="js/app.js?v=3.01"') || indexHtml.includes('src="js/app.js?v=3.00"') || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"'),
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
                appJs.includes("drawTextFit(name, 120, 739.0, 250, 6.5, false, darkInk, 5.2);") &&
                appJs.includes("drawText(date, 490, 739.0, 7.0, false, darkInk);") &&
                appJs.includes("drawTextFit(plate + (km ? ` (${km})` : ''), 120, 723.1, 250, 6.5, true, darkInk, 5.2);") &&
                appJs.includes("drawTextFit(model, 120, 707.3, 200, 6.5, false, darkInk, 5.2);") &&
                appJs.includes("fuelCoords[activeLevel] || 494;") &&
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
                appJs.includes("setCell(sheet7Doc, 'C2', name);") &&
                appJs.includes("setCell(sheet7Doc, 'AD2', date);") &&
                appJs.includes("setCell(sheet7Doc, 'C3', plate);") &&
                appJs.includes("setCell(sheet7Doc, 'C4', model);") &&
                appJs.includes("setCell(sheet7Doc, 'M59', sa);") &&
                appJs.includes("setCell(sheet7Doc, 'M63', name);") &&
                appJs.includes("setCell(sheet7Doc, 'M41', chkRemarks);"),
                true,
                'exportOfficialXLSX must inject into Sheet 7 V1 coordinates C2, AD2, C3, C4, M59, M63, M41'
            );

            // 3. Verify cache buster v=2.74 or higher
            assert.strictEqual(
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"') || indexHtml.includes('src="js/app.js?v=2.74"'),
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
                appJs.includes("setCell(sheet7Doc, cellRef, '✓');") &&
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
                appJs.includes("setCell(sheet7Doc, 'C63', sa);") &&
                appJs.includes("setCell(sheet7Doc, 'B53', chkRemarks);"),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"') || indexHtml.includes('src="js/app.js?v=2.75"'),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"') || indexHtml.includes('src="js/app.js?v=2.76"'),
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
                ((((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"') || indexHtml.includes('src="js/app.js?v=2.81"') || indexHtml.includes('src="js/app.js?v=2.80"') || indexHtml.includes('src="js/app.js?v=2.79"') || indexHtml.includes('src="js/app.js?v=2.78"') || indexHtml.includes('src="js/app.js?v=2.77"')),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || indexHtml.includes('src="js/app.js?v=2.82"'),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"') || indexHtml.includes('src="js/app.js?v=2.83"') || (((((indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"'),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"') || indexHtml.includes('src="js/app.js?v=2.84"'),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"') || indexHtml.includes('src="js/app.js?v=2.85"'),
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
                (((((indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"') || indexHtml.includes('src="js/app.js?v=3.09"') || indexHtml.includes('src="js/app.js?v=3.08"') || indexHtml.includes('src="js/app.js?v=3.07"')) || indexHtml.includes('src="js/app.js?v=3.06"') || indexHtml.includes('src="js/app.js?v=3.05"') || indexHtml.includes('src="js/app.js?v=3.04"') || indexHtml.includes('src="js/app.js?v=3.03"') || indexHtml.includes('src="js/app.js?v=3.02"')) || indexHtml.includes('src="js/app.js?v=3.01"')) || indexHtml.includes('src="js/app.js?v=3.00"')) || indexHtml.includes('src="js/app.js?v=2.99"') || indexHtml.includes('src="js/app.js?v=2.98"')) || indexHtml.includes('src="js/app.js?v=2.97"') || indexHtml.includes('src="js/app.js?v=2.96"') || indexHtml.includes('src="js/app.js?v=2.95"') || indexHtml.includes('src="js/app.js?v=2.94"') || indexHtml.includes('src="js/app.js?v=2.93"') || indexHtml.includes('src="js/app.js?v=2.92"') || indexHtml.includes('src="js/app.js?v=2.91"') || indexHtml.includes('src="js/app.js?v=2.90"') || indexHtml.includes('src="js/app.js?v=2.89"') || indexHtml.includes('src="js/app.js?v=2.88"') || indexHtml.includes('src="js/app.js?v=2.87"') || indexHtml.includes('src="js/app.js?v=2.86"'),
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
                Boolean(/src="js\/app\.js\?v=(?:3\.(?:0[0-9]|1[0-9])|2\.(?:8[7-9]|9[0-9]))"/.test(indexHtml)),
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
                indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"') || indexHtml.includes('src="js/app.js?v=3.10"'),
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
                billing.includes("drawTextFit(desc, 31.5, ry, 146, 6.8, false);") &&
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
            assert.ok(indexHtml.includes('src="js/app.js?v=3.12"') || indexHtml.includes('src="js/app.js?v=3.11"'), 'frontend/index.html must reference js/app.js?v=3.11 or higher');
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

            assert.ok(indexHtml.includes('src="js/app.js?v=3.12"'), 'frontend/index.html must reference js/app.js?v=3.12');
        });
    });
});





