#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/build.mjs — zero-dependency suite bundler (v2.0.0)
 * ----------------------------------------------------------------------------
 * Deterministic build-time kernel inliner. Kernel modules are concatenated
 * INSIDE each dist script's IIFE — every output remains a self-contained,
 * dependency-free installable.
 *
 * Pipeline:
 *   1. src/<name>/meta.json + body.js  →  kernel-inlined dist outputs
 *   2. src/<file>.user.js              →  carried verbatim or kernel-inlined
 *   3. Lexical validation on every output (§1.1-aware brace accounting,
 *      placeholder scan).
 *   4. Atomic staging — every write is staged during the scan pass and lands
 *      on disk only after the whole run validates clean and the ledger sums.
 *
 * Exit codes: 0 = clean, 1 = build failure, 2 = validation failure.
 * ═══════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KERNEL_ORDER, KERNEL_DEPENDENCIES, kernelClosure } from "./kernel-order.mjs";
import { checkLexicalBalance, scanPlaceholders } from "./scan-kit.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const KERNEL_DIR = path.join(ROOT, "kernel");
const SRC_DIR = path.join(ROOT, "src");
const DIST_DIR = path.join(ROOT, "dist");

/* Single-file scripts in src/ that inline kernel modules at build time
 * directly after the ==/UserScript== block. */
const SRC_KERNEL = {
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

function deriveGlyphIcon() {
    const brandSrc = fs.readFileSync(path.join(KERNEL_DIR, "brand.js"), "utf8");
    const m = brandSrc.match(/const GLYPH_SVG =\s*([\s\S]*?);\s*\n/);
    if (!m) throw new Error("kernel/brand.js: GLYPH_SVG constant not found — the @icon cannot be derived");
    const svg = new Function(`return (${m[1]});`)();
    return "data:image/svg+xml," + encodeURIComponent(svg);
}

let GLYPH_ICON = null;
try {
    GLYPH_ICON = deriveGlyphIcon();
} catch (e) {
    console.error("\nBUILD FAILURES:");
    console.error(`  ✗ ${e.code ? `kernel/brand.js: ${e.code}` : e.message}`);
    process.exit(1);
}

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
        base = meta.kernel;
    } else {
        const referenced = [];
        for (const mod of KERNEL_ORDER) {
            if (new RegExp(`Ψ\\.${mod}\\b`).test(bodySrc)) referenced.push(mod);
        }
        base = referenced;
    }
    for (const mod of base) {
        if (!KERNEL_ORDER.includes(mod)) {
            throw new Error(`${meta.name}: meta.kernel lists "${mod}" — modular builds support only [${KERNEL_ORDER.join(", ")}] (net rides the SRC_KERNEL path)`);
        }
    }
    return kernelClosure(base);
}

/* ── Modular script build ────────────────────────────────────────────────── */

function buildModule(dir) {
    const metaPath = path.join(dir, "meta.json");
    const bodyPath = path.join(dir, "body.js");
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    const body = fs.readFileSync(bodyPath, "utf8");
    const filename = meta.filename || `${meta.name}.user.js`;

    const kernelMods = selectKernel(body, meta);
    const directRefs = new Set(KERNEL_ORDER.filter((mod) => new RegExp(`Ψ\\.${mod}\\b`).test(body)));
    const isDepOfIncluded = (mod) => kernelMods.some((m) => m !== mod && (KERNEL_DEPENDENCIES[m] || []).includes(mod));
    for (const mod of kernelMods) {
        if (directRefs.has(mod) || isDepOfIncluded(mod)) continue;
        throw new Error(`${meta.name}: kernel "${mod}" included but never used (dead code)`);
    }
    const kernelChunks = [];
    for (const mod of KERNEL_ORDER) {
        if (!kernelMods.includes(mod)) continue;
        const p = path.join(KERNEL_DIR, `${mod}.js`);
        if (!fs.existsSync(p)) throw new Error(`${meta.name}: kernel module "${mod}" not found`);
        kernelChunks.push(`    /* ══ kernel/${mod}.js ══ */\n${fs.readFileSync(p, "utf8").trim()}`);
    }

    for (const mod of KERNEL_ORDER) {
        if (kernelMods.includes(mod)) continue;
        if (new RegExp(`Ψ\\.${mod}\\b`).test(body)) {
            throw new Error(`${meta.name}: body references Ψ.${mod} but it is not in meta.kernel`);
        }
    }

    const out = [
        emitHeader(meta, filename),
        "",
        `/* ${meta.name} v${meta.version} — built from src/${path.basename(dir)} + kernel {${kernelMods.join(", ")}}`,
        ` * ${meta.description}`,
        " * This is a generated file; edit src/ and run `npm run build`.",
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
    try {
        fs.mkdirSync(DIST_DIR, { recursive: true });
    } catch (e) {
        console.error(`\nBUILD FAILURES:\n  dist mkdir: ${e.code || e.message}\n`);
        process.exit(1);
    }

    const failures = [];
    const built = [];
    const outputs = new Set();
    const staged = [];
    let carried = 0;
    let kernelCarried = 0;

    if (!fs.existsSync(SRC_DIR)) {
        failures.push("src/: source directory not found");
    } else {
        let entries;
        try {
            entries = fs.readdirSync(SRC_DIR, { withFileTypes: true })
                .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
        } catch (e) {
            failures.push(`src enumerate: ${e.code || e.message}`);
            entries = [];
        }

        // 1) Componentized scripts in src/<name>/ (meta.json + body.js)
        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const modDir = path.join(SRC_DIR, entry.name);
            if (!fs.existsSync(path.join(modDir, "meta.json"))) continue;
            try {
                const { filename, out } = buildModule(modDir);
                const fileFailures = [];
                const balanceErr = checkLexicalBalance(out, filename);
                if (balanceErr) fileFailures.push(balanceErr);
                fileFailures.push(...scanPlaceholders(out, filename));
                if (fileFailures.length === 0) {
                    staged.push({ dest: path.join(DIST_DIR, filename), data: out });
                    built.push(filename);
                    outputs.add(filename);
                } else {
                    failures.push(...fileFailures);
                }
            } catch (e) {
                failures.push(`src/${entry.name}: ${e.message}`);
            }
        }

        // 2) Single-file scripts in src/*.user.js (verbatim or SRC_KERNEL inlined)
        for (const entry of entries) {
            if (!entry.isFile() || !entry.name.endsWith(".user.js")) continue;
            const f = entry.name;
            const fullSrcPath = path.join(SRC_DIR, f);
            const kernelList = SRC_KERNEL[f];

            if (!kernelList) {
                let carrySrc;
                try {
                    carrySrc = fs.readFileSync(fullSrcPath, "utf8");
                } catch (e) {
                    failures.push(`src ${f}: ${e.code || e.message}`);
                    continue;
                }
                const carryFailures = scanPlaceholders(carrySrc, f);
                const carryBalance = checkLexicalBalance(carrySrc, f);
                if (carryBalance) carryFailures.push(carryBalance);
                if (carryFailures.length === 0) {
                    staged.push({ dest: path.join(DIST_DIR, f), src: fullSrcPath });
                    outputs.add(f);
                    carried++;
                } else {
                    failures.push(...carryFailures);
                }
                continue;
            }

            let src;
            try {
                src = fs.readFileSync(fullSrcPath, "utf8");
            } catch (e) {
                failures.push(`src ${f}: ${e.code || e.message}`);
                continue;
            }
            const marker = src.indexOf("==/UserScript==");
            if (marker === -1) {
                failures.push(`src ${f}: no ==/UserScript== end-marker — refusing to inline kernel before the metadata block`);
                continue;
            }
            const chunks = [];
            let moduleMissing = false;
            for (const mod of kernelList) {
                const p = path.join(KERNEL_DIR, `${mod}.js`);
                if (!fs.existsSync(p)) {
                    failures.push(`src ${f}: kernel module "${mod}" not found`);
                    moduleMissing = true;
                    continue;
                }
                let kernelSrc;
                try {
                    kernelSrc = fs.readFileSync(p, "utf8").trim();
                } catch (e) {
                    failures.push(`src ${f}: kernel module "${mod}" unreadable: ${e.code || e.message}`);
                    moduleMissing = true;
                    continue;
                }
                chunks.push(`/* ══ kernel/${mod}.js (inlined by tools/build.mjs — edit kernel/, not here) ══ */\n${kernelSrc}`);
            }
            if (moduleMissing) continue;

            const nl = src.indexOf("\n", marker);
            if (nl === -1) {
                failures.push(`src ${f}: no newline after ==/UserScript== end-marker — refusing to inline kernel before the metadata block`);
                continue;
            }
            const cut = nl + 1;
            const out = src.slice(0, cut) + "\n" + chunks.join("\n\n") + "\n\n" + src.slice(cut);
            const fileFailures = [];
            const balanceErr = checkLexicalBalance(out, f);
            if (balanceErr) fileFailures.push(balanceErr);
            fileFailures.push(...scanPlaceholders(out, f));
            if (fileFailures.length === 0) {
                staged.push({ dest: path.join(DIST_DIR, f), data: out });
                outputs.add(f);
                kernelCarried++;
            } else {
                failures.push(...fileFailures);
            }
        }
    }

    if (built.length + carried + kernelCarried !== outputs.size) {
        failures.push(`build ledger does not sum: ${built.length} built + ${carried} verbatim + ${kernelCarried} kernel-inlined ≠ ${outputs.size} dist outputs`);
    }

    // 3) Flush + prune (only after the whole run validates clean)
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
    const clean = failures.length === 0;
    for (const f of built) console.log(clean ? `  ✓ built  ${f}` : `  ⧗ staged ${f}`);
    if (carried) console.log(clean ? `  ✓ carried ${carried} src script(s) verbatim` : `  ⧗ staged ${carried} src script(s) verbatim`);
    for (const f of Object.keys(SRC_KERNEL)) {
        if (outputs.has(f)) console.log(clean ? `  ✓ carried ${f} + kernel {${SRC_KERNEL[f].join(", ")}}` : `  ⧗ staged ${f} + kernel {${SRC_KERNEL[f].join(", ")}}`);
    }
    for (const f of stale) console.log(`  − pruned  ${f} (no src source)`);

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
