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
 *   3. Lexical validation on every output (§1.1-aware brace accounting,
 *      placeholder scan, unresolved-Ψ-reference scan).
 *
 * Exit codes: 0 = clean, 1 = build failure, 2 = validation failure.
 * ═══════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const KERNEL_DIR = path.join(ROOT, "kernel");
const MODULES_DIR = path.join(ROOT, "modules");
const CANON_DIR = path.join(ROOT, "canon");
const DIST_DIR = path.join(ROOT, "dist");

const KERNEL_ORDER = ["brand", "core", "glass", "store", "hotkeys", "hosts"];

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
    "4ndr0tools - Instagram++.user.js": ["net"],
    "4ndr0tools - LinkMasterΨ.user.js": ["net"],
    "4ndr0tools - m3u8++.user.js": ["net"],
    "4ndr0tools - Prompt Master.user.js": ["net"],
    "4ndr0tools - Recon.user.js": ["net"],
    "4ndr0tools - Stream Interceptor.user.js": ["net"],
    "4ndr0tools - Watermark++.user.js": ["net"],
};
const GLYPH_ICON =
    "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E";

/* ── §1.1-aware lexical scanner (JS: comments, strings, templates, regex) ── */

/** Returns null when balanced, or a descriptive error string.
 * v1.4.5: ported the v1.3.0 lastSig fix from validate.mjs — the old
 * backward prevSignificant() walk stopped at a block-comment terminator's
 * slash, so a regex literal directly after a closing comment token was
 * scanned as division, and a slash inside its first character class
 * (e.g. Akasha's /(?:^|[?&/._-])track…/ after the ampersand) then opened
 * a PHANTOM regex that swallowed live parens. lastSig is tracked FORWARD
 * (last significant CODE character, comments and strings excluded by
 * construction). */
function checkLexicalBalance(src, label) {
    let i = 0, line = 1;
    const n = src.length;
    const stack = [];
    let lastSig = "";
    const skipTemplate = (start) => {
        let k = start + 1;
        while (k < n) {
            if (src[k] === "\\") { k += 2; continue; }
            if (src[k] === "`") return k + 1;
            k++;
        }
        return -1;
    };
    while (i < n) {
        const c = src[i];
        if (c === "\n") { line++; i++; continue; }
        if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
        if (c === "/" && src[i + 1] === "*") {
            const end = src.indexOf("*/", i + 2);
            if (end === -1) return `${label}: unterminated block comment at line ${line}`;
            line += src.slice(i, end).split("\n").length - 1; i = end + 2; continue;
        }
        if (c === '"' || c === "'") {
            i++;
            while (i < n) {
                if (src[i] === "\\") { i += 2; continue; }
                if (src[i] === c) { i++; break; }
                if (src[i] === "\n") return `${label}: unterminated ${c} string at line ${line}`;
                i++;
            }
            lastSig = c;
            continue;
        }
        if (c === "`") {
            i++;
            while (i < n) {
                if (src[i] === "\\") { i += 2; continue; }
                if (src[i] === "`") { i++; break; }
                if (src[i] === "$" && src[i + 1] === "{") {
                    // template interpolation: structurally live braces
                    let depth = 1; i += 2;
                    while (i < n && depth > 0) {
                        if (src[i] === "{") depth++;
                        else if (src[i] === "}") depth--;
                        else if (src[i] === "`") { // nested template
                            /* v1.4.7: fixed the v1.4.5 port drift — this call
                             * passed (src, i) into the one-argument
                             * skipTemplate(start), so `start` received the
                             * whole source STRING, `start + 1` concatenated,
                             * and every nested-template-in-interpolation
                             * returned -1 ("unterminated nested template").
                             * Latent until Prompt Master (dense `${…`…`…}`
                             * nesting) became a kernel consumer this round;
                             * validate.mjs's v1.3.0 original always had the
                             * correct one-argument form. */
                            const r = skipTemplate(i);
                            if (r === -1) return `${label}: unterminated nested template at line ${line}`;
                            i = r;
                            continue;
                        }
                        i++;
                    }
                    continue;
                }
                i++;
            }
            lastSig = c;
            continue;
        }
        if (c === "/" && /[(,=:[!&|?{};+\-*%<>~^]/.test(lastSig || "(")) {
            // regex literal (heuristic per §1.1: only where a value may start)
            i++;
            let inClass = false;
            while (i < n) {
                if (src[i] === "\\") { i += 2; continue; }
                if (src[i] === "[") inClass = true;
                else if (src[i] === "]") inClass = false;
                else if (src[i] === "/" && !inClass) { i++; break; }
                else if (src[i] === "\n") break; // not a regex after all
                i++;
            }
            lastSig = "/";
            continue;
        }
        if (c === "(" || c === "[" || c === "{") {
            stack.push({ ch: c, line });
            lastSig = c; i++; continue;
        }
        if (c === ")" || c === "]" || c === "}") {
            const top = stack.pop();
            if (!top) return `${label}: unmatched "${c}" at line ${line}`;
            const pairs = { "(": ")", "[": "]", "{": "}" };
            if (pairs[top.ch] !== c) return `${label}: "${c}" at line ${line} closes "${top.ch}" opened at line ${top.line}`;
            lastSig = c; i++; continue;
        }
        if (!/\s/.test(c)) lastSig = c;
        i++;
    }
    if (stack.length > 0) return `${label}: unclosed "${stack[stack.length - 1].ch}" opened at line ${stack[stack.length - 1].line}`;
    return null;
}

/* ── Placeholder scan (GUP §7.3 zero-placeholder rule) ─────────────────── */

const PLACEHOLDER_PATTERNS = [
    /\bTODO[:\s]/, /\bFIXME\b/, /\bXXX\b/, /\bHACK\b/,
    /["'`]PLACEHOLDER["'`]/i,            // quoted placeholder VALUE (legacy bug class)
    /=\s*["']TODO["']/,
    /\.\.\.\s*existing\s+code/i,
    /\/\/\s*\.\.\.\s*$/,
    /\bpass\s*#\s*todo\b/i,
    /\/\*\s*implementation\s+pending\s*\*\//i,
];

function scanPlaceholders(src, label) {
    const hits = [];
    const lines = src.split("\n");
    for (let ln = 0; ln < lines.length; ln++) {
        // Strip strings/comments crudely per line to avoid false positives
        const code = lines[ln]
            .replace(/\/\/.*$/, "")
            .replace(/\/\*.*?\*\//g, "")
            .replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '""');
        for (const pat of PLACEHOLDER_PATTERNS) {
            if (pat.test(code)) hits.push(`${label}: line ${ln + 1}: ${pat.source}`);
        }
    }
    return hits;
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
    if (Array.isArray(meta.kernel) && meta.kernel.length > 0) return meta.kernel;
    const needed = [];
    for (const mod of KERNEL_ORDER) {
        if (new RegExp(`Ψ\\.${mod}\\b`).test(bodySrc)) needed.push(mod);
    }
    // store is implied by glass (hud position persistence)
    if (needed.includes("glass") && !needed.includes("store")) needed.push("store");
    if (needed.includes("hosts") && !needed.includes("core")) needed.push("core");
    return needed;
}

/* ── Module build ────────────────────────────────────────────────────────── */

function buildModule(dir) {
    const metaPath = path.join(dir, "meta.json");
    const bodyPath = path.join(dir, "body.js");
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    const body = fs.readFileSync(bodyPath, "utf8");
    const filename = meta.filename || `${meta.name}.user.js`;

    const kernelMods = selectKernel(body, meta);
    const kernelChunks = [];
    for (const mod of KERNEL_ORDER) {
        if (!kernelMods.includes(mod)) continue;
        const p = path.join(KERNEL_DIR, `${mod}.js`);
        if (!fs.existsSync(p)) throw new Error(`${meta.name}: kernel module "${mod}" not found`);
        kernelChunks.push(`    /* ══ kernel/${mod}.js ══ */\n${fs.readFileSync(p, "utf8").trim()}`);
    }

    /* Every kernel module must actually be referenced after inclusion. */
    for (const mod of kernelMods) {
        if (mod === "brand" || mod === "store") continue; // implicit deps
        if (!new RegExp(`Ψ\\.${mod}\\b`).test(body)) {
            throw new Error(`${meta.name}: kernel "${mod}" included but never used (dead code)`);
        }
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
    fs.mkdirSync(DIST_DIR, { recursive: true });
    const failures = [];
    const built = [];
    const outputs = new Set();

    // 1) Kernel-powered modules
    if (fs.existsSync(MODULES_DIR)) {
        for (const entry of fs.readdirSync(MODULES_DIR, { withFileTypes: true })) {
            if (!entry.isDirectory()) continue;
            try {
                const { filename, out } = buildModule(path.join(MODULES_DIR, entry.name));
                const balanceErr = checkLexicalBalance(out, filename);
                if (balanceErr) failures.push(balanceErr);
                const placeholders = scanPlaceholders(out, filename);
                failures.push(...placeholders);
                fs.writeFileSync(path.join(DIST_DIR, filename), out);
                built.push(filename);
                outputs.add(filename);
            } catch (e) {
                failures.push(`module ${entry.name}: ${e.message}`);
            }
        }
    }

    // 2) Canon carries (verbatim) — except CANON_KERNEL consumers, which
    //    are carried with their declared kernel modules inlined.
    let carried = 0;
    if (fs.existsSync(CANON_DIR)) {
        for (const entry of fs.readdirSync(CANON_DIR, { withFileTypes: true })) {
            if (!entry.isDirectory()) continue;
            const dir = path.join(CANON_DIR, entry.name);
            for (const f of fs.readdirSync(dir)) {
                if (!f.endsWith(".user.js")) continue;
                const kernelList = CANON_KERNEL[f];
                if (!kernelList) {
                    fs.copyFileSync(path.join(dir, f), path.join(DIST_DIR, f));
                    outputs.add(f);
                    carried++;
                    continue;
                }
                const src = fs.readFileSync(path.join(dir, f), "utf8");
                const chunks = [];
                for (const mod of kernelList) {
                    const p = path.join(KERNEL_DIR, `${mod}.js`);
                    if (!fs.existsSync(p)) {
                        failures.push(`canon ${f}: kernel module "${mod}" not found`);
                        continue;
                    }
                    chunks.push(`/* ══ kernel/${mod}.js (inlined by tools/build.mjs — edit kernel/, not here) ══ */\n${fs.readFileSync(p, "utf8").trim()}`);
                }
                const marker = src.indexOf("==/UserScript==");
                const cut = marker === -1 ? 0 : src.indexOf("\n", marker) + 1;
                const out = src.slice(0, cut) + "\n" + chunks.join("\n\n") + "\n\n" + src.slice(cut);
                const balanceErr = checkLexicalBalance(out, f);
                if (balanceErr) failures.push(balanceErr);
                failures.push(...scanPlaceholders(out, f));
                fs.writeFileSync(path.join(DIST_DIR, f), out);
                outputs.add(f);
            }
        }
    }

    // 3) Prune stale dist artifacts — orphaned installables whose canon
    //    source was retired/merged are dead weight on the install channel
    //    (and would keep answering @updateURL checks after retirement).
    const stale = [];
    for (const f of fs.readdirSync(DIST_DIR)) {
        if (f.endsWith(".user.js") && !outputs.has(f)) {
            fs.rmSync(path.join(DIST_DIR, f));
            stale.push(f);
        }
    }

    // 4) Report
    for (const f of built) console.log(`  ✓ built  ${f}`);
    if (carried) console.log(`  ✓ carried ${carried} canon script(s) verbatim`);
    for (const f of Object.keys(CANON_KERNEL)) {
        if (outputs.has(f)) console.log(`  ✓ carried ${f} + kernel {${CANON_KERNEL[f].join(", ")}}`);
    }
    for (const f of stale) console.log(`  − pruned  ${f} (no canon source)`);

    if (failures.length > 0) {
        console.error("\nBUILD FAILURES:");
        for (const f of failures) console.error(`  ✗ ${f}`);
        process.exit(failures.some((f) => !f.includes("placeholder")) ? 1 : 2);
    }
    console.log(`\nSuite build complete: ${built.length} built, ${carried} carried.`);
    return 0;
}

process.exit(main());
