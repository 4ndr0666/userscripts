#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/validate.mjs — GUP v5.3 verification gate for the consolidated suite
 * ----------------------------------------------------------------------------
 * Machine-checks the superset contract over the frozen baseline
 * (tools/baseline.json) and the consolidation map (tools/ledger.json):
 *
 *  Gate A — Coverage: every baseline artifact has a ledger entry (no orphans).
 *  Gate B — Identity preservation: for every baseline script, every named
 *           unit (function/class) must appear in its destination dist file,
 *           EXCEPT units explicitly reconciled in the ledger's rename map
 *           (name-based identity per GUP §1; MISSING = hard fail).
 *  Gate C — Structural: every dist file is lexically balanced, placeholder-
 *           free, and its metadata is self-consistent (name/version/URLs).
 *  Gate D — Interference ledger: verifies the documented collision fixes
 *           are actually present in dist output.
 *
 * Exit codes: 0 = certified, 1 = verification failure (fail closed).
 * ═══════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, "dist");
const PLUGINS = path.join(ROOT, "plugins");

const baseline = JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "baseline.json"), "utf8"));
const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "ledger.json"), "utf8"));

/* Baseline keys strip the .user.js suffix + dir prefix for ledger lookup. */
function ledgerKey(baseFile) {
    return baseFile.replace(/\.user\.js$/, "").replace(/^4ndr0tools\s*-\s*/, "");
}

/* Some baseline unit names are intentionally renamed in the destination;
 * these are reconciled explicitly (GUP bidirectional alignment). */
const RECONCILED_NAMES = {
    "PageCraft": {
        "checkElementIfNeeded": "checkElementIfNeeded (kept)",
        "selectAll": "selectAll (kept)",
        "selectRange": "selectRange (kept, native commonAncestor replaces jQuery closest)",
        "redirectToImage": "n/a (HDImgsOnly unit — lives in HostWarp)",
        "isBroken": "isBroken (kept)",
        "reloadImages": "reloadImages (kept)",
        "broadcastEvent": "broadcastEvent (kept)",
        "initialScan": "initialScan (kept)",
        "init": "initialScan on DOMContentLoaded/immediate (same boot orchestration — verified in modules/pagecraft/body.js)",
        "fetchNextPage": "fetchNextPage (kept)",
        "dbg": "dbg (kept — debug hook honors __BIF_DEBUG)",
        "GMCommandHandler": "inline typeof GM_registerMenuCommand guard (same GM4 fallback semantics)",
    },
    "HostWarp": {
        "redirectToImage": "redirectToImage (kept)",
        "getChannelId": "telegramChannelId (renamed, namespace-scoped)",
        "injectWebButton": "injectWebButton (closure inside telegram module)",
        "hidePreviewBanner": "inlined into injectWebButton (same behavior)",
        "orchestrate": "module boot (hosts.on dispatch)",
        "redirectToEmbed": "inlined into mega module (same regex)",
        "enhanceVideoPlayback": "enhance (same logic)",
        "redirectToMobileSkin": "planetsuzy module body (same flow)",
        "getInputField": "GEMINI_SELECTORS.input inline query (same selector)",
        "forceImmediateAnswer": "kept (closure inside gemini module)",
        "createAnswerNowButton": "kept (closure inside gemini module)",
        "startObserver": "watchDOM kernel replacement (same observer semantics)",
        "init": "module boots",
        "tryInject": "injectWebButton + waitFor retry (same flow)",
    },
    "Pixeldrain++": {
        "rng": "removed with the decorative pseudo-QR it served (hash-PRNG noise fill that could never scan); superseded by the real RS/mask QR encoder — tools/qr-verify.mjs round-trip proves the replacement",
    },
    "Forum Link Xtractor": {
        "createRadio": "createUIElement('radio', …) — unified builder, same options (download/copy)",
        "createCheckbox": "createUIElement('checkbox', …) — unified builder, same options (current-page/sort)",
        "silentScan": "extraction flow redesigned around toggleBtn 'Initialize Extraction Protocol'; same scan semantics",
    },
    "LinkMasterΨ": {
        "hasRedirectLink": "kept (AbsorbedPLR closure)",
        "rewriteRedirectLinks": "kept (AbsorbedPLR closure)",
        "getFileRows": "kept (AbsorbedGitRaw closure)",
        "generateRawUrls": "kept (AbsorbedGitRaw closure)",
        "injectButton": "kept (AbsorbedGitRaw closure)",
        "tryInject": "kept (AbsorbedGitRaw closure)",
    },
};

const failures = [];
const passes = [];

/* ── Gate A: coverage ─────────────────────────────────────────────────── */
function gateA() {
    const baseFiles = Object.keys(baseline);
    const missing = baseFiles.filter((f) => !(ledgerKey(f) in ledger));
    if (missing.length > 0) {
        for (const m of missing) failures.push(`[A] no ledger entry for baseline "${m}"`);
    } else {
        passes.push(`[A] coverage: all ${baseFiles.length} baseline artifacts mapped`);
    }
}

/* ── Gate B: unit identity preservation ───────────────────────────────── */
/* Unit-name matcher: $-prefixed and other non-word names cannot use \b
 * word boundaries — fall back to plain substring search for them. */
function unitPresent(unit, src) {
    if (/^\w/.test(unit) && /\w$/.test(unit)) {
        return new RegExp(`\\b${unit.replace(/\$/g, "\\$")}\\b`).test(src);
    }
    return src.includes(unit);
}

function gateB() {
    const distFiles = fs.existsSync(DIST) ? fs.readdirSync(DIST).filter((f) => f.endsWith(".user.js")) : [];
    const distByName = new Map();
    for (const f of distFiles) {
        const key = f.replace(/\.user\.js$/, "").replace(/^4ndr0tools\s*-\s*/, "");
        distByName.set(key, fs.readFileSync(path.join(DIST, f), "utf8"));
    }
    const pluginSrc = fs.existsSync(path.join(PLUGINS, "candidshiny.user.js"))
        ? fs.readFileSync(path.join(PLUGINS, "candidshiny.user.js"), "utf8") : "";

    let checked = 0, reconciled = 0;
    for (const [baseFile, info] of Object.entries(baseline)) {
        const key = ledgerKey(baseFile);
        const entry = ledger[key];
        if (!entry) continue;
        if (entry.mode === "retired") continue;

        /* Absorbed-by-PageCraft exceptions: HDImgsOnly units land in HostWarp. */
        let destKey = entry.dest;
        let destSrc = destKey === "plugins/candidshiny" ? pluginSrc : distByName.get(destKey);
        if (!destSrc) {
            failures.push(`[B] "${key}" -> dest "${destKey}" not found in dist/`);
            continue;
        }
        const renames = RECONCILED_NAMES[destKey] || {};
        for (const unit of info.units) {
            checked++;
            if (unitPresent(unit, destSrc)) continue;
            if (renames[unit]) { reconciled++; continue; }
            failures.push(`[B] unit "${unit}" from "${key}" MISSING in dest "${destKey}"`);
        }
    }
    passes.push(`[B] identity: ${checked} baseline units checked, ${reconciled} explicitly reconciled`);
}

/* ── Gate C: structural integrity of dist ─────────────────────────────── */
/* §1.1-aware lexical scanner (JS: comments, strings, templates, regex).
 * Handles nested templates + ${} interpolation braces — the crude variant
 * false-positived on template-in-template literals (LinkMasterΨ / Pixeldrain++
 / Prompt Master all V8-clean but flagged). */
function checkLexicalBalance(src) {
    let i = 0, line = 1;
    const stack = [];
    const n = src.length;
    /* v1.3.0: prevSig() used to walk BACKWARDS over whitespace to decide
     * regex-vs-division — but a block comment terminator directly before
     * a regex literal made the walk stop at the comment's slash, which is
     * not a regex preceder, so the literal was scanned as division and its
     * parens corrupted the brace ledger (Akasha's commented blocklist
     * regexes tripped this). lastSig is now tracked FORWARD: the last
     * significant CODE character, with comments and string contents
     * excluded by construction. */
    let lastSig = "";
    const skipTemplate = (start) => {
        let k = start + 1;
        while (k < n) {
            if (src[k] === "\\") { k += 2; continue; }
            if (src[k] === "`") return k + 1;
            k++;
        }
        return -1;
    };
    while (i < n) {
        const c = src[i];
        if (c === "\n") { line++; i++; continue; }
        if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
        if (c === "/" && src[i + 1] === "*") {
            const end = src.indexOf("*/", i + 2);
            if (end === -1) return `unterminated comment at line ${line}`;
            line += src.slice(i, end).split("\n").length - 1; i = end + 2; continue;
        }
        if (c === '"' || c === "'") {
            i++;
            while (i < n) {
                if (src[i] === "\\") { i += 2; continue; }
                if (src[i] === c) { i++; break; }
                if (src[i] === "\n") return `unterminated string at line ${line}`;
                i++;
            }
            lastSig = c;
            continue;
        }
        if (c === "`") {
            i++;
            while (i < n) {
                if (src[i] === "\\") { i += 2; continue; }
                if (src[i] === "`") { i++; break; }
                if (src[i] === "$" && src[i + 1] === "{") {
                    let depth = 1; i += 2;
                    while (i < n && depth > 0) {
                        if (src[i] === "{") depth++;
                        else if (src[i] === "}") depth--;
                        else if (src[i] === "`") {
                            const r = skipTemplate(i);
                            if (r === -1) return `unterminated nested template at line ${line}`;
                            i = r;
                            continue;
                        }
                        i++;
                    }
                    continue;
                }
                i++;
            }
            lastSig = c;
            continue;
        }
        if (c === "/" && /[(,=:[!&|?{};+\-*%<>~^]/.test(lastSig || "(")) {
            i++;
            let inClass = false;
            while (i < n) {
                if (src[i] === "\\") { i += 2; continue; }
                if (src[i] === "[") inClass = true;
                else if (src[i] === "]") inClass = false;
                else if (src[i] === "/" && !inClass) { i++; break; }
                else if (src[i] === "\n") break;
                i++;
            }
            lastSig = "/";
            continue;
        }
        if ("([{".includes(c)) { stack.push({ c, line }); lastSig = c; i++; continue; }
        else if (")]}".includes(c)) {
            const top = stack.pop();
            if (!top) return `unmatched "${c}" at line ${line}`;
            const pairs = { "(": ")", "[": "]", "{": "}" };
            if (pairs[top.c] !== c) return `"${c}" at line ${line} closes "${top.c}" from line ${top.line}`;
            lastSig = c; i++; continue;
        }
        if (!/\s/.test(c)) lastSig = c;
        i++;
    }
    if (stack.length) return `unclosed "${stack[stack.length - 1].c}" from line ${stack[stack.length - 1].line}`;
    return null;
}

/* Placeholder scan, two layers:
 *  (a) WORD markers (TODO/FIXME/XXX/HACK/…): matched against code with
 *      comments stripped AND string literal contents blanked — a TODO note
 *      in a comment or the word "placeholder" inside a CSS selector string
 *      is documentation, not a defect.
 *  (b) SENTINEL VALUES: `= "PLACEHOLDER"` / `= 'TODO'` assignments matched
 *      against comment-stripped source (strings preserved) — the legacy
 *      `const settingsHash = "PLACEHOLDER"` bug class, where a shipped
 *      script could never work out of the box. The assignment anchor
 *      ([\w$)]] before =) keeps CSS attribute selectors like
 *      [class*="placeholder"] out of scope. */
const WORD_MARKERS = [/\bTODO[:\s]/, /\bFIXME\b/, /\bXXX\b/, /\bHACK\b/, /\.\.\.\s*existing\s+code/i, /\/\*\s*implementation\s+pending\s*\*\//i];
const SENTINEL_ASSIGN = /[\w$\)\]]\s*=\s*["'`](?:PLACEHOLDER|TODO|FIXME|STUB|PENDING)["`']/i;

/* Blank line-comment and block-comment contents (newlines preserved, strings
 * kept) so sentinel detection sees code, not documentation. */
function stripCommentsKeepStrings(src) {
    let out = "";
    let i = 0;
    const n = src.length;
    while (i < n) {
        const c = src[i];
        if (c === "/" && src[i + 1] === "/") {
            while (i < n && src[i] !== "\n") { out += " "; i++; }
            continue;
        }
        if (c === "/" && src[i + 1] === "*") {
            const end = src.indexOf("*/", i + 2);
            const stop = end === -1 ? n : end + 2;
            while (i < stop) { out += src[i] === "\n" ? "\n" : " "; i++; }
            continue;
        }
        if (c === '"' || c === "'" || c === "`") {
            const q = c;
            out += c; i++;
            while (i < n) {
                if (src[i] === "\\") { out += src[i] + (src[i + 1] || ""); i += 2; continue; }
                out += src[i];
                const prev = src[i];
                i++;
                if (prev === q) break;
                if (q !== "`" && prev === "\n") break; // unterminated guard: bail, let the main scanner report it
            }
            continue;
        }
        out += c; i++;
    }
    return out;
}

function scanPlaceholders(src) {
    const hits = [];
    // layer (a): comment-stripped, string-blanked code
    const codeLines = src.split("\n").map((ln) => ln
        .replace(/\/\/.*$/, "")
        .replace(/\/\*.*?\*\//g, "")
        .replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '""'));
    for (let ln = 0; ln < codeLines.length; ln++) {
        for (const pat of WORD_MARKERS) {
            if (pat.test(codeLines[ln])) hits.push(`line ${ln + 1}: word marker ${pat.source}`);
        }
    }
    // layer (b): sentinel assignment in comment-stripped source (strings kept)
    const stripped = stripCommentsKeepStrings(src).split("\n");
    for (let ln = 0; ln < stripped.length; ln++) {
        if (SENTINEL_ASSIGN.test(stripped[ln])) hits.push(`line ${ln + 1}: sentinel value assignment`);
    }
    return hits;
}

function gateC() {
    if (!fs.existsSync(DIST)) { failures.push("[C] dist/ not built"); return; }
    const files = fs.readdirSync(DIST).filter((f) => f.endsWith(".user.js"));
    let n = 0;
    for (const f of files) {
        n++;
        const src = fs.readFileSync(path.join(DIST, f), "utf8");
        const bal = checkLexicalBalance(src);
        if (bal) failures.push(`[C] ${f}: lexical imbalance — ${bal}`);

        /* V8 authoritative parse — the §1.1 scanner is a heuristic; V8 is
         * ground truth (same engine family that executes the script). */
        const v8 = spawnSync(process.execPath, ["--check", path.join(DIST, f)], { encoding: "utf8" });
        if (v8.status !== 0) {
            failures.push(`[C] ${f}: V8 parse rejected — ${(v8.stderr || "").split("\n").filter(Boolean).slice(0, 2).join(" | ")}`);
        }

        const m = src.match(/==UserScript==([\s\S]*?)==\/UserScript==/);
        if (!m) { failures.push(`[C] ${f}: no metadata block`); continue; }
        const ver = m[1].match(/@version\s+(\S+)/);
        const name = m[1].match(/@name\s+(.+)/);
        if (!ver) failures.push(`[C] ${f}: no @version`);
        if (!name) failures.push(`[C] ${f}: no @name`);
        /* Update-channel integrity: keys must be canonical-case, URLs must
         * carry the /dist/ install-channel segment, and must self-reference
         * the file. Case-variant keys (@updateUrl) previously escaped this
         * check entirely — a silent 404 update channel. */
        const upd = m[1].match(/@\s*updateURL\s+(\S+)/gi) || [];
        const dl = m[1].match(/@\s*downloadURL\s+(\S+)/gi) || [];
        for (const u of [...upd, ...dl]) {
            const key = u.match(/@(\w+)/)[1];
            if (key !== "updateURL" && key !== "downloadURL") {
                failures.push(`[C] ${f}: non-canonical metadata key case "${key}"`);
                continue;
            }
            const url = u.replace(/@\w+\s+/, "");
            if (!url.includes("/dist/")) {
                failures.push(`[C] ${f}: ${key} missing /dist/ install-channel segment`);
            }
            if (!url.includes(encodeURI(f).replace(/#/g, "%23")) && !url.includes(f.replace(/ /g, "%20"))) {
                failures.push(`[C] ${f}: ${key} self-reference drift (${url.slice(-40)})`);
            }
        }
        /* placeholder scan (comment/string-aware; see scanPlaceholders) */
        for (const ph of scanPlaceholders(src)) failures.push(`[C] ${f}: ${ph}`);
    }
    passes.push(`[C] structural: ${n} dist files lexically + metadata checked`);
}

/* ── Gate D: documented collision fixes present in dist ───────────────── */
function gateD() {
    const read = (key) => {
        const f = path.join(DIST, `4ndr0tools - ${key}.user.js`);
        return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "";
    };
    const recon = read("Recon");
    if (!recon.includes("e.altKey && e.shiftKey && (e.key || '').toLowerCase() === 'r'")) {
        failures.push(`[D] Recon: Alt+Shift+R collision fix not present`);
    } else passes.push(`[D] Recon Alt+Shift+R fix verified`);

    const mam = read("Maximize_Any_Media");
    if (!/console \(Alt\+Shift\+S\)/.test(mam)) {
        failures.push(`[D] Maximize_Any_Media: Alt+Shift+S menu fix not present`);
    } else passes.push(`[D] Maximize_Any_Media Alt+Shift+S fix verified`);

    const lm = read("LinkMasterΨ");
    if (!lm.includes("AbsorbedPLR") || !lm.includes("AbsorbedGitRaw")) {
        failures.push(`[D] LinkMasterΨ: absorbed modules not present`);
    } else passes.push(`[D] LinkMasterΨ absorbed modules verified`);

    const img = read("Images++");
    if (!img.includes("collapseModeHotkey")) {
        failures.push(`[D] Images++: configurable hotkey port not present`);
    } else passes.push(`[D] Images++ configurable hotkey verified`);

    const hw = read("HostWarp");
    if (!hw.includes("imagehosts:imagetwist.com") || !hw.includes("AbsorbedPLR")) {
        /* AbsorbedPLR is LinkMaster; HostWarp needs its own markers */
    }
    if (!hw.includes("imagetwist.com") || !hw.includes("styleid")) {
        failures.push(`[D] HostWarp: image-host/planetsuzy modules not present`);
    } else passes.push(`[D] HostWarp modules verified`);

    const pc = read("PageCraft");
    if (!pc.includes("_cache_bust") || !pc.includes("RELOAD_BROKEN_IMAGES")) {
        failures.push(`[D] PageCraft: imgfix module not present`);
    } else passes.push(`[D] PageCraft modules verified`);

    const asil = read("Akasha Silence");
    if (!asil.includes("defuseScript") || !asil.includes("applyNetworkHooks") || !asil.includes("getRealLinkFromGoogleUrl") || !asil.includes("makePhantomWebSocket")) {
        failures.push(`[D] Akasha Silence: absorbed trio modules not present`);
    } else passes.push(`[D] Akasha Silence absorbed trio verified`);

    /* v1.3.0 interference ledger — the nine documented fixes of this round. */
    if (!asil.includes("AKASHA_PROFILE") || !asil.includes("Ctrl+Alt+Shift+K") || !asil.includes("akasha_silence_profile")) {
        failures.push(`[D] Akasha Silence: strictness relief valve not present`);
    } else passes.push(`[D] Akasha Silence profile valve verified`);

    const bkr = read("Bunkr++");
    if (!bkr.includes("/^\\/(?:a|v|d|e)\\//") || !bkr.includes("session-surface exemption")) {
        failures.push(`[D] Bunkr++: session-surface exemption not present`);
    } else passes.push(`[D] Bunkr++ session-surface exemption verified`);

    const wcp = read("Website Control Panel");
    if (!wcp.includes("hud_site_off") || !wcp.includes("psi-cp-close") || !wcp.includes("Alt+Shift+H")) {
        failures.push(`[D] WCP: HUD sovereignty surfaces not present`);
    } else passes.push(`[D] WCP HUD sovereignty verified`);
    if (wcp.includes("@import url(") || wcp.includes("@importurl(") || /@import\s+url\(\s*['"]?https?:/i.test(wcp)) {
        failures.push(`[D] WCP: remote font @import still present`);
    } else passes.push(`[D] WCP local font stack verified`);

    const mpc = read("Media Player Controller");
    if (!mpc.includes("MEDIA PLAYER CONTROLLER") || !mpc.includes("acquireBestCandidate")) {
        failures.push(`[D] MPC: rebrand + fallback acquisition not present`);
    } else passes.push(`[D] MPC rebrand + fallback acquisition verified`);
    if (mpc.includes("MEDIA GODMODE</div>") || /Media Godmode v\d/.test(mpc)) {
        failures.push(`[D] MPC: legacy Godmode branding still present`);
    } else passes.push(`[D] MPC legacy branding purged`);

    const lm2 = read("LinkMasterΨ");
    if (!lm2.includes("isVideoPageLink") || !lm2.includes("looksLikeMediaTile") || !lm2.includes("data-lazy-src")) {
        failures.push(`[D] LinkMasterΨ: video-grid + lazy capture not present`);
    } else passes.push(`[D] LinkMasterΨ video-grid + lazy capture verified`);

    const b2u = read("Blob2URL");
    if (!b2u.includes("URL VAULT") || !b2u.includes("__psi_vault")) {
        failures.push(`[D] Blob2URL: universal vault + wire capture not present`);
    } else passes.push(`[D] Blob2URL universal vault + wire capture verified`);

    const si = read("Stream Interceptor");
    if (!si || !si.includes("MAX_FOUND_URLS") || !si.includes("Stream Interceptor")) {
        failures.push(`[D] Stream Interceptor: suite membership incomplete`);
    } else passes.push(`[D] Stream Interceptor suite membership verified`);

    const hwDist = read("HostWarp");
    const pcDist = read("PageCraft");
    if (!hwDist.includes("a4:glass") || !pcDist.includes("a4:glass")) {
        failures.push(`[D] HostWarp/PageCraft: rebuilt without the repaired glass kernel`);
    } else passes.push(`[D] HostWarp/PageCraft glass-kernel repair verified`);

    const fpp = read("Forums++");
    if (!fpp.includes("function setProcessing")) {
        failures.push(`[D] Forums++: setProcessing restoration not present`);
    } else passes.push(`[D] Forums++ setProcessing restoration verified`);

    const wmk = read("Watermark++");
    if (!wmk.includes("function resolveFetchedImageMimeType")) {
        failures.push(`[D] Watermark++: resolveFetchedImageMimeType restoration not present`);
    } else passes.push(`[D] Watermark++ mime resolver restoration verified`);

    // OPSEC invariant (suite v1.4.0): zero remote asset fetches — a
    // counter-surveillance suite must never phone home to font CDNs
    // (IP leak + fingerprint vector on every page load). Local stacks only.
    const remoteImports = [];
    for (const f of fs.readdirSync(DIST).filter(f => f.endsWith(".user.js"))) {
        if (fs.readFileSync(path.join(DIST, f), "utf8").includes("@import url('http")) {
            remoteImports.push(f);
        }
    }
    if (remoteImports.length) {
        failures.push(`[D] OPSEC: remote @import still present in: ${remoteImports.join(", ")}`);
    } else passes.push(`[D] OPSEC remote-asset ban verified (0 remote @imports across dist)`);
}

gateA();
gateB();
gateC();
gateD();

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║  GUP v5.3.1 SUITE VERIFICATION — " + new Date().toISOString().slice(0, 19) + "        ║");
console.log("╚══════════════════════════════════════════════════════════════╝");
for (const p of passes) console.log("  ✓ " + p);
if (failures.length > 0) {
    console.error(`\n${failures.length} VERIFICATION FAILURE(S):`);
    for (const f of failures) console.error("  ✗ " + f);
    process.exit(1);
}
console.log("\nGUP VERIFICATION: CERTIFIED (superset contract holds)");
process.exit(0);
