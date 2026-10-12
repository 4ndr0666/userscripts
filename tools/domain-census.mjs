#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/domain-census.mjs — co-install domain overlap census (suite v1.5.1)
 * ----------------------------------------------------------------------------
 * Round mandate (v1.5.0 verdict §2/G12, completed in v1.5.1): the Phase A
 * machine audit found hot @match domains (multi-script overlap) with no gate
 * measuring the co-install surface — the hotkey census governs keybinding
 * collisions, but nothing governs SAME-DOMAIN co-installation itself. This
 * census is that gate. (Precedent: tools/hotkey-census.mjs v1.4.1.)
 *
 * What it scans: every canon/<tier> .user.js header — @match AND @include
 * (glob and regex forms), normalized to domain keys:
 *   - protocol stripped, leading `*.` stripped, path dropped
 *   - star patterns (star-match-all globs) → the `*` key — the
 *     suite-wide utility surface, governed as one class
 *   - regex includes normalized to their literal domain family
 *
 * Fail-closed on:
 *   (a) a hot domain key (≥2 scripts) with no ledger entry;
 *   (b) a ledger entry whose script set drifted (member added or lost);
 *   (c) any NEW hot domain key — un-governed co-install overlap cannot be
 *       added silently.
 * The hotkey census remains the behavioral-collision gate (combos across
 * 19 scripts, 0 collisions); this census governs the match-surface overlap.
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CURRENT_ROUND = "v1.6.3";

/* ── Adjudication ledger: the sanctioned co-install map (drift-checked) ────
 * Each entry: the domain key + its EXACT script set + coordination argument.
 * A member change in either direction fails the census. */
const SANCTIONED_CO_INSTALL = [
    {
        domain: "*",
        scripts: [
            "4ndr0tools - Akasha Silence.user.js",
            "4ndr0tools - Images++.user.js",
            "4ndr0tools - LinkMasterΨ.user.js",
            "4ndr0tools - Blob2URL.user.js",
            "4ndr0tools - Confirmation Bypass.user.js",
            "4ndr0tools - Media Player Controller.user.js",
            "4ndr0tools - ModelSearch.user.js",
            "4ndr0tools - Stream Interceptor.user.js",
            "4ndr0tools - m3u8++.user.js",
            "4ndr0tools - 4ndr0purge.user.js",
            "4ndr0tools - 4ndr0serviceguard Companion.user.js",
            "4ndr0tools - AlwaysNewWindow.user.js",
            "4ndr0tools - AutoTranslate.user.js",
            "4ndr0tools - Maximize_Any_Media.user.js",
            "4ndr0tools - Login Form Autofiller.user.js",
            "4ndr0tools - Recon.user.js",
            "4ndr0tools - Website Control Panel.user.js",
            "4ndr0tools - HostWarp.user.js",
            "4ndr0tools - PageCraft.user.js",
        ],
        reason: "suite-wide utility surface: every member is a global utility (counter-surveillance defuse, media control, page hygiene, vault, recon, autofill...) whose activation on any given page is feature-gated in code rather than by match — the star match is the product decision (these tools follow the operator across the web). CB's bare @match is the goto-confirmation watcher: the bypass engine arms wherever a link-confirmation interstitial appears (documented v3.6.2) while its forum features stay host-gated. The hotkey census governs the behavioral collision class (68 combos, 19 scripts, 0 collisions); the sink census governs the injection surfaces",
        expiry: "v1.7.0",
    },
    {
        domain: "instagram.com",
        scripts: ["4ndr0tools - LinkMasterΨ.user.js", "4ndr0tools - Instagram++.user.js"],
        reason: "capture pipeline × feed augmenter: LMΨ harvests links/thumbnails for the ψ-suite, IG++ injects download badges on feed media — disjoint DOM surfaces, disjoint activation (capture panel vs automatic badges); hotkey census green",
        expiry: "v1.7.0",
    },
    {
        domain: "forums.socialmediagirls.com",
        scripts: ["4ndr0tools - Confirmation Bypass.user.js", "4ndr0tools - Forum Link Xtractor.user.js"],
        reason: "interaction bypass × link extraction: the sibling forum pair since v2.x — CB owns confirmation bypass/reply injection, FLX owns link harvest/export; disjoint features, hotkey census green",
        expiry: "v1.7.0",
    },
    {
        domain: "simpcity.cr",
        scripts: ["4ndr0tools - Confirmation Bypass.user.js", "4ndr0tools - Forum Link Xtractor.user.js", "4ndr0tools - Forums++.user.js"],
        reason: "the forum trio: CB (interaction bypass, whole forum), FLX (link extraction, whole forum), Forums++ (media embeds + bulk download, /threads paths only) — the documented co-install family; hotkey census green; sink census governs the injection surfaces",
        expiry: "v1.7.0",
    },
    {
        domain: "simpcity.su",
        scripts: ["4ndr0tools - Forum Link Xtractor.user.js", "4ndr0tools - Forums++.user.js"],
        reason: "the su-mirror of the simpcity.cr pair (FLX × Forums++) — same coordination argument, same disjoint surfaces",
        expiry: "v1.7.0",
    },
    {
        domain: "youtube.com",
        scripts: [
            "4ndr0tools - YT Filter.user.js",
            "4ndr0tools - YouTube Playlist Master.user.js",
            "4ndr0tools - Youtube Removed Video Revealer.user.js",
            "4ndr0tools - YouTubeEmbedRedirectButton.user.js",
        ],
        reason: "the YT quartet: YTF (feed/search filtering), YTPM (playlist panel), YTERB (removed-video revealer in search), YERB (embed redirect) — each owns a distinct page region; hotkey census governs keys (0 collisions across the 19-script registry); documented co-install family since v1.x",
        expiry: "v1.7.0",
    },
    {
        domain: "gemini.google.com",
        scripts: ["4ndr0tools - Prompt Master.user.js", "4ndr0tools - Watermark++.user.js"],
        reason: "prompt engine × watermark remover: PM owns the chat/prompt/flow UI, WM++ owns the generated-image overlay pipeline — disjoint DOM surfaces; both ride the shared kernel NetHook (single page-realm wrap, the singleton wiring gate)",
        expiry: "v1.7.0",
    },
];

/* ── normalization ────────────────────────────────────────────────────────── */

function domainKey(pattern) {
    const tok = pattern.trim();
    if (tok === "*") return "*";
    /* regex include: /^…$/ — take the literal domain family inside */
    if (/^\/.*\/$/.test(tok)) {
        const m = tok.match(/([A-Za-z0-9][A-Za-z0-9-]*(?:\.[A-Za-z0-9-]+)+)/);
        return m ? m[1].toLowerCase().replace(/\{[^}]*\}/g, "") : null;
    }
    /* glob includes that match all hosts (http://star, https://star, star globs) */
    if (/^(?:https?\*?|ftp):\/\/\*\/?\*?$/.test(tok)) return "*";
    if (/^\*:\/\/\*\/\*?$/.test(tok)) return "*";
    /* URL pattern: protocol://host/path */
    const m = tok.match(/^(?:[A-Za-z\*]+:)?\/\/([^/]+)/);
    if (m) {
        let host = m[1].toLowerCase();
        if (host === "*") return "*";
        host = host.replace(/^\*\./, "");
        host = host.replace(/:\d+$/, "");
        if (!host || host === "*") return "*";
        return host;
    }
    /* bare host include */
    const h = tok.match(/^([A-Za-z0-9.\*-]+)$/);
    if (h) {
        let host = h[1].toLowerCase();
        if (host === "*" || host.includes("*")) return host === "*" ? "*" : null;
        return host.replace(/^\*\./, "");
    }
    return null;
}

/* ── the census ──────────────────────────────────────────────────────────── */

export function runDomainCensus(root = DEFAULT_ROOT, opts = {}) {
    const problems = [];
    /* negative-proof mode: the co-install ledger is disabled — the gate must
     * fail wherever coordination is absent (v1.4.10 carried zero co-install
     * adjudication; the ledger is v1.5.1 work and lives in this tool). */
    const LEDGER = opts.noLedger ? [] : SANCTIONED_CO_INSTALL;
    const stats = { scripts: 0, domainKeys: 0, hotDomains: 0, starFamily: 0, ledgered: 0 };
    const seenLedger = new Set();
    const byDomain = new Map();

    const targets = [];
    const canonDir = path.join(root, "canon");
    if (fs.existsSync(canonDir)) {
        for (const tier of fs.readdirSync(canonDir).sort()) {
            const dir = path.join(canonDir, tier);
            if (!fs.statSync(dir).isDirectory()) continue;
            for (const f of fs.readdirSync(dir).sort()) {
                if (f.endsWith(".user.js")) targets.push([`canon/${tier}/${f}`, f]);
            }
        }
    }
    /* module-based installables (HostWarp, PageCraft): the match surface
     * lives in modules/<name>/meta.json — same census, same ledger */
    const modulesDir = path.join(root, "modules");
    const moduleTargets = [];
    if (fs.existsSync(modulesDir)) {
        for (const d of fs.readdirSync(modulesDir).sort()) {
            const meta = path.join(modulesDir, d, "meta.json");
            if (fs.existsSync(meta)) moduleTargets.push([meta, d]);
        }
    }

    for (const [rel, base] of targets) {
        const src = fs.readFileSync(path.join(root, rel), "utf8");
        const block = src.match(/==UserScript==([\s\S]*?)==\/UserScript==/);
        if (!block) continue;
        stats.scripts++;
        const keys = new Set();
        for (const m of block[1].matchAll(/@(?:match|include)\s+(\S+)(?=\s|$)/g)) {
            const k = domainKey(m[1]);
            if (k) keys.add(k);
        }
        for (const k of keys) {
            if (!byDomain.has(k)) byDomain.set(k, []);
            byDomain.get(k).push(base);
        }
    }
    for (const [metaPath, d] of moduleTargets) {
        try {
            const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
            if (!Array.isArray(meta.match) || !meta.match.length) continue;
            stats.scripts++;
            const keys = new Set();
            for (const pattern of meta.match) {
                const k = domainKey(String(pattern));
                if (k) keys.add(k);
            }
            for (const k of keys) {
                if (!byDomain.has(k)) byDomain.set(k, []);
                byDomain.get(k).push(meta.filename || `${d}.user.js`);
            }
        } catch (e) { /* malformed meta.json — the structural gates own that failure */ }
    }

    stats.domainKeys = byDomain.size;
    stats.starFamily = (byDomain.get("*") || []).length;

    /* hot domains: ≥2 scripts */
    const hot = [...byDomain.entries()].filter(([k, v]) => v.length >= 2);
    stats.hotDomains = hot.length;

    for (const [domain, scripts] of hot) {
        const entry = LEDGER.find((e) => e.domain === domain);
        if (!entry) {
            problems.push(`hot domain \`${domain}\` (${scripts.length} scripts: ${scripts.join(", ")}) has no co-install ledger entry (GUP G12: coordinate the pair or scope the match — un-governed co-install overlap)`);
            continue;
        }
        const sortedA = [...scripts].sort();
        const sortedB = [...entry.scripts].sort();
        if (JSON.stringify(sortedA) !== JSON.stringify(sortedB)) {
            const added = sortedA.filter((s) => !sortedB.includes(s));
            const lost = sortedB.filter((s) => !sortedA.includes(s));
            problems.push(`co-install drift on \`${domain}\`: ledger pins ${entry.scripts.length} scripts, machine count ${scripts.length}${added.length ? ` — NEW: ${added.join(", ")}` : ""}${lost.length ? ` — LOST: ${lost.join(", ")}` : ""} (update the ledger with the coordination argument)`);
            continue;
        }
        stats.ledgered++;
        seenLedger.add(domain);
    }

    /* ledger drift: entries whose domain is no longer hot, or expiry passed */
    for (const e of LEDGER) {
        if (!seenLedger.has(e.domain) && byDomain.has(e.domain)) {
            problems.push(`stale co-install ledger entry: ${e.domain} — still matched but no longer at the ledger's script set (see drift errors above)`);
        } else if (!seenLedger.has(e.domain) && !byDomain.has(e.domain)) {
            problems.push(`stale co-install ledger entry: ${e.domain} — the domain no longer exists in the match surface (remove the entry)`);
        }
        if (e.expiry && roundLt(CURRENT_ROUND, e.expiry) === false) {
            problems.push(`expired co-install ledger entry: ${e.domain} — expiry ${e.expiry} has passed round ${CURRENT_ROUND} without re-adjudication`);
        }
    }

    return { problems, ...stats };
}

/* v1.5.1 < v1.6.0 */
function roundLt(a, b) {
    const pa = a.replace(/^v/, "").split(".").map(Number);
    const pb = b.replace(/^v/, "").split(".").map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = pa[i] || 0, y = pb[i] || 0;
        if (x !== y) return x < y;
    }
    return false;
}

/* CLI: node tools/domain-census.mjs [root] */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const root = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_ROOT;
    const noLedger = process.argv.includes("--no-ledger");
    const r = runDomainCensus(root, { noLedger });
    console.log(`domain census: ${r.scripts} scripts, ${r.domainKeys} domain keys, ${r.starFamily}-script star family, ${r.hotDomains} hot domains (${r.ledgered} ledgered)${noLedger ? " [negative-proof mode: adjudication layer disabled]" : ""}`);
    if (r.problems.length) {
        for (const p of r.problems) console.log(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("  ✓ every hot domain is coordinated in the co-install ledger with drift-checked membership");
}
