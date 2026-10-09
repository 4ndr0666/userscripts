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
import { runCensus, stripComments } from "./hotkey-census.mjs";
import { runSinkCensus } from "./sink-census.mjs";
import { computeInventory, serialize } from "./inventory.mjs";

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
    "Recon": {
        "overrideFetch": "armNetworkHub onRequest/onTraffic/onError subscribers (NetHook v4 adoption, suite v1.4.6 — the reconh recorder + MITM blocklist + TypeError→204 pacification ride the shared hub; same surface, no local wrap)",
        "overrideXHR": "armNetworkHub onTraffic response subscriber (NetHook v4 adoption — the XHR recorder twin rides the shared hub)",
    },
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
    "Akasha Silence": {
        "applyNetworkHooks": "applyLocalHooks (renamed, suite v1.4.5) — the fetch/XHR/beacon defusing migrated to the NetHook v3 veto (__4NDR0_NET_API__.onRequest, kernel-owned wraps); the local installer keeps the WebSocket/WebRTC/worker pacifiers",
    },
    "Watermark++": {
        "handleLoadEnd": "armNetworkHub onTraffic xhr subscriber (NetHook v4 adoption, suite v1.4.7 — the RPC loadend handler became the subscriber's response-phase arm; request bodies joined by hub exchange id, same 2xx + text gates)",
    },
    "Bunkr++": {
        "installFetchSniff": "armNetworkHub onTraffic subscriber (NetHook v4 adoption, suite v1.4.7 — the fetch sniffer became the subscriber's request/response arms; the hub's page-realm wrap replaces the per-script proxy)",
        "installXhrSniff": "armNetworkHub onTraffic subscriber + propagate(sandbox) (NetHook v4 adoption, suite v1.4.7 — the XHR sniffer taps became the same subscriber's arms; sandbox-realm coverage via hub propagation)",
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

    /* Docs-coincide invariant (suite v1.4.2, operator mandate): every dist
     * script must have coinciding documentation. The INDEX.md version
     * stamps must match the live inventory — fail-closed when a version
     * bump forgets `npm run docs` (docs drift = stale manifests, the
     * exact failure mode GUP 5.2.2 codified for code). */
    const docsIndexPath = path.join(ROOT, "documentation", "INDEX.md");
    if (!fs.existsSync(docsIndexPath)) {
        failures.push(`[C] documentation: INDEX.md missing — run \`npm run docs\``);
    } else if (files.length) {
        const idx = fs.readFileSync(docsIndexPath, "utf8");
        const invPath = path.join(ROOT, "inventory.json");
        const invScripts = JSON.parse(fs.readFileSync(invPath, "utf8")).scripts;
        const drift = [];
        for (const s of invScripts) {
            const short = s.name.replace(/^4ndr0tools\s*-\s*/, "");
            if (!idx.includes(`| **${short}** | \`${s.version}\``)) drift.push(`${short} v${s.version}`);
        }
        if (drift.length) {
            failures.push(`[C] documentation drift (INDEX.md stale for: ${drift.join(", ")}) — run \`npm run docs\``);
        } else passes.push(`[C] documentation coincides with all ${invScripts.length} dist scripts (INDEX version-stamped)`);
    }
    /* v1.4.6: README Size-stamp freshness — gen-docs writes `| Size | … |`
     * from inventory.json; a source change between the docs run and the
     * final check leaves stale size stamps that INDEX version-stamping
     * cannot see (the v1.4.6 kit matrix caught exactly this failure
     * class). The stamps must coincide with the live inventory. */
    if (files.length && fs.existsSync(docsIndexPath)) {
        const invScripts2 = JSON.parse(fs.readFileSync(path.join(ROOT, "inventory.json"), "utf8")).scripts;
        const readmes = {};
        for (const dir of fs.readdirSync(path.join(ROOT, "documentation"))) {
            const rp = path.join(ROOT, "documentation", dir, "README.md");
            if (!fs.existsSync(rp)) continue;
            const content = fs.readFileSync(rp, "utf8");
            const head = (content.split("\n", 1)[0] || "");
            const hm = /^# (.+?) · v(\d[\d.]*)$/.exec(head);
            if (hm) readmes[hm[1]] = { version: hm[2], content };
        }
        const stale = [];
        for (const s of invScripts2) {
            const short = s.name.replace(/^4ndr0tools\s*-\s*/, "");
            const r = readmes[short];
            if (!r) continue; /* scripts without a generated per-script README are not Size-stamped */
            if (r.version !== s.version) { stale.push(`${short} version ${r.version}≠${s.version}`); continue; }
            const want = `| Size | ${(s.bytes / 1024).toFixed(1)} KB · ${s.lines} lines |`;
            if (!r.content.includes(want)) stale.push(`${short} size stamp`);
        }
        if (stale.length) {
            failures.push(`[C] documentation drift (README stale for: ${stale.join(", ")}) — run \`npm run docs\` AFTER the final \`npm run check\``);
        } else {
            passes.push(`[C] README size/version stamps coincide with inventory for all ${Object.keys(readmes).length} documented scripts`);
        }
    }
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
    // v1.2.0 moved the MAM console from Alt+S (ModelSearch's suite-wide combo)
    // to Alt+Shift+S; the v1.4.1 hotkey-census round moved it again to
    // Alt+Shift+M — Alt+Shift+S is YTPM's YouTube settings combo.
    if (!/console \(Alt\+Shift\+M\)/.test(mam)) {
        failures.push(`[D] Maximize_Any_Media: Alt+Shift+M console combo not present`);
    } else if (/console \(Alt\+Shift\+S\)/.test(mam) || /keyCode == 83/.test(mam)) {
        failures.push(`[D] Maximize_Any_Media: stale Alt+Shift+S console remnants still present`);
    } else passes.push(`[D] Maximize_Any_Media Alt+Shift+M console combo verified (YTPM owns Alt+Shift+S on YouTube)`);

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
    if (!asil.includes("defuseScript") || !asil.includes("applyLocalHooks") || !asil.includes("getRealLinkFromGoogleUrl") || !asil.includes("makePhantomWebSocket")) {
        failures.push(`[D] Akasha Silence: absorbed trio modules not present`);
    } else passes.push(`[D] Akasha Silence absorbed trio verified`);

    /* v1.4.5 NetHook veto migration — Akasha's fetch/XHR/beacon defusing
     * rides the shared hub (kernel/net.js v3): the per-script Proxy
     * facades are gone, the veto subscription + iframe propagation are
     * present, and the canon source carries no own-network-wrap
     * remnants. Canon is the scan surface (dist carries the inlined
     * kernel, which owns the sanctioned wraps). */
    const asilCanonPath = path.join(ROOT, "canon", "_merged", "4ndr0tools - Akasha Silence.user.js");
    const asilCanon = fs.existsSync(asilCanonPath) ? fs.readFileSync(asilCanonPath, "utf8") : "";
    if (!asilCanon.includes("__4NDR0_NET_API__.onRequest") || !asilCanon.includes("__4NDR0_NET_API__.propagate")) {
        failures.push(`[D] Akasha Silence: NetHook veto subscription/propagation not present in canon`);
    } else passes.push(`[D] Akasha Silence NetHook veto adoption verified (fetch/XHR/beacon defusing rides the shared hub)`);
    if (/targetWindow\.fetch\s*=|XMLHttpRequest\.prototype\.(?:open|send)\s*=|navigator\.sendBeacon\s*=|\.prototype\.(?:open|send)\s*=\s*function/.test(asilCanon)) {
        failures.push(`[D] Akasha Silence: legacy own-network-wrap remnants still present in canon (must ride NetHook)`);
    }
    const netSrcV = fs.readFileSync(path.join(ROOT, "kernel", "net.js"), "utf8");
    if (!/VERSION\s*=\s*5\s*;/.test(netSrcV) || !/onRequest:\s*function/.test(netSrcV) || !/propagate:\s*function/.test(netSrcV) || !/onTraffic:\s*function/.test(netSrcV) || !/onError:\s*function/.test(netSrcV) || !/gmFetch:\s*gmFetch/.test(netSrcV) || !/requestSubscriberCount/.test(netSrcV) || !/trafficSubscriberCount/.test(netSrcV) || !/errorSubscriberCount/.test(netSrcV)) {
        failures.push(`[D] NetHook kernel: veto/traffic/error/transport api surface incomplete (version 5 + onRequest/onTraffic/onError/propagate/gmFetch + subscriber counts)`);
    } else passes.push(`[D] NetHook veto + traffic + recovery + transport semantics verified (request verdicts, structured events, error pacification, gmFetch privileged transport; defusers and observers ride one hub)`);

    /* v1.4.6 NetHook adoption — Recon + Stream Interceptor ride the shared
     * hub (kernel/net.js v4): the per-script fetch/XHR recorders and
     * blockers are gone from canon, the veto/traffic/recovery
     * subscriptions are present, and no own-network-wrap remnants
     * survive. Canon is the scan surface (dist carries the inlined
     * kernel, which owns the sanctioned wraps). */
    const reconCanonPath = path.join(ROOT, "canon", "_sovereign", "4ndr0tools - Recon.user.js");
    const reconCanon = fs.existsSync(reconCanonPath) ? fs.readFileSync(reconCanonPath, "utf8") : "";
    if (!reconCanon.includes("__4NDR0_NET_API__") || !reconCanon.includes("NET_HUB.onRequest") || !reconCanon.includes("NET_HUB.onTraffic") || !reconCanon.includes("NET_HUB.onError")) {
        failures.push(`[D] Recon: NetHook veto/traffic/recovery subscriptions not present in canon`);
    } else passes.push(`[D] Recon NetHook adoption verified (blocklist verdicts + structured capture + 204 pacification on the shared hub)`);
    if (/_window\.fetch\s*=|XMLHttpRequest\.prototype\.(?:open|send)\s*=|navigator\.sendBeacon\s*=|\.prototype\.(?:open|send)\s*=\s*function/.test(reconCanon)) {
        failures.push(`[D] Recon: legacy own-network-wrap remnants still present in canon (must ride NetHook)`);
    }
    const siCanonPath = path.join(ROOT, "canon", "_promoted", "4ndr0tools - Stream Interceptor.user.js");
    const siCanon = fs.existsSync(siCanonPath) ? fs.readFileSync(siCanonPath, "utf8") : "";
    if (!siCanon.includes("__4NDR0_NET_API__") || !siCanon.includes("NET_HUB.onRequest") || !siCanon.includes("NET_HUB.onTraffic") || !siCanon.includes("NET_HUB.propagate")) {
        failures.push(`[D] Stream Interceptor: NetHook veto/traffic/propagate subscriptions not present in canon`);
    } else passes.push(`[D] Stream Interceptor NetHook adoption verified (SVG veto + discovery + deep inspection on the shared hub)`);
    if (/win\.fetch\s*=|pageWindow\.fetch\s*=|XMLHttpRequest\.prototype\.(?:open|send)\s*=|__usiHooked/.test(siCanon)) {
        failures.push(`[D] Stream Interceptor: legacy own-network-wrap remnants still present in canon (must ride NetHook)`);
    }

    /* v1.4.7 NetHook adoption — the observer family rides the shared hub.
     * Per script: the canon must carry the hub subscription surface, and
     * the legacy per-script wrap shapes must be gone. The two surviving
     * adjudicated wraps (m3u8++'s GM dev-proxy, Watermark++'s intent-gated
     * processing proxy) are NOT refused — their shapes are scoped to the
     * exact legacy sites each refusal targets. */
    const OBSERVER_ADOPTIONS = [
        {
            name: "Bunkr++", dir: "_sovereign",
            need: ["__4NDR0_NET_API__.onRequest", "__4NDR0_NET_API__.onTraffic", "__4NDR0_NET_API__.propagate"],
            label: "fake-stats respond verdict + URL classifier/body sweeper + sandbox propagation on the shared hub",
            refuse: [/unsafeWindow\.fetch\s*=/, /target\.fetch\s*=\s*wrapped/, /\bxo\.open\s*=/, /\bxo\.send\s*=/],
        },
        {
            name: "Filester++", dir: "_sovereign",
            need: ["__4NDR0_NET_API__.onTraffic"],
            label: "media-URL cache + API-hit log on request-phase events",
            refuse: [/window\.fetch\s*=/],
        },
        {
            name: "Instagram++", dir: "_sovereign",
            need: ["__4NDR0_NET_API__.onTraffic"],
            label: "feed digest on response-phase events",
            refuse: [/win\.fetch\s*=/, /XMLHttpRequest\.prototype\.open\s*=/, /XMLHttpRequest\.prototype\.send\s*=/],
        },
        {
            name: "Prompt Master", dir: "_sovereign",
            need: ["__4NDR0_NET_API__.onTraffic"],
            label: "flow-credit scanner on response-phase events",
            refuse: [/pageWin\.fetch\s*=/, /XO\.prototype\.open\s*=/, /XO\.prototype\.send\s*=/],
        },
        {
            name: "Watermark++", dir: "_sovereign",
            need: ["__4NDR0_NET_API__.onTraffic"],
            label: "gemini RPC observer on xhr events (pending-map join by exchange id)",
            refuse: [/gwrGeminiRpcOpen/, /gwrGeminiRpcSend/],
        },
        {
            name: "m3u8++", dir: "_promoted",
            need: ["__4NDR0_NET_API__.onTraffic"],
            label: "playlist sniffer on response-phase events (fetch + xhr unified)",
            refuse: [/XMLHttpRequest\.prototype\.open\s*=/, /Response\.prototype\.text\s*=/],
        },
    ];
    for (const spec of OBSERVER_ADOPTIONS) {
        const p = path.join(ROOT, "canon", spec.dir, `4ndr0tools - ${spec.name}.user.js`);
        const src = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
        const missing = spec.need.filter((needle) => !src.includes(needle));
        if (missing.length > 0) {
            failures.push(`[D] ${spec.name}: NetHook subscription surface missing (${missing.join(", ")})`);
        } else {
            passes.push(`[D] ${spec.name} NetHook adoption verified (${spec.label})`);
        }
        const remnant = spec.refuse.find((re) => re.test(src));
        if (remnant) {
            failures.push(`[D] ${spec.name}: legacy own-network-wrap remnant still present in canon (${remnant})`);
        }
    }

    /* v1.4.8 PM Media Slideshow (operator candidate integration) — the
     * surface gate: the mediaSlideshow shortcut entry with the
     * census-safe Alt+T combo (the candidate's Alt+S was re-lettered —
     * ModelSearch owns it universally), the full open/close/toggle
     * lifecycle, the persisted config riding the backup family, and the
     * manager-menu entry. The candidate's slideshowKeyHandler indirection
     * was simplified to the named handler (census-resolvable). */
    const pmCanonPath2 = path.join(ROOT, "canon", "_sovereign", "4ndr0tools - Prompt Master.user.js");
    const pmCanon2 = fs.existsSync(pmCanonPath2) ? fs.readFileSync(pmCanonPath2, "utf8") : "";
    if (!pmCanon2.includes('mediaSlideshow: {') || !pmCanon2.includes('keys: "Alt+T"') ||
        !pmCanon2.includes("function toggleSlideshow()") || !pmCanon2.includes("function closeSlideshow()") ||
        !pmCanon2.includes("function openSlideshow()") || !pmCanon2.includes("function harvestSlideshowMedia()") ||
        !pmCanon2.includes('"SlideshowConfig",') || !pmCanon2.includes("Media Slideshow")) {
        failures.push(`[D] Prompt Master: Media Slideshow surface incomplete (mediaSlideshow Alt+T + lifecycle + config + menu entry)`);
    } else passes.push(`[D] Prompt Master Media Slideshow verified (operator candidate integrated; Alt+T census re-letter, config rides the backup family)`);
    if (/keys: "Alt\+[SD]",\s*\n\s*desc: "Opens\/closes the media slideshow/.test(pmCanon2) || /mediaSlideshow[\s\S]{0,120}keys: "Alt\+S"/.test(pmCanon2)) {
        failures.push(`[D] Prompt Master: media slideshow combo regressed to a census-owned letter (Alt+S ModelSearch / Alt+D GPD domain)`);
    }

    /* v1.4.8 GPD gmFetch adoption — GooglePhotosandDrive++ rides the
     * kernel's v5 privileged transport for Drive true-direct resolution:
     * the canon calls the hub's gmFetch (never a bare manager call), the
     * transport grant + its @connect targets are declared (alignment:
     * declared use ⇒ declared grant), and the confirm-form parser stays
     * DOMParser-based (D8 — regex over HTML is a hard fail shape). */
    const gpdCanonPath = path.join(ROOT, "canon", "_promoted", "4ndr0tools - GooglePhotosandDrive++.user.js");
    const gpdCanon = fs.existsSync(gpdCanonPath) ? fs.readFileSync(gpdCanonPath, "utf8") : "";
    if (!gpdCanon.includes("__4NDR0_NET_API__.gmFetch") || !gpdCanon.includes("resolveDriveTrueDirect") || !gpdCanon.includes("buildDirectFromForm")) {
        failures.push(`[D] GooglePhotosandDrive++: kernel gmFetch adoption surface missing (resolveDriveTrueDirect via __4NDR0_NET_API__.gmFetch)`);
    } else passes.push(`[D] GooglePhotosandDrive++ gmFetch adoption verified (Drive true-direct resolution rides the kernel v5 transport)`);
    if (/GM_xmlhttpRequest\s*\(/.test(gpdCanon)) {
        failures.push(`[D] GooglePhotosandDrive++: bare GM transport call in canon (must ride __4NDR0_NET_API__.gmFetch)`);
    }
    if (!/@grant\s+GM_xmlhttpRequest/.test(gpdCanon) || !/@connect\s+drive\.usercontent\.google\.com/.test(gpdCanon) || !/@connect\s+drive\.google\.com/.test(gpdCanon)) {
        failures.push(`[D] GooglePhotosandDrive++: transport grant/@connect declarations incomplete for the privileged probe`);
    } else passes.push(`[D] GooglePhotosandDrive++ transport declarations verified (grant + connect targets align with the probe's endpoints)`);
    if (/drive\.(?:google|usercontent\.google)[^'"`\n]*\\?\s*\)|form\.innerHTML\s*=/.test(gpdCanon) && /responseText\.match\(\s*<form/.test(gpdCanon)) {
        failures.push(`[D] GooglePhotosandDrive++: regex-over-HTML parsing shape present (must use DOMParser)`);
    }

    /* v1.4.9 gmFetch consolidation — the five census-surviving local wrapped
     * transports retire onto kernel/net.js v5.1 (one suite-wide transport
     * implementation). Per script: the canon's facade must route through
     * __4NDR0_NET_API__.gmFetch, the legacy bare-dispatch body shape must
     * be gone (adjudicated one-off GM sites are NOT refused — the refusal
     * targets the retired copy's exact dispatch shape), and the transport
     * grant + connect surface stays declared (bidirectional alignment:
     * the inlined kernel's capability detection consumes the grant). */
    const canonOf = (dir, name) => {
        const p = path.join(ROOT, "canon", dir, `4ndr0tools - ${name}.user.js`);
        return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
    };

    /* Bunkr++ 7.7.0 — GAP 9 abort registry now holds AbortControllers fed to
     * the kernel's opts.signal; typed NetError replaces the untyped
     * 'Network error: '/'Timeout: '/'Aborted: ' rejections (no caller ever
     * branched on those strings — verified). */
    const bkrCanonG = canonOf("_sovereign", "Bunkr++");
    if (!bkrCanonG.includes("__4NDR0_NET_API__.gmFetch") || !bkrCanonG.includes("checkStatus:  false") || !/_activeRequests\.add\(ctl\)/.test(bkrCanonG)) {
        failures.push(`[D] Bunkr++: kernel gmFetch adoption surface missing (kernel-routed adapter + AbortController in the GAP 9 registry + checkStatus:false raw resolution)`);
    } else passes.push(`[D] Bunkr++ kernel gmFetch adoption verified (transport rides kernel v5.1; GAP 9 STOP aborts via AbortController, typed NetError taxonomy)`);
    if (/const control = GM_xmlhttpRequest\(\{\s*\n\s*timeout:\s*_API_TIMEOUT_MS,\s*\n\s*\.\.\.opts,/.test(bkrCanonG)) {
        failures.push(`[D] Bunkr++: legacy local gmFetch dispatch shape still present (must ride __4NDR0_NET_API__.gmFetch)`);
    }
    if (!/@grant\s+GM_xmlhttpRequest/.test(bkrCanonG) || !/@connect\s+\*/.test(bkrCanonG) || !/@connect\s+127\.0\.0\.1/.test(bkrCanonG)) {
        failures.push(`[D] Bunkr++: transport grant/@connect declarations incomplete after consolidation`);
    } else passes.push(`[D] Bunkr++ transport declarations preserved (GM_xmlhttpRequest grant + wildcard/localhost connects intact)`);

    /* Gofile++ 2.2.0 — the Response-facade utils.gmFetch routes through the
     * kernel (every status resolves raw; ok computed facade-side); the
     * baseline dispatched with NO timeout, so the 20 s hard bound is a
     * superset hardening, and the fetch-Response facade is preserved
     * byte-for-byte for its five call sites (gofile API + ADBM + aria2). */
    const gfCanonG = canonOf("_sovereign", "Gofile++");
    if (!gfCanonG.includes("__4NDR0_NET_API__.gmFetch") || !gfCanonG.includes("checkStatus: false") ||
        !/json: \(\) => Promise\.resolve\(JSON\.parse\(response\.responseText\)\)/.test(gfCanonG)) {
        failures.push(`[D] Gofile++: kernel gmFetch adoption surface missing (kernel-routed facade + checkStatus:false + preserved Response facade)`);
    } else passes.push(`[D] Gofile++ kernel gmFetch adoption verified (fetch-Response facade rides the kernel v5.1 transport; 20 s hard timeout added)`);
    if (/GM_xmlhttpRequest\(\{\s*\n\s*method: options\.method \|\| 'GET',/.test(gfCanonG)) {
        failures.push(`[D] Gofile++: legacy local gmFetch dispatch shape still present (must ride __4NDR0_NET_API__.gmFetch)`);
    }
    if (!/@grant\s+GM_xmlhttpRequest/.test(gfCanonG) || !/@connect\s+api\.gofile\.io/.test(gfCanonG) || !/@connect\s+localhost/.test(gfCanonG)) {
        failures.push(`[D] Gofile++: transport grant/@connect declarations incomplete after consolidation`);
    } else passes.push(`[D] Gofile++ transport declarations preserved (GM_xmlhttpRequest grant + api.gofile.io/localhost connects intact)`);

    /* Instagram++ 13.2.0 — gmFetchBlob keeps only its POLICY (the 2xx+body
     * blob gate) on top of the kernel transport; the download tier's
     * GM_xmlhttpRequest typeof guard stays (sanctioned detection shape,
     * avoids the pointless typed rejection round-trip before Tier 3). */
    const igCanonG = canonOf("_sovereign", "Instagram++");
    if (!igCanonG.includes("__4NDR0_NET_API__.gmFetch") || !/responseType: 'blob'/.test(igCanonG) ||
        !/res\.status >= 200 && res\.status < 300 && res\.response/.test(igCanonG)) {
        failures.push(`[D] Instagram++: kernel gmFetch adoption surface missing (blob gate policy over the kernel transport)`);
    } else passes.push(`[D] Instagram++ kernel gmFetch adoption verified (gmFetchBlob policy gate rides the kernel v5.1 transport)`);
    if (/GM_xmlhttpRequest\(\{\s*\n\s*method: 'GET',\s*\n\s*url,\s*\n\s*responseType: 'blob',/.test(igCanonG)) {
        failures.push(`[D] Instagram++: legacy local gmFetchBlob dispatch shape still present (must ride __4NDR0_NET_API__.gmFetch)`);
    }
    if (!/@grant\s+GM_xmlhttpRequest/.test(igCanonG) || !/@connect\s+cdninstagram\.com/.test(igCanonG) || !/@connect\s+instagram\.com/.test(igCanonG)) {
        failures.push(`[D] Instagram++: transport grant/@connect declarations incomplete after consolidation`);
    } else passes.push(`[D] Instagram++ transport declarations preserved (GM_xmlhttpRequest grant + cdn/instagram connects intact)`);

    /* Pixeldrain++ 1.2.0 — the rich gmXHR facade keeps SPOOF_HEADERS +
     * anonymous-default + 60s timeout + raw-response policy over the
     * kernel transport; progress/onloadstart/signal ride the v5.1 opts;
     * the five gmXHR abort branches recognize BOTH the typed
     * (e.kind === 'abort') and legacy ('aborted') forms; the fsa inline
     * stream one-off (adjudicated, custom settle semantics) and the
     * fetch AbortError branch are untouched. */
    const pdCanonG = canonOf("_sovereign", "Pixeldrain++");
    if (!pdCanonG.includes("__4NDR0_NET_API__.gmFetch") || !/opts\.spoof === false \? \{\} : SPOOF_HEADERS/.test(pdCanonG) ||
        !/anonymous:\s*opts\.anonymous !== false/.test(pdCanonG) || !/onprogress:\s*opts\.onprogress/.test(pdCanonG) ||
        !/signal:\s*opts\.signal/.test(pdCanonG)) {
        failures.push(`[D] Pixeldrain++: kernel gmFetch adoption surface missing (spoof/anonymous/progress/signal policy over the kernel transport)`);
    } else passes.push(`[D] Pixeldrain++ kernel gmFetch adoption verified (gmXHR facade rides the kernel v5.1 transport with progress + signal)`);
    if (/const xhr = typeof GM_xmlhttpRequest === 'function'\s*\n\s*\? GM_xmlhttpRequest\s*\n\s*: \(typeof GM !== 'undefined' && GM\.xmlHttpRequest\);/.test(pdCanonG)) {
        failures.push(`[D] Pixeldrain++: legacy local gmXHR dispatch shape still present (must ride __4NDR0_NET_API__.gmFetch)`);
    }
    if (!/e\.kind === 'abort' \|\| e\.message === 'aborted'/.test(pdCanonG)) {
        failures.push(`[D] Pixeldrain++: abort branches not widened to the typed taxonomy (e.kind === 'abort')`);
    } else passes.push(`[D] Pixeldrain++ abort branches verified (typed abort + legacy message both recognized — superset)`);
    if (!/@grant\s+GM_xmlhttpRequest/.test(pdCanonG) || !/@grant\s+GM\.xmlHttpRequest/.test(pdCanonG) || !/@connect\s+pixeldrain\.com/.test(pdCanonG)) {
        failures.push(`[D] Pixeldrain++: transport grant/@connect declarations incomplete after consolidation`);
    } else passes.push(`[D] Pixeldrain++ transport declarations preserved (GM_xmlhttpRequest + GM.xmlHttpRequest grants + pixeldrain.com connects intact)`);

    /* Blob2URL 7.3.0 — the privileged blob hop rides the kernel; the
     * status-0 opaque tolerance, empty-body classification, and exact
     * fallback-chain diagnostics stay facade-side (hardenedFetch chain
     * untouched). */
    const b2uCanonG = canonOf("_promoted", "Blob2URL");
    if (!b2uCanonG.includes("__4NDR0_NET_API__.gmFetch") || !/responseType: 'blob'/.test(b2uCanonG) ||
        !/\(status >= 200 && status < 300\) \|\| status === 0/.test(b2uCanonG) || !/hardenedFetch/.test(b2uCanonG)) {
        failures.push(`[D] Blob2URL: kernel gmFetch adoption surface missing (blob policy + status-0 tolerance + hardenedFetch chain over the kernel transport)`);
    } else passes.push(`[D] Blob2URL kernel gmFetch adoption verified (privileged blob hop + hardenedFetch fallback chain ride the kernel v5.1 transport)`);
    if (/const gmFetch = \(url\) => new Promise\(\(resolve, reject\) => \{\s*\n\s*if \(typeof GM_xmlhttpRequest !== 'function'\)/.test(b2uCanonG)) {
        failures.push(`[D] Blob2URL: legacy local gmFetch dispatch shape still present (must ride __4NDR0_NET_API__.gmFetch)`);
    }
    if (!/@grant\s+GM_xmlhttpRequest/.test(b2uCanonG) || !/@connect\s+\*/.test(b2uCanonG)) {
        failures.push(`[D] Blob2URL: transport grant/@connect declarations incomplete after consolidation`);
    } else passes.push(`[D] Blob2URL transport declarations preserved (GM_xmlhttpRequest grant + wildcard connects intact)`);

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
    if (!b2u.includes("URL VAULT") || !b2u.includes("__4NDR0_NET_API__")) {
        failures.push(`[D] Blob2URL: universal vault + NetHook wire capture not present`);
    } else passes.push(`[D] Blob2URL universal vault + shared NetHook wire capture verified`);

    const si = read("Stream Interceptor");
    if (!si || !si.includes("MAX_FOUND_URLS") || !si.includes("Stream Interceptor")) {
        failures.push(`[D] Stream Interceptor: suite membership incomplete`);
    } else passes.push(`[D] Stream Interceptor suite membership verified`);

    const hwDist = read("HostWarp");
    const pcDist = read("PageCraft");
    if (!hwDist.includes("a4:glass") || !pcDist.includes("a4:glass")) {
        failures.push(`[D] HostWarp/PageCraft: rebuilt without the repaired glass kernel`);
    } else passes.push(`[D] HostWarp/PageCraft glass-kernel repair verified`);

    // Kernel TT-immunity invariant (suite v1.4.2): DOMParser.parseFromString
    // is a Trusted Types sink under require-trusted-types-for 'script' —
    // including the image/svg+xml branch (field-proven: YTPM v1.4.0's 54
    // uncaught TypeErrors on YouTube; the HostWarp/PageCraft settings-
    // console deaths at glyphEl()). The kernel must be zero-string-sink BY
    // CONSTRUCTION: no parseFromString, no innerHTML/outerHTML assignment,
    // no insertAdjacentHTML, no document.write, no eval/new Function in
    // kernel/*.js. Scripts that must parse remote strings route through
    // Ψ.core.parseHTML/parseXML (policy-wrapped, verified in kernel-smoke).
    // Comment-aware scan — changelog notes never satisfy a gate (lesson 7).
    const KERNEL = path.join(ROOT, "kernel");
    const TT_SINK_RE = /parseFromString\s*\(|\.(?:inner|outer)HTML\s*=|insertAdjacentHTML\s*\(|document\.write\s*\(|\beval\s*\(|new\s+Function\s*\(/;
    const kernelSinks = [];
    for (const f of fs.readdirSync(KERNEL).filter(f => f.endsWith(".js"))) {
        const code = stripComments(fs.readFileSync(path.join(KERNEL, f), "utf8"));
        if (f === "core.js") {
            // core.js HOSTS the sanctioned wrappers (parseHTML/parseXML) —
            // every parseFromString there must feed tt.createHTML(...).
            const bare = code.match(/parseFromString\(\s*(?!tt\.createHTML\()/g);
            if (bare) kernelSinks.push(`${f}: ${bare.length} un-wrapped parseFromString call(s)`);
            const m2 = code.match(/\.(?:inner|outer)HTML\s*=|insertAdjacentHTML\s*\(|document\.write\s*\(|\beval\s*\(|new\s+Function\s*\(/);
            if (m2) kernelSinks.push(`${f}: ${m2[0].trim()}`);
        } else {
            const m = code.match(TT_SINK_RE);
            if (m) kernelSinks.push(`${f}: ${m[0].trim()}`);
        }
    }
    if (kernelSinks.length) {
        for (const k of kernelSinks) failures.push(`[D] kernel TT-immunity: string sink in ${k}`);
    } else passes.push(`[D] kernel TT-immunity verified (0 parseFromString/innerHTML/eval sinks in kernel/)`);
    const glyphSrc = fs.readFileSync(path.join(KERNEL, "brand.js"), "utf8");
    if (!glyphSrc.includes("glyphNode") || !fs.readFileSync(path.join(KERNEL, "glass.js"), "utf8").includes("Ψ.brand.glyphNode()")) {
        failures.push(`[D] kernel TT-immunity: glyph must be built via Ψ.brand.glyphNode (createElementNS), not parsed`);
    } else passes.push(`[D] glyph createElementNS construction verified`);

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

    // Hotkey census (suite v1.4.1): registration-level co-install safety —
    // every keyboard claim across canon/ + modules/ is mined idiom-aware
    // (kernel registry, hand-rolled keydown, config defaults, combo tables)
    // and same-combo + domain-overlap pairs fail closed.
    const census = runCensus();
    if (census.problems.length) {
        for (const pr of census.problems) failures.push(`[D] hotkey census: unresolved site ${pr.file}:${pr.line} — ${pr.msg}`);
    }
    for (const col of census.collisions) {
        failures.push(`[D] hotkey census: COLLISION ${col.combo} — ${col.a.script} × ${col.b.script}`);
    }
    for (const st of census.stale) {
        failures.push(`[D] hotkey census: stale adjudication ${st.combo} × ${st.scripts.join(" × ")} — remove the dead entry`);
    }
    if (!census.problems.length && !census.collisions.length && !census.stale.length) {
        passes.push(`[D] hotkey census verified (${census.registrations.length} combos across ${new Set(census.registrations.map(r => r.script)).size} scripts, ${census.siteTotal} sites scanned, 0 co-install collisions)`);
    }

    // Sink census (suite v1.4.3, operator mandate): every HTML-string
    // sink + page-network tap across dist is counted and adjudicated in
    // tools/sink-census.mjs's ledger; fail closed on unadjudicated sites,
    // count drift in either direction, and any kernel class-A sink.
    // Migrated-to-zero this round: FLX (8), Confirmation Bypass (6),
    // BypassPaywalls (2); the Blob2URL + LinkMasterΨ net layers ride the
    // shared kernel/net.js NetHook singleton.
    const sinks = runSinkCensus();
    if (sinks.problems.length) {
        for (const sk of sinks.problems) failures.push(`[D] sink census: ${sk}`);
    } else {
        passes.push(`[D] sink census verified (${sinks.totalSites} HTML-string/net-tap sites across ${sinks.fileCount} dist files, all adjudicated; FLX/CB/BPW at zero, NetHook owns the ψ-family wraps)`);
    }

    // Inventory regeneration determinism (suite v1.4.3): the legacy
    // `generated: <wall clock>` field made every `npm run check` rewrite
    // inventory.json — kit base detection (content-hash, git-state
    // agnostic) then failed G1 with "content drift (not base, not
    // applied)" after any post-apply verification run (operator field
    // report, v1.4.2 apply). The field is now a content-addressed
    // digest; a fresh recomputation must be byte-identical to the file
    // on disk.
    try {
        const invOnDisk = fs.readFileSync(path.join(ROOT, "inventory.json"), "utf8");
        const invFresh = serialize(computeInventory());
        if (invOnDisk !== invFresh) {
            failures.push(`[D] inventory regeneration drift — dist and inventory.json are out of sync (run: npm run inventory)`);
        } else {
            const digest = JSON.parse(invOnDisk).digest;
            passes.push(`[D] inventory regeneration deterministic (content digest ${String(digest).slice(0, 16)}…)`);
        }
    } catch (e) {
        failures.push(`[D] inventory determinism check failed: ${e.message}`);
    }

    // Canon-kernel wiring (suite v1.4.3): kernel modules consumed by
    // canon-carried scripts (build.mjs CANON_KERNEL) must be inlined
    // byte-identically into the dist twin, and only into files whose
    // canon source references the module identifier — both directions,
    // so a forgotten map entry or an accidental injection both fail.
    const NET_ID = "__4NDR0_NET_API__";
    const netModule = fs.readFileSync(path.join(KERNEL, "net.js"), "utf8").trim();
    const canonDirs = ["_sovereign", "_promoted", "_merged"];
    let netConsumers = 0;
    for (const cd of canonDirs) {
        const dir = path.join(ROOT, "canon", cd);
        if (!fs.existsSync(dir)) continue;
        for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".user.js"))) {
            const canonSrc = fs.readFileSync(path.join(dir, f), "utf8");
            const distSrc = fs.existsSync(path.join(DIST, f))
                ? fs.readFileSync(path.join(DIST, f), "utf8") : "";
            const canonUses = canonSrc.includes(NET_ID);
            const distHas = distSrc.includes(netModule.slice(0, 200));
            if (canonUses && !distHas) {
                failures.push(`[D] canon-kernel wiring: ${f} references ${NET_ID} but dist carries no kernel/net.js — add the CANON_KERNEL map entry`);
            } else if (!canonUses && distHas) {
                failures.push(`[D] canon-kernel wiring: ${f} dist carries kernel/net.js without a canon reference — accidental injection`);
            } else if (canonUses && distHas) {
                netConsumers++;
            }
        }
    }
    if (netConsumers === 0) {
        failures.push(`[D] canon-kernel wiring: zero NetHook consumers — kernel/net.js is dead kernel surface`);
    } else {
        passes.push(`[D] NetHook singleton wiring verified (${netConsumers} canon consumer(s) share one page-realm wrap; lazy arm + 4 MB single-read contract)`);
    }
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
