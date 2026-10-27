#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/connect-census.mjs — minimal-privilege @Connect census (suite v1.5.1)
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
 *               arguments to gmFetch( / GM_xmlhttpRequest / GM_download /
 *               GM.xmlHttpRequest dispatches (literal + template-prefix
 *               forms; the form family per 7c F01).
 *   derived   — hosts derived for VARIABLE-url dispatch sites by the
 *               round-8 2d-F01 derivation engine (see below), ledgered
 *               per file with exact-equality drift.
 *
 * Fail-closed on:
 *   (a) an observed OR DERIVED host not covered by the declared set
 *       (wildcard `*` covers everything; `D` covers D and its subdomains per
 *       manager semantics; `*.D` covers D's subdomains);
 *   (b) `@connect *` declared without a ledger entry carrying justification
 *       + expiry + burn-down note;
 *   (c) ledger drift — an entry whose file no longer declares the wildcard;
 *   (d) derivation-ledger drift — derived/partial/residual count mismatch
 *       (decrease = a derivation path broke; increase/migration = surface
 *       changed without a ledger roll), missing expiry, or a stale entry
 *       whose file vanished (the orphan sweep).
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripCommentsKeepStrings } from "./scan-kit.mjs";
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
        expiry: "v1.18.0",
    },
    {
        file: "canon/_merged/4ndr0tools - LinkMasterΨ.user.js",
        reason: "user-content-driven: LinkMaster captures arbitrary links/media from the page and fetches THOSE (thumbnails, direct media, resolver hops) — the endpoint set is the page's own content; 127.0.0.1 declared for the local companion; burn-down: none possible without breaking the capture-the-link feature itself",
        expiry: "v1.18.0",
    },
    {
        file: "canon/_promoted/4ndr0tools - Blob2URL.user.js",
        reason: "user-directed: the vault processes user-provided/pasted URLs into blobs — arbitrary hosts BY DESIGN (the feature is 'any URL → blob'); burn-down: none — the wildcard IS the feature surface",
        expiry: "v1.18.0",
    },
    {
        file: "canon/_promoted/4ndr0tools - Forum Link Xtractor.user.js",
        reason: "page-content-driven: link extraction fetches media/hotlink URLs discovered in forum posts — arbitrary hosts by construction (the post content defines the endpoint set); burn-down: none without breaking extraction",
        expiry: "v1.18.0",
    },
    {
        file: "canon/_promoted/4ndr0tools - Stream Interceptor.user.js",
        reason: "stream-discovery: the interceptor fetches media manifest/segment URLs observed in page traffic — 9 player CDN families declared, the wildcard covers unknown player CDNs; burn-down: declare hosts as they stabilize, the * is the observed-traffic long tail",
        expiry: "v1.18.0",
    },
    {
        file: "canon/_promoted/4ndr0tools - m3u8++.user.js",
        reason: "stream-playback: fetches the page's own m3u8 manifests and their segments — the manifest's segment hosts are page/server-defined at runtime, arbitrary by construction; burn-down: none — the endpoint set belongs to the stream, not the script",
        expiry: "v1.18.0",
    },
    {
        file: "canon/_sovereign/4ndr0tools - Bunkr++.user.js",
        reason: "download engine: bunkr file downloads resolve through page redirects to arbitrary CDN hosts at runtime; 127.0.0.1 declared for the local companion API; burn-down: declare observed CDN hosts as they stabilize",
        expiry: "v1.18.0",
    },
    {
        file: "canon/_sovereign/4ndr0tools - Gofile++.user.js",
        reason: "api + download: api.gofile.io and localhost declared; file downloads redirect to gofile CDN nodes assigned by the server per download — arbitrary at runtime; burn-down: none — the CDN node set is server-assigned per session",
        expiry: "v1.18.0",
    },
    {
        file: "canon/_sovereign/4ndr0tools - Pixeldrain++.user.js",
        reason: "mirror surface: 24 official/community mirrors declared; the wildcard covers user-configured custom download endpoints (the settings panel accepts arbitrary proxy/mirror URLs — operator-supplied, not script-authored); burn-down: configurable-host surface by design",
        expiry: "v1.18.0",
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
 * a live transport and ZERO declarations is flagged instead of skipped.
 *
 * WO-01 round 7 (7c F01/F02): the observation covers the FULL privileged-
 * transport form family — GM_download (an @connect-gated transport with NO
 * detection before: 13 invisible sites), aliased callees (const http =
 * GM_xmlhttpRequest → http(...) AND http.get/post/base(...) method calls —
 * Forums++'s primary resolver transport sat behind one), non-object first
 * args (GM_xmlhttpRequest(opts), GM_download(details)), and option bodies
 * of ANY size (the lazy {0,900} window dropped >900-char bodies and
 * truncated at nested braces). The scan runs on the strings-kept
 * comment-stripped view — comment mentions were counted as dispatches (5
 * sites) — with definition sites excluded (\b-boundary kills the _gmFetch
 * prefix match; function/method definition shapes are skipped). NOT
 * codeOnly: that view blanks string CONTENTS, which is exactly what this
 * census extracts.
 *
 * WO-01 round 8 (2d-F01): dispatchSiteRecords() produces the per-site
 * records (kind/line/callee/urlExpr) the derivation engine consumes
 * (27 literal + 122 variable at the r8 base, before class-B admissions
 * add the invisible sites; the standalone aggregator wrapper was retired
 * in round 9 — 9c F07, defined-never-called dead code). */
function dispatchSiteRecords(src) {
    const view = stripCommentsKeepStrings(src);
    const records = [];

    const argStart = (headIndex) => {
        let i = headIndex;
        while (i < view.length && /\s/.test(view[i])) i++;
        return i;
    };
    const objectBodyAt = (i) => {
        if (view[i] !== "{") return null;
        let depth = 0;
        let j = i;
        for (; j < view.length; j++) {
            if (view[j] === "{") depth++;
            else if (view[j] === "}") { depth--; if (depth === 0) break; }
        }
        /* (8a F05: the dead ternary both arms shared is gone — best-effort
         * slice either way, exactly what the r7 code did.) */
        return view.slice(i, j + 1);
    };
    /* X.base('GET', url, ...) — the ALIAS base-method's first arg is the
     * HTTP verb; the URL is the SECOND. Returns the second arg's index, or
     * -1 when the first arg is not a quoted verb (fall back to arg-1). */
    const argAfterFirst = (headIndex) => {
        const i = argStart(headIndex);
        if (view[i] === "'" || view[i] === '"' || view[i] === "`") {
            const q = view[i];
            let j = i + 1;
            while (j < view.length && view[j] !== q) j++;
            let k = j + 1;
            while (k < view.length && /\s/.test(view[k])) k++;
            if (view[k] === ",") return argStart(k + 1);
        }
        return -1;
    };
    const lineOf = (idx) => {
        let line = 1;
        for (let i = 0; i < idx && i < view.length; i++) if (view[i] === "\n") line++;
        return line;
    };
    /* the url-bearing expression text at a site: for object bodies the
     * `url:` property value; for first-arg sites the arg up to the
     * top-level terminator (≤120 chars — the disclosure bound). */
    const urlExprAt = (i, isObject) => {
        if (isObject) {
            const body = objectBodyAt(i);
            if (!body) return "";
            const um = body.match(/url\s*:\s*([\s\S]{0,160}?)[,}\n]/);
            return um ? um[1].trim().slice(0, 120) : "";
        }
        let depth = 0;
        let j = i;
        for (; j < view.length; j++) {
            const c = view[j];
            if (c === "(" || c === "[" || c === "{") depth++;
            else if (c === ")" || c === "]" || c === "}") { if (depth === 0) break; depth--; }
            else if (depth === 0 && (c === "," || c === ";")) break;
        }
        return view.slice(i, j).trim().slice(0, 120);
    };
    const classifyCall = (headIndex, isVerbFirst, callee) => {
        let at = headIndex;
        if (isVerbFirst) {
            const second = argAfterFirst(headIndex);
            if (second < 0) { records.push({ kind: "variable", line: lineOf(headIndex), callee, urlExpr: "" }); return; }
            at = second;
        }
        const i = argStart(at);
        if (view[i] === "{") {
            const body = objectBodyAt(i);
            if (body && /url\s*:\s*['"`]/.test(body)) {
                records.push({ kind: "literal", line: lineOf(i), callee, urlExpr: urlExprAt(i, true) });
            } else {
                records.push({ kind: "variable", line: lineOf(i), callee, urlExpr: urlExprAt(i, true) });
            }
        } else if (view[i] === "'" || view[i] === '"' || view[i] === "`") {
            records.push({ kind: "literal", line: lineOf(i), callee, urlExpr: urlExprAt(i, false) });
        } else {
            records.push({ kind: "variable", line: lineOf(i), callee, urlExpr: urlExprAt(i, false) });
        }
    };

    const callees = [/\bgmFetch\s*\(/g, /\bGM_download\s*\(/g, /\bGM(?:_xmlhttpRequest|\.\s*xmlHttpRequest)\s*\(/g];

    /* Alias pre-pass: const X = GM_xmlhttpRequest / GM_download /
     * GM.xmlHttpRequest — X(...) and X.get/post/put/head/base/fetch(...)
     * are privileged dispatches through the alias. */
    const aliasRe = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*GM(?:_xmlhttpRequest|_download|\.\s*xmlHttpRequest)\b/g;
    const aliases = new Set();
    let am;
    while ((am = aliasRe.exec(view)) !== null) aliases.add(am[1]);
    for (const alias of aliases) {
        const a = alias.replace(/\$/g, "\\$");
        callees.push(new RegExp(`\\b${a}\\s*\\(|\\b${a}\\s*\\.\\s*(?:get|post|put|head|base|fetch)\\s*\\(`, "g"));
    }

    for (const re of callees) {
        let m;
        re.lastIndex = 0;
        while ((m = re.exec(view)) !== null) {
            /* definition shapes are never dispatches: `function gmFetch(...)`,
             * method shorthand `gmFetch(args) {`, `async gmFetch(args) {`. */
            const before = view.slice(Math.max(0, m.index - 14), m.index);
            if (/(?:async\s+)?function\s*$/.test(before)) continue;
            const head = m.index + m[0].length;
            const parenClose = (() => {
                let depth = 0;
                let j = m.index + m[0].length - 1; /* at the '(' */
                for (; j < view.length; j++) {
                    if (view[j] === "(") depth++;
                    else if (view[j] === ")") { depth--; if (depth === 0) return j; }
                }
                return -1;
            })();
            if (parenClose > 0 && /^\s*\{/.test(view.slice(parenClose, parenClose + 4))) {
                /* `name(args) {` — method-shorthand definition (a call followed
                 * by a bare block is not a shape the corpus produces). */
                continue;
            }
            const callee = m[0].replace(/\s*\($/, "").trim();
            classifyCall(head, /\.base\s*\($/.test(m[0]), callee);
        }
    }
    return records;
}

/* ── WO-01 round 8 (2d-F01): the derivation engine ─────────────────────────
 * Three extraction classes, each with its own view discipline (8a F01: the
 * strings-kept view truncates at '//' inside regex bodies, so alternation
 * harvesting NEVER trusts a regex-looking span on that view alone —
 * under-claiming is a residual, over-claiming is a false positive):
 *   CLASS A (const-walk ≤2 hops) — identifier bindings to literal host
 *     roots / template heads / match()-alternation families / ||-fallback
 *     literal arms, walked through const-to-const chains with a hard cap.
 *   CLASS B (helper-1-level admission) — parameter-bound transport
 *     aliases: a helper whose transport-position param is bound to a
 *     TRANSPORT ROOT at EVERY call site (union across call sites, never a
 *     single one) gets its param-callee dispatch sites ADMITTED (8a F02:
 *     apiHttp/cfHttp/signHttp/v2Http + the resolver (url, http) family);
 *     helpers with >8 call sites classify HUB — residual by rule (8a F04).
 *   CLASS C (gate-alternation harvesting) — host families enumerated from
 *     regex alternations (match-site gates, resolver gates, return
 *     statements): literal-chunk groups enumerate, non-enumerable groups
 *     ([a-z]+ / .{1,20} / \d+ at host level) make the family residual —
 *     never guessed; ≤64-host cap fails closed.
 * Statuses: DERIVED (full host-set, no runtime arm), PARTIAL (host-set +
 * runtime arms), UNDERIVABLE (no host-set), HUB (admitted, residual by
 * rule). Derived hosts join the coveredBy adjudication. */
function hostFromLiteral(lit) {
    if (!lit) return null;
    let u = lit;
    const td = u.indexOf("${");
    if (td >= 0) u = u.slice(0, td);
    u = u.trim();
    const m = u.match(/^(?:https?:)?\/\/([^/\s'"`]+)/i) || u.match(/^([A-Za-z0-9.-]+(?::\d+)?)(?=\/|$)/);
    if (!m) return null;
    let h = m[1].toLowerCase();
    if (h.endsWith(":") || h === "") return null;
    return h;
}

/* CLASS C core — enumerate a host family from a regex body. Returns
 * { hosts } | { nonEnumerable: true } | null.
 *
 * Skeleton-first: the static text between groups, unescaped, carries the
 * registrable host when it has one (redgifs.com, imagebam.com/...,
 * ibb.co, pornhub.com, gofile.io) — path-level and subdomain-prefix groups
 * then change nothing (the separator alternation and the `([a-z](\d+)?)\.`
 * prefixes collapse under coveredBy's D-covers-subdomains semantics).
 * Enumeration fires only when the skeleton's host chunk is INCOMPLETE: a
 * trailing dot (coomer\. → the group supplies the TLDs) or a leading dot
 * (.cc → the group supplies the SLDs). Static `X?` optionals expand both
 * arms (jpe?g → jpg/jpeg, ≤8 variants); classes/\d poison their arm;
 * non-literal groups with no static host after them poison the family
 * (yandex [a-z]+, nitter .{1,20}); >64 hosts fail closed (the 90-member
 * bunkr family stays residual, disclosed). */
function enumerateGateFamily(regexText) {
    if (!regexText) return null;
    /* strip ONE leading slash and ONE trailing slash+flags — a greedy \/+
     * strip ate an escaped trailing slash and left a lone '\' in the body
     * (the give.xxx / rc-.example\ mangles on the first raw run) */
    let body = String(regexText);
    body = body.replace(/\/[a-z]*$/, "");
    body = body.replace(/^\//, "");
    const scheme = body.indexOf("://");
    let region = scheme >= 0 ? body.slice(scheme + 3) : body;
    /* tokenize into static/group segments up to the first top-level
     * unescaped '/' (path cut); escaped '\/' stays inside a segment */
    const segments = [];
    let cur = "";
    let depth = 0;
    let escaped = false;
    for (const c of region) {
        if (escaped) { cur += c; escaped = false; continue; }
        if (c === "\\") { cur += c; escaped = true; continue; }
        if (c === "(") {
            if (depth === 0) { if (cur) { segments.push({ type: "static", text: cur }); cur = ""; } depth = 1; continue; }
            depth++; cur += c; continue;
        }
        if (c === ")") {
            if (depth === 1) { segments.push({ type: "group", text: cur }); cur = ""; depth = 0; continue; }
            depth--; cur += c; continue;
        }
        if (c === "/" && depth === 0) break; /* path start — host region ends */
        cur += c;
    }
    if (cur) segments.push({ type: "static", text: cur });
    if (!segments.length) return null;

    const unescapeStatic = (t) => t.replace(/\\([.^$*+?()[\]{}|/])/g, "$1");
    /* static text → host variants (X? optionals expand; classes/\d poison) */
    const staticHostVariants = (t) => {
        /* 9c F03 (round 9): a LEADING host-level group has an empty
         * before-fragment ('' + (postimg|pixxxels) + '.cc') — the empty arm
         * ENUMERATES, it does not poison (the candidate host-regex below
         * still requires a dot, so a bare (su|st) with no after-fragment
         * stays non-host). The r8 shape returned null here, poisoning every
         * leading-group gate — the od-verified live postimg/pixxxels gate
         * claimed as a static win in the r8 message never derived. */
        if (t === "") return [""];
        /* \d/\w/\s classes: digit classes DROP (optional subdomain-ish
         * digits carry their own tokens — jpg1-7); word/space classes POISON
         * the arm; then unescape, then expand X? optionals */
        let s = t.replace(/\\d[+*?]*/g, "");
        if (/\\[ws]/.test(s)) return null;
        s = s.replace(/\\(.)/g, "$1");
        if (/[[\]{}+*]/.test(s)) return null;
        const optSpots = [];
        for (let i = 0; i < s.length; i++) {
            if (s[i] === "?" && i > 0 && /[a-z0-9]/i.test(s[i - 1])) optSpots.push(i - 1);
        }
        if (optSpots.length > 3) return null;
        const variants = new Set();
        const n = optSpots.length;
        for (let mask = 0; mask < (1 << n); mask++) {
            let out = "";
            for (let i = 0; i < s.length; i++) {
                const oi = optSpots.indexOf(i);
                if (oi >= 0) { if (mask & (1 << oi)) out += s[i]; continue; }
                if (s[i] === "?") continue;
                out += s[i];
            }
            if (out) variants.add(out);
        }
        return variants.size ? [...variants] : null;
    };
    const literalMembers = (grpText) => {
        const parts = grpText.split("|").map((s) => s.trim());
        if (parts.some((p) => !/^[a-z0-9-]{2,}$/i.test(p))) return null;
        return parts;
    };
    const isFullHostChunk = (t) => {
        const chunk = t.split("/")[0];
        if (/[?*+]/.test(chunk)) return false;
        return /^[a-z0-9-]+\.[a-z0-9-]+/i.test(chunk);
    };

    const hosts = new Set();
    let poisoned = false;
    const skeleton = segments.filter((s) => s.type === "static").map((s) => unescapeStatic(s.text)).join("");

    /* unified enumeration: a group is HOST-LEVEL iff the static text
     * before it does not itself carry a complete host (the statics around a
     * host-level group are FRAGMENTS: 'rc-' + (alpha|beta) + '.example',
     * '' + (postimg|pixxxels) + '.cc', 'coomer.' + (su|st) + ''). A group
     * beyond a complete host is path/subdomain level and changes nothing
     * (redgifs.com(\/|...)(ifr|...), imagebam.com\/(view|gallery)). */
    const completeHostIn = (t) => {
        const chunk = t.split("/")[0];
        return /^[a-z0-9-]+\.[a-z0-9-]+/i.test(chunk) && !/[?*+]/.test(chunk);
    };
    for (let si = 0; si < segments.length; si++) {
        if (segments[si].type !== "group") continue;
        let beforeFrag = "";
        for (let i = 0; i < si; i++) {
            if (segments[i].type === "static") beforeFrag += unescapeStatic(segments[i].text);
        }
        let afterText = "";
        for (let i = si + 1; i < segments.length; i++) {
            if (segments[i].type === "static") afterText += unescapeStatic(segments[i].text);
        }
        if (completeHostIn(beforeFrag)) continue; /* beyond-host: path/subdomain level */
        const members = literalMembers(segments[si].text);
        const afterHostPart = afterText.split("/")[0];
        if (!members) {
            if (completeHostIn(afterHostPart) || /^[a-z0-9-]+\.[a-z0-9-]*$/i.test(afterHostPart) && afterHostPart.includes(".")) {
                /* optional-subdomain prefix (([a-z](\d+)?)\.ibb.co) — collapse */
                continue;
            }
            poisoned = true; /* yandex [a-z]+ / nitter .{1,20} — no host after */
            continue;
        }
        const beforeVariants = staticHostVariants(beforeFrag.split("/")[0]);
        if (!beforeVariants) { poisoned = true; continue; }
        for (const bv of beforeVariants) {
            for (const m of members) {
                const cand = `${bv}${m}${afterHostPart}`.toLowerCase();
                if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(cand)) hosts.add(cand);
            }
        }
    }
    /* the skeleton fallback: no host-level group produced anything — the
     * statics themselves carry the host (redgifs.com, imagebam.com/...,
     * ibb.co/album/..., pornhub.com/view_video, gofile.io/d) */
    if (!hosts.size && !poisoned) {
        const skeletonHost = skeleton.split("/")[0];
        if (/^[a-z0-9-]+\.[a-z0-9-]+$/i.test(skeletonHost) && !/[?*+]/.test(skeletonHost)) {
            hosts.add(skeletonHost.toLowerCase());
        }
    }
    if (!hosts.size) {
        if (poisoned) return { nonEnumerable: true };
        return null;
    }
    if (hosts.size > 64) return { nonEnumerable: true }; /* runaway cap */
    return { hosts: [...hosts] };
}

/* Per-file derivation context: identifier bindings, transport roots,
 * helper signatures + call sites. */
function buildDerivationContext(src) {
    const view = stripCommentsKeepStrings(src);
    const rawLines = src.split("\n");
    const viewLines = view.split("\n");

    /* identifier bindings (structure on the view line; VALUES from the RAW
     * line at the same index — the two-view discipline: string contents and
     * regex bodies are the value surface, and the view can truncate them) */
    const bindings = new Map();
    for (let li = 0; li < viewLines.length && li < rawLines.length; li++) {
        const vline = viewLines[li];
        const rline = rawLines[li];
        for (const bm of vline.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*/g)) {
            const name = bm[1];
            const at = bm.index + bm[0].length;
            const after = vline.slice(at);
            const rawAfter = rline.slice(Math.min(rline.length, at));
            const rec = { name, line: li + 1, hosts: [], runtime: false, ident: null, isFunction: false, evidence: [] };

            /* shape 1: full literal / template literal value */
            const lit = rawAfter.match(/^(['"`])([\s\S]*?)\1/);
            if (lit) {
                const h = hostFromLiteral(lit[2]);
                if (h) rec.hosts.push(h);
                if (lit[2].includes("${")) rec.runtime = true;
                rec.evidence.push(`L${li + 1} const ${name} = ${lit[1]}${lit[2].slice(0, 44)}${lit[1]}`);
                bindings.set(name, rec);
                continue;
            }
            /* shape 2: identifier hop — const B = A */
            const idm = after.match(/^([A-Za-z_$][\w$]*)\s*(?=[,;)\n]|$)/);
            if (idm && !/^(?:await|typeof|new|window|document|location|URL|String|Number|JSON|Array|Object|Math|Date|console)$/.test(idm[1])) {
                rec.ident = idm[1];
                bindings.set(name, rec);
                continue;
            }
            /* shape 3: the coomer `host` shape — a template whose ${} arm is
             * String(url).match(/alternation/)?.[0] || 'literal-default' */
            const alt = rawAfter.match(/match\((\/[^/`]+\/[a-z]*)\)/i);
            const dflt = rawAfter.match(/\|\|\s*(['"`])(https?:\/\/[^'"`]+)\1/);
            if (alt || dflt) {
                if (alt) {
                    const fam = enumerateGateFamily(alt[1]);
                    if (fam?.hosts) {
                        rec.hosts.push(...fam.hosts);
                        rec.evidence.push(`L${li + 1} match(${alt[1].slice(0, 44)})`);
                    } else if (fam?.nonEnumerable) {
                        rec.runtime = true;
                    }
                }
                if (dflt) {
                    const h = hostFromLiteral(dflt[2]);
                    if (h) { rec.hosts.push(h); rec.evidence.push(`L${li + 1} default ${dflt[2].slice(0, 40)}`); }
                }
                if (rawAfter.includes("${")) rec.runtime = true;
                bindings.set(name, rec);
                continue;
            }
            /* shape 4: function-valued const — its RETURNS get harvested at
             * the site pass (the xfpdTurboOrigin sub-rule); marked here */
            if (/^\([^)]*\)\s*=>|^(?:async\s*)?(?:function|\()/.test(after)) {
                rec.isFunction = true;
                rec.runtime = true; /* provisional — return-harvest may refute */
                bindings.set(name, rec);
                continue;
            }
            /* everything else: a possible runtime arm */
            rec.runtime = true;
            bindings.set(name, rec);
        }
    }

    /* transport roots: bare GM aliases + the h.http object transport (the
     * resolver driver binds resolverCB(url, h.http, ...)) + kernel-wrapper
     * function names (fppGmFetch-family: script-local transports into the
     * kernel's gmFetch — 8a F02/F03) */
    const transportRoots = new Set();
    const aliasRe = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*GM(?:_xmlhttpRequest|_download|\.\s*xmlHttpRequest)\b/g;
    let am;
    while ((am = aliasRe.exec(view)) !== null) transportRoots.add(am[1]);
    transportRoots.add("h.http");
    for (const wm of view.matchAll(/\b(?:const|let|var|function)\s+([A-Za-z_$][\w$]*(?:[Gg]m[Ff]etch|KernelLess\w*))(?=\s*[=(])/g)) {
        transportRoots.add(wm[1]);
    }

    /* helper signatures + call sites */
    const helpers = [];
    const fnRe = /\b(?:const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(|function\s+([A-Za-z_$][\w$]*)\s*\()/g;
    let fm;
    while ((fm = fnRe.exec(view)) !== null) {
        const name = fm[1] || fm[2];
        if (!name) continue;
        const parenAt = fm.index + fm[0].length - 1;
        let depth = 0;
        let j = parenAt;
        for (; j < view.length; j++) {
            if (view[j] === "(") depth++;
            else if (view[j] === ")") { depth--; if (depth === 0) break; }
        }
        /* depth-aware param split (destructured defaults carry their own
         * commas and parens — a naive split produces garbage tokens); only
         * PLAIN identifier params participate in class B (destructured
         * transport positions are not a corpus shape; conservative). */
        const paramsText = view.slice(parenAt + 1, j);
        const params = [];
        {
            let pd = 0;
            let cur = "";
            let inStr = null;
            for (const ch of paramsText) {
                if (inStr) { if (ch === inStr) inStr = null; cur += ch; continue; }
                if (ch === "'" || ch === '"' || ch === "`") { inStr = ch; cur += ch; continue; }
                if (ch === "(" || ch === "[" || ch === "{") pd++;
                else if (ch === ")" || ch === "]" || ch === "}") pd--;
                if (ch === "," && pd === 0) { params.push(cur.trim()); cur = ""; }
                else cur += ch;
            }
            if (cur.trim()) params.push(cur.trim());
        }
        const simpleParams = params
            .map((p) => p.trim().split(/[=\s]/)[0])
            .filter((p) => /^[A-Za-z_$][\w$]*$/.test(p));
        let k = j + 1;
        /* skip ' => ' (arrow bodies) and whitespace to the body brace */
        while (k < view.length && /[\s=>]/.test(view[k])) k++;
        if (view[k] !== "{") continue; /* expression-bodied: no body span to scan */
        let bd = 0;
        let end = k;
        for (; end < view.length; end++) {
            if (view[end] === "{") bd++;
            else if (view[end] === "}") { bd--; if (bd === 0) break; }
        }
        helpers.push({ name, params: simpleParams, span: [fm.index, end + 1], callsites: [] });
    }
    for (const h of helpers) {
        const cre = new RegExp(`\\b${h.name.replace(/\$/g, "\\$")}\\s*\\(`, "g");
        let cm;
        while ((cm = cre.exec(view)) !== null) {
            if (cm.index >= h.span[0] && cm.index < h.span[1]) continue;
            const before = view.slice(Math.max(0, cm.index - 14), cm.index);
            if (/(?:async\s+)?function\s*$/.test(before)) continue;
            const parenAt = cm.index + cm[0].length - 1;
            let depth = 0;
            let j = parenAt;
            for (; j < view.length; j++) {
                if (view[j] === "(") depth++;
                else if (view[j] === ")") { depth--; if (depth === 0) break; }
            }
            const argsText = view.slice(parenAt + 1, j);
            const args = [];
            let ad = 0;
            let cur = "";
            let inStr = null;
            for (const ch of argsText) {
                if (inStr) { if (ch === inStr) inStr = null; cur += ch; continue; }
                if (ch === "'" || ch === '"' || ch === "`") { inStr = ch; cur += ch; continue; }
                if (ch === "(" || ch === "[" || ch === "{") ad++;
                else if (ch === ")" || ch === "]" || ch === "}") ad--;
                if (ch === "," && ad === 0) { args.push(cur.trim()); cur = ""; }
                else cur += ch;
            }
            if (cur.trim()) args.push(cur.trim());
            h.callsites.push({ index: cm.index, args });
        }
    }

    return { view, bindings, transportRoots, helpers };
}

/* CLASS A walker — resolve an identifier (≤2 hops) to a host-set. */
function walkIdent(name, ctx, hops) {
    const b = ctx.bindings.get(name);
    if (!b) return { hosts: [], runtime: true };
    if (b.ident && hops < 2) {
        const next = walkIdent(b.ident, ctx, hops + 1);
        return { hosts: next.hosts, runtime: next.runtime || b.runtime };
    }
    return { hosts: [...b.hosts], runtime: b.runtime };
}

/* Resolve an arbitrary url-expression to { hosts, runtime } — templates,
 * concatenations, identifier chains, and the function-return sub-rule. */
function resolveExprHosts(expr, ctx, depth = 0) {
    const out = { hosts: [], runtime: false };
    if (!expr || depth > 3) return { hosts: [], runtime: true };
    const trimmed = String(expr).trim().replace(/^await\s+/, "");

    /* bare identifier */
    const ident = trimmed.match(/^([A-Za-z_$][\w$]*)$/);
    if (ident) return walkIdent(ident[1], ctx, 0);

    /* a call: fn(...) — the function-return sub-rule (1 level) */
    const call = trimmed.match(/^([A-Za-z_$][\w$]*)\s*\(/);
    if (call) {
        const helper = ctx.helpers.find((h) => h.name === call[1]);
        if (helper) {
            const body = ctx.view.slice(helper.span[0], helper.span[1]);
            for (const rm of body.matchAll(/return\s+(['"`])([^'"`\n]+)\1/g)) {
                const h = hostFromLiteral(rm[2]);
                if (h) out.hosts.push(h);
                if (rm[2].includes("${")) out.runtime = true;
            }
            /* return of an origin/hostname member — runtime arm */
            if (/return\s+[A-Za-z_$][\w$]*\.(?:origin|hostname)/.test(body)) out.runtime = true;
            for (const gm of body.matchAll(/matchAll?\((\/[^/`]+\/[a-z]*)\)/gi)) {
                const fam = enumerateGateFamily(gm[1]);
                if (fam?.hosts) out.hosts.push(...fam.hosts);
            }
            for (const gm of body.matchAll(/if\s*\(\/[^/`]+\/[a-z]*\s*\.\s*test\(/g)) {
                const re = gm[0].match(/(\/[^/`]+\/[a-z]*)/)?.[1];
                if (re) {
                    const fam = enumerateGateFamily(re);
                    if (fam?.hosts) out.hosts.push(...fam.hosts);
                }
            }
            out.hosts = [...new Set(out.hosts)];
            if (!out.hosts.length && out.runtime) return { hosts: [], runtime: true };
            return out;
        }
        return { hosts: [], runtime: true };
    }

    /* String(...) wrapper */
    if (/^String\(/.test(trimmed)) {
        return resolveExprHosts(trimmed.replace(/^String\(/, "").replace(/\)$/, ""), ctx, depth + 1);
    }

    /* template literal or concatenation — resolve each arm */
    let arms = [];
    let templateMode = false;
    if (/^`/.test(trimmed)) {
        const inner = trimmed.slice(1, trimmed.lastIndexOf("`"));
        arms = inner.split(/(\$\{[^`]*?\})/g);
        templateMode = true; /* 9c F02 (round 9) */
    } else if (trimmed.includes("+")) {
        arms = trimmed.split("+");
    } else {
        return { hosts: [], runtime: true };
    }
    for (const arm of arms) {
        const a = arm.trim();
        if (!a) continue;
        if (/^\$\{/.test(a)) {
            const inner = a.slice(2, -1).trim();
            const sub = resolveExprHosts(inner, ctx, depth + 1);
            out.hosts.push(...sub.hosts);
            if (sub.runtime) out.runtime = true;
        } else if (templateMode || /^['"`]/.test(a)) {
            /* 9c F02 (round 9): a template's STATIC arms are literal text —
             * unquoted by construction (the backticks were stripped above),
             * so the r8 /^['"`]/ test routed them to the expression
             * resolver, which returned runtime for want of a quote —
             * leaving `https://glb-apisign.cdn.cr/sign?path=${…}` UNDERIVABLE
             * though its static head carries a declared host (the
             * fail-closed direction, but a false residual). Template arms
             * parse as literals now; concatenation arms keep the quote
             * discipline. */
            const inner = templateMode ? a : a.slice(1, -1);
            const h = hostFromLiteral(inner);
            if (h) out.hosts.push(h);
        } else {
            const sub = resolveExprHosts(a, ctx, depth + 1);
            out.hosts.push(...sub.hosts);
            if (sub.runtime) out.runtime = true;
        }
    }
    out.hosts = [...new Set(out.hosts)];
    return out;
}

/* The full per-file derivation truth. */
function deriveDispatchTruth(src) {
    const records = dispatchSiteRecords(src);
    const ctx = buildDerivationContext(src);
    const view = ctx.view;
    const rawLines = src.split("\n");

    /* CLASS B admission: helper params bound to transport roots at EVERY
     * call site (union semantics; >8 call sites ⇒ HUB). */
    for (const helper of ctx.helpers) {
        if (!helper.callsites.length) continue;
        const isHub = helper.callsites.length > 8;
        const body = view.slice(helper.span[0], helper.span[1]);
        for (let pi = 0; pi < helper.params.length; pi++) {
            const pname = helper.params[pi];
            if (!pname) continue;
            const dispatchRe = new RegExp(`\\b${pname.replace(/\$/g, "\\$")}\\s*(?:\\(|\\.\\s*(?:get|post|put|head|base|fetch)\\s*\\()`, "g");
            let dm;
            const found = [];
            while ((dm = dispatchRe.exec(body)) !== null) {
                const before = body.slice(Math.max(0, dm.index - 14), dm.index);
                if (/(?:async\s+)?function\s+$/.test(before)) continue;
                found.push(dm);
            }
            if (!found.length) continue;
            let allBound = true;
            let anyBound = false;
            for (const cs of helper.callsites) {
                const arg = cs.args[pi];
                if (arg === undefined) { allBound = false; continue; }
                const a = arg.trim();
                if (ctx.transportRoots.has(a) || /^[A-Za-z_$][\w$]*\.\s*http$/.test(a)) anyBound = true;
                else allBound = false;
            }
            if (!anyBound || !allBound) continue;
            for (const dm of found) {
                const at = helper.span[0] + dm.index + dm[0].length;
                let expr = "";
                if (/\.base\s*\($/.test(dm[0])) {
                    const i2 = skipWs(view, at);
                    if (view[i2] === "'" || view[i2] === '"' || view[i2] === "`") {
                        const q = view[i2];
                        let j2 = i2 + 1;
                        while (j2 < view.length && view[j2] !== q) j2++;
                        let k2 = skipWs(view, j2 + 1);
                        if (view[k2] === ",") expr = exprUpTo(view, skipWs(view, k2 + 1));
                    }
                } else {
                    expr = exprUpTo(view, skipWs(view, at));
                }
                records.push({
                    kind: "variable",
                    line: viewLineOf(view, helper.span[0] + dm.index),
                    callee: `${helper.name}:${pname}`,
                    urlExpr: expr,
                    hub: isHub,
                });
            }
        }
    }

    /* CLASS C R1 — resolver-gate association: the resolvers/hosts table's
     * `[ [gateRegexes], (url, http) => {…} ]` pairs. The fn's first-hop
     * dispatches on its URL PARAM carry the gate's host family (the gate
     * admits exactly those page URLs); the http param binds the transport
     * (the driver passes h.http — the principled replacement for the r7
     * name-collision counting, 8a F03). Gate regexes are read RAW (8a F01:
     * the strings-kept view truncates regex bodies at '//' — never trust a
     * regex span there); non-enumerable families leave the sites residual. */
    const resolverPairs = [];
    {
        /* the WHOLE pair pass runs on RAW source — the strings-kept view
         * truncates regex bodies at '//' (8a F01: a gate ending `\//` loses
         * its tail in the view and the pair silently stops matching — the
         * red-control RC2 run caught exactly this); raw line numbers are 1:1
         * with the view's, so record/span association stays line-based */
        const pairRe = /\[\s*\[((?:\s*\/(?:\\.|[^\/\\])+\/[a-z]*\s*,?\s*)+)\]\s*,\s*(?:async\s*)?\(\s*([A-Za-z_$][\w$]*)\s*,\s*([A-Za-z_$][\w$]*)\s*(?:,[^)]*)?\)\s*=>\s*\{/g;
        let pm;
        while ((pm = pairRe.exec(src)) !== null) {
            const gates = pm[1];
            const urlParam = pm[2];
            const httpParam = pm[3];
            const bodyAt = pm.index + pm[0].length - 1;
            let bd = 0;
            let end = bodyAt;
            for (; end < src.length; end++) {
                if (src[end] === "{") bd++;
                else if (src[end] === "}") { bd--; if (bd === 0) break; }
            }
            resolverPairs.push({ gates, urlParam, httpParam, span: [pm.index, end + 1] });
        }
    }
    for (const pair of resolverPairs) {
        /* gate families from the RAW gates text (per-gate regex literals —
         * escape-pair-aware: \/ inside gate bodies) */
        const families = [];
        let nonEnumerable = false;
        for (const gm of pair.gates.matchAll(/\/(?:\\.|[^/\\])+\/[a-z]*/g)) {
            /* 9c F01 (round 9): the r8 gate-body class excluded ']' — a gate
             * containing a regex character class ([a-z]+, .{1,20}) could
             * never match past the ']' to its own closing '/', so the gate
             * was silently DROPPED: in a mixed pair the surviving gates
             * derived an incomplete “gate IS the bound” host-set while the
             * class gate's non-enumerable VETO vanished (fail-open), and
             * stray separator spans matched as garbage ('/, /y'). The body
             * class now excludes only '/' and '\'— exactly pairRe's
             * element pattern above; the RC6 red control (a mixed
             * clean+class pair) proves the veto fires with the fix. Zero
             * live count change: the corpus's class-gate pairs are
             * single-gate (residual either way). */
            if (gm[0].startsWith("/:!")) continue; /* negative-lookahead gate */
            const fam = enumerateGateFamily(gm[0]);
            if (fam?.hosts) families.push(...fam.hosts);
            else nonEnumerable = true;
            /* 9c F01 completion (round 9, caught live by the RC6 red
             * control): a gate whose family parses to NULL (unparseable
             * statics — classes/quantifiers in the skeleton, e.g.
             * /rc-[a-z]+\.example/ or the live ibb \/\/ibb.co\/[a-zA-Z0-9-_.]+
             * direct gate) bounds an UNKNOWABLE admissible set — for the
             * pair the gate IS the bound, so null must VETO exactly like
             * the poisoned non-enumerable families, never silently drop
             * (the r8 `else if (fam?.nonEnumerable)` treated null as
             * "gate does not exist" — the fail-open half of F01 the
             * matcher fix alone did not close; the RC6 mixed-pair control
             * fired on exactly this before the completion). */
        }
        const hosts = [...new Set(families)];
        /* the fn's first-hop dispatch records: callee is the http param (the
         * `http.get(url)` family) and the url expr is the URL param alone */
        for (const r of records) {
            if (r.kind !== "variable") continue;
            if (r.line === undefined) continue;
            /* records carry VIEW line numbers; convert pair span to lines */
            const spanStart = viewLineOf(src, pair.span[0]);
            const spanEnd = viewLineOf(src, pair.span[1]);
            if (r.line < spanStart || r.line > spanEnd) continue;
            const isHttpCallee = r.callee === `${pair.httpParam}.get` || r.callee === `${pair.httpParam}.post` || r.callee === pair.httpParam || r.callee === `${pair.httpParam}.base`;
            if (!isHttpCallee) continue;
            const exprIsUrlParam = r.urlExpr === pair.urlParam || r.urlExpr === `String(${pair.urlParam})` || r.urlExpr === `${pair.urlParam}.split('?')[0]`;
            if (!exprIsUrlParam) continue;
            if (hosts.length && !nonEnumerable) {
                r.gateDerived = hosts;
                r.gateEvidence = `resolver gate ${pair.gates.trim().slice(0, 60)}`;
            }
        }
    }

    /* derive hosts per variable record */
    const derivedHosts = new Set();
    let derived = 0;
    let partial = 0;
    let residual = 0;
    for (const r of records) {
        if (r.kind === "literal") continue;
        if (r.hub) { residual++; r.status = "HUB"; continue; }
        if (r.gateDerived) {
            /* CLASS C R1: the gate enumerates the admissible first-hop host
             * family — DERIVED (no runtime arm: the gate IS the bound). */
            r.status = "DERIVED";
            r.hosts = r.gateDerived;
            r.evidence = r.gateEvidence;
            derived++;
            for (const h of r.gateDerived) derivedHosts.add(h);
            continue;
        }
        if (!r.urlExpr) { residual++; r.status = "UNDERIVABLE"; continue; }
        const res = resolveExprHosts(r.urlExpr, ctx, 0);
        if (res.hosts.length && !res.runtime) {
            r.status = "DERIVED";
            r.hosts = res.hosts;
            derived++;
            for (const h of res.hosts) derivedHosts.add(h);
        } else if (res.hosts.length && res.runtime) {
            r.status = "PARTIAL";
            r.hosts = res.hosts;
            partial++;
            for (const h of res.hosts) derivedHosts.add(h);
        } else {
            r.status = "UNDERIVABLE";
            residual++;
        }
    }
    return { records, derivedHosts: [...derivedHosts], derived, partial, residual };
}

function skipWs(view, i) {
    while (i < view.length && /\s/.test(view[i])) i++;
    return i;
}
function exprUpTo(view, i) {
    let depth = 0;
    let j = i;
    for (; j < view.length; j++) {
        const c = view[j];
        if (c === "(" || c === "[" || c === "{") depth++;
        else if (c === ")" || c === "]" || c === "}") { if (depth === 0) break; depth--; }
        else if (depth === 0 && (c === "," || c === ";")) break;
    }
    return view.slice(i, j).trim().slice(0, 120);
}
function viewLineOf(view, idx) {
    let line = 1;
    for (let i = 0; i < idx && i < view.length; i++) if (view[i] === "\n") line++;
    return line;
}

/* ── the derivation ledger (per-file, drift-checked) ─────────────────────── */
/* WO-01 round 8: exact-equality on derived/partial/residual — a decrease
 * means a derivation path broke (refuse); an increase means new derivable
 * surface (re-adjudicate); a migration between classes is not silent
 * either. Expiry + orphan sweep per the sink-census model. The counts are
 * the FIRST GREEN run's actuals at the r8 tree, adjudicated in the commit
 * that ships the engine (the 8a spec's RC3/RC4/RC5 red controls prove the
 * drift machinery bites in both directions). */
const DERIVATION_LEDGER = [
    {
        /* round-9 re-adjudication (the 9c F01/F02/F03 engine hardening —
         * increase drift is the sanctioned re-adjudication path): 14 DERIVED
         * (the resolver-gate first-hops: imagevenue, postimg.cc +
         * pixxxels.cc — the r8 leading-group poisoning finally fixed, the
         * jpg/jpeg no-digit family, pixhost, give.xxx, cyberfile, noodle,
         * spankbang, imagebam, imgvb/imgbox, the goonbox const-walk) +
         * 4 PARTIAL (filester v2 base fallback, the cyberdrop ladder
         * literal arms, the pornhub family, and glb-apisign.cdn.cr — the
         * signHttp template head, the r8 unquoted-template-arm gap) +
         * 36 residual (walker second-hops on runtime page URLs, the
         * yandex/nitter/cyberdrop-TLD non-enumerable gates, the >64-member
         * bunkr family, GM_download page/CDN arms). TRUTH NOTE (9c F06):
         * of the r8 message's claimed static-win quartet only imagebam.com
         * derived at the r8 tree; redgifs/ibb carry class-gated or
         * escaped-scheme gates (poison/null by rule) and pornhub's
         * optional-subdomain prefix collapses under coveredBy — the r8
         * prose overstated; the HUB rule has ZERO live instances corpus-wide
         * (the >8-call-site wrappers stay a disclosed horizon, not a live
         * residual class here). */
        file: "canon/_sovereign/4ndr0tools - Forums++.user.js",
        derived: 14,
        partial: 4,
        residual: 36,
        expiry: "v1.18.0",
    },
    {
        /* round-9 re-adjudication (the 9c F01/F02/F03 engine hardening):
         * 17 DERIVED (the link-harvestor's resolver-gate first-hops — now
         * including the postimg.cc/pixxxels.cc leading-group family the r8
         * poisoning missed) + 2 PARTIAL + 22 residual; the wildcard covers
         * the derived set (the ledger pins the drift, not the coverage). */
        file: "canon/_merged/4ndr0tools - LinkMasterΨ.user.js",
        derived: 17,
        partial: 2,
        residual: 22,
        expiry: "v1.18.0",
    },
    {
        /* first GREEN run: 8 variable sites = 0 derived + 1 PARTIAL + 7
         * residual (the RPC/asset arms are runtime JSON fields). TRUTH NOTE
         * (9c F06): the partial host is generativelanguage.googleapis.com
         * — the r8 prose mislabeled it literals.googleusercontent.com. */
        file: "canon/_sovereign/4ndr0tools - Prompt Master.user.js",
        derived: 0,
        partial: 1,
        residual: 7,
        expiry: "v1.18.0",
    },
];

/* ── observed hosts from privileged dispatch literals ────────────────────── */
function observedHosts(src) {
    const view = stripCommentsKeepStrings(src);
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
    const argStart = (headIndex) => {
        let i = headIndex;
        while (i < view.length && /\s/.test(view[i])) i++;
        return i;
    };
    const objectBodyAt = (i) => {
        if (view[i] !== "{") return null;
        let depth = 0;
        let j = i;
        for (; j < view.length; j++) {
            if (view[j] === "{") depth++;
            else if (view[j] === "}") { depth--; if (depth === 0) break; }
        }
        return view.slice(i, j + 1);
    };
    const pushUrlFromBody = (body) => {
        if (!body) return;
        const um = body.match(/url\s*:\s*(['"`])([^"`$]*)\1/);
        if (um) { pushLiteral(um[2]); return; }
        const um2 = body.match(/url\s*:\s*(['"`])([^"`]*)\1/);
        if (um2) pushLiteral(um2[2]);
    };
    const pushQuoteAt = (i) => {
        const q = view[i];
        let j = i + 1;
        while (j < view.length && view[j] !== q) j++;
        pushLiteral(view.slice(i + 1, j));
    };
    /* X.base('GET', url, ...) — skip the verb, extract the second arg. */
    const argAfterFirst = (headIndex) => {
        const i = argStart(headIndex);
        if (view[i] === "'" || view[i] === '"' || view[i] === "`") {
            const q = view[i];
            let j = i + 1;
            while (j < view.length && view[j] !== q) j++;
            let k = j + 1;
            while (k < view.length && /\s/.test(view[k])) k++;
            if (view[k] === ",") return argStart(k + 1);
        }
        return -1;
    };

    /* gmFetch( 'literal' | `tpl` — first-arg position */
    const gmRe = /\bgmFetch\s*\(/g;
    let m;
    while ((m = gmRe.exec(view)) !== null) {
        const i = argStart(m.index + m[0].length);
        if (view[i] === "'" || view[i] === '"' || view[i] === "`") pushQuoteAt(i);
    }

    /* GM_xhr / GM_download option objects and bare-literal forms; aliased
     * callees (const http = GM_xmlhttpRequest) — the alias's object calls,
     * bare literals, and .get/.post-style method calls (7c F01). */
    const aliasRe = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*GM(?:_xmlhttpRequest|_download|\.\s*xmlHttpRequest)\b/g;
    const aliases = new Set();
    let am;
    while ((am = aliasRe.exec(view)) !== null) aliases.add(am[1]);
    const calleeRes = [/\bGM_download\s*\(/g, /\bGM(?:_xmlhttpRequest|\.\s*xmlHttpRequest)\s*\(/g];
    for (const alias of aliases) {
        const a = alias.replace(/\$/g, "\\$");
        calleeRes.push(new RegExp(`\\b${a}\\s*\\(|\\b${a}\\s*\\.\\s*(?:get|post|put|head|base|fetch)\\s*\\(`, "g"));
    }
    for (const re of calleeRes) {
        re.lastIndex = 0;
        while ((m = re.exec(view)) !== null) {
            const before = view.slice(Math.max(0, m.index - 14), m.index);
            if (/(?:async\s+)?function\s*$/.test(before)) continue;
            let i = argStart(m.index + m[0].length);
            if (/\.base\s*\($/.test(m[0])) {
                const second = argAfterFirst(m.index + m[0].length);
                if (second >= 0) i = second;
                else continue; // non-literal verb: the url position is not statically reachable this way
            }
            if (view[i] === "{") pushUrlFromBody(objectBodyAt(i));
            else if (view[i] === "'" || view[i] === '"' || view[i] === "`") pushQuoteAt(i);
        }
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
    const DLEDGER = opts.noLedger ? [] : DERIVATION_LEDGER;
    const stats = {
        scripts: 0, connectDeclarations: 0, wildcardScripts: 0, observedHosts: 0, ledgered: 0,
        dispatchLiteral: 0, dispatchVariable: 0,
        dispatchAdmitted: 0, dispatchDerived: 0, dispatchPartial: 0, dispatchResidual: 0, derivedHostCount: 0,
    };
    const seenLedger = new Set();
    const seenDerivation = new Set();

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
        const truth = deriveDispatchTruth(src);
        const dispatches = {
            literal: truth.records.filter((r) => r.kind === "literal").length,
            variable: truth.records.filter((r) => r.kind === "variable").length,
        };
        stats.dispatchLiteral += dispatches.literal;
        stats.dispatchVariable += dispatches.variable;
        stats.dispatchAdmitted += dispatches.literal + dispatches.variable;
        stats.dispatchDerived += truth.derived;
        stats.dispatchPartial += truth.partial;
        stats.dispatchResidual += truth.residual;
        if (!declared.length) {
            /* WO-01 round 6 (2d F01): the old bare `continue` made the
             * observed-subset-declared gate vacuously green for zero-declaration
             * scripts with live transports (the LFA bugmenot.com case). */
            if (dispatches.literal > 0 || dispatches.variable > 0) {
                problems.push(`${rel}: live privileged transport (${dispatches.literal} literal + ${dispatches.variable} variable dispatch sites) with ZERO @connect declarations — declare the endpoints (GUP G7 minimal privilege)`);
            }
            /* 9c F08 (round 9): a zero-declaration file still OWNS its
             * derivation-ledger entry — mark it seen here so the orphan
             * sweep below reports the TRUE reason when it fires (the r8
             * sweep's "no variable dispatch sites anymore" line was the
             * wrong reason for exactly this class: the file kept its
             * variable sites and dropped its declarations instead; the
             * zero-declaration problem above already fires, so the net was
             * fail-closed — now the message is truthful too). Drift/expiry
             * for such files rides the declaration fix. */
            const d0 = DLEDGER.find((e) => e.file === rel);
            if (d0) seenDerivation.add(d0.file);
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

        /* (a′) DERIVED ⊆ declared — the 2d-F01 engine's adjudication arm
         * (round 8): a derived host-set member not covered fails with its
         * own problem line so the fix direction (declare vs narrow) is
         * unambiguous. */
        if (truth.derivedHosts.length) {
            stats.derivedHostCount += truth.derivedHosts.length;
            for (const h of truth.derivedHosts) {
                if (!coveredBy(h, declared)) {
                    problems.push(`${rel}: derived privileged endpoint \`${h}\` (2d-F01 derivation: const-walk/helper-admission/gate-alternation) not covered by any @connect declaration (GUP G7 minimal privilege: declare it or narrow the derivation)`);
                }
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

        /* (d) derivation ledger: exact-equality drift per file (round 8).
         * Files with variable sites but NO ledger entry are disclosed (the
         * engine's yield is opt-in per file — the ledger count is the
         * adjudicated baseline; un-ledgered files with derivations are a
         * re-adjudication prompt, not an automatic failure, matching the
         * wildcard ledger's negative-proof discipline: the FIRST run that
         * sees them must add entries or the drift stays loud). */
        if (dispatches.variable > 0) {
            const dentry = DLEDGER.find((e) => e.file === rel);
            if (dentry) {
                seenDerivation.add(dentry.file);
                if (truth.derived < dentry.derived || truth.partial < dentry.partial || truth.residual < dentry.residual) {
                    problems.push(`${rel}: derivation count drift (DECREASE: ledger ${dentry.derived}/${dentry.partial}/${dentry.residual}, found ${truth.derived}/${truth.partial}/${truth.residual}) — a derivation path broke; refuse and re-adjudicate`);
                } else if (truth.derived > dentry.derived || truth.partial > dentry.partial || truth.residual > dentry.residual) {
                    problems.push(`${rel}: derivation count drift (INCREASE: ledger ${dentry.derived}/${dentry.partial}/${dentry.residual}, found ${truth.derived}/${truth.partial}/${truth.residual}) — new derivable surface; re-adjudicate the ledger`);
                }
                /* 9c F04 (round 9): a ledger entry WITHOUT an expiry silently
                 * skipped the clock — the r8 message's "no-expiry hard fail"
                 * was never implemented (sink-census has it; this census
                 * did not). The gap is closed. */
                if (!dentry.expiry) {
                    problems.push(`derivation ledger entry has NO expiry: ${rel} — every baseline must carry one (the G9 re-adjudication clock)`);
                } else if (roundLt(CURRENT_ROUND, dentry.expiry) === false) {
                    problems.push(`expired derivation ledger entry: ${rel} — expiry ${dentry.expiry} has passed round ${CURRENT_ROUND} without re-adjudication`);
                }
            } else if (truth.derived > 0 || truth.partial > 0) {
                /* first-run adjudication prompt: the file derives hosts with
                 * no baseline on record — the engine's yield must be pinned */
                problems.push(`${rel}: ${truth.derived} derived + ${truth.partial} partial derivation sites with NO derivation-ledger entry — pin the baseline (derived/partial/residual + expiry) or narrow the derivation`);
            }
        }
    }

    /* (c) wildcard ledger drift + expiry */
    for (const e of LEDGER) {
        if (!seenLedger.has(ledgerKey(e))) {
            problems.push(`stale connect ledger entry: ${e.file} — the wildcard is no longer declared there (remove the entry)`);
        }
        if (e.expiry && roundLt(CURRENT_ROUND, e.expiry) === false) {
            problems.push(`expired connect ledger entry: ${e.file} — expiry ${e.expiry} has passed round ${CURRENT_ROUND} without re-adjudication`);
        }
    }

    /* (d′) derivation-ledger orphan sweep (round 8, the 7c F09 class): an
     * entry whose file vanished from canon silently stopped ticking before. */
    for (const e of DLEDGER) {
        if (!seenDerivation.has(e.file)) {
            const stillExists = targets.some(([rel]) => rel === e.file);
            if (!stillExists) {
                problems.push(`stale derivation ledger entry: ${e.file} — the canon file no longer exists (rename/delete outran the ledger)`);
            } else {
                problems.push(`stale derivation ledger entry: ${e.file} — the file has no variable dispatch sites anymore (the derivation surface is gone; remove the entry)`);
            }
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
    console.log(`connect census: ${r.scripts} declaring scripts, ${r.connectDeclarations} @connect tokens, ${r.observedHosts} distinct observed literal hosts, ${r.dispatchLiteral} literal + ${r.dispatchVariable} variable-url dispatch sites (2d-F01 derivation: ${r.dispatchDerived} derived + ${r.dispatchPartial} partial + ${r.dispatchResidual} residual of ${r.dispatchAdmitted} admitted sites; ${r.derivedHostCount} distinct derived hosts, drift-ledgered per file; the variable split disclosed per 2d F01; the form family per 7c F01: GM_download + aliases + opts-args + parameter-alias admission) — ${r.wildcardScripts} wildcard scripts (${r.ledgered} ledgered)${noLedger ? " [negative-proof mode: adjudication layer disabled]" : ""}`);
    if (r.problems.length) {
        for (const p of r.problems) console.log(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("  ✓ every observed and derived endpoint is declared; every wildcard is ledgered with justification + expiry; every live-transport script declares at least one endpoint; every derivation is ledgered with exact-equality drift");
}
