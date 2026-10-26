#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/connect-census.mjs — minimal-privilege @connect census (suite v1.5.1)
 * ----------------------------------------------------------------------------
 * Round mandate (v1.5.0 verdict §2/G7, completed in v1.5.1): the Phase A
 * machine audit found 9 scripts carrying `@connect *` (Images++, LinkMasterΨ,
 * Blob2URL, FLX, Stream Interceptor, m3u8++, Bunkr++, Gofile++, Pixeldrain++)
 * and NO gate measuring the declared-vs-observed privilege surface. This
 * census is that gate. (Precedent: tools/transport-census.mjs v1.4.10.)
 *
 * What it scans: every canon/<tier> .user.js (the installable units — the
 * @connect metadata and the privileged dispatches live in the same file;
 * modules and the kernel carry no connect headers of their own).
 *
 * Per script:
 *   declared  — the @connect token set parsed from the ==UserScript== block
 *               (validated tokens only; prose comments cannot satisfy the
 *               gate: a token is host-shaped or it is not counted).
 *   observed  — hosts provable from string-literal (and template-prefix)
 *               arguments to gmFetch( / GM_xmlhttpRequest( / GM.xmlHttpRequest
 *               dispatches. Dynamic URLs (variables, full template vars)
 *               are NOT observable — that is exactly what the wildcard
 *               ledger adjudicates.
 *
 * Fail-closed on:
 *   (a) an observed host not covered by the declared set (wildcard `*`
 *       covers everything; `D` covers D and its subdomains per manager
 *       semantics; `*.D` covers D's subdomains);
 *   (b) `@connect *` declared without a ledger entry carrying justification
 *       + expiry + burn-down note;
 *   (c) ledger drift — an entry whose file no longer declares the wildcard.
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CURRENT_ROUND, roundLt } from "./census-round.mjs"; /* WO-01 round-1 (2-a F1): round derives from package.json — the hardcoded
 * "v1.7.2" left every G9 expiry check inert while the suite reached v1.8.2. */

const DEFAULT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/* ── Adjudication ledger: sanctioned wildcards (drift-checked) ───────────── */
/* WO-01 round-1 re-adjudication: every entry below was re-verified against
 * the v1.8.2 tree (census green at counts) and its expiry rolled
 * v1.8.0 → v1.12.0 — the G9 gate was silently inert because CURRENT_ROUND
 * stayed hardcoded at v1.7.2 while the suite advanced (see
 * tools/census-round.mjs; the round now derives from package.json). */
const ADJUDICATED_WILDCARD = [
    {
        file: "canon/_merged/4ndr0tools - Images++.user.js",
        reason: "page-content-driven resolution: the redirect-following parser resolves image URLs found ON THE PAGE — 17 known hosts are declared, the wildcard is the long tail of page-embedded redirect targets (not script-authored endpoints); burn-down: the declared list grows as hosts stabilize, the * tracks page content by construction",
        expiry: "v1.14.0",
    },
    {
        file: "canon/_merged/4ndr0tools - LinkMasterΨ.user.js",
        reason: "user-content-driven: LinkMaster captures arbitrary links/media from the page and fetches THOSE (thumbnails, direct media, resolver hops) — the endpoint set is the page's own content; 127.0.0.1 declared for the local companion; burn-down: none possible without breaking the capture-the-link feature itself",
        expiry: "v1.14.0",
    },
    {
        file: "canon/_promoted/4ndr0tools - Blob2URL.user.js",
        reason: "user-directed: the vault processes user-provided/pasted URLs into blobs — arbitrary hosts BY DESIGN (the feature is 'any URL → blob'); burn-down: none — the wildcard IS the feature surface",
        expiry: "v1.14.0",
    },
    {
        file: "canon/_promoted/4ndr0tools - Forum Link Xtractor.user.js",
        reason: "page-content-driven: link extraction fetches media/hotlink URLs discovered in forum posts — arbitrary hosts by construction (the post content defines the endpoint set); burn-down: none without breaking extraction",
        expiry: "v1.14.0",
    },
    {
        file: "canon/_promoted/4ndr0tools - Stream Interceptor.user.js",
        reason: "stream-discovery: the interceptor fetches media manifest/segment URLs observed in page traffic — 9 player CDN families declared, the wildcard covers unknown player CDNs; burn-down: declare hosts as they stabilize, the * is the observed-traffic long tail",
        expiry: "v1.14.0",
    },
    {
        file: "canon/_promoted/4ndr0tools - m3u8++.user.js",
        reason: "stream-playback: fetches the page's own m3u8 manifests and their segments — the manifest's segment hosts are page/server-defined at runtime, arbitrary by construction; burn-down: none — the endpoint set belongs to the stream, not the script",
        expiry: "v1.14.0",
    },
    {
        file: "canon/_sovereign/4ndr0tools - Bunkr++.user.js",
        reason: "download engine: bunkr file downloads resolve through page redirects to arbitrary CDN hosts at runtime; 127.0.0.1 declared for the local companion API; burn-down: declare observed CDN hosts as they stabilize",
        expiry: "v1.14.0",
    },
    {
        file: "canon/_sovereign/4ndr0tools - Gofile++.user.js",
        reason: "api + download: api.gofile.io and localhost declared; file downloads redirect to gofile CDN nodes assigned by the server per download — arbitrary at runtime; burn-down: none — the CDN node set is server-assigned per session",
        expiry: "v1.14.0",
    },
    {
        file: "canon/_sovereign/4ndr0tools - Pixeldrain++.user.js",
        reason: "mirror surface: 24 official/community mirrors declared; the wildcard covers user-configured custom download endpoints (the settings panel accepts arbitrary proxy/mirror URLs — operator-supplied, not script-authored); burn-down: configurable-host surface by design",
        expiry: "v1.14.0",
    },
];

const ledgerKey = (e) => e.file;

/* ── helpers ─────────────────────────────────────────────────────────────── */

/* a valid @connect token: host, *.host, host:port, IPv4, `self`, `*` */
const TOKEN_RE = /^(?:\*|self|(?:\*\.)?[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*(?::\d+)?|(?:::1|localhost)(?::\d+)?)$/;

function declaredConnects(src) {
    const out = [];
    /* only inside the ==UserScript== metadata block */
    const block = src.match(/==UserScript==([\s\S]*?)==\/UserScript==/);
    const region = block ? block[1] : "";
    for (const m of region.matchAll(/@connect\s+(\S+)(?=\s|$)/g)) {
        const tok = m[1].trim();
        if (TOKEN_RE.test(tok)) out.push(tok.toLowerCase());
    }
    return out;
}

/* WO-01 round 6 (2d F01): dispatch-site observation split — sites whose url
 * value is a VARIABLE cannot be literal-observed; they are counted and
 * disclosed instead of silently passing. 10/15 GM-transport scripts dispatch
 * variable urls (resolver-walker patterns), which left the observed-subset-
 * declared gate vacuously green for exactly the scripts with the largest
 * transport surfaces; the vacuity is now a printed number, and a script with
 * a live transport and ZERO declarations is flagged instead of skipped. */
function dispatchSiteCounts(src) {
    let literal = 0;
    let variable = 0;
    let m;
    const gmAny = /gmFetch\s*\(/g;
    while ((m = gmAny.exec(src)) !== null) {
        const rest = src.slice(m.index + m[0].length);
        if (/^\s*['"`]/.test(rest)) literal++;
        else variable++;
    }
    const xhrRe = /GM(?:_xmlhttpRequest|\.\s*xmlHttpRequest)\s*\(\s*\{([\s\S]{0,900}?)\}/g;
    while ((m = xhrRe.exec(src)) !== null) {
        if (/url\s*:\s*['"`]/.test(m[1])) literal++;
        else variable++;
    }
    return { literal, variable };
}

/* observed hosts from privileged dispatch literals */
function observedHosts(src) {
    const hosts = [];
    const pushLiteral = (lit) => {
        if (!lit) return;
        let u = lit;
        /* template prefix: keep the static head, drop the ${…} tail */
        const td = u.indexOf("${");
        if (td >= 0) u = u.slice(0, td);
        u = u.trim();
        const m = u.match(/^(?:https?:)?\/\/([^/\s'"`]+)/i) || u.match(/^([A-Za-z0-9.-]+(?::\d+)?)(?=\/|$)/);
        if (m) {
            let h = m[1].toLowerCase();
            if (h.endsWith(":") || h === "") return;
            hosts.push(h);
        }
    };
    /* gmFetch( 'literal' | `tpl` — first-arg position */
    const gmRe = /gmFetch\s*\(\s*(['"`])([^'"`)]*)\1/g;
    let m;
    while ((m = gmRe.exec(src)) !== null) pushLiteral(m[2]);
    /* GM_xhr option objects: url: 'literal' */
    const xhrRe = /GM(?:_xmlhttpRequest|\.\s*xmlHttpRequest)\s*\(\s*\{([\s\S]{0,900}?)\}/g;
    while ((m = xhrRe.exec(src)) !== null) {
        const um = m[1].match(/url\s*:\s*(['"`])([^'"`$]*)\1/);
        if (um) pushLiteral(um[2]);
        const um2 = m[1].match(/url\s*:\s*(['"`])([^'"`]*)\1/);
        if (!um && um2) pushLiteral(um2[2]);
    }
    return hosts;
}

/* host H covered by declared token D (manager semantics: D covers D + its
 * subdomains; *.D covers subdomains; * covers everything) */
function coveredBy(H, declared) {
    if (declared.includes("*")) return true;
    for (const d of declared) {
        if (d === "self") continue; /* page origin — not statically provable; documented */
        const portStripped = H.replace(/:\d+$/, "");
        if (portStripped === d) return true;
        if (portStripped.endsWith("." + d)) return true;
        if (d.startsWith("*.") && (portStripped.endsWith("." + d.slice(2)) || portStripped === d.slice(2))) return true;
    }
    return false;
}

/* ── the census ──────────────────────────────────────────────────────────── */

export function runConnectCensus(root = DEFAULT_ROOT, opts = {}) {
    const problems = [];
    /* negative-proof mode: the adjudication ledger is disabled — the gate
     * must fail wherever justification is absent. Proves the gate bites on
     * the prior canon (v1.4.10 carried 9 unjustified wildcards; the ledger
     * is v1.5.1 work and lives in this tool, so the proof runs with it off). */
    const LEDGER = opts.noLedger ? [] : ADJUDICATED_WILDCARD;
    const stats = { scripts: 0, connectDeclarations: 0, wildcardScripts: 0, observedHosts: 0, ledgered: 0, dispatchLiteral: 0, dispatchVariable: 0 };
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

    const wildcardFiles = [];
    for (const [rel, abs] of targets) {
        const src = fs.readFileSync(abs, "utf8");
        const declared = declaredConnects(src);
        const dispatches = dispatchSiteCounts(src);
        stats.dispatchLiteral += dispatches.literal;
        stats.dispatchVariable += dispatches.variable;
        if (!declared.length) {
            /* WO-01 round 6 (2d F01): the old bare `continue` made the
             * observed-subset-declared gate vacuously green for zero-declaration
             * scripts with live transports (the LFA bugmenot.com case). */
            if (dispatches.literal > 0 || dispatches.variable > 0) {
                problems.push(`${rel}: live privileged transport (${dispatches.literal} literal + ${dispatches.variable} variable dispatch sites) with ZERO @connect declarations — declare the endpoints (GUP G7 minimal privilege)`);
            }
            continue;
        }
        stats.scripts++;
        stats.connectDeclarations += declared.length;
        const observed = [...new Set(observedHosts(src))];
        stats.observedHosts += observed.length;

        /* (a) observed ⊆ declared */
        for (const h of observed) {
            if (!coveredBy(h, declared)) {
                problems.push(`${rel}: observed privileged endpoint \`${h}\` not covered by any @connect declaration (GUP G7 minimal privilege: declare it or route the dispatch)`);
            }
        }

        /* (b) wildcard needs a ledger entry */
        if (declared.includes("*")) {
            stats.wildcardScripts++;
            wildcardFiles.push(rel);
            const entry = LEDGER.find((e) => e.file === rel);
            if (entry) { stats.ledgered++; seenLedger.add(ledgerKey(entry)); }
            else {
                problems.push(`${rel}: @connect * declared without a ledger entry (GUP G7 minimal privilege: justify the wildcard with burn-down note + expiry, or enumerate the hosts)`);
            }
        }
    }

    /* (c) ledger drift + expiry */
    for (const e of LEDGER) {
        if (!seenLedger.has(ledgerKey(e))) {
            problems.push(`stale connect ledger entry: ${e.file} — the wildcard is no longer declared there (remove the entry)`);
        }
        if (e.expiry && roundLt(CURRENT_ROUND, e.expiry) === false) {
            problems.push(`expired connect ledger entry: ${e.file} — expiry ${e.expiry} has passed round ${CURRENT_ROUND} without re-adjudication`);
        }
    }

    /* escalation contract: wildcard ledger ≤ 9 (the burn-down floor) */
    if (LEDGER.length > 9) {
        problems.push(`wildcard ledger has ${LEDGER.length} entries — above the ≤9 floor from the v1.5.0 escalation contract`);
    }

    return { problems, ...stats, wildcardFiles };
}

/* v1.6.0 < v1.7.0 */
/* WO-01 round-4 (4-a F02): roundLt is single-sourced from census-round.mjs now — the nine byte-identical copies are gone (port-drift class closed). */

/* CLI: node tools/connect-census.mjs [root] */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const root = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_ROOT;
    const noLedger = process.argv.includes("--no-ledger");
    const r = runConnectCensus(root, { noLedger });
    console.log(`connect census: ${r.scripts} declaring scripts, ${r.connectDeclarations} @connect tokens, ${r.observedHosts} distinct observed literal hosts, ${r.dispatchLiteral} literal + ${r.dispatchVariable} variable-url dispatch sites (the variable split disclosed per 2d F01) — ${r.wildcardScripts} wildcard scripts (${r.ledgered} ledgered)${noLedger ? " [negative-proof mode: adjudication layer disabled]" : ""}`);
    if (r.problems.length) {
        for (const p of r.problems) console.log(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("  ✓ every observed endpoint is declared; every wildcard is ledgered with justification + expiry; every live-transport script declares at least one endpoint");
}
