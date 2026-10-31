#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/global-census.mjs — realm-write / global-pollution census (suite v1.5.0)
 * ----------------------------------------------------------------------------
 * Round mandate (GUP B.1 "Zero Global Pollution"): the Phase A machine audit
 * found 37 realm writes across the review sources — 24 distinct own-state
 * names with NO gate measuring the class. This census is that gate.
 * (Precedent: tools/transport-census.mjs, v1.4.10.)
 *
 * What it scans: the REVIEW SOURCES (canon/<tier> .user.js, modules/<name>/
 * body.js, kernel/net.js) on the codeOnly view. What counts as a realm write:
 *   - `window.NAME =` / `unsafeWindow.NAME =` / `globalThis.NAME =` /
 *     `self.NAME =` (dot form), and the bracket form
 *     `window["NAME"] =` / `unsafeWindow['NAME'] =` … (assignment only,
 *     `==`/`===` compares are reads);
 *   - `Object.defineProperty(<literal realm>, "NAME", …)` attachments.
 *
 * Fail-closed on:
 *   1. an UNLEDGERED realm write (own-state pollution — B.1 wants module/
 *      closure scope only);
 *   2. a stale ledger entry (the write disappeared — drift discipline);
 *   3. the kernel losing its realm-slot self-assertion (the NetHook
 *      singleton mark __4NDR0_NET__ must stay defineProperty-attached).
 *
 * Sanctioned ledger (every entry: file, name, reason, expiry): the NetHook
 * page-realm interposition family is owned by the sink census (fetchWrap/
 * xhrWrap/tapOpenSend classes); the kernel's realm slot rides
 * Object.defineProperty through an indirection variable and is asserted
 * directly; deliberate interop marks (defuse mocks, console C2, debug hooks,
 * cross-context bridges, double-injection guards, page-API wipes) are
 * enumerated below with justifications and expiry rounds.
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CURRENT_ROUND, roundLt } from "./census-round.mjs"; /* WO-01 round-1 (2-a F1): round derives from package.json — the hardcoded
 * "v1.7.2" left every G9 expiry check inert while the suite reached v1.8.2. */
import { codeOnly } from "./sink-census.mjs";
import { codeOnlyCached } from "./scan-kit.mjs"; /* WO-01 round-4 (4-a F04): shared per-file memo */

const DEFAULT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/* WO-01 round-4 (4-a F02): roundLt is single-sourced from census-round.mjs now — the nine byte-identical copies are gone (port-drift class closed). */

/* ── Adjudication ledger: sanctioned realm writes ─────────────────────────── */
/* WO-01 round-1 re-adjudication: every entry below was re-verified against
 * the v1.8.2 tree (census green at counts) and its expiry rolled
 * v1.8.0 → v1.12.0 — the G9 gate was silently inert because CURRENT_ROUND
 * stayed hardcoded at v1.7.2 while the suite advanced (see
 * tools/census-round.mjs; the round now derives from package.json). */
const SANCTIONED = [
    { file: "canon/_sovereign/4ndr0tools - Bunkr++.user.js", name: "aclib", realm: "unsafeWindow",
      reason: "defuse mock: the host page's anti-bot gate probes unsafeWindow.aclib for the ad library — the no-op mock IS the feature (synchronous environment mocking, MODULE 0.1)", expiry: "v1.24.0" },
    { file: "canon/_sovereign/4ndr0tools - Bunkr++.user.js", name: "kxysy", realm: "unsafeWindow",
      reason: "defuse mock: no-op stand-in for the page's kxysy ad gate (MODULE 0.1)", expiry: "v1.24.0" },
    { file: "canon/_sovereign/4ndr0tools - Bunkr++.user.js", name: "ggihyqfb", realm: "unsafeWindow",
      reason: "defuse mock: no-op stand-in for the page's ggihyqfb ad gate (MODULE 0.1)", expiry: "v1.24.0" },
    { file: "canon/_promoted/4ndr0tools - Confirmation Bypass.user.js", name: "__cb4OpenUpload", realm: "window",
      reason: "cross-context bridge: namespaced opener-side entry point for the turbo.cr upload popup flow (documented 'namespaced global' from the C lineage)", expiry: "v1.24.0" },
    { file: "canon/_promoted/4ndr0tools - Confirmation Bypass.user.js", name: "__turboUploadWin", realm: "window",
      reason: "cross-context bridge: the upload popup's window handle, validated by the postMessage allowlist flow", expiry: "v1.24.0" },
    { file: "canon/_promoted/4ndr0tools - Hailuo++.user.js", name: "__andr0HailuoIntercept", realm: "window",
      reason: "double-injection guard: interception-platform singleton mark (MPC psiMediaControllerLoaded class) — a second manager copy must see the first arm (canvas toDataURL/toBlob wraps + createObjectURL clone registry + DOM stalker are page-realm interpositions that must install exactly once); closure state would defeat the guard (round 6, 2-c F06)", expiry: "v1.24.0" },
    { file: "canon/_promoted/4ndr0tools - Media Player Controller.user.js", name: "psiMediaControllerLoaded", realm: "window",
      reason: "double-injection guard: co-install singleton mark — a second copy of the controller (second manager or re-run) must see the first load; closure state would defeat the guard", expiry: "v1.24.0" },
    { file: "canon/_promoted/4ndr0tools - Media Player Controller.user.js", name: "psiMediaGodmodeLoaded", realm: "window",
      reason: "double-injection guard: godmode co-install singleton mark (same class as psiMediaControllerLoaded)", expiry: "v1.24.0" },
    { file: "canon/_sovereign/4ndr0tools - Recon.user.js", name: "reconEngine", realm: "window",
      reason: "console C2: the operator drives the recon engine from devtools (documented in the boot log: 'C2 via reconEngine / chimeraRecon / Hook in the console')", expiry: "v1.24.0" },
    { file: "canon/_sovereign/4ndr0tools - Recon.user.js", name: "chimeraRecon", realm: "window",
      reason: "console C2: chimera session facade exposed for devtools (same documented interface)", expiry: "v1.24.0" },
    { file: "canon/_sovereign/4ndr0tools - Recon.user.js", name: "Hook", realm: "window",
      reason: "console C2: the intercept Hook handle exposed for devtools (same documented interface)", expiry: "v1.24.0" },
    { file: "canon/_sovereign/4ndr0tools - 4ndr0purge.user.js", name: "name", realm: "window",
      reason: "page-API wipe: clearing window.name is the anti-tracking feature itself (removes a cross-session tracking vector; writes empty, adds no state)", expiry: "v1.24.0" },
    { file: "canon/_promoted/4ndr0tools - m3u8++.user.js", name: "fetch", realm: "unsafeWindow",
      reason: "page-realm interposition: the m3u8 dev-proxy fetch re-dispatcher (custom origin/referer headers via GM transport, non-200 re-proxied) — the fetchWrap class, owned and adjudicated by the sink census (same adjudication family as Watermark++'s processing proxy)", expiry: "v1.24.0" },
];

/* kernel self-assertion: the NetHook realm slot must stay attached via
 * defineProperty (the name rides the SLOT const, and the target is an
 * indirection variable — both halves must be present). */
function kernelSlotAssert(kernelCode) {
    /* shape on the code view; the SLOT VALUE is asserted on raw below */
    return /Object\.defineProperty\(\s*[A-Za-z_$][\w$]*\s*,\s*SLOT\s*,/.test(kernelCode);
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lineStartsOf(view) {
    const s = [0];
    for (let i = 0; i < view.length; i++) if (view[i] === "\n") s.push(i + 1);
    return s;
}

function lineOf(starts, off) {
    let lo = 0, hi = starts.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= off) lo = mid; else hi = mid - 1; }
    return lo + 1;
}

/* ── the census ──────────────────────────────────────────────────────────── */

export function runGlobalCensus(root = DEFAULT_ROOT) {
    const problems = [];
    const stats = { writes: 0, sanctioned: 0, filesScanned: 0 };
    const seen = new Set();

    const targets = [];
    const canonDir = path.join(root, "canon");
    if (fs.existsSync(canonDir)) {
        for (const tier of fs.readdirSync(canonDir).sort()) {
            const dir = path.join(canonDir, tier);
            if (!fs.statSync(dir).isDirectory()) continue;
            for (const f of fs.readdirSync(dir).sort()) {
                if (f.endsWith(".user.js")) targets.push([`canon/${tier}/${f}`, path.join(dir, f)]);
            }
        }
    }
    const modulesDir = path.join(root, "modules");
    if (fs.existsSync(modulesDir)) {
        for (const d of fs.readdirSync(modulesDir).sort()) {
            const body = path.join(modulesDir, d, "body.js");
            if (fs.existsSync(body)) targets.push([`modules/${d}/body.js`, body]);
        }
    }
    targets.push(["kernel/net.js", path.join(root, "kernel", "net.js")]);

    /* realm write: dot assignment, bracket assignment, defineProperty attach.
     * WO-01 round-3 (3-a F09 — the undelivered round-2 6-a F14): the dot
     * form now catches COMPOUND assignments (window.x += …, ||=, ??=, &&=)
     * via an optional operator prefix, and the bracket form admits the
     * `self` realm (dot form always scanned it; the bracket omission was an
     * accident of list maintenance). Zero live occurrences of the extended
     * forms — the gate is armed for the next disguise, not chasing a live
     * bug. */
    const DOT_RE = /(^|[^\w$])(window|unsafeWindow|globalThis|self)\s*\.\s*([A-Za-z_$][\w$]*)\s*(?:\+|-|\*|\/|\||&|\?\?|\*\*)?=(?!=)/g;
    const BRACKET_RE = /(^|[^\w$])(window|unsafeWindow|globalThis|self)\s*\[\s*(["'])([A-Za-z_$][\w$-]{0,60})\3\s*\]\s*(?:\+|-|\*|\/|\||&|\?\?|\*\*)?=(?!=)/g;
    const DEFINEPROP_RE = /Object\.defineProperty\s*\(\s*(window|unsafeWindow|globalThis|self)\s*,\s*(["'])([A-Za-z_$][\w$-]{0,60})\2/g;

    for (const [rel, abs] of targets) {
        if (!fs.existsSync(abs)) continue;
        stats.filesScanned++;
        const view = codeOnlyCached(abs);
        const starts = lineStartsOf(view);
        for (const re of [DOT_RE, BRACKET_RE, DEFINEPROP_RE]) {
            const r = new RegExp(re.source, "g");
            let m;
            while ((m = r.exec(view)) !== null) {
                /* the realm variable + the written name (defineProperty: 3rd
                 * group is the name; dot/bracket: last group is the name).
                 * WO-01 round-1 (2-a F22): for DEFINEPROP matches m[2] is the
                 * QUOTE character — the old `m[2] || m[1]` printed `"` as the
                 * realm in problem messages. The realm is whichever group
                 * actually matches a realm identifier. */
                const realm = [m[1], m[2]].find((g) => g && /^(?:window|unsafeWindow|globalThis|self)$/.test(g)) || m[2] || m[1];
                const name = m[4] || m[3];
                stats.writes++;
                const line = lineOf(starts, m.index);
                const entry = SANCTIONED.find((e) => e.file === rel && e.name === name);
                if (entry) {
                    stats.sanctioned++;
                    seen.add(`${rel}::${name}`);
                } else {
                    problems.push(
                        `${rel}:${line}: UNLEDGERED realm write \`${realm}.${name} =\` — GUP B.1 zero global pollution: move the state into module/closure scope, or add a sanctioned-mark ledger entry with justification + expiry`
                    );
                }
            }
        }
    }

    /* drift: sanctioned entries whose write disappeared + expiry
     * enforcement (v1.6.0: the expiry fields were previously carried but
     * not enforced here — the G9 gap closed this round; every entry must
     * carry a re-adjudication round that has not passed). All twelve
     * entries re-adjudicated v1.6.0 under the operator's standing
     * authorization (GUP §5.3.2.4): write semantics re-verified, expiry
     * rolled to v1.7.0. (WO-01 round-3, 3-a F09: count corrected — the
     * ledger carries twelve entries, not fourteen.) */
    for (const e of SANCTIONED) {
        if (!seen.has(`${e.file}::${e.name}`)) {
            problems.push(`stale global ledger entry: ${e.file} :: ${e.name} — write not found (remove or update)`);
        }
        if (!e.expiry) {
            problems.push(`global ledger entry without expiry: ${e.file} :: ${e.name} — every sanctioned write must carry its re-adjudication round (G9 ledger hygiene)`);
        }
        if (e.expiry && roundLt(CURRENT_ROUND, e.expiry) === false) {
            problems.push(`expired global ledger entry: ${e.file} :: ${e.name} — expiry ${e.expiry} has passed round ${CURRENT_ROUND} without re-adjudication`);
        }
    }

    /* kernel self-assertion: the slot VALUE check runs on the raw source
     * (codeOnly blanks string contents); the defineProperty shape on the
     * code view */
    const kernelRaw = fs.readFileSync(path.join(root, "kernel", "net.js"), "utf8");
    const kernelCode = codeOnly(kernelRaw);
    if (!kernelSlotAssert(kernelCode) || !/const\s+SLOT\s*=\s*["']__4NDR0_NET__["']/.test(kernelRaw)) {
        problems.push("kernel/net.js: the NetHook realm slot __4NDR0_NET__ lost its Object.defineProperty attachment");
    }

    return { problems, ...stats };
}

/* CLI: node tools/global-census.mjs [root] */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const root = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_ROOT;
    const r = runGlobalCensus(root);
    console.log(`global census: ${r.filesScanned} source files, ${r.writes} realm writes — ${r.sanctioned} sanctioned (ledgered), ${r.writes - r.sanctioned} unledgered`);
    if (r.problems.length) {
        for (const p of r.problems) console.log(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("  ✓ every realm write is closure-moved or ledger-sanctioned; kernel slot asserted");
}
