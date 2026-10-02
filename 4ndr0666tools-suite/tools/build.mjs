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

const KERNEL_ORDER = ["brand", "core", "glass", "net", "store", "clipboard", "hotkeys", "hosts"];
const GLYPH_ICON =
    "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E";

/* ── §1.1-aware lexical scanner (JS: comments, strings, templates, regex) ── */

/** Returns null when balanced, or a descriptive error string. */
function checkLexicalBalance(src, label) {
    let i = 0, line = 1;
    const n = src.length;
    const stack = [];
    const push = (ch, ln) => stack.push({ ch, ln });
    const popMatch = (ch, closer) => {
        if (stack.length === 0) return `unmatched "${closer}" at line ${line}`;
        const top = stack.pop();
        const pairs = { "(": ")", "[": "]", "{": "}" };
        if (pairs[top.ch] !== closer) return `"${closer}" at line ${line} closes "${top.ch}" opened at line ${top.ln}`;
        return null;
    };
    const prevSignificant = () => {
        let j = i - 1;
        while (j >= 0 && /\s/.test(src[j])) j--;
        return j >= 0 ? src[j] : "";
    };
    while (i < n) {
        const c = src[i];
        if (c === "\n") { line++; i++; continue; }
        if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
        if (c === "/" && src[i + 1] === "*") {
            const end = src.indexOf("*/", i + 2);
            const nl = src.slice(i, end === -1 ? n : end).split("\n").length - 1;
            if (end === -1) return `unterminated block comment at line ${line}`;
            line += nl; i = end + 2; continue;
        }
        if (c === '"' || c === "'") {
            i++;
            while (i < n) {
                if (src[i] === "\\") { i += 2; continue; }
                if (src[i] === c) { i++; break; }
                if (src[i] === "\n") return `unterminated ${c} string at line ${line}`;
                i++;
            }
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
                            const r = skipTemplate(src, i);
                            if (r === -1) return `unterminated nested template at line ${line}`;
                            i = r;
                            continue;
                        }
                        i++;
                    }
                    continue;
                }
                i++;
            }
            continue;
        }
        if (c === "/" && /[(,=:[!&|?{};+\-*%<>~^]/.test(prevSignificant() || "(")) {
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
            continue;
        }
        if (c === "(" || c === "[" || c === "{") push(c, line);
        else if (c === ")" || c === "]" || c === "}") {
            const err = popMatch(c, c);
            if (err) return `${label}: ${err}`;
        }
        i++;
    }
    if (stack.length > 0) return `${label}: unclosed "${stack[stack.length - 1].ch}" opened at line ${stack[stack.length - 1].ln}`;
    return null;
}

function skipTemplate(src, start) {
    let i = start + 1;
    const n = src.length;
    while (i < n) {
        if (src[i] === "\\") { i += 2; continue; }
        if (src[i] === "`") return i + 1;
        i++;
    }
    return -1;
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
            } catch (e) {
                failures.push(`module ${entry.name}: ${e.message}`);
            }
        }
    }

    // 2) Canon carries (verbatim)
    let carried = 0;
    if (fs.existsSync(CANON_DIR)) {
        for (const entry of fs.readdirSync(CANON_DIR, { withFileTypes: true })) {
            if (!entry.isDirectory()) continue;
            const dir = path.join(CANON_DIR, entry.name);
            for (const f of fs.readdirSync(dir)) {
                if (!f.endsWith(".user.js")) continue;
                fs.copyFileSync(path.join(dir, f), path.join(DIST_DIR, f));
                carried++;
            }
        }
    }

    // 3) Report
    for (const f of built) console.log(`  ✓ built  ${f}`);
    if (carried) console.log(`  ✓ carried ${carried} canon script(s) verbatim`);

    if (failures.length > 0) {
        console.error("\nBUILD FAILURES:");
        for (const f of failures) console.error(`  ✗ ${f}`);
        process.exit(failures.some((f) => !f.includes("placeholder")) ? 1 : 2);
    }
    console.log(`\nSuite build complete: ${built.length} built, ${carried} carried.`);
    return 0;
}

process.exit(main());
