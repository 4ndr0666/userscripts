#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/error-census.mjs — typed-error / silent-swallow census (suite v1.5.1)
 * ----------------------------------------------------------------------------
 * Round mandate (v1.5.0 verdict §2/G11, completed in v1.5.1): the Phase A
 * machine audit found 722 non-kernel catch sites — 144 typed (20%), 390
 * raw empty-body — and NO gate measuring the class. The kernel proves its
 * own typed family (NetError/NetTimeoutError/NetHttpError, smoke battery);
 * everything outside it was unmeasured. This census is that gate.
 * (Precedent: tools/transport-census.mjs v1.4.10.)
 *
 * What it scans: the REVIEW SOURCES — every canon/<tier> .user.js and every
 * modules/<name>/body.js, on the codeOnly view (string contents, comments,
 * template prose and regex bodies blanked; line numbers preserved). The
 * kernel itself is excluded (its typed family is battery-proven and
 * self-asserted below). dist is a machine-verified splice of these files.
 *
 * Per `catch (e) { … }` site, the census brace-matches the handler body and
 * classifies:
 *
 *   TYPED — instanceof branching (NetError family or Error), err.name/code
 *     switching, or a typed re-throw: the D6 primary pattern.
 *
 *   DEBUG — a console.* call (debug/warn/error/log/info) in the handler
 *     body: the D6 scoped-interceptor-with-debug pattern (v1.5.1 inserted
 *     these into the 390 former empty bodies — one scoped, tagged,
 *     level-gated debug line per site, zero functional change).
 *
 *   HANDLED — a non-empty body that does recovery work (fallback return,
 *     flag set, state restore) without logging: legitimate handling, not a
 *     swallow; counted and reported.
 *
 *   SILENT — empty (or comment-only) body, no debug: a true swallow.
 *     silent-count > 0 without a ledger entry for that file → FAIL.
 *
 * Kernel self-assertion (class-closure, non-shrink): kernel/net.js must
 * define the full family (class NetError extends Error, NetTimeoutError,
 * NetHttpError) and export all three through the API object — a shrunk or
 * renamed family fails closed.
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CURRENT_ROUND, roundLt } from "./census-round.mjs"; /* WO-01 round-1 (2-a F1): round derives from package.json — the hardcoded
 * "v1.7.2" left every G9 expiry check inert while the suite reached v1.8.2. */
import { codeOnlyCached } from "./scan-kit.mjs"; /* WO-01 round-4 (4-a F04): shared per-file memo */

const DEFAULT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/* ── Adjudication ledger: files whose deliberate silences are sanctioned ──
 * Each entry: file, count (the sanctioned silent-catch count — drift-checked
 * in BOTH directions), reason, expiry. */
const ADJUDICATED = [];

const ledgerKey = (e) => `${e.file}::${e.count}`;

/* WO-01 round-3 (3-a F03): the promise-arm adjudication ledger — sanctioned
 * deliberate silences in .catch()/ .then(ok, err) handlers, same contract as
 * ADJUDICATED (count-pinned, expiry-pinned). The one live entry is PM's
 * write-chain serializer tail: run.then(() => {}, () => {}) swallows the
 * rejection AFTER it has been delivered to `run`'s real consumer (the
 * caller of serializePromptsWrite awaits `run`); the tail exists so the
 * NEXT queued write is not poisoned by the previous failure — the canonical
 * promise-serializer pattern. Debug-logging there would double-report every
 * rejection (once at the tail, once at the true consumer). */
const PROMISE_ADJUDICATED = [
    {
        file: "canon/_sovereign/4ndr0tools - Prompt Master.user.js",
        count: 1,
        expiry: "v1.21.0",
    },
];

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

/* Balanced-brace span from the first { at/after from. */
function braceSpan(view, from) {
    let i = from;
    while (i < view.length && view[i] !== "{") {
        if (view[i] === ";" || view[i] === ")") return null;
        i++;
    }
    let depth = 0;
    for (let j = i; j < view.length; j++) {
        if (view[j] === "{") depth++;
        else if (view[j] === "}") { depth--; if (depth === 0) return [i, j]; }
        if (depth < 0) return null;
    }
    return null;
}

/* body with comments blanked (codeOnly already blanked strings/templates) */
function stripBodyComments(body) {
    return body.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

const TYPED_RE = /instanceof\s+(?:Net\w*Error|Error\b)|(?:\.\s*name\s*(?:===|!==)\s*["' ]*Net)|(?:\.\s*code\s*(?:===|!==|switch))|\.kind\s*(?:===|!==)|instanceof\s+DOMException/;
const DEBUG_RE = /console\s*\.\s*(?:debug|warn|error|log|info|trace)\s*\(/;

/* ── kernel self-assertion: the typed family must not shrink ─────────────── */
function assertKernelFamily(root, problems) {
    const netPath = path.join(root, "kernel", "net.js");
    if (!fs.existsSync(netPath)) {
        problems.push("kernel self-assertion: kernel/net.js missing — the NetError family cannot be verified");
        return { classes: 0 };
    }
    const net = fs.readFileSync(netPath, "utf8");
    const classes = [];
    const classRe = /class\s+(Net\w*Error)\s+extends\s+(Error|Net\w*Error)\b/g;
    let m;
    while ((m = classRe.exec(net)) !== null) classes.push(m[1]);
    const required = ["NetError", "NetTimeoutError", "NetHttpError"];
    for (const req of required) {
        if (!classes.includes(req)) {
            problems.push(`kernel self-assertion: class ${req} missing from kernel/net.js — the typed family shrunk (G11 class-closure)`);
        }
    }
    for (const c of classes) {
        const exportRe = new RegExp("\\b" + c + "\\s*:\\s*" + c + "\\b");
        if (!exportRe.test(net)) {
            problems.push(`kernel self-assertion: ${c} defined but not exported through the kernel API object`);
        }
    }
    return { classes: classes.length };
}

/* ── the census ──────────────────────────────────────────────────────────── */

export function runErrorCensus(root = DEFAULT_ROOT) {
    const problems = [];
    const stats = { catchSites: 0, typed: 0, debug: 0, handled: 0, silent: 0, promiseCatchSites: 0, thenArmSites: 0, silentPromiseCatches: 0, ledgeredPromiseArms: 0, filesScanned: 0, silentFiles: 0 };
    const seenLedger = new Set();
    const perFile = {};

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

    for (const [rel, abs] of targets) {
        if (!fs.existsSync(abs)) continue;
        stats.filesScanned++;
        const view = codeOnlyCached(abs);
        const starts = lineStartsOf(view);
        const fileStats = { catches: 0, typed: 0, debug: 0, handled: 0, silent: 0, silentSites: [], silentPromiseSites: [] };

        /* catch sites: `catch (e) {` or bare `catch {` */
        const siteRe = /(^|[^\w$.])catch\s*(\(|\{)/g;
        let m;
        while ((m = siteRe.exec(view)) !== null) {
            fileStats.catches++;
            stats.catchSites++;
            const braceAt = view.indexOf("{", m.index + m[0].length - 1);
            const sp = braceSpan(view, braceAt);
            if (!sp) continue;
            const body = stripBodyComments(view.slice(sp[0] + 1, sp[1]));
            const line = lineOf(starts, m.index);
            if (TYPED_RE.test(body)) {
                fileStats.typed++; stats.typed++;
            } else if (DEBUG_RE.test(body)) {
                fileStats.debug++; stats.debug++;
            } else if (body.trim().length > 0) {
                fileStats.handled++; stats.handled++;
            } else {
                fileStats.silent++; stats.silent++;
                fileStats.silentSites.push(line);
            }
        }

        /* Wave 2.8 class-closure: Promise `.catch(...)` handlers — an inline
         * arrow/function handler with an empty `{}` body is a silent async
         * rejection swallow and must fail closed. */
        /* WO-01 round-2 (6-a F07) + round-3 (3-a F03): function-REFERENCE
         * handler resolution — ONE helper shared by the .catch() scan and the
         * .then(ok, err) error-arm scan (the scan-kit lesson: ported copies
         * drift). Resolve the identifier ONE level in the same file's code
         * view: function decls and const/let/var arrow/function definitions
         * get their bodies inspected under the emptiness rule; bind
         * expressions and cross-file references stay unresolvable
         * (conservative no-flag). */
        const resolveRefBody = (name) => {
            const esc = name.replace(/\$/g, "\\$");
            let body = null;
            const fnDecl = new RegExp(`function\\s+${esc}\\s*\\([^)]*\\)\\s*\\{`).exec(view);
            if (fnDecl) {
                const sp = braceSpan(view, fnDecl.index + fnDecl[0].length - 1);
                if (sp) body = stripBodyComments(view.slice(sp[0] + 1, sp[1]));
            }
            if (body === null) {
                const constDecl = new RegExp(`(?:const|let|var)\\s+${esc}\\s*=\\s*(?:async\\s+)?(?:function\\s*\\([^)]*\\)|\\([^)]*\\)\\s*=>|[A-Za-z_$][\\w$]*\\s*=>)\\s*\\{`).exec(view);
                if (constDecl) {
                    const sp = braceSpan(view, constDecl.index + constDecl[0].length - 1);
                    if (sp) body = stripBodyComments(view.slice(sp[0] + 1, sp[1]));
                }
            }
            return body;
        };
        const pCatchRe = /\.catch\s*\(/g;
        let pm;
        while ((pm = pCatchRe.exec(view)) !== null) {
            stats.promiseCatchSites++;
            const openParen = pm.index + pm[0].length - 1;
            const afterOpen = view.slice(openParen + 1, openParen + 120);
            const arrowOrFn = /^\s*(?:async\s+)?(?:function\s*\([^)]*\)|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)\s*\{/.exec(afterOpen);
            if (!arrowOrFn) {
                /* WO-01 round-2 (6-a F07): function-REFERENCE handlers —
                 * .catch(fnName) — previously escaped the empty-handler scan
                 * entirely (only inline function/arrow-with-brace forms were
                 * inspected; the audit's live instance was Images++'s
                 * .catch(now) with now bound to performance.now — a
                 * "handler" that returns a timestamp). Resolve the identifier
                 * ONE level in the same file's code view: function decls and
                 * const/let/var arrow/function definitions get their bodies
                 * inspected under the same emptiness rule. Bind expressions
                 * and cross-file references stay unresolvable (conservative
                 * no-flag); the two-arg .then(ok, err) form remains out of
                 * scope — a documented round-3 boundary. */
                const fnRef = /^\s*([A-Za-z_$][\w$]*)\s*[,)]/.exec(afterOpen);
                if (fnRef) {
                    const body = resolveRefBody(fnRef[1]);
                    if (body !== null && body.trim().length === 0) {
                        /* recorded, not reported — the promise-arm ledger
                         * loop below owns the fail/ledger decision */
                        fileStats.silentPromiseSites.push(lineOf(starts, pm.index));
                        stats.silentPromiseCatches++;
                    }
                }
                continue;
            }
            const braceAt = openParen + 1 + arrowOrFn[0].lastIndexOf("{");
            const sp = braceSpan(view, braceAt);
            if (!sp) continue;
            const body = stripBodyComments(view.slice(sp[0] + 1, sp[1]));
            if (body.trim().length === 0) {
                const line = lineOf(starts, pm.index);
                stats.silentPromiseCatches++;
                fileStats.silentPromiseSites.push(line);
            }
        }
        /* WO-01 round-3 (3-a F03): the two-arg .then(ok, err) form — the
         * round-2 boundary ("remains out of scope — a documented round-3
         * boundary") is now CLOSED. The second top-level argument is the
         * rejection handler and gets exactly the .catch() emptiness rule:
         * inline arrow/function bodies and one-level fnRef resolution via
         * the shared resolveRefBody helper; expression-arrows and
         * unresolvable references stay conservative no-flag. The live tree
         * carries exactly one such site (PM's write-chain serializer
         * .then(job, job) — job is the caller's real async function) and
         * it resolves healthy. */
        const pThenRe = /\.then\s*\(/g;
        let tm2;
        while ((tm2 = pThenRe.exec(view)) !== null) {
            stats.thenArmSites++;
            const openParen = tm2.index + tm2[0].length - 1;
            /* walk the argument list: track depth over ()[]{}; the FIRST
             * depth-0 comma separates ok from err, the second ends err. */
            let depth = 0, i = openParen + 1, arg2Start = -1, listEnd = -1;
            while (i < view.length) {
                const ch = view[i];
                if (ch === "(" || ch === "{" || ch === "[") depth++;
                else if (ch === ")" || ch === "}" || ch === "]") {
                    if (ch === ")" && depth === 0) { listEnd = i; break; }
                    depth--;
                } else if (ch === "," && depth === 0) {
                    if (arg2Start === -1) arg2Start = i + 1;
                    else { listEnd = i; break; }
                }
                i++;
            }
            if (arg2Start === -1) continue; /* one-arg .then(ok) — no error arm */
            const armEnd = listEnd === -1 ? Math.min(view.length, arg2Start + 160) : listEnd;
            const arm = view.slice(arg2Start, armEnd).trim();
            if (!arm) continue; /* degenerate trailing comma — not a handler */
            const armArrow = /^(?:async\s+)?(?:function\s*\([^)]*\)|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)\s*\{/.exec(arm);
            if (armArrow) {
                const braceAt = arm.indexOf("{", armArrow[0].length - 1);
                const sp = braceSpan(arm, braceAt);
                if (sp) {
                    const body = stripBodyComments(arm.slice(sp[0] + 1, sp[1]));
                    if (body.trim().length === 0) {
                        fileStats.silentPromiseSites.push(lineOf(starts, tm2.index));
                        stats.silentPromiseCatches++;
                    }
                }
                continue;
            }
            /* fnRef arm — same one-level rule as .catch */
            const armRef = /^([A-Za-z_$][\w$]*)\s*$/.exec(arm);
            if (armRef) {
                const body = resolveRefBody(armRef[1]);
                if (body !== null && body.trim().length === 0) {
                    fileStats.silentPromiseSites.push(lineOf(starts, tm2.index));
                    stats.silentPromiseCatches++;
                }
            }
        }
        perFile[rel] = fileStats;
    }

    /* silent files without a ledger entry fail closed */
    for (const [rel, fs2] of Object.entries(perFile)) {
        if (fs2.silent === 0) continue;
        const entry = ADJUDICATED.find((e) => e.file === rel);
        if (entry && entry.count === fs2.silent) {
            seenLedger.add(ledgerKey(entry));
            continue;
        }
        if (entry && entry.count !== fs2.silent) {
            problems.push(`${rel}: silent-catch drift — ledger sanctions ${entry.count}, machine count is ${fs2.silent} (update the ledger or fix the swallows)`);
            continue;
        }
        stats.silentFiles++;
        problems.push(
            `${rel}: ${fs2.silent} SILENT catch site(s) — empty body, no debug (lines ${fs2.silentSites.slice(0, 8).join(", ")}${fs2.silentSites.length > 8 ? "…" : ""}) (GUP G11: typed errors; add the scoped-interceptor debug line, typed branching, or a ledger entry with justification + expiry)`
        );
    }

    /* ledger drift: entries whose file no longer carries the sanctioned count */
    for (const e of ADJUDICATED) {
        if (!seenLedger.has(ledgerKey(e))) {
            problems.push(`stale error-census ledger entry: ${e.file} :: count ${e.count} — no file at that silent count (remove or update)`);
        }
        if (e.expiry && roundLt(CURRENT_ROUND, e.expiry) === false) {
            problems.push(`expired error-census ledger entry: ${e.file} — expiry ${e.expiry} has passed round ${CURRENT_ROUND} without re-adjudication`);
        }
    }

    /* WO-01 round-3 (3-a F03): promise-arm ledger — every file with silent
     * promise handlers must carry a count-pinned PROMISE_ADJUDICATED entry;
     * drift and expiry fail closed exactly like the catch ledger above. */
    const seenPromiseLedger = new Set();
    for (const [rel, fs2] of Object.entries(perFile)) {
        const silentArms = fs2.silentPromiseSites.length;
        if (silentArms === 0) continue;
        const entry = PROMISE_ADJUDICATED.find((e) => e.file === rel);
        if (entry && entry.count === silentArms) {
            seenPromiseLedger.add(ledgerKey(entry));
            stats.ledgeredPromiseArms += silentArms;
            continue;
        }
        if (entry && entry.count !== silentArms) {
            problems.push(`${rel}: silent-promise drift — ledger sanctions ${entry.count}, machine count is ${silentArms} (update the ledger or fix the swallows)`);
            continue;
        }
        problems.push(
            `${rel}: ${silentArms} SILENT promise handler(s) — empty body, no debug (lines ${fs2.silentPromiseSites.slice(0, 8).join(", ")}${fs2.silentPromiseSites.length > 8 ? "…" : ""}) (GUP G11: typed errors; add the scoped-interceptor debug line, typed branching, or a PROMISE_ADJUDICATED entry with justification + expiry)`
        );
    }
    for (const e of PROMISE_ADJUDICATED) {
        if (!seenPromiseLedger.has(ledgerKey(e))) {
            problems.push(`stale promise-arm ledger entry: ${e.file} :: count ${e.count} — no file at that silent-promise count (remove or update)`);
        }
        if (e.expiry && roundLt(CURRENT_ROUND, e.expiry) === false) {
            problems.push(`expired promise-arm ledger entry: ${e.file} — expiry ${e.expiry} has passed round ${CURRENT_ROUND} without re-adjudication`);
        }
    }

    /* kernel self-assertion (the typed family the consumers branch on) */
    const kernel = assertKernelFamily(root, problems);

    return { problems, ...stats, kernelClasses: kernel.classes, perFile };
}

/* v1.5.1 < v1.6.0 (string-aware compare, tolerant of missing segments) */
/* WO-01 round-4 (4-a F02): roundLt is single-sourced from census-round.mjs now — the nine byte-identical copies are gone (port-drift class closed). */

/* CLI: node tools/error-census.mjs [root] */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const root = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_ROOT;
    const r = runErrorCensus(root);
    console.log(`error census: ${r.filesScanned} source files, ${r.catchSites} catch sites (${r.typed} typed, ${r.debug} debug-logged, ${r.handled} handled, ${r.silent} silent) + ${r.promiseCatchSites} Promise .catch sites + ${r.thenArmSites} .then error arms (${r.ledgeredPromiseArms} ledgered, ${r.silentPromiseCatches - r.ledgeredPromiseArms} silent)`);
    if (r.problems.length) {
        for (const p of r.problems) console.log(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log(`  ✓ every catch site is typed, debug-logged, handled, or ledgered; kernel NetError family asserted (${r.kernelClasses} classes)`);
}
