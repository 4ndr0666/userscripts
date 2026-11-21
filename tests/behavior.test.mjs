#!/usr/bin/env node
/**
 * tests/behavior.test.mjs — v2.0.0 Behavioral & Runtime Smoke Suite
 * Runs kernel unit tests, kernel-boundary safety, family fixtures,
 * watermark batch, normalization symmetry, and QR round-trip checks.
 */

import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const SUITES = [
    ["kernel-smoke", "tools/kernel-smoke.mjs"],
    ["kernel-boundary-smoke", "tools/kernel-boundary-smoke.mjs"],
    ["family-fixture-smoke", "tools/family-fixture-smoke.mjs"],
    ["watermark-batch-smoke", "tools/watermark-batch-smoke.mjs"],
    ["norm-symmetry-smoke", "tools/norm-symmetry-smoke.mjs"],
    ["qr-verify", "tools/qr-verify.mjs"],
];

console.log("── tests/behavior.test.mjs (v2.0.0) ───────────────────────────────");

let failed = 0;
for (const [label, rel] of SUITES) {
    const res = spawnSync(process.execPath, [path.join(ROOT, rel)], {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 120000,
    });
    if (res.status === 0) {
        console.log(`  ✓ ${label}: PASS`);
    } else {
        console.error(`  ✗ ${label}: FAIL (exit ${res.status})`);
        if (res.stdout) console.error(res.stdout.trim().slice(-400));
        if (res.stderr) console.error(res.stderr.trim().slice(-400));
        failed++;
    }
}

if (failed > 0) {
    console.error(`\nBEHAVIOR SUITE FAILED (${failed}/${SUITES.length} failed)`);
    process.exit(1);
}
console.log(`\nBEHAVIOR SUITE: ALL PASS (${SUITES.length}/${SUITES.length})`);
process.exit(0);
