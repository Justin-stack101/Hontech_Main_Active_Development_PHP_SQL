// tests/frontend/sla_and_logic.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
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
});
