#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/size-budget.mjs — dist size budget gate (v2.0.0)
 * ----------------------------------------------------------------------------
 * Enforces deterministic byte-size ceilings on all built dist/*.user.js
 * installables:
 *   - Hard ceiling: 1,300,000 B (fail closed on any artifact above ceiling).
 *   - Audit line:   1,000,000 B (artifacts >= 1.0 MB must be explicitly
 *                   budgeted in AUDITED_LARGE_SCRIPTS with a per-script cap).
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const HARD_LIMIT = 1_300_000;
const AUDIT_LINE = 1_000_000;

/* Explicitly audited large-asset installables (>= 1.0 MB) and their ceilings */
const AUDITED_LARGE_SCRIPTS = {
    "4ndr0tools - Prompt Master.user.js": {
        maxBytes: 1_300_000,
        rationale: "Embedded prompt library templates, UI assets, and NetHook kernel",
    },
    "4ndr0tools - Watermark++.user.js": {
        maxBytes: 1_300_000,
        rationale: "Embedded reverse-alpha watermark removal masks and NetHook kernel",
    },
};

export function runSizeBudget(root = DEFAULT_ROOT) {
    const problems = [];
    const stats = { files: 0, overAuditLine: [], largest: null, largestBytes: 0, auditedCount: 0 };

    const dist = path.join(root, "dist");
    if (!fs.existsSync(dist)) return { problems: ["dist/ directory not found"], ...stats };
    const files = fs.readdirSync(dist).filter((f) => f.endsWith(".user.js")).sort();
    stats.files = files.length;

    for (const f of files) {
        const bytes = fs.statSync(path.join(dist, f)).size;
        if (bytes > stats.largestBytes) {
            stats.largestBytes = bytes;
            stats.largest = f;
        }
        if (bytes > HARD_LIMIT) {
            problems.push(`dist/${f}: ${bytes.toLocaleString()} B exceeds the ${HARD_LIMIT.toLocaleString()} B hard ceiling`);
        } else if (bytes >= AUDIT_LINE) {
            stats.overAuditLine.push(`${f} (${bytes.toLocaleString()} B)`);
            const budget = AUDITED_LARGE_SCRIPTS[f];
            if (!budget) {
                problems.push(`dist/${f}: ${bytes.toLocaleString()} B exceeds the 1,000,000 B audit line without an explicit budget entry`);
            } else if (bytes > budget.maxBytes) {
                problems.push(`dist/${f}: ${bytes.toLocaleString()} B exceeds its audited budget ceiling of ${budget.maxBytes.toLocaleString()} B`);
            } else {
                stats.auditedCount++;
            }
        }
    }
    return { problems, ...stats };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const root = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_ROOT;
    const r = runSizeBudget(root);
    console.log(`size budget: ${r.files} dist files, largest ${r.largest} at ${r.largestBytes.toLocaleString()} B; ${r.overAuditLine.length} over 1.0 MB (${r.auditedCount} explicitly budgeted)`);
    if (r.problems.length) {
        for (const p of r.problems) console.error(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("  ✓ SIZE BUDGET: PASS");
}
