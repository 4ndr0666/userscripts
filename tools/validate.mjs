#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/validate.mjs — Unified 4ndr0neering v2.0.0 Verification Gate
 * ----------------------------------------------------------------------------
 * Fail-closed verification pipeline covering all active suite invariants:
 *   1. Source-to-Dist Coverage (flat src/ + kernel/ -> dist/, 1:1 parity)
 *   2. V8 Syntax Parse (`node --check`), Lexical Balance & Placeholder Scan
 *   3. Canonical Metadata, @updateURL/@downloadURL & Inventory Determinism
 *   4. OPSEC Zero-Remote-@import & 3lectric-Glass Style Audit
 *   5. Hotkey Collision Census (0 same-combo + domain-overlap collisions)
 *   6. Pixeldrain++ QR Encoder Round-Trip (8/8 payloads)
 *   7. Size Budget Enforcement
 *   8. Kernel & Behavioral Smoke Batteries
 *   9. Trusted Types Browser Smoke Battery
 *
 * Exit codes: 0 = CERTIFIED, 1 = DEFECT (fail closed).
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { checkLexicalBalance, scanPlaceholders } from "./scan-kit.mjs";
import { computeInventory, serialize } from "./inventory.mjs";
import { runCensus } from "./hotkey-census.mjs";
import { runSizeBudget } from "./size-budget.mjs";
import { runTtBrowserBattery } from "./tt-browser-smoke.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC_DIR = path.join(ROOT, "src");
const DIST_DIR = path.join(ROOT, "dist");
const CANONICAL_BASE = "https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/";

function runNodeScript(relPath) {
    const res = spawnSync(process.execPath, [path.join(ROOT, relPath)], {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 120000,
    });
    return {
        ok: res.status === 0,
        status: res.status,
        output: ((res.stdout || "") + "\n" + (res.stderr || "")).trim(),
    };
}

function expectedDistFiles() {
    const expected = new Set();
    for (const entry of fs.readdirSync(SRC_DIR, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith(".user.js")) {
            expected.add(entry.name);
        } else if (entry.isDirectory()) {
            const metaPath = path.join(SRC_DIR, entry.name, "meta.json");
            if (fs.existsSync(metaPath)) {
                const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
                expected.add(meta.filename || `${meta.name}.user.js`);
            }
        }
    }
    return [...expected].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

async function main() {
    const defects = [];
    const results = [];

    const record = (gate, ok, detail) => {
        results.push({ gate, ok, detail });
        console.log(`  ${ok ? "✓" : "✗"} ${gate}: ${detail}`);
        if (!ok) defects.push(`${gate}: ${detail}`);
    };

    console.log("── 4ndr0neering v2.0.0 Unified Validation Gate ────────────────────");

    // Gate 1: Source-to-Dist Coverage
    const expected = expectedDistFiles();
    const actual = fs.readdirSync(DIST_DIR).filter((f) => f.endsWith(".user.js")).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const missing = expected.filter((f) => !actual.includes(f));
    const extra = actual.filter((f) => !expected.includes(f));
    record(
        "Gate 1 (Source-to-Dist Coverage)",
        missing.length === 0 && extra.length === 0 && actual.length > 0,
        `${actual.length}/${expected.length} installables (missing=${missing.length}, extra=${extra.length})`
    );

    // Gate 2: V8 Syntax Parse, Lexical Balance & Placeholders
    const syntaxErrors = [];
    const lexErrors = [];
    const placeholderErrors = [];
    for (const f of actual) {
        const full = path.join(DIST_DIR, f);
        const chk = spawnSync(process.execPath, ["--check", full], { encoding: "utf8", timeout: 30000 });
        if (chk.status !== 0) syntaxErrors.push(`${f}: ${(chk.stderr || "").trim()}`);
        const text = fs.readFileSync(full, "utf8");
        const bal = checkLexicalBalance(text, f);
        if (bal) lexErrors.push(bal);
        placeholderErrors.push(...scanPlaceholders(text, f));
    }
    record(
        "Gate 2 (V8 Parse, Lexical & Placeholders)",
        syntaxErrors.length === 0 && lexErrors.length === 0 && placeholderErrors.length === 0,
        `${actual.length}/${actual.length} parsed (syntax=${syntaxErrors.length}, lexical=${lexErrors.length}, placeholders=${placeholderErrors.length})`
    );
    for (const e of [...syntaxErrors, ...lexErrors, ...placeholderErrors]) defects.push(`Gate 2 detail: ${e}`);

    // Gate 3: Canonical Metadata, Update Channels & Inventory Determinism
    const inv = computeInventory();
    const urlErrors = [];
    for (const s of inv.scripts) {
        const enc = encodeURI(s.file).replace(/#/g, "%23");
        const want = `${CANONICAL_BASE}${enc}`;
        if (s.urls.update !== want) urlErrors.push(`${s.file}: @updateURL mismatch (${s.urls.update})`);
        if (s.urls.download !== want) urlErrors.push(`${s.file}: @downloadURL mismatch (${s.urls.download})`);
    }
    const invOnDisk = fs.existsSync(path.join(ROOT, "inventory.json"))
        ? fs.readFileSync(path.join(ROOT, "inventory.json"), "utf8")
        : "";
    const invMatch = invOnDisk === serialize(inv);
    record(
        "Gate 3 (Metadata, Update Channels & Inventory)",
        inv.problems.length === 0 && urlErrors.length === 0 && invMatch,
        `problems=${inv.problems.length}, urlErrors=${urlErrors.length}, inventoryParity=${invMatch}`
    );
    for (const e of [...inv.problems, ...urlErrors]) defects.push(`Gate 3 detail: ${e}`);

    // Gate 4: OPSEC Zero-Remote-@import & 3lectric-Glass Style Audit
    const style = runNodeScript("tools/style-audit.mjs");
    record("Gate 4 (OPSEC & 3lectric-Glass Style Audit)", style.ok, style.ok ? `${actual.length}/${actual.length} PASS` : style.output.slice(-200));

    // Gate 5: Hotkey Collision Census
    const hc = runCensus(ROOT);
    const hcClean = hc.collisions.length === 0 && hc.registrations.length > 0;
    record(
        "Gate 5 (Hotkey Collision Census)",
        hcClean,
        `${hc.registrations.length} registrations, ${hc.collisions.length} collisions`
    );

    // Gate 6: QR Encoder Round-Trip
    const qr = runNodeScript("tools/qr-verify.mjs");
    record("Gate 6 (Pixeldrain++ QR Encoder)", qr.ok, qr.ok ? "8/8 payloads PASS" : qr.output.slice(-200));

    // Gate 7: Size Budget
    const sb = runSizeBudget(ROOT);
    record(
        "Gate 7 (Size Budget)",
        sb.problems.length === 0,
        `${sb.files} files, largest=${sb.largest} (${sb.largestBytes.toLocaleString()} B)`
    );

    // Gate 8: Kernel & Behavioral Smoke Batteries
    const ks = runNodeScript("tools/kernel-smoke.mjs");
    const kb = runNodeScript("tools/kernel-boundary-smoke.mjs");
    const ff = runNodeScript("tools/family-fixture-smoke.mjs");
    const wb = runNodeScript("tools/watermark-batch-smoke.mjs");
    const ns = runNodeScript("tools/norm-symmetry-smoke.mjs");
    const smokeOk = ks.ok && kb.ok && ff.ok && wb.ok && ns.ok;
    record(
        "Gate 8 (Kernel & Behavioral Smoke)",
        smokeOk,
        `kernel=${ks.ok ? "PASS" : "FAIL"}, boundary=${kb.ok ? "PASS" : "FAIL"}, family=${ff.ok ? "PASS" : "FAIL"}, watermark=${wb.ok ? "PASS" : "FAIL"}, norm=${ns.ok ? "PASS" : "FAIL"}`
    );

    // Gate 9: Trusted Types Browser Smoke
    const tt = await runTtBrowserBattery();
    record(
        "Gate 9 (Trusted Types Browser Smoke)",
        tt.clean,
        `${tt.passed}/${tt.total} checks PASS (mode=${tt.mode})`
    );

    console.log("───────────────────────────────────────────────────────────────────");
    if (defects.length > 0) {
        console.error(`VALIDATION FAILED (${defects.length} defect(s)):`);
        for (const d of defects) console.error(`  ✗ ${d}`);
        process.exit(1);
    }
    console.log(`VALIDATION: CERTIFIED (${results.length}/${results.length} gates PASS, ${actual.length}/${actual.length} scripts)`);
    process.exit(0);
}

main().catch((err) => {
    console.error("VALIDATION CRASH:", err);
    process.exit(1);
});
