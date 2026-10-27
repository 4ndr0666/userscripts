#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/scope-census.mjs — promise-settlement free-variable census (r11)
 * ----------------------------------------------------------------------------
 * Round mandate (WO-01 round 11, OBI-F01): the operator's first real battery
 * run caught 'Uncaught ReferenceError: resolve is not defined at
 * finishSuccessfulLoad' — Forums++ 1.12.1..1.13.5 shipped a function defined
 * in startDownload's scope that referenced the downloadPromise EXECUTOR's
 * `resolve` param: a free variable outside its binding scope. Every
 * successful onload threw at the settle line — the file was counted and
 * staged into the zip, but the per-file promise NEVER settled, the
 * concurrency slot never freed, and the batch wedged forever ('fired up
 * gofile++ to absolutely zero avail'). Five rounds of static audits missed
 * it because every prior census reads SHAPE (what is called, how errors are
 * typed, which hosts are declared) — none read BINDING (where a name is
 * lexically bound). This census is that gate.
 *
 * What it scans: the REVIEW SOURCES — every canon/<tier> .user.js, every
 * modules/<name>/body.js, and every kernel/*.js — on the codeOnly view
 * (string contents, comments and template text blanked; interpolation code
 * and line numbers preserved). dist is a machine-verified splice of these
 * files (SIZE-AUDIT), so the review sources are the truth.
 *
 * The instrument, per settlement name N in {resolve, reject, settle,
 * fulfill} (the promise-settlement idiom set):
 *
 *   BINDING SPANS — every function whose parameter list binds N (the
 *     Promise executor `new Promise(resolve => …)` is one of these), every
 *     `const|let|var|function` declaration of N (span = the enclosing
 *     block), every `catch (N)` — each contributes the range where a
 *     reference to N closes over a real binding.
 *
 *   REFERENCES — every identifier token N in value position: a call
 *     (`N(`), an argument (`f(N)` / `.then(N, …)`), a terminator position
 *     (`return N` / `=> N`), an assignment value (`x = N`), a ternary arm
 *     (`c ? N : r` / `c ? a : N`). Property accesses (`obj.N`), object keys
 *     (`{N: …}`), binding positions themselves and `N =>` params are
 *     excluded. Method shorthand (`{ N(…) }` after `,`) can surface as a
 *     call-shaped false positive — the fail-visible direction the suite
 *     prefers; the ledger adjudicates it if it ever appears.
 *
 *   A reference outside EVERY binding span of its name is a free variable —
 *     the OBI-F01 class — and fails the gate with file:line. The
 *     approximation is range-based, not a full scope-chain walk: it can
 *     only over-approximate validity (textually-inside = treated valid),
 *     never invent a failure out of lexically-correct code beyond the
 *     documented method-shorthand shape.
 *
 * Self-assertion (class-closure, non-shrink): a synthetic fixture pair runs
 * through the same analyzer at check time — the known-BAD shape (the exact
 * OBI-F01 structure) must be flagged, the known-GOOD shape (the 1.13.6
 * settle-parameter fix) must pass. A census that cannot catch the class it
 * was born from fails closed.
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CURRENT_ROUND, roundLt } from "./census-round.mjs";
import { codeOnlyCached } from "./scan-kit.mjs";

const DEFAULT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/* ── the promise-settlement idiom set ─────────────────────────────────────── */
const SETTLE_NAMES = new Set(["resolve", "reject", "settle", "fulfill"]);

/* ── Adjudication ledger: sanctioned free-variable occurrences ──────────────
 * None at birth (r11): the tree is clean. An entry is {file, count, reason,
 * expiry} — count drift in EITHER direction fails (the entry must track the
 * real occurrence count), expiry uses the G9 re-adjudication clock. */
const ADJUDICATED = [];

const ledgerKey = (e) => `${e.file}::${e.count}`;

/* ── tokenizer on the codeOnly view (§1.1 regex/division heuristic) ───────── */

/* Value-position preceders: after these an `/` opens a regex literal. */
const VALUE_PRECEDERS = new Set(["return", "typeof", "instanceof", "in", "of", "case", "delete", "void", "throw", "new", "do", "else", "yield", "await"]);

function tokenize(view) {
    /* Tokens: {kind:'id'|'num'|'punc'|'regex', value, start, end}. The
     * scan-kit lastSig discipline decides regex-vs-division; regex bodies
     * are skipped wholesale (a settlement name inside a regex is prose, not
     * a binding — codeOnly already blanks the other prose classes). */
    const toks = [];
    const n = view.length;
    let i = 0;
    let lastSig = ""; /* "" = value position (regex-legal); ")" "]" "x" = after-value (division) */
    while (i < n) {
        const c = view[i];
        if (c === " " || c === "\t" || c === "\n" || c === "\r") { i++; continue; }
        if (/[A-Za-z_$]/.test(c)) {
            let j = i + 1;
            while (j < n && /[A-Za-z0-9_$]/.test(view[j])) j++;
            const value = view.slice(i, j);
            toks.push({ kind: "id", value, start: i, end: j });
            /* §1.1 (the scan-kit lastSig disciplines): identifiers that END an
             * expression put the next `/` in VALUE position (regex-legal);
             * `return\n/re…/` is the canonical trap — the trailing-letter rule. */
            lastSig = VALUE_PRECEDERS.has(value) ? "" : "x";
            i = j;
            continue;
        }
        if (/[0-9]/.test(c)) {
            let j = i + 1;
            while (j < n && /[0-9a-fA-FxX.eE_]/.test(view[j])) j++;
            toks.push({ kind: "num", value: view.slice(i, j), start: i, end: j });
            lastSig = "x";
            i = j;
            continue;
        }
        if (c === "/" && lastSig !== "x" && lastSig !== ")" && lastSig !== "]") {
            /* value position → regex literal: skip to its close (char classes
             * and escaped slashes honored; a newline means it was not a
             * regex after all — §1.1 lets the lexical-balance gate own it). */
            let j = i + 1, inClass = false;
            while (j < n) {
                const r = view[j];
                if (r === "\\") { j += 2; continue; }
                if (r === "\n") break;
                if (r === "[") inClass = true;
                else if (r === "]") inClass = false;
                else if (r === "/" && !inClass) { j++; break; }
                j++;
            }
            toks.push({ kind: "regex", value: "", start: i, end: j });
            lastSig = "x";
            i = j;
            continue;
        }
        if (c === '"' || c === "'" || c === "`") {
            /* codeOnly emits quotes as empty pairs with blanked bodies. */
            toks.push({ kind: "punc", value: c, start: i, end: i + 1 });
            lastSig = "x";
            i++;
            continue;
        }
        if (c === "=" && view[i + 1] === ">") {
            toks.push({ kind: "punc", value: "=>", start: i, end: i + 2 });
            lastSig = "=>";
            i += 2;
            continue;
        }
        const two = view.slice(i, i + 2);
        if (["==", "!=", "<=", ">=", "&&", "||", "??", "+=", "-=", "*=", "/=", "%=", "**"].includes(two)) {
            toks.push({ kind: "punc", value: two, start: i, end: i + 2 });
            lastSig = "op";
            i += 2;
            continue;
        }
        toks.push({ kind: "punc", value: c, start: i, end: i + 1 });
        /* division positions: `)` and `]` end a value; every other single
         * punctuator (openers, separators, operators, `.`) is regex-legal. */
        lastSig = c === ")" || c === "]" ? c : "op";
        i++;
    }
    return toks;
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

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

/* Expression-bodied arrow end: the offset where the body's enclosing context
 * closes (over-approximation toward validity — a full expression parser is
 * not warranted for the class). */
function expressionEnd(toks, from) {
    let depth = 0;
    for (let t = from; t < toks.length; t++) {
        const v = toks[t].value;
        if (toks[t].kind === "punc" && (v === "(" || v === "[" || v === "{")) depth++;
        else if (toks[t].kind === "punc" && (v === ")" || v === "]" || v === "}")) { if (depth === 0) return toks[t].end; depth--; }
        else if (depth === 0 && toks[t].kind === "punc" && (v === "," || v === ";")) return toks[t].start;
    }
    return toks.length ? toks[toks.length - 1].end : 0;
}

/* ── analyze: binding spans + reference sites for the settlement names ────── */

function analyze(view) {
    const toks = tokenize(view);
    const n = toks.length;

    /* bracket pairing */
    const pairClose = new Array(n).fill(-1);
    const pairOpen = new Array(n).fill(-1);
    {
        const stack = [];
        for (let t = 0; t < n; t++) {
            const tk = toks[t];
            if (tk.kind !== "punc") continue;
            if (tk.value === "(" || tk.value === "[" || tk.value === "{") stack.push(t);
            else if (tk.value === ")" || tk.value === "]" || tk.value === "}") {
                const open = stack.pop();
                if (open === undefined) continue; /* unbalanced: lexical-balance gate owns it */
                pairClose[open] = t;
                pairOpen[t] = open;
            }
        }
    }

    const spansByName = new Map(); /* name → [{start, end}] */
    const bindPositions = new Set(); /* token start offsets that BIND a settle name */
    const addSpan = (name, start, end) => {
        if (end <= start) return;
        if (!spansByName.has(name)) spansByName.set(name, []);
        spansByName.get(name).push({ start, end });
    };

    /* arrow body end: `{…}` block → exact pair close; expression → the
     * enclosing-context close (over-valid). */
    const arrowEnd = (arrowIdx) => {
        const bodyOpen = arrowIdx + 1 < n && toks[arrowIdx + 1].kind === "punc" && toks[arrowIdx + 1].value === "{" ? arrowIdx + 1 : -1;
        if (bodyOpen !== -1 && pairClose[bodyOpen] !== -1) return toks[pairClose[bodyOpen]].end;
        return expressionEnd(toks, arrowIdx + 1);
    };

    /* pass A — functions and declarations. Every function shape that binds a
     * settle name contributes its FULL span (params through body close):
     * inner functions are visited by the same token walk, so nesting binds
     * correctly. */
    for (let t = 0; t < n; t++) {
        const tk = toks[t];
        if (tk.kind !== "id" && tk.kind !== "punc") continue;

        /* `function [NAME] ( params ) { body }` */
        if (tk.kind === "id" && tk.value === "function") {
            let p = t + 1;
            if (p < n && toks[p].kind === "id") {
                /* named declaration: `function resolve(…)` — declarations HOIST
                 * to the enclosing block (sibling functions may close over
                 * them: kernel/hosts.js `run()` calling `resolve()` is the
                 * canonical in-tree shape), so the binding span is the
                 * enclosing block, not the function's own body. */
                if (SETTLE_NAMES.has(toks[p].value)) {
                    bindPositions.add(toks[p].start);
                    let encl = -1;
                    for (let q = t - 1; q >= 0; q--) {
                        if (toks[q].kind === "punc" && toks[q].value === "{") { encl = q; break; }
                    }
                    if (encl !== -1 && pairClose[encl] !== -1 && pairClose[encl] > t) addSpan(toks[p].value, toks[encl].start, toks[pairClose[encl]].end);
                    else addSpan(toks[p].value, 0, view.length);
                }
                p++; /* skip the name */
            }
            if (p < n && toks[p].kind === "punc" && toks[p].value === "(" && pairClose[p] !== -1) {
                const paramClose = pairClose[p];
                const bodyOpen = paramClose + 1 < n && toks[paramClose + 1].kind === "punc" && toks[paramClose + 1].value === "{" ? paramClose + 1 : -1;
                const fnEnd = bodyOpen !== -1 && pairClose[bodyOpen] !== -1 ? toks[pairClose[bodyOpen]].end : toks[paramClose].end;
                for (let q = p + 1; q < paramClose; q++) {
                    if (toks[q].kind === "id" && SETTLE_NAMES.has(toks[q].value)) {
                        bindPositions.add(toks[q].start);
                        addSpan(toks[q].value, tk.start, fnEnd);
                    }
                }
            }
            continue;
        }

        /* arrows: `N =>` (single param) or `( … N … ) =>` */
        if (tk.kind === "punc" && tk.value === "=>") {
            if (t === 0) continue;
            const prev = toks[t - 1];
            if (prev.kind === "id" && SETTLE_NAMES.has(prev.value)) {
                bindPositions.add(prev.start);
                addSpan(prev.value, prev.start, arrowEnd(t));
            } else if (prev.kind === "punc" && prev.value === ")") {
                const listOpen = pairOpen[t - 1];
                if (listOpen !== -1) {
                    const end = arrowEnd(t);
                    for (let q = listOpen + 1; q < t - 1; q++) {
                        if (toks[q].kind === "id" && SETTLE_NAMES.has(toks[q].value)) {
                            bindPositions.add(toks[q].start);
                            addSpan(toks[q].value, toks[listOpen].start, end);
                        }
                    }
                }
            }
            continue;
        }

        /* `const|let|var N = …` — span = the enclosing block (nearest `{`
         * before the declaration whose pair closes after it; top-level →
         * the whole view). Over-valid by construction. */
        if (tk.kind === "id" && (tk.value === "const" || tk.value === "let" || tk.value === "var")) {
            const nx = toks[t + 1];
            if (nx && nx.kind === "id" && SETTLE_NAMES.has(nx.value)) {
                bindPositions.add(nx.start);
                let encl = -1;
                for (let q = t - 1; q >= 0; q--) {
                    if (toks[q].kind === "punc" && toks[q].value === "{") { encl = q; break; }
                }
                if (encl !== -1 && pairClose[encl] !== -1 && pairClose[encl] > t) addSpan(nx.value, toks[encl].start, toks[pairClose[encl]].end);
                else addSpan(nx.value, 0, view.length);
            }
            continue;
        }

        /* `catch (N) { … }` */
        if (tk.kind === "id" && tk.value === "catch") {
            const po = t + 1;
            if (po + 1 < n && toks[po].kind === "punc" && toks[po].value === "(" && pairClose[po] !== -1) {
                const arg = toks[po + 1];
                if (arg && arg.kind === "id" && SETTLE_NAMES.has(arg.value)) {
                    bindPositions.add(arg.start);
                    const close = pairClose[po];
                    const bo = close + 1 < n && toks[close + 1].value === "{" ? close + 1 : -1;
                    if (bo !== -1 && pairClose[bo] !== -1) addSpan(arg.value, toks[bo].start, toks[pairClose[bo]].end);
                }
            }
            continue;
        }
    }

    /* pass B — references: identifier tokens in value position */
    const FOLLOWERS = new Set(["(", ")", ",", "]", "}", ";", "=", "?", ":"]);
    const refs = [];
    for (let t = 0; t < n; t++) {
        const tk = toks[t];
        if (tk.kind !== "id" || !SETTLE_NAMES.has(tk.value)) continue;
        if (bindPositions.has(tk.start)) continue;
        const prev = t > 0 ? toks[t - 1] : null;
        const next = t + 1 < n ? toks[t + 1] : null;
        const pv = prev ? String(prev.value) : null;
        const nv = next ? String(next.value) : null;
        /* member property: obj.N */
        if (prev && prev.kind === "punc" && (pv === "." || pv === "?.")) continue;
        /* binding-name positions (function/get/set/class names) */
        if (prev && prev.kind === "id" && (pv === "function" || pv === "get" || pv === "set" || pv === "class")) continue;
        /* `N =>` is a param (also recorded in bindPositions — belt+braces) */
        if (next && nv === "=>") continue;
        /* object key: `{ N:` / `, N:` — key, not a reference */
        if (next && nv === ":" && prev && prev.kind === "punc" && (pv === "{" || pv === ",")) continue;
        /* value position: call, argument, terminator, assignment value,
         * ternary arm (`? N :` / `c ? a : N` — the `:`-follower here has a
         * non-key predecessor), or end-of-file. */
        if (next && !FOLLOWERS.has(nv)) continue;
        if (!next && !(prev && prev.kind === "id" && (pv === "return" || pv === "typeof" || pv === "case" || pv === "in" || pv === "of" || pv === "new" || pv === "delete" || pv === "void" || pv === "throw" || pv === "await" || pv === "yield"))) {
            /* EOF without a value-position keyword before it — not a shape
             * the settlement class produces; skip rather than guess. */
            continue;
        }
        refs.push(tk);
    }

    return { spansByName, refs };
}

/* ── per-file verdict ─────────────────────────────────────────────────────── */

function scanText(text) {
    const { spansByName, refs } = analyze(text);
    const free = [];
    for (const ref of refs) {
        const spans = spansByName.get(ref.value) || [];
        const covered = spans.some((s) => ref.start >= s.start && ref.end <= s.end);
        if (!covered) free.push({ name: ref.value, start: ref.start });
    }
    return { free, bindingNames: spansByName.size, refs: refs.length };
}

/* ── self-assertion: the OBI-F01 fixture pair must adjudicate correctly ────── */

const BAD_FIXTURE = `const outer = () => {
    const helper = response => {
        work(response);
        resolve();
    };
    const p = new Promise(resolve => {
        request({ onload: r => helper(r) });
    });
    return p;
};`;

const GOOD_FIXTURE = `const outer = () => {
    const helper = (response, settle) => {
        work(response);
        settle();
    };
    const p = new Promise(resolve => {
        request({ onload: r => helper(r, resolve) });
    });
    return p;
};`;

function assertFixtures(problems) {
    const bad = scanText(BAD_FIXTURE);
    if (bad.free.length !== 1 || bad.free[0].name !== "resolve") {
        problems.push(`scope census self-assertion: the BAD fixture (the exact OBI-F01 shape) must flag exactly one free 'resolve' — flagged ${bad.free.length}${bad.free.length ? " (" + bad.free.map((f) => f.name).join(",") + ")" : ""}`);
    }
    const good = scanText(GOOD_FIXTURE);
    if (good.free.length !== 0) {
        problems.push(`scope census self-assertion: the GOOD fixture (the 1.13.6 settle-parameter shape) must be clean — flagged ${good.free.length} (${good.free.map((f) => f.name).join(",")})`);
    }
}

/* ── the census ───────────────────────────────────────────────────────────── */

export function runScopeCensus(root = DEFAULT_ROOT) {
    const problems = [];
    assertFixtures(problems);

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
    const kernelDir = path.join(root, "kernel");
    if (fs.existsSync(kernelDir)) {
        for (const f of fs.readdirSync(kernelDir).sort()) {
            if (f.endsWith(".js")) targets.push([`kernel/${f}`, path.join(kernelDir, f)]);
        }
    }

    const stats = { filesScanned: 0, references: 0, freeVariables: 0, bindingNames: 0 };
    const perFileFree = new Map();

    for (const [rel, abs] of targets) {
        if (!fs.existsSync(abs)) continue;
        stats.filesScanned++;
        const view = codeOnlyCached(abs);
        const starts = lineStartsOf(view);
        const { free, refs, bindingNames } = scanText(view);
        stats.references += refs;
        stats.bindingNames += bindingNames;
        if (free.length) {
            stats.freeVariables += free.length;
            perFileFree.set(rel, free.map((f) => `${f.name} @ line ${lineOf(starts, f.start)}`));
        }
    }

    /* ledger: every adjudicated entry must match reality (both directions).
     * r11 (11c-F01): the expiry compare fires AT expiry —
     * `!roundLt(CURRENT_ROUND, e.expiry)` — the house G9 convention every
     * sibling census uses; the birth draft's swapped args fired one round
     * late (the 2-a F1 inert-clock class). r11 (11c-F06): exactly ONE entry
     * per file — two same-file entries with different counts let the
     * matching one validate while the stale twin silently coexists. */
    const liveLedger = new Map();
    const ledgerFiles = new Set();
    for (const e of ADJUDICATED) {
        if (ledgerFiles.has(e.file)) {
            problems.push(`scope census ledger: duplicate entries for ${e.file} — exactly one entry per file (count drift-checked both directions)`);
        }
        ledgerFiles.add(e.file);
        if (!roundLt(CURRENT_ROUND, e.expiry)) {
            problems.push(`scope census ledger: entry for ${e.file} expired at ${e.expiry} (current round ${CURRENT_ROUND}) without re-adjudication — G9 fail-closed`);
            continue;
        }
        liveLedger.set(ledgerKey(e), e);
    }
    for (const [rel, sites] of perFileFree) {
        if (liveLedger.has(`${rel}::${sites.length}`)) continue;
        const detail = sites.slice(0, 4).join("; ") + (sites.length > 4 ? ` …+${sites.length - 4} more` : "");
        problems.push(`${rel}: ${sites.length} free-variable settlement reference(s) — ${detail} (a promise-settlement name referenced outside every binding span: the OBI-F01 class — ReferenceError at runtime, the promise never settles)`);
    }
    for (const e of ADJUDICATED) {
        if (!roundLt(CURRENT_ROUND, e.expiry) && !perFileFree.has(e.file)) {
            problems.push(`scope census ledger: entry for ${e.file} (count ${e.count}) no longer matches the tree — remove or re-pin it`);
        }
    }

    return { problems, ...stats, filesWithFree: perFileFree.size };
}

/* ── CLI (main-module-guarded — the 10a F01 discipline; pathToFileURL per
   the house pattern 11c-F05 — a hand-rolled file:// URL breaks on `#`/`?`
   in a filename) ─────────────────────────────────────────────────────── */
const isMain = typeof process.argv[1] === "string"
    && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
    const { problems, ...stats } = runScopeCensus();
    console.log(`scope census: ${stats.filesScanned} source files · ${stats.references} settlement references · ${stats.bindingNames} bound names · ${stats.freeVariables} free`);
    if (problems.length) {
        for (const p of problems) console.log(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("  ✓ zero free-variable settlement references; the OBI-F01 class (Forums++ 1.12.1–1.13.5 'resolve is not defined') is closed repo-wide; fixture self-assertion green (bad shape flagged, fixed shape clean)");
}
