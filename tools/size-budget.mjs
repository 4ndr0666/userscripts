#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/size-budget.mjs — dist size budget gate (suite v1.5.0)
 * ----------------------------------------------------------------------------
 * Round mandate (workorder G6): no dist artifact may exceed 1,300,000 B
 * (hard fail); any artifact at or above 1,000,000 B requires a decomposed-
 * asset audit record at documentation/<script>/SIZE-AUDIT.md stating what
 * the weight consists of, what was externalized-where-legal, and what is
 * justified as irreducible — so the parse cost every page load pays is an
 * audited decision, not an accident.
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const HARD_LIMIT = 1_300_000;
const AUDIT_LINE = 1_000_000;

export function runSizeBudget(root = DEFAULT_ROOT) {
    const problems = [];
    const stats = { files: 0, overAuditLine: [], largest: null, largestBytes: 0, auditRecords: 0 };

    const dist = path.join(root, "dist");
    if (!fs.existsSync(dist)) return { problems, ...stats };
    const files = fs.readdirSync(dist).filter((f) => f.endsWith(".user.js"));
    stats.files = files.length;

    for (const f of files) {
        const bytes = fs.statSync(path.join(dist, f)).size;
        if (bytes > stats.largestBytes) { stats.largestBytes = bytes; stats.largest = f; }
        if (bytes > HARD_LIMIT) {
            problems.push(`dist/${f}: ${bytes.toLocaleString()} B exceeds the 1,300,000 B hard budget (decompose or trim before this can ship)`);
        } else if (bytes >= AUDIT_LINE) {
            stats.overAuditLine.push(`${f} (${bytes.toLocaleString()} B)`);
            /* the audit record: documentation/<script-dir>/SIZE-AUDIT.md */
            const base = f.replace(/^4ndr0tools - /, "").replace(/\.user\.js$/, "");
            const docDir = findDocDir(root, base);
            const auditPath = docDir ? path.join(docDir, "SIZE-AUDIT.md") : null;
            if (!auditPath || !fs.existsSync(auditPath)) {
                problems.push(`dist/${f}: ${bytes.toLocaleString()} B is over the 1,000,000 B audit line with NO decomposed-asset audit record (expected documentation/<script>/SIZE-AUDIT.md)`);
            } else {
                /* WO-01 round-2 (6-d F1): the record's byte count is now
                 * VERIFIED, not merely present — round-1's "re-measured"
                 * watermark record carried the pre-round baseline number
                 * (1,286,666 B vs the actual 1,287,132 B) and its
                 * composition table did not even partition; existence-only
                 * checking let the drift ride a CERTIFIED gate. The verifiable
                 * anchor is the FIRST "<number> B" in the **Artifact:** line —
                 * the current measurement (historical values follow it). */
                const record = fs.readFileSync(auditPath, "utf8");
                const art = /\*\*Artifact:\*\*[^\n]*—\s*([\d,]+)\s*B/.exec(record);
                if (!art) {
                    problems.push(`documentation/${path.basename(docDir)}/SIZE-AUDIT.md: no "**Artifact:** … — <number> B" anchor — the record's current byte count is not machine-verifiable`);
                } else {
                    const recorded = Number(art[1].replace(/,/g, ""));
                    if (recorded !== bytes) {
                        problems.push(`documentation/${path.basename(docDir)}/SIZE-AUDIT.md: recorded ${recorded.toLocaleString()} B but dist/${f} measures ${bytes.toLocaleString()} B — re-measure the record (the gate verifies byte counts now)`);
                    }
                }
                /* WO-01 round-5 (5-a F02 / watch-list iii): the suite stamp is
                 * machine-verified too — the byte count has been since round-2
                 * (6-d F1), but the H1's "(suite vX)" stamp could trail a pin
                 * while the artifact's bytes happened not to change (tools-only
                 * rounds; proven live by the round-5 pin-only clone probe).
                 * Fail-closed at the pin. */
                const stamp = /\(suite v(\d+\.\d+\.\d+),/.exec(record.split("\n")[0]);
                const live = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;
                if (!stamp) {
                    problems.push(`documentation/${path.basename(docDir)}/SIZE-AUDIT.md: no "(suite v<version>, G6 record)" stamp on the H1 — the measured-at round is not machine-verifiable`);
                } else if (stamp[1] !== live) {
                    problems.push(`documentation/${path.basename(docDir)}/SIZE-AUDIT.md: stamped suite v${stamp[1]} but the tree pins v${live} — re-measure the record at the current round (the gate verifies suite stamps now)`);
                }
                /* WO-01 round-5 rider (5-a F02): the artifact-intrinsic anchor —
                 * the FIRST "script vX.Y.Z" token on the Artifact line vs the
                 * dist file's own @version meta (first 4000 B). Catches
                 * intra-round script bumps that don't move the suite round;
                 * historical prior-measure prose carries no earlier "script v"
                 * token, so history cannot trip it. */
                const artLine = record.split("\n").find((l) => l.startsWith("**Artifact:**"));
                const sv = /script v(\d+(?:\.\d+)+)/.exec(artLine || "");
                const distHead = fs.readFileSync(path.join(dist, f), "utf8").slice(0, 4000);
                const dv = /@version\s+(\d+(?:\.\d+)+)/.exec(distHead);
                if (sv && dv && sv[1] !== dv[1]) {
                    problems.push(`documentation/${path.basename(docDir)}/SIZE-AUDIT.md: artifact line says script v${sv[1]} but dist/${f} carries @version ${dv[1]} — re-measure the record at the script's current version`);
                }
                stats.auditRecords++;
            }
        }
    }
    return { problems, ...stats };
}

/* resolve the script's documentation directory (slug forms vary) */
function findDocDir(root, base) {
    const docRoot = path.join(root, "documentation");
    if (!fs.existsSync(docRoot)) return null;
    const lower = base.toLowerCase();
    for (const d of fs.readdirSync(docRoot)) {
        const dl = d.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (dl === lower.replace(/[^a-z0-9]/g, "")) return path.join(docRoot, d);
    }
    return null;
}

/* CLI: node tools/size-budget.mjs [root] */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const root = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_ROOT;
    const r = runSizeBudget(root);
    console.log(`size budget: ${r.files} dist files, largest ${r.largest} at ${r.largestBytes.toLocaleString()} B; ${r.overAuditLine.length} over the 1.0 MB audit line, ${r.auditRecords} with audit records`);
    if (r.problems.length) {
        for (const p of r.problems) console.log(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("  ✓ no file over the 1.3 MB hard budget; every 1.0 MB+ file carries a decomposed-asset audit record");
}
