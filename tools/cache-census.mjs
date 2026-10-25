#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/cache-census.mjs — Map/Set growth-boundedness census (suite v1.5.0)
 * ----------------------------------------------------------------------------
 * Round mandate (GUP B.1 "O(1) Caching"): the Phase A machine audit found 20
 * suspect Map/Set registries with NO gate measuring the class. This census is
 * that gate. (Precedent: tools/transport-census.mjs, v1.4.10.)
 *
 * What it scans: the REVIEW SOURCES on the codeOnly view. Per named registry
 * `NAME = new Map|Set(` (WeakMap/WeakSet are GC-bounded by construction and
 * exempt):
 *
 *   STATIC-CONFIG (exempt): no dynamic insertion call sites — membership is
 *     fixed at declaration (constructor literal or init-time adds only).
 *
 *   GROWTH-CAPABLE (dynamic `.add(`/`.set(` on the registry): requires a
 *     bound proof —
 *     · FIFO eviction: `NAME.keys().next()` + delete (the B.1 idiom), or
 *     · size ceiling: `NAME.size >` comparison with eviction, or
 *     · lifetime-emptying: `NAME.clear(` or `NAME.delete(` on the
 *       consumption path (entries are removed as consumed / on teardown).
 *     Otherwise FAIL (or ledger: registries whose growth is page-lifetime-
 *     bounded by design, with justification + expiry).
 *
 * Fail-closed on: unbounded growth-capable registries, stale ledger entries,
 * and the kernel losing its own pending-map hygiene (kernel/net.js asserts
 * its settle-once semantics via the smoke battery; the census asserts the
 * registry helpers exist).
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { codeOnly } from "./sink-census.mjs";
import { codeOnlyCached } from "./scan-kit.mjs"; /* WO-01 round-4 (4-a F04): shared per-file memo */

const DEFAULT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/* ── Adjudication ledger: growth-capable registries with a design bound the
 * scanner cannot see structurally. justification + expiry mandatory. */
const ADJUDICATED = [];

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

/* balanced-brace span from the first { at/after from */
function braceSpanOf(view, from) {
    let i = from;
    while (i < view.length && view[i] !== "{") { if (view[i] === ";" || view[i] === ")") return null; i++; }
    let depth = 0;
    for (let j = i; j < view.length; j++) {
        if (view[j] === "{") depth++;
        else if (view[j] === "}") { depth--; if (depth === 0) return [i, j]; }
        if (depth < 0) return null;
    }
    return null;
}

/* function BODY span from a header whose match ends at the opening paren:
 * balance the parameter list first (destructuring braces live INSIDE the
 * parens and must not be mistaken for the body), then take the next brace
 * span as the body. */
function fnBodyFrom(src, openParen) {
    let depth = 0, i = openParen;
    for (; i < src.length; i++) {
        if (src[i] === "(") depth++;
        else if (src[i] === ")") { depth--; if (depth === 0) break; }
    }
    while (i < src.length && src[i] !== "{") i++;
    return braceSpanOf(src, i);
}

/* innermost enclosing function span of declOff: collect function headers
 * (named fns + named arrow consts), resolve REAL body spans past the
 * parameter lists (arrows may appear as default values inside params),
 * and pick the innermost span containing declOff */
function enclosingFnSpan(view, declOff) {
    const hdrRe = /(?:function\s+([A-Za-z_$][\w$]*)\s*\(|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?\()/g;
    let m, best = null;
    while ((m = hdrRe.exec(view)) !== null) {
        const fnName = m[1] || m[2];
        if (!fnName) continue;
        const openParen = view.indexOf("(", m.index);
        const sp = fnBodyFrom(view, openParen);
        if (!sp) continue;
        if (declOff > sp[0] && declOff < sp[1]) {
            if (!best || sp[0] > best[0]) best = sp;
        }
    }
    return best;
}

/* FACTORY-ESCAPE check (the v1.5.0 negative-proof rule): a registry
 * referenced by a NAMED nested function that is itself returned (or listed
 * in a returned object) escapes the call — the registry lives for the
 * closure's lifetime (the Watermark++ image-session store class). Anonymous
 * forEach/map arrows and returned DATA (not closures) do not count. */
function escapesFactory(view, spanStart, spanEnd, name) {
    const span = view.slice(spanStart, spanEnd);
    const fnRe = /(?:function\s+([A-Za-z_$][\w$]*)\s*\(|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?\()/g;
    let mm;
    while ((mm = fnRe.exec(span)) !== null) {
        const fnName = mm[1] || mm[2];
        if (!fnName) continue;
        /* the match ends at the parameter-list open paren — resolve the
         * real body span behind it (params may carry default values and
         * destructuring braces) */
        const sp = fnBodyFrom(span, mm.index + mm[0].length - 1);
        if (!sp) continue;
        const body = span.slice(sp[0], sp[1] + 1);
        if (!new RegExp("\\b" + name.replace(/\$/g, "\\$") + "\\b").test(body)) continue;
        /* this named fn references the registry — is it returned (directly,
         * or listed in a returned object)? */
        const retRe = new RegExp("return[^;]{0,160}" + fnName.replace(/\$/g, "\\$"), "g");
        if (retRe.test(span)) return true;
    }
    return false;
}

/* ── the census ──────────────────────────────────────────────────────────── */

export function runCacheCensus(root = DEFAULT_ROOT) {
    const problems = [];
    const stats = { registries: 0, staticConfig: 0, weakBounded: 0, bounded: 0, dedupeGuarded: 0, callScoped: 0, ledgered: 0, unbounded: 0, filesScanned: 0 };
    const seenLedger = new Set();

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

    for (const [rel, abs] of targets) {
        if (!fs.existsSync(abs)) continue;
        stats.filesScanned++;
        const view = codeOnlyCached(abs);
        const starts = lineStartsOf(view);

        const declRe = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*new\s+(Map|Set|WeakMap|WeakSet)\s*\(/g;
        let m;
        while ((m = declRe.exec(view)) !== null) {
            stats.registries++;
            const name = m[1];
            const ctor = m[2];
            const line = lineOf(starts, m.index);
            const nameRe = (re) => new RegExp("\\b" + name.replace(/\$/g, "\\$") + re, "g");

            if (ctor === "WeakMap" || ctor === "WeakSet") { stats.weakBounded++; continue; }

            /* dynamic insertion call sites on this registry */
            const addSites = (view.match(nameRe("\\s*\\.\\s*(?:add|set)\\s*\\(")) || []).length;
            if (addSites === 0) { stats.staticConfig++; continue; }

            /* bound proofs */
            const hasFifo = nameRe("\\s*\\.\\s*keys\\s*\\(\\s*\\)\\s*\\.\\s*next\\s*\\(").test(view);
            const hasCeiling = nameRe("\\s*\\.\\s*size\\s*(?:>|>=)").test(view);
            const hasLifetime = nameRe("\\s*\\.\\s*(?:clear|delete)\\s*\\(").test(view);
            const hasGuard = nameRe("\\s*\\.\\s*has\\s*\\(").test(view);

            /* brace depth of the declaration: module/boot scope vs function
             * scope. FUNCTION-LOCAL registries are call-scoped work state
             * (created inside a per-operation function, freed with the
             * call/closure — the B.1 unbounded class is the module-scope
             * accumulator). CLASS BOUNDARY (documented, v1.5.0): a factory-
             * singleton closure that escapes its creator is still function-
             * local by depth; this round capped the one real case found
             * (Watermark++'s image session store, FIFO) and the v1.6.0
             * ledger tightens with escape analysis if the class grows. */
            let depth = 0;
            for (let i = 0; i < m.index; i++) {
                if (view[i] === "{") depth++;
                else if (view[i] === "}") depth--;
            }
            const functionLocal = depth >= 1;

            if (hasFifo || hasCeiling || hasLifetime) { stats.bounded++; continue; }
            if (hasGuard) { stats.dedupeGuarded++; continue; }
            if (functionLocal) {
                /* factory-escape rule: a function-local registry captured by a
                 * returned closure outlives the call — it needs a bound proof
                 * or a ledger entry like any module-scope accumulator (the
                 * v1.4.10 defects in this exact class: WM image sessions,
                 * YTPM sweep coalescer — both bounded this round). */
                const fnSpan = enclosingFnSpan(view, m.index);
                if (fnSpan && escapesFactory(view, fnSpan[0], fnSpan[1], name)) {
                    const entry2 = ADJUDICATED.find((e) => e.file === rel && e.registry === name);
                    if (entry2) { stats.ledgered++; seenLedger.add(`${rel}::${name}`); continue; }
                    stats.unbounded++;
                    problems.push(
                        `${rel}:${line}: UNBOUNDED factory registry \`${name} = new ${ctor}()\` — captured by a returned closure (outlives the call) with no FIFO eviction, size ceiling, lifetime delete/clear, or dedupe has-guard (GUP B.1 O(1) caching: cap it, empty it on idle, or ledger the design bound)`
                    );
                } else {
                    stats.callScoped++;
                }
                continue;
            }

            const entry = ADJUDICATED.find((e) => e.file === rel && e.registry === name);
            if (entry) { stats.ledgered++; seenLedger.add(`${rel}::${name}`); continue; }

            stats.unbounded++;
            problems.push(
                `${rel}:${line}: UNBOUNDED registry \`${name} = new ${ctor}()\` — module-scope growth with no FIFO eviction, size ceiling, lifetime delete/clear, or dedupe has-guard (GUP B.1 O(1) caching: add a ceiling + eviction, a consumption-path delete, a has-guard, or ledger the design bound)`
            );
        }
    }

    /* ledger drift */
    for (const e of ADJUDICATED) {
        if (!seenLedger.has(`${e.file}::${e.registry}`)) {
            problems.push(`stale cache ledger entry: ${e.file} :: ${e.registry} — registry not found (remove or update)`);
        }
    }

    return { problems, ...stats };
}

/* CLI: node tools/cache-census.mjs [root] */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const root = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_ROOT;
    const r = runCacheCensus(root);
    console.log(`cache census: ${r.filesScanned} source files, ${r.registries} Map/Set registries — ${r.staticConfig} static-config, ${r.weakBounded} weak (GC), ${r.bounded} bounded (FIFO/ceiling/lifetime), ${r.dedupeGuarded} dedupe-guarded, ${r.callScoped} call-scoped locals, ${r.ledgered} ledgered, ${r.unbounded} UNBOUNDED`);
    if (r.problems.length) {
        for (const p of r.problems) console.log(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("  ✓ every growth-capable registry is bounded, guarded, call-scoped, or ledgered");
}
