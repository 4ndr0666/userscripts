#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/inventory.mjs — suite inventory & catalog generator (v2.0.0)
 * ----------------------------------------------------------------------------
 * Generates deterministic inventory.json and README.md from dist/ with full
 * metadata validation, URL-drift detection, @grant consistency enforcement,
 * and co-install domain interference reporting.
 *
 * Exit codes: 0 clean, 1 validation failure, 2 structural failure.
 * ═══════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { stripCommentsKeepStrings } from "./scan-kit.mjs";

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
    [/prompt|watermark|hailuo|instagram|zai|chatgpt/i, "sovereign platforms"],
];

function familyOf(name) {
    for (const [re, fam] of FAMILIES) if (re.test(name)) return fam;
    return "uncategorized";
}

function domainOf(match) {
    return match.replace(/^\*:/, "").replace(/^\w+:/, "").replace(/^\/\//, "").split("/")[0].replace(/^\*\./, "").replace(/\*$/, "");
}

function inventory() {
    const files = fs.readdirSync(DIST, { withFileTypes: true })
        .filter((d) => d.isFile() && d.name.endsWith(".user.js"))
        .map((d) => d.name)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    const scripts = [];
    const problems = [];

    for (const file of files) {
        const full = path.join(DIST, file);
        const src = fs.readFileSync(full, "utf8");
        const meta = parseMeta(src);

        if (!meta) {
            problems.push(`${file}: no ==UserScript== metadata block`);
            continue;
        }
        const name = first(meta, "name") || file;

        for (const key of ["name", "version", "description", "license", "author"]) {
            if (!meta[key] || !meta[key][0]) problems.push(`${file}: missing @${key}`);
        }

        const enc = encodeURI(file).replace(/#/g, "%23");
        for (const key of ["updateURL", "downloadURL"]) {
            const url = first(meta, key);
            if (url && !url.endsWith(enc)) {
                problems.push(`${file}: @${key} does not point at its own dist file (…${url.slice(-48)})`);
            }
        }

        const body = stripCommentsKeepStrings(src).replace(/==UserScript==[\s\S]*?==\/UserScript==/, "");
        const CANONICAL_GM = new Set([
            "GM_xmlhttpRequest", "GM_download", "GM_addStyle", "GM_addElement",
            "GM_setClipboard", "GM_setValue", "GM_getValue", "GM_getValues",
            "GM_setValues", "GM_deleteValue", "GM_listValues", "GM_log",
            "GM_openInTab", "GM_registerMenuCommand", "GM_unregisterMenuCommand",
            "GM_addValueChangeListener", "GM_removeValueChangeListener",
            "GM_notification", "GM_closeCurrentTab", "GM_getTab",
        ]);
        const bodyUses = body
            .replace(/\bif\s*\(\s*typeof\s+(GM_\w+)\s*===?\s*(['"])function\2\s*\)\s*return\s+\1\s*;/g, "")
            .replace(/\btypeof\s+GM_\w+\b/g, "");
        const gmUsed = new Set([...bodyUses.matchAll(/\b(GM_\w+)\b/g)].map((m) => m[1]));
        const gmGranted = new Set([...(meta.grant || [])]);
        for (const g of gmUsed) {
            if (!CANONICAL_GM.has(g)) continue;
            if (g === "GM_info") continue;
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
            includes: meta.include || [],
            excludes: meta.exclude || [],
            grants: meta.grant || [],
            requires: meta.require || [],
            connects: meta.connect || [],
            runAt: first(meta, "run-at"),
            noframes: Boolean(meta.noframes),
            urls: { update: first(meta, "updateURL"), download: first(meta, "downloadURL") },
        });
    }

    const baseNames = new Set(scripts.map((s) => s.name.replace(/\s*BETA$|BETA$/i, "")));
    const pairs = [];
    for (const s of scripts) {
        const stripped = s.name.replace(/\s*BETA$|BETA$/i, "");
        if (stripped !== s.name && baseNames.has(stripped)) {
            pairs.push({ beta: s.name, stable: stripped });
        }
    }
    for (const p of pairs) problems.push(`sibling pair still installed: ${p.stable} + ${p.beta}`);

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
        .filter(([, v]) => new Set(v).size > 1)
        .map(([domain, scripts]) => ({ domain, count: new Set(scripts).size, scripts: [...new Set(scripts)] }))
        .sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));

    const globInclude = (inc) => inc === "*" || /^https?:\/\/\*\/?$/.test(inc);
    const starFamily = scripts
        .filter((s) => s.matches.some((m) => !domainOf(m)) || (s.includes || []).some(globInclude))
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
    const reqScripts = inv.scripts.filter((s) => (s.requires || []).length > 0);
    // (R6-7) Derived, never hardcoded: the suite badge follows package.json,
    // the src/ topology is counted from the tree itself, and the contract
    // line follows contract.json. The template previously froze "36
    // single-file" and a "v2.0.0" badge — both went stale the moment
    // ChatGPT++ became the 37th single-file script and the package bumped
    // to 8.0.0, and the regenerated README silently re-emitted the lie.
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    const contract = JSON.parse(fs.readFileSync(path.join(ROOT, "contract.json"), "utf8"));
    const srcEntries = fs.readdirSync(path.join(ROOT, "src"), { withFileTypes: true });
    const singleFileCount = srcEntries.filter((d) => d.isFile() && d.name.endsWith(".user.js")).length;
    const modularDirs = srcEntries
        .filter((d) => d.isDirectory() && fs.existsSync(path.join(ROOT, "src", d.name, "meta.json")))
        .map((d) => d.name + "/");
    const modularLabel = modularDirs.length ? ` (${singleFileCount} single-file + ${modularDirs.join(" & ")})` : "";
    const tpl = `<!-- generated by tools/inventory.mjs — edit the template in tools/inventory.mjs, not this file -->
<div align="center">

# ☠️ 4ndr0666tools ☠️
### An Arsenal for Digital Sovereignty (v${pkg.version})

> A flat, single-source, 4ndr0neering-governed userscript suite designed to dismantle
> anti-user patterns, restore control, and reclaim your digital freedom.
> Crafted by [4ndr0666](https://github.com/4ndr0666).

</div>

---

## 🛠️ Installation

1. Install a userscript manager ([Violentmonkey](https://violentmonkey.github.io/) or [Tampermonkey](https://www.tampermonkey.net/)).
2. Open a script in [\`dist/\`](./dist) and click **Raw** — your manager will prompt to install.

## 🏗️ Suite Architecture (4ndr0neering contract v${contract.version})

This repository is a **build-time kernel suite**: shared modules (\`kernel/\`) are
inlined into self-contained installables. Currently ${reqScripts.length} script(s) carry
external \`@require\` libraries (${reqScripts.map((s) => s.name).join(" · ")});
every other installable is fully self-contained and follows the 3lectric-Glass design system.

\`\`\`text
kernel/       7 shared runtime modules (brand · core · glass · store · hotkeys · hosts · net)
src/          Flat source tree for all ${inv.scripts.length} scripts${modularLabel}
plugins/      Host companion utilities (bridge.py, autopage.json)
dist/         Built standalone installables (@updateURL / @downloadURL target)
scripts/      Unified 4ndr0neering Python toolchain (validate, align, converge, hash, perf, report)
tools/        Build, inventory, style-audit, qr-verify, hotkey-census, kernel-smoke, and browser smoke gates
tests/        Verification and delivery harnesses
contract.json Declarative 4ndr0neering acceptance contract (v${contract.version})
\`\`\`

\`npm run build\` → builds \`dist/\`. \`npm run check\` → runs build, inventory, V8 parse, metadata/URL checks,
OPSEC & 3lectric-Glass style audit, hotkey collision check, QR verification, and kernel/runtime validation
fail-closed. \`python3 scripts/4ndr0_validate.py --root . --convergence-contract contract.json --execute-checks --require-full-certification\`
executes the full declarative 4ndr0neering contract.

## 🚀 Script Catalog

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

Ψ MIT LICENSED © 4ndr0666

</div>
`;
    fs.writeFileSync(README, tpl);
}

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

export { inventory as computeInventory };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main();
}
