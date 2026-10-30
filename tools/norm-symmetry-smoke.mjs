#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/norm-symmetry-smoke.mjs — Normalization & Storage Symmetry Battery
 * ----------------------------------------------------------------------------
 * WO-01 round 13 mandate: the two lenses the r12 handoff proposed (storage
 * round-trip symmetry — the MAM-F01 class; normalization symmetry — the
 * SGC-F02 class) found 41 fixes across 16 scripts. This battery pins the
 * MECHANISMS so the lens can never silently regress:
 *
 *   1.  fnNoExt / basename symmetry      (Forums++ 1.13.7, LinkMasterΨ 6.3.5)
 *   2.  matchAll g-flag rebuild          (LinkMasterΨ 6.3.5 — the CRITICAL
 *                                       non-global tab-hang)
 *   3.  ibb page-count NaN proof         (both twins)
 *   4.  Pixeldrain query-aware resolver  (Forums++ 1.13.7)
 *   5.  kemono ?f= original-URL recovery (Forums++ 1.13.7)
 *   6.  RPC decode single +→%20 pass     (Watermark++ 2.1.3 — %2B survives)
 *   7.  serviceguard IDN homograph gate  (7.4.3 — the URL parser is the
 *                                       normalizer; xn-- no longer strips)
 *   8.  LFA cached-credential domain gate (2.0.11 — hostname equality or
 *                                       dot-suffix, never substring)
 *   9.  Zai alternation repair + sentinel (1.0.2 — lastKnown updates in the
 *                                       repair branch; per-run random
 *                                       literal-safe code-fence sentinel)
 *   10. id-capture / playlist-shape / threshold regexes (YRVR 2.0.6,
 *                                       YTPM 1.7.5, YT Filter 2.5.2)
 *   11. GlobalFiles LRU bounds           (Prompt Master 28.8.2)
 *   12. toBool toggle readers            (WCP 5.3.2, MPC 8.1.5, m3u8++ 5.1.3,
 *                                       ModelSearch 4.0.5)
 *   13. round-14 IG++ contract            (13.3.0 — DUMP HTML back, grid
 *                                       wall default, wall snapshot)
 *   14. Prompt Master 28.9.0              (insertPrompt escape, raw ingest,
 *                                       hostEq gates, compareVersions,
 *                                       per-run sentinels, fallback stamp)
 *   15. Images++ 4.1.0                    (CSP boundary dot, numeric heal,
 *                                       never-null handlers, domain gates,
 *                                       broken-rule drop, case-fold)
 *
 * WO-01 round 14: the r13 residual closed — the property-arrow sites
 * (fnNoExt, matchAll, the pixeldrain resolver) now run EXTRACTED from the
 * canon (not inline copies), the button contract re-pinned to the round-14
 * directive (DUMP HTML back on the artifact button), and the round-14
 * normalization fixes (PM + Images++) pinned with fixtures + wiring
 * tripwires + red controls.
 *
 * Discipline (SUK v1.2 Part V): totals derive from execution; every inline
 * fixture carries a WIRING TRIPWIRE asserting the canon carries the fixed
 * marker; red controls assert the PRE-FIX shapes are absent repo-wide so a
 * regression cannot reintroduce them silently.
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function extractFn(src, fnName) {
    const marker = `function ${fnName}(`;
    const idx = src.indexOf(marker);
    if (idx === -1) throw new Error(`Missing function ${fnName}`);
    const openParen = idx + `function ${fnName}`.length;
    let pDepth = 0, bodyStart = -1;
    for (let i = openParen; i < src.length; i++) {
        if (src[i] === "(") pDepth++;
        else if (src[i] === ")") {
            pDepth--;
            if (pDepth === 0) { bodyStart = src.indexOf("{", i + 1); break; }
        }
    }
    let depth = 0;
    for (let i = bodyStart; i < src.length; i++) {
        if (src[i] === "{") depth++;
        else if (src[i] === "}") {
            depth--;
            if (depth === 0) return src.slice(idx, i + 1);
        }
    }
    throw new Error(`Unbalanced function ${fnName}`);
}

/* v(r14): the property-arrow extractor — `name: (args) => { ... }` object
 * members (the LMPsi/Forums helper tables). Scans occurrences line-by-line
 * so changelog PROSE naming `fnNoExt:` never shadows the real definition;
 * reconstructs a plain function so the battery executes the canon's OWN
 * code, not a copy of its shape. */
function extractPropFn(src, propName) {
    const headerRe = new RegExp(`^${propName}:\\s*(\\([^()]*\\)|[\\w$]+)\\s*=>\\s*\\{`);
    let idx = -1;
    for (let pos = 0; pos < src.length; ) {
        const at = src.indexOf(`${propName}:`, pos);
        if (at === -1) break;
        const line = src.slice(at, (src.indexOf("\n", at) + 1) || src.length);
        if (headerRe.test(line)) { idx = at; break; }
        pos = at + 1;
    }
    if (idx === -1) throw new Error(`Missing arrow property ${propName}`);
    const arrow = src.indexOf("=>", idx);
    const bodyStart = src.indexOf("{", arrow);
    let depth = 0;
    for (let i = bodyStart; i < src.length; i++) {
        if (src[i] === "{") depth++;
        else if (src[i] === "}") {
            depth--;
            if (depth === 0) {
                const params = src.slice(idx + propName.length + 1, arrow).trim().replace(/^\(|\)$/g, "");
                return `function(${params}) ${src.slice(bodyStart, i + 1)}`;
            }
        }
    }
    throw new Error(`Unbalanced property ${propName}`);
}

const readCanon = (tier, name) =>
    fs.readFileSync(path.join(ROOT, "canon", tier, `4ndr0tools - ${name}.user.js`), "utf8");

export async function runNormSymmetrySmoke(root = ROOT) {
    const problems = [];
    let passed = 0, total = 0;
    const assert = (label, cond) => {
        total++;
        if (cond) passed++;
        else problems.push(label);
    };
    const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

    const forums = readCanon("_sovereign", "Forums++");
    const lmpsi  = readCanon("_merged", "LinkMasterΨ");
    const wm     = readCanon("_sovereign", "Watermark++");
    const sg     = readCanon("_sovereign", "4ndr0serviceguard Companion");
    const lfa    = readCanon("_sovereign", "Login Form Autofiller");
    const zai    = readCanon("_sovereign", "Zai Exporter");
    const yrvr   = readCanon("_sovereign", "Youtube Removed Video Revealer");
    const ytpm   = readCanon("_sovereign", "YouTube Playlist Master");
    const ytf    = readCanon("_sovereign", "YT Filter");
    const pm     = readCanon("_sovereign", "Prompt Master");
    const wcp    = readCanon("_sovereign", "Website Control Panel");
    const mpc    = readCanon("_promoted", "Media Player Controller");
    const m3u8   = readCanon("_promoted", "m3u8++");
    const mst    = readCanon("_promoted", "ModelSearch");
    const ig     = readCanon("_sovereign", "Instagram++");
    const pxd    = readCanon("_sovereign", "Pixeldrain++");
    const imgs   = readCanon("_merged", "Images++");
    const igDist = fs.readFileSync(path.join(ROOT, "dist", "4ndr0tools - Instagram++.user.js"), "utf8");

    /* ── 1. fnNoExt / basename symmetry (EXTRACTED from both twins) ────── */
    const forumsFnNoExt = eval(`(${extractPropFn(forums, "fnNoExt")})`);
    const lmpsiFnNoExt  = eval(`(${extractPropFn(lmpsi, "fnNoExt")})`);
    assert("1a. fnNoExt fixtures (EXTRACTED from BOTH twins): dotless basename is its own stem, multi-dot keeps interior dots, empty stays empty",
      ["photo", "video.mp4", "a.b.c.jpg", ""].every((s) => forumsFnNoExt(s) === lmpsiFnNoExt(s)) &&
        forumsFnNoExt("photo") === "photo" && forumsFnNoExt("video.mp4") === "video" && forumsFnNoExt("a.b.c.jpg") === "a.b.c" && forumsFnNoExt("") === "" &&
        lmpsiFnNoExt("photo") === "photo" && lmpsiFnNoExt("  x.y ") === "x");
    assert("1b. fnNoExt wiring: BOTH twins carry the dotless guard", forums.includes("if (parts.length < 2) return trimmed;") && lmpsi.includes("if (parts.length < 2) return trimmed;"));
    assert("1c. basename wiring: the LMPsi twin strips the trailing slash like Forums++", lmpsi.includes('.replace(/\\/(\\s+)?$/, "")') && forums.includes("path.replace(/\\/(\\s+)?$/, '')"));
    assert("1d. RED CONTROL: the pre-fix pop-to-empty shape is absent from both twins", !forums.includes("parts.pop(); // Remove extension\n        return parts.join('.');\n    },\n    /**\n     * @param {string} path\n     * @returns {string|null}\n     */\n    ext: path => {\n      if (!path") && !lmpsi.includes('fnNoExt: (path) => path.trim().split(".").reverse().slice(1).reverse().join(".")'));

    /* ── 2. matchAll g-flag rebuild (the CRITICAL tab-hang, EXTRACTED) ── */
    const lmpsiMatchAll = eval(`(${extractPropFn(lmpsi, "matchAll")})`);
    assert("2a. matchAll fixture (EXTRACTED from the LMPsi twin): a NON-global pattern terminates and matches (the live ibb auth_token lookbehind shape)", eq(lmpsiMatchAll(/(?<=auth_token=").*?(?=")/i, 'x auth_token="ABC" y'), ["ABC"]) && eq(lmpsiMatchAll(/zzz/i, "abc"), []));
    assert("2b. matchAll fixture (EXTRACTED): global callers unaffected", lmpsiMatchAll(/data-object='/gi, "a data-object='1' b data-object='2'").length === 2);
    assert("2c. matchAll bounded-exec proof (EXTRACTED, exec-instrumented): the non-global run stays under 200 RegExp execs (the pre-fix shape pushed identical matches forever)", (() => {
        let execCalls = 0;
        const origExec = RegExp.prototype.exec;
        RegExp.prototype.exec = function (...a) { if (++execCalls > 200) { RegExp.prototype.exec = origExec; throw new Error("runaway"); } return origExec.apply(this, a); };
        try { const r = lmpsiMatchAll(/(?<=a=).*?(?=&)/i, "zzz a=1&b=2 y"); return execCalls > 0 && execCalls <= 200 && eq(r, ["1"]); }
        catch { return false; }
        finally { RegExp.prototype.exec = origExec; }
    })());
    assert("2d. matchAll wiring: the LMPsi twin carries the g-rebuild; the raw-exec pre-fix shape is GONE", lmpsi.includes('const regex = new RegExp(pattern.source, "g" + (pattern.flags?.replace("g", "") || ""));') && !lmpsi.includes("while ((m = pattern.exec(subject)) !== null)"));
    assert("2e. RED CONTROL: the LMPsi ibb token call site rides matchAll (never a bare exec loop)", lmpsi.includes('h.re.matchAll(/(?<=auth_token=").*?(?=")/i, source)[0]'));

    /* ── 3. ibb page-count NaN proof ────────────────────────────────────── */
    const pageCountOf = (innerText) => {
        const countText = String(innerText || "").replace(/[^0-9]/g, "");
        const imageCount = parseInt(countText, 10) || 0;
        return Math.max(1, Math.ceil(imageCount / 32));
    };
    assert("3a. ibb count fixture: missing node and comma-formatted counts degrade to real page counts (never the silent zero-file album)", pageCountOf(undefined) === 1 && pageCountOf("1,234") === 39 && pageCountOf("64") === 2);
    assert("3b. ibb count wiring: BOTH twins carry the digits-only extraction + one-page floor", forums.includes("replace(/[^0-9]/g, '');") && lmpsi.includes('replace(/[^0-9]/g, "")') && forums.includes("Math.max(1, Math.ceil(imageCount / 32));") && lmpsi.includes("Math.max(1, Math.ceil(imageCount / 32));"));
    assert("3c. RED CONTROL: the pre-fix raw Number() count is absent from both twins", !forums.includes("const imageCount = Number(dom.querySelector('span[data-text=\"image-count\"]')?.innerText);") && !lmpsi.includes("const imageCount = Number(dom.querySelector('span[data-text=\"image-count\"]').innerText);"));

    /* ── 4. Pixeldrain query-aware resolver (EXTRACTED from canon) ─────── */
    const pxdStart = forums.indexOf("const u = new URL(url);");
    const pxdEndMarker = "return `${u.origin}${u.pathname}?download`;";
    const pxdEnd = forums.indexOf(pxdEndMarker, pxdStart);
    const pxdResolve = pxdStart !== -1 && pxdEnd !== -1
        ? eval(`((url) => { ${forums.slice(pxdStart, pxdEnd + pxdEndMarker.length)} })`)
        : null;
    assert("4a. pixeldrain fixture (EXTRACTED from the Forums++ resolver body): clean URLs byte-match the old output; query-bearing URLs are constructed, never glued", pxdResolve !== null &&
      pxdResolve("https://pixeldrain.com/u/abc") === "https://pixeldrain.com/api/file/abc?download" &&
      pxdResolve("https://pixeldrain.com/u/abc?x=1") === "https://pixeldrain.com/api/file/abc?x=1&download=" &&
      pxdResolve("https://pixeldrain.com/l/abc") === "https://pixeldrain.com/api/list/abc/zip" &&
      pxdResolve("https://pixeldrain.com/l/abc?x=1") === "https://pixeldrain.com/api/list/abc/zip?x=1");
    assert("4b. pixeldrain wiring: the Forums++ resolver builds via URL (the string-splice pre-fix shape is gone)", forums.includes("u.pathname.replace('/l/', '/api/list/')") && !forums.includes("resolved = h.contains('/api/list', resolved) ? `${resolved}/zip` : resolved;"));

    /* ── 5. kemono ?f= original-URL recovery ────────────────────────────── */
    const kemonoName = (resourceUrl) => {
        try {
            const fParam = new URL(resourceUrl).searchParams.get("f");
            if (fParam) return fParam;
        } catch { /* keep */ }
        return null;
    };
    assert("5a. kemono fixture: the pretty name recovers from the ORIGINAL url with real percent-decoding", kemonoName("https://kemono.su/data/ab/cd/uuid.mp4?f=pretty%20name.mp4") === "pretty name.mp4" && kemonoName("https://kemono.su/data/ab/cd/uuid.mp4") === null);
    assert("5b. kemono wiring: the recovery reads searchParams off resource.url (the dead post-strip regex is gone)", forums.includes("new URL(resource.url).searchParams.get('f')") && !forums.includes("basename.replace(/(.*)\\?f=(.*)/, '$2').replace('%20', ' ')"));

    /* ── 6. RPC decode single +→%20 pass (extracted from canon) ─────────── */
    const decodeRpc = eval(`(${extractFn(wm, "decodeRpcRequestBodyText").replace(/^function\s+\w+\s*\(/, "function(")})`);
    assert("6a. WM decode fixture (EXTRACTED from canon 2.1.3): %2B survives the multi-pass loop, plain + still becomes a space, double-encoding still fully decodes", decodeRpc("a%2Bb.jpg") === "a+b.jpg" && decodeRpc("a+b.jpg") === "a b.jpg" && decodeRpc("a%2520b.jpg") === "a b.jpg" && decodeRpc("") === "");
    assert("6b. WM decode wiring: the substitution is first-attempt-only", wm.includes("const input = attempts === 1 ? decodedText.replace(/\\+/g, \"%20\") : decodedText;"));

    /* ── 7. serviceguard IDN homograph gate (extracted from canon) ──────── */
    const normalizeDomain = eval(`(() => { const win = { URL }; return (${extractFn(sg, "normalizeDomain").replace(/^function\s+\w+\s*\(/, "function(")}); })()`);
    assert("7a. serviceguard fixture (EXTRACTED from canon 7.4.3): the homograph no longer collides with the whitelisted domain, unicode IDN normalizes to punycode, plain domains survive", normalizeDomain("xn--a.example") !== normalizeDomain("a.example") && normalizeDomain("еxample.com").startsWith("xn--") && normalizeDomain("Example.COM/") === "example.com");
    assert("7b. serviceguard wiring: the xn-- strip is gone; the URL normalizer is in", !sg.includes(".replace(/xn--/g, '')") && sg.includes("new win.URL('http://' + s).hostname"));

    /* ── 8. LFA cached-credential domain gate ───────────────────────────── */
    const sameDomain = (lastURL, domainname) => {
        try {
            const lastHost = new URL(lastURL).hostname;
            return (lastHost === domainname) || (lastHost.endsWith("." + domainname));
        } catch { return false; }
    };
    assert("8a. LFA gate fixture: the lookalike is rejected; exact and subdomain pass; unparseable resets (the safe side)", sameDomain("https://notexample.com/", "example.com") === false && sameDomain("https://example.com/login", "example.com") === true && sameDomain("https://mail.example.com/", "example.com") === true && sameDomain("garbage", "example.com") === false);
    assert("8b. LFA gate wiring: the substring test is gone", !lfa.includes("lastURL.indexOf(domainname) === -1") && lfa.includes("lastHost.endsWith('.' + domainname)"));
    assert("8c. LFA counter wiring: both parseInt reads are NaN-proofed", lfa.includes("parseInt(await GM.getValue('counter', 0), 10) || 0") && !lfa.includes("parseInt(await GM.getValue('counter', 0));"));

    /* ── 9. Zai alternation repair + code-fence sentinel ────────────────── */
    const classifyAll = (roles) => {
        let lastKnown = null;
        for (let i = 0; i < roles.length; i++) {
            if (roles[i] === "unknown") {
                if (lastKnown === "user") roles[i] = "assistant";
                else if (lastKnown === "assistant") roles[i] = "user";
                if (roles[i] !== "unknown") lastKnown = roles[i];
            } else { lastKnown = roles[i]; }
        }
        return roles;
    };
    assert("9a. Zai alternation fixture: consecutive unknowns alternate (never all-assistant); pure-unknown runs stay honest", eq(classifyAll(["user", "unknown", "unknown", "user"]), ["user", "assistant", "user", "user"]) && eq(classifyAll(["unknown", "unknown"]), ["unknown", "unknown"]));
    assert("9b. Zai sentinel wiring: the per-run random literal-safe sentinel is in; the static ZXCODE sentinel is gone", zai.includes("Math.random().toString(36).slice(2, 10).toUpperCase()") && zai.includes("() => fence") && !zai.includes("'ZXCODE' + sentinels.length + 'ENDZX'"));

    /* ── 10. id-capture / playlist-shape / threshold regexes ────────────── */
    const capId = (href) => { const m = (href || "").match(/[?&]v=([0-9A-Za-z_-]+)/); return m ? m[1] : null; };
    const plId = eval(`(() => { const location = { origin: "https://youtube.com" }; return (${extractFn(ytpm, "parsePlaylistId").replace(/^function\s+\w+\s*\(/, "function(")}); })()`);
    const okThreshold = (v) => /^\d+(\.\d+)?[KMBkmb]?$/.test(v.replace(/[,\s]/g, ""));
    assert("10a. YRVR fixture: &rv= no longer wins; v= captures after other params", capId("/watch?rv=xxxxxxxxxxx") === null && capId("/watch?v=dQw4w9WgXcQ") === "dQw4w9WgXcQ" && capId("/watch?app=desktop&v=dQw4w9WgXcQ") === "dQw4w9WgXcQ");
    assert("10b. YRVR wiring: the unanchored capture shape is gone from CODE (changelog prose may name it)", !yrvr.includes("href.match(/v=[0-9A-Za-z_\\-]*/gm)") && yrvr.includes("href.match(/[?&]v=([0-9A-Za-z_-]+)/)"));
    assert("10c. YTPM fixture (EXTRACTED from canon 1.7.5): the ?list= arm still works; the bare fallback demands a real playlist shape (random words and base64 blobs rejected)", plId("https://youtube.com/playlist?list=PLabc123456789") === "PLabc123456789" && plId("PLabc123456789") === "PLabc123456789" && plId("extraordinarily") === null && plId("c29tZWJhc2U2NGJsb2I=") === null);
    assert("10d. YT Filter fixture: one decimal point only", okThreshold("1.5K") === true && okThreshold("1,234") === true && okThreshold("1.2.3") === false);
    assert("10e. YT Filter wiring: the [\\d.]+ class is gone from CODE (changelog prose may name it)", !ytf.includes("/^[\\d.]+[KMBkmb]?$/.") && ytf.includes("if (!/^\\d+(\\.\\d+)?[KMBkmb]?$/"));

    /* ── 11. Prompt Master GlobalFiles LRU bounds ───────────────────────── */
    const lru = (files, maxEntries = 64, maxBytes = 20 * 1024 * 1024) => {
        const bytesOf = (f) => (f && typeof f.data === "string" ? f.data.length : 0);
        let tot = files.reduce((a, f) => a + bytesOf(f), 0);
        while (files.length > 1 && (files.length > maxEntries || tot > maxBytes)) {
            tot -= bytesOf(files.shift());
        }
        return files;
    };
    assert("11a. GlobalFiles LRU fixture: byte and entry caps evict oldest-first; the newest file always survives", eq(lru([{ data: "a".repeat(15) }, { data: "b".repeat(10) }, { data: "c".repeat(5) }], 64, 12).map((f) => f.data), ["ccccc"]) && eq(lru([{ data: "a".repeat(15) }, { data: "b".repeat(10) }, { data: "c".repeat(2) }], 64, 12).map((f) => f.data), ["bbbbbbbbbb", "cc"]) && eq(lru([{ data: "x" }, { data: "y" }, { data: "z" }], 2, 1e9).map((f) => f.data), ["y", "z"]));
    assert("11b. GlobalFiles wiring: the cap loop + caught save + Array.isArray choke point are all live", pm.includes("while (t.length > 1 && (t.length > 64 || total > 20 * 1024 * 1024))") && pm.includes("return Array.isArray(v) ? v : [];") && pm.includes('Object.assign(globalConfig, defaults, parsed && typeof parsed === \'object\' ? parsed : {})' && true));
    assert("11c. LMPsi storage wiring: the canon's LAST unguarded boot-time JSON.parse of persisted storage is guarded", lmpsi.includes("try { parsed = JSON.parse(saved); }") && !lmpsi.includes("saved ? JSON.parse(saved) : {}"));
    assert("11d. Forums++ ThreadCache wiring: empty current pages are never cached; the store read is shape-guarded", forums.includes("if (currentPosts.length) {\n                cachedData[currentPageNumber] = currentPosts;") && forums.includes("return (cachedData && typeof cachedData === 'object' && !Array.isArray(cachedData)) ? cachedData : {};"));

    /* ── 12. toBool toggle readers (the state-inversion class) ──────────── */
    const toBool = (v) => v === true || v === 1 || v === "1" || v === "true";
    assert("12a. toBool fixture: every stored spelling resolves correctly (the string 'false' is NOT truthy here)", toBool(false) === false && toBool("false") === false && toBool(0) === false && toBool(true) === true && toBool("true") === true && toBool("1") === true && toBool(1) === true && toBool(undefined) === false);
    assert("12b. WCP wiring: all seven persisted-boolean reads route through toBool", wcp.includes("const toBool = (v) => v === true || v === 1 || v === '1' || v === 'true';") && wcp.includes("toBool(GM_getValue('adblock', true))") && wcp.includes("toBool(GM_getValue(HUD_HIDDEN_KEY, false))") && !wcp.includes("if (!GM_getValue('killnags', false)) return;"));
    assert("12c. MPC wiring: media_speed Number-coerces; adskip reads toBool at boot AND listener; media_pos is shape-guarded", mpc.includes("const v = Number(GM_getValue('media_speed', 1.0));") && mpc.includes("val === true || val === 1 || val === '1' || val === 'true'") && mpc.includes("typeof savedPos.left === 'string' && typeof savedPos.top === 'string'"));
    assert("12d. m3u8++ wiring: the shown toggle reads toBool; the orphan sweep is live", m3u8.includes('shown = (shown === true || shown === 1 || shown === "1" || shown === "true");') && m3u8.includes("sweepStaleTitleKeys"));
    assert("12e. ModelSearch wiring: ONE shared tolerant reader serves the constructor and the menu", mst.includes("const mstRemoteFontsOn = () => {") && mst.includes("const remoteFontsOn = mstRemoteFontsOn;") && !mst.includes("GM_getValue('mst_remote_fonts', false) === true"));

    /* ── 13. filename trailing-dot strips + NaN content-length ──────────── */
    const sanitize = (name) => String(name).replace(/[^\w.\-]+/g, "_").replace(/[. ]+$/, "").slice(0, 120);
    const sanitizePxd = (n) => String(n || "download").replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").replace(/[. ]+$/, "").trim() || "download";
    assert("13a. filename fixture: Windows-invalid trailing dots/spaces are stripped at both sanitizers", sanitize("name.") === "name" && sanitize("name..") === "name" && sanitize("a b.") === "a_b" && sanitizePxd("bad name.") === "bad name" && sanitizePxd("") === "download");
    assert("13b. sanitizer wiring: both scripts carry the [. ]+$ strip", ig.includes(".replace(/[. ]+$/, '')") && pxd.includes(".replace(/[. ]+$/, '')"));
    assert("13c. Pixeldrain content-length wiring: both parses are NaN-proofed", pxd.includes("|| size || '0', 10) || 0") && !pxd.includes("|| size || '0', 10);\n                    const start"));

    /* ── 14. THE OPERATOR'S ROUND-14 TRANSMISSION — the button contract, ──
     * restated per the round-14 directive: 'DUMP HTML' is the truthful
     * name back on the whole-grid artifact button (the r12 rename made it
     * read as a second media downloader — redundant next to the real one);
     * '⭳ SAVE ALL MEDIA' keeps the per-file media downloader (the suite's
     * original engine, v1.1.0). The grid wall is the DEFAULT; the feed
     * column is the opt-in addition. */
    assert("14a. IG++ button contract (ROUND-14 DIRECTIVE): DUMP HTML is back on the whole-grid artifact (ares-dump); ⭳ SAVE ALL MEDIA keeps the per-file downloader (sequential drain + 350ms stagger + 120s timeout + gmFetchBlob tier); NO second media-downloader label exists",
      ig.includes("mkBtn('ares-dump', 'DUMP HTML'") && ig.includes("mkBtn('ares-dlall', '⭳ SAVE ALL MEDIA'") &&
        !ig.includes("mkBtn('ares-dump', 'DOWNLOAD ALL'") && ig.includes("DOWNLOAD_STAGGER_MS: 350") &&
        ig.includes("DOWNLOAD_TIMEOUT_MS: 120000") && ig.includes("gmFetchBlob(url, CFG.DOWNLOAD_TIMEOUT_MS)") &&
        ig.includes("await new Promise(r => setTimeout(r, CFG.DOWNLOAD_STAGGER_MS));"));
    assert("14b. IG++ button contract: both buttons carry self-documenting titles (the r14 dump title names the HTML artifact)",
      ig.includes("title: 'Download every harvested media FILE to disk") && ig.includes("title: 'Dump the whole-grid HTML artifact"));
    assert("14c. IG++ unload adjudication (r13, standing): ZERO unload/beforeunload registrations in canon AND dist", (!ig.includes("addEventListener('unload'") && !ig.includes('addEventListener("unload"') && !ig.includes("addEventListener('beforeunload'") && !ig.includes('addEventListener("beforeunload"')) && (!igDist.includes("addEventListener('unload'") && !igDist.includes('addEventListener("unload"') && !igDist.includes("addEventListener('beforeunload'") && !igDist.includes('addEventListener("beforeunload"')));

    /* ── 15. THE ROUND-14 GRID WALL — structural tripwires (the live 23- ──
     * assertion battery is tools/ig-wall-browser-smoke.mjs; these pin the
     * canon+dist SOURCE shapes so a source-level revert goes red even
     * outside a browser run). */
    const GRID_WALL_STMT =
      "imgWall.style.cssText =\n            `padding:24px 24px 300px;display:grid;grid-template-columns:repeat(auto-fill,minmax(${CFG.GRID_MIN_PX}px,1fr));gap:14px;align-items:start;justify-items:center;`;";
    assert("15a. IG++ grid wall (round-14 core): the GRID is the DEFAULT buildUI layout in canon AND dist; the layout toggle exists; the r13 single-column DEFAULT statement is gone from CODE",
      ig.includes(GRID_WALL_STMT) && igDist.includes(GRID_WALL_STMT) &&
        ig.includes("function applyWallLayout(mode) {") && igDist.includes("function applyWallLayout(mode) {") &&
        !ig.includes("imgWall.style.cssText = 'padding:80px 0 300px;display:flex;flex-direction:column;align-items:center;';"));
    assert("15b. IG++ wall snapshot (the lineage contract): the snapshot key + threshold + the restore call + the scroll patch are live in canon AND dist",
      ig.includes("SNAPSHOT_KEY:        'igpp_wall_snapshot_v1',") && igDist.includes("igpp_wall_snapshot_v1") &&
        ig.includes("SNAPSHOT_MIN_SCROLL: 1000,") && ig.includes("const seededPks = WallSnapshot.restore();") &&
        ig.includes("WallSnapshot.patchScroll(gui.scrollTop)") && igDist.includes("WallSnapshot.patchScroll(gui.scrollTop)"));
    assert("15c. IG++ grid geometry: the aspect-ratio reservation, the media-settle budget pass, the layout-conditional mediaBox, and the factored sentinel are all wired (canon AND dist)",
      ig.includes("const ar = (asset.width > 0 && asset.height > 0)") && igDist.includes("const ar = (asset.width > 0 && asset.height > 0)") &&
        ig.includes("NeuralDOM.scheduleBudgetPass()") && igDist.includes("NeuralDOM.scheduleBudgetPass()") &&
        ig.includes("data-ares-mbox") && igDist.includes("data-ares-mbox") &&
        ig.includes("function armSentinel(cursor) {") && igDist.includes("function armSentinel(cursor) {"));
    assert("15d. RED CONTROL: the r12 ghost-view toggle (veilEngaged) is fully retired — the veil is permanently engaged",
      !/STATE\.veilEngaged/.test(ig) && !/STATE\.veilEngaged/.test(igDist));

    /* ── 16. Prompt Master 28.9.0 — the round-14 normalization fixes ───── */
    const pmCmpV = eval(`(${extractFn(pm, "compareVersions").replace(/^function\s+\w+\s*\(/, "function(")})`);
    assert("16a. PM compareVersions fixture (EXTRACTED from canon 28.9.0): a suffixed segment parses its numeric prefix — '1.2-beta' now reads NEWER than '1.1' (the pre-fix NaN||0 collapse read it older and the update was never offered); 'v'-prefixed and equal forms behave",
      pmCmpV("1.2-beta", "1.1") === 1 && pmCmpV("v2.0", "1.9") === 1 && pmCmpV("1.1", "1.1") === 0 && pmCmpV("1.1", "1.2") === -1);
    assert("16b. PM-F03 wiring: detectPlatform gates are hostname equality/dot-suffix (hostEq); the bare substring gates are gone from CODE",
      pm.includes('const hostEq = (h, d) => h === d || h.endsWith("." + d);') &&
        !pm.includes('return e.includes("chatgpt.com")') && !pm.includes('e.includes("deepseek.com")'));
    assert("16c. PM-F01 wiring: the insertPrompt contenteditable branch escapes every line — the raw `<p>${e}</p>` mint is gone",
      pm.includes("`<p>${escapeHtmlText(e)}</p>") && !pm.includes("(s += `<p>${e}</p>`)"));
    assert("16d. PM-F02 wiring: shared-prompt ingest stores RAW (normalization only) and every HTML sink escapes at render; the persisted-escape pre-fix shape is gone",
      pm.includes('t.title = String(t.title || "")') && pm.includes("${escapeHtmlText(t.title)}") &&
        pm.includes("${escapeHtmlText(t.author || \"N/A\")}") && !pm.includes("t.title = escapeHtmlText("));
    assert("16e. PM-F05 wiring: per-run random sentinel suffix on every minted placeholder key; both shape-matching regexes know the [a-z0-9]{6} run form",
      pm.includes("const RUN = Math.random().toString(36).slice(2, 8);") &&
        pm.includes("__(FILE|INPUT|SELECT)_[a-z0-9]{6}_\\d+__") &&
        pm.includes("(__QUOTE_[a-z0-9]{6}_\\d+__)") &&
        !pm.includes("`__QUOTE_${s++}__`"));
    assert("16f. PM-F05 fixture: a user-typed deterministic literal can never collide with a minted key under the new sweep shape",
      /__(FILE|INPUT|SELECT)_[a-z0-9]{6}_\d+__/g.test("__INPUT_ab12cd_2__") === true &&
        /__(FILE|INPUT|SELECT)_[a-z0-9]{6}_\d+__/g.test("__INPUT_2__") === false &&
        /__QUOTE_[a-z0-9]{6}_\d+__/.test("__QUOTE_2__") === false);
    assert("16g. PM-F06 wiring: the SCRIPT_VERSION sandbox fallback is stamped 28.9.0 (the two-releases-stale 28.8.1 is gone)",
      pm.includes(': "28.9.0";') && !pm.includes(': "28.8.1";'));

    /* ── 17. Images++ 4.1.0 — the round-14 normalization fixes ─────────── */
    const cspItem = (item) =>
        item.replace(/[.+?^$|()[\]{}]/g, "\\$&")
            .replace(/(\\\.)?(\*)(\\\.)?/g, (_, a, b, c) => `${a ? "\\.?" : ""}[^:/]*${c ? "\\." : ""}`)
            .replace(/[^/]$/, "$&/");
    const starDomain = new RegExp(cspItem("*.example.com"), "i");
    assert("17a. IMG-F10 fixture (the canon compiler shape, unanchored like the CspSniffer's join): the trailing-star boundary dot is MANDATORY — notexample.com and the apex are rejected, subdomains pass",
      starDomain.test("https://a.example.com/x") === true && starDomain.test("https://deep.a.example.com/x") === true &&
        starDomain.test("https://notexample.com/x") === false && starDomain.test("https://example.com/x") === false);
    /* the canon's c-arm literally contains a double backslash before the
     * dot — built by code point so no escaping layer can eat it */
    const canonDot = String.fromCharCode(92, 92) + ".";
    const cArmFixed = "[^:/]*${c ? '" + canonDot + "' : ''}";
    const cArmPre   = "${c ? '" + canonDot + "?' : ''}";
    assert("17b. IMG-F10 wiring + RED: the canon carries the mandatory-dot c-arm; the optional-dot pre-fix c-arm is gone",
      imgs.includes(cArmFixed) && !imgs.includes(cArmPre));
    assert("17c. IMG-F06 wiring: all rule.d domain gates are hostname equality/dot-suffix (both the batch walk and the settings highlight)",
      imgs.includes("!(hostname === rule.d || hostname.endsWith('.' + rule.d))") &&
        imgs.includes("(hostname === json.d || hostname.endsWith('.' + json.d))"));
    assert("17d. IMG-F01 wiring: a broken custom rule is DROPPED from the batch walk (only CSP/eval-blocked rules survive the catch)",
      imgs.includes("return RX_EVAL_BLOCKED.test(err) ? rule : false;"));
    assert("17e. IMG-F02 wiring: cleared number/range fields never persist NaN — dialog-unit defaults at collect AND the always-run numeric heal at Config read",
      imgs.includes("(el.type === 'number' || el.type === 'range') && !Number.isFinite(el.valueAsNumber)") &&
        imgs.includes("typeof DEFAULTS[key] === 'number' &&"));
    assert("17f. IMG-F03/F04/F05/F08 wiring: the never-null q-handler shapes are live (flickr optional chain, twimg atob guard, tumblr exec()[0] guard, the |$/i idiom)",
      imgs.includes("tryJSON(text)?.sizes?.size?.pop()?.source") &&
        imgs.includes("try { return atob(m[1]).match(/http.+/); } catch { return; }") &&
        imgs.includes('(/http[^"]+/.exec(node.style.cssText + node.getAttribute(\'data-img-src\')) || [])[0]') &&
        imgs.includes(".JPG|$/i)[0]") && imgs.includes(".(jpg|gif|png)|$/i)[0]"));
    assert("17g. IMG-F09/F11/F12 wiring: the empty-basename 'image' fallback, the trimmed hotkey read, and the case-fold symmetry are live",
      imgs.includes("name = 'image';") &&
        imgs.includes("String(cfg.collapseModeHotkey || '').trim()") &&
        imgs.includes("String(url).toLowerCase()") && imgs.includes(".slice(pinDomain * 2 + pinStart, -endSep || undefined)\n        .toLowerCase();"));

    return { problems, passed, total };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const r = await runNormSymmetrySmoke();
    console.log(`norm-symmetry-smoke: ${r.passed}/${r.total} assertions passed`);
    if (r.problems.length) {
        for (const p of r.problems) console.error(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("  ✓ normalization & storage symmetry battery verified (twin-divergence settlements, homograph gate, cross-site credential gate, toBool class, LRU bounds, the ROUND-14 button contract, the grid-wall tripwires, PM 28.9.0 + Images++ 4.1.0, and the property-arrow EXTRACTION upgrade — the r13 residual closed)");
}
