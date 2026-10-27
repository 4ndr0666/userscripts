#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/operator-battery.mjs — the operator-side regression battery instrument
 * ----------------------------------------------------------------------------
 * WO-01 round 9 (the operator's directive: "pass me the operator-side tests
 * beyond the sandbox and fashion it so that it is itself inclusive of all
 * coinciding information, docs the required detail to mitigate or deal with
 * the findings. Implement said regression battery toward completion.").
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
 *            FAIL carries evidence+note, expiry present, orphan sweep).
 *   render — deterministically emits documentation/operator-battery/README.md,
 *            the operator-facing plain-language checklist (no node needed to
 *            READ it — it is committed in-repo and readable on GitHub).
 *   ingest — parses a filled paste-back report (the template at the foot of
 *            the rendered README) and updates results.json adjudications.
 *
 * The engine reads inventory.json for dist/version truth and package.json for
 * the suite round — the same single sources the build identity carries.
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MANIFEST_PATH = path.join(ROOT, "tools", "operator-battery", "manifest.json");
const RESULTS_PATH = path.join(ROOT, "tools", "operator-battery", "results.json");
const DOC_PATH = path.join(ROOT, "documentation", "operator-battery", "README.md");
const INVENTORY_PATH = path.join(ROOT, "inventory.json");
const PKG_PATH = path.join(ROOT, "package.json");

const STATUSES = new Set(["PASS", "FAIL", "BLOCKED", "UNTESTED"]);

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

    /* (1) schema validity */
    const required = ["id", "family", "title", "script", "scriptVersion", "anchors", "env", "steps", "expected", "failureModes", "provenance", "risk"];
    const seenIds = new Set();
    for (const t of tests) {
        for (const k of required) {
            if (t[k] === undefined || t[k] === null || (Array.isArray(t[k]) && t[k].length === 0 && k !== "prerequisites")) {
                problems.push(`schema: test ${t.id || "?"} missing/empty field '${k}'`);
            }
        }
        if (seenIds.has(t.id)) problems.push(`schema: duplicate test id ${t.id}`);
        seenIds.add(t.id);
        if (!Array.isArray(t.failureModes) || !t.failureModes.length) {
            problems.push(`schema: test ${t.id} has no failureModes (the mitigation docs are the battery's substance — GUP A8)`);
        } else {
            for (const fm of t.failureModes) {
                for (const k of ["mode", "meaning", "mitigation", "reportEvidence"]) {
                    if (!fm[k]) problems.push(`schema: test ${t.id} failureMode missing '${k}'`);
                }
            }
        }
    }
    stats.families = new Set(tests.map((t) => t.family)).size;

    /* (2) anchor liveness + version drift */
    for (const t of tests) {
        for (const a of t.anchors || []) {
            stats.anchors++;
            const fp = path.join(ROOT, a.file);
            if (!fs.existsSync(fp)) {
                problems.push(`anchor: test ${t.id} names nonexistent file ${a.file}`);
                continue;
            }
            const src = fs.readFileSync(fp, "utf8");
            for (const tok of a.mustContain || []) {
                if (!src.includes(tok)) {
                    problems.push(`anchor: test ${t.id} token NOT LIVE in ${a.file}: '${tok}' — the code the test aims at moved or vanished; re-adjudicate the test`);
                }
            }
            /* version drift: the anchor's atVersion must equal the file's
             * current @version (suite-level anchors compare against
             * package.json — "suite" is the literal stamp). */
            const cur = currentVersionOf(a.file);
            if (cur && a.atVersion !== "suite" && a.atVersion !== cur) {
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
    }

    /* (5) results-ledger discipline */
    if (fs.existsSync(RESULTS_PATH)) {
        const results = readJson(RESULTS_PATH);
        if (!results.expiry) problems.push("results: the ledger carries NO expiry (the G9 re-adjudication clock)");
        const adj = results.adjudications || {};
        stats.results = Object.keys(adj).length;
        for (const [id, r] of Object.entries(adj)) {
            if (!byId.has(id)) { problems.push(`results: orphan adjudication for unknown test id ${id}`); continue; }
            stats.adjudicated++;
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

export function renderOperatorBatteryDoc() {
    const manifest = readJson(MANIFEST_PATH);
    const pkg = readJson(PKG_PATH);
    const results = fs.existsSync(RESULTS_PATH) ? readJson(RESULTS_PATH) : { adjudications: {} };
    const adj = results.adjudications || {};
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
    L.push(`*Rendered by \`node tools/operator-battery.mjs render\` — deterministic; re-render after any bump. The manifest is the source of truth; this doc is its operator-facing projection. Results ingested by \`node tools/operator-battery.mjs ingest <report.md>\` land in \`tools/operator-battery/results.json\` (adjudication ledger, expiry ${results.expiry || "v1.18.0"}).*`);
    fs.mkdirSync(path.dirname(DOC_PATH), { recursive: true });
    fs.writeFileSync(DOC_PATH, L.join("\n") + "\n", "utf8");
    return DOC_PATH;
}

/* ── ingest: parse a filled paste-back report into results.json ──────────── */
export function ingestOperatorReport(reportPath) {
    const text = fs.readFileSync(reportPath, "utf8");
    const manifest = readJson(MANIFEST_PATH);
    const byId = new Map(manifest.tests.map((t) => [t.id, t]));
    const results = readJson(RESULTS_PATH);
    results.adjudications = results.adjudications || {};
    const env = (/^ENV:\s*(.+)$/m.exec(text) || [])[1]?.trim() || "unknown env";
    let parsed = 0, rejected = 0;
    const problems = [];
    for (const m of text.matchAll(/^\|\s*([A-Z][A-Z0-9-]+)\s*\|\s*([A-Z]+)\s*\|\s*([^|]*)\|\s*([^|]*)\|/gm)) {
        const id = m[1], status = m[2], evidence = m[3].trim(), note = m[4].trim();
        if (!byId.has(id)) { problems.push(`unknown test id in report: ${id}`); rejected++; continue; }
        if (!STATUSES.has(status)) { problems.push(`${id}: illegal status '${status}'`); rejected++; continue; }
        if (status === "FAIL" && !evidence && !note) { problems.push(`${id}: FAIL without evidence/note`); rejected++; continue; }
        results.adjudications[id] = { status, env, evidence: evidence || "(inline)", note: note || "", date: new Date().toISOString().slice(0, 10) };
        parsed++;
    }
    if (!parsed) problems.push("no report rows parsed — is this a filled paste-back template?");
    if (!problems.length) fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 4) + "\n", "utf8");
    return { parsed, rejected, problems };
}

/* ── CLI ──────────────────────────────────────────────────────────────────── */
const [cmd, ...args] = process.argv.slice(2);
if (cmd === "check" || !cmd) {
    const { problems, ...stats } = runOperatorBatteryCheck();
    console.log(`operator battery: ${stats.tests} tests / ${stats.families} families / ${stats.anchors} anchors / ${stats.residuals} residuals mapped / ${stats.adjudicated} of ${stats.results} results adjudicated`);
    if (problems.length) {
        for (const p of problems) console.log(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("  ✓ manifest schema valid; every anchor live at its stamped version; residual coverage total; dist installable; results ledger disciplined");
} else if (cmd === "render") {
    console.log(`  ✓ wrote ${renderOperatorBatteryDoc()}`);
} else if (cmd === "ingest") {
    if (!args[0]) { console.error("ingest requires the report file path"); process.exit(2); }
    const { parsed, rejected, problems } = ingestOperatorReport(args[0]);
    console.log(`ingest: ${parsed} rows parsed, ${rejected} rejected`);
    for (const p of problems) console.log(`  ✗ ${p}`);
    process.exit(problems.length ? 1 : 0);
} else {
    console.error("usage: node tools/operator-battery.mjs [check|render|ingest <report.md>]");
    process.exit(2);
}
