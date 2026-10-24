#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/inventory.mjs — the suite inventory & audit system
 * ----------------------------------------------------------------------------
 * Successor to the legacy tools/update_catalog.mjs. The legacy generator had
 * twelve gaps, each mitigated here:
 *
 *  1. Scanned only the first 80 lines for @description → whole-file metadata
 *     parser (headers with 30+ @match lines no longer truncate).
 *  2. No @version extraction → full version ledger with drift detection.
 *  3. No stable/BETA pair detection → sibling-pair finder flags dual-track
 *     forks before they reach users.
 *  4. No @match collision matrix → co-install interference report (which
 *     scripts fight over the same domains).
 *  5. No metadata validation → missing @license/@author/@updateURL/@grant
 *     surface as CI failures (exit 1).
 *  6. Markdown-only output → emits inventory.json (machine-readable,
 *     GUP-evidence compatible) + README catalog.
 *  7. No hash manifest → SHA-256 per script for drift detection.
 *  8. Ignored archive/plugins/ dead files → tree-wide census.
 *  9. No updateURL/downloadURL filename verification → URL-drift detector
 *     (the class of bug where Gemini Answer Now updated INTO Blob2URL).
 * 10. No family/category classification → family tagging (media, links,
 *     images, forums, privacy, ux, sovereign).
 * 11. Dead code in display-name transform → deterministic naming.
 * 12. No CI mode → structured exit codes: 0 clean, 1 validation failure,
 *     2 structural failure.
 * ═══════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, "dist");
const README = path.join(ROOT, "README.md");

const META_KEYS = ["name", "version", "description", "author", "license", "namespace",
    "match", "include", "exclude", "grant", "require", "connect", "run-at",
    "noframes", "updateURL", "downloadURL", "supportURL", "icon"];

function parseMeta(src) {
    const m = src.match(/==UserScript==([\s\S]*?)==\/UserScript==/);
    if (!m) return null;
    const meta = {};
    for (const line of m[1].split("\n")) {
        const km = line.match(/^\s*\/\/\s*@(\S+)(?:\s+(.*))?$/);
        if (!km) continue;
        const [, key, value] = km;
        if (!META_KEYS.includes(key)) continue;
        meta[key] = meta[key] || [];
        if (value != null) meta[key].push(value.trim());
    }
    return meta;
}

const first = (meta, key) => (meta[key] && meta[key][0]) || null;

const FAMILIES = [
    [/linkmaster|m3u8|bunkr|pixeldrain|gofile|filester|blob2url|mega|stream\s*interceptor/i, "media & links"],
    [/images|yandex|googlephotos|brokenimg|hdimgs/i, "images"],
    [/youtube|yt |media\s*player|maximize|redgifs/i, "video & players"],
    [/forum|confirmation|modelsearch|planetsuzy/i, "forums"],
    [/akasha|anti|counter|purge|serviceguard|recon|bypass\s*paywalls/i, "privacy & security"],
    [/hostwarp|pagecraft|alwaysnew|selectall|autotranslate|searxng|telegram|gemini|infinitebrave|control panel|login form/i, "ux utilities"],
    [/prompt|watermark|hailuo|instagram|zai/i, "sovereign platforms"],
];

function familyOf(name) {
    for (const [re, fam] of FAMILIES) if (re.test(name)) return fam;
    return "uncategorized";
}

function domainOf(match) {
    /* WO-01 round-3 (3-d F1): the scheme strip now handles `*://` — the
     * ^\w+: form could not, so 206 host-specific patterns (BPP alone: 170
     * news domains) poured into the universal `*` bucket and the README's
     * Co-Install Interference Report printed `*: — 223` (meaningless),
     * listed 10 scripts as site-universal that have ZERO universal patterns,
     * missed 5 of 6 real collision domains, and counted a single-script
     * domain (hailuoai.video) as interference (patterns counted, not
     * scripts). Host-specific patterns now land on their real domains;
     * true universal patterns return "" and ride the star-family note. */
    return match.replace(/^\*:/, "").replace(/^\w+:/, "").replace(/^\/\//, "").split("/")[0].replace(/^\*\./, "").replace(/\*$/, "");
}

function inventory() {
    const files = fs.readdirSync(DIST, { withFileTypes: true })
        .filter((d) => d.isFile() && d.name.endsWith(".user.js"))
        .map((d) => d.name)
        /* WO-01 round-1 (2-b F-19): codepoint sort — localeCompare is
         * ICU-collation-dependent (filenames carry Ψ, m3u8 vs Maximize…),
         * so the same tree can generate different inventory bytes on
         * differently-built Node runtimes and fail the cross-machine
         * determinism gate. Codepoint order is byte-stable everywhere. */
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    const scripts = [];
    const problems = [];

    for (const file of files) {
        const full = path.join(DIST, file);
        const src = fs.readFileSync(full, "utf8");
        const meta = parseMeta(src);

        /* WO-01 round-1 (2-a F2): the !meta guard must run BEFORE the
         * name extraction — `first(null, …)` throws TypeError, so a dist
         * file without a metadata block crashed the whole inventory run
         * instead of failing cleanly with the documented problem line. */
        if (!meta) {
            problems.push(`${file}: no ==UserScript== metadata block`);
            continue;
        }
        const name = first(meta, "name") || file;

        /* Gap 2/5: version + required-field validation. */
        for (const key of ["name", "version", "description", "license", "author"]) {
            if (!meta[key] || !meta[key][0]) problems.push(`${file}: missing @${key}`);
        }

        /* Gap 9: URL-drift — update/download URLs must resolve to THIS file. */
        const enc = encodeURI(file).replace(/#/g, "%23");
        for (const key of ["updateURL", "downloadURL"]) {
            const url = first(meta, key);
            if (url && !url.endsWith(enc)) {
                problems.push(`${file}: @${key} does not point at its own dist file (…${url.slice(-48)})`);
            }
        }

        /* Gap 5b: grant consistency — scripts using canonical GM_* APIs
         * without granting them. Comment text is stripped first (changelog
         * prose mentioning GM_* must not trigger); GM_info is always
         * available and never requires a grant; local aliases that merely
         * START with GM_ but are not manager APIs are ignored.
         * v1.4.8: the kernel/net.js v5 gmFetch transport is injected into
         * every NetHook consumer, and its capability detection names the
         * bare manager identifiers WITHOUT the consumer granting them —
         * by design. Two per-OCCURRENCE detection shapes are sanctioned
         * (an identifier is whitelisted ONLY where the shape appears,
         * never blanket): (a) a typeof expression, and (b) the guarded
         * pickup idiom that immediately returns the identifier inside a
         * typeof-function guard — the dereference there executes only
         * when the grant exists, so an ungranted consumer can never
         * raise a ReferenceError. Any other occurrence is use and still
         * requires the grant. */
        const body = src.replace(/==UserScript==[\s\S]*?==\/UserScript==/, "")
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/\/\/[^\n]*/g, "");
        const CANONICAL_GM = new Set([
            "GM_xmlhttpRequest", "GM_download", "GM_addStyle", "GM_addElement",
            "GM_setClipboard", "GM_setValue", "GM_getValue", "GM_getValues",
            "GM_setValues", "GM_deleteValue", "GM_listValues", "GM_log",
            "GM_openInTab", "GM_registerMenuCommand", "GM_unregisterMenuCommand",
            "GM_addValueChangeListener", "GM_removeValueChangeListener",
            "GM_notification", "GM_closeCurrentTab", "GM_getTab",
        ]);
        /* strip the sanctioned detection shapes, per occurrence (idiom
         * first — the typeof strip would eat its guard text) */
        const bodyUses = body
            .replace(/\bif\s*\(\s*typeof\s+(GM_\w+)\s*===?\s*(['"])function\2\s*\)\s*return\s+\1\s*;/g, "")
            .replace(/\btypeof\s+GM_\w+\b/g, "");
        const gmUsed = new Set([...bodyUses.matchAll(/\b(GM_\w+)\b/g)].map((m) => m[1]));
        const gmGranted = new Set([...(meta.grant || [])]);
        for (const g of gmUsed) {
            if (!CANONICAL_GM.has(g)) continue;        // local alias, not an API
            if (g === "GM_info") continue;             // always granted implicitly
            if (!gmGranted.has(g)) {
                problems.push(`${file}: uses ${g}() without @grant`);
            }
        }

        scripts.push({
            file,
            name,
            version: first(meta, "version"),
            description: first(meta, "description"),
            family: (() => { const fam = familyOf(name); if (fam === "uncategorized") problems.push(`${file}: uncategorized script family for "${name}"`); return fam; })(),
            sha256: crypto.createHash("sha256").update(src).digest("hex"),
            lines: src.split("\n").length,
            bytes: Buffer.byteLength(src),
            matches: meta.match || [],
            excludes: meta.exclude || [],
            grants: meta.grant || [],
            requires: meta.require || [],
            connects: meta.connect || [],
            runAt: first(meta, "run-at"),
            noframes: Boolean(meta.noframes),
            urls: { update: first(meta, "updateURL"), download: first(meta, "downloadURL") },
        });
    }

    /* Gap 3: sibling-pair detection (any *BETA / *Ψ2 style forks left?). */
    const baseNames = new Set(scripts.map((s) => s.name.replace(/\s*BETA$|BETA$/i, "")));
    const pairs = [];
    for (const s of scripts) {
        const stripped = s.name.replace(/\s*BETA$|BETA$/i, "");
        if (stripped !== s.name && baseNames.has(stripped)) {
            pairs.push({ beta: s.name, stable: stripped });
        }
    }
    for (const p of pairs) problems.push(`sibling pair still installed: ${p.stable} + ${p.beta}`);

    /* Gap 4: @match collision matrix (co-install interference surface). */
    const domainMap = new Map();
    for (const s of scripts) {
        for (const m of s.matches) {
            const d = domainOf(m);
            if (!d || d === "") continue;
            if (!domainMap.has(d)) domainMap.set(d, []);
            domainMap.get(d).push(s.name);
        }
    }
    /* WO-01 round-3 (3-d F1): interference = more than one DISTINCT script
     * on the domain (the old form counted patterns, so a script with two
     * @match rules on one host read as its own interferer) and the count
     * is the distinct-script count. */
    const hotDomains = [...domainMap.entries()]
        .filter(([, v]) => new Set(v).size > 1)
        .map(([domain, scripts]) => ({ domain, count: new Set(scripts).size, scripts: [...new Set(scripts)] }))
        .sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));

    /* Suite v1.4.3: this object is byte-reproducible. The legacy
     * `generated: new Date().toISOString()` wall-clock field made every
     * `npm run check` rewrite inventory.json with a fresh timestamp —
     * kit base detection (content-hash, git-state agnostic) then failed
     * G1 with "content drift (not base, not applied)" after any
     * post-apply verification run (operator field report, v1.4.2).
     * The digest replaces the clock: a content-addressed fingerprint
     * of everything above, so drift is still detectable while
     * regeneration is deterministic (validate.mjs enforces byte parity). */
    /* WO-01 round-3 (3-d F1): the universal-pattern family — scripts whose
     * @match set includes a true every-site pattern (domainOf → ""), so the
     * interference report can name them instead of a polluted `*` bucket. */
    const starFamily = scripts
        .filter((s) => s.matches.some((m) => !domainOf(m)))
        .map((s) => s.name);
    const stable = { scripts, problems, pairs, hotDomains, starFamily };
    const digest = crypto.createHash("sha256").update(JSON.stringify(stable)).digest("hex");
    return { ...stable, digest };
}

function renderCatalog(inv) {
    const rows = inv.scripts.map((s) => {
        const display = s.name.replace(/^4ndr0tools\s*-\s*/i, "");
        const href = "./dist/" + encodeURI(s.file).replace(/#/g, "%23");
        return `| ${display} | v${s.version} | ${s.family} | [${s.file}](${href}) | ${s.description} |`;
    });
    return [
        "| Script | Version | Family | File | Summary |",
        "|---|---|---|---|---|",
        ...rows,
    ].join("\n");
}

function writeReadme(inv) {
    const tpl = `<!-- generated by tools/inventory.mjs — edit the template in tools/inventory.mjs, not this file -->
<div align="center">

# ☠️ 4ndr0666tools ☠️
### An Arsenal for Digital Sovereignty

> A consolidated suite of purpose-built userscripts designed to dismantle anti-user
> patterns, restore control, and reclaim your digital freedom.
> Crafted by [4ndr0666](https://github.com/4ndr0666).

</div>

---

## 🛠️ Installation

1.  Install a userscript manager ([Violentmonkey](https://violentmonkey.github.io/) or [Tampermonkey](https://www.tampermonkey.net/)).
2.  Open a script in [\`dist/\`](./dist) and click **Raw** — your manager will prompt to install.

Upgrading from the old repo? Follow the [**Migration Guide**](./docs/MIGRATION.md)
(uninstall-then-install per script — never run both). The full audit trail
(59 => ${inv.scripts.length} consolidation, superset verification, defect fixes) is in the
[**Consolidation Report**](./docs/CONSOLIDATION.md).

## 🏗️ Suite Architecture

This repository is a **build-time kernel suite**: shared modules (\`kernel/\`) are
inlined into self-contained installables. WO-01 round-1 (2-d F4): the runtime
\`@require\` surface is now derived from the live inventory — currently
${inv.scripts.filter((s) => (s.requires || []).length > 0).length} script(s) carry
external libraries (${inv.scripts.filter((s) => (s.requires || []).length > 0).map((s) => s.name).join(" · ")}),
every other installable is fully self-contained — single source of truth for
the 3lectric-Glass design system.

\`\`\`
kernel/    canonical shared modules (brand · core · glass · store · hotkeys · hosts · net) — every module inlined by at least one dist build (zero dead kernel surface; net is consumed via the canon CANON_KERNEL injection)
modules/   kernel-powered consolidated scripts (HostWarp, PageCraft)
canon/     consolidated & promoted sources + EVIDENCE.json (per-script transform evidence)
plugins/   companion plugins (MPV bridge; autopage.json = external-consumer data,
           fetched from the raw repo URL by out-of-repo autopagers — ledgered
           mode external-data) — candidshiny.user.js retired WO-01 round-1
           (orphaned: its only consumer was retired LinkMasterΨ2)
dist/      BUILT INSTALLABLES — install from here
docs/      consolidation report + migration guide
documentation/ per-script references (generated: npm run docs) + deep devlogs
           (bunkr · hailuo++ · m3u8++) + INDEX.md master catalog +
           _suite/FEATURE-MATRIX.md (§4.1 feature→function artifact)
tools/     build.mjs · inventory.mjs · validate.mjs · qr-verify.mjs · style-audit.mjs (npm run check)
           kernel-order.mjs (kernel assembly single source) · census-round.mjs (G9 round derivation)
           kernel-smoke.mjs (kernel unit smoke) · gen-docs.mjs (npm run docs)
           censuses — sink-census.mjs (HTML-string sink + net-tap census, adjudication ledger)
           · transport · connect · domain · hotkey · polling · observer · error · global ·
           cache · size-budget · canon-xref · production-score.mjs (+ score.json record)
           · kernel-export-census.mjs (export surface × consumer, bidirectional)
           · scan-kit.mjs (the shared lexical-balance + placeholder scanner behind build and validate)
           smoke batteries (npm run smoke) — family-fixture · watermark-batch ·
           kernel-boundary · flow-chip-browser · ig-wall-browser · pm-grid-browser
           (six runtime contract batteries, CI-wired since v1.7.4)
           instruments — tt-smoke.mjs (live Trusted-Types harness) · xref-adjudicate.mjs (flag triage)
           evidence chain — baseline.json · ledger.json
\`\`\`

\`npm run build\` → dist. \`npm run check\` → build + inventory + qr-verify + style-audit + full validation
(GUP superset contract, fail-closed). \`npm run smoke\` → the six runtime contract batteries.
CI runs all of these gates on every push, plus a regenerated-reference freshness gate
(stale committed artifacts fail the build).

## 🚀 Script Catalog

Per-script references — purpose, scope, features, verified keymap, settings,
OPSEC notes, lineage — live in [\`documentation/INDEX.md\`](./documentation/INDEX.md).

<!-- BEGIN_CATALOG -->
${renderCatalog(inv)}
<!-- END_CATALOG -->

## ⚠️ Co-Install Interference Report

Scripts that match the same domains (by design or by overlap). Consult before
bulk-installing the media family on the same pages:

${inv.hotDomains.slice(0, 12).map((d) => `- \`${d.domain}\` — ${d.count}: ${d.scripts.join(", ")}`).join("\n")}

${inv.starFamily.length ? `Universal-pattern scripts (match every site — they co-install with everything above): ${inv.starFamily.join(", ")}.` : ""}

---

<div align="center">

Ψ UNLICENSED - RED TEAM USE ONLY © 4ndr0666

</div>
`;
    fs.writeFileSync(README, tpl);
}

/* Exported for the determinism gate in tools/validate.mjs (byte-parity
 * between the file on disk and a fresh recomputation) and for gen-docs. */
export function serialize(inv) {
    return JSON.stringify(inv, null, 1);
}

function main() {
    if (!fs.existsSync(DIST)) {
        console.error("dist/ not built. Run `npm run build` first.");
        process.exit(2);
    }
    const inv = inventory();
    fs.writeFileSync(path.join(ROOT, "inventory.json"), serialize(inv));
    writeReadme(inv);

    console.log(`Inventory: ${inv.scripts.length} scripts, ${inv.scripts.reduce((n, s) => n + s.lines, 0)} lines`);
    console.log(`Families: ${[...new Set(inv.scripts.map((s) => s.family))].join(" · ")}`);
    console.log(`Co-install hot domains: ${inv.hotDomains.length}`);
    if (inv.problems.length === 0) {
        console.log("Validation: CLEAN (0 problems)");
        process.exit(0);
    }
    console.error(`Validation: ${inv.problems.length} PROBLEM(S):`);
    for (const p of inv.problems) console.error(`  ✗ ${p}`);
    process.exit(1);
}

/* Exported (determinism gate + docs generator). */
export { inventory as computeInventory };

/* CLI entry — only when executed directly, not when imported. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main();
}
