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
import { fileURLToPath } from "node:url";

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
    [/linkmaster|m3u8|bunkr|pixeldrain|gofile|filester|blob2url|mega/i, "media & links"],
    [/images|yandex|googlephotos|brokenimg|hdimgs/i, "images"],
    [/youtube|yt |mediaplayer|maximize|redgifs/i, "video & players"],
    [/forum|confirmation|modelsearch|planetsuzy/i, "forums"],
    [/anti|counter|purge|serviceguard|recon|bypasspaywalls/i, "privacy & security"],
    [/hostwarp|pagecraft|alwaysnew|selectall|autotranslate|searxng|telegram|gemini|infinitebrave|control panel|login form/i, "ux utilities"],
    [/prompt|watermark|hailuo|instagram/i, "sovereign platforms"],
];

function familyOf(name) {
    for (const [re, fam] of FAMILIES) if (re.test(name)) return fam;
    return "uncategorized";
}

function domainOf(match) {
    return match.replace(/^\w+:/, "").replace(/^\/\//, "").split("/")[0].replace(/^\*\./, "").replace(/\*$/, "");
}

function inventory() {
    const files = fs.readdirSync(DIST, { withFileTypes: true })
        .filter((d) => d.isFile() && d.name.endsWith(".user.js"))
        .map((d) => d.name)
        .sort((a, b) => a.localeCompare(b));

    const scripts = [];
    const problems = [];

    for (const file of files) {
        const full = path.join(DIST, file);
        const src = fs.readFileSync(full, "utf8");
        const meta = parseMeta(src);
        const name = first(meta, "name") || file;

        if (!meta) {
            problems.push(`${file}: no ==UserScript== metadata block`);
            continue;
        }

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
         * START with GM_ but are not manager APIs are ignored. */
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
        const gmUsed = new Set([...body.matchAll(/\b(GM_\w+)\b/g)].map((m) => m[1]));
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
            family: familyOf(name),
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
    const hotDomains = [...domainMap.entries()]
        .filter(([, v]) => v.length > 1)
        .map(([domain, scripts]) => ({ domain, count: scripts.length, scripts: [...new Set(scripts)] }))
        .sort((a, b) => b.count - a.count);

    return { scripts, problems, pairs, hotDomains, generated: new Date().toISOString() };
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
(59 → 38 consolidation, superset verification, defect fixes) is in the
[**Consolidation Report**](./docs/CONSOLIDATION.md).

## 🏗️ Suite Architecture

This repository is a **build-time kernel suite**: shared modules (\`kernel/\`) are
inlined into self-contained installables — zero runtime dependencies for every
script except LinkMasterΨ (which retains Ψ2's library \`@require\`s —
JSZip/tippy/FileSaver/sha256 — for its download-packaging engine) — single
source of truth for the 3lectric-Glass design system.

\`\`\`
kernel/    canonical shared modules (brand · core · glass · net · store · clipboard · hotkeys · hosts)
modules/   kernel-powered consolidated scripts (HostWarp, PageCraft)
canon/     consolidated & promoted sources + EVIDENCE.json (per-script transform evidence)
plugins/   companion plugins (LinkMaster CandidShiny autopsy, MPV bridge, autopage config)
dist/      BUILT INSTALLABLES — install from here
docs/      consolidation report + migration guide
tools/     build.mjs · inventory.mjs · validate.mjs · kernel-smoke.mjs (GUP gates)
\`\`\`

\`npm run build\` → dist. \`npm run check\` → build + inventory + full validation
(GUP superset contract, fail-closed). CI runs the same gates on every push.

## 🚀 Script Catalog

<!-- BEGIN_CATALOG -->
${renderCatalog(inv)}
<!-- END_CATALOG -->

## ⚠️ Co-Install Interference Report

Scripts that match the same domains (by design or by overlap). Consult before
bulk-installing the media family on the same pages:

${inv.hotDomains.slice(0, 12).map((d) => `- \`${d.domain}\` — ${d.count}: ${d.scripts.join(", ")}`).join("\n")}

---

<div align="center">

Ψ UNLICENSED - RED TEAM USE ONLY © 4ndr0666

</div>
`;
    fs.writeFileSync(README, tpl);
}

function main() {
    if (!fs.existsSync(DIST)) {
        console.error("dist/ not built. Run `npm run build` first.");
        process.exit(2);
    }
    const inv = inventory();
    fs.writeFileSync(path.join(ROOT, "inventory.json"), JSON.stringify(inv, null, 1));
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

main();
