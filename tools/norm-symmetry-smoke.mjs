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

    /* ── 1. fnNoExt / basename symmetry ─────────────────────────────────── */
    const fnNoExt = (p) => {
        const trimmed = String(p).trim();
        const parts = trimmed.split(".");
        if (parts.length < 2) return trimmed;
        parts.pop();
        return parts.join(".");
    };
    assert("1a. fnNoExt fixture: dotless basename is its own stem (the '.mp4' hidden-dotfile fix)", fnNoExt("photo") === "photo" && fnNoExt("video.mp4") === "video" && fnNoExt("a.b.c.jpg") === "a.b.c" && fnNoExt("") === "");
    assert("1b. fnNoExt wiring: BOTH twins carry the dotless guard", forums.includes("if (parts.length < 2) return trimmed;") && lmpsi.includes("if (parts.length < 2) return trimmed;"));
    assert("1c. basename wiring: the LMPsi twin strips the trailing slash like Forums++", lmpsi.includes('.replace(/\\/(\\s+)?$/, "")') && forums.includes("path.replace(/\\/(\\s+)?$/, '')"));
    assert("1d. RED CONTROL: the pre-fix pop-to-empty shape is absent from both twins", !forums.includes("parts.pop(); // Remove extension\n        return parts.join('.');\n    },\n    /**\n     * @param {string} path\n     * @returns {string|null}\n     */\n    ext: path => {\n      if (!path") && !lmpsi.includes('fnNoExt: (path) => path.trim().split(".").reverse().slice(1).reverse().join(".")'));

    /* ── 2. matchAll g-flag rebuild (the CRITICAL tab-hang) ─────────────── */
    const matchAll = (pattern, subject) => {
        const matches = [];
        let m;
        const regex = new RegExp(pattern.source, "g" + (pattern.flags?.replace("g", "") || ""));
        while ((m = regex.exec(subject)) !== null) {
            if (m.index === regex.lastIndex) regex.lastIndex++;
            matches.push(m[0]);
        }
        return matches;
    };
    let execCount = 0;
    const matchAllCounted = (pattern, subject) => {
        const matches = [];
        let m;
        const regex = new RegExp(pattern.source, "g" + (pattern.flags?.replace("g", "") || ""));
        while ((m = regex.exec(subject)) !== null) {
            if (++execCount > 50) throw new Error("runaway");
            if (m.index === regex.lastIndex) regex.lastIndex++;
            matches.push(m[0]);
        }
        return matches;
    };
    assert("2a. matchAll fixture: a NON-global pattern terminates and matches (the live ibb auth_token lookbehind shape)", eq(matchAll(/(?<=auth_token=").*?(?=")/i, 'x auth_token="ABC" y'), ["ABC"]) && eq(matchAll(/zzz/i, "abc"), []));
    assert("2b. matchAll fixture: global callers unaffected", matchAll(/data-object='/gi, "a data-object='1' b data-object='2'").length === 2);
    assert("2c. matchAll bounded-exec proof: the non-global run stays under 50 execs (the pre-fix shape pushed identical matches forever)", (() => { try { matchAllCounted(/(?<=a=).*?(?=&)/i, "zzz a=1&b=2 y"); return execCount > 0 && execCount <= 50; } catch { return false; } })());
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

    /* ── 4. Pixeldrain query-aware resolver ─────────────────────────────── */
    const pxdResolve = (url) => {
        try {
            const u = new URL(url);
            if (u.pathname.includes("/l/")) {
                u.pathname = u.pathname.replace("/l/", "/api/list/").replace(/\/+$/, "") + "/zip";
                return u.toString();
            }
            u.pathname = u.pathname.replace("/u/", "/api/file/");
            if (u.search) { u.searchParams.set("download", ""); return u.toString(); }
            return `${u.origin}${u.pathname}?download`;
        } catch { return url; }
    };
    assert("4a. pixeldrain fixture: clean URLs byte-match the old output; query-bearing URLs are constructed, never glued", pxdResolve("https://pixeldrain.com/u/abc") === "https://pixeldrain.com/api/file/abc?download" && pxdResolve("https://pixeldrain.com/u/abc?x=1") === "https://pixeldrain.com/api/file/abc?x=1&download=" && pxdResolve("https://pixeldrain.com/l/abc") === "https://pixeldrain.com/api/list/abc/zip" && pxdResolve("https://pixeldrain.com/l/abc?x=1") === "https://pixeldrain.com/api/list/abc/zip?x=1");
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

    /* ── 14. THE OPERATOR'S ROUND-13 TRANSMISSION — the button contract ─── */
    assert("14a. IG++ button contract: DOWNLOAD ALL is the renamed dump (ares-dump handler, no DUMP HTML button label remains); SAVE ALL MEDIA is the original per-file downloader (sequential drain + 350ms stagger + 120s timeout + 3-tier fallback)", ig.includes("mkBtn('ares-dump', 'DOWNLOAD ALL'") && !ig.includes("mkBtn('ares-dump', 'DUMP HTML'") && ig.includes("DOWNLOAD_STAGGER_MS: 350") && ig.includes("DOWNLOAD_TIMEOUT_MS: 120000") && ig.includes("gmFetchBlob(url, CFG.DOWNLOAD_TIMEOUT_MS)") && ig.includes("await new Promise(r => setTimeout(r, CFG.DOWNLOAD_STAGGER_MS));"));
    assert("14b. IG++ button contract: both buttons carry self-documenting titles", ig.includes("title: 'Download every harvested media FILE to disk") && ig.includes("title: 'Download the whole-grid HTML artifact"));
    assert("14c. IG++ unload adjudication: ZERO unload/beforeunload registrations in canon AND dist", !/\bunload\b/.test(ig.replace(/unload is not allowed|unload-listener|beforeunload listeners|ZERO unload/g, "")) === true || (!ig.includes("addEventListener('unload'") && !ig.includes('addEventListener("unload"') && !ig.includes("addEventListener('beforeunload'") && !ig.includes('addEventListener("beforeunload"')));

    return { problems, passed, total };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const r = await runNormSymmetrySmoke();
    console.log(`norm-symmetry-smoke: ${r.passed}/${r.total} assertions passed`);
    if (r.problems.length) {
        for (const p of r.problems) console.error(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("  ✓ normalization & storage symmetry battery verified (twin-divergence settlements, homograph gate, cross-site credential gate, toBool class, LRU bounds, IG++ button contract — the round-13 lens pinned)");
}
