#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/operator-battery.mjs — the operator-side regression battery instrument
 * ----------------------------------------------------------------------------
 * WO-01 round 9 (the operator's directive: "pass me the operator-side tests
 * beyond the sandbox and fashion it so that it is itself inclusive of all
 * coinciding information, docs the required detail to mitigate or deal with
 * the findings. Implement said regression battery toward completion.").
 *
 * WO-01 round 10 — THE INGEST HARDENING (the 10-a audit, 14 findings, all
 * closed): the ingest path shipped with zero executions; it now carries the
 * same fail-visible discipline as the check that guards it —
 *   F01  the CLI dispatch is main-module-guarded: importing this instrument
 *        from validate.mjs no longer hijacks the host's argv (a --verbose
 *        gate run used to print this tool's usage and exit 2 BEFORE the gate
 *        ever ran; battery problems used to exit(1) at import time).
 *   F02  ingest enforces the FAIL discipline check enforces: BOTH evidence
 *        AND note (the old `!evidence && !note` admitted an evidence-only
 *        FAIL that then hard-failed the gate while ingest reported success —
 *        the operator's first legitimate paste-back could brick the gate).
 *   F03  near-miss rows are NAMED, never silently dropped: the row-shape
 *        linter flags unparseable table rows, and ids/statuses normalize
 *        case-insensitively (`Pass`/`blocked` used to vanish without a
 *        diagnostic — a certification could be lost invisibly).
 *   F04  the results ledger's expiry now FIRES: expiry is compared against
 *        CURRENT_ROUND (the pin census grep never matched the JSON shape —
 *        the v1.18.0 pin used to pass with a stale ledger, the exact class
 *        9c-F04 fixed in connect-census the same round).
 *   F05  duplicate test ids in one report are rejected (last-wins used to
 *        silently discard the earlier row).
 *   F06  a partial report must say so (--partial) and the report header's
 *        `suite <ver> @ <sha>` is verified against this tree — a stale-suite
 *        paste-back used to ingest clean.
 *   F07  provenance is the operator's, never the machine's: the run date is
 *        extracted from the ENV line (`date YYYY-MM-DD`), and empty evidence
 *        is no longer fabricated as "(inline)".
 *   F08  a missing inventory.json is a problem line, not a silent skip of
 *        the whole dist-installability section.
 *   F09  vacuous anchors are refused: every anchor must carry ≥1 mustContain
 *        token, and the five weak anchors the r9 manifest shipped with
 *        (version-string / npm-script-name / bare-host tokens that first
 *        match @connect headers) are re-adjudicated to substantive tokens.
 *   F10  the rendered checklist carries the residual map (which residual
 *        each test closes) and the anchor line with token line references
 *        "at render" — the operator-facing projection lost the why and the
 *        where before.
 *   F11  a canon file that loses its @version header is a problem line (the
 *        drift refusal used to silently exempt it).
 *   F12  schema depth: trimmed strings, anchors validated as arrays of
 *        objects, env/risk subfields checked, the dead prerequisites guard
 *        retired.
 *   F13  UNTESTED is a LEDGER state, not a report row: reports accept
 *        PASS/FAIL/BLOCKED only, and "adjudicated" counts non-UNTESTED.
 *   F14  a missing report file is a clean problem line (not a raw ENOENT
 *        stack) and row matching is scoped to the report table — free-form
 *        findings can neither block nor corrupt an ingest.
 *
 * The machine gate certifies structure; the OPERATOR certifies behavior. This
 * instrument is the machine half of that split:
 *
 *   check  — manifest schema validity; ANCHOR LIVENESS (every mustContain
 *            token literally present in the named canon file TODAY — the
 *            validate.mjs RECONCILED_NAMES {file, mustContain} precedent);
 *            VERSION-DRIFT REFUSAL (a canon @version bump without a manifest
 *            re-adjudication is a hard fail — the 8b-F10 disposition-ledger
 *            lesson: never silently drop); residual-coverage totality (every
 *            residual's test ids resolve, and every non-suite test is
 *            reachable from the coverage map or explicitly matrix-scoped);
 *            dist existence (every referenced script is installable at the
 *            manifest's version); results-ledger discipline (status set,
 *            FAIL carries evidence+note, expiry present AND live, orphan
 *            sweep).
 *   render — deterministically emits documentation/operator-battery/README.md,
 *            the operator-facing plain-language checklist (no node needed to
 *            READ it — it is committed in-repo and readable on GitHub) with
 *            the residual map and anchor line references per test.
 *   ingest — parses a filled paste-back report (the template at the foot of
 *            the rendered README) and updates results.json adjudications,
 *            enforcing the same fail-visible discipline as check.
 *
 * The engine reads inventory.json for dist/version truth and package.json for
 * the suite round — the same single sources the build identity carries.
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CURRENT_ROUND, roundLt } from "./census-round.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MANIFEST_PATH = path.join(ROOT, "tools", "operator-battery", "manifest.json");
const RESULTS_PATH = path.join(ROOT, "tools", "operator-battery", "results.json");
const DOC_PATH = path.join(ROOT, "documentation", "operator-battery", "README.md");
const INVENTORY_PATH = path.join(ROOT, "inventory.json");
const PKG_PATH = path.join(ROOT, "package.json");

/* LEDGER states (results.json); reports may only carry the first three —
 * UNTESTED is the ledger's default, not an operator assertion (10a F13). */
const STATUSES = new Set(["PASS", "FAIL", "BLOCKED", "UNTESTED"]);
const REPORT_STATUSES = new Set(["PASS", "FAIL", "BLOCKED"]);

function readJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }

/* canon file → current @version (the header literal; suite-level anchors use
 * package.json instead). */
function currentVersionOf(file) {
    const fp = path.join(ROOT, file);
    if (!fs.existsSync(fp)) return null;
    if (file === "package.json") return readJson(fp).version;
    const src = fs.readFileSync(fp, "utf8");
    const m = /^\/\/ @version\s+(.+)$/m.exec(src);
    return m ? m[1].trim() : null;
}

export function runOperatorBatteryCheck() {
    const problems = [];
    const stats = { tests: 0, anchors: 0, families: 0, residuals: 0, results: 0, adjudicated: 0 };
    if (!fs.existsSync(MANIFEST_PATH)) {
        return { problems: ["operator-battery manifest.json missing"], ...stats };
    }
    const manifest = readJson(MANIFEST_PATH);
    const inv = fs.existsSync(INVENTORY_PATH) ? readJson(INVENTORY_PATH) : null;
    const tests = manifest.tests || [];
    const byId = new Map(tests.map((t) => [t.id, t]));
    stats.tests = tests.length;

    /* (1) schema validity (10a F12: depth — trimmed strings, real shapes) */
    const required = ["id", "family", "title", "script", "scriptVersion", "anchors", "env", "steps", "expected", "failureModes", "provenance", "risk"];
    const stringFields = ["id", "family", "title", "script", "scriptVersion", "provenance"];
    const seenIds = new Set();
    for (const t of tests) {
        for (const k of required) {
            if (t[k] === undefined || t[k] === null || (Array.isArray(t[k]) && t[k].length === 0)) {
                problems.push(`schema: test ${t.id || "?"} missing/empty field '${k}'`);
            }
        }
        for (const k of stringFields) {
            if (typeof t[k] === "string" && !t[k].trim()) {
                problems.push(`schema: test ${t.id || "?"} field '${k}' is whitespace-only`);
            }
        }
        if (seenIds.has(t.id)) problems.push(`schema: duplicate test id ${t.id}`);
        seenIds.add(t.id);
        /* anchors: an array of {file, atVersion, mustContain: [tokens]} */
        if (!Array.isArray(t.anchors) || !t.anchors.length) {
            problems.push(`schema: test ${t.id || "?"} carries no anchors array`);
        } else {
            for (const a of t.anchors) {
                if (!a || typeof a !== "object" || Array.isArray(a)) {
                    problems.push(`schema: test ${t.id || "?"} anchor is not an object`);
                } else if (typeof a.file !== "string" || typeof a.atVersion !== "string" || !a.file.trim() || !a.atVersion.trim()) {
                    problems.push(`schema: test ${t.id || "?"} anchor missing file/atVersion`);
                }
            }
        }
        /* env/risk subfields (render dereferences these — validate them) */
        if (!t.env || typeof t.env !== "object" || !t.env.browser || !t.env.manager || !Array.isArray(t.env.sites) || !t.env.sites.length) {
            problems.push(`schema: test ${t.id || "?"} env requires browser/manager/sites`);
        }
        if (!t.risk || typeof t.risk !== "object" || !t.risk.downloadVolume || !t.risk.networkExposure || !t.risk.tosSensitivity) {
            problems.push(`schema: test ${t.id || "?"} risk requires downloadVolume/networkExposure/tosSensitivity`);
        }
        if (!Array.isArray(t.failureModes) || !t.failureModes.length) {
            problems.push(`schema: test ${t.id} has no failureModes (the mitigation docs are the battery's substance — GUP A8)`);
        } else {
            for (const fm of t.failureModes) {
                for (const k of ["mode", "meaning", "mitigation", "reportEvidence"]) {
                    if (!fm[k] || !String(fm[k]).trim()) problems.push(`schema: test ${t.id} failureMode missing '${k}'`);
                }
            }
        }
    }
    stats.families = new Set(tests.map((t) => t.family)).size;

    /* (2) anchor liveness + version drift */
    for (const t of tests) {
        for (const a of (Array.isArray(t.anchors) ? t.anchors : [])) {
            if (!a || typeof a !== "object") continue;
            stats.anchors++;
            const fp = path.join(ROOT, a.file || "");
            if (!a.file || !fs.existsSync(fp)) {
                problems.push(`anchor: test ${t.id} names nonexistent file ${a.file}`);
                continue;
            }
            /* 10a F09: vacuous liveness refused — an anchor with no tokens
             * verifies nothing (the r9 manifest shipped five of these). */
            if (!Array.isArray(a.mustContain) || !a.mustContain.length || a.mustContain.some((tok) => typeof tok !== "string" || !tok.trim())) {
                problems.push(`anchor: test ${t.id} anchor ${a.file} carries no substantive mustContain tokens — vacuous liveness`);
                continue;
            }
            const src = fs.readFileSync(fp, "utf8");
            for (const tok of a.mustContain) {
                if (!src.includes(tok)) {
                    problems.push(`anchor: test ${t.id} token NOT LIVE in ${a.file}: '${tok}' — the code the test aims at moved or vanished; re-adjudicate the test`);
                }
            }
            /* version drift: the anchor's atVersion must equal the file's
             * current @version (suite-level anchors compare against
             * package.json — "suite" is the literal stamp). */
            const cur = currentVersionOf(a.file);
            if (cur === null) {
                /* 10a F11: a file that lost its @version header silently
                 * exempted its anchors from the drift refusal. */
                problems.push(`drift: test ${t.id} anchor ${a.file} carries no readable @version — cannot adjudicate the drift refusal`);
            } else if (a.atVersion !== "suite" && a.atVersion !== cur) {
                problems.push(`drift: test ${t.id} anchor ${a.file} stamped ${a.atVersion} but canon says ${cur} — a version bump without manifest re-adjudication (the 8b-F10 class: never silently drop)`);
            }
        }
    }

    /* (3) residual coverage totality + reachability */
    const covered = new Set();
    for (const rc of manifest.residualCoverage || []) {
        stats.residuals++;
        if (!rc.residual || !Array.isArray(rc.tests)) {
            problems.push(`coverage: malformed residualCoverage entry ${JSON.stringify(rc).slice(0, 60)}`);
            continue;
        }
        for (const id of rc.tests) {
            covered.add(id);
            if (!byId.has(id)) problems.push(`coverage: residual '${rc.residual}' references unknown test id ${id}`);
        }
    }
    for (const t of tests) {
        if (!covered.has(t.id) && t.script !== "ALL") {
            problems.push(`coverage: test ${t.id} (${t.family}) is unreachable from the residualCoverage map — every script-scoped test must map to a named residual or be folded into a matrix test`);
        }
    }

    /* (4) dist existence — every referenced script is installable at the
     * manifest's version (the battery aims at shippable code). */
    if (inv) {
        for (const t of tests) {
            if (t.script === "ALL") continue;
            const entry = inv.scripts.find((s) => s.file === t.script);
            if (!entry) { problems.push(`dist: test ${t.id} references unknown script ${t.script}`); continue; }
            if (entry.version !== t.scriptVersion) {
                problems.push(`dist: test ${t.id} stamps ${t.script} at ${t.scriptVersion} but inventory says ${entry.version}`);
            }
            if (!fs.existsSync(path.join(ROOT, "dist", t.script))) {
                problems.push(`dist: test ${t.id} references script with no dist build ${t.script}`);
            }
        }
    } else {
        /* 10a F08: the section skip must be visible, never silent. */
        problems.push("dist: inventory.json missing — cannot verify installability");
    }

    /* (5) results-ledger discipline */
    if (fs.existsSync(RESULTS_PATH)) {
        const results = readJson(RESULTS_PATH);
        if (!results.expiry) {
            problems.push("results: the ledger carries NO expiry (the G9 re-adjudication clock)");
        } else if (!roundLt(CURRENT_ROUND, results.expiry)) {
            /* 10a F04: the clock FIRES — a ledger expiry reached at the
             * current round demands re-adjudication (the pin census grep
             * never matched this JSON shape; presence-only used to pass a
             * stale ledger at exactly the pin it existed for). */
            problems.push(`results: ledger expiry ${results.expiry} reached at round ${CURRENT_ROUND} — re-adjudicate the operator results and roll the expiry (the G9 cycle)`);
        }
        const adj = results.adjudications || {};
        stats.results = Object.keys(adj).length;
        for (const [id, r] of Object.entries(adj)) {
            if (!byId.has(id)) { problems.push(`results: orphan adjudication for unknown test id ${id}`); continue; }
            /* 10a F13: UNTESTED is the ledger default — only a real
             * adjudication counts. */
            if (r.status !== "UNTESTED") stats.adjudicated++;
            if (!STATUSES.has(r.status)) problems.push(`results: ${id} illegal status '${r.status}' (PASS/FAIL/BLOCKED/UNTESTED)`);
            if (r.status === "FAIL" && (!r.evidence || !r.note)) {
                problems.push(`results: ${id} FAIL without evidence+note (the fail-visible chain)`);
            }
        }
        /* every test not yet adjudicated is UNTESTED by construction — the
         * check surfaces the count, not a failure: the battery's whole point
         * is that the OPERATOR hasn't certified these yet. */
    } else {
        problems.push("results: tools/operator-battery/results.json missing");
    }

    return { problems, ...stats };
}

/* ── render: the deterministic operator-facing checklist ─────────────────── */
const FAMILY_ORDER = [
    ["cross-tab-bridges", "Forums++ cross-tab bridges"],
    ["resolver-liveness", "Forums++ resolver liveness on live hosts"],
    ["download-pipeline", "Forums++ download pipeline"],
    ["hailuo-live-capture", "Hailuo++ live capture on hailuoai.video"],
    ["confirmation-bypass", "Confirmation Bypass on turbo.cr"],
    ["watermark-gemini", "Watermark++ on gemini.google.com"],
    ["instagram-ares", "Instagram++ ARES wall"],
    ["manager-matrix", "Manager / browser matrix"],
    ["co-install", "Cross-script co-install"],
    ["suite-boot", "Suite-wide boot health"],
];

/* 10a F10: token → line references "at render" (all matches, capped at 4,
 * honestly labeled — a naive first-match would point at @connect headers
 * and @version banners instead of the machinery the test aims at). */
function anchorLineRefs(file, tok) {
    const fp = path.join(ROOT, file);
    if (!fs.existsSync(fp)) return null;
    const lines = fs.readFileSync(fp, "utf8").split("\n");
    const hits = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(tok)) hits.push(i + 1);
    }
    if (!hits.length) return null;
    const shown = hits.slice(0, 4).join(", ");
    return hits.length > 4 ? `${shown} …+${hits.length - 4} more` : shown;
}

export function renderOperatorBatteryDoc() {
    const manifest = readJson(MANIFEST_PATH);
    const pkg = readJson(PKG_PATH);
    const results = fs.existsSync(RESULTS_PATH) ? readJson(RESULTS_PATH) : { adjudications: {} };
    const adj = results.adjudications || {};

    /* 10a F10: the inverted coverage map — which residual(s) each test
     * closes (the rendered checklist used to lose the "why" entirely). */
    const residualByTest = new Map();
    for (const rc of manifest.residualCoverage || []) {
        for (const id of rc.tests || []) {
            if (!residualByTest.has(id)) residualByTest.set(id, []);
            residualByTest.get(id).push(rc.residual);
        }
    }

    const L = [];
    L.push(`# Operator Regression Battery · suite ${pkg.version}`);
    L.push("");
    L.push(`> ${manifest.tests.length} operator-side tests across ${new Set(manifest.tests.map((t) => t.family)).size} families — every verification the machine gate cannot make.`);
    L.push(`> Manifest: \`tools/operator-battery/manifest.json\` (machine-checked: anchor liveness, version stamps, residual coverage). This checklist is its rendered form.`);
    L.push(`> **BLOCKED is a first-class state** — network/ToS/transient conditions are honest states, never silent. A FAIL with evidence is more valuable than a silent pass.`);
    L.push("");
    L.push("## Conventions (read once)");
    L.push("");
    L.push(`- **Install**: ${manifest.conventions.install}`);
    L.push(`- **Console prefixes**: ${manifest.conventions.consolePrefixes}`);
    L.push(`- **Evidence**: ${manifest.conventions.evidence}`);
    L.push(`- **BLOCKED**: ${manifest.conventions.blocked}`);
    L.push(`- **Rollback / immediate mitigation**: ${manifest.conventions.rollback}`);
    L.push("");
    for (const [fam, label] of FAMILY_ORDER) {
        const tests = manifest.tests.filter((t) => t.family === fam);
        if (!tests.length) continue;
        L.push(`## ${label} (${tests.length})`);
        L.push("");
        for (const t of tests) {
            const st = adj[t.id]?.status ? ` — ${adj[t.id].status}` : "";
            L.push(`### ${t.id}${st}`);
            L.push("");
            L.push(`**${t.title}** — \`${t.script}\` v${t.scriptVersion} · provenance: ${t.provenance}`);
            L.push("");
            /* 10a F10: the residual map + the anchor line with line refs. */
            const residualIds = residualByTest.get(t.id) || [];
            if (residualIds.length) {
                L.push(`- **Closes residual${residualIds.length > 1 ? "s" : ""}**: ${residualIds.join(" · ")}`);
            }
            for (const a of t.anchors || []) {
                const toks = (a.mustContain || []).map((tok) => {
                    const refs = anchorLineRefs(a.file, tok);
                    const refNote = refs ? ` — lines ${refs} at render` : "";
                    return `\`${tok}\`${refNote}`;
                });
                L.push(`- **Anchor**: ${a.file} @ ${a.atVersion}${toks.length ? ` — ${toks.join(" · ")}` : ""}`);
            }
            L.push(`- **Environment**: ${t.env.browser} / ${t.env.manager} / sites: ${t.env.sites.join("; ")}`);
            if (t.env.prerequisites?.length) L.push(`- **Prerequisites**: ${t.env.prerequisites.join(" · ")}`);
            L.push(`- **Risk**: download ${t.risk.downloadVolume} · network ${t.risk.networkExposure} · ToS ${t.risk.tosSensitivity}`);
            L.push("");
            L.push("**Steps**:");
            for (let i = 0; i < t.steps.length; i++) L.push(`${i + 1}. ${t.steps[i]}`);
            L.push("");
            L.push(`**PASS looks like**: ${t.expected}`);
            L.push("");
            L.push("**If it fails** (what it means → what to do):");
            L.push("");
            L.push("| mode | meaning | mitigation | evidence to capture |");
            L.push("|---|---|---|---|");
            for (const fm of t.failureModes) {
                L.push(`| ${fm.mode} | ${fm.meaning} | ${fm.mitigation} | ${fm.reportEvidence} |`);
            }
            L.push("");
        }
    }
    L.push("## Report back (paste this template, filled)");
    L.push("");
    L.push("```markdown");
    L.push(`## OPERATOR BATTERY REPORT — suite ${pkg.version} @ <git sha>`);
    L.push("ENV: <browser + version> / <manager + version (MV3?)> / <OS> / dist @ <git sha> / date <YYYY-MM-DD>");
    L.push("");
    L.push("| test | status (PASS/FAIL/BLOCKED) | evidence (link/inline) | note (failure mode if FAIL/BLOCKED) |");
    L.push("|---|---|---|---|");
    for (const t of manifest.tests) L.push(`| ${t.id} |  |  |  |`);
    L.push("");
    L.push("FREE-FORM FINDINGS:");
    L.push("- <console excerpts, screenshot links, manager prompt hostnames, new-CDN hostnames for isBunkrUrl, etc.>");
    L.push("```");
    L.push("");
    L.push("---");
    L.push("");
    L.push(`*Rendered by \`node tools/operator-battery.mjs render\` — deterministic; re-render after any bump. The manifest is the source of truth; this doc is its operator-facing projection (residual map + anchor line refs included). Results ingested by \`node tools/operator-battery.mjs ingest <report.md>\` land in \`tools/operator-battery/results.json\` (adjudication ledger, expiry ${results.expiry || "v1.18.0"}); a partial report needs \`--partial\`. UNTESTED is the ledger's default — never a report row.*`);
    fs.mkdirSync(path.dirname(DOC_PATH), { recursive: true });
    fs.writeFileSync(DOC_PATH, L.join("\n") + "\n", "utf8");
    return DOC_PATH;
}

/* ── ingest: parse a filled paste-back report into results.json ──────────── */
export function ingestOperatorReport(reportPath, opts = {}) {
    /* 10a F14: a missing report is a clean problem, not a raw stack. */
    let text;
    try {
        text = fs.readFileSync(reportPath, "utf8");
    } catch (readErr) {
        return { parsed: 0, rejected: 0, problems: [`report unreadable: ${reportPath} — ${readErr.message}`] };
    }
    const manifest = readJson(MANIFEST_PATH);
    const pkg = readJson(PKG_PATH);
    const byId = new Map(manifest.tests.map((t) => [t.id, t]));
    const results = readJson(RESULTS_PATH);
    results.adjudications = results.adjudications || {};

    const envLine = (/^ENV:\s*(.+)$/m.exec(text) || [])[1]?.trim() || "";
    const env = envLine || "unknown env";
    /* 10a F07: the run date is the OPERATOR's stated date (the ENV line's
     * `date YYYY-MM-DD` field) — the machine date fabricated provenance
     * whenever the report was written days before the paste-back. */
    const statedDate = (/date\s+(\d{4}-\d{2}-\d{2})/i.exec(envLine) || [])[1] || "";
    const runDate = statedDate || new Date().toISOString().slice(0, 10);

    /* 10a F06b: suite-version provenance — the report header's suite line
     * must match the tree the operator ran against. */
    const problems = [];
    const suiteVer = (/suite\s+(\S+)\s*@/i.exec(text) || [])[1] || "";
    if (suiteVer && suiteVer !== pkg.version) {
        problems.push(`report header says suite ${suiteVer} but this tree is ${pkg.version} — ingest against the tree the operator ran, or re-verify before ingesting`);
    }

    /* 10a F14: scope rows to the report TABLE — after the header row (plus
     * its separator), before FREE-FORM FINDINGS. Free-form junk must
     * neither block nor corrupt the ingest. */
    const lines = text.split("\n");
    let tableStart = -1;
    for (let i = 0; i < lines.length; i++) {
        if (/^\s*\|\s*test\b/i.test(lines[i])) { tableStart = i + 2; break; }
    }
    let tableEnd = lines.length;
    if (tableStart >= 0) {
        for (let i = tableStart; i < lines.length; i++) {
            if (/^\s*FREE-FORM FINDINGS:/i.test(lines[i])) { tableEnd = i; break; }
        }
    } else {
        problems.push("no report table header found — expected the '| test | status …' header from the paste-back template");
    }
    const tableLines = tableStart >= 0 ? lines.slice(tableStart, tableEnd) : [];

    /* 10a F03: case-insensitive ids/statuses + the row-shape linter — a
     * near-miss row (`Pass`, `blocked`, a broken column count) is NAMED,
     * never silently dropped. */
    let parsed = 0, rejected = 0;
    const seen = new Set();
    for (const line of tableLines) {
        if (!/^\s*\|/.test(line)) continue;
        if (/^\s*\|[\s:|-]+\|?\s*$/.test(line)) continue; /* separator row */
        const m = /^\s*\|\s*([A-Za-z][A-Za-z0-9-]*)\s*\|\s*([A-Za-z]+)\s*\|\s*([^|]*)\|\s*([^|]*)\|/.exec(line);
        if (!m) {
            problems.push(`unparsed report row: "${line.trim().slice(0, 80)}" — check the column shape (| test | status | evidence | note |)`);
            rejected++;
            continue;
        }
        const id = m[1].toUpperCase();
        const status = m[2].toUpperCase();
        const evidence = m[3].trim();
        const note = m[4].trim();
        if (!byId.has(id)) { problems.push(`unknown test id in report: ${id}`); rejected++; continue; }
        /* 10a F05: duplicate ids are rejected — last-wins silently discarded
         * the operator's earlier row for the same test. */
        if (seen.has(id)) { problems.push(`duplicate test id in report: ${id} — one row per test; the earlier row would be silently discarded`); rejected++; continue; }
        /* 10a F13: UNTESTED is the ledger default, never an operator
         * assertion — a report row asserting it is a shape error. */
        if (!REPORT_STATUSES.has(status)) {
            problems.push(`${id}: illegal report status '${status}' (PASS/FAIL/BLOCKED — UNTESTED is the ledger's default, not a report row)`);
            rejected++;
            continue;
        }
        /* 10a F02: the FAIL discipline check enforces — BOTH evidence AND
         * note. The old `!evidence && !note` admitted an evidence-only FAIL
         * that then hard-failed the gate while ingest reported success. */
        if (status === "FAIL" && (!evidence || !note)) {
            problems.push(`${id}: FAIL requires BOTH evidence and note (the fail-visible chain — check and ingest enforce the same discipline)`);
            rejected++;
            continue;
        }
        seen.add(id);
        /* 10a F07: no fabricated "(inline)" evidence — the operator's value
         * lands verbatim (empty evidence is legal only for PASS/BLOCKED). */
        results.adjudications[id] = { status, env, evidence, note, date: runDate };
        parsed++;
    }
    if (!parsed && !rejected) problems.push("no report rows parsed — is this a filled paste-back template?");

    /* 10a F06a: coverage — a full report is the default; a partial one must
     * say so (--partial), and the coverage gap is NAMED either way. */
    const allowPartial = opts.partial === true;
    if (parsed && seen.size < manifest.tests.length) {
        const missing = manifest.tests.map((t) => t.id).filter((id) => !seen.has(id));
        if (!allowPartial) {
            problems.push(`report covers ${seen.size} of ${manifest.tests.length} tests — missing: ${missing.join(", ")} (a full report is the default; pass --partial to merge a partial update)`);
        }
    }

    if (!problems.length) fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 4) + "\n", "utf8");
    return { parsed, rejected, problems };
}

/* ── CLI (10a F01: main-module-guarded — importing this instrument from
 * validate.mjs must never hijack the host's argv or exit codes) ──────────── */
const isMain = typeof process.argv[1] === "string"
    && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
    const [cmd, ...args] = process.argv.slice(2);
    if (cmd === "check" || !cmd) {
        const { problems, ...stats } = runOperatorBatteryCheck();
        console.log(`operator battery: ${stats.tests} tests / ${stats.families} families / ${stats.anchors} anchors / ${stats.residuals} residuals mapped / ${stats.adjudicated} of ${stats.results} results adjudicated`);
        if (problems.length) {
            for (const p of problems) console.log(`  ✗ ${p}`);
            process.exit(1);
        }
        console.log("  ✓ manifest schema valid; every anchor live at its stamped version; residual coverage total; dist installable; results ledger disciplined (expiry live)");
    } else if (cmd === "render") {
        console.log(`  ✓ wrote ${renderOperatorBatteryDoc()}`);
    } else if (cmd === "ingest") {
        const partial = args.includes("--partial");
        const reportPath = args.find((a) => a !== "--partial");
        if (!reportPath) { console.error("ingest requires the report file path"); process.exit(2); }
        const { parsed, rejected, problems } = ingestOperatorReport(reportPath, { partial });
        console.log(`ingest: ${parsed} rows parsed, ${rejected} rejected${partial ? " (partial mode)" : ""}`);
        for (const p of problems) console.log(`  ✗ ${p}`);
        process.exit(problems.length ? 1 : 0);
    } else {
        console.error("usage: node tools/operator-battery.mjs [check|render|ingest <report.md> [--partial]]");
        process.exit(2);
    }
}
