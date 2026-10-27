#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/kernel-export-census.mjs — Kernel Export-Consumer Census (Gate D)
 * ─────────────────────────────────────────────────────────────────────────────
 * WO-01 round-2 (6-a F10 / round-1 deferred item c): round-1's dead-export
 * prune (2-b F-07: consolePane, KERNEL_VERSION, hasGM, COMPONENT_CSS,
 * core.sleep/once/$dataset/$propUp/trustedAppend) was MANUAL — nothing
 * prevented the dead surface from re-accumulating. This census wires the
 * check into the gate:
 *
 *   1. EXPORT EXTRACTION is mechanical — each kernel module's export
 *      literal (the module-scope `return Object.freeze({…})`, or net.js's
 *      `const api = {…}`) is brace-balanced-parsed for its key set. No
 *      hand-maintained list can drift from the real surface.
 *   2. CONSUMER MATCHING is code-visible and alias-aware:
 *        · direct:     Ψ.<mod>.<name>  and  Ψ.<mod>["<name>"]
 *        · destructure: const { a, b } = Ψ.<mod>  (multi-line)
 *        · net hub:     __4NDR0_NET_API__.<name> (canon inlined copies)
 *        · whole-module aliases (`const core = Ψ.core`, `= __4NDR0_NET_API__`)
 *          mark that module's ENTIRE surface consumed — conservative
 *          direction: an alias can hide per-name use, so no dead-export
 *          verdict is issued for alias-consumed modules.
 *      Comments and strings are blanked (codeOnly view shared with the
 *      other censuses): prose cannot keep an export alive.
 *   3. BIDIRECTIONAL DRIFT: every Ψ.<mod>.<name> / hub.<name> reference in
 *      the corpus must name a REAL export — the round-1 prune class
 *      (a consumer calling a removed export) fails closed here.
 *   4. KEEP LEDGER (G9-style): zero-code-consumer exports may be kept as
 *      test-alive / census-alive API with a reason and an expiry round —
 *      the round-1 kept-list (FIFOCache, parseXML, cssVars, escapeHTML,
 *      NetError family, …) becomes machine-checked instead of prose.
 *      Unledgered zero-consumer exports FAIL; ledger entries whose export
 *      no longer exists FAIL (ledger rot); expired entries FAIL.
 * ═══════════════════════════════════════════════════════════════════════════ */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { codeOnlyCached } from "./scan-kit.mjs"; /* WO-01 round-4 (4-a F04): shared per-file memo */
import { CURRENT_ROUND, roundLt } from "./census-round.mjs";
/* WO-01 round-3 (3-a F08): the module list derives from kernel-order.mjs
 * single-source (+net, which KERNEL_ORDER deliberately excludes because it
 * is never bundled — it is inlined standalone). A hand-maintained list here
 * is the round-1 F-01 drift class reborn inside the round-2 census built to
 * close drift: a new kernel module's exports would never be extracted, and
 * a reference to a NONEXISTENT module (Ψ.media.x — typo or stale surface)
 * matches neither the direct nor the bracket regex and escapes the
 * bidirectional check entirely. The unknown-mod probe below closes that
 * direction too. */
import { KERNEL_ORDER } from "./kernel-order.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const KERNEL_DIR = path.join(ROOT, "kernel");

/* ── Export extraction (mechanical) ──────────────────────────────────────── */

/** Brace-balanced span from the index of a '{'. Returns [open, close] or null. */
function braceSpanOf(src, openIdx) {
    let depth = 0, i = openIdx;
    const n = src.length;
    while (i < n) {
        const c = src[i];
        if (c === "{") depth++;
        else if (c === "}") { depth--; if (depth === 0) return [openIdx, i]; }
        else if (c === '"' || c === "'") {           /* skip string keys */
            const q = c; i++;
            while (i < n && src[i] !== q) { if (src[i] === "\\") i++; i++; }
        } else if (c === "/" && src[i + 1] === "*") { /* skip comments */
            const end = src.indexOf("*/", i + 2); i = end === -1 ? n : end + 1;
        } else if (c === "/" && src[i + 1] === "/") {
            while (i < n && src[i] !== "\n") i++;
        }
        i++;
    }
    return null;
}

/** Top-level keys of an object literal span (shorthand and `key:` forms). */
function objectLiteralKeys(src, openIdx) {
    const span = braceSpanOf(src, openIdx);
    if (!span) return null;
    const body = src.slice(span[0] + 1, span[1]);
    /* strip comments to keep key extraction clean */
    const cleaned = body.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
    const keys = [];
    let depth = 0, token = "";
    const flush = () => {
        const t = token.trim();
        /* key forms: `name:` | shorthand `name` | accessor `get name()` /
         * `set name()` — net.js's subscriber-count surface is getters */
        const m = /^(?:get|set)\s+([A-Za-z_$][\w$]*)\s*\(/.exec(t)
            || /^["']?([A-Za-z_$][\w$]*)["']?\s*:/.exec(t)
            || /^([A-Za-z_$][\w$]*)$/.exec(t);
        if (m && m[1]) keys.push(m[1]);
        token = "";
    };
    for (const c of cleaned) {
        if (c === "{" || c === "[" || c === "(") { depth++; token += c; continue; }
        if (c === "}" || c === "]" || c === ")") { depth--; token += c; continue; }
        if (c === "," && depth === 0) { flush(); continue; }
        token += c;
    }
    flush();
    return keys;
}

/** Extract a kernel module's export names from its source, mechanically. */
function extractExports(src, mod) {
    if (mod === "net") {
        const m = /const api = \{/.exec(src);
        if (m) return objectLiteralKeys(src, m.index + m[0].length - 1) || [];
        return [];
    }
    /* the module-scope export literal is the LAST `return Object.freeze({` */
    let last = null, re = /return Object\.freeze\(\s*\{/g, m;
    while ((m = re.exec(src)) !== null) last = m;
    if (!last) return [];
    return objectLiteralKeys(src, src.indexOf("{", last.index)) || [];
}

/* ── Keep ledger (G9-style: reason + expiry per zero-consumer export) ────── */
/* WO-01 round-2 (6-a F10) — CURRENT STATE, machine-derived: every kernel
 * export is code-consumed somewhere in the corpus (kernel cross-module,
 * canon, modules, or the test/census tools — test-alive is ALIVE). The
 * round-1 kept-list entries (FIFOCache, parseXML, escapeHTML, tt, cssVars,
 * NetTimeoutError, NetHttpError) all resolve to kernel-smoke/census
 * consumers and are therefore NOT ledgered here — a ledger entry for a
 * consumed export is dead config. Two audit claims were corrected by the
 * census itself: Ψ.core.$$ is LIVE (HostWarp destructures it and calls it
 * twice — the audit's "zero consumers" saw only direct member syntax), and
 * glass.glyphEl was the one true dead export (pruned from the surface this
 * round; the function stays internal). This ledger exists for the NEXT
 * zero-consumer export: ledger it here with a reason and an expiry round,
 * or remove it — there is no third state. */
const KEEP_LEDGER = {
    /* "core": { expiry: "v1.20.0", "SomeExport": "reason" }, */
};

/* ── Census core ─────────────────────────────────────────────────────────── */

/* WO-01 round-4 (4-a F02): roundLt is single-sourced from census-round.mjs now — the nine byte-identical copies are gone (port-drift class closed). */

/** All consumer corpus files (code views). Kernel cross-module use counts. */
function corpusFiles() {
    const out = [];
    for (const kd of ["kernel"]) {
        for (const f of fs.readdirSync(path.join(ROOT, kd)).filter((x) => x.endsWith(".js"))) {
            out.push({ rel: `kernel/${f}`, abs: path.join(ROOT, kd, f) });
        }
    }
    for (const cd of ["_sovereign", "_promoted", "_merged"]) {
        const dir = path.join(ROOT, "canon", cd);
        if (!fs.existsSync(dir)) continue;
        for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".user.js"))) {
            out.push({ rel: `canon/${cd}/${f}`, abs: path.join(dir, f) });
        }
    }
    if (fs.existsSync(path.join(ROOT, "modules"))) {
        for (const d of fs.readdirSync(path.join(ROOT, "modules"), { withFileTypes: true })) {
            if (!d.isDirectory()) continue;
            const b = path.join(ROOT, "modules", d.name, "body.js");
            if (fs.existsSync(b)) out.push({ rel: `modules/${d.name}/body.js`, abs: b });
        }
    }
    /* tools: the smokes + censuses are legitimate test-alive consumers */
    for (const t of ["kernel-smoke.mjs", "family-fixture-smoke.mjs", "sink-census.mjs", "transport-census.mjs", "error-census.mjs", "kernel-boundary-smoke.mjs", "hotkey-census.mjs"]) {
        const a = path.join(ROOT, "tools", t);
        if (fs.existsSync(a)) out.push({ rel: `tools/${t}`, abs: a });
    }
    return out;
}

export function runKernelExportCensus() {
    const problems = [];
    const modules = [...KERNEL_ORDER, "net"]; /* 3-a F08: single-sourced — see the import note */
    const moduleSet = new Set(modules);
    const exportsByMod = {};
    for (const mod of modules) {
        const src = fs.readFileSync(path.join(KERNEL_DIR, `${mod}.js`), "utf8");
        const names = extractExports(src, mod);
        if (names.length === 0) {
            problems.push(`kernel/${mod}.js: export extraction found ZERO names — the mechanical extractor broke (fix the census, not the module)`);
        }
        exportsByMod[mod] = new Set(names);
    }

    const corpus = corpusFiles().map(({ rel, abs }) => ({ rel, view: codeOnlyCached(abs) })); /* WO-01 round-4 (4-a F04): shared per-file memo */

    /* consumer accounting */
    const consumed = {};       /* mod -> Set(names code-consumed) */
    const wholeModuleAliases = new Set();   /* modules whose ENTIRE surface is alias-consumed */
    const refs = [];           /* every Ψ.<mod>.<name> / hub.<name> reference seen (bidirectional check) */
    for (const mod of modules) consumed[mod] = new Set();

    const esc = (s) => s.replace(/\$/g, "\\$");
    for (const { rel, view } of corpus) {
        /* direct member references: Ψ.<mod>.<name> */
        /* WO-01 round-3 (3-a F08): unknown-module probe — every Ψ.<mod>.<name>
         * reference whose <mod> is not a kernel module fails closed (typo /
         * stale surface); previously such refs matched neither regex and were
         * invisible to the bidirectional check. */
        for (const um of view.matchAll(/Ψ\s*\.\s*([A-Za-z_$][\w$]*)\s*\./g)) {
            if (!moduleSet.has(um[1])) {
                problems.push(`${rel}: references Ψ.${um[1]} — not a kernel module (typo / stale surface; the census covers exactly [${modules.join(", ")}])`);
            }
        }
        const directRe = new RegExp(`Ψ\\s*\\.\\s*(${modules.map(esc).join("|")})\\s*\\.\\s*([A-Za-z_$][\\w$]*)`, "g");
        let m;
        while ((m = directRe.exec(view)) !== null) {
            /* negative probes: `Ψ.core.X === undefined` asserts ABSENCE (the
             * kernel-smoke no-cross-module-bleed battery) — a reference to a
             * name that must NOT exist is not a consumer and not an orphan. */
            const after = view.slice(m.index + m[0].length, m.index + m[0].length + 42);
            if (/\s*===\s*undefined/.test(after)) continue;
            refs.push({ rel, mod: m[1], name: m[2], via: "direct" });
        }
        /* bracket-form member references: Ψ.<mod>["name"] */
        const bracketRe = new RegExp(`Ψ\\s*\\.\\s*(${modules.map(esc).join("|")})\\s*\\[\\s*["']([A-Za-z_$][\\w$]*)["']\\s*\\]`, "g");
        while ((m = bracketRe.exec(view)) !== null) refs.push({ rel, mod: m[1], name: m[2], via: "bracket" });
        /* destructuring: const { a, b, c: x } = Ψ.<mod> (multi-line, nested-free at top level) */
        const destructureRe = new RegExp(`(?:const|let|var)\\s*\\{([^{}]{0,400}?)\\}\\s*=\\s*Ψ\\s*\\.\\s*(${modules.map(esc).join("|")})\\b`, "g");
        while ((m = destructureRe.exec(view)) !== null) {
            for (const part of m[1].split(",")) {
                const t = part.trim();
                if (!t) continue;
                const name = /^(?:[A-Za-z_$][\w$]*)\s*(?::\s*[A-Za-z_$][\w$]*)?$/.test(t) ? t.split(":")[0].trim() : null;
                if (name) refs.push({ rel, mod: m[2], name, via: "destructure" });
            }
        }
        /* net hub identifier (canon inlined copies): __4NDR0_NET_API__.<name> */
        const hubRe = /__4NDR0_NET_API__\s*\.\s*([A-Za-z_$][\w$]*)/g;
        while ((m = hubRe.exec(view)) !== null) refs.push({ rel, mod: "net", name: m[1], via: "hub" });
        /* whole-module aliases: `const X = Ψ.<mod>` / `= __4NDR0_NET_API__` — mark the whole surface consumed */
        const aliasRe = new RegExp(`(?:const|let|var)\\s+[A-Za-z_$][\\w$]*\\s*=\\s*Ψ\\s*\\.\\s*(${modules.map(esc).join("|")})\\s*[;,)\\n]`, "g");
        while ((m = aliasRe.exec(view)) !== null) wholeModuleAliases.add(m[1]);
        if (/=\s*__4NDR0_NET_API__\s*[;,)\\n]/.test(view)) wholeModuleAliases.add("net");
        /* WO-01 round-2: kernel-smoke's runNet harness — `const netR = runNet(…)`
         * evaluates net.js in a vm and returns the hub identifier; member
         * references through such aliases are net consumers. Aliases are
         * per-file, so the generic names (net/netR/netX) cannot leak. */
        const netAliases = new Set();
        const runNetRe = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*runNet\s*\(/g;
        while ((m = runNetRe.exec(view)) !== null) netAliases.add(m[1]);
        if (netAliases.size) {
            const aliasAlt = [...netAliases].map(esc).join("|");
            const harnessRe = new RegExp("\\b(" + aliasAlt + ")\\s*\\.\\s*([A-Za-z_$][\\w$]*)", "g");
            while ((m = harnessRe.exec(view)) !== null) refs.push({ rel, mod: "net", name: m[2], via: "harness-alias" });
        }
    }

    /* bidirectional + consumption */
    for (const r of refs) {
        if (!exportsByMod[r.mod] || !exportsByMod[r.mod].has(r.name)) {
            problems.push(`${r.rel}: references Ψ.${r.mod}.${r.name} (${r.via}) — NOT a kernel export (orphaned reference / typo; the round-1 prune class fails closed here)`);
        } else {
            consumed[r.mod].add(r.name);
        }
    }
    for (const mod of wholeModuleAliases) {
        for (const name of exportsByMod[mod]) consumed[mod].add(name);
    }

    /* dead-export verdicts + keep ledger */
    let kept = 0, liveExports = 0;
    for (const mod of modules) {
        const ledger = KEEP_LEDGER[mod] || {};
        const expiry = ledger.expiry;
        for (const name of exportsByMod[mod]) {
            if (consumed[mod].has(name)) { liveExports++; continue; }
            /* zero code consumers: kept only via ledger */
            if (Object.prototype.hasOwnProperty.call(ledger, name)) {
                const reason = ledger[name];
                if (reason === null) {
                    /* removal marker: the export must NOT exist — the prune was applied */
                    problems.push(`kernel/${mod}.js: export "${name}" exists but the keep ledger marks it REMOVED (null) — the round-2 prune was not applied`);
                } else {
                    if (!expiry) problems.push(`kernel-export keep ledger "${mod}.${name}": entry carries no expiry (G9 hygiene)`);
                    else if (!roundLt(CURRENT_ROUND, expiry)) problems.push(`kernel-export keep ledger "${mod}.${name}": expiry ${expiry} has passed round ${CURRENT_ROUND} without re-adjudication (G9 hygiene)`);
                    kept++;
                }
            } else {
                problems.push(`kernel/${mod}.js: export "${name}" has ZERO code consumers across kernel/canon/modules/tools — dead surface (consume it, remove it, or ledger it test-alive with reason + expiry in tools/kernel-export-census.mjs)`);
            }
        }
        /* ledger rot: entries whose export no longer exists */
        for (const name of Object.keys(ledger)) {
            if (name === "expiry") continue;
            if (ledger[name] !== null && !exportsByMod[mod].has(name)) {
                problems.push(`kernel-export keep ledger "${mod}.${name}": the export no longer exists — ledger rot (remove the entry)`);
            }
        }
    }

    const totalExports = modules.reduce((n, mod) => n + exportsByMod[mod].size, 0);
    return {
        problems,
        summary: {
            modules: modules.length,
            exports: totalExports,
            live: liveExports,
            kept,
            refs: refs.length,
            wholeAliasModules: [...wholeModuleAliases],
            surface: Object.fromEntries(modules.map((mod) => [mod, [...exportsByMod[mod]].sort()])),
        },
    };
}

/* ── Standalone runner ───────────────────────────────────────────────────── */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const { problems, summary } = runKernelExportCensus();
    console.log(`kernel export census: ${summary.modules} modules, ${summary.exports} exports — ${summary.live} code-consumed, ${summary.kept} ledgered test-alive, ${summary.refs} references checked`);
    if (summary.wholeAliasModules.length) console.log(`  alias-consumed whole surfaces: ${summary.wholeAliasModules.join(", ")}`);
    for (const mod of Object.keys(summary.surface)) {
        console.log(`  Ψ.${mod}: ${summary.surface[mod].join(", ")}`);
    }
    if (problems.length) {
        console.log(`\n${problems.length} KERNEL-EXPORT CENSUS FAILURE(S):`);
        for (const p of problems) console.log(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("  ✓ every kernel export is code-consumed or ledgered test-alive; every Ψ-reference names a real export");
    process.exit(0);
}
