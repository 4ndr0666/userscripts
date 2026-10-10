#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/transport-census.mjs — GM-transport boundedness census (suite v1.4.10)
 * ----------------------------------------------------------------------------
 * Round mandate (v1.4.10): the v1.4.9 audit found 11 unbounded GM_xhr
 * dispatch sites across 5 scripts — every one of them an object-literal
 * call whose author simply never wrote `timeout:`. Certification could not
 * catch the class because no gate measured it. This census is that gate.
 *
 * What it scans: the REVIEW SOURCES — every canon/<tier> .user.js file, every
 * modules/<name>/body.js and kernel/net.js. dist is a machine-verified splice of exactly these
 * (build.mjs CANON_KERNEL injection + validate's canon↔dist wiring checks),
 * so boundedness at the source IS boundedness in dist. Scanning canon also
 * keeps the census immune to the inlined-kernel false positives a dist scan
 * would produce 15 times over.
 *
 * What it fails closed on, per dispatch site of GM_xmlhttpRequest /
 * GM.xmlHttpRequest (direct, dotted, const-aliased, or routed through a
 * detected one-argument passthrough wrapper):
 *   1. an object-literal dispatch whose literal carries no `timeout:` key
 *      (the exact defect class that shipped — unbounded transport, GUP 4.2);
 *   2. a variable/expression dispatch that is not in the adjudication
 *      ledger below (indirection must be justified, never assumed);
 *   3. a stale ledger entry (the site disappeared — count drift discipline,
 *      same idiom as the sink census);
 *   4. the kernel losing its own `timeout: timeout` req-literal assertion.
 *
 * Object.assign({…timeout…}, …) merge bases count as bounded when the first
 * literal argument carries the key. String contents, comments, template
 * prose and regex bodies are blanked before scanning (codeOnly view,
 * lesson-7 discipline: prose mentions are documentation, not dispatch).
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { codeOnly } from "./sink-census.mjs";

const DEFAULT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/* ── Adjudication ledger: variable-passed dispatches (fail-closed) ──────────
 * Every entry: file (repo-relative), callText (the dispatch as the scanner
 * normalizes it), reason. A var-passed site with no entry fails the census;
 * an entry with no site fails it too (drift). */
const ADJUDICATED_VAR_PASSED = [
    /* NOTE on kernel/net.js: its dispatch `transport(req)` is invisible to
     * the alias scanner BY DESIGN — the transport fn is chosen at runtime by
     * gmTransport()'s capability detection (GM_xmlhttpRequest, then
     * GM.xmlHttpRequest, else null). Its bound is machine-asserted here via
     * KERNEL_TIMEOUT_ASSERT on the req literal, and behaviorally proven by
     * tools/kernel-smoke.mjs's timeout battery (settle-once + NetTimeoutError
     * rejection paths). */
    {
        file: "canon/_merged/4ndr0tools - LinkMasterΨ.user.js",
        callText: "GM_xmlhttpRequest(opts)",
        reason: "GMapi.xhr util passthrough body (returns the raw control handle) — every GMapi.xhr call site is itself literal-scanned with its own timeout (5/10/12 s)",
    },
    {
        file: "canon/_merged/4ndr0tools - LinkMasterΨ.user.js",
        callText: "xhr(opts)",
        reason: "GMapi.xhr util DEF site (the wrapper name is dispatch-shaped) — the body's own GM_xmlhttpRequest(opts) is the adjacent adjudicated entry; all call sites are literal-bounded",
    },
];

/* kernel self-assertion: the gmFetch req literal must carry the bound. */
const KERNEL_TIMEOUT_ASSERT = /timeout:\s*timeout/;

/* ── helpers ─────────────────────────────────────────────────────────────── */

function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* Const-alias collectors: X = [window.]GM_xmlhttpRequest | GM.xmlHttpRequest
 * (plain, or as one arm of a capability-detection ternary). */
const ALIAS_DECL_RE_LIST = [
    /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:window\s*\.)?\s*GM_xmlhttpRequest\b/g,
    /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*GM\s*\.\s*xmlHttpRequest\b/g,
    /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*[^;\n]*\?\s*(?:window\s*\.)?\s*GM_xmlhttpRequest\s*:[^;\n]*xmlHttpRequest[^;\n]*/g,
];

/* Passthrough wrapper: NAME(p) { … GM_xmlhttpRequest(p) … } — boundedness of
 * its call sites is then literal-checked like a direct dispatch. */
function findPassthroughWrappers(codeJoined) {
    const wrappers = new Set();
    const re = /([A-Za-z_$][\w$]*)\s*\(\s*([A-Za-z_$][\w$]*)\s*\)\s*\{/g;
    let m;
    while ((m = re.exec(codeJoined)) !== null) {
        const name = m[1];
        const param = m[2];
        const window = codeJoined.slice(m.index, m.index + 240);
        const inner = new RegExp(
            "(?:GM_xmlhttpRequest|GM\\s*\\.\\s*xmlHttpRequest)\\s*\\(\\s*" + escapeRe(param) + "\\s*\\)"
        );
        if (inner.test(window)) wrappers.add(name);
    }
    return wrappers;
}

/* Balanced-brace span from the first `{` at/after `from` (code view: strings,
 * comments, regex bodies and template prose are already blanked, so the
 * remaining braces are structural code braces — balanced in valid JS). */
function literalSpan(codeJoined, from) {
    if (codeJoined[from] !== "{") return null;
    let depth = 0;
    for (let i = from; i < codeJoined.length; i++) {
        if (codeJoined[i] === "{") depth++;
        else if (codeJoined[i] === "}") {
            depth--;
            if (depth === 0) return [from, i];
        }
        if (depth < 0) return null;
    }
    return null;
}

function lineOfOffset(lineStarts, off) {
    let lo = 0, hi = lineStarts.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (lineStarts[mid] <= off) lo = mid; else hi = mid - 1;
    }
    return lo + 1;
}

/* ── the census ──────────────────────────────────────────────────────────── */

export function runTransportCensus(root = DEFAULT_ROOT) {
    const problems = [];
    let boundedSites = 0;
    let adjudicatedSites = 0;
    let filesScanned = 0;

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

    const seenAdjudications = new Set();

    for (const [rel, abs] of targets) {
        if (!fs.existsSync(abs)) continue;
        filesScanned++;
        const src = fs.readFileSync(abs, "utf8");
        const codeJoined = codeOnly(src);
        const lineStarts = [0];
        for (let i = 0; i < codeJoined.length; i++) if (codeJoined[i] === "\n") lineStarts.push(i + 1);

        /* dispatch names: direct + dotted + file-local const aliases + wrappers */
        const names = new Set(["GM_xmlhttpRequest", "GM.xmlHttpRequest"]);
        for (const re of ALIAS_DECL_RE_LIST) {
            const r = new RegExp(re.source, "g");
            let m;
            while ((m = r.exec(codeJoined)) !== null) names.add(m[1]);
        }
        for (const w of findPassthroughWrappers(codeJoined)) names.add(w);

        for (const name of names) {
            const dispRe = new RegExp("(^|[^\\w$.])" + escapeRe(name) + "\\s*\\(", "g");
            let m;
            while ((m = dispRe.exec(codeJoined)) !== null) {
                const openParen = m.index + m[0].length - 1;
                let p = openParen + 1;
                while (p < codeJoined.length && /\s/.test(codeJoined[p])) p++;

                let span = null;
                let kind = "var";
                if (codeJoined[p] === "{") {
                    span = literalSpan(codeJoined, p);
                    kind = "literal";
                } else if (
                    codeJoined.startsWith("Object.assign(", p) ||
                    codeJoined.startsWith("Object .assign(", p)
                ) {
                    /* Object.assign(<first literal>, …) — bounded iff the
                     * first literal carries the key. */
                    let q = p + "Object.assign(".length;
                    while (q < codeJoined.length && /\s/.test(codeJoined[q])) q++;
                    if (codeJoined[q] === "{") {
                        span = literalSpan(codeJoined, q);
                        kind = "literal";
                    }
                }

                const line = lineOfOffset(lineStarts, m.index);

                if (kind === "literal" && span) {
                    const body = codeJoined.slice(span[0], span[1] + 1);
                    if (/\btimeout\s*:/.test(body)) {
                        boundedSites++;
                    } else {
                        problems.push(
                            `${rel}:${line}: UNBOUNDED literal dispatch \`${name}( {…} )\` — no timeout: key in the call object (GUP 4.2: privileged transports are hard-bounded; add an explicit timeout or route through __4NDR0_NET_API__.gmFetch)`
                        );
                    }
                } else {
                    /* variable/expression dispatch — adjudication ledger */
                    const argEnd = Math.min(
                        ...[")", ";", "\n"].map((c) => {
                            const idx = codeJoined.indexOf(c, openParen + 1);
                            return idx === -1 ? codeJoined.length : idx;
                        })
                    );
                    const callText = `${name}(${codeJoined.slice(openParen + 1, argEnd).trim()})`;
                    const entry = ADJUDICATED_VAR_PASSED.find(
                        (e) => e.file === rel && e.callText === callText
                    );
                    if (entry) {
                        adjudicatedSites++;
                        seenAdjudications.add(`${rel}::${callText}`);
                    } else {
                        problems.push(
                            `${rel}:${line}: UNADJUDICATED indirect dispatch \`${callText}\` — variable/expression transport needs a ledger entry in tools/transport-census.mjs (or a literal call object with timeout:)`
                        );
                    }
                }
            }
        }
    }

    /* drift: ledger entries whose site no longer exists */
    for (const e of ADJUDICATED_VAR_PASSED) {
        const key = `${e.file}::${e.callText}`;
        if (!seenAdjudications.has(key)) {
            problems.push(`stale adjudication: ${e.file} :: ${e.callText} — site not found (remove or update the ledger entry)`);
        }
    }

    /* kernel self-assertion */
    const kernelCode = codeOnly(
        fs.readFileSync(path.join(root, "kernel", "net.js"), "utf8")
    );
    if (!KERNEL_TIMEOUT_ASSERT.test(kernelCode)) {
        problems.push("kernel/net.js: gmFetch req literal lost `timeout: timeout` — the kernel's own bound is missing");
    }

    return { problems, boundedSites, adjudicatedSites, filesScanned };
}

/* CLI: node tools/transport-census.mjs [root] — prints the census report. */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const root = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_ROOT;
    const r = runTransportCensus(root);
    console.log(`transport census: ${r.filesScanned} source files, ${r.boundedSites} bounded literal dispatch(es), ${r.adjudicatedSites} adjudicated indirect dispatch(es)`);
    if (r.problems.length) {
        for (const p of r.problems) console.log(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("  ✓ every GM dispatch is bounded or adjudicated");
}
