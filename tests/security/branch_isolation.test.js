// tests/security/branch_isolation.test.js
// REV-142: Service Advisor branch lock for pending Online bookings (read + write side)
import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const runPhp = (code) => execFileSync('php', ['-r', `require 'backend/vendor/autoload.php'; ${code}`], { encoding: 'utf8' }).trim();

describe('REV-142 Branch Isolation: SA Online Booking Lock', () => {
    const repoPhp = fs.readFileSync('backend/repositories/JobRepository.php', 'utf8');
    const controllerPhp = fs.readFileSync('backend/controllers/JobController.php', 'utf8');

    it('SEC-BR-01: getFilteredJobs must withhold other branches\' pending Online bookings from SAs', () => {
        assert.ok(
            repoPhp.includes("if ($user['role'] === 'sa') {") &&
            repoPhp.includes("(NOT (source = 'Online' AND status = 'Pending') OR {$branchSql})"),
            'JobRepository::getFilteredJobs must add an SA-only pending-online branch condition'
        );
    });

    it('SEC-BR-02: branchMatchSql must cover every stored alias of each branch', () => {
        const out = JSON.parse(runPhp(`echo json_encode([
            App\\Repositories\\JobRepository::branchMatchSql('Marikina Branch'),
            App\\Repositories\\JobRepository::branchMatchSql('East Branch'),
            App\\Repositories\\JobRepository::branchMatchSql('Branch B'),
        ]);`));
        assert.match(out[0][0], /'Branch A'/);
        assert.match(out[0][0], /branch IS NULL/);
        assert.deepStrictEqual(out[0][1], []);
        assert.match(out[1][0], /'East Branch'/);
        assert.match(out[1][0], /'Regalado Branch'/);
        assert.match(out[1][0], /'Branch B'/);
        assert.strictEqual(out[2][0], out[1][0], "'Branch B' must resolve to the same East/Regalado condition");
    });

    it('SEC-BR-03: isSameBranch must equate legacy aliases and separate the two branches', () => {
        const out = JSON.parse(runPhp(`use App\\Repositories\\JobRepository as R; echo json_encode([
            R::isSameBranch('Branch A', 'Marikina Branch'),
            R::isSameBranch('', 'Marikina Branch'),
            R::isSameBranch('Branch B', 'East Branch'),
            R::isSameBranch('Regalado Branch', 'East Branch'),
            R::isSameBranch('East Branch', 'Marikina Branch'),
            R::isSameBranch('Branch B', 'Branch A'),
        ]);`));
        assert.deepStrictEqual(out, [true, true, true, true, false, false]);
    });

    it('SEC-BR-04: SA write access to Online bookings is no longer exempt from the branch check', () => {
        assert.strictEqual(
            controllerPhp.includes("!($user['role'] === 'sa' && ($job['source'] ?? '') === 'Online')"),
            false,
            'The cross-branch SA Online exemption must be removed from JobController'
        );
        const guards = controllerPhp.match(/!JobRepository::isSameBranch\(\$job\['branch'\] \?\? '', \$user\['branch'\] \?\? ''\)/g) || [];
        assert.strictEqual(guards.length, 3, 'updateJobField, setJobStatus and deleteJob must all use the alias-aware branch guard');
    });

    it('SEC-BR-05: booking handover (fromBookingId) must be SA-only, pending-only and branch-checked', () => {
        assert.ok(controllerPhp.includes("if ($fromBookingId !== null && $user['role'] === 'sa') {"));
        assert.ok(controllerPhp.includes("AND is_deleted = 0 AND source = 'Online' AND status = 'Pending'"));
        assert.ok(controllerPhp.includes("This online booking belongs to another branch."));
    });
});
