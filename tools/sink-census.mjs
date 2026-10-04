#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/sink-census.mjs — HTML-string sink + network-tap census (suite v1.4.3)
 * ----------------------------------------------------------------------------
 * Operator mandate (v1.4.3 round): "a census-style machine gate + createElement
 * migration is the best-in-class endgame" for the innerHTML write-site class —
 * a DIFFERENT sink class from the parseFromString class fixed in v1.4.2. The
 * same census also measures the fetch/XHR proxy class (NetHook adoption
 * evidence: which scripts still install their own page-network wraps).
 *
 * What it counts, per dist file, on a comment- AND string-aware code view
 * (string CONTENTS are blanked, ${} interpolation code is preserved — a prose
 * mention of innerHTML inside a string or comment is documentation, not a
 * sink; lesson-7 discipline):
 *
 *   Class A — HTML-string sinks (Trusted Types + injection surface):
 *     innerHTML          .innerHTML = / .innerHTML += / .outerHTML =
 *     insertAdjacentHTML insertAdjacentHTML(
 *     documentWrite      document.write( / document.writeln(
 *     eval               eval(
 *     newFunction        new Function(
 *     timerString        setTimeout('… / setInterval('…  (string-arg eval)
 *     parseFromString    DOMParser string parse NOT routed through a
 *                        sanctioned TT policy wrapper (tt.createHTML / the
 *                        per-script TTwrap-family helpers minted in v1.4.2)
 *
 *   Class B — page-network taps (co-install stacking surface):
 *     fetchWrap          .fetch = (property assignment on a window/realm
 *                        object — the per-script proxy installs)
 *     xhrWrap            .prototype.open = / .prototype.send =
 *     tapOpenSend        indirect .open = / .send = taps (local-var
 *                        prototype refs, window.open overrides, WebSocket
 *                        bridges, accordion state — each adjudicated by
 *                        reason; new indirect taps fail closed too)
 *
 * Adjudication ledger (below) — same idiom as canon-xref: every surviving
 * site is enumerated with a reason, and the gate fails closed on:
 *   - an UNADJUDICATED site (new sink appeared),
 *   - a COUNT DRIFT in either direction (regression or stale ledger),
 *   - a kernel/ class-A sink (kernel must stay zero-string-sink by
 *     construction, except core.js's policy-wrapped parse pair).
 *
 * The ledger is the burn-down plan: migrating a script to createElement /
 * NetHook removes its sites here; forgetting this file when adding a
 * site fails the suite. Zero entries = the endgame state.
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, "dist");
const KERNEL = path.join(ROOT, "kernel");

/* Code views of every kernel module — inlined copies (module builds + the
 * v1.4.3 canon CANON_KERNEL injection) are byte-stripped from a dist
 * file's code view before scanning: the kernel is zero-sink-verified
 * separately (below), so its own wrap/parse sites must not count as the
 * carrying script's sites. */
const KERNEL_VIEWS = fs.existsSync(KERNEL)
    ? fs.readdirSync(KERNEL).filter((f) => f.endsWith(".js"))
        .map((f) => codeOnly(fs.readFileSync(path.join(KERNEL, f), "utf8")).trim())
        .filter((v) => v.length > 0)
    : [];

function distCodeView(src) {
    let view = codeOnly(src);
    for (const kv of KERNEL_VIEWS) {
        if (view.includes(kv)) view = view.split(kv).join("");
    }
    return view;
}

/* ── String- and comment-aware code view ──────────────────────────────────
 * Blanks line/block comment bodies and string CONTENTS (delimiter kept),
 * preserves ${} interpolation code inside template literals (nested
 * templates + comments inside interpolations included — a stack-based
 * 3-state machine, not ad-hoc recursion; the recursive draft misdrifted
 * line numbers on Prompt Master's modal templates, caught in calibration).
 * Line numbers are preserved 1:1 with the source so census hits point at
 * real lines. Regex literals are consumed as units so their metacharacters
 * never leak into the code view. */
export function codeOnly(src) {
    const out = src.split("\n").map(() => "");
    let i = 0, line = 0;
    const n = src.length;
    const emit = (ch) => { out[line] += ch; };
    /* state stack: {type:"tpl"} while inside a template literal,
     * {type:"interp", depth} while inside its ${…} interpolation. Code
     * states (top-level or interpolation) share one scanner body. */
    const stack = [];
    while (i < n) {
        const c = src[i];
        if (c === "\n") { line++; i++; continue; }
        const st = stack.length ? stack[stack.length - 1].type : "code";

        if (st === "tpl") {
            if (c === "\\") { i += 2; continue; }          // escaped content
            if (c === "`") { stack.pop(); i++; continue; } // template closes
            if (c === "$" && src[i + 1] === "{") { stack.push({ type: "interp", depth: 0 }); i += 2; continue; }
            i++; continue;                                  // content: blanked
        }

        /* st === "code" or "interp": one shared code scanner */
        if (c === "/" && src[i + 1] === "/") {
            while (i < n && src[i] !== "\n") i++;
            continue;
        }
        if (c === "/" && src[i + 1] === "*") {
            const end = src.indexOf("*/", i + 2);
            const stop = end === -1 ? n : end + 2;
            while (i < stop) { if (src[i] === "\n") line++; i++; }
            continue;
        }
        if (c === '"' || c === "'") {
            emit(c); emit(c); i++;                       // "" / '' — contents blanked
            while (i < n) {
                if (src[i] === "\\") { i += 2; continue; }
                if (src[i] === c) { i++; break; }
                if (src[i] === "\n") break;              // unterminated: main gates report it
                i++;
            }
            continue;
        }
        if (c === "`") { stack.push({ type: "tpl" }); i++; continue; }

        /* regex literal — heuristically: only where a value may start */
        const prev = out[line].trim().slice(-1) || "";
        if (c === "/" && /[(,=:[!&|?{};+\-*%<>~^]/.test(prev || "(")) {
            emit("/"); i++;
            let inClass = false;
            while (i < n) {
                if (src[i] === "\\") { emit(src[i]); emit(src[i + 1] || ""); i += 2; continue; }
                if (src[i] === "[") inClass = true;
                else if (src[i] === "]") inClass = false;
                else if (src[i] === "/" && !inClass) { emit("/"); i++; break; }
                else if (src[i] === "\n") break;         // not a regex after all
                emit(src[i]);
                i++;
            }
            continue;
        }

        if (st === "interp") {
            const f = stack[stack.length - 1];
            if (c === "{") { f.depth++; emit(c); i++; continue; }
            if (c === "}") {
                if (f.depth === 0) { stack.pop(); i++; continue; } // ${…} closes
                f.depth--; emit(c); i++; continue;
            }
        }
        emit(c); i++;
    }
    return out.join("\n");
}

/* ── Sink classes ───────────────────────────────────────────────────────── */

/* Sanctioned Trusted-Types policy wrappers for parseFromString (v1.4.2
 * class fix): kernel tt.createHTML + the per-script TTwrap-family helpers.
 * A parseFromString( whose first argument starts with one of these routes
 * the string through a policy — the sanctioned parse path. */
const SANCTIONED_PARSE_ARG =
    /^\s*(?:tt\s*\.\s*createHTML|TTwrapXML|TTwrap|ttWrap|wrap|trustedHTML)\s*\(/;

const CLASSES = {
    innerHTML:          /\.(?:inner|outer)HTML\s*(?:\+)?=(?!=)/g,
    insertAdjacentHTML: /insertAdjacentHTML\s*\(/g,
    documentWrite:      /document\.write(?:ln)?\s*\(/g,
    eval:               /\beval\s*\(/g,
    newFunction:        /new\s+Function\s*\(/g,
    timerString:        /\bset(?:Timeout|Interval)\s*\(\s*['"`]/g,
    parseFromString:    /parseFromString\s*\(/g,
    fetchWrap:           /\.fetch\s*(?:\+)?=(?!=)/g,
    xhrWrap:             /\.prototype\.(?:open|send)\s*=(?!=)/g,
    tapOpenSend:         /(?<!prototype\.)\.(?:open|send)\s*=(?!=)/g,
};

/* ── Adjudication ledger ──────────────────────────────────────────────────
 * Every dist file's surviving sites, with reasons. Reasons follow a
 * taxonomy so the burn-down can be prioritized by class:
 *   own-ui-static      own chrome rendered via HTML string (host is non-TT
 *                      today; createElement burn-down scheduled)
 *   remote-render      interpolates remote/host content (injection surface
 *                      — highest priority; escapeHTML-backed where present)
 *   style-elem         <style> element text assignment
 *   page-policy        script mints a page 'default' TT policy at boot
 *   own-popup-doc      script-owned popup document (not host DOM)
 *   eval-bridge        TT-policy-wrapped eval bridge (page-$ interop)
 *   net-observer       network tap, pure observer (NetHook-eligible)
 *   net-defuser        network tap, modifies/blocks traffic (semantic
 *                      migration needs veto support — separate round)
 *   net-host-proxy     host-gated dev/proxy fetch path
 *   net-reader         fetch READ + bind for self-issued requests (no wrap)
 */
const ADJUDICATED = {
    /* — migrated to zero this round: FLX (8 sites), Confirmation Bypass
     * (6 sites), BypassPaywalls (2 sites), Blob2URL (3 sites — the vault
     * renders + entity-decode, live-proven dead on TT hosts by tt-smoke
     * and fixed in v7.2.0) — and the Blob2URL + LinkMasterΨ net layers
     * ride the shared NetHook (their per-script fetch/XHR wraps are gone) — */
    "4ndr0tools - Forum Link Xtractor.user.js": {},
    "4ndr0tools - Confirmation Bypass.user.js": {},
    "4ndr0tools - BypassPaywalls.user.js": {},
    "4ndr0tools - Blob2URL.user.js": {},

    "4ndr0tools - 4ndr0purge.user.js": {
        innerHTML: { count: 1, reason: "own-ui-static: purge verdict banner" },
    },
    "4ndr0tools - 4ndr0serviceguard Companion.user.js": {
        tapOpenSend: { count: 1, reason: "own-mock: phantom XHR object's send (script-owned decoy, not a page tap)" },
    },
    "4ndr0tools - Akasha Silence.user.js": {
        innerHTML: { count: 1, reason: "own-ui-static: killfeed banner" },
        fetchWrap: { count: 1, reason: "net-defuser: tracker nullifier (needs NetHook veto — separate round)" },
        xhrWrap: { count: 2, reason: "net-defuser: XHR mock-response nullifier (semantic migration — separate round)" },
    },
    "4ndr0tools - AlwaysNewWindow.user.js": {
        tapOpenSend: { count: 2, reason: "win-open-override: force-open/restore pair — the script's core feature, not an XHR tap" },
    },
    "4ndr0tools - Bunkr++.user.js": {
        innerHTML: { count: 23, reason: "own-ui-static: vault grid + settings rows (host bunkr.is is non-TT; createElement burn-down scheduled)" },
        fetchWrap: { count: 2, reason: "net-defuser: fake stats Response + album API path (host-gated bunkr.is)" },
        tapOpenSend: { count: 2, reason: "net-observer: indirect xo.open/xo.send deobfuscation capture (host-gated bunkr.is; NetHook-eligible next round)" },
    },
    "4ndr0tools - Filester++.user.js": {
        innerHTML: { count: 5, reason: "own-ui-static: file panel rows (host filester.io is non-TT; burn-down scheduled)" },
        fetchWrap: { count: 1, reason: "net-observer: media URL cache tap (host-gated filester.io; NetHook-eligible next round)" },
    },
    "4ndr0tools - Forums++.user.js": {
        innerHTML: { count: 5, reason: "own-ui-static: forum QoL rows (hosts non-TT; burn-down scheduled)" },
    },
    "4ndr0tools - Gofile++.user.js": {
        innerHTML: { count: 3, reason: "own-ui-static: container tree rows (host gofile.io non-TT; burn-down scheduled)" },
    },
    "4ndr0tools - GooglePhotosandDrive++.user.js": {
        innerHTML: { count: 2, reason: "own-ui-static: GPD toolbar buttons (Google hosts non-TT today; burn-down scheduled)" },
    },
    "4ndr0tools - Hailuo++.user.js": {
        innerHTML: { count: 4, reason: "own-ui-static: hailuo console rows (host non-TT; burn-down scheduled)" },
    },
    "4ndr0tools - Images++.user.js": {
        innerHTML: { count: 1, reason: "own-ui-static: images dialog row (image-tab contentType documents are non-TT; burn-down scheduled)" },
        eval: { count: 1, reason: "eval-bridge: page-$ interop through trustedScript policy (v1.4.2 adjudication)" },
        newFunction: { count: 1, reason: "eval-bridge: same page-$ bridge, new Function fallback (policy-gated)" },
        parseFromString: { count: 1, reason: "page-policy: $parseHtml routes through the page's own trustedHTML policy (v1.4.2 capture)" },
    },
    "4ndr0tools - Instagram++.user.js": {
        innerHTML: { count: 5, reason: "own-ui-static: IG++ downloader rows + GLYPH dock (instagram.com non-TT today; burn-down scheduled)" },
        parseFromString: { count: 1, reason: "page-policy: DASH manifest parse covered by the page 'default' createHTML policy minted at boot" },
        fetchWrap: { count: 1, reason: "net-observer: feed digest fetch tap (host-gated instagram.com; NetHook-eligible next round)" },
        xhrWrap: { count: 2, reason: "net-observer: feed digest XHR tap (host-gated instagram.com; NetHook-eligible next round)" },
    },
    "4ndr0tools - LinkMasterΨ.user.js": {
        innerHTML: { count: 27, reason: "own-ui-static: HUD panel + vault chrome (the dock boot-blocker was fixed in v6.2.4 — tt-smoke live proof; the HUD shell at showHudPanel is the remaining TT surface, instagram non-TT today) — TOP burn-down priority, next round" },
    },
    "4ndr0tools - Maximize_Any_Media.user.js": {
        innerHTML: { count: 1, reason: "own-ui-static: console status line (universal scope; burn-down scheduled)" },
    },
    "4ndr0tools - Media Player Controller.user.js": {
        innerHTML: { count: 3, reason: "own-ui-static: OSC control rows (video hosts non-TT; burn-down scheduled)" },
    },
    "4ndr0tools - ModelSearch.user.js": {
        innerHTML: { count: 2, reason: "own-ui-static: engine switcher rows (LLM hosts non-TT today; burn-down scheduled)" },
    },
    "4ndr0tools - Pixeldrain++.user.js": {
        innerHTML: { count: 9, reason: "own-ui-static: player chrome + download rows (host pixeldrain.com non-TT; burn-down scheduled)" },
        documentWrite: { count: 1, reason: "own-popup-doc: writes the script-owned no-referrer download popup document (not host DOM)" },
        tapOpenSend: { count: 3, reason: "accordion-state: panel s.open flags (not network taps)" },
    },
    "4ndr0tools - Prompt Master.user.js": {
        innerHTML: { count: 3, reason: "own-ui-static: PM console rows, one policy-wrapped (scriptPolicy.createHTML) (LLM hosts non-TT today; burn-down scheduled)" },
        fetchWrap: { count: 1, reason: "net-observer: flow-credit net observer, content-type gated (LLM hosts; NetHook-eligible next round)" },
        xhrWrap: { count: 2, reason: "net-observer: flow-credit XHR twin (LLM hosts; NetHook-eligible next round)" },
    },
    "4ndr0tools - Recon.user.js": {
        innerHTML: { count: 5, reason: "own-ui-static: recon report views (universal scope; burn-down scheduled)" },
        fetchWrap: { count: 1, reason: "net-defuser: recorder + block/mute + identity rules (semantic migration — separate round)" },
        tapOpenSend: { count: 3, reason: "net-taps: WebSocket bridge ws.send + indirect xhrProto.open/send recorder twin (separate round)" },
    },
    "4ndr0tools - Redgifs++.user.js": {
        innerHTML: { count: 1, reason: "own-ui-static: gallery badge (host non-TT; burn-down scheduled)" },
    },
    "4ndr0tools - Stream Interceptor.user.js": {
        fetchWrap: { count: 1, reason: "net-defuser: dual-realm capture + malformed-SVG veto (semantic migration — separate round)" },
        xhrWrap: { count: 2, reason: "net-defuser: XHR capture twin (separate round)" },
    },
    "4ndr0tools - Watermark++.user.js": {
        fetchWrap: { count: 1, reason: "net-observer: gemini image-capture fetch hook (host-gated gemini hosts; NetHook-eligible next round)" },
        tapOpenSend: { count: 4, reason: "net-observer: gemini RPC XHR wrap + restore pair written via method shorthand (host-gated gemini; NetHook-eligible next round)" },
    },
    "4ndr0tools - Website Control Panel.user.js": {
        innerHTML: { count: 1, reason: "own-ui-static: WCP panel footer note (universal scope; burn-down scheduled)" },
    },
    "4ndr0tools - YouTube Playlist Master.user.js": {
        innerHTML: { count: 1, reason: "own-ui-static: YTPM export dialog line (youtube.com non-TT today; burn-down scheduled)" },
    },
    "4ndr0tools - YouTubeEmbedRedirectButton.user.js": {
        innerHTML: { count: 1, reason: "own-ui-static: redirect button label (youtube hosts; burn-down scheduled)" },
    },
    "4ndr0tools - m3u8++.user.js": {
        innerHTML: { count: 6, reason: "own-ui-static: player selection rows (universal scope; burn-down scheduled)" },
        fetchWrap: { count: 1, reason: "net-host-proxy: thatwind/localhost dev-proxy fetch path (host-gated development tool)" },
        xhrWrap: { count: 1, reason: "net-observer: m3u8 content sniffer (universal; NetHook-eligible next round)" },
    },
};

/* ── Census core ────────────────────────────────────────────────────────── */

function scanCode(code) {
    const counts = {};
    for (const [cls, re0] of Object.entries(CLASSES)) {
        const re = new RegExp(re0.source, "g");
        let hits = 0;
        let m;
        while ((m = re.exec(code)) !== null) {
            if (cls === "parseFromString") {
                /* only unsanctioned parses count as sinks */
                const after = code.slice(m.index + m[0].length, m.index + m[0].length + 48);
                if (SANCTIONED_PARSE_ARG.test(after)) continue;
                /* kernel core.js form: parseFromString(tt.createHTML(…)) */
            }
            hits++;
        }
        if (hits > 0) counts[cls] = hits;
    }
    /* xhrWrap sites are also matched by the tapOpenSend pattern
     * (prototype-qualified .open/.send is a subset of every .open/.send)
     * — subtract the overlap so no site is double-counted. */
    if (counts.xhrWrap && counts.tapOpenSend) {
        counts.tapOpenSend -= counts.xhrWrap;
        if (counts.tapOpenSend <= 0) delete counts.tapOpenSend;
    }
    return counts;
}

export function runSinkCensus() {
    const problems = [];
    const registrations = [];   /* per-file per-class sites (report mode) */
    let totalSites = 0;
    let adjudicatedSites = 0;

    const files = fs.existsSync(DIST)
        ? fs.readdirSync(DIST).filter((f) => f.endsWith(".user.js")).sort()
        : [];

    for (const f of files) {
        const src = fs.readFileSync(path.join(DIST, f), "utf8");
        const code = distCodeView(src);
        const counts = scanCode(code);
        const ledger = ADJUDICATED[f] || {};
        const known = new Set(Object.keys(ledger));

        for (const [cls, count] of Object.entries(counts)) {
            totalSites += count;
            const adj = ledger[cls];
            if (!adj) {
                problems.push(`${f}: ${count} unadjudicated ${cls} site(s) — add the migration or the ledger entry`);
            } else if (adj.count !== count) {
                problems.push(`${f}: ${cls} count drift (ledger ${adj.count}, found ${count}) — regression or stale ledger`);
            } else {
                adjudicatedSites += count;
                registrations.push({ file: f, cls, count, reason: adj.reason });
            }
            known.delete(cls);
        }
        for (const staleCls of known) {
            problems.push(`${f}: stale ledger entry ${staleCls} (0 found) — remove it`);
        }
        /* files entirely absent from the ledger but carrying sites were
         * caught above; files absent and clean are fine. */
    }

    /* Kernel zero-string-sink invariant (defense-in-depth; validate.mjs
     * Gate D owns the authoritative form). Class A only; core.js's
     * policy-wrapped parse pair is the sanctioned exception. */
    if (fs.existsSync(KERNEL)) {
        for (const f of fs.readdirSync(KERNEL).filter((f) => f.endsWith(".js")).sort()) {
            const code = codeOnly(fs.readFileSync(path.join(KERNEL, f), "utf8"));
            const counts = scanCode(code);
            const allowed = f === "core.js" ? counts.parseFromString || 0 : 0;
            /* net.js is the SANCTIONED wrap owner: its class-B sites are
             * the singleton hub's own fetch/XHR wraps — exactly one set,
             * kernel-owned, every consumer rides it. Class A stays
             * zero-tolerance in every kernel file. */
            const isNetHub = f === "net.js";
            const bad = Object.entries(counts).filter(([cls, c]) => {
                if (cls === "parseFromString") return c > allowed;
                if (isNetHub && (cls === "fetchWrap" || cls === "xhrWrap" || cls === "tapOpenSend")) return false;
                return c > 0;
            });
            if (bad.length) {
                problems.push(`kernel/${f}: string sink(s) ${bad.map(([cls, c]) => `${cls}:${c}`).join(", ")} — kernel must be zero-string-sink by construction`);
            }
        }
    }

    return { problems, registrations, totalSites, adjudicatedSites,
        fileCount: files.length };
}

/* ── CLI ─────────────────────────────────────────────────────────────────── */

function main() {
    const report = process.argv.includes("--report");
    const { problems, registrations, totalSites, adjudicatedSites, fileCount } = runSinkCensus();
    if (report) {
        for (const r of registrations) {
            console.log(`${r.file}\n    ${r.cls} ×${r.count} — ${r.reason}`);
        }
    }
    console.log(`\nSINK CENSUS: ${totalSites} site(s) across ${fileCount} dist files — ${adjudicatedSites} adjudicated, ${totalSites - adjudicatedSites} unadjudicated`);
    if (problems.length) {
        console.error(`\n${problems.length} CENSUS FAILURE(S):`);
        for (const p of problems) console.error(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("SINK CENSUS: GREEN");
    process.exit(0);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
    main();
}
