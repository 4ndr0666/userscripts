#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/build.mjs — zero-dependency suite bundler
 * ----------------------------------------------------------------------------
 * Paradigm (GUP D1): Deterministic build-time kernel inliner. Kernel modules
 * are concatenated INSIDE each dist script's IIFE — every output remains a
 * self-contained, dependency-free installable (README contract preserved).
 *
 * Pipeline:
 *   1. modules/<name>/meta.json + body.js  →  kernel-inlined dist outputs
 *   2. canon/<name>/<file>.user.js         →  carried verbatim to dist
 *      (WO-01 round 3, 3-b F2: verbatim carries are scan-checked too —
 *      checkLexicalBalance + scanPlaceholders run on every carry before
 *      the copy, so a standalone `npm run build` can no longer ship a
 *      sentinel the full gate would have caught; previously only the
 *      BUILT/inlined outputs were scanned at build time and the banner
 *      overstated the coverage)
 *   3. Lexical validation on every output (§1.1-aware brace accounting,
 *      placeholder scan; Ψ-reference discipline is enforced by the
 *      kernel-export census — 3-a F14 header truth).
 *   4. (WO-01 round 4, 4-b F2) Atomic flush — every write is staged during
 *      the scan pass and lands on disk only after the WHOLE run validated
 *      clean and the ledger sums, so a failing build leaves dist/ exactly
 *      as it found it (no mixed-generation window; dist is the live
 *      @updateURL channel). Carry-side IO errors report as typed BUILD
 *      FAILURES instead of raw crashes (4-b F1).
 *
 * Exit codes: 0 = clean, 1 = build failure, 2 = validation failure.
 * ═══════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KERNEL_ORDER, KERNEL_DEPENDENCIES, kernelClosure } from "./kernel-order.mjs";
/* WO-01 round-2 (6-a F08 / round-1 deferred item d): the §1.1 lexical
 * scanner and the placeholder scan now live in tools/scan-kit.mjs — the
 * ~120-line port pair between build.mjs and validate.mjs had already
 * drifted in BOTH directions (build alone caught pass#todo + quoted
 * placeholder values; validate alone caught =STUB/=PENDING sentinels). */
import { checkLexicalBalance, scanPlaceholders } from "./scan-kit.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const KERNEL_DIR = path.join(ROOT, "kernel");
const MODULES_DIR = path.join(ROOT, "modules");
const CANON_DIR = path.join(ROOT, "canon");
const DIST_DIR = path.join(ROOT, "dist");

/* Single source of truth: tools/kernel-order.mjs (shared with
 * kernel-smoke.mjs so the harness can never test a different composition
 * than the one the build ships — WO-01 round-1 F-01). Order law: store
 * precedes glass; glass destructures Ψ.brand/Ψ.core at module-eval and
 * resolves its store facade lazily, but the shipped byte order stays
 * store-first so any future eager capture is safe by construction. */

/* Canon scripts that consume kernel modules at build time (suite v1.4.3):
 * the file is carried with the listed modules inlined directly after the
 * ==/UserScript== block — canon stays the review source, dist stays
 * self-contained, kernel/ stays the single source of truth (the v1.1.0
 * design shipped kernel/net.js with zero consumers; it was purged as dead
 * surface in v1.4.2. This map is how a kernel module stays alive with
 * canon-carried consumers). The module's top-level identifier
 * (e.g. __4NDR0_NET_API__) is script-scope visible to the consumer's
 * body; validate.mjs machine-checks both wiring directions. */
const CANON_KERNEL = {
    "4ndr0tools - Akasha Silence.user.js": ["net"],
    "4ndr0tools - Blob2URL.user.js": ["net"],
    "4ndr0tools - Bunkr++.user.js": ["net"],
    "4ndr0tools - Filester++.user.js": ["net"],
    "4ndr0tools - Forums++.user.js": ["net"],
    "4ndr0tools - Gofile++.user.js": ["net"],
    "4ndr0tools - GooglePhotosandDrive++.user.js": ["net"],
    "4ndr0tools - Instagram++.user.js": ["net"],
    "4ndr0tools - LinkMasterΨ.user.js": ["net"],
    "4ndr0tools - m3u8++.user.js": ["net"],
    "4ndr0tools - Pixeldrain++.user.js": ["net"],
    "4ndr0tools - Prompt Master.user.js": ["net"],
    "4ndr0tools - Recon.user.js": ["net"],
    "4ndr0tools - Stream Interceptor.user.js": ["net"],
    "4ndr0tools - Watermark++.user.js": ["net"],
    "4ndr0tools - YouTube Playlist Master.user.js": ["net"],
};
/* WO-01 round-1 (2-b F-04): the @icon data-URI is DERIVED from
 * kernel/brand.js's GLYPH_SVG constant — the previous hand-pasted copy in
 * this file was a second source of truth that had already drifted
 * (attribute order) from the brand constant, violating brand.js's
 * "re-brand the entire suite in one commit" contract. */
function deriveGlyphIcon() {
    const brandSrc = fs.readFileSync(path.join(KERNEL_DIR, "brand.js"), "utf8");
    const m = brandSrc.match(/const GLYPH_SVG =\s*([\s\S]*?);\s*\n/);
    if (!m) throw new Error("kernel/brand.js: GLYPH_SVG constant not found — the @icon cannot be derived");
    const svg = new Function(`return (${m[1]});`)();   /* pure string concatenation, build-time only */
    return "data:image/svg+xml," + encodeURIComponent(svg);
}
const GLYPH_ICON = deriveGlyphIcon();

/* §1.1-aware lexical scanner + placeholder scan: imported from tools/scan-kit.mjs (WO-01 round-2, 6-a F08). */

/* ── Header emission ─────────────────────────────────────────────────────── */

function emitHeader(meta, filename) {
    const order = [
        ["name", meta.name], ["namespace", meta.namespace], ["version", meta.version],
        ["description", meta.description], ["author", meta.author], ["license", meta.license],
    ];
    const lines = ["// ==UserScript=="];
    for (const [key, value] of order) {
        if (value != null && value !== "") lines.push(`// @${key.padEnd(13)}${value}`);
    }
    for (const m of meta.match || []) lines.push(`// @${"match".padEnd(13)}${m}`);
    for (const inc of meta.include || []) lines.push(`// @${"include".padEnd(13)}${inc}`);
    for (const ex of meta.exclude || []) lines.push(`// @${"exclude".padEnd(13)}${ex}`);
    if (meta["run-at"]) lines.push(`// @${"run-at".padEnd(13)}${meta["run-at"]}`);
    if (meta.noframes) lines.push(`// @${"noframes".padEnd(13)}`);
    if (meta.icon !== false) lines.push(`// @${"icon".padEnd(13)}${meta.icon || GLYPH_ICON}`);
    for (const g of meta.grant || []) lines.push(`// @${"grant".padEnd(13)}${g}`);
    for (const r of meta.require || []) lines.push(`// @${"require".padEnd(13)}${r}`);
    for (const c of meta.connect || []) lines.push(`// @${"connect".padEnd(13)}${c}`);
    const base = meta.urlBase || "https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/";
    const encoded = encodeURI(filename).replace(/#/g, "%23");
    lines.push(`// @${"downloadURL".padEnd(13)}${base}${encoded}`);
    lines.push(`// @${"updateURL".padEnd(13)}${base}${encoded}`);
    if (meta.supportURL) lines.push(`// @${"supportURL".padEnd(13)}${meta.supportURL}`);
    lines.push("// ==/UserScript==");
    return lines.join("\n");
}

/* ── Kernel selection ────────────────────────────────────────────────────── */

function selectKernel(bodySrc, meta) {
    let base;
    if (Array.isArray(meta.kernel) && meta.kernel.length > 0) {
        /* WO-01 round-2 (6-b F2): explicit meta.kernel lists get the same
         * F-06 dependency closure as auto-detected ones — the closure used
         * to run only on the auto path, so a hand-written ["glass"] could
         * still ship a dist that throws at module-eval (missing
         * brand/core/store) while passing every build check. */
        base = meta.kernel;
    } else {
        const referenced = [];
        for (const mod of KERNEL_ORDER) {
            if (new RegExp(`Ψ\\.${mod}\\b`).test(bodySrc)) referenced.push(mod);
        }
        base = referenced;
    }
    /* WO-01 round-2 (6-a F03): every name must be a KERNEL_ORDER member.
     * The module pipeline emits chunks and runs BOTH reference checks by
     * iterating KERNEL_ORDER — a name outside it (e.g. "net", which canon
     * scripts consume via the CANON_KERNEL __4NDR0_NET_API__ path)
     * previously built a kernel-LESS dist with a lying "+ kernel {net}"
     * banner and exit 0. Fail closed with the lawful surface named. */
    for (const mod of base) {
        if (!KERNEL_ORDER.includes(mod)) {
            throw new Error(`${meta.name}: meta.kernel lists "${mod}" — module builds support only [${KERNEL_ORDER.join(", ")}] (net rides the canon CANON_KERNEL path)`);
        }
    }
    /* WO-01 round-1 (F-06): complete the kernel-internal dependency closure —
     * glass destructures Ψ.brand/Ψ.core at module-eval and persists through
     * Ψ.store; hosts calls Ψ.core.uid at registration. A body referencing
     * only Ψ.glass previously shipped without brand/core → the dist threw
     * on load with neither direction of the dead-code check able to see it
     * (both only scan the body, never kernel-internal dependencies). */
    return kernelClosure(base);
}

/* ── Module build ────────────────────────────────────────────────────────── */

function buildModule(dir) {
    const metaPath = path.join(dir, "meta.json");
    const bodyPath = path.join(dir, "body.js");
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    const body = fs.readFileSync(bodyPath, "utf8");
    const filename = meta.filename || `${meta.name}.user.js`;

    const kernelMods = selectKernel(body, meta);
    /* WO-01 round-1 (F-06): the dead-code check now excuses exactly the
     * closure-pulled dependencies (glass → brand/core/store, hosts → core)
     * instead of the old hardcoded brand/store skip — a module included
     * without a body reference AND without being anyone's dependency is
     * still dead weight and fails the build. */
    const directRefs = new Set(KERNEL_ORDER.filter((mod) => new RegExp(`Ψ\\.${mod}\\b`).test(body)));
    const isDepOfIncluded = (mod) => kernelMods.some((m) => m !== mod && (KERNEL_DEPENDENCIES[m] || []).includes(mod));
    for (const mod of kernelMods) {
        if (directRefs.has(mod) || isDepOfIncluded(mod)) continue;
        /* WO-01 round 3 (3-b F11): the inner regex re-test was dead code —
         * directRefs is DEFINED as the KERNEL_ORDER members matching that
         * exact regex on the same body, so reaching this point means the
         * test is necessarily false; the throw fired on every path that
         * reached it and the regex was re-compiled for nothing. */
        throw new Error(`${meta.name}: kernel "${mod}" included but never used (dead code)`);
    }
    const kernelChunks = [];
    for (const mod of KERNEL_ORDER) {
        if (!kernelMods.includes(mod)) continue;
        const p = path.join(KERNEL_DIR, `${mod}.js`);
        if (!fs.existsSync(p)) throw new Error(`${meta.name}: kernel module "${mod}" not found`);
        kernelChunks.push(`    /* ══ kernel/${mod}.js ══ */\n${fs.readFileSync(p, "utf8").trim()}`);
    }

    /* No references to kernel modules we did NOT include. */
    for (const mod of KERNEL_ORDER) {
        if (kernelMods.includes(mod)) continue;
        if (new RegExp(`Ψ\\.${mod}\\b`).test(body)) {
            throw new Error(`${meta.name}: body references Ψ.${mod} but it is not in meta.kernel`);
        }
    }

    const out = [
        emitHeader(meta, filename),
        "",
        `/* ${meta.name} v${meta.version} — built from modules/${path.basename(dir)} + kernel {${kernelMods.join(", ")}}`,
        ` * ${meta.description}`,
        " * This is a generated file; edit modules/ and run `npm run build`.",
        " */",
        "",
        "(function () {",
        "    'use strict';",
        "    const Ψ = {};",
        ...kernelChunks,
        "",
        "    /* ══ feature body ══ */",
        body.trim(),
        "",
        "})();",
        "",
    ].join("\n");

    return { filename, out, meta };
}

/* ── Main ────────────────────────────────────────────────────────────────── */

function main() {
    /* WO-01 round 4 (4-b F1): dist creation is part of the typed failure
     * contract too — a read-only parent must report as a BUILD FAILURE,
     * not a raw stack with no enumeration. */
    try {
        fs.mkdirSync(DIST_DIR, { recursive: true });
    } catch (e) {
        console.error(`\nBUILD FAILURES:\n  dist mkdir: ${e.code || e.message}\n`);
        process.exit(1);
    }
    const failures = [];
    const built = [];
    const outputs = new Set();
    /* WO-01 round 4 (4-b F2): ALL dist writes are STAGED and flushed only
     * after the whole run validates clean — a failing build now leaves
     * dist/ exactly as it found it (true atomicity; the round-3 comment's
     * mixed-generation caveat is retired). Verbatim carries stage their
     * SOURCE path so the flush keeps copyFileSync byte-copy semantics. */
    const staged = [];

    // 1) Kernel-powered modules
    if (fs.existsSync(MODULES_DIR)) {
        for (const entry of fs.readdirSync(MODULES_DIR, { withFileTypes: true })) {
            if (!entry.isDirectory()) continue;
            try {
                const { filename, out } = buildModule(path.join(MODULES_DIR, entry.name));
                const fileFailures = [];
                const balanceErr = checkLexicalBalance(out, filename);
                if (balanceErr) fileFailures.push(balanceErr);
                fileFailures.push(...scanPlaceholders(out, filename));
                if (fileFailures.length === 0) {
                    /* WO-01 round-1 (2-a F19) + round-4 (4-b F2): a failed output is
                     * never written — and a clean one is only STAGED here; the
                     * write lands at flush time, after the whole run validates. */
                    staged.push({ dest: path.join(DIST_DIR, filename), data: out });
                    built.push(filename);
                    outputs.add(filename);
                } else {
                    failures.push(...fileFailures);
                }
            } catch (e) {
                failures.push(`module ${entry.name}: ${e.message}`);
            }
        }
    }

    // 2) Canon carries (verbatim) — except CANON_KERNEL consumers, which
    //    are carried with their declared kernel modules inlined.
    let carried = 0;
    let kernelCarried = 0; /* v1.6.2: counted separately — the summary must sum to the dist total (an unaccounted ledger line reads as a missing script) */
    if (fs.existsSync(CANON_DIR)) {
        for (const entry of fs.readdirSync(CANON_DIR, { withFileTypes: true })) {
            if (!entry.isDirectory()) continue;
            const dir = path.join(CANON_DIR, entry.name);
            for (const f of fs.readdirSync(dir)) {
                if (!f.endsWith(".user.js")) continue;
                const kernelList = CANON_KERNEL[f];
                if (!kernelList) {
                    /* WO-01 round 3 (3-b F2): verbatim carries get the same
                     * build-time scans as inlined outputs — the round-2 banner
                     * said "every output" while this branch copied blind (a
                     * `= "PLACEHOLDER"` sentinel in a carry shipped to dist
                     * with exit 0; validate.mjs Gate C caught it only in the
                     * full check chain). Scan first, copy only when clean.
                     * WO-01 round 4 (4-b F1): the read itself is typed — a
                     * vanished/unreadable canon source reports, not crashes. */
                    let carrySrc;
                    try {
                        carrySrc = fs.readFileSync(path.join(dir, f), "utf8");
                    } catch (e) {
                        failures.push(`canon ${f}: ${e.code || e.message}`);
                        continue;
                    }
                    const carryFailures = scanPlaceholders(carrySrc, f);
                    const carryBalance = checkLexicalBalance(carrySrc, f);
                    if (carryBalance) carryFailures.push(carryBalance);
                    if (carryFailures.length === 0) {
                        /* WO-01 round 4 (4-b F2): staged — the byte-copy lands at
                         * flush time, after the whole run validates clean. */
                        staged.push({ dest: path.join(DIST_DIR, f), src: path.join(dir, f) });
                        outputs.add(f);
                        carried++;
                    } else {
                        failures.push(...carryFailures);
                    }
                    continue;
                }
                let src;
                try {
                    src = fs.readFileSync(path.join(dir, f), "utf8");
                } catch (e) {
                    /* WO-01 round 4 (4-b F1): typed canon-source read failure. */
                    failures.push(`canon ${f}: ${e.code || e.message}`);
                    continue;
                }
                /* WO-01 round-1 (F-16): a canon source without an ==/UserScript==
                 * end-marker previously fell through with cut = 0, silently
                 * prepending the kernel chunk BEFORE the metadata block and
                 * shipping a corrupted installable. It is now a hard failure
                 * pushed BEFORE any output is written for that file. */
                const marker = src.indexOf("==/UserScript==");
                if (marker === -1) {
                    failures.push(`canon ${f}: no ==/UserScript== end-marker — refusing to inline kernel before the metadata block`);
                    continue;
                }
                const chunks = [];
                let moduleMissing = false;
                for (const mod of kernelList) {
                    const p = path.join(KERNEL_DIR, `${mod}.js`);
                    if (!fs.existsSync(p)) {
                        /* WO-01 round-2 (6-a F02): a missing kernel module must
                         * fail this FILE, not just the build — the round-1
                         * form pushed the error to the global failure list
                         * but fell through and wrote the kernel-less
                         * artifact over the previous good dist output,
                         * violating the 2-a F19 never-write-a-failed-output
                         * contract this very message cites. */
                        failures.push(`canon ${f}: kernel module "${mod}" not found`);
                        moduleMissing = true;
                        continue;
                    }
                    let kernelSrc;
                    try {
                        kernelSrc = fs.readFileSync(p, "utf8").trim();
                    } catch (e) {
                        /* WO-01 round 4 (4-b F1): a kernel module that vanishes
                         * between the existsSync probe and the read reports
                         * typed, like every other carry-side IO path. */
                        failures.push(`canon ${f}: kernel module "${mod}" unreadable: ${e.code || e.message}`);
                        moduleMissing = true;
                        continue;
                    }
                    chunks.push(`/* ══ kernel/${mod}.js (inlined by tools/build.mjs — edit kernel/, not here) ══ */\n${kernelSrc}`);
                }
                if (moduleMissing) continue;   /* never write a kernel-less artifact for this file */
                /* WO-01 round 3 (3-b F10): the F-16 guard checked only that the
                 * marker EXISTS — a file ending AT the marker with no trailing
                 * newline made indexOf return -1 → cut = 0 → the kernel chunk
                 * prepended BEFORE the metadata block (the exact corruption
                 * class F-16 was installed to prevent). Fail closed on the
                 * degenerate form instead. */
                const nl = src.indexOf("\n", marker);
                if (nl === -1) {
                    failures.push(`canon ${f}: no newline after ==/UserScript== end-marker — refusing to inline kernel before the metadata block`);
                    continue;
                }
                const cut = nl + 1;
                const out = src.slice(0, cut) + "\n" + chunks.join("\n\n") + "\n\n" + src.slice(cut);
                const fileFailures = [];
                const balanceErr = checkLexicalBalance(out, f);
                if (balanceErr) fileFailures.push(balanceErr);
                fileFailures.push(...scanPlaceholders(out, f));
                if (fileFailures.length === 0) {   /* WO-01 round-1 (2-a F19): never write a failed artifact; round-4 (4-b F2): stage the clean one */
                    staged.push({ dest: path.join(DIST_DIR, f), data: out });
                    outputs.add(f);
                    kernelCarried++;
                } else {
                    failures.push(...fileFailures);
                }
            }
        }
    }

    /* v1.6.2: the build ledger must account for every dist installable —
     * built + verbatim carries + kernel-inlined carries == outputs. The
     * v1.6.1 summary said only "2 built, 20 carried" and left the 16
     * kernel-inlined carries out of the arithmetic, which reads as a
     * missing script against a 38-file inventory. WO-01 round 4 (4-b F2):
     * the check runs BEFORE the flush — a ledger that does not sum must
     * not touch dist either. */
    if (built.length + carried + kernelCarried !== outputs.size) {
        failures.push(`build ledger does not sum: ${built.length} built + ${carried} verbatim + ${kernelCarried} kernel-inlined ≠ ${outputs.size} dist outputs`);
    }

    // 3) Flush + prune — BOTH run only after the whole run validated clean
    //    AND the ledger sums.
    //    WO-01 round-1 (2-a F19 companion): pruning is skipped entirely on a
    //    failed build — a file whose output failed validation is absent from
    //    `outputs`, and pruning then would DELETE the previous good dist
    //    artifact alongside the refused new one.
    //    WO-01 round 4 (4-b F2 — the atomicity hardening the round-3 comment
    //    deferred): every write is staged above and flushed HERE, after the
    //    ledger-sum check, so a failing build leaves dist/ EXACTLY as it
    //    found it — no mixed-generation window, even for a
    //    `npm run build || true` deploy wrapper (dist is the live
    //    @updateURL channel). A flush-time IO error (read-only dist, disk
    //    full) degrades to the typed failure report per-entry (4-b F1).
    const stale = [];
    if (failures.length === 0) {
        for (const s of staged) {
            try {
                if (s.src !== undefined) fs.copyFileSync(s.src, s.dest);
                else fs.writeFileSync(s.dest, s.data);
            } catch (e) {
                failures.push(`dist write ${path.basename(s.dest)}: ${e.code || e.message}`);
            }
        }
    }
    if (failures.length === 0) {
        try {
            for (const f of fs.readdirSync(DIST_DIR)) {
                if (f.endsWith(".user.js") && !outputs.has(f)) {
                    fs.rmSync(path.join(DIST_DIR, f));
                    stale.push(f);
                }
            }
        } catch (e) {
            failures.push(`dist prune: ${e.code || e.message}`);
        }
    }

    // 4) Report
    for (const f of built) console.log(`  ✓ built  ${f}`);
    if (carried) console.log(`  ✓ carried ${carried} canon script(s) verbatim`);
    for (const f of Object.keys(CANON_KERNEL)) {
        if (outputs.has(f)) console.log(`  ✓ carried ${f} + kernel {${CANON_KERNEL[f].join(", ")}}`);
    }
    for (const f of stale) console.log(`  − pruned  ${f} (no canon source)`);

    /* WO-01 round-1 (F-17): exit-code discrimination — placeholder hits are
     * VALIDATION failures (exit 2), everything else is a build failure
     * (exit 1). The old `.includes("placeholder")` probe only matched the
     * one pattern whose regex source happens to contain the word, so a
     * TODO/FIXME hit exited 1 and broke the documented contract. The
     * placeholder scanner now labels its own hits. */
    if (failures.length > 0) {
        console.error("\nBUILD FAILURES:");
        for (const f of failures) console.error(`  ✗ ${f}`);
        const isValidation = failures.every((f) => f.startsWith("placeholder:"));
        process.exit(isValidation ? 2 : 1);
    }
    console.log(`\nSuite build complete: ${built.length} built, ${carried} carried verbatim, ${kernelCarried} kernel-inlined (${built.length + carried + kernelCarried} total).`);
    return 0;
}

process.exit(main());
